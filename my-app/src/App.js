import React, { useState, useCallback, useEffect } from "react";
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

const AI_DEPTHS = {
  easy: 1,
  medium: 3,
  hard: 5,
};

function App() {
  const [boards, setBoards] = useState(Array(9).fill(Array(9).fill(null)));
  const [bigBoard, setBigBoard] = useState(Array(9).fill(null));
  const [nextPlayer, setNextPlayer] = useState("X");
  const [activeBoard, setActiveBoard] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [gameMode, setGameMode] = useState("human");
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [lastMove, setLastMove] = useState(null);
  const [isAIThinking, setIsAIThinking] = useState(false);

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
    (board, depth) => {
      const winner = checkWinner(board);
      if (winner === "O") return 10 - depth;
      if (winner === "X") return depth - 10;
      if (isBoardFull(board)) return 0;
      return null;
    },
    [checkWinner, isBoardFull]
  );

  const minimax = useCallback(
    (board, depth, isMaximizing, alpha, beta) => {
      const score = evaluateBoard(board, depth);
      if (score !== null) return score;
      if (depth === 0) return 0;

      if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
          if (!board[i]) {
            board[i] = "O";
            const score = minimax(board, depth - 1, false, alpha, beta);
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
            const score = minimax(board, depth - 1, true, alpha, beta);
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

      for (let i = 0; i < 9; i++) {
        if (!currentBoard[i]) {
          currentBoard[i] = "O";
          const score = minimax(
            currentBoard,
            depth,
            false,
            -Infinity,
            Infinity
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
    [boards, aiDifficulty, minimax]
  );

  const findValidBoard = useCallback(
    (boards, bigBoard) => {
      for (let i = 0; i < 9; i++) {
        if (!bigBoard[i] && !isBoardFull(boards[i])) return i;
      }
      return null;
    },
    [isBoardFull]
  );

  const handleClick = useCallback(
    (boardIndex, squareIndex) => {
      if (gameWinner || bigBoard[boardIndex]) return;
      if (activeBoard !== null && activeBoard !== boardIndex) return;
      if (boards[boardIndex][squareIndex]) return;

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

      const nextBoardIndex = bigBoard[squareIndex] ? null : squareIndex;
      setActiveBoard(nextBoardIndex);
      setNextPlayer(nextPlayer === "X" ? "O" : "X");
    },
    [gameWinner, bigBoard, boards, nextPlayer, activeBoard, checkWinner]
  );

  useEffect(() => {
    if (
      gameMode === "ai" &&
      nextPlayer === "O" &&
      !gameWinner &&
      !isAIThinking
    ) {
      setIsAIThinking(true);
      const aiBoard =
        activeBoard !== null ? activeBoard : findValidBoard(boards, bigBoard);

      if (aiBoard !== null) {
        const aiSquare = getAIMove(aiBoard);
        if (aiSquare !== null) {
          setTimeout(() => {
            handleClick(aiBoard, aiSquare);
            setIsAIThinking(false);
          }, 1500);
        }
      }
    }
  }, [
    nextPlayer,
    gameMode,
    activeBoard,
    gameWinner,
    boards,
    bigBoard,
    findValidBoard,
    getAIMove,
    isAIThinking,
    handleClick,
  ]);

  const resetGame = () => {
    setBoards(Array(9).fill(Array(9).fill(null)));
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

  return React.createElement(
    "div",
    { className: "game" },
    gameWinner &&
      React.createElement(
        "div",
        { className: "game-over" },
        React.createElement(
          "h2",
          null,
          `Victory for ${gameWinner}! Game over.`
        ),
        React.createElement("button", { onClick: resetGame }, "Restart Game")
      ),

    React.createElement(
      "div",
      { className: "scoreboard" },
      React.createElement(
        "div",
        { className: "game-controls" },
        React.createElement(
          "select",
          {
            value: gameMode,
            onChange: (e) => {
              setGameMode(e.target.value);
              resetGame();
            },
            className: "mode-select",
          },
          React.createElement("option", { value: "human" }, "Human vs Human"),
          React.createElement("option", { value: "ai" }, "Human vs AI")
        ),
        gameMode === "ai" &&
          React.createElement(
            "select",
            {
              value: aiDifficulty,
              onChange: (e) => setAiDifficulty(e.target.value),
              className: "difficulty-select",
            },
            React.createElement("option", { value: "easy" }, "Easy"),
            React.createElement("option", { value: "medium" }, "Medium"),
            React.createElement("option", { value: "hard" }, "Hard")
          )
      ),
      React.createElement(
        "table",
        null,
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement("th", null, "Player"),
            React.createElement("th", null, "Games Won")
          )
        ),
        React.createElement(
          "tbody",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement("td", null, "X"),
            React.createElement("td", null, scores.X)
          ),
          React.createElement(
            "tr",
            null,
            React.createElement("td", null, "O"),
            React.createElement("td", null, scores.O)
          )
        )
      ),
      React.createElement("button", { onClick: resetScores }, "Reset Scores")
    ),

    React.createElement(
      "div",
      { className: "game-container" },
      React.createElement(
        "div",
        { className: "super-board" },
        bigBoard.map((winner, boardIndex) =>
          React.createElement(
            "div",
            {
              key: boardIndex,
              className: `small-board ${winner ? "won" : ""} ${
                activeBoard === boardIndex ? "active-board" : ""
              }`,
            },
            winner
              ? React.createElement("span", { className: "big-winner" }, winner)
              : boards[boardIndex].map((square, squareIndex) =>
                  React.createElement(
                    "button",
                    {
                      key: squareIndex,
                      className: `square ${
                        lastMove &&
                        lastMove.boardIndex === boardIndex &&
                        lastMove.squareIndex === squareIndex
                          ? "last-move"
                          : ""
                      }`,
                      onClick: () => handleClick(boardIndex, squareIndex),
                      disabled:
                        square ||
                        gameWinner ||
                        (activeBoard !== null && activeBoard !== boardIndex) ||
                        (gameMode === "ai" && nextPlayer === "O"),
                    },
                    square
                  )
                )
          )
        )
      )
    ),

    !gameWinner &&
      React.createElement(
        "div",
        { className: "toast" },
        isAIThinking ? "AI is thinking..." : `Next Player: ${nextPlayer}`
      )
  );
}

export default App;
