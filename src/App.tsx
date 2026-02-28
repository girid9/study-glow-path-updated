import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SubjectPage from "./pages/SubjectPage";
import TopicPage from "./pages/TopicPage";
import QuizPage from "./pages/QuizPage";
import TimedChallenge from "./pages/TimedChallenge";
import MultiplayerLobby from "./pages/MultiplayerLobby";
import MultiplayerRace from "./pages/MultiplayerRace";
import BattleHome from "./pages/BattleHome";
import BattleLobby from "./pages/BattleLobby";
import BattlePlay from "./pages/BattlePlay";
import BattleResult from "./pages/BattleResult";
import AuthPage from "./pages/AuthPage";
import InstallPage from "./pages/InstallPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/subject/:subjectId" element={<SubjectPage />} />
          <Route path="/subject/:subjectId/topic/:topicId" element={<TopicPage />} />
          <Route path="/subject/:subjectId/topic/:topicId/quiz" element={<QuizPage />} />
          <Route path="/subject/:subjectId/topic/:topicId/timed" element={<TimedChallenge />} />
          <Route path="/subject/:subjectId/topic/:topicId/lobby" element={<MultiplayerLobby />} />
          <Route path="/subject/:subjectId/topic/:topicId/race" element={<MultiplayerRace />} />
          <Route path="/battle" element={<BattleHome />} />
          <Route path="/battle/lobby/:code" element={<BattleLobby />} />
          <Route path="/battle/play/:code" element={<BattlePlay />} />
          <Route path="/battle/result/:code" element={<BattleResult />} />
          <Route path="/install" element={<InstallPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
