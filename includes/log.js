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
var Log = new function () {
	
	var CANVAS_HEIGHT = 576;
	var CANVAS_WIDTH = 256;
	var LINE_HEIGHT = 12;
	var MAX_LINES = Math.floor(CANVAS_HEIGHT / LINE_HEIGHT);
	var LINE_OFFSET = 1;
	
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
	
	var _messages = [];
	var _canvas;
	var _context;
	
	
	this.Init = function () {
		initUi();
		setContext();
		refreshDisplay();
	};
	
	this.Restart = function () {
		refreshDisplay();
		_messages = [];
	};
	
	this.AddMessage = function (text,turn) {
		_messages[_messages.length] = {text:text,turn:turn};
		refreshDisplay();
	};
	
	var initUi = function () {
		var centerY = (window.innerHeight - CANVAS_WIDTH) / 2;
		$("#LogContainer").draggable();
		$("#LogContainer").css("top", centerY).css("left", 100);
	};
	
	var setContext = function () {
		_canvas = document.getElementById("LogCanvas");
		_context = _canvas.getContext("2d");
	};
	
	var refreshDisplay = function () {
		clearDisplay();
		printMessages();
	};
	
	var printMessages = function () {
		var numberOfMessages = _messages.length;
		var lastTurn;
		var messageIndex;
		var color = COLORS.White;
		
		if (numberOfMessages > MAX_LINES) {
			numberOfMessages = MAX_LINES;
		}
		
		if (numberOfMessages > 0) {
			lastTurn = _messages[_messages.length - numberOfMessages].turn;
		}
		
		for (var i = 0; i < numberOfMessages; i++) {
			messageIndex = _messages.length - numberOfMessages + i;
			
			if (_messages[messageIndex] === undefined) {
				continue;
			}
			
			if (lastTurn != _messages[messageIndex].turn) {
				color = color === COLORS.White ? COLORS.DarkGray : COLORS.White;
				lastTurn = _messages[messageIndex].turn;
			};
			
			printMessage(_messages[messageIndex], i, color);
		}
	};
	
	var clearDisplay = function () {
		_canvas.width = _canvas.width;
	};
	
	var printMessage = function (message,line,color) {
		_context.fillStyle = color;
		_context.font = "10px Segoe UI";
		_context.fillText(message.turn + ": " + message.text, 5, LINE_HEIGHT * (line + 1) - LINE_OFFSET);
	};
};