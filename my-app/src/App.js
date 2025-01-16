import React, { useState } from "react";
import { AIGame } from "./components/AIGame";
import { HumanGame } from "./components/HumanGame";
import "./styles/App.css";

function App() {
  const [gameMode, setGameMode] = useState("human");
  const [aiDifficulty, setAiDifficulty] = useState("medium");

  return (
    <div className="game">
      <div className="game-controls">
        <select
          value={gameMode}
          onChange={(e) => setGameMode(e.target.value)}
          className="mode-select"
        >
          <option value="human">Human vs Human</option>
          <option value="ai">Human vs AI</option>
        </select>
        {gameMode === "ai" && (
          <select
            value={aiDifficulty}
            onChange={(e) => setAiDifficulty(e.target.value)}
            className="difficulty-select"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        )}
      </div>

      {gameMode === "ai" ? (
        <AIGame aiDifficulty={aiDifficulty} />
      ) : (
        <HumanGame />
      )}
    </div>
  );
}

export default App;
