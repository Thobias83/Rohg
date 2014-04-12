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
		DOUBLE_INTELLIGENCE:2
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
			default:
				break;
		}
	};
	
	
	/*
		Effects
	*/
	var doubleStrength = function (duration) {
		var init = function (player) {
			this.value[0] = player.str;
			player.str += parseInt(this.value[0]);
		};
		
		var destroy = function (player) {
			player.str -= parseInt(this.value[0]);
		};
		
		return {
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