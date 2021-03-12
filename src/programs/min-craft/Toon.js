const TOON_PARTS = [
	// [[-12, 12], [12, 12], [12, -12], [-12, -12], [-12, 12]], // border
	[[-4, 12], [4, 12], [4, 5], [-4, 5], [-4, 12]], // head
	[[-2, 8], [-2, 10]], // eye
	[[2, 8], [2, 10]], // eye
	[[-4, 5], [4, 5], [4, -5], [-4, -5], [-4, 5]], // body
	[[-4, 5], [-4, 2], [-10, 0], [-12, 1], [-4, 5]], // arm
	[[4, 5], [4, 2], [10, 0], [12, 1], [4, 5]], // arm
	[[-4, -5], [0, -5], [-1, -12], [-5, -12], [-4, 5]], // leg
	[[4, -5], [0, -5], [1, -12], [5, -12], [4, 5]], // leg
];

class Toon {
	constructor() {

	}

	static TOON_PARTS = TOON_PARTS;

	static equipFix(toon) {
		const i = toon.index.inventory;
		if (i < 0) toon.index.inventory = 0;
		else if (i >= toon.inventory.length) toon.index.inventory = toon.inventory.length - 1;
	}

	static equipSwap(toon, i) {
		if (toon.menu !== 'inventory') return;
		const equippingItem = toon.inventory[toon.index.inventory];
		toon.inventory[toon.index.inventory] = toon.inventory[i];
		toon.inventory[i] = equippingItem;
		Toon.equipFix(toon);
	}

	static equipByKey(toon, itemKey) {
		const equippedItemKey = Toon.getEquippedItemKey(toon);
		if (equippedItemKey === itemKey) return;
		const i = toon.inventory.findIndex((item) => (Toon.getItemKey(item) === itemKey));
		Toon.equipByIndex(toon, i);
	}

	static equipByIndex(toon, i) {
		if (i >= 0 && i < toon.inventory.length) {
			toon.index.inventory = i;
		}
		Toon.equipFix(toon);
	}

	static giveItem(toon, item) {
		if (toon.inventory.length + 1 > toon.maxInventory) return false;
		toon.inventory.push(item);
		return true;
	}

	static giveItems(toon, items = []) {
		if (toon.inventory.length + items.length > toon.maxInventory) return false;
		items.forEach((item) => Toon.giveItem(toon, item));
		return true;
	}

	static consumeItems(toon, consume = {}) {
		let expected = 0;
		let consumedCount = 0;
		Object.keys(consume).forEach((itemKey) => {
			const amount = consume[itemKey];
			expected += amount;
			for(let i = 0; i < amount; i++) {
				consumedCount += Toon.consumeItem(toon, itemKey);
			}
		});
		console.log('expected to consume', expected, '... consumed', consumedCount);
	}

	static consumeItem(toon, itemKey) {
		const i = toon.inventory.findIndex((item) => Toon.getItemKey(item) === itemKey);
		const consumed = toon.inventory.splice(i, 1);
		Toon.equipFix(toon);
		return consumed.length;
	}

	static getEquippedItemKey(toon) {
		return Toon.getItemKey(toon.inventory[toon.index.inventory]);
	}

	static getItemKey(item) {
		if (!item) return null;
		return (typeof item === 'string') ? item : (item.key || item.type || item.name || 'Unknown');
	}
}

export default Toon;
