const path = require("path");
const fs = require("fs");
var clients = {};
var games = {};
var moveNumber = 0;
const logFile = path.resolve(__dirname, "game-events.log");
const logStream = fs.createWriteStream(logFile, { flags: "a" });
const WIN_STATES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const http = require("http")
  .createServer()
  .listen(8080, console.log("listening on port 8080"));
const server = require("websocket").server;
const socket = new server({ httpServer: http });
socket.on("request", (req) => {
  const conn = req.accept(null, req.origin);
  const clientID =
    Math.round(Math.random() * 100) +
    Math.round(Math.random() * 100) +
    Math.round(Math.random() * 100);
  clients[clientID] = { conn: conn };
  conn.send(
    JSON.stringify({
      tag: "connected",
      clientID: clientID,
    })
  );

  sendAvailGames();
  conn.on("message", onMessage);
});

function sendAvailGames() {
  const gamesList = [];
  for (const game in games) {
    if (games[game].players.length < 2) {
      gamesList.push(game);
    }
  }
  for (const client in clients) {
    clients[client].conn.send(
      JSON.stringify({
        tag: "gamesList",
        list: gamesList,
      })
    );
  }
}

function onMessage(msg) {
  const data = JSON.parse(msg.utf8Data);
  switch (data.tag) {
    case "create":
      const gameID =
        Math.round(Math.random() * 100) +
        Math.round(Math.random() * 100) +
        Math.round(Math.random() * 100);
      const board = ["", "", "", "", "", "", "", "", ""];
      var player = {
        clientID: data.clientID,
        symbol: "x",
        isTurn: true,
      };
      const players = Array(player);

      games[gameID] = {
        board: board,
        players: players,
      };
      clients[data.clientID].conn.send(
        JSON.stringify({
          tag: "created",
          gameID: gameID,
        })
      );
      sendAvailGames();
      break;
    case "join":
      player = {
        clientID: data.clientID,
        symbol: "o",
        isTurn: false,
      };
      games[data.gameID].players.push(player);
      sendAvailGames();
      games[data.gameID].players.forEach((player) => {
        clients[player.clientID].conn.send(
          JSON.stringify({
            tag: "joined",
            gameID: data.gameID,
            symbol: player.symbol,
          })
        );
      });
      updateBoard(data.gameID);
      break;
    case "moveMade":
      games[data.gameID].board = data.board;
      logEvent(`a player has made a move in ${data.clickedCell}`);
      const isWinner = winState(data.gameID);
      const isDraw = drawState(data.gameID);
      if (isWinner) {
        games[data.gameID].players.forEach((player) => {
          clients[player.clientID].conn.send(
            JSON.stringify({
              tag: "winner",
              winner: player.symbol,
            })
          );
        });
      } else if (isDraw) {
        games[data.gameID].players.forEach((player) => {
          clients[player.clientID].conn.send(
            JSON.stringify({
              tag: "gameDraw",
            })
          );
        });
      } else {
        games[data.gameID].players.forEach((player) => {
          player.isTurn = !player.isTurn;
        });
        updateBoard(data.gameID);
      }
      break;
  }
}
function updateBoard(gameID) {
  games[gameID].players.forEach((player) => {
    clients[player.clientID].conn.send(
      JSON.stringify({
        tag: "updateBoard",
        isTurn: player.isTurn,
        board: games[gameID].board,
      })
    );
  });
}

function winState(gameID) {
  return WIN_STATES.some((row) => {
    return (
      row.every((cell) => {
        return games[gameID].board[cell] == "x";
      }) ||
      row.every((cell) => {
        return games[gameID].board[cell] == "0";
      })
    );
  });
}

function drawState(gameID) {
  return WIN_STATES.every((row) => {
    return (
      row.some((cell) => {
        return games[gameID].board[cell] == "x";
      }) ||
      row.some((cell) => {
        return games[gameID].board[cell] == "o";
      })
    );
  });
}

function logEvent(event) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${event}\n`;
  console.log(logMessage); // Log to console
  logStream.write(logMessage); // Log to file
}
