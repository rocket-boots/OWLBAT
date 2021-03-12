// Wire - Web Interface for Rapid Exchange
// formerly HOP "Hyper-Owlbat Protocol"

import OWLACS from "./OWLACS";
import OWLBAT from "./OWLBAT.js";

const WIRE_TIME = 10; // simulates slow communication

// Communications between OWLBAT client and server
class Wire {
	constructor(term, server) {
		this.terminal = this.connectTerminal(term);
		this.server = this.connectServer(server);
	}

	connectTerminal(term) { // mutates term
		if (!term) return null;
		this.terminal = term;
		term.wire = this;
		// const ogOutput = term.output;
		// term.output = async (...args) => {
		// 	console.log('--> Wired output from terminal to server', args);
		// 	const outputReturn = await ogOutput(...args);
		// 	return new Promise((resolve, reject) => {
		// 		window.setTimeout(() => {
		// 			const ret = this.server.input(outputReturn);
		// 			resolve(ret);
		// 		}, 500);
		// 	});
		// };
		return term;
	}

	connectServer(server) { // mutates server
		if (!server) return null;
		this.server = server;
		server.wire = this;
		// TODO: Allow multiple wires?
		// const ogOutput = server.output;
		// server.output = async (...args) => {
		// 	console.log('--> Wired output from server to terminal', args);
		// 	const outputReturn = await ogOutput(...args);
		// 	return new Promise((resolve, reject) => {
		// 		window.setTimeout(() => {
		// 			const ret = this.terminal.input(outputReturn);
		// 			resolve(ret);
		// 		}, 500);
		// 	});
		// };
		return server;
	}

	async send(from, to, data) {
		const destination = (from === this.server) ? this.terminal : this.server;
		const source = (from === this.server || from === this.terminal) ? from : null;
		// console.log('\tWire sending from', from, 'to', destination, '\ndata:', data);
		return new Promise((resolve, reject) => {
			window.setTimeout(async () => {
				await destination.input(source, data);
				resolve(true);
			}, WIRE_TIME);
		});		
	}

	// static async send(programName, what, value, fromBat, server) {
	// 	// console.log('send', what, value, 'from', fromBat, 'to', server, 'program', programName);
	// 	return new Promise((resolve, reject) => {
	// 		window.setTimeout(() => {
	// 			const ret = server.input(programName, what, value, fromBat);
	// 			resolve(ret);
	// 		}, 500);
	// 	});
	// 	/* .then(() => {
	// 		return {
	// 			commands: [
	// 				'clear',
	// 				'write Hello World',
	// 				'poll'
	// 			]
	// 		};
	// 	});
	// 	*/
	// }

	// static async receive(bat, identity, data) {
	// 	OWLBAT.input(bat, data);
	// }
}

export default Wire;
