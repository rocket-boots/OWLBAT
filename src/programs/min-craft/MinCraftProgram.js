import Program from '../../Program.js';
import World from './World.js';
import Toon from './Toon.js';
import Thing from './Thing.js';

const SCREEN_SIZE = [512, 512];
const SCREEN_CENTER = [256, 256];
const SQUARE_PART = [[-12, 12], [12, 12], [12, -12], [-12, -12], [-12, 12]];
const FOCUS_PARTS = [
	[[-13, 8], [-13, 13], [-8, 13]],
	[[13, 8], [13, 13], [8, 13]],
	[[13, -8], [13, -13], [8, -13]],
	[[-13, -8], [-13, -13], [-8, -13]],
];
const DEFAULT_PARTS = [
	[[-7, -7], [7, 7]],
	[[-7, 7], [7, -7]],
];

class MinCraftProgram extends Program {
	constructor(...args) {
		super(...args);
		this.name = 'Min-Craft';
		this.aliases = ['mc', 'mincraft', 'mc1975'];
		this.toons = [];
		this.tick = 0;
		this.focus = [0, -1]; // TODO: move to toon
		this.world = new World();
		this.keyCommands = {
			splash: {
				'Enter': (toon) => this.toggleMenu(toon, 'splash'),
				'`': (toon) => this.exit(toon),
			},
			world: {
				'w': (toon) => this.moveToon(toon, 0, toon.speed), // up
				's': (toon) => this.moveToon(toon, 0, -toon.speed), // down
				'x': (toon) => this.moveToon(toon, 0, -toon.speed), // down
				'a': (toon) => this.moveToon(toon, -toon.speed, 0), // left
				'd': (toon) => this.moveToon(toon, toon.speed, 0), // right
				' ': (toon) => this.doAction(toon),
				'e': (toon) => this.doAction(toon),
				'q': (toon) => {}, // TODO: drop item? or quick-slot?
				'Enter': (toon) => this.doAction(toon),
				'i': (toon) => this.toggleMenu(toon, 'inventory'),
				'Tab': (toon) => this.toggleMenu(toon, 'inventory'),
				'z': (toon) => this.toggleMenu(toon, 'inventory'),
				'c': (toon) => this.toggleMenu(toon, 'crafting'),
				'1': (toon) => Toon.equipByIndex(toon, 0),
				'2': (toon) => Toon.equipByIndex(toon, 1),
				'3': (toon) => Toon.equipByIndex(toon, 2),
				'4': (toon) => Toon.equipByIndex(toon, 3),
				't': (toon) => this.throwEquipped(toon),
				'`': (toon) => this.exit(toon),
			},
			menu: {
				'w': (toon) => this.moveMenu(toon, -1),
				's': (toon) => this.moveMenu(toon, 1),
				'x': (toon) => this.moveMenu(toon, 1),
				'a': (toon) => this.toggleMenu(toon), 
				'd': (toon) => this.toggleMenu(toon),
				' ': (toon) => this.doMenuAction(toon),
				'Enter': (toon) => this.doMenuAction(toon),
				'e': (toon) => this.doMenuAction(toon),
				'q': (toon) => {}, // TODO: drop item?
				'i': (toon) => this.toggleMenu(toon, 'inventory'),
				'Tab': (toon) => this.toggleMenu(toon, 'inventory'),
				'z': (toon) => this.toggleMenu(toon, 'inventory'),
				'c': (toon) => this.toggleMenu(toon, 'crafting'),
				'r': (toon) => this.toggleMenu(toon, 'crafting'),
				'1': (toon) => Toon.equipSwap(toon, 0),
				'2': (toon) => Toon.equipSwap(toon, 1),
				'3': (toon) => Toon.equipSwap(toon, 2),
				'4': (toon) => Toon.equipSwap(toon, 3),
				't': (toon) => this.throwEquipped(toon),
				'`': (toon) => this.exit(toon),
				// TODO: Esc to close menus
			},
		};
	}

	connected(userKey) { // overwrite program method
		// TODO: Handle connecting to an existing player
		const newToon = {
			pos: [0, 0], // x, y
			direction: [0, -1],
			inventory: ['hands', 'wood bundle'],
			crafting: Thing.getRecipeKeys(),
			target: null,
			menu: 'splash',
			index: { inventory: 0, crafting: 0 },
			info: [],
			parts: Toon.TOON_PARTS,
			speed: World.STANDARD_BLOCK_SIZE, // * .8,
			maxInventory: 24,
		};
		window.toon = newToon; // TESTING
		this.toons.push(newToon);
	}

