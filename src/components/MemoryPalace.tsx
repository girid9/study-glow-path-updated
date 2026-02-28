import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Question } from "@/lib/quizData";

interface WrongAnswer {
  index: number;
  question: Question;
  chosen: string;
}

interface MemoryPalaceProps {
  wrongAnswers: WrongAnswer[];
  onClose: () => void;
}

// Positions in the "room" for up to 10 items
const POSITIONS = [
  { x: 15, y: 30, z: 0.9 },
  { x: 70, y: 25, z: 0.85 },
  { x: 40, y: 65, z: 1.0 },
  { x: 80, y: 60, z: 0.95 },
  { x: 25, y: 75, z: 1.05 },
  { x: 60, y: 40, z: 0.88 },
  { x: 10, y: 50, z: 0.92 },
  { x: 85, y: 45, z: 0.87 },
  { x: 50, y: 20, z: 0.83 },
  { x: 35, y: 85, z: 1.1 },
];

const MemoryPalace = ({ wrongAnswers, onClose }: MemoryPalaceProps) => {
  const [focused, setFocused] = useState<number | null>(null);
  const focusedItem = focused !== null ? wrongAnswers[focused] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ rotateX: 30, scale: 0.8, opacity: 0 }}
        animate={{ rotateX: 0, scale: 1, opacity: 1 }}
        exit={{ rotateX: -30, scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden"
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Room walls */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: `
              linear-gradient(180deg, 
                hsl(var(--muted) / 0.3) 0%, 
                hsl(var(--background) / 0.9) 40%,
                hsl(var(--muted) / 0.6) 100%
              )`,
            border: "2px solid hsl(var(--border))",
          }}
        >
          {/* Floor grid */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1/2"
            style={{
              background: `
                repeating-linear-gradient(90deg, hsl(var(--border) / 0.15) 0px, transparent 1px, transparent 40px),
                repeating-linear-gradient(0deg, hsl(var(--border) / 0.15) 0px, transparent 1px, transparent 40px)
              `,
              transform: "perspective(400px) rotateX(45deg)",
              transformOrigin: "bottom center",
            }}
          />

          {/* Room label */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center z-10">
            <h3 className="font-display text-base font-bold text-foreground/80">🏛️ Memory Palace</h3>
            <p className="text-[10px] text-muted-foreground">Tap items to review</p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-sm font-bold"
          >
            ✕
          </button>

          {/* Wrong answer objects in the room */}
          {wrongAnswers.map((item, idx) => {
            const pos = POSITIONS[idx % POSITIONS.length];
            const correctText = item.question[`option_${item.question.answer.toLowerCase()}` as keyof Question] as string;
            const isFocused = focused === idx;

            return (
              <motion.div
                key={idx}
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{
                  scale: pos.z,
                  opacity: 1,
                  y: 0,
                }}
                transition={{ delay: 0.3 + idx * 0.12, type: "spring", stiffness: 150 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setFocused(isFocused ? null : idx);
                }}
                className="absolute cursor-pointer"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) scale(${pos.z})`,
                  zIndex: isFocused ? 30 : Math.round(pos.z * 10),
                }}
              >
                {/* Wrong answer marker */}
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shadow-lg transition-colors ${
                    isFocused
                      ? "bg-destructive text-destructive-foreground ring-2 ring-destructive/50"
                      : "bg-card border-2 border-destructive/40 text-destructive"
                  }`}
                >
                  {idx + 1}
                  {/* Correct answer glow landmark */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success flex items-center justify-center">
                    <span className="text-[8px] text-success-foreground font-bold">✓</span>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Focused detail overlay */}
        <AnimatePresence>
          {focusedItem && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-4 right-4 z-30 glass-strong rounded-2xl p-4 border border-destructive/30"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs font-semibold text-foreground leading-relaxed">
                {focusedItem.question.question}
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Your answer: <span className="font-bold text-destructive">{focusedItem.chosen}</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Correct: <span className="font-bold text-success">
                  {focusedItem.question.answer}. {focusedItem.question[`option_${focusedItem.question.answer.toLowerCase()}` as keyof Question]}
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default MemoryPalace;
