import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useBattleAuth } from "@/hooks/useBattleAuth";
import {
  submitAnswer,
  ensureTimeout,
  getAllQuestions,
  getOptionMapping,
  type BattleQuestion,
} from "@/lib/battleLib";
import { toast } from "sonner";

const LABELS = ["A", "B", "C", "D"];

const BattlePlay = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useBattleAuth();
  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const prevIndex = useRef(-1);
  const allQuestions = useRef(getAllQuestions());
  const timeoutInterval = useRef<ReturnType<typeof setInterval>>();

  // Fetch room
  const fetchRoom = useCallback(async () => {
    if (!code) return;
    const { data } = await supabase
      .from("battle_rooms")
      .select("*")
      .eq("code", code)
      .single();
    if (data) {
      setRoom(data);
      if (data.status === "ended") {
        navigate(`/battle/result/${code}`, { replace: true });
      }
    }
  }, [code, navigate]);

  const fetchPlayers = useCallback(async (roomId: string) => {
    const { data } = await supabase
      .from("battle_players")
      .select("*")
      .eq("room_id", roomId)
      .order("score", { ascending: false });
    if (data) setPlayers(data);
  }, []);

  const fetchAnswers = useCallback(async (roomId: string) => {
    const { data } = await supabase
      .from("battle_answers")
      .select("*")
      .eq("room_id", roomId);
    if (data) setAnswers(data);
  }, []);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    if (!room) return;
    fetchPlayers(room.id);
    fetchAnswers(room.id);

    const channel = supabase
      .channel(`battle-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "battle_rooms", filter: `id=eq.${room.id}` }, (payload) => {
        const updated = payload.new as any;
        setRoom(updated);
        if (updated.status === "ended") {
          navigate(`/battle/result/${code}`, { replace: true });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "battle_players", filter: `room_id=eq.${room.id}` }, () => fetchPlayers(room.id))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "battle_answers", filter: `room_id=eq.${room.id}` }, () => fetchAnswers(room.id))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room?.id]);

  // Timer
  useEffect(() => {
    if (!room?.question_started_at || room.status !== "running") return;
    const update = () => {
      const elapsed = (Date.now() - new Date(room.question_started_at).getTime()) / 1000;
      const remaining = Math.max(0, room.seconds_per_question - elapsed);
      setTimeLeft(remaining);
    };
    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [room?.question_started_at, room?.seconds_per_question, room?.status]);

  // Timeout enforcement
  useEffect(() => {
    if (!room || room.status !== "running") return;
    timeoutInterval.current = setInterval(() => {
      ensureTimeout(room.id).catch(() => {});
    }, 3000);
    return () => clearInterval(timeoutInterval.current);
  }, [room?.id, room?.status]);

  // Detect round change -> show result briefly
  useEffect(() => {
    if (!room) return;
    if (prevIndex.current >= 0 && room.current_index !== prevIndex.current) {
      setShowRoundResult(true);
      setSelectedIndex(null);
      setSubmitting(false);
      const timer = setTimeout(() => setShowRoundResult(false), 2500);
      return () => clearTimeout(timer);
    }
    prevIndex.current = room.current_index;
  }, [room?.current_index]);

  if (!room || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading battle…</div>
      </div>
    );
  }

  const questionOrder = (room.question_order as any[]) ?? [];
  const currentQ = questionOrder[room.current_index];
  const question = currentQ
    ? allQuestions.current.find((q) => q.id === currentQ.id)
    : null;

  const myAnswer = answers.find(
    (a) => a.question_id === currentQ?.id && a.user_id === user.id
  );
  const opponentAnswer = answers.find(
    (a) => a.question_id === currentQ?.id && a.user_id !== user.id
  );

  // Option mapping for shuffle
  const mapping = currentQ && room.shuffle_options
    ? getOptionMapping(room.random_seed, user.id, currentQ.id)
    : [0, 1, 2, 3];

  const handleSelect = async (displayIdx: number) => {
    if (myAnswer || submitting || !question || !currentQ) return;
    const originalIndex = mapping[displayIdx];
    setSelectedIndex(displayIdx);
    setSubmitting(true);
    try {
      await submitAnswer(room.id, currentQ.id, originalIndex, currentQ.correctIndex);
    } catch (e: any) {
      toast.error(e.message);
      setSelectedIndex(null);
    } finally {
      setSubmitting(false);
    }
  };

  const prevQ = prevIndex.current >= 0 && prevIndex.current < questionOrder.length
    ? questionOrder[Math.max(0, room.current_index - 1)]
    : null;

  const timerPercent = room.seconds_per_question > 0 ? (timeLeft / room.seconds_per_question) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col max-w-sm mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono text-muted-foreground">{code}</span>
        <span className="text-sm font-bold">
          Q{room.current_index + 1}/{questionOrder.length}
        </span>
      </div>

      {/* Score Bar */}
      <div className="flex gap-2 mb-4">
        {players.map((p) => (
          <div
            key={p.id}
            className={`flex-1 glass rounded-xl px-3 py-2 text-center ${
              p.user_id === user.id ? "ring-2 ring-primary" : ""
            }`}
          >
            <div className="text-xs text-muted-foreground truncate">{p.display_name}</div>
            <div className="font-display text-xl font-bold">{p.score}</div>
          </div>
        ))}
      </div>

      {/* Timer */}
      <div className="relative h-2 rounded-full bg-muted mb-6 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background:
              timerPercent > 30
                ? "hsl(var(--primary))"
                : timerPercent > 10
                ? "hsl(var(--secondary))"
                : "hsl(var(--destructive))",
          }}
          animate={{ width: `${timerPercent}%` }}
          transition={{ duration: 0.1 }}
        />
        <span className="absolute right-0 -top-5 text-xs font-mono font-bold">
          {Math.ceil(timeLeft)}s
        </span>
      </div>

      <AnimatePresence mode="wait">
        {showRoundResult && prevQ ? (
          <RoundResultOverlay
            key="round-result"
            questionOrder={questionOrder}
            index={room.current_index - 1}
            allQuestions={allQuestions.current}
            answers={answers}
            userId={user.id}
            players={players}
          />
        ) : question ? (
          <motion.div
            key={`q-${room.current_index}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="flex-1 flex flex-col"
          >
            {/* Question */}
            <div className="glass rounded-2xl p-5 mb-6">
              <p className="font-semibold text-base leading-relaxed">{question.text}</p>
            </div>

            {/* Options */}
            <div className="space-y-3 flex-1">
              {mapping.map((origIdx, displayIdx) => {
                const isMyPick = selectedIndex === displayIdx;
                const isLocked = !!myAnswer;
                const optionText = question.options[origIdx];

                return (
                  <motion.button
                    key={displayIdx}
                    whileTap={!isLocked ? { scale: 0.97 } : {}}
                    onClick={() => handleSelect(displayIdx)}
                    disabled={isLocked}
                    className={`w-full flex items-center gap-3 rounded-2xl px-4 py-4 text-left transition-all border-2 ${
                      isMyPick
                        ? "border-primary bg-primary/10"
                        : isLocked
                        ? "border-border bg-muted/30 opacity-60"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${
                        isMyPick
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {LABELS[displayIdx]}
                    </span>
                    <span className="text-sm font-medium leading-snug">{optionText}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Waiting indicator */}
            {myAnswer && !opponentAnswer && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-muted-foreground mt-4 py-3"
              >
                ⏳ Waiting for opponent…
              </motion.div>
            )}
          </motion.div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Loading question…
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

function RoundResultOverlay({
  questionOrder,
  index,
  allQuestions,
  answers,
  userId,
  players,
}: {
  questionOrder: any[];
  index: number;
  allQuestions: BattleQuestion[];
  answers: any[];
  userId: string;
  players: any[];
}) {
  const entry = questionOrder[index];
  if (!entry) return null;
  const question = allQuestions.find((q) => q.id === entry.id);
  if (!question) return null;

  const myAns = answers.find((a) => a.question_id === entry.id && a.user_id === userId);
  const oppAns = answers.find((a) => a.question_id === entry.id && a.user_id !== userId);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center text-center gap-4"
    >
      <div className="text-lg font-display font-bold">
        {myAns?.is_correct ? "✅ Correct!" : "❌ Wrong"}
      </div>
      <div className="text-sm text-muted-foreground">
        Answer: <span className="font-semibold text-foreground">{question.options[entry.correctIndex]}</span>
      </div>
      <div className="flex gap-4 mt-2">
        {players.map((p) => {
          const ans = answers.find((a) => a.question_id === entry.id && a.user_id === p.user_id);
          return (
            <div key={p.id} className="text-center">
              <div className="text-xs text-muted-foreground">{p.display_name}</div>
              <div className={`font-bold ${ans?.is_correct ? "text-success" : "text-destructive"}`}>
                {ans ? (ans.is_correct ? "+10" : "0") : "—"}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default BattlePlay;
