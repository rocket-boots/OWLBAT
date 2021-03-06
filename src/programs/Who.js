import Program from '../Program.js';

class Who extends Program {
	constructor(...args) {
		super(...args);
		this.name = 'who';
		this.alias = 'users';
	}

	input(serverCommand, data, identity) {
		const you = identity.userName;
		const userNames = Object.entries(this.server.users)
			.map(([userKey, identity]) => {
				return identity.userName + ((you === identity.userName) ? ' (you)' : '');
			});
		const userList = '\n * ' + userNames.join('\n * ');
		const outputObj = {
			commands: [
				'clear',
				`write \nWho is online?\n\nList of users:${userList}\n`,
				'exit'
			]
		};
		this.output(identity, outputObj);
	}
}

export default Who;