	exit(toon) {
		const identity = this.getUser(); // TODO: Look up user by toon
		this.output(identity, { commands: ['clear', 'exit'] });
	}

	moveToon(toon, x, y) {
		const { focus } = this;
		const newDirection = [
			(x === 0) ? 0 : x / Math.abs(x),
			(y === 0) ? 0 : y / Math.abs(y),
		];
		const isTurning = (newDirection[0] !== toon.direction[0] || newDirection[1] !== toon.direction[1]);
		if (isTurning) {
			toon.direction = [
				(x === 0) ? 0 : x / Math.abs(x),
				(y === 0) ? 0 : y / Math.abs(y),
			];
		} else {
			toon.pos[0] += x;
			toon.pos[1] += y;
		}
		// toon.direction = [
		// 	(x === 0) ? 0 : x / Math.abs(x),
		// 	(y === 0) ? 0 : y / Math.abs(y),
		// ];
		focus[0] = toon.pos[0] + (toon.direction[0] * World.STANDARD_BLOCK_SIZE);
		focus[1] = toon.pos[1] + (toon.direction[1] * World.STANDARD_BLOCK_SIZE);
		this.pickupItems(toon);
	}

	pickupItems(toon) {
		const items = this.world.pickupItems(toon);
		if (!items || items.length <= 0) return;
		const didGive = Toon.giveItems(toon, items);
		const item = items[0]; // TODO: Allow multiple items to be picked up
		if (!didGive) {
			this.world.placeItem(item, toon.pos);
			this.addInfoBalloon(toon, `Inventory full`);
			return;
		}
		this.addInfoBalloon(toon, `+1 ${Toon.getItemKey(item)}`);
	}

	placeItems(toon, item, focus) {
		const placed = this.world.placeItem(item, focus);
		if (placed) {
			Toon.equipByKey(toon, item.key);
			Toon.consumeItem(toon, item.key);
		}
	}

	throwEquipped(toon) {
		const equippedItemKey = Toon.getEquippedItemKey(toon);
		if (!equippedItemKey || equippedItemKey === 'hands') return;
		const item = Thing.get(equippedItemKey);
		this.placeItems(toon, item, this.focus);
		Toon.equipByKey(toon, equippedItemKey);
	}

	toggleMenu(toon, menuName) {
		if (!menuName && toon.menu) { // Switch
			toon.menu = (toon.menu === 'inventory') ? 'crafting' : 'inventory';
			return;
		}
		if (toon.menu === menuName) { // Close
			toon.menu = null;
			return;
		}
		toon.menu = menuName;
	}

	moveMenu(toon, direction) {
		if (!toon.menu) return;
		const arr = (toon.menu === 'inventory') ? toon.inventory : Thing.getRecipeKeys();
		toon.index[toon.menu] = (arr.length + toon.index[toon.menu] + direction) % arr.length;
		console.log('direction', direction, 'length', arr.length, 'New index', toon.index[toon.menu]);
	}

	doAction(toon) {
		const equippedItemKey = Toon.getEquippedItemKey(toon);
		const item = Thing.get(equippedItemKey);
		if (!item) return;
		if (toon.target) return this.doActionOnTarget(toon, item, toon.target);
		return this.doActionOnGround(toon, item, this.focus);
	}

	doActionOnGround(toon, item, focus) {
		if (item.block) {
			this.placeItems(toon, item, focus);
			this.addInfoBalloon(toon, 'Crafty!');
			return;
		}
		this.addInfoBalloon(toon, ' ?');
		console.log('No action');
		// TODO: shoveling, hoeing
	}

	doActionOnTarget(toon, item, target) {
		const action = toon.target?.defaultAction || 'touch';
		const power = (typeof item[action] === 'number') ? item[action] : item.base;
		const { hpLeft, hpMax } = this.world.doActionOnBlock(target, action, power);
		let text = action;
		if (hpLeft > 0) text += ` (${hpLeft}/${hpMax})!`
		else toon.target = null; // Wait for next 'run' to set a new target
		this.addInfoBalloon(toon, text);		
	}

	doMenuAction(toon) {
		if (!toon.menu) return;
		const selection = toon[toon.menu][toon.index[toon.menu]];
		if (toon.menu === 'inventory') {
			const itemName = Toon.getEquippedItemKey(toon);
			this.addInfoBalloon(toon, `Equipped ${itemName}`);
			this.toggleMenu(toon, 'inventory');
			return;
		}
		if (toon.menu === 'crafting') {
			this.craft(toon, selection);
			return;
		}
	}

