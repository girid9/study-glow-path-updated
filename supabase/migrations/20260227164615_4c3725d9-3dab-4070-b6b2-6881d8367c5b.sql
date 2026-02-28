
-- Battle Rooms
CREATE TABLE public.battle_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'lobby',
  host_user_id uuid NOT NULL,
  topic_id text NOT NULL DEFAULT '',
  question_count int NOT NULL DEFAULT 10,
  seconds_per_question int NOT NULL DEFAULT 20,
  shuffle_options boolean NOT NULL DEFAULT true,
  random_seed int NOT NULL DEFAULT floor(random() * 2147483647)::int,
  question_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_index int NOT NULL DEFAULT 0,
  question_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Battle Players
CREATE TABLE public.battle_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.battle_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  is_host boolean NOT NULL DEFAULT false,
  score int NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Battle Answers
CREATE TABLE public.battle_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.battle_rooms(id) ON DELETE CASCADE NOT NULL,
  question_id text NOT NULL,
  user_id uuid NOT NULL,
  selected_index int NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  time_taken_ms int,
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, question_id, user_id)
);

-- Enable RLS
ALTER TABLE public.battle_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_answers ENABLE ROW LEVEL SECURITY;

-- RLS: battle_rooms - players in room can SELECT
CREATE POLICY "Players can view their rooms" ON public.battle_rooms
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.battle_players bp WHERE bp.room_id = battle_rooms.id AND bp.user_id = auth.uid())
  );

-- Anyone can create rooms (authenticated)
CREATE POLICY "Authenticated users can create rooms" ON public.battle_rooms
  FOR INSERT TO authenticated WITH CHECK (host_user_id = auth.uid());

-- Only host can update rooms
CREATE POLICY "Host can update room" ON public.battle_rooms
  FOR UPDATE TO authenticated USING (host_user_id = auth.uid());

-- RLS: battle_players
CREATE POLICY "Players in room can view players" ON public.battle_players
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.battle_players bp2 WHERE bp2.room_id = battle_players.room_id AND bp2.user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can join rooms" ON public.battle_players
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Players can update own record" ON public.battle_players
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- RLS: battle_answers
CREATE POLICY "Players in room can view answers" ON public.battle_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.battle_players bp WHERE bp.room_id = battle_answers.room_id AND bp.user_id = auth.uid())
  );

CREATE POLICY "Players can submit own answers" ON public.battle_answers
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_answers;
