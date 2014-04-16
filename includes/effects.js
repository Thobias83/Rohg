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
var Effects = new function () {
	
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

	/*
		Effect Registry
	*/
	this.GetEffect = function (effectType, duration) {
		switch (effectType) {
			case EFFECTS.DOUBLE_STRENGTH:
				return doubleStrength(duration);
			case EFFECTS.DOUBLE_AGILITY:
				return doubleAgility(duration);
			case EFFECTS.DOUBLE_INTELLIGENCE:
				return doubleIntelligence(duration);
			case EFFECTS.LIGHT_RADIUS_UP:
				return lightRadiusUp(duration);
			case EFFECTS.HUNGRY:
				return hungry(duration);
			case EFFECTS.WEAK:
				return weak(duration);
			case EFFECTS.FAMISHED:
				return famished(duration);
			case EFFECTS.STARVING:
				return starving(duration);
			case EFFECTS.EATING_HALF:
				return eatingHalf();
			default:
				break;
		}
	};
	
	
	/*
		Effects
	*/
	var eatingHalf = function () {
		var init = function (player) {
			player.currentFood += player.maxFood * 0.5;
			if (player.currentFood > player.maxFood) {
				player.currentFood = player.maxFood;
			}
		};
		
		var destroy = function (player) {
		};
		
		return {
			type: EFFECTS.STARVING,
			name: "Eating Half",
			initMessage: "Yum!",
			destroyMessage: undefined,
			value: [],
			duration: 1,
			Init: init,
			Destroy: destroy
		};
	};
	var starving = function (duration) {
		var init = function (player) {
		};
		
		var destroy = function (player) {
		};
		
		return {
			type: EFFECTS.STARVING,
			name: "Starving",
			initMessage: "You are starving to death!",
			destroyMessage: undefined,
			value: [],
			duration: duration,
			Init: init,
			Destroy: destroy
		};
	};
	var famished = function (duration) {
		var init = function (player) {
		};
		
		var destroy = function (player) {
		};
		
		return {
			type: EFFECTS.FAMISHED,
			name: "Famished",
			initMessage: "You feel famished.",
			destroyMessage: undefined,
			value: [],
			duration: duration,
			Init: init,
			Destroy: destroy
		};
	};
	var weak = function (duration) {
		var init = function (player) {
		};
		
		var destroy = function (player) {
		};
		
		return {
			type: EFFECTS.WEAK,
			name: "Starving",
			initMessage: "You feel weak.",
			destroyMessage: undefined,
			value: [],
			duration: duration,
			Init: init,
			Destroy: destroy
		};
	};
	var hungry = function (duration) {
		var init = function (player) {
		};
		
		var destroy = function (player) {
		};
		
		return {
			type: EFFECTS.HUNGRY,
			name: "Hungry",
			initMessage: "You feel hungry.",
			destroyMessage: undefined,
			value: [],
			duration: duration,
			Init: init,
			Destroy: destroy
		};
	};
	var lightRadiusUp = function (duration) {
		var init = function (player) {
			player.lightRadius += 2;
		};
		
		var destroy = function (player) {
			player.lightRadius -= 2;
		};
		
		return {
			type: EFFECTS.LIGHT_RADIUS_UP,
			name: "Light Radius Up",
			initMessage: "You feel more radiant.",
			destroyMessage: "Your extra radiance fades.",
			value: [],
			duration: duration,
			Init: init,
			Destroy: destroy
		};
	};
	var doubleStrength = function (duration) {
		var init = function (player) {
			this.value[0] = player.str;
			player.str += parseInt(this.value[0]);
		};
		
		var destroy = function (player) {
			player.str -= parseInt(this.value[0]);
		};
		
		return {
			type: EFFECTS.DOUBLE_STRENGTH,
			name: "Double Strength",
			initMessage: "You feel stronger!",
			destroyMessage: "Your extra strength fades.",
			value: [],
			duration: duration,
			Init: init,
			Destroy: destroy
		};
	};
	var doubleAgility = function (duration) {
		var init = function (player) {
			this.value[0] = player.agi;
			player.agi += parseInt(this.value[0]);
		};
		
		var destroy = function (player) {
			player.agi -= parseInt(this.value[0]);
		};
		
		return {
			type: EFFECTS.DOUBLE_AGILITY,
			name: "Double Agility",
			initMessage: "You feel quicker!",
			destroyMessage: "Your extra agility fades.",
			value: [],
			duration: duration,
			Init: init,
			Destroy: destroy
		};
	};
	var doubleIntelligence = function (duration) {
		var init = function (player) {
			this.value[0] = player.intel;
			player.intel += parseInt(this.value[0]);
		};
		
		var destroy = function (player) {
			player.intel -= parseInt(this.value[0]);
		};
		
		return {
			type: EFFECTS.DOUBLE_INTELLIGENCE,
			name: "Double Intelligence",
			initMessage: "You feel smarter!",
			destroyMessage: "Your extra intelligence fades.",
			value: [],
			duration: duration,
			Init: init,
			Destroy: destroy
		};
	};
};