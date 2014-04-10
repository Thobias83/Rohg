/*
    Rohg
    Copyright (C) 2014  Ben Rutten

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
onmessage = function (event) {
	var result = Maps.GetNewMap(event.data.seed, event.data.width, event.data.height, event.data.avoidDiagonal);
	postMessage(result);
};


var Maps = new function () {
	
	/*********************************************************************************
	Variables
	**********************************************************************************/
	var ROOM_PROX_RADIUS = 4;
	var SORT_BY_AREA = false;
	var AVOID_DIAGONAL = true;
	var _map = [];
	var _numberOfRooms;
	var _width;
	var _height;
	var _rooms = [];
	var _carvedRooms = [];
	var _availablePoints = [];
	var _unconnectedStack = [];
	var _connectedStack = [];
	var _currentPosition;
	var _doors = [];
	
	/*********************************************************************************
	Enums
	**********************************************************************************/
	var DIRECTION = {
		NORTH:0,
		EAST:1,
		SOUTH:2,
		WEST:3
	};
	
	var CELL_TYPE = {
		ROOM_FLOOR:0,
		CORRIDOR_FLOOR:1,
		DOOR_CLOSED:2,
		ROOM_WALL:3,
		WALL:4,
		STAIRS_DOWN:5,
		STAIRS_UP:6,
		PLAYER_SPAWN:7,
		DOOR_OPEN:8,
		UNDISCOVERED:9
	};
	
	/*********************************************************************************
	Publics
	**********************************************************************************/
	this.GetNewMap = function (seed, width, height, avoidDiagonal) {
		Math.seedrandom(seed);
		_width = width;
		_height = height;
		
		if (avoidDiagonal != undefined) {
			AVOID_DIAGONAL = avoidDiagonal;
		}
		
		initMap();
		initRooms();
		setNumberOfRooms();
		setRooms();
		buildRooms();
		buildPathways();
		placeDownStairs();
		
		//reportRooms();
		
		return {map:_map, rooms:_carvedRooms};
	};
	
	
	/*********************************************************************************
	Privates
	**********************************************************************************/
	var reportCorridor = function(startRoom, endRoom, currentPath) {
		var dataContainer = $("#CorridorData");
		var row, startingRoomIdCell, startingRoomIdData, endingRoomIdCell, endingRoomIdData, lengthCell, lengthData;
		
		row = $("<tr>");
			
		startingRoomIdCell = $("<td>");
		startingRoomIdData = $("<span>").text(startRoom.id);
		startingRoomIdCell.append(startingRoomIdData);
		
		endingRoomIdCell = $("<td>");
		endingRoomIdData = $("<span>").text(endRoom.id);
		endingRoomIdCell.append(endingRoomIdData);
		
		lengthCell = $("<td>");
		lengthData = $("<span>").text(currentPath.length);
		lengthCell.append(lengthData);
		
		row.append(startingRoomIdCell);
		row.append(endingRoomIdCell);
		row.append(lengthCell);
		dataContainer.append(row);
	};
	
	var reportRooms = function () {
		var dataContainer = $("#RoomData");
		var row, roomIdCell, roomIdData, positionCell, positionData;

		dataContainer.empty();
		
		for (var i = 0; i < _carvedRooms.length; i++) {
			row = $("<tr>");
			
			roomIdCell = $("<td>");
			roomIdData = $("<span>").text(_carvedRooms[i].id);
			roomIdCell.append(roomIdData);
			
			positionCell = $("<td>");
			positionData = $("<span>").text("(" + _carvedRooms[i].x + ", " + _carvedRooms[i].y + ")");
			positionCell.append(positionData);
			
			row.append(roomIdCell);
			row.append(positionCell);
			dataContainer.append(row);
		};
	};
	
	var placeDownStairs = function () {
		// Not 0
		var room = Math.floor(Math.random() * (_carvedRooms.length - 1)) + 1;
		var x = Math.floor(_carvedRooms[room].x + _carvedRooms[room].width / 2);
		var y = Math.floor(_carvedRooms[room].y + _carvedRooms[room].height / 2);
		_map[x][y] = CELL_TYPE.STAIRS_DOWN;
	};
	
	// Room attributes
	//	width :  
	//	height :
	//	x :
	//	y :
	//	doors : array of doors
	//  area : 
	// Door attributes
	//	x :
	//	y :
	var setRooms = function () {
		var widthVariant, heightVariant, minWidth, minHeight, width, height;
		
		minWidth = 5;
		widthVariant = _width * .1;
		minHeight = 5;
		heightVariant = _height * .15;
		
		for (var i = 0; i < _numberOfRooms; i++) {
			width = Math.floor(Math.random() * widthVariant) + minWidth;
			height = Math.floor(Math.random() * heightVariant) + minHeight;
			area = width * height;
		
			_rooms[i] = {
				id: i,
				width: width,
				height: height,
				x: undefined,
				y: undefined,
				doors: [],
				area: area
			}
		}
		
		if (SORT_BY_AREA) {
			_rooms.sort(function (a,b) {
				return b.area - a.area;
			});
		}
	};
	
	var getRandomDoorLocation = function (side, room) {
		var x,y,xOffset,xRange,yOffset,yRange;		
		switch (side) {
			// North
			case DIRECTION.NORTH:
				xRange = room.width - 4;
				xOffset = Math.floor(Math.random() * xRange) + 2;
				x = room.x + xOffset;
				y = room.y - 1;
				break;
			// East
			case DIRECTION.EAST:
				yRange = room.height - 4;
				yOffset = Math.floor(Math.random() * yRange) + 2;
				x = room.x + room.width;
				y = room.y + yOffset;
				break;
			// South
			case DIRECTION.SOUTH:
				xRange = room.width - 4;
				xOffset = Math.floor(Math.random() * xRange) + 2;
				x = room.x + xOffset;
				y = room.y + room.height;
				break;
			// West
			case DIRECTION.WEST:
				yRange = room.height - 4;
				yOffset = Math.floor(Math.random() * yRange) + 2;
				x = room.x - 1;
				y = room.y + yOffset;
				break;
			default:
				break;
		};
		return {x:x, y:y};
	};
	
	var buildPathways = function () {
		var startRoom, endRoom;
		
		populateUnconnectedStack();
		
		startRoom = _unconnectedStack.pop();
		endRoom = _unconnectedStack.pop();
		
		//$("#CorridorData").empty();
		connectRooms(startRoom, endRoom);
		
		while(_unconnectedStack.length > 0) {
			startRoom = _connectedStack.pop();
			endRoom = _unconnectedStack.pop();
			
			connectRooms(startRoom, endRoom);
		}
	};
	
	var connectRooms = function (startRoom, endRoom) {
		var startingPoint = {};
		var endingPoint = {};
		var currentPoint = {};
		// Array of "movements"
		// a movement is direction and origin
		var currentPath = [];
		
		// Trap for debugging infinite hallways
		if (false) {
			debugger;
		}
		
		startingPoint = getRandomPointOnPerimeter(startRoom);
		endingPoint = getRandomPointOnPerimeter(endRoom);
		
		currentPoint = startingPoint;
		
		// while currentPoint != endingPoint
		while (currentPoint.x != endingPoint.x || currentPoint.y != endingPoint.y) {
			
			currentPath.push({
				direction: getNextDirection(currentPoint, currentPath, endingPoint),
				origin: currentPoint
			});
			
			currentPoint = getResultOfMovement(currentPath[currentPath.length - 1]);
			
			if (currentPath.length >= _width * _height / 2) {
				break;
			};
		}
		
		_connectedStack.push(startRoom);
		_connectedStack.push(endRoom);
		
		//reportCorridor(startRoom, endRoom, currentPath);
		
		startRoom.doors.push({
			x:startingPoint.x,
			y:startingPoint.y,
			isOpen:false
		});
		endRoom.doors.push({
			x:endingPoint.x,
			y:endingPoint.y,
			isOpen:false
		});
		carvePathway(currentPath);
		placeClosedDoor(startingPoint);
		placeClosedDoor(endingPoint);
	};
	
	var placeClosedDoor = function (point) {
		_map[point.x][point.y] = CELL_TYPE.DOOR_CLOSED;
	};
	
	// path of movements
	// assumes _map
	var carvePathway = function (path) {
		var point;
		
		_map[path[0].origin.x][path[0].origin.y] = CELL_TYPE.CORRIDOR_FLOOR;
		
		for (var i = 0; i < path.length; i++) {
			point = getResultOfMovement(path[i]);
			if (_map[point.x] != undefined) {
				_map[point.x][point.y] = CELL_TYPE.CORRIDOR_FLOOR;
			}
		};
	};
	
	// movement = {direction,origin}
	var getResultOfMovement = function (movement) {
		var result = {};
		
		switch (movement.direction) {
			// North
			case DIRECTION.NORTH:
				result = {
					x: movement.origin.x,
					y: movement.origin.y - 1
				};
				break;
			// East
			case DIRECTION.EAST:
				result = {
					x: movement.origin.x + 1,
					y: movement.origin.y
				};
				break;
			// South
			case DIRECTION.SOUTH:
				result = {
					x: movement.origin.x,
					y: movement.origin.y + 1
				};
				break;
			// West
			case DIRECTION.WEST:
				result = {
					x: movement.origin.x - 1,
					y: movement.origin.y
				};
				break;
			default:
				break;
		};
		
		return result;
	};
	
	/*
	
		CLEAN UP THIS FUNCTION
	
	*/
	var getNextDirection = function (currentPoint, currentPath, endingPoint) {
		
		var DEBUG_checkDistance, DEBUG_checkCanGo;
		
		var bestDirection, bestDistance, tempDistance;
		var recentDirection;
		
		if (currentPath.length > 0 && AVOID_DIAGONAL) {
			recentDirection = currentPath[currentPath.length - 1].direction;
		}
		
		// Check EAST for end point
		if (currentPoint.x + 1 === endingPoint.x && currentPoint.y === endingPoint.y) {
			return DIRECTION.EAST;
		}
		// Check SOUTH for end point
		if (currentPoint.x === endingPoint.x && currentPoint.y + 1 === endingPoint.y) {
			return DIRECTION.SOUTH;
		}
		// Check WEST for end point
		if (currentPoint.x - 1 === endingPoint.x && currentPoint.y === endingPoint.y) {
			return DIRECTION.WEST;
		}
		// Check NORTH for end point
		if (currentPoint.x === endingPoint.x && currentPoint.y - 1 === endingPoint.y) {
			return DIRECTION.NORTH;
		}
		
		// Check the direction traveled most recently, only do this if paths avoid diagonals
		if (recentDirection != undefined && AVOID_DIAGONAL) {
			DEBUG_checkDistance = thatDirectionIsCloserToTheEnd(recentDirection, currentPoint, endingPoint);
			DEBUG_checkCanGo = canGoDirection(recentDirection, currentPoint, currentPath);
			if (DEBUG_checkDistance && DEBUG_checkCanGo) {
				return recentDirection;
			}
		}
		
		bestDirection = undefined;
		bestDistance = 999999;
		
		// Check EAST
		DEBUG_checkDistance = thatDirectionIsCloserToTheEnd(DIRECTION.EAST, currentPoint, endingPoint);
		DEBUG_checkCanGo = canGoDirection(DIRECTION.EAST, currentPoint, currentPath);
		if (DEBUG_checkDistance && DEBUG_checkCanGo && (getDistance(getResultOfMovement({direction:DIRECTION.EAST, origin:currentPoint}), endingPoint) < bestDistance)) {
			bestDirection = DIRECTION.EAST;
			bestDistance = getDistance(getResultOfMovement({direction:DIRECTION.EAST, origin:currentPoint}), endingPoint);
		}
		// Check SOUTH
		DEBUG_checkDistance = thatDirectionIsCloserToTheEnd(DIRECTION.SOUTH, currentPoint, endingPoint);
		DEBUG_checkCanGo = canGoDirection(DIRECTION.SOUTH, currentPoint, currentPath);
		if (DEBUG_checkDistance && DEBUG_checkCanGo && (getDistance(getResultOfMovement({direction:DIRECTION.SOUTH, origin:currentPoint}), endingPoint) < bestDistance)) {
			bestDirection =  DIRECTION.SOUTH;
			bestDistance = getDistance(getResultOfMovement({direction:DIRECTION.SOUTH, origin:currentPoint}), endingPoint);
		}
		
		// Check WEST
		DEBUG_checkDistance = thatDirectionIsCloserToTheEnd(DIRECTION.WEST, currentPoint, endingPoint);
		DEBUG_checkCanGo = canGoDirection(DIRECTION.WEST, currentPoint, currentPath);
		if (DEBUG_checkDistance && DEBUG_checkCanGo && (getDistance(getResultOfMovement({direction:DIRECTION.WEST, origin:currentPoint}), endingPoint) < bestDistance)) {
			bestDirection =  DIRECTION.WEST;
			bestDistance = getDistance(getResultOfMovement({direction:DIRECTION.WEST, origin:currentPoint}), endingPoint);
		}
		
		// Check NORTH
		DEBUG_checkDistance = thatDirectionIsCloserToTheEnd(DIRECTION.NORTH, currentPoint, endingPoint);
		DEBUG_checkCanGo = canGoDirection(DIRECTION.NORTH, currentPoint, currentPath);
		if (DEBUG_checkDistance && DEBUG_checkCanGo && (getDistance(getResultOfMovement({direction:DIRECTION.NORTH, origin:currentPoint}), endingPoint) < bestDistance)) {
			bestDirection =  DIRECTION.NORTH;
			bestDistance = getDistance(getResultOfMovement({direction:DIRECTION.NORTH, origin:currentPoint}), endingPoint);
		}
		
		if (bestDirection != undefined) {
			return bestDirection;
		}
		
		// LOWER YOUR STANDARDS
		
		bestDirection = undefined;
		bestDistance = 999999;

		// Check EAST
		DEBUG_checkCanGo = canGoDirection(DIRECTION.EAST, currentPoint, currentPath);
		if (DEBUG_checkCanGo && (getDistance(getResultOfMovement({direction:DIRECTION.EAST, origin:currentPoint}), endingPoint) < bestDistance)) {
			bestDirection = DIRECTION.EAST;
			bestDistance = getDistance(getResultOfMovement({direction:DIRECTION.EAST, origin:currentPoint}), endingPoint);
		}
		// Check SOUTH
		DEBUG_checkCanGo = canGoDirection(DIRECTION.SOUTH, currentPoint, currentPath);
		if (DEBUG_checkCanGo && (getDistance(getResultOfMovement({direction:DIRECTION.SOUTH, origin:currentPoint}), endingPoint) < bestDistance)) {
			bestDirection = DIRECTION.SOUTH;
			bestDistance = getDistance(getResultOfMovement({direction:DIRECTION.SOUTH, origin:currentPoint}), endingPoint);
		}
		
		// Check WEST
		DEBUG_checkCanGo = canGoDirection(DIRECTION.WEST, currentPoint, currentPath);
		if (DEBUG_checkCanGo && (getDistance(getResultOfMovement({direction:DIRECTION.WEST, origin:currentPoint}), endingPoint) < bestDistance)) {
			bestDirection = DIRECTION.WEST;
			bestDistance = getDistance(getResultOfMovement({direction:DIRECTION.WEST, origin:currentPoint}), endingPoint);
		}
		
		// Check NORTH
		DEBUG_checkCanGo = canGoDirection(DIRECTION.NORTH, currentPoint, currentPath);
		if (DEBUG_checkCanGo && (getDistance(getResultOfMovement({direction:DIRECTION.NORTH, origin:currentPoint}), endingPoint) < bestDistance)) {
			bestDirection = DIRECTION.NORTH;
			bestDistance = getDistance(getResultOfMovement({direction:DIRECTION.NORTH, origin:currentPoint}), endingPoint);
		}
		
		return bestDirection || DIRECTION.NORTH;
		
	};
	
	var thatDirectionIsCloserToTheEnd = function (direction, currentPoint, endPoint) {
		return getDistance(getResultOfMovement({direction:direction, origin:currentPoint}), endPoint) <= getDistance(currentPoint, endPoint);
	};
	
	var canGoDirection = function (direction, currentPoint, currentPath) {
		var newPoint = getResultOfMovement({direction:direction, origin:currentPoint});
		
		if (isOuterWall(newPoint) || isRoom(newPoint) || isRoomPerimeter(newPoint) || isWhereYouCameFrom(newPoint, currentPath)) {
			return false;
		}
		
		return true;
	};
	
	var isWhereYouCameFrom = function (newPoint, currentPath) {
		var origin;
		
		if (currentPath.length === 0) {
			return false;
		}
		
		origin = currentPath[currentPath.length - 1].origin;
		
		return origin.x === newPoint.x && origin.y === newPoint.y;
	};
	
	var isOuterWall = function (point) {
		if (point.x > _width || point.x < 0 || point.y > _height || point.y < 0) {
			return true;
		}
		
		return false;
	};
	
	// Assumes _carvedRooms
	var isRoom = function (point) {
		var currentRoom;
		
		for (var i = 0; i < _carvedRooms.length; i++) {
			currentRoom = _carvedRooms[i];
			
			if (point.x >= currentRoom.x && point.x < currentRoom.x + currentRoom.width) {
				if (point.y >= currentRoom.y && point.y < currentRoom.y + currentRoom.height) {
					return true;
				}
			}
		}
		
		return false;
	};
	
	// Assumes _carvedRooms
	var isRoomPerimeter = function (point) {
		var currentRoom;

		for (var i = 0; i < _carvedRooms.length; i++) {
			currentRoom = _carvedRooms[i];
			
			// left wall
			if (point.x === currentRoom.x - 1) {
				if (point.y > currentRoom.y - 1 && point.y < currentRoom.y + currentRoom.height) {
					return true;
				}
			}
			
			// top wall
			if (point.y === currentRoom.y - 1) {
				if (point.x > currentRoom.x - 1 && point.x < currentRoom.x + currentRoom.width) {
					return true;
				}
			}
			
			// right wall
			if (point.x === currentRoom.x + currentRoom.width) {
				if (point.y > currentRoom.y - 1 && point.y < currentRoom.y + currentRoom.height) {
					return true;
				}
			}
			
			// bottom wall
			if (point.y === currentRoom.y + currentRoom.height) {
				if (point.x > currentRoom.x - 1 && point.x < currentRoom.x + currentRoom.width) {
					return true;
				}
			}
		}
		
		return false;
	};
	
	var getDistance = function (pointA, pointB) {
		return Math.sqrt((pointA.x-pointB.x)*(pointA.x-pointB.x)+(pointA.y-pointB.y)*(pointA.y-pointB.y));
	};
	
	var getRandomPointOnPerimeter = function (room) {
		var side = getRandomSide(room);
		
		return getRandomDoorLocation(side,room);
	};
	
	var getRandomSide = function (room) {
		return Math.floor(Math.random() * 4);
	};
	
	var populateUnconnectedStack = function () {
		_unconnectedStack = [];
	
		for (var i = 0; i < _carvedRooms.length; i++) {
			_unconnectedStack.push(_carvedRooms[i]);
		}
	};
	
	
	
	var buildRooms = function () {
		var initialX,initialY;
		var done = false;
		var nextPoint = {};
		var count;
		
		initialX = Math.floor(_width / 2) - Math.floor(_rooms[0].width / 2)
		initialY = Math.floor(_height / 2) - Math.floor(_rooms[0].height / 2)
		
		carveRoom(initialX, initialY, _rooms[0]);
		
		_carvedRooms[0] = _rooms[0];
		_carvedRooms[0].x = initialX;
		_carvedRooms[0].y = initialY;
		
		count = 1;
		//for (var i = 1; i < _rooms.length && !done; i++) {
		for (var i = 1; i < _rooms.length; i++) {
			setAvailablePoints();
			shuffleAvailablePoints();
			
			while (true) {
				nextPoint = getNextPoint();
				
				if (nextPoint.x === -1) {
					//done = true;
					break;
				}
				
				if (canPlaceRoom(nextPoint.x, nextPoint.y, _rooms[i])) {
					carveRoom(nextPoint.x, nextPoint.y, _rooms[i]);
					_carvedRooms[count] = _rooms[i];
					_carvedRooms[count].x = nextPoint.x;
					_carvedRooms[count].y = nextPoint.y;
					count++;
					break;
				}
			}
		}
		
		//$("#ActualNumberOfRooms").text(count);
	};
	
	var setAvailablePoints = function () {
		var count = 0;
		_availablePoints = [];
		for (var i = 0; i < _width; i++) {
			for (var j = 0; j < _height; j++) {
				if (_map[i][j] === CELL_TYPE.WALL && !isRoomWall(i,j)) {
					_availablePoints[count] = {x:i,y:j};
					count++;
				}
			}
		}
		
		_currentPosition = 0;
	};
	
	
	// Input is assumed to be a wall
	var isRoomWall = function (x,y) {
	
		if (x < 1 || x >= _width - 1 || y < 1 || y >= _height - 1) {
			return true;
		}
		
		// top left
		if (_map[x-1][y-1] === CELL_TYPE.ROOM_FLOOR) {
			return true;
		};
		
		// top middle
		if (_map[x][y-1] === CELL_TYPE.ROOM_FLOOR) {
			return true;
		};
		
		// top right
		if (_map[x+1][y-1] === CELL_TYPE.ROOM_FLOOR) {
			return true;
		};
		
		// right middle
		if (_map[x+1][y] === CELL_TYPE.ROOM_FLOOR) {
			return true;
		};
		
		// bottom right
		if (_map[x+1][y+1] === CELL_TYPE.ROOM_FLOOR) {
			return true;
		};
		
		// bottom middle
		if (_map[x][y+1] === CELL_TYPE.ROOM_FLOOR) {
			return true;
		};
		
		// bottom left
		if (_map[x-1][y+1] === CELL_TYPE.ROOM_FLOOR) {
			return true;
		};
		
		// left middle
		if (_map[x-1][y] === CELL_TYPE.ROOM_FLOOR) {
			return true;
		};
		
		return false;
	};
	
	var shuffleAvailablePoints = function () {
		var swap,swapIndex;
		
		for (var i = 1; i < _availablePoints.length; i++) {
			swap = _availablePoints[i];
			swapIndex = Math.floor(Math.random() * (i + 1));
			_availablePoints[i] = _availablePoints[swapIndex];
			_availablePoints[swapIndex] = swap;
		}
	};
	
	var canPlaceRoom = function (x,y,room) {
		for (var i = x; i < x + room.width; i++) {
			for (var j = y; j < y + room.height; j++) {
				if ((isWall(i,j) && isRoomWall(i,j)) || !isWall(i,j)) {
					return false;
				}
				
				if (i === x || i === (x + room.width - 1) || j === y || j === (y + room.height - 1)) {
					if (spaceIsWithinRadius(i,j)) {
						return false;
					}
				}
			}
		}
		
		return true;
	};
	
	// Checks within a square, not a circle
	var spaceIsWithinRadius = function (x,y) {
		
		for (var i = x - ROOM_PROX_RADIUS; i < x + ROOM_PROX_RADIUS; i++) {
			for (var j = y - ROOM_PROX_RADIUS; j < y + ROOM_PROX_RADIUS; j++) {
				if (_map[i] === undefined) {
					return true;
				}
				
				if (_map[i][j] === undefined) {
					return true;
				}
				
				if (_map[i][j] === 0) {
					return true;
				}
			}
		}
		
		return false;
	};
	
	var isWall = function (x,y) {
		var isWall = _map[x][y] === CELL_TYPE.WALL;
		
		return isWall;
	};
	
	var getNextPoint = function () {
		var nextPoint = _availablePoints[_currentPosition];
		_currentPosition++;
		
		nextPoint = nextPoint || {x:-1,y:-1};
		return nextPoint;
	};
	
	var carveRoom = function (x,y,room) {
		
		// Room floor
		for (var i = x; i < x + room.width; i++) {
			for (var j = y; j < y + room.height; j++) {
				_map[i][j] = CELL_TYPE.ROOM_FLOOR;
			}
		}
		
		// North wall
		for (var i = x; i <= x + room.width; i++) {
			_map[i][y-1] = CELL_TYPE.ROOM_WALL;
		}
		
		// East wall
		for (var i = y; i <= y + room.height; i++) {
			_map[x+room.width][i] = CELL_TYPE.ROOM_WALL;
		}
		
		// South wall
		for (var i = x-1; i < x + room.width; i++) {
			_map[i][y+room.height] = CELL_TYPE.ROOM_WALL;
		}
		
		// West wall
		for (var i = y-1; i < y + room.height; i++) {
			_map[x-1][i] = CELL_TYPE.ROOM_WALL;
		}
	};
	
	var setNumberOfRooms = function () {
		_numberOfRooms = Math.floor(Math.random() * _width * .1) + _width - Math.floor(_width * .75);
		//$("#NumberOfRooms").text(_numberOfRooms);
	};
	
	var initMap = function () {
		for (var i = 0; i < _width; i++) {
			_map[i] = [];
			for (var j = 0; j < _height; j++) {
				_map[i][j] = CELL_TYPE.WALL;
			}
		}
	};
	
	var initRooms = function () {
		_rooms = [];
		_carvedRooms = [];
	};
};


