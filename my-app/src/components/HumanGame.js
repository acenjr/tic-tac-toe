import React, { useState, useCallback } from "react";
import { winningCombos } from "../constants/gameConstants";

export const HumanGame = () => {
  const [boards, setBoards] = useState(
    Array(9)
      .fill(null)
      .map(() => Array(9).fill(null))
  );
  const [bigBoard, setBigBoard] = useState(Array(9).fill(null));
  const [nextPlayer, setNextPlayer] = useState("X");
  const [activeBoard, setActiveBoard] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [lastMove, setLastMove] = useState(null);

  const checkWinner = useCallback((board) => {
    for (let combo of winningCombos) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }, []);

  const isBoardFull = useCallback((board) => {
    return board.every((cell) => cell !== null);
  }, []);

  const isValidMove = useCallback(
    (boardIndex, squareIndex) => {
      if (gameWinner) return false;
      if (boards[boardIndex][squareIndex]) return false;
      if (bigBoard[boardIndex]) return false;

      if (activeBoard === null) {
        return !bigBoard[boardIndex] && !isBoardFull(boards[boardIndex]);
      }

      return boardIndex === activeBoard;
    },
    [boards, bigBoard, activeBoard, gameWinner, isBoardFull]
  );

  const determineNextBoard = useCallback(
    (squareIndex) => {
      if (bigBoard[squareIndex] || isBoardFull(boards[squareIndex])) {
        return null;
      }
      return squareIndex;
    },
    [bigBoard, boards, isBoardFull]
  );

  const handleClick = useCallback(
    (boardIndex, squareIndex) => {
      if (!isValidMove(boardIndex, squareIndex)) return;

      const newBoards = boards.map((board, i) =>
        i === boardIndex
          ? board.map((sq, j) => (j === squareIndex ? nextPlayer : sq))
          : [...board]
      );
      setBoards(newBoards);
      setLastMove({ boardIndex, squareIndex });

      const smallWinner = checkWinner(newBoards[boardIndex]);
      if (smallWinner) {
        const newBigBoard = [...bigBoard];
        newBigBoard[boardIndex] = smallWinner;
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

      const nextBoard = determineNextBoard(squareIndex);
      setActiveBoard(nextBoard);
      setNextPlayer(nextPlayer === "X" ? "O" : "X");
    },
    [isValidMove, boards, bigBoard, nextPlayer, checkWinner, determineNextBoard]
  );

  const resetGame = () => {
    setBoards(
      Array(9)
        .fill(null)
        .map(() => Array(9).fill(null))
    );
    setBigBoard(Array(9).fill(null));
    setNextPlayer("X");
    setActiveBoard(null);
    setGameWinner(null);
    setLastMove(null);
  };

  const resetScores = () => {
    setScores({ X: 0, O: 0 });
  };

  return (
    <>
      {gameWinner && (
        <div className="game-over">
          <h2>{`Victory for ${gameWinner}! Game over.`}</h2>
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
              className={`small-board ${winner ? "won" : ""} ${
                activeBoard === boardIndex ||
                (activeBoard === null &&
                  !winner &&
                  !isBoardFull(boards[boardIndex]))
                  ? "active-board"
                  : ""
              }`}
            >
              {winner ? (
                <span className="big-winner">{winner}</span>
              ) : (
                boards[boardIndex].map((square, squareIndex) => (
                  <button
                    key={squareIndex}
                    className={`square ${
                      lastMove &&
                      lastMove.boardIndex === boardIndex &&
                      lastMove.squareIndex === squareIndex
                        ? "last-move"
                        : ""
                    }`}
                    onClick={() => handleClick(boardIndex, squareIndex)}
                    disabled={!isValidMove(boardIndex, squareIndex)}
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
    </>
  );
};
