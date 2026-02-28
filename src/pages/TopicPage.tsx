import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getSubject, getTopic } from "@/lib/quizData";
import { ArrowLeft, Play, BookOpen, Swords, Zap } from "lucide-react";
import MonsterTeacher from "@/components/MonsterTeacher";

const TopicPage = () => {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const navigate = useNavigate();
  const subject = getSubject(subjectId || "");
  const topic = getTopic(subjectId || "", topicId || "");

  if (!subject || !topic) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Topic not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground font-medium">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to={`/subject/${subject.id}`} className="hover:text-foreground transition-colors">
            {subject.name}
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">{topic.name}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-center"
        >
          {/* Monster Teacher */}
          <div className="mb-8">
            <MonsterTeacher message={`Ready to test your knowledge on ${topic.name}? I believe in you! Let's go! 🚀`} />
          </div>

          <div className="glass-strong rounded-2xl p-8">
            <span className="text-4xl">{subject.icon}</span>
            <h1 className="mt-3 font-display text-2xl font-bold">{topic.name}</h1>
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground font-medium">
              <BookOpen className="h-4 w-4" />
              {topic.questionCount} questions
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/subject/${subject.id}/topic/${topic.id}/quiz`)}
                className="inline-flex items-center gap-3 rounded-2xl gradient-warm px-8 py-4 text-lg font-bold text-secondary-foreground shadow-lg hover:shadow-xl transition-shadow"
              >
                <Play className="h-5 w-5" />
                Solo Quiz
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/battle?topic=${topic.id}`)}
                className="inline-flex items-center gap-3 rounded-2xl gradient-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
              >
                <Swords className="h-5 w-5" />
                Battle Mode
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/subject/${subject.id}/topic/${topic.id}/timed`)}
                className="inline-flex items-center gap-3 rounded-2xl bg-destructive px-8 py-4 text-lg font-bold text-destructive-foreground shadow-lg hover:shadow-xl transition-shadow"
              >
                <Zap className="h-5 w-5" />
                Timed Challenge
              </motion.button>
            </div>
          </div>

          <Link
            to={`/subject/${subject.id}`}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to topics
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default TopicPage;
