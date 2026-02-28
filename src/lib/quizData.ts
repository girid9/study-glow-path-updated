import ictsmData from "@/data/ictsm_theory_2nd_year.json";
import employabilityData from "@/data/employability_skills_2nd_year.json";

export interface Question {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  answer: string; // "A" | "B" | "C" | "D"
  notes: string;
}

export interface Topic {
  id: string;
  name: string;
  questionCount: number;
  questions: Question[];
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradientClass: string;
  topics: Topic[];
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function isValidOption(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  // filter out empty, single punctuation, or whitespace-only options
  if (trimmed.length === 0) return false;
  if (/^[,.\-–—;:!?'"` ]+$/.test(trimmed)) return false;
  return true;
}

function isValidQuestion(q: Question): boolean {
  // All 4 options must have meaningful text and the answer must be set
  return (
    !!q.question?.trim() &&
    isValidOption(q.option_a) &&
    isValidOption(q.option_b) &&
    isValidOption(q.option_c) &&
    isValidOption(q.option_d) &&
    ["A", "B", "C", "D"].includes(q.answer)
  );
}

function parseTopics(data: Record<string, Question[]>): Topic[] {
  return Object.entries(data).map(([name, questions]) => {
    const valid = questions.filter(isValidQuestion);
    return {
      id: slugify(name),
      name,
      questionCount: valid.length,
      questions: valid,
    };
  });
}

export const subjects: Subject[] = [
  {
    id: "ictsm-theory",
    name: "ICTSM Theory",
    description: "Information & Communication Technology System Maintenance — Linux, Hardware, Peripherals & more",
    icon: "💻",
    gradientClass: "gradient-card-1",
    topics: parseTopics(ictsmData as Record<string, Question[]>),
  },
  {
    id: "employability-skills",
    name: "Employability Skills",
    description: "Career skills, communication, workplace etiquette & future work readiness",
    icon: "🎯",
    gradientClass: "gradient-card-2",
    topics: parseTopics(employabilityData as Record<string, Question[]>),
  },
];

export function getSubject(id: string): Subject | undefined {
  return subjects.find((s) => s.id === id);
}

export function getTopic(subjectId: string, topicId: string): Topic | undefined {
  return getSubject(subjectId)?.topics.find((t) => t.id === topicId);
}

export function getCorrectOption(q: Question): string {
  const map: Record<string, string> = {
    A: q.option_a,
    B: q.option_b,
    C: q.option_c,
    D: q.option_d,
  };
  return map[q.answer] || "";
}
