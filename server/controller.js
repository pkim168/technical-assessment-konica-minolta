const {
  intersect,
  checkIntersection,
  orientation,
  onSegment,
  extension,
  getSlope,
  checkGameOver,
  isEqual
} = require('./helper.js');

var gameState = {
  segments: [],                                                           //  Records all line segments except startSegment and endSegment
  startSegment: {inner: {x: -1, y: -1}, outer: {x: -1, y: -1}},           //  Records most recent segment of 1st end of line
  endSegment: {inner: {x: -1, y: -1}, outer: {x: -1, y: -1}},             //  Records most recent segment of 2nd end of line
  click: 1,                                                               //  Records if first point or 2nd point to be clicked
  firstPoint: {x: -1, y: -1},                                             //  Records 1st point of new segment
  endPoint: "start",                                                      //  Records which endpoint is being built upon
  player: 1                                                               //  Records player turn
}
var payload = {};

//  Reset for new game
function resetState() {
  gameState = {
    segments: [],
    startSegment: {inner: {x: -1, y: -1}, outer: {x: -1, y: -1}},
    endSegment: {inner: {x: -1, y: -1}, outer: {x: -1, y: -1}},
    click: 1,
    firstPoint: {x: -1, y: -1},
    endPoint: "start",
    player: 1
  }
  payload = {};
}

//  Checks if start of line segment is valid
function checkValidStart(point) {
  var valid = true;
  var payload = {
    msg: "INVALID_START_NODE",
    body: {
      newLine: null,
      heading: "Player "+gameState.player,
      message: "You must start on either end of the path!"
    }
  };

  //  Valid if grid is empty or if clicked point is an endpoint
  if (gameState.startSegment.inner.x === -1) {
    gameState.firstPoint = point;
  }
  else if (isEqual(gameState.startSegment.outer, point)) {
    gameState.firstPoint = gameState.startSegment.outer;
    gameState.endPoint = "start";
  }
  else if (isEqual(gameState.endSegment.outer, point)) {
    gameState.firstPoint = gameState.endSegment.outer;
    gameState.endPoint = "end";
  }
  else {
    valid = false;
  }

  //  Valid Start Node
  if (valid) {
    payload = {
      msg: "VALID_START_NODE",
      body: {
        newLine: null,
        heading: "Player "+gameState.player,
        message: "Select a second node to complete the line"
      }
    };
    gameState.click = 2;
  }

  return payload;
}

//  Checks if end of line segment is valid
function checkValidEnd(point) {
  var valid = true;
  var payload = {
    msg: "INVALID_END_NODE",
    body: {
      newLine: null,
      heading: "Player "+gameState.player,
      message: "Invalid Move!"
    }
  };

  if (isEqual(point, gameState.firstPoint)) {
    gameState.click = 1;
    return payload;
  }

  if (gameState.startSegment.inner.x === -1) {
    var slope = Math.abs(getSlope(point, gameState.firstPoint));
    if (slope !== 0 && slope !== 1 && Number.isFinite(slope)) {
      gameState.click = 1;
      return payload;
    }
  }
  else if (gameState.endPoint === "start") {
    var slope = Math.abs(getSlope(point, gameState.startSegment.outer));
    if (slope !== 0 && slope !== 1 && Number.isFinite(slope)) {
      gameState.click = 1;
      return payload;
    }
  }
  else if (gameState.endPoint === "end") {
    var slope = Math.abs(getSlope(point, gameState.endSegment.outer));
    if (slope !== 0 && slope !== 1 && Number.isFinite(slope)) {
      gameState.click = 1;
      return payload;
    }
  }

  //  Check for intersections with existing segments
  if (checkIntersection(point, gameState.endPoint, gameState)){
    gameState.click = 1;
    return payload;
  }

  //  If new line is an extension of an existing line, update startSegment and endSegment
  //  If new line is not an extension, push the old startSegment and endSegment to the segments array and replace startSegment and endSegment
  if (gameState.startSegment.inner.x !== -1 && gameState.endPoint === "start" && extension(point, gameState.startSegment)) {
    gameState.startSegment.outer = point;
  }
  else if (gameState.startSegment.inner.x !== -1 && gameState.endPoint === "end" && extension(point, gameState.endSegment)) {
    gameState.endSegment.outer = point;
  }
  else {
    //  Checks if 1st line segment in game
    if (gameState.startSegment.inner.x === -1) {
      gameState.startSegment = {inner: gameState.firstPoint, outer: point};
      gameState.endSegment = {inner: gameState.firstPoint, outer: gameState.firstPoint};
    }
    else if (gameState.endPoint === "start") {
      gameState.segments.push(gameState.startSegment);
      gameState.startSegment = {inner: gameState.firstPoint, outer: point};
    }
    else if (gameState.endPoint === "end") {
      gameState.segments.push(gameState.endSegment);
      gameState.endSegment = {inner: gameState.firstPoint, outer: point};
    }
  }
  gameState.player = -1*gameState.player+3;

  payload = {
    msg: "VALID_END_NODE",
    body: {
      newLine: {
        start: gameState.firstPoint,
        end: point
      },
      heading: "Player "+gameState.player,
      message: "Awaiting Player "+gameState.player+"'s Move"
    }
  }
  gameState.click = 1;

  if (checkGameOver(gameState)) {
    payload.msg = "GAME OVER";
    payload.body.heading = "Game Over";
    payload.body.message = "Player "+(-1*gameState.player+3)+" Wins"
  }

  return payload;
}

//  Handles initialization
function initialize(message) {
  resetState();
  payload = {
    id: message.id,
    msg: "INITIALIZE",
    body: {
      newLine: null,
      heading: "Player 1",
      message: "Awaiting Player 1's Move"
    }
  };
  return payload;
}

//  Handles clicks
function click(message) {
  var body = message.body;
  if (gameState.click === 1) {
    payload = checkValidStart(body);
  }
  else if (gameState.click === 2) {
    payload = checkValidEnd(body);
  }
  payload.id = message.id;
  return payload;
}

//  Handles errors
function error(message) {
  console.log("ERROR: ", message.body);
  return;
}

module.exports = {
  initialize,
  error,
  click
}
