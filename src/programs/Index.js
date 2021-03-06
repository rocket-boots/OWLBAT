import Program from '../Program.js';

class Index extends Program {
	constructor(...args) {
		super(...args);
		this.name = 'index';
		this.aliases = ['?', 'help'];
	}

	input(serverCommand, data, identity) {
		const programNames = this.server.programs.map((program) => {
			const aliases = Program.getAliases(program);
			const programName = (typeof program === 'string') ? program : program?.name;
			const aliasesText = (aliases.length <= 0) ? '' : ` (${aliases.join(', ')})`;
			return programName + aliasesText;
		});
		const programList = '\n * ' + programNames.join('\n * ');
		const outputObj = {
			commands: [
				'clear',
				`write \n\nList of programs:${programList}`,
				'write \n\nType program name to run.',
				'exit'
			]
		};
		this.output(identity, outputObj);
	}

	output(identity, outputObj) {
		return outputObj;
	}
}

export default Index;
