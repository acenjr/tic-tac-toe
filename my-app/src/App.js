import React, { useState } from "react";
import "./App.css";

const winningCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function App() {
  const [boards, setBoards] = useState(Array(9).fill(Array(9).fill(null)));
  const [bigBoard, setBigBoard] = useState(Array(9).fill(null));
  const [nextPlayer, setNextPlayer] = useState("X");
  const [activeBoard, setActiveBoard] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0 });

  const checkWinner = (board) => {
    for (let combo of winningCombos) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  const handleClick = (boardIndex, squareIndex) => {
    if (gameWinner || bigBoard[boardIndex]) return;
    if (activeBoard !== null && activeBoard !== boardIndex) return;

    const newBoards = boards.map((board, i) =>
      i === boardIndex
        ? board.map((sq, j) => (j === squareIndex ? nextPlayer : sq))
        : board
    );

    setBoards(newBoards);

    const smallWinner = checkWinner(newBoards[boardIndex]);
    if (smallWinner) {
      const newBigBoard = bigBoard.map((b, i) =>
        i === boardIndex ? smallWinner : b
      );
      setBigBoard(newBigBoard);
      setScores((prevScores) => ({
        ...prevScores,
        [smallWinner]: prevScores[smallWinner] + 1,
      }));

      const overallWinner = checkWinner(newBigBoard);
      if (overallWinner) {
        setGameWinner(overallWinner);
        return;
      }
    }

    setNextPlayer(nextPlayer === "X" ? "O" : "X");
    setActiveBoard(bigBoard[squareIndex] ? null : squareIndex);
  };

  const resetGame = () => {
    setBoards(Array(9).fill(Array(9).fill(null)));
    setBigBoard(Array(9).fill(null));
    setNextPlayer("X");
    setActiveBoard(null);
    setGameWinner(null);
  };

  const resetScores = () => {
    setScores({ X: 0, O: 0 });
  };

  return (
    <div className="game">
      {gameWinner && (
        <div className="game-over">
          <h2>Victory for {gameWinner}! Game over.</h2>
          <button onClick={resetGame}>Restart Game</button>
        </div>
      )}

      <div className="scoreboard">
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Games Won</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>X</td>
              <td>{scores.X}</td>
            </tr>
            <tr>
              <td>O</td>
              <td>{scores.O}</td>
            </tr>
          </tbody>
        </table>
        <button onClick={resetScores}>Reset Scores</button>
      </div>

      <div className="game-container">
        <div className="super-board">
          {bigBoard.map((winner, boardIndex) => (
            <div
              key={boardIndex}
              className={`small-board ${winner ? "won" : ""}`}
            >
              {winner ? (
                <span className="big-winner">{winner}</span>
              ) : (
                boards[boardIndex].map((square, squareIndex) => (
                  <button
                    key={squareIndex}
                    className="square"
                    onClick={() => handleClick(boardIndex, squareIndex)}
                    disabled={square || gameWinner}
                  >
                    {square}
                  </button>
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      {!gameWinner && <div className="toast">Next Player: {nextPlayer}</div>}
    </div>
  );
}

export default App;
