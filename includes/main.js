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
	var FPS = 15;
	var DEBUG = false;
	var MAX_MAP_SCALE = 64;
	var MIN_MAP_SCALE = 4;
	
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
	var WALL_IMAGE_SRC = "includes/images/floorTile1.png";
	var WALL_IMAGE = new Image();
	WALL_IMAGE.src = WALL_IMAGE_SRC;
	var STAIRS_DOWN_IMAGE_SRC = "includes/images/floorTile3.png";
	var STAIRS_DOWN_IMAGE = new Image();
	STAIRS_DOWN_IMAGE.src = STAIRS_DOWN_IMAGE_SRC;
	
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
		
		
		uiInit();
		populateOptions();
		setContext();
		initMap();	
		initPlayer();
		bindEvents();
		startScreenTimer();
	};
	
	this.Log = function (msg) {
		log(msg);
	};
	
	/*
		Private functions
	*/
	var buildRoomIndex = function () {
		var result = [];
		
		// initialize the array
		for (var i = 0; i < _map.length; i++) {
			result[i] = [];
			for (var j = 0; j < _map[i].length; j++) {
				result[i][j] = -1;
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
			}
		}
		
		_roomIndex = result;
	};
	
	var uiInit = function () {
		$("#RegenerateMap").button();
		$("#GenerateRandomMap").button();
		$("#StatsContainer").draggable();
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
		
		buildRoomIndex();
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
		
		// x,y,str,agi,intel,lightRadius,currentHealth,currentMana
		_player = Player.Init(Math.floor(MAP_TILE_WIDTH / 2), Math.floor(MAP_TILE_HEIGHT / 2), 10, 10, 10, 1, 10, 10);

		resetStats();
		buildShroudedMap();
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
		$("#MainCanvas").click(carveSpace);
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
		
		log(keyPressed);
		
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
			default:
				break;		
		}
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
	};
	
	var drawDiscoveredArea = function () {
		
	};
	
	var movePlayer = function (x,y) {
		
		if (!playerCanMove(x,y)) {
			return;
		}
		
		_player.Move(x,y);
		
		$("#CurrentRoomIndex").text(_roomIndex[x][y]);
		_shroudedMap[x][y] = _map[x][y];
		
		if (isDownStairs(x,y)) {
			goDown();
		} else if (isRoom(x,y)){
			unshroudRoomByLocation(x,y);
			statsRegisterRoom(_roomIndex[x][y]);
		} else {
			unshroudPlayerLightRadius(x,y);
		}
	};
	
	var goDown = function () {
		initMap();
		_player.Move(MAP_TILE_WIDTH / 2,MAP_TILE_HEIGHT / 2);
		buildShroudedMap();
		resetDiscoveredRooms();
		_statFloor++;
	};
	
	var isDownStairs = function (x,y) {
		return _map[x][y] === CELL_TYPE.STAIRS_DOWN;
	};
	
	var unshroudPlayerLightRadius = function (x,y) {
		var radius = _player.lightRadius;
		
		for (var i = -radius; i <= radius; i++) {
			for (var j = -radius; j <= radius; j++) {
				_shroudedMap[x+i][y+j] = _map[x+i][y+j];
			}
		}
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
						fill(i,j,COLORS.DarkRed);
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
						fill(i,j,COLORS.Red);
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