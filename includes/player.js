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
	var _effectIdCounter;
	var _itemIdCounter;
	// Resetter
	var resetGlobals = function () {
		MAX_HEALTH_MULTIPLIER = 2
		MAX_MANA_MULTIPLIER = 2
		ARMOR_MULT = 2;
		_effectIdCounter = 0;
		_itemIdCounter = 0;
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
		CLOSE_DOOR:2,
		KICK:3,
		WEAR:4,
		TAKE_OFF:5
	};
	var EFFECTS = {
		DOUBLE_STRENGTH:0,
		DOUBLE_AGILITY:1,
		DOUBLE_INTELLIGENCE:2
	};
	var ITEM_TYPE = {
		WEARABLE:0,
		WIELDABLE:1,
		DRINKABLE:2,
		READABLE:3,
		EATABLE:4,
		PASSIVE:5
	};
	
	
	/*
		Constructor
	*/
	this.Init = function (x,y,str,agi,intel,lightRadius,currentHealth,currentMana,maxFood) {
		
		resetGlobals();
		
		return {
			inventory:getNewInv(),
			x:x,
			y:y,
			str:str,
			agi:agi,
			intel:intel,
			lightRadius:lightRadius,
			effects:[],
			items:[],
			currentHealth:currentHealth,
			currentMana:currentMana,
			maxFood:maxFood,
			currentFood:maxFood,
			foodConsumptionRate:1,
			turn:0,
			nextAction:ACTION_TYPE.MOVE,
			MenuSelect:�menuSelect,
			AddItem:�addItem,
			RemoveItem:�removeItem,
			WearItem:�wearItem,
			TakeOffItem:�takeOffItem,
			AddEffect:�addEffect,
			RemoveEffect:�removeEffect,
			SetAction:�setAction,
			Log:�log,
			TakeTurn:�takeTurn,
			Move:�move,
			MaxHealth: �getMaxHealth,
			MaxMana: �getMaxMana
		};
	};
	
	/*
		Member functions
	*/
	var �menuSelect = function (selectionNumber) {
		menuSelect(this, selectionNumber);
	};
	
	var �addEffect = function (effectType, duration) {
		return addEffect(this, effectType, duration);
	};
	
	var �removeEffect = function (effectIndex) {
		removeEffect(this, effectIndex);
	};
	
	var �addItem = function (item) {
		return addItem(this, item);
	};
	
	var �removeItem = function (itemIndex) {
		removeItem(this, itemIndex);
	};
	
	var �wearItem = function (itemIndex) {
		wearItem(this, itemIndex);
	};
	
	var �takeOffItem = function (itemIndex) {
		takeOffItem(this, itemIndex);
	};
	
	var �log = function (messageText) {
		addMessage(this, messageText);
	};
	
	var �setAction = function (nextAction) {
		switch (nextAction) {
			case ACTION_TYPE.MOVE:
				break;
			case ACTION_TYPE.OPEN_DOOR:
				addMessage(this, "Opening...");
				break;
			case ACTION_TYPE.CLOSE_DOOR:
				addMessage(this, "Closing...");
				break;
			case ACTION_TYPE.KICK:
				addMessage(this, "Kicking...");
				break;
			case ACTION_TYPE.WEAR:
				showWearableList(this);
				break;
			case ACTION_TYPE.TAKE_OFF:
				showWornList(this);
				break;
			default:
				break;
		}
		this.nextAction = nextAction;
	};
	
	var �getMaxHealth = function () {
		return getMaxHealth(this);
	};
	
	var �getMaxMana = function () {
		return getMaxMana(this);
	};
	
	var �takeTurn = function (messageText) {
		if (messageText != undefined) {
			addMessage(this,messageText);
		}
		
		takeTurn(this);
	};
	
	var �move = function (x,y, messageText) {
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
	var menuSelect = function (player, selectionNumber) {
		switch (player.nextAction) {
			case ACTION_TYPE.WEAR:
				wearBySelection(player, selectionNumber);
				break;
			case ACTION_TYPE.TAKE_OFF:
				takeOffBySelection(player, selectionNumber);
				break;
			default:
				break;
		}
	};
	
	var decrementEffects = function (player) {
		for (var i in player.effects) {
			if (player.effects[i] === undefined || player.effects[i] === -1) {
				continue;
			}
			
			player.effects[i].duration--;
			
			if (player.effects[i].duration === 0) {
				removeEffect(player, i);
			}
		};
	};
	
	var addItem = function (player, item) {
		player.items[_itemIdCounter] = item;
		_itemIdCounter++;
		
		item.Add(player);
		addMessage(player, "Added item: " + item.name);
		
		console.log(player.items);
		
		return _itemIdCounter - 1;
	};
	
	var removeItem = function (player, itemId) {
		var item = player.items[itemId];
		
		item.Remove(player);
		addMessage(player, "Removed item: " + item.name);
		
		player.items[itemId] = undefined;
	};
	
	// Returns a list of items that can be worn
	var getWearableSelections = function (player) {
		var selection = 0;
		var itemIds = []; // subscript is selection number, value is itemId
		
		for (var i = 0; i < player.items.length; i++) {
			if (player.items[i] != undefined && player.items[i].itemType === ITEM_TYPE.WEARABLE) {
				itemIds[selection] = i;
				selection++;
			};
		};
		
		return itemIds;
	};
	
	// Returns a list of items that are worn
	var getWornSelections = function (player) {
		var selection = 0;
		var itemIds = []; // subscript is selection number, value is itemId
		
		for (var i = 0; i < player.items.length; i++) {
			if (player.items[i] != undefined && player.items[i].itemType === ITEM_TYPE.WEARABLE && player.items[i].worn === true) {
				itemIds[selection] = i;
				selection++;
			};
		};
		
		return itemIds;
	};
	
	var showWornList = function (player) {
		var itemIds = getWornSelections(player);
		
		if (itemIds.length === 0) {
			addMessage(player, "You are not wearing anything.");
			player.nextAction = ACTION_TYPE.MOVE;
			return;
		}
		
		addMessage(player, "What would you like to take off?");
		for (var i = 0; i < itemIds.length; i++) {
			addMessage(player, "    " + i + ": " + player.items[itemIds[i]].name);
		}
	};
	
	var showWearableList = function (player) {
		var itemIds = getWearableSelections(player);
		
		if (itemIds.length === 0) {
			addMessage(player, "You have nothing to wear.");
			player.nextAction = ACTION_TYPE.MOVE;
			return;
		}
		
		addMessage(player, "What would you like to put on?");
		for (var i = 0; i < itemIds.length; i++) {
			addMessage(player, "    " + i + ": " + player.items[itemIds[i]].name);
		}
	};
	
	var takeOffBySelection = function (player, selectionNumber) {
		var itemIds = getWornSelections(player);
		
		if (itemIds.length === 0) {
			addMessage(player, "You are not wearing anything.");
			player.nextAction = ACTION_TYPE.MOVE;
			return;
		}
		
		if (itemIds[selectionNumber] === undefined) {
			addMessage(player, "Invalid selection.");
			showWornList(player);
			return;
		}
		
		takeOffItem(player, itemIds[selectionNumber]);
	};
	
	var wearBySelection = function (player, selectionNumber) {
		var itemIds = getWearableSelections(player);
		
		if (itemIds.length === 0) {
			addMessage(player, "You have nothing to wear.");
			player.nextAction = ACTION_TYPE.MOVE;
			return;
		}
		
		if (itemIds[selectionNumber] === undefined) {
			addMessage(player, "Invalid selection.");
			showWearableList(player);
			return;
		}
		
		wearItem(player, itemIds[selectionNumber]);
	};
	
	var wearItem = function (player, itemId) {
		var item = player.items[itemId];
		
		addMessage(player, "You put on " + item.name + ".");
		item.Wear(player);
		
		takeTurn(player);
	};
	
	var takeOffItem = function (player, itemId) {
		var item = player.items[itemId];
		
		item.TakeOff(player);
	};
	
	var addEffect = function (player, effectType, duration) {
		var effect = Effects.GetEffect(effectType, duration);
		
		effect.Init(player);
		addMessage(player, effect.initMessage);
		
		player.effects[_effectIdCounter] = effect;
		_effectIdCounter++;
		return _effectIdCounter - 1;
	};
	
	var removeEffect = function (player, effectId) {
		var effect = player.effects[effectId];
		
		effect.Destroy(player);
		addMessage(player, effect.destroyMessage);
		
		player.effects[effectId] = undefined;
	};
	
	var addMessage = function (player, messageText) {
		Log.AddMessage(messageText,player.turn);
	};
	
	var takeTurn = function (player) {
		decrementEffects(player);
		player.turn++;
		player.nextAction = ACTION_TYPE.MOVE;
		document.dispatchEvent(new Event("turn"));
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