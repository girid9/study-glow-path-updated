import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getSubject } from "@/lib/quizData";
import { ArrowLeft, BookOpen, ArrowRight } from "lucide-react";
import MonsterTeacher from "@/components/MonsterTeacher";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
};

const SubjectPage = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const subject = getSubject(subjectId || "");

  if (!subject) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Subject not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        {/* Back */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center gap-4">
            <span className="text-5xl">{subject.icon}</span>
            <div>
              <h1 className="font-display text-2xl font-bold">{subject.name}</h1>
              <p className="text-sm text-muted-foreground">{subject.topics.length} topics</p>
            </div>
          </div>
        </motion.div>

        {/* Monster Teacher */}
        <div className="mb-6">
          <MonsterTeacher message={`Great choice! Let's explore ${subject.name}. Pick a topic to start practising! 📚`} />
        </div>

        {/* Topics Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {subject.topics.map((topic, idx) => (
            <motion.div key={topic.id} variants={item}>
              <Link to={`/subject/${subject.id}/topic/${topic.id}`}>
                <div className="group glass rounded-2xl p-5 hover-lift cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary text-primary-foreground font-display font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-base font-semibold text-foreground truncate">
                        {topic.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5" />
                        {topic.questionCount} questions
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default SubjectPage;
