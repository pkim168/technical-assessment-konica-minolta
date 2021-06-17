const express = require('express');
const path = require('path');
const http = require('http');

const Websocket = require('ws');

const app = express();
const server = http.createServer(app);
const wsServer = new Websocket.Server({ server });


// make everything one object called gameState?
// Keep track of points visited and ends of the line
var grid = Array.from({length: 4}, () => Array.from({length: 4}, () => 0));
var emptyGrid = true;
var start = {x: -1, y: -1};
var end = {x: -1, y: -1};
var clickOne = false; // false if waiting for 1st point, Object if waiting for 2nd point
var endpoint = ""; // Records last endpoint clicked on
var player = 1;

// Move functions to another file?
// Reset grid for new game
function resetGame() {
  grid = Array.from({length: 4}, () => Array.from({length: 4}, () => 0));
  emptyGrid = true;
  start = {x: -1, y: -1};
  end = {x: -1, y: -1};
  clickOne = false;
  player = 1;
  endpoint = "";
}

function checkValidStart(point) {
  var flag = false;
  var data = {};

  // Valid if grid is empty or if clicked point is an endpoint
  if (emptyGrid) {
    grid[body.x][body.y] = 1;
    start = body;
    end = body;
    flag = true;
  }
  else if (start.x == body.x && start.y == body.y) {
    endpoint = "start";
    flag = true;
  }
  else if (end.x == body.x && end.y == body.y) {
    endpoint = "end";
    flag = true;
  }

  // Valid Start Node
  if (flag) {
    clickOne = {x: body.x, y: body.y, click: endpoint};
    data = {
      id: id,
      msg: "VALID_START_NODE",
      body: {
        newLine: null,
        heading: "Player "+player,
        message: "Select a second node to complete the line"
      }
    };
    return data;
  }

  // Invalid Start Node
  data = {
    id: id,
    msg: "INVALID_START_NODE",
    body: {
      newLine: null,
      heading: "Player "+player,
      message: "Awaiting Player "+player+"'s Move"
    }
  };
  return data;
}

function checkValidEnd(point) {

  // Valid if point hasn't been visited and point is within 1 distance of the start point
  if (grid[body.x][body.y] == 0) {
    if (Math.abs(clickOne.x - body.x) == 1 || Math.abs(clickOne.y - body.y) == 1) {
      grid[body.x][body.y] = 1;
      clickOne = false;
      if (endpoint == "start") {
        start = {x: body.x, y: body.y};
      }
      else {
        end = {x: body.x, y: body.y};
      }
      return true;
    }
  }
}

// Check if new point is valid
function checkValid(point) {
  // First click must be the same point as the start or end of the line
  if (!clickOne) {
    if ((start.x == body.x && start.y == body.y) || (end.x == body.x && end.y == body.y)) {
      clickOne = {x: body.x, y: body.y};
      return true;
    }
  }
  else {
    // Second click must not overlap with a visited point and must be a distance of 1 away from the 1st click
    if (grid[body.x][body.y] == 0) {
      if (Math.abs(clickOne.x - body.x) == 1 || Math.abs(clickOne.y - body.y) == 1) {
        clickOne = {};
        return true;
      }
    }
  }
  return false;
}

wsServer.on('connection', function (ws, request) {
  ws.on('message', function(message) {
    message = JSON.parse(message);
    var body = message.body;
    const id = message.id;
    var payload = {};
    switch (message.msg) {
      case "ERROR":
        console.log("error: ", message.body);
        return;

      // Move to functions in another file?
      case "INITIALIZE":
        resetGrid();
        payload = {
          id: id,
          msg: "INITIALIZE",
          body: {
            newLine: null,
            heading: "Player 1",
            message: "Awaiting Player 1's Move"
          }
        };
        break;

      case "NODE_CLICKED":
        if (clickOne) {
          payload = checkValidStart(body);
        }
        else {
          payload = checkValidEnd(body);
        }
        checkGameOver();

        else if (checkValid(body)) {
          grid[body.x][body.y] = 1;
          if (clickOne) {
            payload = {
              id: id,
              msg: "VALID_START_NODE",
              body: {
                newLine: null,
                heading: "Player "+player,
                message: "Select a second node to complete the line"
              }
            };
          }
          else {
            player = -1*player + 3;
            payload = {
              id: id,
              msg: "VALID_END_NODE",
              body: {
                newLine: null,
                heading: "Player "+player,
                message: "Awaiting Player "+player+"'s Move"
              }
            };
          }
        }
        else {
          clickOne = {};
          payload = {
            id: id,
            msg: "INVALID_START_NODE",
            body: {
              newLine: null,
              heading: "Player "+player,
              message: "Awaiting Player "+player+"'s Move"
            }
          };
        }
    }

    ws.send(JSON.stringify(payload));
    console.log(message);
  });
  ws.on('error', function(message) {

  })
  // console.log(rId);
})

server.listen(8081, function() {
  console.log('Server listening on port 8081')
})
