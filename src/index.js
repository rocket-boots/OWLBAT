import OWLACS from './OWLACS.js';
import OWLBAT from './OWLBAT.js';
import Program from './Program.js';
import Index from './programs/Index.js';
import Echo from './programs/Echo.js';
import Who from './programs/Who.js';
import Wire from './Wire.js';
import MinCraftProgram from './programs/min-craft/MinCraftProgram.js';

// Setup and start server w/ programs

const hello = new Program({ // A minimal example of a program
	name: 'hello', // necessary
	aliases: ['hi'], // optional
	input(cmd, data, identity) { // necessary
		this.output(identity, { commands: ['write \nHello world!\n', 'exit'] });
	},
});

const programs = [
	hello,
	new Index(),
	new Echo(),
	new Who(),
	new MinCraftProgram(),
];

const server = new OWLACS({ programs });
server.start();

// Setup and start terminal

const owlbat = new OWLBAT();
owlbat.setup({ start: 'hello' });

// Connect the two...
const wire = new Wire(owlbat, server); // mutates terminal and server

// Expose
window.wire = wire;
window.bat = owlbat;
window.server = server;

export default { OWLBAT, owlbat };
