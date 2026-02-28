import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Swords, Plus, LogIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRoom, joinRoom, getTopicList } from "@/lib/battleLib";
import { toast } from "sonner";

const BattleHome = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"home" | "create" | "join">("home");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const topics = getTopicList();
  const preselectedTopic = searchParams.get("topic") || "";
  const [topicId, setTopicId] = useState(preselectedTopic || (topics[0]?.value ?? ""));

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Enter your name");
    setLoading(true);
    try {
      const { room } = await createRoom(name.trim(), topicId);
      navigate(`/battle/lobby/${room.code}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) return toast.error("Enter your name");
    if (!code.trim()) return toast.error("Enter room code");
    setLoading(true);
    try {
      const { room } = await joinRoom(code.trim(), name.trim());
      navigate(`/battle/lobby/${room.code}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        {mode === "home" && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full gradient-primary">
              <Swords className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold">Battle Mode</h1>
            <p className="text-muted-foreground text-sm">Challenge a friend to a real-time quiz battle!</p>
            <div className="space-y-3">
              <Button onClick={() => setMode("create")} className="w-full h-14 text-lg gap-2 rounded-2xl" size="lg">
                <Plus className="h-5 w-5" /> Create Room
              </Button>
              <Button onClick={() => setMode("join")} variant="outline" className="w-full h-14 text-lg gap-2 rounded-2xl" size="lg">
                <LogIn className="h-5 w-5" /> Join Room
              </Button>
            </div>
            <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </div>
        )}

        {mode === "create" && (
          <div className="space-y-5">
            <Button variant="ghost" onClick={() => setMode("home")} className="gap-1 -ml-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <h2 className="font-display text-2xl font-bold">Create Battle</h2>
            <div className="space-y-3">
              <Input
                placeholder="Your display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl text-base"
                maxLength={20}
              />
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm"
              >
                {topics.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <Button onClick={handleCreate} disabled={loading} className="w-full h-12 rounded-xl text-base">
                {loading ? "Creating…" : "Create Room"}
              </Button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-5">
            <Button variant="ghost" onClick={() => setMode("home")} className="gap-1 -ml-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <h2 className="font-display text-2xl font-bold">Join Battle</h2>
            <div className="space-y-3">
              <Input
                placeholder="Your display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl text-base"
                maxLength={20}
              />
              <Input
                placeholder="Room code (e.g. ABC23)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="h-12 rounded-xl text-base font-mono tracking-widest text-center"
                maxLength={6}
              />
              <Button onClick={handleJoin} disabled={loading} className="w-full h-12 rounded-xl text-base">
                {loading ? "Joining…" : "Join Room"}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BattleHome;
