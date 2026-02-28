import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Copy, Check, Crown, Play, ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useBattleAuth } from "@/hooks/useBattleAuth";
import { startBattle, getTopicList, getQuestionsByTopic } from "@/lib/battleLib";
import { toast } from "sonner";

const QUESTION_COUNTS = [5, 10, 15, 20, 30];
const TIME_OPTIONS = [10, 15, 20, 30, 45, 60];

const BattleLobby = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useBattleAuth();
  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const topics = getTopicList();

  const isHost = room?.host_user_id === user?.id;

  const fetchRoom = useCallback(async () => {
    if (!code) return;
    const { data } = await supabase
      .from("battle_rooms")
      .select("*")
      .eq("code", code)
      .single();
    if (data) {
      setRoom(data);
      if (data.status === "running") {
        navigate(`/battle/play/${code}`, { replace: true });
      }
    }
  }, [code, navigate]);

  const fetchPlayers = useCallback(async () => {
    if (!room) return;
    const { data } = await supabase
      .from("battle_players")
      .select("*")
      .eq("room_id", room.id)
      .order("joined_at");
    if (data) setPlayers(data);
  }, [room?.id]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    if (!room) return;
    fetchPlayers();

    const channel = supabase
      .channel(`lobby-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "battle_players", filter: `room_id=eq.${room.id}` }, () => fetchPlayers())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "battle_rooms", filter: `id=eq.${room.id}` }, (payload) => {
        const updated = payload.new as any;
        setRoom(updated);
        if (updated.status === "running") {
          navigate(`/battle/play/${code}`, { replace: true });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room?.id, fetchPlayers, navigate, code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateSetting = async (field: string, value: any) => {
    if (!isHost || !room) return;
    await supabase.from("battle_rooms").update({ [field]: value }).eq("id", room.id);
    setRoom((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleStart = async () => {
    if (!room || players.length < 2) return toast.error("Need 2 players to start");
    const availableQs = getQuestionsByTopic(room.topic_id);
    if (availableQs.length === 0) return toast.error("No questions for selected topic");
    setStarting(true);
    try {
      await startBattle(room.id, room.topic_id, Math.min(room.question_count, availableQs.length));
    } catch (e: any) {
      toast.error(e.message);
      setStarting(false);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading lobby…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-sm mx-auto">
      <Button variant="ghost" onClick={() => navigate("/battle")} className="gap-1 -ml-2 mb-4">
        <ArrowLeft className="h-4 w-4" /> Leave
      </Button>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Room Code */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Room Code</p>
          <button onClick={handleCopy} className="inline-flex items-center gap-2 glass px-6 py-3 rounded-2xl">
            <span className="font-mono text-3xl font-bold tracking-[0.3em]">{code}</span>
            {copied ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
          </button>
        </div>

        {/* Players */}
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Players ({players.length}/2)</span>
          </div>
          <div className="space-y-2">
            {players.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {p.display_name[0]?.toUpperCase()}
                </div>
                <span className="font-semibold flex-1">{p.display_name}</span>
                {p.is_host && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-secondary">
                    <Crown className="h-3.5 w-3.5" /> Host
                  </span>
                )}
              </div>
            ))}
            {players.length < 2 && (
              <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border px-4 py-3 text-muted-foreground">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">?</div>
                <span className="text-sm">Waiting for opponent…</span>
              </div>
            )}
          </div>
        </div>

        {/* Settings (Host only) */}
        {isHost && (
          <div className="glass rounded-2xl p-4 space-y-4">
            <h3 className="font-display font-bold text-sm">Battle Settings</h3>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Topic</label>
              <select
                value={room.topic_id}
                onChange={(e) => handleUpdateSetting("topic_id", e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
              >
                {topics.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Questions</label>
                <select
                  value={room.question_count}
                  onChange={(e) => handleUpdateSetting("question_count", Number(e.target.value))}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {QUESTION_COUNTS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Time/Question</label>
                <select
                  value={room.seconds_per_question}
                  onChange={(e) => handleUpdateSetting("seconds_per_question", Number(e.target.value))}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {TIME_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}s</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Start Button */}
        {isHost && (
          <Button
            onClick={handleStart}
            disabled={starting || players.length < 2}
            className="w-full h-14 rounded-2xl text-lg gap-2"
            size="lg"
          >
            <Play className="h-5 w-5" />
            {starting ? "Starting…" : players.length < 2 ? "Waiting for opponent…" : "Start Battle!"}
          </Button>
        )}

        {!isHost && (
          <div className="text-center text-sm text-muted-foreground py-4">
            Waiting for host to start the battle…
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BattleLobby;
