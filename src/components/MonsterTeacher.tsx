import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import monsterImg from "@/assets/monster-avatar.webp";

interface MonsterTeacherProps {
  message: string;
  className?: string;
}

const MonsterTeacher = ({ message, className = "" }: MonsterTeacherProps) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" as const }}
        className={`flex items-end gap-3 ${className}`}
      >
        {/* Monster avatar */}
        <div className="monster-bounce shrink-0">
          <img
            src={monsterImg}
            alt="Monster Teacher"
            className="h-20 w-20 rounded-2xl object-cover drop-shadow-lg sm:h-24 sm:w-24"
          />
        </div>

        {/* Speech bubble */}
        <div className="relative flex-1">
          <div className="speech-bubble">
            <button
              onClick={() => setVisible(false)}
              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-sm"
              aria-label="Dismiss monster teacher"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="text-sm font-medium text-foreground leading-relaxed pr-4">
              {message}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MonsterTeacher;
