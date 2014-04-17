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
		Sounds
	*/
	var SOUND_EAT = "includes/sounds/eat1.ogg";
	
	
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
			consumptionChanceD20:16,
			turn:0,
			nextAction:ACTION_TYPE.MOVE,
			Kick:ôkick,
			MenuSelect:ômenuSelect,
			AddItem:ôaddItem,
			RemoveItem:ôremoveItem,
			WearItem:ôwearItem,
			TakeOffItem:ôtakeOffItem,
			AddEffect:ôaddEffect,
			RemoveEffect:ôremoveEffect,
			SetAction:ôsetAction,
			Log:ôlog,
			TakeTurn:ôtakeTurn,
			Move:ômove,
			MaxHealth: ôgetMaxHealth,
			MaxMana: ôgetMaxMana
		};
	};
	
	/*
		Member functions
	*/
	var ôkick = function () {
		kick(this);
	};
	
	var ômenuSelect = function (selectionNumber) {
		menuSelect(this, selectionNumber);
	};
	
	var ôaddEffect = function (effectType, duration) {
		return addEffect(this, effectType, duration);
	};
	
	var ôremoveEffect = function (effectIndex) {
		removeEffect(this, effectIndex);
	};
	
	var ôaddItem = function (item) {
		return addItem(this, item);
	};
	
	var ôremoveItem = function (itemIndex) {
		removeItem(this, itemIndex);
	};
	
	var ôwearItem = function (itemIndex) {
		wearItem(this, itemIndex);
	};
	
	var ôtakeOffItem = function (itemIndex) {
		takeOffItem(this, itemIndex);
	};
	
	var ôlog = function (messageText) {
		addMessage(this, messageText);
	};
	
	var ôsetAction = function (nextAction) {
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
			case ACTION_TYPE.EAT:
				showEatableList(this);
				break;
			default:
				break;
		}
		this.nextAction = nextAction;
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
	var kick = function (player) {
		consumeFood(player);
	};
	
	var menuSelect = function (player, selectionNumber) {
		switch (player.nextAction) {
			case ACTION_TYPE.WEAR:
				wearBySelection(player, selectionNumber);
				break;
			case ACTION_TYPE.TAKE_OFF:
				takeOffBySelection(player, selectionNumber);
				break;
			case ACTION_TYPE.EAT:
				eatBySelection(player, selectionNumber);
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
	
	var getEffectIdsByType = function (player, type) {
		var results = [];
		
		for (var i in player.effects) {
			if (player.effects[i] === undefined || player.effects[i] === -1) {
				continue;
			}
			
			if (player.effects[i].type === type) {
				results.push(i);
			}
		};
		
		return results;
	};
	
	var isHungry = function (player) {
		return getEffectIdsByType(player, EFFECTS.HUNGRY).length > 0;
	};
	var isWeak = function (player) {
		return getEffectIdsByType(player, EFFECTS.WEAK).length > 0;
	};
	var isFamished = function (player) {
		return getEffectIdsByType(player, EFFECTS.FAMISHED).length > 0;
	};
	var isStarving = function (player) {
		return getEffectIdsByType(player, EFFECTS.STARVING).length > 0;
	};
	
	var addItem = function (player, item) {
		player.items[_itemIdCounter] = item;
		_itemIdCounter++;
		
		item.Add(player);
		addMessage(player, "Added item: " + item.name);
		
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
	
	// Returns a list of items that can be eaten
	var getEatableSelections = function (player) {
		var selection = 0;
		var itemIds = []; // subscript is selection number, value is itemId
		
		for (var i = 0; i < player.items.length; i++) {
			if (player.items[i] != undefined && player.items[i].itemType === ITEM_TYPE.EATABLE) {
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
	
	var showEatableList = function (player) {
		var itemIds = getEatableSelections(player);
		
		if (itemIds.length === 0) {
			addMessage(player, "You have nothing to eat.");
			player.nextAction = ACTION_TYPE.MOVE;
			return;
		}
		
		addMessage(player, "What would you like to eat?");
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
	
	var eatBySelection = function (player, selectionNumber) {
		var itemIds = getEatableSelections(player);
		
		if (itemIds.length === 0) {
			addMessage(player, "You have nothing to eat.");
			player.nextAction = ACTION_TYPE.MOVE;
			return;
		}
		
		if (itemIds[selectionNumber] === undefined) {
			addMessage(player, "Invalid selection.");
			showEatableList(player);
			return;
		}
		
		eatItem(player, itemIds[selectionNumber]);
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
	
	var eatItem = function (player, itemId) {
		var item = player.items[itemId];
		
		addMessage(player, "You eat the " + item.name + ".");
		item.Eat(player);
		player.RemoveItem(itemId);
		
		takeTurn(player);
		setHunger(player);
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
		if (effect.initMessage != undefined && effect.initMessage != "") {
			addMessage(player, effect.initMessage);
		}
		
		player.effects[_effectIdCounter] = effect;
		_effectIdCounter++;
		return _effectIdCounter - 1;
	};
	
	var removeEffect = function (player, effectId) {
		var effect = player.effects[effectId];
		
		effect.Destroy(player);
		if (effect.destroyMessage != undefined && effect.destroyMessage != "") {
			addMessage(player, effect.destroyMessage);
		}
		
		player.effects[effectId] = undefined;
	};
	
	var addMessage = function (player, messageText) {
		Log.AddMessage(messageText,player.turn);
	};
	
	// This is a very important function
	var takeTurn = function (player) {
		if (Roll.D20() > player.consumptionChanceD20) {
			consumeFood(player);
		}
		decrementEffects(player);
		player.turn++;
		player.nextAction = ACTION_TYPE.MOVE;
		
		// This function triggers a browser-wide event so other namespaces can take action on the turn
		document.dispatchEvent(new Event("turn"));
	};
	
	var resetHunger = function (player) {
		var wasFine = true;
	
		for (var i in player.effects) {
			if (player.effects[i] === undefined || player.effects[i] === -1) {
				continue;
			}
			
			switch (player.effects[i].type) {
				case EFFECTS.HUNGRY:
				case EFFECTS.WEAK:
				case EFFECTS.FAMISHED:
				case EFFECTS.STARVING:
					wasFine = false;
					removeEffect(player, i);
				default:
					break;
			};
		};
		
		if (!wasFine) {
			player.Log("You are no longer hungry.");
		};
	};
	
	var setHunger = function (player) {
	
		var type = getCurrentHungerState(player);
		
		if (type === undefined) {
			resetHunger(player);
			return;
		}
		
		for (var i in player.effects) {
			if (player.effects[i] === undefined || player.effects[i] === -1) {
				continue;
			}
			
			if (player.effects[i].type === type) {
				return;
			}
			
			switch (player.effects[i].type) {
				case EFFECTS.HUNGRY:
				case EFFECTS.WEAK:
				case EFFECTS.FAMISHED:
				case EFFECTS.STARVING:
					removeEffect(player, i);
					addEffect(player, type, -1);
					return;
				default:
					break;
			};
		};
		
		addEffect(player, type, -1);
	};
	
	var getCurrentHungerState = function (player) {
		if (player.currentFood === 0) {
			return EFFECTS.STARVING;
		}
		
		if (player.currentFood < player.maxFood * 0.1) {
			return EFFECTS.FAMISHED;
		}
		
		if (player.currentFood < player.maxFood * 0.3) {
			return EFFECTS.WEAK;
		}
		
		if (player.currentFood < player.maxFood * 0.6) {
			return EFFECTS.HUNGRY;
		}
	};
	
	var consumeFood = function (player) {
		
		player.currentFood = player.currentFood - player.foodConsumptionRate;
		
		if (player.currentFood <= 0) {
			player.currentFood = 0;
		}
		
		setHunger(player);
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