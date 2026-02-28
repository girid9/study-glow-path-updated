import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Crown, Copy, Check, Bot, Play, ArrowLeft } from "lucide-react";
import { getSubject, getTopic } from "@/lib/quizData";
import {
  createRoom, joinRoom, setReady, startCountdown, startRace,
  addBots, subscribeToRoom, fetchRoomState, type Player, type Room,
} from "@/lib/multiplayer";
import MonsterTeacher from "@/components/MonsterTeacher";

const MultiplayerLobby = () => {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const [searchParams] = useSearchParams();
  const joinCode = searchParams.get("code");
  const navigate = useNavigate();

  const subject = getSubject(subjectId || "");
  const topic = getTopic(subjectId || "", topicId || "");

  const [screen, setScreen] = useState<"name" | "lobby">(joinCode ? "name" : "name");
  const [playerName, setPlayerName] = useState("");
  const [mode, setMode] = useState<"create" | "join">(joinCode ? "join" : "create");
  const [roomCode, setRoomCode] = useState(joinCode || "");
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!room) return;
    const state = await fetchRoomState(room.id);
    if (state.room) setRoom(state.room);
    setPlayers(state.players);

    if (state.room?.status === "countdown" && countdown === null) {
      setCountdown(3);
    }
    if (state.room?.status === "racing") {
      navigate(`/subject/${subjectId}/topic/${topicId}/race?roomId=${room.id}&playerId=${myPlayerId}`);
    }
  }, [room, countdown, navigate, subjectId, topicId, myPlayerId]);

  useEffect(() => {
    if (!room) return;
    const unsub = subscribeToRoom(room.id, refresh);
    return unsub;
  }, [room, refresh]);

  // Countdown timer
  useEffect(() => {
    if (countdown === null || !room) return;
    if (countdown <= 0) {
      startRace(room.id);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [countdown, room]);

  const handleCreate = async () => {
    if (!playerName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await createRoom(subjectId!, topicId!, playerName.trim());
      setRoom(result.room);
      setMyPlayerId(result.player.id);
      setPlayers([result.player]);
      setScreen("lobby");
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await joinRoom(roomCode.trim(), playerName.trim());
      setRoom(result.room);
      setMyPlayerId(result.player.id);
      setScreen("lobby");
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleAddBots = async () => {
    if (!room) return;
    await addBots(room.id);
    await refresh();
  };

  const handleStart = async () => {
    if (!room) return;
    await startCountdown(room.id);
    setCountdown(3);
  };

  const copyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const me = players.find((p) => p.id === myPlayerId);
  const isHost = me?.is_host ?? false;
  const allReady = players.length >= 2 && players.every((p) => p.is_ready);

  if (!subject || !topic) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Not found.</p></div>;
  }

  return (
    <div className="min-h-screen gradient-hero px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <button onClick={() => navigate(`/subject/${subjectId}/topic/${topicId}`)} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <AnimatePresence mode="wait">
          {screen === "name" ? (
            <motion.div key="name" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="mb-6">
                <MonsterTeacher message="Ready to race? Enter your name and let's find opponents! 🏁" />
              </div>

              <div className="glass-strong rounded-3xl p-6 space-y-5">
                <h1 className="font-display text-2xl font-bold text-center">Multiplayer Race</h1>
                <p className="text-center text-sm text-muted-foreground font-medium">{topic.name} • {topic.questionCount} questions</p>

                <div>
                  <label className="text-sm font-bold text-foreground">Your Name</label>
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name..."
                    maxLength={20}
                    className="mt-1 w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Mode tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode("create")}
                    className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${mode === "create" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    Create Room
                  </button>
                  <button
                    onClick={() => setMode("join")}
                    className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${mode === "join" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    Join Room
                  </button>
                </div>

                {mode === "join" && (
                  <div>
                    <label className="text-sm font-bold text-foreground">Room Code</label>
                    <input
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      maxLength={6}
                      className="mt-1 w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm font-bold tracking-widest text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none text-center uppercase"
                    />
                  </div>
                )}

                {error && <p className="text-xs font-bold text-destructive text-center">{error}</p>}

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={loading || !playerName.trim() || (mode === "join" && !roomCode.trim())}
                  onClick={mode === "create" ? handleCreate : handleJoin}
                  className="w-full rounded-2xl gradient-warm py-4 text-base font-bold text-secondary-foreground shadow-lg disabled:opacity-50"
                >
                  {loading ? "Loading..." : mode === "create" ? "Create Room" : "Join Room"}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="lobby" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
              {/* Countdown overlay */}
              <AnimatePresence>
                {countdown !== null && countdown > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                  >
                    <motion.span
                      key={countdown}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="font-display text-8xl font-bold text-gradient-primary"
                    >
                      {countdown}
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="glass-strong rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="font-display text-xl font-bold">Lobby</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">{topic.name}</span>
                  </div>
                </div>

                {/* Room code */}
                <div className="flex items-center justify-center gap-3 rounded-2xl bg-muted/50 p-4 mb-5">
                  <span className="font-display text-2xl font-bold tracking-[0.3em] text-foreground">{room?.code}</span>
                  <button onClick={copyCode} className="rounded-xl bg-card p-2 hover:bg-accent transition-colors">
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                {/* Players */}
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Players ({players.length}/{room?.max_players || 4})</span>
                  </div>
                  {players.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between rounded-xl border-2 border-border bg-card p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: p.avatar_color }}
                        >
                          {p.display_name[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-foreground">{p.display_name}</span>
                          <div className="flex items-center gap-1.5">
                            {p.is_host && <Crown className="h-3 w-3 text-secondary" />}
                            {p.is_bot && <Bot className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-bold ${p.is_ready ? "text-success" : "text-muted-foreground"}`}>
                        {p.is_ready ? "Ready ✓" : "Waiting..."}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {!me?.is_ready && !isHost && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => myPlayerId && setReady(myPlayerId, true)}
                      className="flex-1 rounded-2xl bg-success py-3 text-sm font-bold text-success-foreground"
                    >
                      Ready Up
                    </motion.button>
                  )}

                  {isHost && (
                    <>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleAddBots}
                        disabled={players.length >= (room?.max_players || 4)}
                        className="rounded-2xl border-2 border-border bg-card px-4 py-3 text-sm font-bold text-foreground disabled:opacity-50"
                      >
                        <Bot className="inline h-4 w-4 mr-1" /> Add Bots
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleStart}
                        disabled={!allReady}
                        className="flex-1 rounded-2xl gradient-warm py-3 text-sm font-bold text-secondary-foreground shadow-lg disabled:opacity-50"
                      >
                        <Play className="inline h-4 w-4 mr-1" /> Start Race
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MultiplayerLobby;
