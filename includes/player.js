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
			Foo:ôfoo,
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
	
	var ôfoo = function () {
		return getArmor(this);
	};
	
	var ômove = function (x,y) {
		this.x = x;
		this.y = y;
	};
	
	/*
		Private functions
	*/
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