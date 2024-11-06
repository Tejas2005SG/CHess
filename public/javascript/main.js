const socket = io();
const chess = new Chess();

let chessBoard = document.getElementById("chess-board");
alert("You can play Chess Online only with someone of your level")
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
// let spectatorRole = null;

// Renders the chessboard based on the current game state
function renderBoard() {
  const board = chess.board();
  chessBoard.innerHTML = "";
  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerText = getPieceUnicode(square);
        
        // Make the piece draggable only if the player's role matches the piece color
        pieceElement.draggable = playerRole === square.color;

        // Drag start event
        pieceElement.addEventListener("dragstart", (evt) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            evt.dataTransfer.setData("text/plain", "");
          }
        });

        // Drag end event
        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });
        squareElement.appendChild(pieceElement);
      }

      // Drag over event to allow dropping
      squareElement.addEventListener("dragover", (evt) => {
        evt.preventDefault();
      });

      // Drop event to handle move
      squareElement.addEventListener("drop", (evt) => {
        evt.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });
      chessBoard.appendChild(squareElement);
    });
  });

  // Flip the board for black player
  if (playerRole === "b") {
    chessBoard.classList.add("flipped");
  } else {
    chessBoard.classList.remove("flipped");
  }
}

// Handles the move and emits it to the server
const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q", // Automatically promotes to queen if reaching the end
  };

  // Validate and perform the move
  // if (chess.move(move)) {
    socket.emit("move", move);
  // } else {
  //   renderBoard(); // Re-render if move is invalid
  // }
};

// Maps pieces to their Unicode symbols
const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "♙",
    r: "♖",
    k: "♔",
    q: "♕",
    b: "♗",
    n: "♘",
    K: "♚",
    Q: "♛",
    R: "♜",
    B: "♝",
    N: "♞",
    P: "♟",
  };
  return unicodePieces[piece.type] || "";
};

// Event listeners for socket communication
socket.on("playerRole", (role) => {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  renderBoard();
});
socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});

socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});

// Initial board rendering
renderBoard();
