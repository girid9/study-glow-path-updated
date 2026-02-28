import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { getTopic, getSubject, Question } from "@/lib/quizData";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Crown, Trophy } from "lucide-react";
import {
  submitAnswer, finishRoom, subscribeToRoom, fetchRoomState,
  type Player,
} from "@/lib/multiplayer";

const optionLabels = ["A", "B", "C", "D"] as const;
const optionKeys = ["option_a", "option_b", "option_c", "option_d"] as const;
const SWIPE_THRESHOLD = 80;

/* ─── Swipe Card (simplified for race) ─── */
const RaceSwipeCard = ({
  label, text, isCorrect, onSwipe, disabled, revealed, wasChosen, index, questionKey,
}: {
  label: string; text: string; isCorrect: boolean;
  onSwipe: (label: string) => void; disabled: boolean;
  revealed: boolean; wasChosen: boolean; index: number; questionKey: number;
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-120, 0, 120], [-5, 0, 5]);
  const rightGlow = useTransform(x, [0, 60], [0, 1]);

  const showCorrect = revealed && isCorrect;
  const showWrong = revealed && wasChosen && !isCorrect;
  const dismissed = revealed && !isCorrect && !wasChosen;

  return (
    <motion.div
      layout={!revealed}
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={
        showWrong
          ? { x: -300, rotate: -360, scale: 0.3, opacity: 0, transition: { duration: 0.6 } }
          : showCorrect
          ? { scale: [1, 1.15, 0], opacity: [1, 1, 0], transition: { duration: 0.5, times: [0, 0.4, 1] } }
          : { opacity: 1, y: 0, scale: 1 }
      }
      transition={!revealed ? { delay: 0.15 + index * 0.1, duration: 0.3 } : undefined}
      key={`${questionKey}-${label}`}
      drag={!disabled ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      dragMomentum={false}
      style={{ x, rotate, touchAction: "none" }}
      onDragEnd={(_, info: PanInfo) => {
        if (info.offset.x > SWIPE_THRESHOLD) onSwipe(label);
      }}
      whileTap={!disabled ? { scale: 1.02 } : {}}
      className={`relative rounded-2xl border-2 p-3 select-none transition-colors ${
        dismissed ? "border-border/50 bg-card/30 opacity-50" : revealed ? "" : "border-border bg-card shadow-sm cursor-grab active:cursor-grabbing"
      }`}
    >
      {!disabled && (
        <motion.div style={{ opacity: rightGlow }} className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-success bg-success/10" />
      )}
      <div className="relative flex items-start gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
          showCorrect ? "bg-success text-success-foreground" : showWrong ? "bg-destructive text-destructive-foreground" : "gradient-primary text-primary-foreground"
        }`}>
          {showCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : showWrong ? <XCircle className="h-3.5 w-3.5" /> : label}
        </span>
        <span className="pt-1 text-sm leading-relaxed text-foreground font-medium flex-1">{text}</span>
      </div>
    </motion.div>
  );
};

/* ─── Race Page ─── */
const MultiplayerRace = () => {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("roomId")!;
  const playerId = searchParams.get("playerId")!;
  const navigate = useNavigate();

  const subject = getSubject(subjectId || "");
  const topic = getTopic(subjectId || "", topicId || "");

  const shuffled = useMemo(() => {
    if (!topic) return [];
    // Use room-seeded order (deterministic for all players via room code)
    return [...topic.questions].sort((a, b) => a.question.localeCompare(b.question));
  }, [topic]);

  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [chosenLabel, setChosenLabel] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomStatus, setRoomStatus] = useState("racing");
  const botTimers = useRef<NodeJS.Timeout[]>([]);

  const q = shuffled.length > 0 && current < shuffled.length ? shuffled[current] : null;

  const options = useMemo(() => {
    if (!q) return [];
    return optionKeys.map((key, idx) => ({ label: optionLabels[idx], text: q[key] ?? "" })).filter((o) => !!o.text);
  }, [q]);

  const correctOptionText = q ? (q[`option_${q.answer.toLowerCase()}` as keyof Question] as string) : "";

  // Subscribe to realtime updates
  const refresh = useCallback(async () => {
    const state = await fetchRoomState(roomId);
    if (state.players) setPlayers(state.players);
    if (state.room) setRoomStatus(state.room.status);
  }, [roomId]);

  useEffect(() => {
    refresh();
    const unsub = subscribeToRoom(roomId, refresh);
    return () => {
      unsub();
      botTimers.current.forEach(clearTimeout);
    };
  }, [roomId, refresh]);

  // Bot auto-answer logic
  useEffect(() => {
    if (roomStatus !== "racing") return;
    botTimers.current.forEach(clearTimeout);
    botTimers.current = [];

    const bots = players.filter((p) => p.is_bot);
    bots.forEach((bot) => {
      if (bot.current_question >= shuffled.length) return;
      const delay = 2000 + Math.random() * 4000; // 2-6 seconds
      const timer = setTimeout(async () => {
        const bq = shuffled[bot.current_question];
        if (!bq) return;
        // 60-80% accuracy per bot
        const accuracy = 0.6 + Math.random() * 0.2;
        const isCorrect = Math.random() < accuracy;
        const chosen = isCorrect ? bq.answer : optionLabels[Math.floor(Math.random() * 4)];
        const wasCorrect = chosen === bq.answer;
        const newScore = bot.score + (wasCorrect ? 10 : 0);
        const next = bot.current_question + 1;

        await submitAnswer(roomId, bot.id, bot.current_question, chosen, wasCorrect, newScore, next);

        if (next >= shuffled.length) {
          // Check if all done
          const state = await fetchRoomState(roomId);
          const allDone = state.players?.every((p) => p.current_question >= shuffled.length);
          if (allDone) await finishRoom(roomId);
        }
      }, delay);
      botTimers.current.push(timer);
    });
  }, [players, roomStatus, shuffled, roomId]);

  const advanceToNext = useCallback(() => {
    const next = current + 1;
    if (next >= shuffled.length) {
      setFinished(true);
      // Check if we should finish the room
      fetchRoomState(roomId).then((state) => {
        const allDone = state.players?.every((p) => p.current_question >= shuffled.length);
        if (allDone) finishRoom(roomId);
      });
    } else {
      setCurrent(next);
      setRevealed(false);
      setChosenLabel(null);
    }
  }, [current, shuffled.length, roomId]);

  const handleSwipe = useCallback(
    (label: string) => {
      if (revealed || !q) return;
      setChosenLabel(label);
      setRevealed(true);
      const isCorrect = label === q.answer;
      const newScore = score + (isCorrect ? 10 : 0);
      if (isCorrect) setScore(newScore);

      submitAnswer(roomId, playerId, current, label, isCorrect, newScore, current + 1);
      setTimeout(advanceToNext, isCorrect ? 800 : 1800);
    },
    [revealed, q, score, roomId, playerId, current, advanceToNext]
  );

  const isCorrectAnswer = chosenLabel === q?.answer;
  const progress = shuffled.length > 0 ? (current / shuffled.length) * 100 : 0;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  if (!subject || !topic) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Not found.</p></div>;
  }

  /* ─── Results ─── */
  if (finished || roomStatus === "finished") {
    const myRank = sortedPlayers.findIndex((p) => p.id === playerId) + 1;

    return (
      <div className="min-h-screen gradient-hero px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-6">
            <Trophy className="mx-auto h-12 w-12 text-secondary mb-2" />
            <h1 className="font-display text-3xl font-bold">Race Complete!</h1>
            <p className="mt-1 text-muted-foreground font-medium">
              You placed <span className="font-bold text-foreground">#{myRank}</span>
            </p>
          </motion.div>

          {/* Leaderboard */}
          <div className="glass-strong rounded-3xl p-5 space-y-3 mb-6">
            <h2 className="font-display text-lg font-bold">Leaderboard</h2>
            {sortedPlayers.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center justify-between rounded-xl border-2 p-3 ${
                  p.id === playerId ? "border-primary bg-primary/10" : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    i === 0 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {i === 0 ? <Crown className="h-4 w-4" /> : i + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full" style={{ backgroundColor: p.avatar_color }} />
                    <span className="text-sm font-bold text-foreground">{p.display_name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground">{p.score} pts</span>
                  <p className="text-[10px] text-muted-foreground">{p.current_question}/{shuffled.length} done</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/subject/${subjectId}/topic/${topicId}`)}
              className="inline-flex items-center gap-2 rounded-2xl gradient-primary px-6 py-3 text-sm font-bold text-primary-foreground"
            >
              <ArrowRight className="h-4 w-4" /> Back to Topic
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Racing UI ─── */
  return (
    <div className="min-h-screen gradient-hero px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        {/* Player sidebar (horizontal on mobile) */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {sortedPlayers.map((p) => (
            <div
              key={p.id}
              className={`flex shrink-0 items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs ${
                p.id === playerId ? "border-primary bg-primary/10" : "border-border bg-card/60"
              }`}
            >
              <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: p.avatar_color }}>
                {p.display_name[0]}
              </div>
              <div>
                <span className="font-bold text-foreground block leading-tight">{p.display_name.split(" ")[0]}</span>
                <span className="text-muted-foreground">{p.score}pts • Q{p.current_question + 1}</span>
              </div>
              {/* Progress dots */}
              <div className="flex gap-0.5 ml-1">
                {Array.from({ length: Math.min(shuffled.length, 10) }, (_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${
                      i < p.current_question ? "bg-success" : i === p.current_question ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>Q {current + 1} / {shuffled.length}</span>
          <span>{score} pts</span>
        </div>
        <div className="mb-4 h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div className="h-full rounded-full gradient-warm" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>

        {/* Question */}
        {q && (
          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
              <div className="glass-strong rounded-3xl p-5">
                <h2 className="font-display text-base font-bold leading-relaxed text-foreground min-h-[2.5rem]">{q.question}</h2>

                {!revealed && (
                  <p className="mt-1 text-[10px] text-muted-foreground/60 text-center font-semibold">Swipe → to select</p>
                )}

                <AnimatePresence>
                  {revealed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mt-2 flex items-center justify-center gap-2 rounded-xl p-2 ${
                        isCorrectAnswer ? "bg-success/15 border border-success/30" : "bg-destructive/15 border border-destructive/30"
                      }`}
                    >
                      {isCorrectAnswer ? (
                        <span className="text-xs font-bold text-success">✓ +10 pts!</span>
                      ) : (
                        <div className="text-center">
                          <span className="text-xs font-bold text-destructive">✗ Wrong</span>
                          <p className="text-[10px] text-success font-bold mt-0.5">Answer: {q.answer}. {correctOptionText}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-4 space-y-2.5">
                  {options.map((option, idx) => (
                    <RaceSwipeCard
                      key={`${current}-${option.label}`}
                      label={option.label}
                      text={option.text}
                      isCorrect={option.label === q.answer}
                      onSwipe={handleSwipe}
                      disabled={revealed}
                      revealed={revealed}
                      wasChosen={chosenLabel === option.label}
                      index={idx}
                      questionKey={current}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default MultiplayerRace;
