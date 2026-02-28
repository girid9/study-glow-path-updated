import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, PanInfo } from "framer-motion";
import { getSubject, getTopic, Question } from "@/lib/quizData";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Map, Settings } from "lucide-react";
import MonsterTeacher from "@/components/MonsterTeacher";
import NeuralDust from "@/components/NeuralDust";
import { useSpacedRepetition } from "@/hooks/useSpacedRepetition";
import ConceptGraph from "@/components/ConceptGraph";
import MemoryPalace from "@/components/MemoryPalace";

const optionLabels = ["A", "B", "C", "D"] as const;
const optionKeys = ["option_a", "option_b", "option_c", "option_d"] as const;
const SWIPE_THRESHOLD = 80;

/* ─── Typewriter Text ─── */
const TypewriterText = ({ text, speed = 30 }: { text: string; speed?: number }) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-5 bg-foreground ml-0.5 align-middle"
        />
      )}
    </span>
  );
};

/* ─── Confetti Particle Burst ─── */
const ConfettiBurst = ({ originX, originY }: { originX: number; originY: number }) => {
  const particles = useMemo(() => {
    const colors = [
      "hsl(var(--success))",
      "hsl(var(--primary))",
      "hsl(var(--secondary))",
      "hsl(var(--accent))",
      "#FFD700",
      "#FF6B6B",
      "#4ECDC4",
    ];
    return Array.from({ length: 24 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.5;
      const distance = 80 + Math.random() * 120;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 40,
        rotate: Math.random() * 720 - 360,
        scale: 0.5 + Math.random() * 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.5 ? "circle" : "rect",
        delay: Math.random() * 0.1,
      };
    });
  }, []);

  return (
    <div className="pointer-events-none fixed z-50" style={{ left: originX, top: originY }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, scale: 0, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 0.7 + Math.random() * 0.3, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: p.shape === "circle" ? 8 * p.scale : 6 * p.scale,
            height: p.shape === "circle" ? 8 * p.scale : 10 * p.scale,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
};

/* ─── Swipeable Option Card ─── */
interface SwipeCardProps {
  label: string;
  text: string;
  isCorrect: boolean;
  onSwipe: (label: string, cardRef: HTMLDivElement | null) => void;
  disabled: boolean;
  revealed: boolean;
  wasChosen: boolean;
  index: number;
  questionKey: number;
  cardRefCallback?: (el: HTMLDivElement | null) => void;
}

const SwipeCard = ({ label, text, isCorrect, onSwipe, disabled, revealed, wasChosen, index, questionKey, cardRefCallback }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const showCorrect = revealed && isCorrect;
  const showWrong = revealed && wasChosen && !isCorrect;
  const dismissed = revealed && !isCorrect && !wasChosen;

  useEffect(() => {
    if (cardRefCallback && isCorrect) {
      cardRefCallback(cardRef.current);
    }
  }, [cardRefCallback, isCorrect]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 8 }}
      animate={
        showWrong
          ? { opacity: 0, scale: 0.9, transition: { duration: 0.15 } }
          : showCorrect
          ? { opacity: 0, scale: 1.02, transition: { duration: 0.15 } }
          : { opacity: dismissed ? 0.4 : 1, y: 0, scale: 1 }
      }
      transition={{ duration: 0.1, delay: index * 0.02 }}
      key={`${questionKey}-${label}`}
      drag={!disabled}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.5}
      dragMomentum={false}
      style={{ x, y, touchAction: "none" }}
      onDragEnd={(_, info: PanInfo) => {
        const dist = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
        if (dist > SWIPE_THRESHOLD) onSwipe(label, cardRef.current);
      }}
      className={`relative rounded-2xl border-2 p-4 select-none ${
        dismissed
          ? "border-border/50 bg-card/30"
          : showCorrect
          ? "border-success bg-success/10"
          : showWrong
          ? "border-destructive bg-destructive/10"
          : "border-border bg-card cursor-grab active:cursor-grabbing"
      }`}
    >
      <div className="relative flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
            showCorrect
              ? "bg-success text-success-foreground"
              : showWrong
              ? "bg-destructive text-destructive-foreground"
              : "gradient-primary text-primary-foreground"
          }`}
        >
          {showCorrect ? <CheckCircle2 className="h-4 w-4" /> : showWrong ? <XCircle className="h-4 w-4" /> : label}
        </span>
        <span className="pt-1.5 text-sm leading-relaxed text-foreground font-medium flex-1">{text}</span>
      </div>
    </motion.div>
  );
};

/* ─── Quiz Page ─── */
const QuizPage = () => {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const navigate = useNavigate();
  const subject = getSubject(subjectId || "");
  const topic = getTopic(subjectId || "", topicId || "");

  const shuffled = useMemo(() => {
    if (!topic) return [];
    return [...topic.questions].sort(() => Math.random() - 0.5);
  }, [topic]);

  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [chosenLabel, setChosenLabel] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ question: Question; chosen: string; correct: boolean }[]>([]);
  const [finished, setFinished] = useState(false);
  const [correctCardRect, setCorrectCardRect] = useState<DOMRect | null>(null);
  const { addWrongAnswer } = useSpacedRepetition();
  const [showPalace, setShowPalace] = useState(false);
  const [resultsTab, setResultsTab] = useState<"list" | "graph">("list");
  const [showSettings, setShowSettings] = useState(false);
  const [neuralDustEnabled, setNeuralDustEnabled] = useState(false);
  const q = shuffled.length > 0 ? shuffled[current] : null;

  const options = useMemo(() => {
    if (!q) return [];
    return optionKeys
      .map((key, idx) => ({ label: optionLabels[idx], text: q[key] ?? "" }))
      .filter((o) => !!o.text);
  }, [q]);

  const correctOptionText = q
    ? (q[`option_${q.answer.toLowerCase()}` as keyof Question] as string)
    : "";

  const advanceToNext = useCallback(() => {
    if (current + 1 >= shuffled.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setRevealed(false);
      setChosenLabel(null);
      setCorrectCardRect(null);
    }
  }, [current, shuffled.length]);

  const handleSwipe = useCallback(
    (label: string, cardEl: HTMLDivElement | null) => {
      if (revealed || !q) return;
      setChosenLabel(label);
      setRevealed(true);
      const isCorrect = label === q.answer;
      setAnswers((prev) => [...prev, { question: q, chosen: label, correct: isCorrect }]);

      if (!isCorrect && subjectId && topicId) {
        const correctText = q[`option_${q.answer.toLowerCase()}` as keyof Question] as string;
        addWrongAnswer(subjectId, topicId, q.question, `${q.answer}. ${correctText}`);
      }

      setTimeout(advanceToNext, isCorrect ? 250 : 600);
    },
    [revealed, q, advanceToNext]
  );



  // Track correct card element for neural dust attraction
  const handleCorrectCardRef = useCallback((el: HTMLDivElement | null) => {
    if (el) setCorrectCardRect(el.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (revealed) return;
    const handler = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= options.length) handleSwipe(optionLabels[num - 1], null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [revealed, options, handleSwipe]);

  const progress = shuffled.length > 0 ? (current / shuffled.length) * 100 : 0;

  if (!subject || !topic || !q) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Quiz not found.</p>
      </div>
    );
  }

  const isCorrectAnswer = chosenLabel === q.answer;
  const wrongAnswers = answers
    .map((a, i) => ({ ...a, index: i }))
    .filter((a) => !a.correct);

  /* ─── Results ─── */
  if (finished) {
    const correctCount = answers.filter((a) => a.correct).length;
    const pct = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
    const xp = correctCount * 10;

    const monsterMsg =
      pct >= 80
        ? "Amazing! You're a superstar! 🌟 Keep it up!"
        : pct >= 50
        ? "Good effort! Let's review the ones you missed! 📖"
        : "Don't worry, learning takes practice! Try again! 💪";

    return (
      <div className="min-h-screen gradient-hero px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold">Quiz Complete!</h1>
            <p className="mt-2 text-muted-foreground font-medium">
              <span className="font-bold text-foreground">{correctCount}</span> / {shuffled.length} correct
            </p>
            <div className="mx-auto mt-6 flex h-28 w-28 items-center justify-center rounded-full glass">
              <span className="font-display text-3xl font-bold text-gradient-primary">{pct}%</span>
            </div>
          </motion.div>

          <div className="mb-8">
            <MonsterTeacher message={monsterMsg} />
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setCurrent(0);
                setRevealed(false);
                setChosenLabel(null);
                setAnswers([]);
                setFinished(false);
                setCorrectCardRect(null);
              }}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-5 py-3 text-sm font-bold text-foreground hover-lift"
            >
              <RotateCcw className="h-4 w-4" /> Retake
            </motion.button>
            {wrongAnswers.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowPalace(true)}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-destructive/40 bg-card px-5 py-3 text-sm font-bold text-destructive hover-lift"
              >
                <Map className="h-4 w-4" /> Memory Palace
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/subject/${subject.id}`)}
              className="inline-flex items-center gap-2 rounded-2xl gradient-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              More Topics <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Results tabs: List vs Concept Graph */}
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => setResultsTab("list")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                resultsTab === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setResultsTab("graph")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                resultsTab === "graph"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Concept Map
            </button>
          </div>

          <AnimatePresence mode="wait">
            {resultsTab === "list" ? (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {answers.map((a, i) => {
                  const ct = a.question[`option_${a.question.answer.toLowerCase()}` as keyof Question] as string;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`glass rounded-2xl p-4 border-l-4 ${a.correct ? "border-l-success" : "border-l-destructive"}`}
                    >
                      <p className="text-sm font-semibold text-foreground">{i + 1}. {a.question.question}</p>
                      {!a.correct && (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Correct: <span className="font-bold text-success">{a.question.answer}. {ct}</span>
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div key="graph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ConceptGraph answers={answers} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Memory Palace modal */}
        <AnimatePresence>
          {showPalace && (
            <MemoryPalace
              wrongAnswers={wrongAnswers.map((a) => ({
                index: a.index,
                question: a.question,
                chosen: a.chosen,
              }))}
              onClose={() => setShowPalace(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ─── Quiz ─── */
  return (
    <div className="min-h-screen gradient-hero px-4 py-6 sm:px-6 lg:px-8">
      {/* Neural Dust glow */}
      {neuralDustEnabled && <NeuralDust attractorRect={correctCardRect} attracting={!revealed} />}
      <div className="mx-auto max-w-lg">
        {/* Progress + Settings */}
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>Q {current + 1} / {shuffled.length}</span>
          <div className="flex items-center gap-2">
            <span>{topic.name}</span>
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="glass rounded-2xl p-4 space-y-4">
                {/* Neural Dust toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded-full bg-success/80" />
                    <span className="text-sm font-bold text-foreground">Answer Glow</span>
                  </div>
                  <button
                    onClick={() => setNeuralDustEnabled((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
                      neuralDustEnabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transition-transform ${
                        neuralDustEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mb-6 h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-warm"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15, ease: "easeOut" as const }}
          />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="glass-strong rounded-3xl p-6">
              <h2 className="font-display text-lg font-bold leading-relaxed text-foreground min-h-[3.5rem]">
                {q.question}
              </h2>

              {!revealed && (
                <p className="mt-2 text-[11px] text-muted-foreground/60 text-center font-semibold">
                  Swipe any direction to select
                </p>
              )}

              <AnimatePresence>
                {revealed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`mt-3 flex items-center justify-center gap-2 rounded-2xl p-3 ${
                      isCorrectAnswer ? "bg-success/15 border border-success/30" : "bg-destructive/15 border border-destructive/30"
                    }`}
                  >
                    {isCorrectAnswer ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <span className="text-sm font-bold text-success">✓ Correct!</span>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <XCircle className="h-5 w-5 text-destructive" />
                          <span className="text-sm font-bold text-destructive">Incorrect</span>
                        </div>
                        <p className="mt-1 text-xs text-success font-bold">
                          Answer: {q.answer}. {correctOptionText}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-5 space-y-3">
                {options.map((option, idx) => (
                  <SwipeCard
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
                    cardRefCallback={option.label === q.answer ? handleCorrectCardRef : undefined}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizPage;
