
-- Allow players to always see their own rows
DROP POLICY IF EXISTS "Players in room can view players" ON public.battle_players;
CREATE POLICY "Players in room can view players" ON public.battle_players
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_battle_room_member(battle_players.room_id, auth.uid())
  );
