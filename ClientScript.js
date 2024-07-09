var clientID;
var gameID;
var socket;
var symbol;
var clickedCell;
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

const cells = document.querySelectorAll(".cell");
const board = document.querySelector(".game--container");
const list = document.querySelector("#gamesList");
const clientText = document.getElementById("clientText");
const sidebar = document.querySelector(".sidebar");
const connect = document.querySelector(".cntBtn");
connect.addEventListener("click", (src) => {
  socket = new WebSocket("ws://localhost:8080");
  socket.onmessage = onMessage;
  src.target.disabled = true;
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

          // Add the 'clicked' class to the clicked item
          li.classList.add("clicked");
        });
      });

      break;
    case "created":
      gameID = data.gameID;
      create.disabled = true;
      join.disabled = true;
      break;
    case "joined":
      document.querySelector(".game--container").style.display = "grid";
      symbol = data.symbol;
      if (symbol == "x") {
        board.classList.add("cross");
      } else {
        board.classList.add("circle");
      }
      break;
    case "updateBoard":
      cells.forEach((cell) => {
        if (cell.classList.contains("cross")) {
          cell.classList.remove("cross");
        } else if (cell.classList.contains("circle")) {
          cell.classList.remove("circle");
        }
      });
      for (i = 0; i < 9; i++) {
        if (data.board[i] == "x") cells[i].classList.add("cross");
        else if (data.board[i] == "o") cells[i].classList.add("circle");
      }
      if (data.isTurn) {
        makeMove();
      }
      break;
    case "winner":
      alert(`The winner is ${data.winner}`);
      break;
    case "gameDraw":
      alert("The game is a draw");
      break;
  }
}

function makeMove() {
  cells.forEach((cell) => {
    if (
      !cell.classList.contains("cross") &&
      !cell.classList.contains("circle")
    ) {
      cell.addEventListener("click", cellClicked);
    }
  });
}
function cellClicked(src) {
  let icon;
  if (symbol == "x") {
    icon = "cross";
  } else {
    icon = "circle";
  }
  src.target.classList.add(icon);
  clickedCell = src;
  const board = [];
  for (i = 0; i < 9; i++) {
    if (cells[i].classList.contains("circle")) {
      board[i] = "o";
    } else if (cells[i].classList.contains("cross")) {
      board[i] = "x";
    } else {
      board[i] = "";
    }
  }
  cells.forEach((cell) => {
    cell.removeEventListener("click", cellClicked);
  });
  socket.send(
    JSON.stringify({
      tag: "moveMade",
      board: board,
      clientID: clientID,
      gameID: gameID,
      clickedCell: clickedCell,
    })
  );
}

create.addEventListener("click", () => {
  socket.send(
    JSON.stringify({
      tag: "create",
      clientID: clientID,
    })
  );
});
