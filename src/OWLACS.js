// Open Web Link Anachronistic/Automatic Computer Server
import Program from './Program.js';

const SERVER_PROMPT = '\nOWLBAT> ';
const LOGIN_RETURN_COMMANDS = [
	'program server',
	'clear',
	`write Connected to browser's internal server`,
	'write \n\nType program name to run and hit Enter.',
	`write ${SERVER_PROMPT}`,
];
const EXIT_COMMAND = 'exit';
const RUN_TIME = 600;
const g = window; // Global

class OWLACS {
	constructor(options = {}) {
		this.programs = ['server'];
		if (options.programs instanceof Array) {
			OWLACS.installPrograms(this, options.programs);
		}
		this.users = {};
		this.timeoutId = null;
		this.wires = [];
		if (options.start) this.start();
	}

	static installProgram(server, program) {
		server.programs.push(program);
		program.server = server; // TODO: pass some subset of server?
		const originalOutput = program.output;
		program.output = (identity, outputObj) => {
			// console.log('\t\t\tProgram output triggered', identity, outputObj);
			OWLACS.output(server, originalOutput(identity, outputObj), identity, program);
		};
	}

	static installPrograms(server, programs) {
		programs.forEach((program) => OWLACS.installProgram(server, program));
	}

	static findProgram(server, name) {
		const lowerName = name.toLowerCase();
		const program = server.programs.find((program) => {
			const programName = ((program?.name) ? program.name : String(program)).toLowerCase();
			return (programName === lowerName);
		});
		if (program) return program;
		return OWLACS.findProgramByAlias(server, name);
	}

	static findProgramByAlias(server, name) {
		const lowerName = name.toLowerCase();
		return server.programs.find((program) => {
			const aliases = Program.getAliases(program);
			const foundAlias = aliases.find((alias) => {
				return lowerName === String(alias).toLowerCase();
			});
			return Boolean(foundAlias);
		});
	}

	static hasExit(obj = {}) {
		if (!obj || !obj.commands) return false;
		const found = obj.commands.find((commandLine) => {
			return String(commandLine).substring(0,4).toLowerCase() === EXIT_COMMAND;
		});
		return Boolean(found);
	}

	static async output(server, sendObj, identity, program) {
		if (!sendObj.commands) outputObj.commands = [];
		const programName = program.name || program;
		if (typeof programName === 'string') {
			sendObj.commands.unshift(`program ${programName}`);
		}
		// console.log('\t\tServer outputting', sendObj);
		if (OWLACS.hasExit(sendObj)) {
			console.log('\t\tEXITING', program.name);
			if (typeof program === 'object') {
				program.removeUser(identity.userKey);
			}
			sendObj.commands.push(`write ${SERVER_PROMPT}`);
		}
		// TODO: Send to all / only the users or wires connected to terminals
		const response = await server.wire.send(server, null, sendObj);
		// console.log('\t\tServer received output response', response);
	}

	static async input(server, from, obj) {
		const { programName, identity, serverCommand, data } = obj;
		console.log('\t\tServer input (program/cmd/data): ', programName, '/', serverCommand, '/', data);
		const program = OWLACS.findProgram(server, programName);
		if (!program) {
			const response = { commands: [`write \nProgram ${programName} not found${SERVER_PROMPT}`] };
			await OWLACS.output(server, response, identity, 'server');
			return;
		}
		if (program === 'server') { // Server is a special string program
			return await OWLACS.handleServerInput(server, serverCommand, data, identity);
		}
		// console.log('\t\tSending input to program', program.name);
		const added = program.addUser(identity);
		if (!added) console.warn('Issue adding user to program', identity);
		program.input(serverCommand, data, identity);
	}

	static async handleServerInput(server, serverCommand, data, identity) {
		// The "server" program can only run programs
		if (serverCommand === 'login') {
			return OWLACS.loginUser(server, identity);
		}
		// If there's data, then assume it's a program name; ignore the command
		if (typeof data === 'string') {
			const newObj = {
				identity,
				programName: data,
				data: null,
				serverCommand: null,
			};
			return await OWLACS.input(server, null, newObj);
		}
		// If there's no program name, do nothing
		const sendObj = { commands: ['write \nServer is already running.', 'exit'] };
		OWLACS.output(server, sendObj, identity, 'server');
		return;
	}

	static addUser(server, userKey, identity) {
		// TODO: Check for userKey or userName existing already, etc.
		server.users[userKey] = { ...identity };
	}

	static loginUser(server, identity) {
		const userKey = identity.terminalId + '_' + Number(new Date()) + '-' + Math.round(Math.random() * 999999999);
		OWLACS.addUser(server, userKey, identity);
		const response = { userKey, commands: LOGIN_RETURN_COMMANDS };
		OWLACS.output(server, response, identity, 'server');
		return true;
	}

	async input(from, obj) {
		console.log('\t\tServer received from wire', obj);
		return await OWLACS.input(this, from, obj);
	}

	run() {
		// Run only programs with users connected
		// (May want to make this more flexible in the future)
		this.programs.forEach((program) => {
			// console.log(program.name, Program.getUsersCount(program));
			if (Program.getUsersCount(program) <= 0) return;
			Program.run(program);
		});
		this.runAgain();
	}

	runAgain() {
		this.timeoutId = g.setTimeout(() => this.run(), RUN_TIME);
	}

	start() {
		this.stop();
		this.runAgain();
	}

	stop() {
		g.clearTimeout(this.timeoutId);
		this.timeoutId = null;
	}
}

export default OWLACS;
