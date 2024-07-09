var clients = {};
var games = {};

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
  }
}
