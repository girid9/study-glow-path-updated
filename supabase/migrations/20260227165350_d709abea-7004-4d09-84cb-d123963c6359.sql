
-- Allow room creators to see their own rooms (they are the host)
DROP POLICY IF EXISTS "Players can view their rooms" ON public.battle_rooms;
CREATE POLICY "Players can view their rooms" ON public.battle_rooms
  FOR SELECT USING (
    host_user_id = auth.uid() OR public.is_battle_room_member(battle_rooms.id, auth.uid())
  );

-- Allow anyone authenticated to see rooms in lobby status (for joining)
CREATE POLICY "Anyone can view lobby rooms by code" ON public.battle_rooms
  FOR SELECT TO authenticated USING (status = 'lobby');
