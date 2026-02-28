
-- Drop the recursive SELECT policy
DROP POLICY IF EXISTS "Players in room can view players" ON public.battle_players;

-- Create a security definer function to check room membership
CREATE OR REPLACE FUNCTION public.is_battle_room_member(p_room_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.battle_players
    WHERE room_id = p_room_id AND user_id = p_user_id
  )
$$;

-- Recreate SELECT policy using the function
CREATE POLICY "Players in room can view players" ON public.battle_players
  FOR SELECT USING (
    public.is_battle_room_member(battle_players.room_id, auth.uid())
  );

-- Also fix battle_answers SELECT policy (same recursion risk via battle_players)
DROP POLICY IF EXISTS "Players in room can view answers" ON public.battle_answers;
CREATE POLICY "Players in room can view answers" ON public.battle_answers
  FOR SELECT USING (
    public.is_battle_room_member(battle_answers.room_id, auth.uid())
  );

-- Fix battle_rooms SELECT policy too
DROP POLICY IF EXISTS "Players can view their rooms" ON public.battle_rooms;
CREATE POLICY "Players can view their rooms" ON public.battle_rooms
  FOR SELECT USING (
    public.is_battle_room_member(battle_rooms.id, auth.uid())
  );
