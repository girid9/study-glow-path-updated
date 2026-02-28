import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSpacedRepetition() {
  const addWrongAnswer = useCallback(async (
    subjectId: string,
    topicId: string,
    questionText: string,
    correctAnswer: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("review_items").upsert(
      {
        user_id: user.id,
        subject_id: subjectId,
        topic_id: topicId,
        question_text: questionText,
        correct_answer: correctAnswer,
        interval_days: 1,
        ease_factor: 2.5,
        next_review_at: new Date().toISOString(),
        review_count: 0,
      },
      { onConflict: "user_id,question_text" }
    );
  }, []);

  const markReviewed = useCallback(async (itemId: string, wasCorrect: boolean) => {
    const { data } = await supabase
      .from("review_items")
      .select("*")
      .eq("id", itemId)
      .single();
    if (!data) return;

    let newInterval = data.interval_days;
    let newEase = Number(data.ease_factor);

    if (wasCorrect) {
      newInterval = Math.round(newInterval * newEase);
      newEase = Math.min(3.0, newEase + 0.1);
    } else {
      newInterval = 1;
      newEase = Math.max(1.3, newEase - 0.2);
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    await supabase.from("review_items").update({
      interval_days: newInterval,
      ease_factor: newEase,
      next_review_at: nextReview.toISOString(),
      review_count: (data.review_count ?? 0) + 1,
    }).eq("id", itemId);
  }, []);

  const getDueItems = useCallback(async (topicId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from("review_items")
      .select("*")
      .eq("user_id", user.id)
      .lte("next_review_at", new Date().toISOString())
      .order("next_review_at", { ascending: true });

    if (topicId) query = query.eq("topic_id", topicId);

    const { data } = await query;
    return data ?? [];
  }, []);

  return { addWrongAnswer, markReviewed, getDueItems };
}
