import Program from '../Program.js';

const EXIT_COMMAND = 'exit';

class Echo extends Program {
	constructor(...args) {
		super(...args);
		this.name = 'echo';
		this.echos = [];
	}

	input(serverCommand, data, identity = {}) {
		console.log('\t\t\tEcho input', serverCommand, data, identity);
		const commands = [
			'write \n\n            ',
			'write \n\n>',
			'input text',
		];
		const isExit = (serverCommand === 'text' && (data?.length === 0 || data === EXIT_COMMAND));
		if (isExit) {
			commands[0] += 'Nothing to echo. Exiting.';
			commands.push('exit');
		} else {
			commands[0] += `Echo: ${data}`;
		}
		this.output(identity, { commands });
	}
}

export default Echo;
