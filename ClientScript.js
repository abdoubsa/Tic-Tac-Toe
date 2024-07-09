var clientID;
var gameID;
var socket;
var symbol;
const create = document.querySelector(".crtBtn");
create.disabled = true;
const join = document.querySelector(".jnBtn");
join.disabled = true;
join.addEventListener("click", () => {
  socket.send(
    JSON.stringify({
      tag: "join",
      clientID: clientID,
      gameID: gameID,
    })
  );
});
const board = document.querySelector(".game--container");
const list = document.querySelector("ul");
const clientText = document.getElementById("clientText");
const sidebar = document.querySelector(".sidebar");
const connect = document.querySelector(".cntBtn");
connect.addEventListener("click", (src) => {
  socket = new WebSocket("ws://localhost:8080");
  socket.onmessage = onMessage;
  src.target.disabled = true;
});
create.addEventListener("click", () => {
  console.log("i have hit the create button");
});

function onMessage(msg) {
  const data = JSON.parse(msg.data);
  switch (data.tag) {
    case "connected":
      clientID = data.clientID;
      console.log(data.clientID);
      clientText.innerHTML = `Your client ID is: ${clientID}`;
      create.disabled = false;
      join.disabled = false;
      break;
    case "gamesList":
      const games = data.list;
      while (list.firstChild) {
        list.removeChild(list.lastChild);
      }
      games.forEach((game) => {
        const li = document.createElement("li");
        li.innerText = game;
        li.style.textAlign = "center";
        list.appendChild(li);
        li.addEventListener("click", () => {
          gameID = game;
        });
      });

      break;
    case "created":
      gameID = data.gameID;
      create.disabled = true;
      join.disabled = true;
      // console.log(gameID);
      break;
    case "joined":
      document.querySelector(".game--container").style.display = "grid";
      symbol = data.symbol;
      if (symbol == "x") {
        board.classList.add("cross");
      } else {
        board.classList.add("circle");
      }
  }
}

create.addEventListener("click", () => {
  socket.send(
    JSON.stringify({
      tag: "create",
      clientID: clientID,
    })
  );
});
