import { useState } from "react";
import { Game } from "@/types/poker";
import GameSetup from "@/components/GameSetup";
import GameDashboard from "@/components/GameDashboard";

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
      <GameDashboard 
        game={currentGame} 
        onBackToSetup={handleBackToSetup}
      />
    );
  }

  return (
    <GameSetup onGameStart={handleGameStart} />
  );
};

export default Index;
