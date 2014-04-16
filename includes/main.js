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
$("document").ready(function () {
	Rohg.Init();
});

var Rohg = new function () {
	
	/*
		Settings
	*/
	var ANIMATION_ENABLED = false;
	var MULTI_THREAD_MAP_CREATION = false;
	var ALLOWABLE_SCALES = [4,8,16,24,32,64];
	var CANVAS_WIDTH = 1024;
	var CANVAS_HEIGHT = 576;
	var STATS_CANVAS_WIDTH = 96;
	var STATS_CANVAS_HEIGHT = 256;
	var MAP_TILE_WIDTH = 64;
	var MAP_TILE_HEIGHT = 36;
	var MAP_SCALE_FACTOR = 16;
	var MAX_SCREEN_TICK = 10000;
	var FPS = 30;
	var DEBUG = false;
	var MAX_MAP_SCALE = 64;
	var MIN_MAP_SCALE = 4;
	var UNLIMITED_SIGHT = false;
	
	/*
		Textures
	*/
	var PLAYER_IMAGE_SRC = "includes/images/benHead128East.png";
	var PLAYER_IMAGE = new Image();
	PLAYER_IMAGE.src = PLAYER_IMAGE_SRC;
	var ROOM_FLOOR_IMAGE_SRC = "includes/images/floorTile6.png";
	var ROOM_FLOOR_IMAGE = new Image();
	ROOM_FLOOR_IMAGE.src = ROOM_FLOOR_IMAGE_SRC;
	var ROOM_WALL_IMAGE_SRC = "includes/images/wall1.png";
	var ROOM_WALL_IMAGE = new Image();
	ROOM_WALL_IMAGE.src = ROOM_WALL_IMAGE_SRC;
	var CORRIDOR_FLOOR_IMAGE_SRC = "includes/images/floorTile2.png";
	var CORRIDOR_FLOOR_IMAGE = new Image();
	CORRIDOR_FLOOR_IMAGE.src = CORRIDOR_FLOOR_IMAGE_SRC;
	var DOOR_CLOSED_IMAGE_SRC = "includes/images/doorClosed.png";
	var DOOR_CLOSED_IMAGE = new Image();
	DOOR_CLOSED_IMAGE.src = DOOR_CLOSED_IMAGE_SRC;
	var DOOR_OPEN_IMAGE_SRC = "includes/images/doorOpen.png";
	var DOOR_OPEN_IMAGE = new Image();
	DOOR_OPEN_IMAGE.src = DOOR_OPEN_IMAGE_SRC;
	var WALL_IMAGE_SRC = "includes/images/floorTile1.png";
	var WALL_IMAGE = new Image();
	WALL_IMAGE.src = WALL_IMAGE_SRC;
	var STAIRS_DOWN_IMAGE_SRC = "includes/images/stairsDown.png";
	var STAIRS_DOWN_IMAGE = new Image();
	STAIRS_DOWN_IMAGE.src = STAIRS_DOWN_IMAGE_SRC;
	var STAIRS_UP_IMAGE_SRC = "includes/images/stairsUp.png";
	var STAIRS_UP_IMAGE = new Image();
	STAIRS_UP_IMAGE.src = STAIRS_UP_IMAGE_SRC;
	
	/*
		Sounds
	*/
	var SOUND_DOOR_KICK_SUCCESS = "includes/sounds/doorKickSuccess.ogg";
	var SOUND_DOOR_KICK_FAIL = "includes/sounds/doorKickFail.ogg";
	var SOUND_DOOR_CLOSE = "includes/sounds/closeDoor.ogg";
	var SOUND_DOOR_OPEN = "includes/sounds/openDoor2.ogg";
	var SOUND_DOOR_STUCK = "includes/sounds/doorStuck.ogg";
	
	/*
		Enums
	*/
	var DIRECTION = {
		NORTH:0,
		EAST:1,
		SOUTH:2,
		WEST:3
	};
	var COLORS = {
		White : "rgb(255,255,255)",
		Black : "rgb(0,0,0)",
		DarkGrey : "rgb(90,90,90)",
		DarkGray : "rgb(180,180,180)",
		Grey : "rgb(180,180,180)",
		Gray : "rgb(180,180,180)",
		LightGrey : "rgb(230,230,230)",
		LightGray : "rgb(230,230,230)",
		Red : "rgb(255,0,0)",
		Blue : "rgb(0,0,255)",
		DarkRed : "rgb(136,0,0)",
		DarkBlue : "rgb(0,0,136)"
	};
	var COLORS_TRANS = {
		Black: "rgba(0,0,0,0.666)"
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
	var ACTION_TYPE = {
		MOVE:0,
		OPEN_DOOR:1,
		CLOSE_DOOR:2,
		KICK:3,
		WEAR:4,
		TAKE_OFF:5,
		EAT:6
	};
	var EFFECTS = {
		DOUBLE_STRENGTH:0,
		DOUBLE_AGILITY:1,
		DOUBLE_INTELLIGENCE:2,
		LIGHT_RADIUS_UP:3,
		HUNGRY:4,
		WEAK:5,
		FAMISHED:6,
		STARVING:7,
		EATING_HALF:8
	};
	var ITEMS = {
		AMULET_OF_THE_TITANS:0,
		COOKIE:1
	};
	/*
		Context
	*/
	var _mainCanvas;
	var _mainContext;
	var _statsCanvas;
	var _statsContext;
	var _screenTimer;
	var _screenTick = 0;
	var _player = {};
	var _map;
	var _shroudedMap;
	var _rooms;
	var _seed;
	var _roomIndex;
	var _doorIndex; // {roomIndex, doorIndex}
	var _canSeeIndex;
	var _statNumberOfRooms;
	var _statFloor;
	var _statDiscoveredRooms;

	/*
		Public functions
	*/
	this.dSetMap = function (seed) {
		setMap(seed);
	};
	
	this.Init = function () {
		
		if (CANVAS_WIDTH / MAP_TILE_WIDTH != MAP_SCALE_FACTOR) {
			alert("Incorrect settings");
			return;
		};
		
		registerEvents();
		uiInit();
		populateOptions();
		setContext();
		doLoadingScreen();
		initLog();
		initMap();	
		initPlayer();
		bindEvents();
		doWelcomeMessage();
	};
	
	this.Log = function (msg) {
		log(msg);
	};
	
	/*
		Private functions
	*/
	var doWelcomeMessage = function () {
		_player.Log("You awaken in a strange place.");
	};
	
	var doLoadingScreen = function () {
		showLoadingScreen();
		setTimeout(fadeLoadingScreen, 3000);
	};
	
	var showLoadingScreen = function (opacity) {
		
		if (opacity != undefined) {
		
			_mainContext.fillStyle = "rgba(0,0,0," + opacity + ")"; //Black
			_mainContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
			_mainContext.fillStyle = "rgba(255,255,255," + opacity + ")"; //White
			_mainContext.font = "200px Arial";
			_mainContext.fillText("Rohg",(CANVAS_WIDTH-500)/2,(CANVAS_HEIGHT+100)/2);
			return;
		}
		
		_mainContext.fillStyle = COLORS.Black;
		_mainContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		_mainContext.fillStyle = COLORS.White;
		_mainContext.font = "200px Arial";
		_mainContext.fillText("Rohg",(CANVAS_WIDTH-500)/2,(CANVAS_HEIGHT+100)/2);
	};
	
	var fadeLoadingScreen = function () {
		var counterStart = 90;
		var counter = counterStart;
		var timer;
		var opacity, color;
		
		timer = setInterval(function () {
			if (counter <= 0) {
				window.clearInterval(timer);
				return;
			}
			
			drawScreen();
			
			opacity = counter / counterStart;
			
			showLoadingScreen(opacity);
			
			counter--;
			
		}, 1000/FPS);
	};
	
	var registerEvents = function () {
		document.addEventListener("turn", function (event) {
			drawScreen();
		}, false);
	};
	
	var buildRoomAndDoorIndex = function () {
		var result = [];
		var doorResult = [];
		
		// initialize the array
		for (var i = 0; i < _map.length; i++) {
			result[i] = [];
			doorResult[i] = [];
			for (var j = 0; j < _map[i].length; j++) {
				result[i][j] = -1;
				doorResult[i][j] = -1;
			}
		}
		
		for (var roomIndex = 0; roomIndex < _rooms.length; roomIndex++) {
			// add the room dimensions
			for (var i = _rooms[roomIndex].x; i < _rooms[roomIndex].x + _rooms[roomIndex].width; i++) {
				for (var j = _rooms[roomIndex].y; j < _rooms[roomIndex].y + _rooms[roomIndex].height; j++) {
					result[i][j] = roomIndex;
				}
			}
			
			// add the doors in the room
			for (var i = 0; i < _rooms[roomIndex].doors.length; i++) {
				result[_rooms[roomIndex].doors[i].x][_rooms[roomIndex].doors[i].y] = roomIndex;
				doorResult[_rooms[roomIndex].doors[i].x][_rooms[roomIndex].doors[i].y] = {roomIndex:roomIndex, doorIndex:i};
			}
		}
		
		_roomIndex = result;
		_doorIndex = doorResult;
	};
	
	var buildCanSeeIndex = function () {
		var result = [];
		var radius = _player.lightRadius;
		var x = _player.x;
		var y = _player.y;
		var room = _roomIndex[x][y];
		var roomX, roomY, roomWidth, roomHeight;
		var doorPoint;
		var obstruction;
		
		// initialize the array
		for (var i = 0; i < _map.length; i++) {
			result[i] = [];
			for (var j = 0; j < _map[i].length; j++) {
				result[i][j] = false;
			}
		}
		
		// Check everything
		if (UNLIMITED_SIGHT) {
			for (var i = 0; i < MAP_TILE_WIDTH; i++) {
				for (var j = 0; j < MAP_TILE_HEIGHT; j++) {
					obstruction = obstructionExistsBetween({x:x,y:y}, {x:i,y:j})
					if (obstruction === false) {
						result[i][j] = true;
					}
				}
			}
		}
		
		// Check the player's light radius
		for (var i = x - radius; i <= x + radius; i++) {
			for (var j = y - radius; j <= y + radius; j++) {
				obstruction = obstructionExistsBetween({x:x,y:y}, {x:i,y:j})
				if (obstruction === false) {
					result[i][j] = true;
				}
			}
		}
		
		// If in a room, check the whole room
		if (room != -1) {
			roomX = _rooms[room].x;
			roomY = _rooms[room].y;
			roomWidth = _rooms[room].width;
			roomHeight = _rooms[room].height;
			
			for (var i = roomX; i < roomX + roomWidth; i++) {
				for (var j = roomY; j < roomY + roomHeight; j++) {
					obstruction = obstructionExistsBetween({x:x,y:y}, {x:i,y:j})
					if (obstruction === false) {
						result[i][j] = true;
					}
				}
			}
		} 
		// Else check if there are any doors in sight
		for (var i = 0; i < _rooms.length; i++) {
			for (var j = 0; j < _rooms[i].doors.length; j++) {
				doorPoint = {x:_rooms[i].doors[j].x, y:_rooms[i].doors[j].y};
				obstruction = obstructionExistsBetween({x:x,y:y}, doorPoint)
				if (i != room && (obstruction === false)) { // if the player can see the door and its not in the same room
					roomX = _rooms[i].x;
					roomY = _rooms[i].y;
					roomWidth = _rooms[i].width;
					roomHeight = _rooms[i].height;
					
					for (var a = roomX; a < roomX + roomWidth; a++) {
						for (var b = roomY; b < roomY + roomHeight; b++) {
							obstruction = obstructionExistsBetween({x:x,y:y}, {x:a,y:b}, true)
							if (obstruction === false) {
								result[a][b] = true;
							}
						}
					}
				}
			}
		}
		
		_canSeeIndex = result;
	};
	
	var isCornerOfRoom = function (point, roomIndex) {
		var roomX, roomY, roomWidth, roomHeight;
		roomX = _rooms[roomIndex].x;
		roomY = _rooms[roomIndex].y;
		roomWidth = _rooms[roomIndex].width;
		roomHeight = _rooms[roomIndex].height;
		
		// Top left
		if (point.x === roomX - 1 && point.y === roomY - 1) {
			return true;
		}
		
		// Top right
		if (point.x === roomX + roomWidth && point.y === roomY - 1) {
			return true;
		}
		
		// Bottom right
		if (point.x === roomX + roomWidth && point.y === roomY + roomHeight) {
			return true;
		}
		
		// Bottom left
		if (point.x === roomX - 1 && point.y === roomY + roomHeight) {
			return true;
		}
		
		return false;
	};
	
	var isCornerOfAnyRoom = function (point) {
		for (var i = 0; i < _rooms.length; i++) {
			if (isCornerOfRoom(point,i)){
				return true;
			}
		}
		
		return false;
	};
	
	// true : an obstruction   false : no obstruction   -1 : a corner obstruction
	var obstructionExistsBetween = function (a,b, checkCorners, roomIndex) {
		var x1 = a.x;
		var y1 = a.y;
		var x0 = b.x;
		var y0 = b.y;
		var count;
		
		if (a.x === b.x && a.y === b.y) {
			return false;
		}
		
		checkCorners = checkCorners || false;
		
		// Magic
		count = 0;
		var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
		var dy = Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1; 
		var err = (dx>dy ? dx : -dy)/2;
		while (true) {
			if (_map[x0][y0] === CELL_TYPE.WALL || _map[x0][y0] === CELL_TYPE.ROOM_WALL || _map[x0][y0] === CELL_TYPE.DOOR_CLOSED) {
				return true;
			}
			if (checkCorners && isCornerOfAnyRoom({x:x0,y:y0})) {
				return true;
			}
			if (x0 === x1 && y0 === y1) break;
			var e2 = err;
			if (e2 > -dx) { err -= dy; x0 += sx; }
			if (e2 < dy) { err += dx; y0 += sy; }
		}
		
		return false;
	};
	
	var initLog = function () {
		Log.Init();
	};
	
	var uiInit = function () {
		var centerY = (window.innerHeight - CANVAS_HEIGHT) / 2;
		var centerX = (window.innerWidth - CANVAS_WIDTH) / 2;
		var statsCenterY = (window.innerHeight - STATS_CANVAS_HEIGHT) / 2;
		
		$("#RegenerateMap").button();
		$("#GenerateRandomMap").button();
		$("#MainContainer").css("top", centerY).css("left", centerX);
		$("#StatsContainer").draggable();
		$("#StatsContainer").css("top", statsCenterY).css("left", 1);
	};
	
	var populateOptions = function () {
		var option;
		
		for (var i = 0; i < ALLOWABLE_SCALES.length; i++) {
			option = $("<option>").val(ALLOWABLE_SCALES[i]).text(ALLOWABLE_SCALES[i]);			
			$("#ScaleSelect").append(option);
		}
		
		$("#ScaleSelect").val(MAP_SCALE_FACTOR);
	};
	
	var loadMap = function (seed, avoidDiagonal) {
		var result;
		_seed = seed;
		
		if (MULTI_THREAD_MAP_CREATION) {
			var mapWorker = new Worker("includes/mapWorker.js");
			$("#RoomInfo").hide();
			$("#CorridorInfo").hide();
			$("#NumberOfRoomsContainer").hide();
			$("#ActualNumberOfRoomsContainer").hide();

			mapWorker.postMessage({seed:seed, width:MAP_TILE_WIDTH, height:MAP_TILE_HEIGHT, avoidDiagonal:avoidDiagonal});

			mapWorker.onmessage = function (event) {
				result = event.data;
				_map = result.map;
				_rooms = result.rooms;
				$("#Seed").text(_seed);
				$("#SeedSelect").val(_seed);
		};
		} else {
			$("#RoomInfo").show();
			$("#CorridorInfo").show();
			$("#NumberOfRoomsContainer").show();
			$("#ActualNumberOfRoomsContainer").show();
			result = Maps.GetNewMap(_seed, MAP_TILE_WIDTH, MAP_TILE_HEIGHT, avoidDiagonal);
			_map = result.map;
			_rooms = result.rooms;
			$("#Seed").text(_seed); 
			$("#SeedSelect").val(_seed);
		}
		
		buildRoomAndDoorIndex();
	};
	
	var buildShroudedMap = function () {
		var result = [];
		
		// initialize the array
		for (var i = 0; i < _map.length; i++) {
			result[i] = [];
			for (var j = 0; j < _map[i].length; j++) {
				result[i][j] = CELL_TYPE.UNDISCOVERED;
			}
		}
		_shroudedMap = result;
		unshroudRoomByLocation(_player.x, _player.y);
	};
	
	var unshroudRoomByLocation = function (x,y) {
		roomIndex = _roomIndex[x][y];
		
		// add the room dimensions
		for (var i = _rooms[roomIndex].x - 1; i <= _rooms[roomIndex].x + _rooms[roomIndex].width; i++) {
			for (var j = _rooms[roomIndex].y - 1; j <= _rooms[roomIndex].y + _rooms[roomIndex].height; j++) {
				_shroudedMap[i][j] = _map[i][j];
			}
		}
	};
	
	var setMap = function (seed, avoidDiagonal) {
		loadMap(seed, avoidDiagonal);
	};
	
	var initMap = function () {
		loadMap(Math.floor(Math.random() * 2147483647).toString(), true);
	};
	
	var initPlayer = function () {
		
		// x,y,str,agi,intel,lightRadius,currentHealth,currentMana,maxFood
		_player = Player.Init(Math.floor(MAP_TILE_WIDTH / 2), Math.floor(MAP_TILE_HEIGHT / 2), 10, 10, 10, 1, 10, 10, 100);

		resetStats();
		buildShroudedMap();
		buildCanSeeIndex();
	};
	
	var resetStats = function () {
		_statFloor = 1;
		resetDiscoveredRooms();
	};
	
	var resetDiscoveredRooms = function () {
		_statDiscoveredRooms = [];
		_statNumberOfRooms = _rooms.length;
		_statDiscoveredRooms.push(_roomIndex[_player.x][_player.y]);
	};
	
	var bindEvents = function () {
		$("body").keydown(keyDown);
		//$("#MainCanvas").click(carveSpace);
		$("#RegenerateMap").click(regenerateMap);
		$("#GenerateRandomMap").click(generateRandomMap);
		$("#MultiThreadMapCreation").change(setMultiThreadMapGeneration);
	};
	
	var setMultiThreadMapGeneration = function () {
		MULTI_THREAD_MAP_CREATION = $("#MultiThreadMapCreation").prop("checked");
	};
	
	var regenerateMap = function () {
		resetScale($("#ScaleSelect").val());
		setMap($("#SeedSelect").val(), $("#AvoidDiagonal").prop("checked"));
		initPlayer();
	};
	
	var generateRandomMap = function () {
		resetScale($("#ScaleSelect").val());
		setMap(Math.floor(Math.random() * 2147483647).toString(), $("#AvoidDiagonal").prop("checked"));
		initPlayer();
	};
	
	var resetScale = function (scale) {
		MAP_SCALE_FACTOR = scale;
		MAP_TILE_WIDTH = CANVAS_WIDTH / MAP_SCALE_FACTOR;
		MAP_TILE_HEIGHT = CANVAS_HEIGHT / MAP_SCALE_FACTOR;
	};
	
	var carveSpace = function (event) {
		var position = getMousePosition(event);
		position = getGridSquare(position.x, position.y);

		if (_map[position.x] != undefined) {
			_map[position.x][position.y] = CELL_TYPE.CORRIDOR_FLOOR;
		}
	};
	
	var getMousePosition = function(event) {
		var rect = _mainCanvas.getBoundingClientRect();
        return {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
    }
	
	var keyDown = function (event) {
		var keyPressed = event.keyCode;
		var shiftKey = event.shiftKey;
		
		if (shiftKey ==1) {
			shiftKey = true;
		}
		
		log(keyPressed + " " + shiftKey);
		
		switch (keyPressed) {
			case 87:
				player_moveUp();
				break;
			case 83:
				player_moveDown();
				break;
			case 65:
				player_moveLeft();
				break;
			case 68:
				player_moveRight();
				break;
			case 67: // c
				setCloseDoor();
				break;
			case 79: // o
				setOpenDoor();
				break;
			case 190: // .
				if (shiftKey) { // >
					tryGoDown();
				}
				break;
			case 188: // ,
				if (shiftKey) { // <
					tryGoUp();
				}
				break;
			case 66: // b
				if (shiftKey) { // B
					debug_doubleStrength();
				}
				break;
			case 78: // n
				if (shiftKey) { // N
					debug_doubleAgility();
				}
				break;
			case 77: 
				if (shiftKey) { // M
					debug_doubleIntelligence();
				} else { // m
					debug_giveAmuletOfTitans();
				}
				break;
			case 75: 
				if (shiftKey) { // K
					
				} else { // k
					setKick();
				}
				break;
			case 80: 
				if (shiftKey) { // P
					
				} else { // p
					setWear();
				}
				break;
			case 84: 
				if (shiftKey) { // T
					
				} else { // t
					setTakeOff();
				}
				break;
			case 69: 
				if (shiftKey) { // E
					debug_giveCookie();
				} else { // e
					setEat();
				}
				break;
			case 48:
			case 49:
			case 50:
			case 51:
			case 52:
			case 53:
			case 54:
			case 55:
			case 56:
			case 57:
				if (shiftKey) { // )@#$%^&*(
					
				} else { // 123456789
					menuSelect(keyPressed - 48);
				}
				break;
			default:
				break;		
		}
	};
	
	var menuSelect = function (selectionNumber) {
		_player.MenuSelect(selectionNumber);
		buildCanSeeIndex();
		drawScreen();
	};
	
	var debug_doubleStrength = function () {
		_player.AddEffect(EFFECTS.DOUBLE_STRENGTH, 5);
		_player.TakeTurn();
	};
	
	var debug_doubleAgility = function () {
		_player.AddEffect(EFFECTS.DOUBLE_AGILITY, 5);
		_player.TakeTurn();
	};
	
	var debug_doubleIntelligence = function () {
		_player.AddEffect(EFFECTS.DOUBLE_INTELLIGENCE, 5);
		_player.TakeTurn();
	};
	
	var debug_giveAmuletOfTitans = function () {
		var item = Items.GetItem(ITEMS.AMULET_OF_THE_TITANS);
		_player.AddItem(item);
	};
	
	var debug_giveCookie = function () {
		var item = Items.GetItem(ITEMS.COOKIE);
		_player.AddItem(item);
	};

	var setCloseDoor = function () {
		_player.SetAction(ACTION_TYPE.CLOSE_DOOR);
	};

	var setOpenDoor = function () {
		_player.SetAction(ACTION_TYPE.OPEN_DOOR);
	};
	
	var setKick = function () {
		_player.SetAction(ACTION_TYPE.KICK);
	};
	
	var setEat = function () {
		_player.SetAction(ACTION_TYPE.EAT);
	};
	
	var setWear = function () {
		_player.SetAction(ACTION_TYPE.WEAR);
	};
	
	var setTakeOff = function () {
		_player.SetAction(ACTION_TYPE.TAKE_OFF);
	};
	
	var player_moveUp = function () {
		movePlayer(_player.x, _player.y - 1);
	};
	
	var player_moveLeft = function () {
		PLAYER_IMAGE_SRC = "includes/images/benHead128West.png";
		PLAYER_IMAGE.src = PLAYER_IMAGE_SRC;
		movePlayer(_player.x - 1, _player.y);
	};
	
	var player_moveDown = function () {
		movePlayer(_player.x, _player.y + 1);
	};
	
	var player_moveRight = function () {
		PLAYER_IMAGE_SRC = "includes/images/benHead128East.png";
		PLAYER_IMAGE.src = PLAYER_IMAGE_SRC;
		movePlayer(_player.x + 1, _player.y);
	};
	
	var tryGoDown = function () {
		if (_map[_player.x][_player.y] != CELL_TYPE.STAIRS_DOWN) {
			_player.TakeTurn("There are no down stairs here.");
			return;
		};
		goDown();
	};
	
	var tryGoUp = function () {
		if (_map[_player.x][_player.y] != CELL_TYPE.STAIRS_Up) {
			_player.TakeTurn("There are no up stairs here.");
			return;
		};
		goUp();
	};
	
	var setContext = function () {
		_mainCanvas = document.getElementById("MainCanvas");
		_mainContext = _mainCanvas.getContext("2d");
		_statsCanvas = document.getElementById("StatsCanvas");
		_statsContext = _statsCanvas.getContext("2d");
	};
	
	var startScreenTimer = function () {
		_screenTimer = setInterval(drawScreen,1000/FPS);
	};
	
	var drawScreen = function () {
		_screenTick = (_screenTick + 1) % MAX_SCREEN_TICK;
		doStats();
		clearScreen();
		drawDiscoveredArea();
		drawEnemies();
		drawProjectiles();
		drawPlayer();
		drawVisionShroud();
	};
	
	var drawVisionShroud = function () {
		for (var i = 0; i < MAP_TILE_WIDTH; i++) {
			for (var j = 0; j < MAP_TILE_HEIGHT; j++) {
				if (!_canSeeIndex[i][j]) {
					fill(i,j,COLORS_TRANS.Black);
				}
			}
		}
	};
	
	var movePlayer = function (x,y) {
		var door = getDoor(x,y);
		var sound;
		door = door || -1;
		
		if (!playerCanMove(x,y)) {
			_player.TakeTurn();
			return;
		}
		
		// If the space being moved to is a door
		if (door != -1) {
			// The door is open and the player's next action is to close it
			if (door.isOpen && _player.nextAction == ACTION_TYPE.CLOSE_DOOR) {
				closeDoor(door);
				return;
			}
			
			// The door is closed and the player's next action is to open it
			if (!door.isOpen && _player.nextAction === ACTION_TYPE.OPEN_DOOR) {
				log(door.isStuck);
				// If the door isn't stuck
				if (!door.isStuck) {
					sound = new Audio(SOUND_DOOR_OPEN);
					sound.play();
					openDoor(door, "The door opens.");
					return;
				}
				
				//The door is stuck
				sound = new Audio(SOUND_DOOR_STUCK);
				sound.play();
				_player.TakeTurn("The door is stuck!");
				return;
			}
			
			// The door is closed and the player's next action is to kick the door down
			if (!door.isOpen && _player.nextAction === ACTION_TYPE.KICK) {
				if (Math.random() > 0.80) {
					sound = new Audio(SOUND_DOOR_KICK_SUCCESS);
					sound.play();
					openDoor(door, "You crash through the door!");
					return;
				}
				
				sound = new Audio(SOUND_DOOR_KICK_FAIL);
				sound.play();
				_player.TakeTurn("WHAM!");
				return;
			}
			
			// The door is closed and the player's next action is to move
			if (!door.isOpen) {
				_player.TakeTurn("The door is closed.");
				return;
			}
		}
		
		// The player can Move
		_player.Move(x,y);
		buildCanSeeIndex();
		
		$("#CurrentRoomIndex").text(_roomIndex[x][y]);
		_shroudedMap[x][y] = _map[x][y];
		
		if (isDownStairs(x,y)) {
			_player.Log("You see a stairway leading down.");
		} else {
			unshroudPlayerLightRadius(x,y);
		}
		drawScreen();
	};
	
	var openDoor = function (door,message) {
		door.isOpen = true;
		door.isStuck = false;
		_map[door.x][door.y] = CELL_TYPE.DOOR_OPEN;
		_shroudedMap[door.x][door.y] = CELL_TYPE.DOOR_OPEN;
		unshroudRoomByLocation(door.x,door.y);
		statsRegisterRoom(_roomIndex[door.x][door.y]);
		buildCanSeeIndex();
		_player.TakeTurn(message);
	};
	
	var closeDoor = function (door) {
		var sound = new Audio(SOUND_DOOR_CLOSE);
		sound.play();
		door.isOpen = false;
		_map[door.x][door.y] = CELL_TYPE.DOOR_CLOSED;
		_shroudedMap[door.x][door.y] = CELL_TYPE.DOOR_CLOSED;
		buildCanSeeIndex();
		_player.TakeTurn("The door closes.");
	};
	
	var getDoor = function (x,y) {
		var room;
		var door;
		
		if (isDoor(x,y)) {
			room = _rooms[_doorIndex[x][y].roomIndex];
			door = room.doors[_doorIndex[x][y].doorIndex];
			return door;
		};
	};
	
	var isDoor = function (x,y) {
		return _doorIndex[x][y] !== -1;
	};
	
	var goDown = function () {
		_player.Log("Going down...");
		initMap();
		_player.Move(MAP_TILE_WIDTH / 2,MAP_TILE_HEIGHT / 2);
		buildShroudedMap();
		resetDiscoveredRooms();
		buildCanSeeIndex();
		_statFloor++;
		drawScreen();
	};
	
	var goUp = function () {
		
	};
	
	var isDownStairs = function (x,y) {
		return _map[x][y] === CELL_TYPE.STAIRS_DOWN;
	};
	
	// This "discovers" the area, it does not handle vision
	var unshroudPlayerLightRadius = function (x,y) {
		var radius = _player.lightRadius;
		var obstruction;
		
		for (var i = -radius; i <= radius; i++) {
			for (var j = -radius; j <= radius; j++) {
				obstruction = obstructionExistsBetween({x:x,y:y}, {x:x+i,y:y+j})
				if (obstruction === false || adjacentCellIsCanSee(x+i,y+j)) {
					_shroudedMap[x+i][y+j] = _map[x+i][y+j];
				}
			}
		}
	};
	
	var adjacentCellIsCanSee = function (x,y) {
		if (_canSeeIndex[x] != undefined) {
			if (_canSeeIndex[x][y+1] === true) {
				return true;
			}
			if (_canSeeIndex[x][y-1] === true) {
				return true;
			}
		}
		
		if (_canSeeIndex[x+1] != undefined && _canSeeIndex[x+1][y] === true) {
			return true;
		}
		
		if (_canSeeIndex[x-1] != undefined && _canSeeIndex[x-1][y] === true) {
			return true;
		}
		
		return false;
	};
	
	var playerCanMove = function (x,y) {
		if (isWall(x,y)) {
			return false;
		};
		
		return true;
	};
	
	var isWall = function (x,y) {
		
		// Outer wall
		if (x < 0 || x >= MAP_TILE_WIDTH || y < 0 || y >= MAP_TILE_HEIGHT) {
			return true;
		}
		
		// Inner wall
		if (_map[x][y] === CELL_TYPE.ROOM_WALL || _map[x][y] === CELL_TYPE.WALL) {
			return true;
		}
		
		return false;		
	};
	
	var isRoom = function (x,y) {
		return _roomIndex[x][y] > -1;
	};
	
	var drawPlayer = function () {
		fillImage(_player.x, _player.y, PLAYER_IMAGE);
	};
	
	var drawDiscoveredArea = function () {
		
		if (_shroudedMap === undefined) {
			return;
		}
		
		for (var i = 0; i < MAP_TILE_WIDTH; i++) {
			for (var j = 0; j < MAP_TILE_HEIGHT; j++) {				
				
				switch(_shroudedMap[i][j]) {
					case CELL_TYPE.ROOM_FLOOR:
						fillImage(i,j,ROOM_FLOOR_IMAGE);
						break;
						
					case CELL_TYPE.CORRIDOR_FLOOR:
						fillImage(i,j,CORRIDOR_FLOOR_IMAGE);
						break;
						
					case CELL_TYPE.DOOR_CLOSED:
						fillImage(i,j,DOOR_CLOSED_IMAGE);
						break;
						
					case CELL_TYPE.DOOR_OPEN:
						fillImage(i,j,DOOR_OPEN_IMAGE);
						break;
						
					case CELL_TYPE.ROOM_WALL:
						fillImage(i,j,ROOM_WALL_IMAGE);
						break;
						
					case CELL_TYPE.WALL:
						fillImage(i,j,WALL_IMAGE);
						break;
						
					case CELL_TYPE.STAIRS_DOWN:
						fillImage(i,j,STAIRS_DOWN_IMAGE);
						break;
						
					case CELL_TYPE.STAIRS_UP:
						fillImage(i,j,STAIRS_UP_IMAGE);
						break;
						
					case CELL_TYPE.PLAYER_SPAWN:
						fill(i,j,COLORS.Red);
						break;
						
					case CELL_TYPE.UNDISCOVERED:
						fill(i,j,COLORS.Black);
						break;
				}
			}
		}
	};
	
	var drawEnemies = function () {
	
	};
	
	var drawProjectiles = function () {
	
	};
	
	var clearScreen = function () {
		_mainCanvas.width = _mainCanvas.width;
	};
	
	var log = function (msg) {
		if (DEBUG) {
			console.log(msg);
		}
	};
	
	var getGridSquare = function (x,y) {
		return {
			x: Math.floor(x / MAP_SCALE_FACTOR),
			y: Math.floor(y / MAP_SCALE_FACTOR)
		};
	};
	
	// color : "rgb(0,0,0)";
	var fill = function (x,y,color) {
		_mainContext.fillStyle = color;
		_mainContext.fillRect(MAP_SCALE_FACTOR * x, MAP_SCALE_FACTOR * y, MAP_SCALE_FACTOR, MAP_SCALE_FACTOR);
	};
	
	var fillImage = function (x,y,image) {
		_mainContext.drawImage(image, MAP_SCALE_FACTOR * x, MAP_SCALE_FACTOR * y, MAP_SCALE_FACTOR, MAP_SCALE_FACTOR);
	};
	
	/*
	
						STATS
	
	*/
	var doStats = function () {
		statsDrawBackground();
	};
	
	var statsDrawBackground = function () {
		var healthRatio = _player.currentHealth / _player.MaxHealth();
		var manaRatio = _player.currentMana / _player.MaxMana();
	
		// Outer Container
		_statsContext.fillStyle = "rgb(119,80,8)";
		_statsContext.fillRect(0, 0, STATS_CANVAS_WIDTH, STATS_CANVAS_HEIGHT);
		
		// Inner Container
		_statsContext.fillStyle = "rgb(119,113,100)";
		_statsContext.fillRect(5, 5, STATS_CANVAS_WIDTH * .90, STATS_CANVAS_HEIGHT * .95);
		
		// Health Bar Container Outline
		_statsContext.fillStyle = COLORS.Black;
		_statsContext.fillRect(10, 10, 32, 92);
		
		// Health Bar Container
		_statsContext.fillStyle = "rgb(119,113,100)";
		_statsContext.fillRect(11, 11, 30, 90);
		
		// Mana Bar Container Outline
		_statsContext.fillStyle = COLORS.Black;
		_statsContext.fillRect(50, 10, 32, 92);
		
		// Mana Bar Container
		_statsContext.fillStyle = "rgb(119,113,100)";
		_statsContext.fillRect(51, 11, 30, 90);
		
		// Health Fill
		_statsContext.fillStyle = COLORS.Red;
		_statsContext.fillRect(11, 11 + (90 - (healthRatio * 90)), 30, healthRatio * 90);
		
		// Mana Fill
		_statsContext.fillStyle = COLORS.Blue;
		_statsContext.fillRect(51, 11 + (90 - (manaRatio * 90)), 30, manaRatio * 90);
		
		// Floor Label
		_statsContext.fillStyle = COLORS.Black;
		_statsContext.font = "7pt Arial";
		_statsContext.fillText("Floor",15,120);
		
		// Floor Container Outline
		_statsContext.fillStyle = COLORS.Black;
		_statsContext.fillRect(14, 124, 22, 22);
		
		// Floor Container 
		_statsContext.fillStyle = COLORS.White;
		_statsContext.fillRect(15, 125, 20, 20);	

		// Floor Data
		_statsContext.fillStyle = COLORS.Black;
		_statsContext.font = "10pt Arial";
		_statsContext.fillText(_statFloor,18,139);
		
		// Rooms Label
		_statsContext.fillStyle = COLORS.Black;
		_statsContext.font = "7pt Arial";
		_statsContext.fillText("Rooms Left",40,120);
		
		// Rooms Container Outline
		_statsContext.fillStyle = COLORS.Black;
		_statsContext.fillRect(49, 124, 22, 22);
		
		// Rooms Container 
		_statsContext.fillStyle = COLORS.White;
		_statsContext.fillRect(50, 125, 20, 20);	

		// Rooms Data
		_statsContext.fillStyle = COLORS.Black;
		_statsContext.font = "10pt Arial";
		_statsContext.fillText(_statNumberOfRooms - _statDiscoveredRooms.length,53,139);
		
		// Turns Label
		_statsContext.fillStyle = COLORS.Black;
		_statsContext.font = "7pt Arial";
		_statsContext.fillText("Turn",40,175);
		
		// Turns Container Outline
		_statsContext.fillStyle = COLORS.Black;
		_statsContext.fillRect(24, 179, 44, 22);
		
		// Turns Container 
		_statsContext.fillStyle = COLORS.White;
		_statsContext.fillRect(25, 180, 42, 20);	

		// Turns Data
		_statsContext.fillStyle = COLORS.Black;
		_statsContext.font = "10pt Arial";
		_statsContext.fillText(_player.turn,28,194);
		
		// Next Action Label
		_statsContext.fillStyle = COLORS.Black;
		_statsContext.font = "7pt Arial";
		_statsContext.fillText("Next Action",25,220);
		
		// Next Action Container Outline
		_statsContext.fillStyle = COLORS.Black;
		_statsContext.fillRect(7, 224, 82, 22);
		
		// Next Action Container 
		_statsContext.fillStyle = COLORS.White;
		_statsContext.fillRect(8, 225, 80, 20);	

		// Next Action Data
		_statsContext.fillStyle = COLORS.Black;
		_statsContext.font = "10pt Arial";
		_statsContext.fillText(getNextActionString(),12,239);
	};
	
	var getNextActionString = function () {
		switch (_player.nextAction) {
			case ACTION_TYPE.MOVE:
				return "Move";
				break;
			case ACTION_TYPE.OPEN_DOOR:
				return "Open Door";
				break;
			case ACTION_TYPE.CLOSE_DOOR:
				return "Close Door";
				break;
		}
	};
	
	var statsMessage = function (message,x,y) {
		_statsContext.fillStyle = COLORS.Black;
		_statsContext.font = "7pt Arial";
		_statsContext.fillText(message,x,y);
	};
	
	var statsRegisterRoom = function (roomIndex) {
		for (var i = 0; i < _statDiscoveredRooms.length; i++) {
			if (roomIndex === _statDiscoveredRooms[i]) {
				return;
			}
		}
		_statDiscoveredRooms.push(roomIndex);
	};
};