// seedrandom.js version 2.3.1
// Author: David Bau
// Date: 2013 Dec 23
//
// Defines a method Math.seedrandom() that, when called, substitutes
// an explicitly seeded RC4-based algorithm for Math.random().  Also
// supports automatic seeding from local or network sources of entropy.
// Can be used as a node.js or AMD module.  Can be called with "new"
// to create a local PRNG without changing Math.random.
//
// Basic usage:
//
//   <script src=http://davidbau.com/encode/seedrandom.min.js></script>
//
//   Math.seedrandom('yay.');  // Sets Math.random to a function that is
//                             // initialized using the given explicit seed.
//
//   Math.seedrandom();        // Sets Math.random to a function that is
//                             // seeded using the current time, dom state,
//                             // and other accumulated local entropy.
//                             // The generated seed string is returned.
//
//   Math.seedrandom('yowza.', true);
//                             // Seeds using the given explicit seed mixed
//                             // together with accumulated entropy.
//
//   <script src="https://jsonlib.appspot.com/urandom?callback=Math.seedrandom">
//   </script>                 <!-- Seeds using urandom bits from a server. -->
//
//   Math.seedrandom("hello.");           // Behavior is the same everywhere:
//   document.write(Math.random());       // Always 0.9282578795792454
//   document.write(Math.random());       // Always 0.3752569768646784
//
// Math.seedrandom can be used as a constructor to return a seeded PRNG
// that is independent of Math.random:
//
//   var myrng = new Math.seedrandom('yay.');
//   var n = myrng();          // Using "new" creates a local prng without
//                             // altering Math.random.
//
// When used as a module, seedrandom is a function that returns a seeded
// PRNG instance without altering Math.random:
//
//   // With node.js (after "npm install seedrandom"):
//   var seedrandom = require('seedrandom');
//   var rng = seedrandom('hello.');
//   console.log(rng());                  // always 0.9282578795792454
//
//   // With require.js or other AMD loader:
//   require(['seedrandom'], function(seedrandom) {
//     var rng = seedrandom('hello.');
//     console.log(rng());                // always 0.9282578795792454
//   });
//
// More examples:
//
//   var seed = Math.seedrandom();        // Use prng with an automatic seed.
//   document.write(Math.random());       // Pretty much unpredictable x.
//
//   var rng = new Math.seedrandom(seed); // A new prng with the same seed.
//   document.write(rng());               // Repeat the 'unpredictable' x.
//
//   function reseed(event, count) {      // Define a custom entropy collector.
//     var t = [];
//     function w(e) {
//       t.push([e.pageX, e.pageY, +new Date]);
//       if (t.length < count) { return; }
//       document.removeEventListener(event, w);
//       Math.seedrandom(t, true);        // Mix in any previous entropy.
//     }
//     document.addEventListener(event, w);
//   }
//   reseed('mousemove', 100);            // Reseed after 100 mouse moves.
//
// The callback third arg can be used to get both the prng and the seed.
// The following returns both an autoseeded prng and the seed as an object,
// without mutating Math.random:
//
//   var obj = Math.seedrandom(null, false, function(prng, seed) {
//     return { random: prng, seed: seed };
//   });
//
// Version notes:
//
// The random number sequence is the same as version 1.0 for string seeds.
// * Version 2.0 changed the sequence for non-string seeds.
// * Version 2.1 speeds seeding and uses window.crypto to autoseed if present.
// * Version 2.2 alters non-crypto autoseeding to sweep up entropy from plugins.
// * Version 2.3 adds support for "new", module loading, and a null seed arg.
// * Version 2.3.1 adds a build environment, module packaging, and tests.
//
// The standard ARC4 key scheduler cycles short keys, which means that
// seedrandom('ab') is equivalent to seedrandom('abab') and 'ababab'.
// Therefore it is a good idea to add a terminator to avoid trivial
// equivalences on short string seeds, e.g., Math.seedrandom(str + '\0').
// Starting with version 2.0, a terminator is added automatically for
// non-string seeds, so seeding with the number 111 is the same as seeding
// with '111\0'.
//
// When seedrandom() is called with zero args or a null seed, it uses a
// seed drawn from the browser crypto object if present.  If there is no
// crypto support, seedrandom() uses the current time, the native rng,
// and a walk of several DOM objects to collect a few bits of entropy.
//
// Each time the one- or two-argument forms of seedrandom are called,
// entropy from the passed seed is accumulated in a pool to help generate
// future seeds for the zero- and two-argument forms of seedrandom.
//
// On speed - This javascript implementation of Math.random() is several
// times slower than the built-in Math.random() because it is not native
// code, but that is typically fast enough.  Some details (timings on
// Chrome 25 on a 2010 vintage macbook):
//
// seeded Math.random()          - avg less than 0.0002 milliseconds per call
// seedrandom('explicit.')       - avg less than 0.2 milliseconds per call
// seedrandom('explicit.', true) - avg less than 0.2 milliseconds per call
// seedrandom() with crypto      - avg less than 0.2 milliseconds per call
//
// Autoseeding without crypto is somewhat slower, about 20-30 milliseconds on
// a 2012 windows 7 1.5ghz i5 laptop, as seen on Firefox 19, IE 10, and Opera.
// Seeded rng calls themselves are fast across these browsers, with slowest
// numbers on Opera at about 0.0005 ms per seeded Math.random().
//
// LICENSE (BSD):
//
// Copyright 2013 David Bau, all rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//   1. Redistributions of source code must retain the above copyright
//      notice, this list of conditions and the following disclaimer.
//
//   2. Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
//
//   3. Neither the name of this module nor the names of its contributors may
//      be used to endorse or promote products derived from this software
//      without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//

