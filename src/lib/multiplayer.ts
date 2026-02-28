import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Room = Tables<"rooms">;
export type Player = Tables<"players">;
export type PlayerAnswer = Tables<"player_answers">;

const AVATAR_COLORS = ["#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getSessionId(): string {
  let id = sessionStorage.getItem("mp_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("mp_session_id", id);
  }
  return id;
}

export async function createRoom(subjectId: string, topicId: string, hostName: string) {
  const code = generateRoomCode();
  const sessionId = getSessionId();

  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .insert({ code, subject_id: subjectId, topic_id: topicId })
    .select()
    .single();

  if (roomErr || !room) throw new Error(roomErr?.message || "Failed to create room");

  const { data: player, error: playerErr } = await supabase
    .from("players")
    .insert({
      room_id: room.id,
      display_name: hostName,
      is_host: true,
      is_ready: true,
      session_id: sessionId,
      avatar_color: AVATAR_COLORS[0],
    })
    .select()
    .single();

  if (playerErr || !player) throw new Error(playerErr?.message || "Failed to create player");

  return { room, player };
}

export async function joinRoom(code: string, playerName: string) {
  const sessionId = getSessionId();

  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .select("*, players(*)")
    .eq("code", code.toUpperCase())
    .single();

  if (roomErr || !room) throw new Error("Room not found");
  if (room.status !== "waiting") throw new Error("Game already in progress");

  const players = (room as any).players as Player[];
  if (players.length >= room.max_players) throw new Error("Room is full");

  // Check if already in room
  const existing = players.find((p) => p.session_id === sessionId);
  if (existing) return { room, player: existing };

  const colorIdx = players.length % AVATAR_COLORS.length;

  const { data: player, error: playerErr } = await supabase
    .from("players")
    .insert({
      room_id: room.id,
      display_name: playerName,
      session_id: sessionId,
      avatar_color: AVATAR_COLORS[colorIdx],
    })
    .select()
    .single();

  if (playerErr || !player) throw new Error(playerErr?.message || "Failed to join");

  return { room, player };
}

export async function setReady(playerId: string, ready: boolean) {
  await supabase.from("players").update({ is_ready: ready }).eq("id", playerId);
}

export async function startCountdown(roomId: string) {
  await supabase.from("rooms").update({ status: "countdown" }).eq("id", roomId);
}

export async function startRace(roomId: string) {
  await supabase.from("rooms").update({ status: "racing", started_at: new Date().toISOString() }).eq("id", roomId);
}

export async function finishRoom(roomId: string) {
  await supabase.from("rooms").update({ status: "finished", finished_at: new Date().toISOString() }).eq("id", roomId);
}

export async function submitAnswer(
  roomId: string,
  playerId: string,
  questionIndex: number,
  chosenAnswer: string,
  isCorrect: boolean,
  newScore: number,
  nextQuestion: number
) {
  await supabase.from("player_answers").insert({
    room_id: roomId,
    player_id: playerId,
    question_index: questionIndex,
    chosen_answer: chosenAnswer,
    is_correct: isCorrect,
  });

  await supabase
    .from("players")
    .update({ score: newScore, current_question: nextQuestion })
    .eq("id", playerId);
}

export async function addBots(roomId: string, count: number = 3) {
  const bots = [
    { name: "BotKing 🤖", color: "#f59e0b" },
    { name: "LinuxNinja 🥷", color: "#ef4444" },
    { name: "CmdMaster 💻", color: "#8b5cf6" },
  ];

  const inserts: TablesInsert<"players">[] = bots.slice(0, count).map((b) => ({
    room_id: roomId,
    display_name: b.name,
    avatar_color: b.color,
    is_bot: true,
    is_ready: true,
  }));

  await supabase.from("players").insert(inserts);
}

export function subscribeToRoom(roomId: string, onUpdate: () => void) {
  const channel = supabase
    .channel(`room-${roomId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, onUpdate)
    .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` }, onUpdate)
    .on("postgres_changes", { event: "*", schema: "public", table: "player_answers", filter: `room_id=eq.${roomId}` }, onUpdate)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function fetchRoomState(roomId: string) {
  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  const { data: players } = await supabase.from("players").select("*").eq("room_id", roomId).order("score", { ascending: false });
  return { room, players: players || [] };
}
