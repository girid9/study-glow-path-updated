import { motion } from "framer-motion";

interface LiquidMorphProps {
  originX: number;
  originY: number;
  onComplete?: () => void;
}

/**
 * Liquid puddle effect: blobs melt downward from the card position,
 * pool together, then dissolve as the next question loads.
 */
const LiquidMorph = ({ originX, originY, onComplete }: LiquidMorphProps) => {
  const blobs = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    offsetX: (Math.random() - 0.5) * 80,
    offsetY: 30 + Math.random() * 60,
    size: 20 + Math.random() * 40,
    delay: i * 0.05,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-50" style={{ overflow: "hidden" }}>
      {/* Main melting blob */}
      <motion.div
        initial={{
          left: originX,
          top: originY,
          width: 60,
          height: 60,
          borderRadius: "30%",
          opacity: 1,
          scale: 1,
        }}
        animate={{
          top: originY + 80,
          width: 200,
          height: 30,
          borderRadius: "50%",
          opacity: 0,
          scale: [1, 1.5, 2, 0.5],
          scaleY: [1, 0.5, 0.3, 0],
        }}
        transition={{ duration: 0.8, ease: "easeIn" }}
        onAnimationComplete={onComplete}
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          background: "hsl(var(--success))",
          filter: "blur(8px)",
        }}
      />

      {/* Secondary drip blobs */}
      {blobs.map((b) => (
        <motion.div
          key={b.id}
          initial={{
            left: originX + b.offsetX,
            top: originY,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            opacity: 0.7,
            scale: 0.5,
          }}
          animate={{
            top: originY + b.offsetY,
            opacity: 0,
            scale: [0.5, 1, 0.3],
            scaleY: [1, 0.6, 0],
            borderRadius: ["50%", "40%", "60%"],
          }}
          transition={{ duration: 0.6, delay: b.delay, ease: "easeIn" }}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            background: "hsl(var(--success) / 0.6)",
            filter: "blur(6px)",
          }}
        />
      ))}
    </div>
  );
};

export default LiquidMorph;