	craft(toon, itemKey) {
		const { canCraft, needsItem, needsNum } = MinCraftProgram.canCraft(toon, itemKey);
		if (!canCraft) {
			this.addInfoBalloon(toon, `Needs ${needsNum} ${needsItem}`);
			return;
		}
		const recipe = Thing.get(itemKey);
		const item = { name: itemKey, type: itemKey }; // TODO: instantiate an Item?
		Toon.consumeItems(toon, recipe.consume);
		const makes = recipe.makes || 1;
		for(let i = 0; i < makes; i++) {
			Toon.giveItem(toon, item);
		}
		this.addInfoBalloon(toon, `+${makes} ${itemKey}`);
	}

	handleKeyCommand(key, identity) {
		// TODO: find toon based on identity
		const toon = this.toons[0];
		const keyCommandsKey = (toon.menu === 'splash') ? 'splash' : (toon.menu ? 'menu' : 'world');
		const keyCommands = this.keyCommands[keyCommandsKey];
		if (keyCommands[key]) {
			keyCommands[key](toon);
		} else {
			console.log('No key command for', key);
		}
	}

	input(command, data, identity) { // overwrite program method
		if (command === 'key') {
			this.handleKeyCommand(data, identity);
		}
	}

	run() { // overwrite program method
		this.tick += 1;
		const identity = this.getUser(); // TODO: Allow multiple users
		this.setTargets();
		this.moveInfoBalloons();
		const commands = [
			'clear',
			'mode write',
			// `write ${this.tick}`,
			this.getWorldDraw(),
			this.getBlocksDraw(),
			this.getItemsDraw(),
			this.getToonDraw(),
			this.getTargetDraw(),
			// `draw 256 256 skip ${256 + 24} 256 skip ${256 + 48} 256`,
		]
			.concat(this.getMenuCommands())
			.concat(this.getInfoBalloonsCommands())
			.concat(this.getToonCommands())
			.concat(['at 64 0',	'input key']);
		this.output(identity, { commands });
	}

	setTargets() {
		const { block, distance } = this.world.findNearestThing(this.focus, 'block');
		const canTarget = (distance < World.STANDARD_BLOCK_SIZE); // TODO: base on tool?
		this.toons[0].target = (canTarget) ? block : null;
	}

	moveInfoBalloons() {
		const info = this.toons[0].info;
		info.shift();
	}

	addInfoBalloon(toon = this.toons[0], text) {
		const info = toon.info;
		const balloonStartIndex = 12;
		if (info[balloonStartIndex]) info.shift();
		info[balloonStartIndex] = text;
	}

	getInfoBalloonsCommands() {
		const info = this.toons[0].info;
		if (info.length <= 0) return [];
		const cmds = [];
		info.forEach((text, i) => {
			cmds.push(`at ${i + 1} 30`);
			cmds.push(`write ${text}`);
		});
		return cmds;
	}

	getToonCommands(toon = this.toons[0]) {
		if (toon.menu === 'splash') return [];
		return [
			'mode erase',
			'block 64 0 448 16',
			'mode write',
			'at 31 30',
			`write ${Toon.getEquippedItemKey(toon)}`,
		];
	}

	static getInventoryWrite(toon) {
		return toon.inventory
			.map((item, i) => {
				const itemName = Toon.getItemKey(item) || '---';
				const equipNum = (i < 4) ? `[${i + 1}]` : '';
				return (i === toon.index.inventory) ? `> ${equipNum} ${itemName} <` : `  ${equipNum} ${itemName}`;
			})
			.reduce((string, itemName) => string + '\n' + itemName, '');
	}

	static getItemCount(toon, resourceItemKey) {
		return toon.inventory.reduce((sum, item) => {
			const num = (Toon.getItemKey(item) === resourceItemKey) ? 1 : 0;
			return sum + num;
		}, 0);
	}

	static canCraft(toon, itemKey) {
		const item = Thing.get(itemKey);
		let needsItem = null;
		let needsNum = 0;
		const consumeList = item.consume ? Object.keys(item.consume) : [];
		const unmetConsumes = consumeList.reduce((sum, type) => {
			const count = MinCraftProgram.getItemCount(toon, type);
			const n = (item.consume[type] - count);
			if (n > 0) {
				needsItem = type;
				needsNum = n;
			}
			return sum + n;
		}, 0);
		// const unmetRequirements = (item.recipesRequires || []).map((req)  => {
		// 	// TODO
		// });
		console.log({ canCraft: (unmetConsumes <= 0), needsItem, needsNum });
		return { canCraft: (unmetConsumes <= 0), needsItem, needsNum };
	}

