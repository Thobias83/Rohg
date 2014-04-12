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
var Maps = new function () {
	
	/*********************************************************************************
	Variables
	**********************************************************************************/
	var ROOM_PROX_RADIUS = 4;
	var STUCK_DOOR_CHANCE = .25;
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
		
		reportRooms();
		
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
		
		minWidth = 3;
		widthVariant = _width * .2;
		minHeight = 3;
		heightVariant = _height * .2;
		
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
		
		$("#CorridorData").empty();
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
		
		reportCorridor(startRoom, endRoom, currentPath);
		
		startRoom.doors.push(getNewDoor(startingPoint.x,startingPoint.y));
		endRoom.doors.push(getNewDoor(endingPoint.x,endingPoint.y));
		
		carvePathway(currentPath);
		placeClosedDoor(startingPoint);
		placeClosedDoor(endingPoint);
	};
	
	var getNewDoor = function (x,y) {
		var isStuck = false;
		
		if (Math.random() < STUCK_DOOR_CHANCE) {
			isStuck = true;
		};
		
		return {
			x:x,
			y:y,
			isOpen:false,
			isStuck:isStuck
		};
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
		
		$("#ActualNumberOfRooms").text(count);
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
		$("#NumberOfRooms").text(_numberOfRooms);
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