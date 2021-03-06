class Program {
	constructor(options = {}) {
		this.name = options.name || 'undefined program';
		this.server = null;
		this.users = {};
		if (typeof options.input === 'function') this.input = options.input;
		if (typeof options.output === 'function') this.output = options.output;
		if (options.aliases) this.aliases = options.aliases;
		if (options.alias) this.alias = options.alias;
	}

	static addUser(program, identity) {
		if (!identity || !identity.userKey) return false;
		if (!program.users) program.users = {};
		program.users[identity.userKey] = identity;
		return true;
	}

	static getAliases(program) {
		if (typeof program !== 'object') return [];
		let aliases = [];
		if (program.alias) {
			aliases.push(program.alias);
		}
		if (program.aliases) {
			aliases = aliases.concat(program.aliases);
		}
		return aliases;
	}

	static getUsersCount(program) {
		if (!program.users) return 0;
		return Object.keys(program.users).length;
	}

	static run(program, ...args) {
		if (typeof program.run !== 'function') return null;
		return program.run(...args);
	}

	addUser(identity) {
		const added = Program.addUser(this, identity);
		if (!added) return false;
		this.connected(identity.userKey, identity);
		return added;
	}

	removeUser(userKey) {
		const identity = this.users[userKey];
		delete this.users[userKey];
		this.disconnected(userKey, identity);
	}

	connected(userKey, identity) {
		// Do nothing by default but can act as a hook for programs
	}

	disconnected(userKey, identity) {
		// Do nothing by default but can act as a hook for programs
	}

	run() {
		// Do nothing by default
	}

	input(serverCommand, data, identity) {
		this.output(identity, {
			commands: [
				'write \nUnconfigured program\n',
				'exit',
			],
		});
	}

	output(identity, outputObjectParam) {
		// This will be overwritten on the object when installed to the server
		// Don't customize this now; this functionality could change
		return { ...outputObjectParam, identity };
	}
}

export default Program;
