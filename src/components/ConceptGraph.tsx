import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Question } from "@/lib/quizData";

interface AnswerEntry {
  question: Question;
  chosen: string;
  correct: boolean;
}

interface ConceptGraphProps {
  answers: AnswerEntry[];
  onReviewQuestion?: (index: number) => void;
}

interface Node {
  id: number;
  x: number;
  y: number;
  question: string;
  correct: boolean;
  answer: string;
  correctAnswer: string;
}

// Extract keywords from question text for connections
function extractKeywords(text: string): string[] {
  const stop = new Set(["the", "a", "an", "is", "are", "was", "were", "of", "in", "to", "for", "on", "with", "by", "at", "from", "which", "what", "that", "this", "it", "its"]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w));
}

function findConnections(nodes: Node[]): [number, number][] {
  const connections: [number, number][] = [];
  const kwMap = nodes.map((n) => extractKeywords(n.question));

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const shared = kwMap[i].filter((w) => kwMap[j].includes(w));
      if (shared.length >= 1) {
        connections.push([i, j]);
      }
    }
  }
  return connections;
}

const ConceptGraph = ({ answers, onReviewQuestion }: ConceptGraphProps) => {
  const [selected, setSelected] = useState<number | null>(null);

  const { nodes, connections } = useMemo(() => {
    const cx = 300;
    const cy = 250;
    const radius = Math.min(200, 80 + answers.length * 15);

    const ns: Node[] = answers.map((a, i) => {
      const angle = (Math.PI * 2 * i) / answers.length - Math.PI / 2;
      const ct = a.question[`option_${a.question.answer.toLowerCase()}` as keyof Question] as string;
      return {
        id: i,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        question: a.question.question.slice(0, 60) + (a.question.question.length > 60 ? "…" : ""),
        correct: a.correct,
        answer: a.chosen,
        correctAnswer: `${a.question.answer}. ${ct}`,
      };
    });

    return { nodes: ns, connections: findConnections(ns) };
  }, [answers]);

  const selectedNode = selected !== null ? nodes[selected] : null;

  return (
    <div className="w-full">
      <h3 className="font-display text-lg font-bold text-foreground mb-3 text-center">Concept Map</h3>
      <div className="relative w-full overflow-x-auto">
        <svg viewBox="0 0 600 500" className="w-full max-w-[600px] mx-auto" style={{ minHeight: 300 }}>
          {/* Connections */}
          {connections.map(([a, b], i) => (
            <motion.line
              key={`c-${i}`}
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity={0.2}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2 + i * 0.02, duration: 0.2 }}
            />
          ))}

          {/* Nodes */}
          {nodes.map((node, i) => (
            <motion.g
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              onClick={() => {
                setSelected(selected === i ? null : i);
                if (!node.correct && onReviewQuestion) onReviewQuestion(i);
              }}
              className="cursor-pointer"
            >
              {/* Glow for wrong answers */}
              {!node.correct && (
                <circle cx={node.x} cy={node.y} r={22} fill="hsl(var(--destructive))" opacity={0.15}>
                  <animate attributeName="r" values="22;26;22" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={18}
                fill={node.correct ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                stroke={selected === i ? "hsl(var(--foreground))" : "transparent"}
                strokeWidth={2}
              />
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={11}
                fontWeight="bold"
              >
                {i + 1}
              </text>
            </motion.g>
          ))}
        </svg>
      </div>

      {/* Detail card */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`mt-3 glass rounded-2xl p-4 border-l-4 ${
              selectedNode.correct ? "border-l-success" : "border-l-destructive"
            }`}
          >
            <p className="text-sm font-semibold text-foreground">{selectedNode.question}</p>
            {!selectedNode.correct && (
              <p className="mt-1 text-xs text-muted-foreground">
                Correct: <span className="font-bold text-success">{selectedNode.correctAnswer}</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConceptGraph;
