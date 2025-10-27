import { useState } from "react";
import { Game } from "@/types/poker";
import GameSetup from "@/components/GameSetup";
import GameDashboard from "@/components/GameDashboard";
import ThemeToggle from "@/components/ThemeToggle";
import ChatBot from "@/components/ChatBot";

const Index = () => {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);

  const handleGameStart = (game: Game) => {
    setCurrentGame(game);
  };

  const handleBackToSetup = () => {
    setCurrentGame(null);
  };

  if (currentGame) {
    return (
      <>
        <ThemeToggle />
        <GameDashboard 
          game={currentGame} 
          onBackToSetup={handleBackToSetup}
        />
        <ChatBot />
      </>
    );
  }

  return (
    <>
      <ThemeToggle />
      <GameSetup onGameStart={handleGameStart} />
      <ChatBot />
    </>
  );
};

export default Index;
