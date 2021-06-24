//  Checks if 2 segments intersect
function intersect(point1, point2, segment, gameState) {
  //  Check orientation
  var orient1 = orientation(point1, point2, segment.inner);
  var orient2 = orientation(point1, point2, segment.outer);
  var orient3 = orientation(segment.inner, segment.outer, point1);
  var orient4 = orientation(segment.inner, segment.outer, point2);

  if (orient1 != orient2 && orient3 != orient4) {
    //  Special case only if expanding from initial endSegment. endSegment will start from inner point of startSegment
    if (isEqual(point2, segment.outer) || isEqual(point2, segment.inner)) {
      return false;
    }
    return true;
  }

  //  If Colinear
  if (orient1 == 0 && onSegment(point1, point2, segment.inner) ||
      orient2 == 0 && onSegment(point1, point2, segment.outer) ||
      orient3 == 0 && onSegment(segment.inner, segment.outer, point1) ||
      orient4 == 0 && onSegment(segment.inner, segment.outer, point2)) {
        if (isEqual(point2, segment.outer) || isEqual(point2, segment.inner)) {
          if (!onSegment(segment.inner, segment.outer, point1)) {
            return false;
          }
        }
        return true;
      }

  return false;
}

//  Checks for intersections with existing segments
function checkIntersection(point, endPoint, gameState) {
  for (var i=0; i < gameState.segments.length; i++) {
    if (intersect(point, (endPoint === "start") ? gameState.startSegment.outer : gameState.endSegment.outer, gameState.segments[i], gameState)) {
      return true;
    }
  }

  //  Checks for intersections with end segments.
  if (gameState.startSegment.inner.x !== -1) {
    if (endPoint === "start") {
      if (!intersect(point, gameState.startSegment.outer, gameState.endSegment, gameState) && (orientation(gameState.startSegment.inner, gameState.startSegment.outer, point) !== 0 || !onSegment(gameState.startSegment.inner, gameState.startSegment.outer, point))) {
        return false;
      }
      return true;
    }
    else if (endPoint === "end") {
      if (!intersect(point, gameState.endSegment.outer, gameState.startSegment, gameState) && (orientation(gameState.endSegment.inner, gameState.endSegment.outer, point) !== 0 || !onSegment(gameState.endSegment.inner, gameState.endSegment.outer, point))) {
        return false;
      }
      return true;
    }
  }
  return false;
}

//  Returns the orientation (clockwise, counterclockwise, colinear)
function orientation (point1, point2, point3) {
  var orient = (point2.y - point1.y) * (point3.x-point2.x) - (point2.x - point1.x) * (point3.y - point2.y);

  //  Colinear
  if (orient == 0) {
    return 0;
  }

  //  1 if clockwise, 2 if counterclockwise
  return (orient > 0) ? 1 : 2;
}

//  Checks if colinear point3 is on line segment point1-point2
function onSegment(point1, point2, point3) {
  if (point3.x <= Math.max(point1.x, point2.x) &&
      point3.x >= Math.min(point1.x, point2.x) &&
      point3.y <= Math.max(point1.y, point2.y) &&
      point3.y >= Math.min(point1.y, point2.y)) {
        return true;
      }
  return false;
}

//  Checks if a segment extends another using slope
function extension(point, segment) {

  if (getSlope(point, segment.outer) == getSlope(segment.inner, segment.outer)) {
    return true;
  }

  return false;
}

//  Gets the slope of a segment
function getSlope(point1, point2) {
  var slope = (point1.y-point2.y)/(point1.x-point2.x);
  if (slope == -Infinity) {
    slope *= -1;
  }
  return slope;
}

//  Checks all nearest possible moves for intersections with segments
function checkGameOver(gameState) {
  var startPoint = {
    x: gameState.startSegment.outer.x,
    y: gameState.startSegment.outer.y
  }
  var endPoint = {
    x: gameState.endSegment.outer.x,
    y: gameState.endSegment.outer.y
  }
  for (var i=-1; i<=1; i++) {
    for (var j=-1; j<=1; j++) {
      if (i == 0 && j == 0) {
        continue;
      }
      if (startPoint.x+i >=0 &&
          startPoint.x+i <=3 &&
          startPoint.y+j >=0 &&
          startPoint.y+j <=3) {
            if (!checkIntersection({x: startPoint.x+i, y: startPoint.y+j}, "start", gameState)) {
              return false;
            }
          }

      if (endPoint.x+i >=0 &&
          endPoint.x+i <=3 &&
          endPoint.y+j >=0 &&
          endPoint.y+j <=3) {
            if (!checkIntersection({x: endPoint.x+i, y: endPoint.y+j}, "end", gameState)) {
              return false;
            }
          }
    }
  }

  return true;
}

//  Checks if points are equal
function isEqual(p1, p2) {
  return (p1.x == p2.x && p1.y == p2.y) ? true : false;
}

module.exports = {
  intersect,
  checkIntersection,
  orientation,
  onSegment,
  extension,
  getSlope,
  checkGameOver,
  isEqual
}