/**
 * All code is in an anonymous closure to keep the global namespace clean.
 */
(function (
    global, pool, math, width, chunks, digits, module, define, rngname) {

//
// The following constants are related to IEEE 754 limits.
//
var startdenom = math.pow(width, chunks),
    significance = math.pow(2, digits),
    overflow = significance * 2,
    mask = width - 1,

//
// seedrandom()
// This is the seedrandom function described above.
//
impl = math['seed' + rngname] = function(seed, use_entropy, callback) {
  var key = [];

  // Flatten the seed string or build one from local entropy if needed.
  var shortseed = mixkey(flatten(
    use_entropy ? [seed, tostring(pool)] :
    (seed === null || seed === undefined) ? autoseed() : seed, 3), key);

  // Use the seed to initialize an ARC4 generator.
  var arc4 = new ARC4(key);

  // Mix the randomness into accumulated entropy.
  mixkey(tostring(arc4.S), pool);

  // Calling convention: what to return as a function of prng, seed, is_math.
  return (callback ||
      // If called as a method of Math (Math.seedrandom()), mutate Math.random
      // because that is how seedrandom.js has worked since v1.0.  Otherwise,
      // it is a newer calling convention, so return the prng directly.
      function(prng, seed, is_math_call) {
        if (is_math_call) { math[rngname] = prng; return seed; }
        else return prng;
      })(

  // This function returns a random double in [0, 1) that contains
  // randomness in every bit of the mantissa of the IEEE 754 value.
  function() {
    var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
        d = startdenom,                 //   and denominator d = 2 ^ 48.
        x = 0;                          //   and no 'extra last byte'.
    while (n < significance) {          // Fill up all significant digits by
      n = (n + x) * width;              //   shifting numerator and
      d *= width;                       //   denominator and generating a
      x = arc4.g(1);                    //   new least-significant-byte.
    }
    while (n >= overflow) {             // To avoid rounding up, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  }, shortseed, this == math);
};

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
/** @constructor */
function ARC4(key) {
  var t, keylen = key.length,
      me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

  // The empty key [] is treated as [0].
  if (!keylen) { key = [keylen++]; }

  // Set up S using the standard key scheduling algorithm.
  while (i < width) {
    s[i] = i++;
  }
  for (i = 0; i < width; i++) {
    s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
    s[j] = t;
  }

  // The "g" method returns the next (count) outputs as one number.
  (me.g = function(count) {
    // Using instance members instead of closure state nearly doubles speed.
    var t, r = 0,
        i = me.i, j = me.j, s = me.S;
    while (count--) {
      t = s[i = mask & (i + 1)];
      r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
    }
    me.i = i; me.j = j;
    return r;
    // For robust unpredictability discard an initial batch of values.
    // See http://www.rsa.com/rsalabs/node.asp?id=2009
  })(width);
}

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
function flatten(obj, depth) {
  var result = [], typ = (typeof obj)[0], prop;
  if (depth && typ == 'o') {
    for (prop in obj) {
      try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
    }
  }
  return (result.length ? result : typ == 's' ? obj : obj + '\0');
}

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
function mixkey(seed, key) {
  var stringseed = seed + '', smear, j = 0;
  while (j < stringseed.length) {
    key[mask & j] =
      mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
  }
  return tostring(key);
}

//
// autoseed()
// Returns an object for autoseeding, using window.crypto if available.
//
/** @param {Uint8Array|Navigator=} seed */
function autoseed(seed) {
  try {
    global.crypto.getRandomValues(seed = new Uint8Array(width));
    return tostring(seed);
  } catch (e) {
    return [+new Date, global, (seed = global.navigator) && seed.plugins,
            global.screen, tostring(pool)];
  }
}

//
// tostring()
// Converts an array of charcodes to a string
//
function tostring(a) {
  return String.fromCharCode.apply(0, a);
}

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to intefere with determinstic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
mixkey(math[rngname](), pool);

//
// Nodejs and AMD support: export the implemenation as a module using
// either convention.
//
if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
}

// End anonymous scope, and pass initial values.
})(
  this,   // global window object
  [],     // pool: entropy pool starts empty
  Math,   // math: package containing random, pow, and seedrandom
  256,    // width: each RC4 output is 0 <= x < 256
  6,      // chunks: at least six RC4 outputs for each double
  52,     // digits: there are 52 significant digits in a double
  (typeof module)[0] == 'o' && module,  // present in node.js
  (typeof define)[0] == 'f' && define,  // present with an AMD loader
  'random'// rngname: name for Math.random and Math.seedrandom
);
