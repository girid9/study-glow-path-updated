import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Home, RotateCcw, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useBattleAuth } from "@/hooks/useBattleAuth";

const BattleResult = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useBattleAuth();
  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);

  const fetch = useCallback(async () => {
    if (!code) return;
    const { data: r } = await supabase.from("battle_rooms").select("*").eq("code", code).single();
    if (!r) return;
    setRoom(r);
    const { data: p } = await supabase.from("battle_players").select("*").eq("room_id", r.id).order("score", { ascending: false });
    if (p) setPlayers(p);
    const { data: a } = await supabase.from("battle_answers").select("*").eq("room_id", r.id);
    if (a) setAnswers(a);
  }, [code]);

  useEffect(() => { fetch(); }, [fetch]);

  if (!room || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading results…</div>
      </div>
    );
  }

  const winner = players[0];
  const isTie = players.length >= 2 && players[0]?.score === players[1]?.score;
  const isWinner = winner?.user_id === user.id && !isTie;

  const myAnswers = answers.filter((a) => a.user_id === user.id);
  const myCorrect = myAnswers.filter((a) => a.is_correct).length;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-6 text-center"
      >
        {/* Trophy */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full gradient-primary"
        >
          <Trophy className="h-12 w-12 text-primary-foreground" />
        </motion.div>

        <h1 className="font-display text-3xl font-bold">
          {isTie ? "It's a Tie! 🤝" : isWinner ? "You Won! 🎉" : "You Lost 😢"}
        </h1>

        {/* Leaderboard */}
        <div className="space-y-3">
          {players.map((p, i) => {
            const pAnswers = answers.filter((a) => a.user_id === p.user_id);
            const pCorrect = pAnswers.filter((a) => a.is_correct).length;
            const isMe = p.user_id === user.id;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`glass rounded-2xl p-4 flex items-center gap-4 ${
                  isMe ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-xl ${
                  i === 0 && !isTie ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {i === 0 && !isTie ? <Crown className="h-6 w-6" /> : i + 1}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{p.display_name} {isMe && "(You)"}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-success font-semibold">{pCorrect} ✓</span>
                    {" · "}
                    <span className="text-destructive font-semibold">{pAnswers.length - pCorrect} ✗</span>
                    {" / "}
                    {(room.question_order as any[])?.length ?? 0}
                  </div>
                </div>
                <div className="font-display text-2xl font-bold">{p.score}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button onClick={() => navigate("/battle")} variant="outline" className="flex-1 h-12 rounded-xl gap-2">
            <Home className="h-4 w-4" /> Home
          </Button>
          <Button onClick={() => navigate("/battle")} className="flex-1 h-12 rounded-xl gap-2">
            <RotateCcw className="h-4 w-4" /> Rematch
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default BattleResult;
