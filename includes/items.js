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
var Items = new function () {
	
	var ITEM_TYPE = {
		WEARABLE:0,
		WIELDABLE:1,
		DRINKABLE:2,
		READABLE:3,
		EATABLE:4,
		PASSIVE:5
	};
	var WEARABLE_TYPE = {
		CHEST:0,
		HELM:1,
		BOOTS:2,
		GLOVE:3,
		PANTS:4,
		RING:5,
		AMULET:6
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
		COOKIE:1,
	};
	
	/*
		Sounds
	*/
	var SOUND_EAT = "includes/sounds/eat1.ogg";
	
	/*
		Item Registry
	*/
	this.GetItem = function (item) {
		switch (item) {
			case ITEMS.AMULET_OF_THE_TITANS:
				return amuletOfTheTitans();
			case ITEMS.COOKIE:
				return cookie();
			default:
				break;
		}
	};
	
	var cookie = function () {
		
		var add = function (player) {
		};
		var remove = function (player) {
		};
		var wear = function (player) {
		};
		var takeOff = function (player) {
		};
		var wield = function (player) {
		};
		var unwield = function (player) {
		};
		var drink = function (player) {
		};
		var read = function (player) {
		};
		var eat = function (player) {
			player.AddEffect(this.eat_status_effect, 1);
			sound = new Audio(SOUND_EAT);
			sound.play();
		};
		
		
		return {
			level: 1,
			itemType: ITEM_TYPE.EATABLE,
			name: "Cookie",
			description: "Delicious!",
			cursed:false,
			wieldable_type: undefined,
			damage: undefined,
			wielded: undefined,
			wield_status_effect: undefined,
			wield_status_effect_index: undefined,
			wearable_type: undefined,
			ac: undefined,
			worn: undefined,
			wear_status_effect: undefined,
			wear_status_effect_index: undefined,
			drink_status_effect: undefined,
			read_status_effect: undefined,
			eat_status_effect: EFFECTS.EATING_HALF,
			add_status_effect: undefined,
			wear_status_effect_index: undefined,
			Add: add,
			Remove: remove,
			Wear: wear,
			TakeOff: takeOff,
			Wield: wield,
			Unwield: unwield,
			Drink: drink,
			Read: read,
			Eat: eat
		};
	};
	
	var amuletOfTheTitans = function () {
		
		var add = function (player) {
		};
		var remove = function (player) {
		};
		var wear = function (player) {
			if (!this.worn) {
				this.wear_status_effect_index = player.AddEffect(this.wear_status_effect, -1);
				this.worn = true;
			}
		};
		var takeOff = function (player) {
			if (this.worn) {
				player.RemoveEffect(this.wear_status_effect_index);
				this.worn = false;
			}
		};
		var wield = function (player) {
		};
		var unwield = function (player) {
		};
		var drink = function (player) {
		};
		var read = function (player) {
		};
		var eat = function (player) {
		};
		
		
		return {
			level: 1,
			itemType: ITEM_TYPE.WEARABLE,
			name: "Amulet of the Titans",
			description: "The most important object in the universe.",
			cursed:false,
			wieldable_type: undefined,
			damage: undefined,
			wielded: undefined,
			wield_status_effect: undefined,
			wield_status_effect_index: undefined,
			wearable_type: WEARABLE_TYPE.AMULET,
			ac: 0,
			worn: false,
			wear_status_effect: EFFECTS.LIGHT_RADIUS_UP,
			wear_status_effect_index: -1,
			drink_status_effect: undefined,
			read_status_effect: undefined,
			eat_status_effect: undefined,
			add_status_effect: -1,
			wear_status_effect_index: undefined,
			Add: add,
			Remove: remove,
			Wear: wear,
			TakeOff: takeOff,
			Wield: wield,
			Unwield: unwield,
			Drink: drink,
			Read: read,
			Eat: eat
		};
	};
};