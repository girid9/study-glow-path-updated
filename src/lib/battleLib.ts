import { supabase } from "@/integrations/supabase/client";
import { subjects, type Question } from "./quizData";

// ---- Auth helpers ----
export async function ensureAnonymousUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user!;
}

// ---- Code generation ----
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I,O,0,1
export function generateRoomCode(len = 5): string {
  let code = "";
  for (let i = 0; i < len; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
  return code;
}

// ---- Question helpers ----
export interface BattleQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  topicId: string;
}

export function getAllQuestions(): BattleQuestion[] {
  const qs: BattleQuestion[] = [];
  for (const subj of subjects) {
    for (const topic of subj.topics) {
      for (let i = 0; i < topic.questions.length; i++) {
        const q = topic.questions[i];
        const ansMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
        qs.push({
          id: `${subj.id}__${topic.id}__${i}`,
          text: q.question,
          options: [q.option_a, q.option_b, q.option_c, q.option_d],
          correctIndex: ansMap[q.answer] ?? 0,
          topicId: `${subj.id}/${topic.id}`,
        });
      }
    }
  }
  return qs;
}

export function getQuestionsByTopic(topicFilter: string): BattleQuestion[] {
  return getAllQuestions().filter((q) => q.topicId === topicFilter);
}

export function getTopicList(): { value: string; label: string }[] {
  const list: { value: string; label: string }[] = [];
  for (const subj of subjects) {
    for (const topic of subj.topics) {
      list.push({
        value: `${subj.id}/${topic.id}`,
        label: `${subj.name} › ${topic.name}`,
      });
    }
  }
  return list;
}

// ---- Shuffle with seed ----
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  const rand = seededRandom(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getOptionMapping(
  roomSeed: number,
  userId: string,
  questionId: string
): number[] {
  // deterministic hash for per-user per-question shuffle
  let hash = roomSeed;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) % 2147483647;
  for (let i = 0; i < questionId.length; i++) hash = (hash * 31 + questionId.charCodeAt(i)) % 2147483647;
  return shuffleWithSeed([0, 1, 2, 3], hash);
}

// ---- Room CRUD ----
export async function createRoom(displayName: string, topicId: string) {
  const user = await ensureAnonymousUser();
  const code = generateRoomCode();
  const seed = Math.floor(Math.random() * 2147483647);

  const { data: room, error } = await supabase
    .from("battle_rooms")
    .insert({
      code,
      host_user_id: user.id,
      topic_id: topicId,
      random_seed: seed,
    })
    .select()
    .single();
  if (error) throw error;

  await supabase.from("battle_players").insert({
    room_id: room.id,
    user_id: user.id,
    display_name: displayName,
    is_host: true,
  });

  return { room, user };
}

export async function joinRoom(code: string, displayName: string) {
  const user = await ensureAnonymousUser();

  const { data: room, error: roomErr } = await supabase
    .from("battle_rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("status", "lobby")
    .single();
  if (roomErr || !room) throw new Error("Room not found or already started");

  const { count } = await supabase
    .from("battle_players")
    .select("*", { count: "exact", head: true })
    .eq("room_id", room.id);
  if ((count ?? 0) >= 2) throw new Error("Room is full");

  await supabase.from("battle_players").insert({
    room_id: room.id,
    user_id: user.id,
    display_name: displayName,
    is_host: false,
  });

  return { room, user };
}

export async function startBattle(roomId: string, topicId: string, questionCount: number) {
  const questions = getQuestionsByTopic(topicId);
  if (questions.length === 0) throw new Error("No questions for this topic");

  const { data: room } = await supabase.from("battle_rooms").select("random_seed").eq("id", roomId).single();
  const seed = room?.random_seed ?? 42;
  const shuffled = shuffleWithSeed(questions, seed).slice(0, questionCount);
  const order = shuffled.map((q) => ({ id: q.id, correctIndex: q.correctIndex }));

  const { error } = await supabase
    .from("battle_rooms")
    .update({
      status: "running",
      question_order: order,
      current_index: 0,
      question_started_at: new Date().toISOString(),
    })
    .eq("id", roomId);
  if (error) throw error;
}

export async function submitAnswer(
  roomId: string,
  questionId: string,
  selectedIndex: number,
  correctIndex: number
) {
  const { data, error } = await supabase.functions.invoke("battle-engine", {
    body: {
      action: "submit_answer",
      room_id: roomId,
      question_id: questionId,
      selected_index: selectedIndex,
      correct_index: correctIndex,
    },
  });
  if (error) throw error;
  return data;
}

export async function ensureTimeout(roomId: string) {
  await supabase.functions.invoke("battle-engine", {
    body: { action: "ensure_timeout", room_id: roomId },
  });
}
