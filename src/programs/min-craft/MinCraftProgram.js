import Program from '../../Program.js';

class MinCraftProgram extends Program {
	constructor(...args) {
		super(...args);
		this.name = 'Min-Craft';
		this.aliases = ['mc', 'mincraft', 'mc1975'];
		this.toons = [];
		this.tick = 0;
	}

	connected(userKey) { // overwrite program method
		// TODO: Handle connecting to an existing player
		const newToon = {};
		this.toons.push(newToon);
	}

	input(command, data, identity) { // overwrite program method
		if (command === 'key') {
			console.log(data);
		}
	}

	run() { // overwrite program method
		this.tick += 1;
		const identity = this.getUser(); // TODO: Allow multiple users
		const commands = [
			'clear',
			`write ${this.tick}`,
			'at 20',
			'write >',
			'input key',
		];
		this.output(identity, { commands });
	}

	getUser() {
		const userKeys = Object.keys(this.users);
		return this.users[userKeys[0]];
	}
}

export default MinCraftProgram;
