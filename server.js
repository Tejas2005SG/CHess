const express = require("express");
const socket = require("socket.io");
const path = require("path");
const { Chess } = require("chess.js");
const ejs = require("ejs");
const http = require("http");
const { title } = require("process");
// const { unlink } = require("fs");
// const { unsubscribe } = require("diagnostics_channel");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("src"));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess.com" });
});

// By writing below code The socket is been set up to backend.
// writing code in below will also decide which type of connection to be followed.
io.on("connection", (uniqueSocket) => {
  // here uniqueSocket means every player join the game or website or app then the user has another socket and this socket is unquie for every user.
  // more notes of emit,         is on notes.yaml
  if (!players.white) {
    players.white = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniqueSocket.id;
    uniqueSocket.emit("playerRole", "b");
  } else {
    uniqueSocket.emit("spectatorRole");
  }

  uniqueSocket.on("disconnect", () => {
    if (uniqueSocket.id === players.white) {
      delete players.white;
    } else if (uniqueSocket.id === players.black) {
      delete players.black;
    }
  });

  uniqueSocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniqueSocket.id !== players.white) return;
      if (chess.turn() === "b" && uniqueSocket.id !== players.black) return;

      const result = chess.move(move);
    if(result){
        currentPlayer=chess.turn();
        io.emit("move",move)  // io.emit means to show move played to all including spectators
        io.emit("boardState", chess.fen());
    }else{
        // console.log("Invalid Move");
        uniqueSocket.emit("invalidMove", move);
    }

    } catch (err) {
        console.log(err);
        uniqueSocket.emit("Invalid Move", move);
    }
  });
});

server.listen(3000),
  () => {
    console.log("Server is running Successfully!!!");
  };
