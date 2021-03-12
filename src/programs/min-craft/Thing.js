const PINE_TREE_PARTS = [
	[
		[0, 12], [8, 2], [4, 0], [10, -6],
		[-10, -6], [-4, 0], [-8, 2], [0, 12]
	],
	[[-3, -6], [-5, -12], [5, -12], [3, -6]], // trunk
];
const ROCK_PARTS = [
	[[-5, -12], [-11, -4], [0, 6], [11, -4], [5, -12], [-5, -12]]
];
const LOG_PARTS = [
	[[-6, -10], [6, -10], [6, -5], [-6, -5], [-6, -10]],
];
const STONE_PARTS = [
	[[-2, -8], [-4, -4], [0, 0], [4, -4], [2, -8], [-2, -8]]
];
const ACORN_PARTS = [
	[[1,1], [1,3], [3,5], [5,3], [5,1], [3, -1], [1,1]],
	[[1,3], [5,3]],
];
const BLOCK_PARTS = [
	[[-12, 8], [8, 8], [8, -12], [-12, -12], [-12, 8]],
	[[-12, 8], [-8, 12], [12, 12], [8, 8]],
	[[12, 12], [12, -8], [8, -12]],
];
const COBBLESTONE_WALL_PARTS = [
	[[-12, 12], [12, 12], [12, -12], [-12, -12], [-12, 12]]
];

const ALL_ARRAY = [
	{
		key: 'hands',
		base: 1,
	}, {
		key: 'workbench',
		block: true,
		// consume: { 'wood': 5 },
	}, {
		key: 'wood shovel',
		consume: { 'wood': 1 },
		base: 1,
		dig: 2,
	}, {
		key: 'wood hoe',
		consume: { 'wood': 5 },
		base: 1,
		plow: 2,
	}, {
		key: 'wood spear',
		consume: { 'wood': 5 },
		base: 1,
		stab: 4,
	},
	{
		key: 'wood',
		type: 'wood',
		consume: { 'wood bundle': 1 },
		makes: 10,
		resource: true,
		parts: LOG_PARTS,
	},
	{
		key: 'wood bundle',
		consume: { 'wood': 10 },
		base: 0,
		parts: LOG_PARTS,
	},
	{
		key: 'wood wall',
		block: true,
		consume: { 'wood': 4 },
		drop: { 'wood': 300 },
		parts: BLOCK_PARTS,
		defaultAction: 'chop',
		hp: 20,
		hpMax: 20,
	},
	{
		key: 'stone tool',
		recipesRequires: ['workbench'],
		consume: { 'stone': 2 },
		base: 2,
	}, {
		key: 'stone axe',
		recipesRequires: ['workbench'],
		consume: { 'wood': 5, 'stone': 5 },
		base: 2,
		chop: 4,
	}, {
		key: 'stone pickaxe',
		recipesRequires: ['workbench'],
		consume: { 'wood': 5, 'stone': 5 },
		base: 2,
		mine: 4,
	}, {
		key: 'stone shovel',
		recipesRequires: ['workbench'],
		consume: { 'wood': 5, 'stone': 5 },
		base: 2,
		dig: 4,
	}, {
		key: 'stone hoe',
		recipesRequires: ['workbench'],
		consume: { 'wood': 5, 'stone': 5 },
		base: 2,
		plow: 4,
	}, {
		key: 'stone spear',
		recipesRequires: ['workbench'],
		consume: { 'wood': 5, 'stone': 5 },
		base: 2,
		stab: 4,
	},
	{
		key: 'cobblestone wall',
		block: true,
		consume: { 'stone': 6 },
		drop: { 'stone': 400 },
		parts: BLOCK_PARTS,
		defaultAction: 'mine',
		hp: 30,
		hpMax: 30,
	},
	{
		key: 'furnance',
		block: true,
		consume: { 'stone': 8 },
	},
	{
		key: 'stone',
		type: 'stone',
		resource: true,
		parts: STONE_PARTS,
	}, {
		key: 'acorn',
		resource: true,
		consume: { 'acorn bundle': 1 },
		parts: ACORN_PARTS,
		base: 0,
	},
	{
		key: 'acorn bundle',
		consume: { 'acorn': 10 },
		base: 0,
	},
	{
		key: 'tree',
		type: 'tree',
		block: true,
		consume: { 'acorn': 1 },
		drop: { 'wood': 200, 'acorn': 130 },
		parts: PINE_TREE_PARTS,
		defaultAction: 'chop',
		hp: 10,
		hpMax: 10,
	}, {
		key: 'rock',
		type: 'rock',
		block: true,
		drop: { 'stone': 200, 'iron ore': 50 },
		parts: ROCK_PARTS,
		defaultAction: 'mine',
		hp: 50,
		hpMax: 50,
	},
	{
		key: 'iron ore',
		resource: true,
		parts: STONE_PARTS,
	},
	{
		key: 'iron bar',
		// TODO: Use furnace smelter
		consume: { 'iron ore': 10, 'furnace': 1, 'wood': 2 },
		makes: 6,
	},
	{
		key: 'iron axe',
		recipesRequires: ['workbench'],
		consume: { 'wood': 5, 'iron bar': 5 },
		base: 3,
		chop: 6,
	}, {
		key: 'iron pickaxe',
		recipesRequires: ['workbench'],
		consume: { 'wood': 5, 'iron bar': 5 },
		base: 3,
		mine: 6,
	}, {
		key: 'iron shovel',
		recipesRequires: ['workbench'],
		consume: { 'wood': 5, 'iron bar': 5 },
		base: 3,
		dig: 6,
	}, {
		key: 'iron hoe',
		recipesRequires: ['workbench'],
		consume: { 'wood': 5, 'iron bar': 5 },
		base: 3,
		plow: 6,
	}, {
		key: 'iron spear',
		recipesRequires: ['workbench'],
		consume: { 'wood': 5, 'iron bar': 5 },
		base: 3,
		stab: 6,
	},
];

// Minecraft:
// 1 log --> 4 wood planks
// 2 wood planks --> 4 sticks
// 3 wood --> 1 crafting table
// 2 wood + 2 sticks --> hoe
// 3 wood + 2 sticks --> pick, axe
// 2 wood + 1 stick --> sword

// Mini-craft:
// 10 wood --> workbench
// 20 stone --> furnace
// 15 stone --> oven
// 5 iron --> anvil
// Loom
// Enchanter
// Tools:
// 5 wood --> wood axe
// 5 wood + 5 stone --> stone axe
// 5 wood + 5 iron bars --> iron axe

const ALL_OBJ = ALL_ARRAY
	.filter((thing) => thing.key)
	.reduce((obj, thing) => {
		obj[thing.key] = thing;
		return obj;
	}, {});

console.log(ALL_ARRAY, ALL_OBJ);

class Thing {
	constructor() {

	}

	static get(key) {
		return ALL_OBJ[key];
	}

	static getClone(key) {
		return JSON.parse(JSON.stringify(Thing.get(key)));
	}

	static getRecipes() {
		return ALL_ARRAY.filter((thing) => thing.consume || thing.recipesRequires);
	}

	static getRecipeKeys() {
		return Thing.getRecipes().map((thing) => thing.key);
	}

	static getKey(thing) {
		if (!thing) return null;
		if (typeof thing === 'string') return thing;
		return (thing.key || thing.type || thing.name || null);
	}

	static getName(thing) {
		if (!thing) return '---';
		if (typeof thing === 'string') return thing;
		return (thing.name || thing.key || thing.type || 'Unknown');
	}

}

export default Thing;
