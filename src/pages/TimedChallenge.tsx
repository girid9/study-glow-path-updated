import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, useMotionValue, PanInfo } from "framer-motion";
import { getSubject, getTopic, Question } from "@/lib/quizData";
import { CheckCircle2, XCircle, ArrowLeft, Zap, Trophy, Timer, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const SWIPE_THRESHOLD = 80;
const optionLabels = ["A", "B", "C", "D"] as const;
const optionKeys = ["option_a", "option_b", "option_c", "option_d"] as const;

/* ─── Timer Setup Screen ─── */
function TimerSetup({ questionCount, onStart }: { questionCount: number; onStart: (secs: number) => void }) {
  const [secsPerQ, setSecsPerQ] = useState(3);

  const totalTime = questionCount * secsPerQ;

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
          <Timer className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold">Timed Challenge</h1>
        <p className="text-sm text-muted-foreground">{questionCount} questions</p>

        <div className="glass rounded-2xl p-6 space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Seconds per question</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setSecsPerQ((s) => Math.max(1, s - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted hover:bg-muted/80 transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="font-display text-4xl font-bold text-foreground w-16">{secsPerQ}</span>
            <button
              onClick={() => setSecsPerQ((s) => Math.min(15, s + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted hover:bg-muted/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Total time: <span className="font-bold text-foreground">{totalTime}s</span>
          </p>
        </div>

        {/* Presets */}
        <div className="flex justify-center gap-2">
          {[2, 3, 5, 10].map((s) => (
            <button
              key={s}
              onClick={() => setSecsPerQ(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                secsPerQ === s
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}s
            </button>
          ))}
        </div>

        <Button onClick={() => onStart(secsPerQ)} className="w-full h-12 rounded-xl font-bold gap-2">
          <Zap className="h-5 w-5" /> Start Challenge
        </Button>
      </motion.div>
    </div>
  );
}

/* ─── Timed Swipe Card ─── */
function TimedSwipeCard({ label, text, onSwipe, disabled, index }: {
  label: string; text: string; onSwipe: (label: string) => void; disabled: boolean; index: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.1, delay: index * 0.02 }}
      drag={!disabled}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.5}
      dragMomentum={false}
      style={{ x, y, touchAction: "none" }}
      onDragEnd={(_, info: PanInfo) => {
        const dist = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
        if (dist > SWIPE_THRESHOLD) onSwipe(label);
      }}
      className="relative rounded-2xl border-2 border-border bg-card p-4 select-none cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-primary text-primary-foreground text-sm font-bold">
          {label}
        </span>
        <span className="pt-1.5 text-sm leading-relaxed font-medium">{text}</span>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─── */
const TimedChallenge = () => {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const navigate = useNavigate();
  const subject = getSubject(subjectId || "");
  const topic = getTopic(subjectId || "", topicId || "");

  const shuffled = useMemo(() => {
    if (!topic) return [];
    return [...topic.questions].sort(() => Math.random() - 0.5);
  }, [topic]);

  const [secsPerQuestion, setSecsPerQuestion] = useState<number | null>(null);
  const totalTime = secsPerQuestion ? shuffled.length * secsPerQuestion : 0;

  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<{ correct: boolean }[]>([]);
  const [finished, setFinished] = useState(false);
  const [chosenLabel, setChosenLabel] = useState<string | null>(null);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Timer
  useEffect(() => {
    if (finished || !secsPerQuestion) return;
    startTime.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      const remaining = Math.max(0, totalTime - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setFinished(true);
        clearInterval(timerRef.current);
      }
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [totalTime, finished, secsPerQuestion]);

  const q = shuffled[current] ?? null;

  const options = useMemo(() => {
    if (!q) return [];
    return optionKeys
      .map((key, idx) => ({ label: optionLabels[idx], text: q[key] ?? "" }))
      .filter((o) => !!o.text);
  }, [q]);

  const advanceToNext = useCallback(() => {
    if (current + 1 >= shuffled.length) {
      setFinished(true);
      clearInterval(timerRef.current);
    } else {
      setCurrent((c) => c + 1);
      setChosenLabel(null);
    }
  }, [current, shuffled.length]);

  const handleSwipe = useCallback(
    (label: string) => {
      if (chosenLabel || !q) return;
      setChosenLabel(label);
      const isCorrect = label === q.answer;
      setAnswers((prev) => [...prev, { correct: isCorrect }]);
      setTimeout(advanceToNext, 200);
    },
    [chosenLabel, q, advanceToNext]
  );

  const correctCount = answers.filter((a) => a.correct).length;
  const timerPercent = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;

  if (!subject || !topic) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Not found</div>;
  }

  // Setup screen
  if (secsPerQuestion === null) {
    return (
      <TimerSetup
        questionCount={shuffled.length}
        onStart={(secs) => {
          setSecsPerQuestion(secs);
          setTimeLeft(shuffled.length * secs);
        }}
      />
    );
  }

  // Results
  if (finished) {
    const pct = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
    const xp = correctCount * 10;
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full gradient-primary">
            <Trophy className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold">Time's Up!</h1>
          <div className="glass rounded-2xl p-6 space-y-3">
            <div className="font-display text-4xl font-bold text-gradient-primary">{correctCount}/{answers.length}</div>
            <p className="text-sm text-muted-foreground">
              {pct}% accuracy
            </p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span className="font-bold text-success">+{xp} XP</span>
              <span>{shuffled.length - answers.length} unanswered</span>
              <span>{secsPerQuestion}s/q</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(`/subject/${subjectId}/topic/${topicId}`)} className="flex-1 h-12 rounded-xl gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => {
              setCurrent(0);
              setAnswers([]);
              setFinished(false);
              setChosenLabel(null);
              setSecsPerQuestion(null);
            }} className="flex-1 h-12 rounded-xl gap-2">
              <Zap className="h-4 w-4" /> Retry
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero px-4 py-6">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 text-xs font-bold text-muted-foreground">
          <span>Q {current + 1}/{shuffled.length}</span>
          <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {correctCount}</span>
        </div>

        {/* Timer bar */}
        <div className="relative h-3 rounded-full bg-muted mb-6 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: timerPercent > 30
                ? "hsl(var(--primary))"
                : timerPercent > 10
                ? "hsl(var(--secondary))"
                : "hsl(var(--destructive))",
            }}
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 0.1 }}
          />
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-foreground">
            {Math.ceil(timeLeft)}s
          </span>
        </div>

        {/* Question */}
        {q && (
          <motion.div key={current} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }}>
            <div className="glass-strong rounded-3xl p-5 mb-5">
              <h2 className="font-display text-base font-bold leading-relaxed">{q.question}</h2>
            </div>

            <div className="space-y-2.5">
              {options.map((option, idx) => (
                <TimedSwipeCard
                  key={`${current}-${option.label}`}
                  label={option.label}
                  text={option.text}
                  onSwipe={handleSwipe}
                  disabled={!!chosenLabel}
                  index={idx}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TimedChallenge;
