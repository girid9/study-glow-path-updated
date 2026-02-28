import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { subjects } from "@/lib/quizData";
import { BookOpen, ArrowRight, Sparkles } from "lucide-react";
import MonsterTeacher from "@/components/MonsterTeacher";
import heroBg from "@/assets/hero-bg.webp";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
};

const Index = () => {
  const totalQuestions = subjects.reduce(
    (acc, s) => acc + s.topics.reduce((a, t) => a + t.questionCount, 0),
    0
  );

  return (
    <div className="min-h-screen">
      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />

        <div className="relative px-4 pt-16 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg text-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-bold text-foreground">
                <Sparkles className="h-4 w-4 text-secondary" />
                {totalQuestions}+ Questions
              </div>

              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Learn with{" "}
                <span className="text-gradient-primary">Quizzy</span>
              </h1>

              <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground font-medium">
                Your friendly monster teacher is here to help you master every topic!
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Monster Teacher */}
      <section className="px-4 -mt-2 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <MonsterTeacher message="Hey there! 👋 I'm Quizzy! Pick a subject below and let's start learning together. You've got this! 💪" />
        </div>
      </section>

      {/* Subject Cards */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {subjects.map((subject) => (
              <motion.div key={subject.id} variants={item}>
                <Link to={`/subject/${subject.id}`} className="block">
                  <div className={`group relative overflow-hidden rounded-2xl ${subject.gradientClass} p-6 hover-lift cursor-pointer`}>
                    <div className="glass-strong absolute inset-0 rounded-2xl opacity-50" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{subject.icon}</span>
                        <div className="flex-1">
                          <h2 className="font-display text-xl font-bold text-foreground">
                            {subject.name}
                          </h2>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {subject.description}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {subject.topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic.id}
                            className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 text-[11px] font-semibold text-foreground"
                          >
                            <BookOpen className="h-3 w-3" />
                            {topic.name}
                          </span>
                        ))}
                        {subject.topics.length > 3 && (
                          <span className="inline-flex items-center rounded-full bg-background/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                            +{subject.topics.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Progress bar placeholder */}
                      <div className="mt-4 flex items-center gap-3">
                        <div className="h-2 flex-1 rounded-full bg-background/40 overflow-hidden">
                          <div className="h-full w-0 rounded-full gradient-primary" />
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground">
                          {subject.topics.reduce((a, t) => a + t.questionCount, 0)} Q
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