	static getRecipeWrite(toon) {
		return Thing.getRecipes()
			.map((item, i) => {
				const recipeName = item.key;
				if (i !== toon.index.crafting) return `  ${recipeName}`;
				const consumes = Object.keys(item.consume).map((type) => {
					const count = MinCraftProgram.getItemCount(toon, type);
					return `${type} ${count}/${item.consume[type]}`;
				});
				const reqStrings = (item.recipesRequires || []).map((req)  => {
					return `Nearby ${req}`;
				});
				const makes = (item.makes) ? [`Makes ${item.makes}`] : [];
				return [`> ${recipeName} <`]
					.concat(consumes)
					.concat(makes)
					// .concat(reqStrings)
					.join('\n    ');
			})
			.reduce((string, itemName) => string + '\n' + itemName, '');
	}

	getSplashCommands() {
		return [
			'mode erase',
			'block 64 64 448 448',
			'mode write',
			// 'draw 64 64 448 64', // skip 64 448 448 448',
			'draw 64 300 448 300 400 448 112 448 64 300',
			'draw 64 300 80 270 432 270 448 300',
			'at 8 20',
			'write M  I  N  -  C  R  A  F  T',
			'at 16 24',
			'write 1975  v0.5 alpha',
			'at 22 22',
			'write Press ENTER to begin',
			'draw 152 134 360 134'
		];
	}

	getMenuCommands() {
		const toon = this.toons[0];
		if (!toon.menu) return [];
		if (toon.menu === 'splash') return this.getSplashCommands();
		const isInv = (toon.menu === 'inventory');
		const method = (isInv) ? 'getInventoryWrite' : 'getRecipeWrite';
		const list = MinCraftProgram[method](toon);
		const title = isInv ? ` ${toon.menu}` : `           ${toon.menu}`;
		const cmds = [
			'mode erase',
			'block 0 480 224 32',
			'at 2 0',
			`write ${title || ''}\n${list}\n\n:`,
			'mode write',
			'draw 0 480 224 480 224 32 0 32 skip 0 450 224 450',
		];
		return cmds;
	}

	getWorldDraw() {
		const drawCoords = MinCraftProgram.getDrawCoords([0, 0], [0, 0], this.focus);
		return `circle ${this.world.size/2} ${drawCoords}`;
	}

	getTargetDraw() {
		const toon = this.toons[0];
		const targetPos = (toon.target) ? World.getPositionFromBlockPosition(toon.target.blockPos) : this.focus;
		return `draw ${MinCraftProgram.getThingDrawCoords(FOCUS_PARTS, targetPos, this.focus)}`;
	}

	getBlocksDraw() {
		const drawCoords = this.world.blocks.map((block) => {
			const pos = World.getPositionFromBlockPosition(block.blockPos);
			const baseParts = block.parts || DEFAULT_PARTS;
			return MinCraftProgram.getThingDrawCoords(baseParts, pos, this.focus);
		});
		return `draw ${drawCoords.join(' skip ')}`;
	}

	getItemsDraw() {
		const drawCoords = this.world.items.map((block) => {
			const pos = World.getPositionFromBlockPosition(block.blockPos);
			const baseParts = block.parts || DEFAULT_PARTS;
			return MinCraftProgram.getThingDrawCoords(baseParts, pos, this.focus);
		});
		return `draw ${drawCoords.join(' skip ')}`;		
	}

	getToonDraw(i = 0) {
		const toon = this.toons[i]; // Only one toon right now, but would like to allow more in the future
		return 'draw ' + MinCraftProgram.getThingDrawCoords(toon.parts, toon.pos, this.focus);
	}

	static getThingDrawCoords(partsCoords, pos, focus) {
		const thingDrawCoords = partsCoords.map((part) => {
			return MinCraftProgram.getPartDrawCoords(part, pos, focus);
		});
		return thingDrawCoords.join(' skip ');
	}

	static getPartDrawCoords(partArr, posArr, focus) {
		const partDrawCoords = partArr.map((xyArr) => {
			return MinCraftProgram.getDrawCoords(xyArr, posArr, focus);
		});
		return partDrawCoords.join(' ');
	}

	static getDrawCoords(xyArr, posArr, focus) {
		let x = xyArr[0] - focus[0] + posArr[0] + SCREEN_CENTER[0];
		let y = xyArr[1] - focus[1] + posArr[1] + SCREEN_CENTER[1];
		return `${x} ${y}`;
	}

	getUser() {
		const userKeys = Object.keys(this.users);
		return this.users[userKeys[0]];
	}
}

window.MinCraftProgram = MinCraftProgram;

export default MinCraftProgram;
