import React, { useState, useCallback, useEffect } from "react";
import { winningCombos, AI_DEPTHS } from "../constants/gameConstants";

export const AIGame = ({ aiDifficulty }) => {
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
  const [isAIThinking, setIsAIThinking] = useState(false);

  // AI logic functions
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

  const evaluateBoard = useCallback(
    (board, depth, isSmallBoard = false) => {
      const winner = checkWinner(board);
      if (winner === "O") return 10 + depth;
      if (winner === "X") return -10 - depth;
      if (isBoardFull(board)) return 0;

      if (isSmallBoard) {
        let score = 0;
        if (board[4] === "O") score += 2;
        if (board[4] === "X") score -= 2;

        const corners = [0, 2, 6, 8];
        corners.forEach((corner) => {
          if (board[corner] === "O") score += 1;
          if (board[corner] === "X") score -= 1;
        });

        return score;
      }

      return null;
    },
    [checkWinner, isBoardFull]
  );

  const minimax = useCallback(
    (board, depth, isMaximizing, alpha, beta, isSmallBoard = false) => {
      const score = evaluateBoard(board, depth, isSmallBoard);
      if (score !== null) return score;
      if (depth === 0) return evaluateBoard(board, 0, true) || 0;

      if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
          if (!board[i]) {
            board[i] = "O";
            const score = minimax(
              board,
              depth - 1,
              false,
              alpha,
              beta,
              isSmallBoard
            );
            board[i] = null;
            bestScore = Math.max(score, bestScore);
            alpha = Math.max(alpha, bestScore);
            if (beta <= alpha) break;
          }
        }
        return bestScore;
      } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
          if (!board[i]) {
            board[i] = "X";
            const score = minimax(
              board,
              depth - 1,
              true,
              alpha,
              beta,
              isSmallBoard
            );
            board[i] = null;
            bestScore = Math.min(score, bestScore);
            beta = Math.min(beta, bestScore);
            if (beta <= alpha) break;
          }
        }
        return bestScore;
      }
    },
    [evaluateBoard]
  );

  const getAIMove = useCallback(
    (boardIndex) => {
      const currentBoard = [...boards[boardIndex]];
      let bestScore = -Infinity;
      let bestMove = null;
      const depth = AI_DEPTHS[aiDifficulty];

      // Check for winning moves and blocking moves
      for (let i = 0; i < 9; i++) {
        if (!currentBoard[i]) {
          currentBoard[i] = "O";
          if (checkWinner(currentBoard) === "O") {
            currentBoard[i] = null;
            return i;
          }
          currentBoard[i] = null;

          currentBoard[i] = "X";
          if (checkWinner(currentBoard) === "X") {
            currentBoard[i] = null;
            return i;
          }
          currentBoard[i] = null;
        }
      }

      for (let i = 0; i < 9; i++) {
        if (!currentBoard[i]) {
          currentBoard[i] = "O";
          const score = minimax(
            currentBoard,
            depth,
            false,
            -Infinity,
            Infinity,
            true
          );
          currentBoard[i] = null;
          if (score > bestScore) {
            bestScore = score;
            bestMove = i;
          }
        }
      }
      return bestMove;
    },
    [boards, aiDifficulty, minimax, checkWinner]
  );

  // Game logic functions
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

  // AI move effect
  useEffect(() => {
    if (nextPlayer === "O" && !gameWinner && !isAIThinking) {
      setIsAIThinking(true);
      const aiBoard =
        activeBoard !== null &&
        !bigBoard[activeBoard] &&
        !isBoardFull(boards[activeBoard])
          ? activeBoard
          : boards.findIndex(
              (board, index) => !bigBoard[index] && !isBoardFull(board)
            );

      if (aiBoard !== -1) {
        const aiSquare = getAIMove(aiBoard);
        if (aiSquare !== null) {
          setTimeout(() => {
            handleClick(aiBoard, aiSquare);
            setIsAIThinking(false);
          }, 1000);
        }
      }
    }
  }, [
    nextPlayer,
    activeBoard,
    gameWinner,
    boards,
    bigBoard,
    getAIMove,
    isAIThinking,
    handleClick,
    isBoardFull,
  ]);

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
    setIsAIThinking(false);
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
                    disabled={
                      !isValidMove(boardIndex, squareIndex) ||
                      nextPlayer === "O"
                    }
                  >
                    {square}
                  </button>
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      {!gameWinner && (
        <div className="toast">
          {isAIThinking ? "AI is thinking..." : `Next Player: ${nextPlayer}`}
        </div>
      )}
    </>
  );
};
