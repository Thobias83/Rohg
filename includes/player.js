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
var Player = new function () {

	/*
		Globals
	*/
	var MAX_HEALTH_MULTIPLIER;
	var MAX_MANA_MULTIPLIER;
	var ARMOR_MULT;
	var _items;
	// Resetter
	var resetGlobals = function () {
		MAX_HEALTH_MULTIPLIER = 2
		MAX_MANA_MULTIPLIER = 2
		ARMOR_MULT = 2;
		_items = [];
	};
	
	
	/*
		Enums
	*/
	var DIRECTION = {
		NORTH:0,
		EAST:1,
		SOUTH:2,
		WEST:3
	};
	var ACTION_TYPE = {
		MOVE:0,
		OPEN_DOOR:1,
		CLOSE_DOOR:2
	};
	
	
	/*
		Constructor
	*/
	this.Init = function (x,y,str,agi,intel,lightRadius,currentHealth,currentMana) {
		
		resetGlobals();
		
		return {
			inventory:getNewInv(),
			x:x,
			y:y,
			str:str,
			agi:agi,
			intel:intel,
			lightRadius:lightRadius,
			currentHealth:currentHealth,
			currentMana:currentMana,
			turn:0,
			nextAction:ACTION_TYPE.MOVE,
			SetAction:ôsetAction,
			Log:ôlog,
			TakeTurn:ôtakeTurn,
			Move:ômove,
			MaxHealth: ôgetMaxHealth,
			MaxMana: ôgetMaxMana,
			PickupItem: ôaddItem,
			GetItems: ôgetItems
		};
	};
	
	/*
		Member functions
	*/
	var ôlog = function (messageText) {
		addMessage(this, messageText);
	};
	
	var ôsetAction = function (nextAction) {
		switch (nextAction) {
			case ACTION_TYPE.MOVE:
				break;
			case ACTION_TYPE.OPEN_DOOR:
				addMessage(this, "Opening...")
				break;
			case ACTION_TYPE.CLOSE_DOOR:
				addMessage(this, "Closing...")
				break;
		}
		this.nextAction = nextAction;
	};
	
	var ôgetItems = function () {
		return _items;
	};
	
	var ôaddItem = function (item) {
		_items.push(item);
	};
	
	var ôgetMaxHealth = function () {
		return getMaxHealth(this);
	};
	
	var ôgetMaxMana = function () {
		return getMaxMana(this);
	};
	
	var ôtakeTurn = function (messageText) {
		if (messageText != undefined) {
			addMessage(this,messageText);
		}
		
		takeTurn(this);
	};
	
	var ômove = function (x,y, messageText) {
		if (messageText != undefined) {
			addMessage(this,messageText);
		}
		this.x = x;
		this.y = y;
		takeTurn(this);
	};
	
	/*
		Private functions
	*/
	var addMessage = function (player, messageText) {
		Log.AddMessage(messageText,player.turn);
	};
	
	var takeTurn = function (player) {
		player.turn++;
		player.nextAction = ACTION_TYPE.MOVE;
	};
	
	var getNewInv = function () {
		return {
			items:[]
		};
	};
	
	var getMaxHealth = function (player) {
		return player.str * MAX_HEALTH_MULTIPLIER;
	};
	
	var getMaxMana = function (player) {
		return player.intel * MAX_MANA_MULTIPLIER;
	};
	
	var getArmor = function (player) {
		return player.agi * ARMOR_MULT;
	};
};