import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } =
    await supabaseUser.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub;

  const { action, ...params } = await req.json();

  try {
    switch (action) {
      case "submit_answer":
        return await handleSubmitAnswer(supabaseAdmin, userId, params);
      case "ensure_timeout":
        return await handleEnsureTimeout(supabaseAdmin, params);
      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleSubmitAnswer(
  db: ReturnType<typeof createClient>,
  userId: string,
  params: {
    room_id: string;
    question_id: string;
    selected_index: number;
    correct_index: number;
  }
) {
  const { room_id, question_id, selected_index, correct_index } = params;

  // Get room
  const { data: room } = await db
    .from("battle_rooms")
    .select("*")
    .eq("id", room_id)
    .single();
  if (!room || room.status !== "running") {
    return jsonResponse({ error: "Room not active" }, 400);
  }

  // Check if already answered
  const { data: existing } = await db
    .from("battle_answers")
    .select("id")
    .eq("room_id", room_id)
    .eq("question_id", question_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) {
    return jsonResponse({ already_answered: true });
  }

  const is_correct = selected_index === correct_index;
  const now = new Date();
  const startedAt = new Date(room.question_started_at);
  const time_taken_ms = now.getTime() - startedAt.getTime();

  // Insert answer
  await db.from("battle_answers").insert({
    room_id,
    question_id,
    user_id: userId,
    selected_index,
    is_correct,
    time_taken_ms,
  });

  // Update score
  if (is_correct) {
    const bonus = Math.max(0, Math.min(5, Math.floor((room.seconds_per_question * 1000 - time_taken_ms) / (room.seconds_per_question * 200))));
    const points = 10 + bonus;
    await db.rpc("increment_battle_score", {
      p_room_id: room_id,
      p_user_id: userId,
      p_points: points,
    }).then(() => {}).catch(async () => {
      // Fallback: direct update
      const { data: player } = await db
        .from("battle_players")
        .select("score")
        .eq("room_id", room_id)
        .eq("user_id", userId)
        .single();
      if (player) {
        await db
          .from("battle_players")
          .update({ score: player.score + points })
          .eq("room_id", room_id)
          .eq("user_id", userId);
      }
    });
  }

  // Check if both players answered
  const { count } = await db
    .from("battle_answers")
    .select("*", { count: "exact", head: true })
    .eq("room_id", room_id)
    .eq("question_id", question_id);

  const { count: playerCount } = await db
    .from("battle_players")
    .select("*", { count: "exact", head: true })
    .eq("room_id", room_id);

  if ((count ?? 0) >= (playerCount ?? 2)) {
    await advanceRound(db, room);
  }

  return jsonResponse({ success: true, is_correct });
}

async function advanceRound(
  db: ReturnType<typeof createClient>,
  room: any
) {
  const questionOrder = room.question_order as any[];
  const nextIndex = room.current_index + 1;

  if (nextIndex >= questionOrder.length) {
    await db
      .from("battle_rooms")
      .update({ status: "ended", current_index: nextIndex })
      .eq("id", room.id);
  } else {
    await db
      .from("battle_rooms")
      .update({
        current_index: nextIndex,
        question_started_at: new Date().toISOString(),
      })
      .eq("id", room.id);
  }
}

async function handleEnsureTimeout(
  db: ReturnType<typeof createClient>,
  params: { room_id: string }
) {
  const { room_id } = params;

  const { data: room } = await db
    .from("battle_rooms")
    .select("*")
    .eq("id", room_id)
    .single();

  if (!room || room.status !== "running" || !room.question_started_at) {
    return jsonResponse({ no_action: true });
  }

  const elapsed =
    Date.now() - new Date(room.question_started_at).getTime();
  if (elapsed < room.seconds_per_question * 1000) {
    return jsonResponse({ no_action: true });
  }

  // Time expired - advance
  await advanceRound(db, room);
  return jsonResponse({ advanced: true });
}
