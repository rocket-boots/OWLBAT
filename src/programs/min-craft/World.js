import Thing from './Thing.js';

const STANDARD_BLOCK_SIZE = 24; // pixels in a block
const WORLD_BLOCK_SIZE = 64; // blocks in a world
const WORLD_SIZE = WORLD_BLOCK_SIZE * STANDARD_BLOCK_SIZE;

class World {
	constructor() {
		this.blocks = [];
		this.items = [];
		this.blockLookup = {};
		this.generate();
		this.size = WORLD_SIZE;
	}

	static STANDARD_BLOCK_SIZE = STANDARD_BLOCK_SIZE;
	static WORLD_SIZE = WORLD_SIZE;

	static getDistance(xyArr1, xyArr2) {
		return Math.sqrt(
			Math.pow((xyArr1[0] - xyArr2[0]), 2) + Math.pow((xyArr1[1] - xyArr2[1]), 2)
		);
	}

	static getRandomBlockPosition() {
		const randNum = () => Math.round((Math.random() * WORLD_BLOCK_SIZE)) - (WORLD_BLOCK_SIZE/2);
		return [randNum(), randNum()];
	}

	static getPositionFromBlockPosition(blockPos = []) {
		return [blockPos[0] * STANDARD_BLOCK_SIZE, blockPos[1] * STANDARD_BLOCK_SIZE];
	}

	static getBlockPositionFromPosition(pos = []) {
		return pos.map((x) => x / STANDARD_BLOCK_SIZE);
	}

	static getRandomRockParts() {
		const wiggle = () => Math.floor(Math.random() * 5) - 2;
		// const 
		// [[-5, -12], [-11, -4], [0, 6], [11, -4], [5, -12], [-5, -12]]
		const rock = [[]];
		const endIndex = 5;
		const rockParts = Thing.get('rock').parts;
		rockParts[0].forEach((point, i) => {
			if (i === endIndex) {
				rock[0].push(rock[0][0]);
				return;
			}
			rock[0].push([point[0] + wiggle(), point[1] + wiggle()]);
		});
		return rock;
	}

	addBlock(block, attempt = 0) {
		const [x, y] = block.blockPos;
		if (this.blockLookup[`${x},${y}`] && attempt < 100) {
			block.blockPos[0] += 1; // move to the right
			this.addBlock(block, attempt + 1);
			return;
		}
		this.blocks.push(block);
		this.blockLookup[`${x},${y}`] = block;
	}

	addBlocks(blocks) {
		blocks.forEach((block) => this.addBlock(block));
	}

	generate() {
		const getRandomOffset = () => Math.random() > 0.5 ? -1 : 1;
		for(let i = 0; i <= 200; i++) {
			const tree = {
				...Thing.getClone('tree'),
				blockPos: World.getRandomBlockPosition(),
			};
			const tree2 = {
				...tree,
				blockPos: [tree.blockPos[0] + getRandomOffset(), tree.blockPos[1] + getRandomOffset()],
			};
			const tree3 = {
				...tree,
				blockPos: [tree.blockPos[0] + getRandomOffset(), tree.blockPos[1] + getRandomOffset()],
			};

			const rock = Thing.getClone('rock');
			rock.blockPos = World.getRandomBlockPosition();
			this.blocks.push(rock);

			this.addBlocks([tree, tree2, tree3, rock]);
		}
	}

	findNearestThing(position, what = 'block') { // TODO: Allow a threshold?
		const collection = (what === 'block') ? this.blocks : this.items;
		let nearestThing = null;
		let nearestDistance = Infinity;
		collection.forEach((thing) => {
			const blockPos = World.getPositionFromBlockPosition(thing.blockPos);
			const distance = World.getDistance(blockPos, position);
			if (distance < nearestDistance) {
				nearestThing = thing;
				nearestDistance = distance;
			}
		});
		const ret = { distance: nearestDistance };
		ret[what] = nearestThing;
		return ret;
	}

	removeThing(thing, what = 'block') {
		const collection = (what === 'block') ? this.blocks : this.items;
		const i = collection.findIndex((b) => b === thing);
		if (i <= -1) {
			console.warn('Unknown thing', thing, what);
			return;
		}
		return collection.splice(i, 1);
	}

	doActionOnBlock(block, action, power) {
		block.hp -= power;
		if (block.hp <= 0) this.harvest(block);
		return { hpLeft: block.hp, hpMax: block.hpMax };
	}

	static getRandomDropArray(dropObj = {}) {
		const arr = [];
		Object.keys(dropObj).forEach((itemKey) => {
			let chance = dropObj[itemKey];
			if (chance >= 100) { // always get one
				arr.push(itemKey);
				chance -= 100;
			}
			while(chance > 0) { // consider anything over 100 in increments up to 60%
				const singleChance = Math.min(60, chance);
				if (Math.random() < (singleChance/100)) {
					arr.push(itemKey);
				}
				chance -= singleChance;
			}
		});
		console.log('drop', arr);
		return arr;
	}

	harvest(block) {
		// const i = this.blocks.findIndex((b) => b === block);
		// if (i <= -1) {
		// 	console.warn('Unknown block');
		// 	return;
		// }
		// this.blocks.splice(i, 1);
		this.removeThing(block, 'block');
		if (block.drop) {
			this.drop(World.getRandomDropArray(block.drop), block.blockPos, 'items', true);
		}
	}

	drop(items = [], blockPos = [], collectionName = 'items', random = true) {
		const getRandomOffset = (random) ? () => Math.floor(Math.random() * 3) - 1 : () => 0;
		items.forEach((item) => {
			const key = Thing.getKey(item);
			const newPos = [blockPos[0] + getRandomOffset(), blockPos[1] + getRandomOffset()];
			const itemObj = Thing.getClone(key);
			itemObj.blockPos = newPos;
			// console.log('making item', itemObj, blockPos, newPos);
			this[collectionName].push(itemObj);
		});
	}

	pickupItems(toon) {
		// TODO: pick up multiple items at once
		const { item, distance } = this.findNearestThing(toon.pos, 'item');
		if (item && distance < STANDARD_BLOCK_SIZE) {
			this.removeThing(item, 'item');
			return [item];
		}
		return [];
	}

	placeItem(item, position) {
		const collectionName = (item.block) ? 'blocks' : 'items';
		this.drop([item], World.getBlockPositionFromPosition(position), collectionName, false);
		return true;
	}
}

window.World = World;

export default World;
