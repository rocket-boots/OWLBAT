const ORANGE = 'rgb(255,144,0)';
// 'rgb(255,144,0)' -- from Cyber1.org's pterm
// '#FE9300' -- from https://cdn.escapistmagazine.com/media/global/images/library/deriv/801/801121.png
// '#FE864D' -- from http://www.platohistory.org/blog/2010/04/the-terminals-are-coming.html
const FONT_FACE = 'IBMDOS';

// Modes
const TTY_MODE = 'TTY';
const OWLBAT_MODE = 'OWLBAT';
const OFFLINE_MODE = 'OFFLINE';
const INPUT_KEYPRESS = 'key';
const INPUT_TEXT = 'text';
const SCREEN_X = 512;
const SCREEN_Y = 512;
const CHAR_X = 8;
const CHAR_Y = 16;
// Should fit 64 characters (8px wide) across a row, and 32 rows of characters
const CHAR_COL_MAX = SCREEN_X / CHAR_X;
const CHAR_ROW_MAX = SCREEN_Y / CHAR_Y;
const SERVER_PROGRAM = 'server';
const LOGIN_SERVER_COMMAND = 'login'; // TODO: move to Wire?

class OWLBAT {
	constructor(options = {}) {
		this.canvas = null;
		this.ctx = null;
		this.wire = null; // Connection to server
		this.mode = TTY_MODE; // TODO
		this.inputMode = INPUT_TEXT;
		this.identity = {
			userName: 'tron',
			terminalId: Number(new Date()) + '-' + Math.round(Math.random() * 999999999),
			userKey: null,
		};
		this.programName = SERVER_PROGRAM;
		// Text position ("coarse coordinates")
		this.row = 0;
		this.col = 0;
		// TODO: Allow toggle between single-character input and string input (submit with enter)

		this.keyPressListener = (e) => {
			console.log(this.inputMode, e.key, e.keyCode);
			if (this.inputMode === INPUT_KEYPRESS) {
				OWLBAT.write(this, e.key);
				this.output('key', e.key);
				OWLBAT.clearKeyboardInputElementValue();
			} else if (this.inputMode === INPUT_TEXT) {
				if (e.key.toUpperCase() === 'ENTER') {
					OWLBAT.write(this, '→');
					this.output('text', OWLBAT.getKeyboardInputElement().value);
					OWLBAT.clearKeyboardInputElementValue();
				} else {
					OWLBAT.write(this, e.key);
				}
			}
		};
	}

	static run(bat, commands = []) {
		commands.forEach((fullCommand) => {
			const commandArr = fullCommand.split(' ');
			const command = commandArr.shift();
			const commandRemainder = commandArr.join(' ');
			// console.log('Running command', command);
			switch(command) {
				case 'program': {
					bat.setProgramName(commandArr.shift());
					break;
				}
				case 'clear': {
					OWLBAT.clear(bat);
					break;
				}
				case 'write': {
					OWLBAT.write(bat, commandRemainder);
					break;
				}
				case 'exit': {
					bat.setProgramName(SERVER_PROGRAM);
					break;
				}
				case 'input': { // Change from input mode to single-character/keypress mode
					bat.setInputMode(commandArr.shift());
					break;
				}
				case 'draw': {
					// TODO: Allow PLATO-style course semi-colon-separated coordinates
					bat.draw(commandArr);
					break;
				}
				case 'circle': {
					bat.circle(commandArr);
					break;
				}
				case 'at': {
					// TODO: Allow PLATO-style single-digit coordinates
					const { x, y } = OWLBAT.getCoordinatesFromArray(commandArr);
					OWLBAT.resetText(bat, x, y);
				}
			}
			// TODO: Commands like...
			// Mode: write or erase (pixel on/off -- erase mode: write into dark color and let screen corrector remove the pixels)
			// Display text
			// Display lines
			// Display points
			// Display blocks
			// Display character sets
			// Display raw data (pixels?)
		});
	}

	setProgramName(name) {
		if (!name || typeof name !== 'string') return false;
		this.programName = name;
		return true;
	}

	setInputMode(mode) {
		if (!mode || typeof mode !== 'string') return false;
		const lowerMode = mode.toLowerCase();
		if (mode !== INPUT_KEYPRESS && mode !== INPUT_TEXT) return false;
		this.inputMode = mode;
		return true;
	}

	static clear(bat) {
		const { ctx, canvas } = bat;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		OWLBAT.resetText(bat);
	}

	static write(bat, text, forceCarriageReturn = false) { // mutates bat
		// FUTURE: Allow \t for tabbing
		const lines = text.split('\n');
		if (lines.length > 1) {
			lines.forEach((text, i) => {
				const cr = (i < lines.length - 1);
				OWLBAT.write(bat, text, cr);
			});
			return;
		}
		const { ctx, col, row } = bat;
		ctx.font = `${CHAR_Y}px ${FONT_FACE}`;
		const x = col * CHAR_X;
		const y = (row + 1) * CHAR_Y;
		ctx.fillText(text, x, y);
		// console.log('\tfill text', text, x, y);
		if (forceCarriageReturn) {
			OWLBAT.carriageReturn(bat);
		} else {
			OWLBAT.advanceText(bat, text.length);
		}
	}

	static resetText(bat, row = 0, col = 0) { // mutates bat
		bat.row = row;
		bat.col = col;
	}

	static advanceText(bat, amount) { // mutates bat
		bat.col += amount;
		if (bat.col >= CHAR_COL_MAX) {
			OWLBAT.carriageReturn(bat);
		}
	}

	static carriageReturn(bat) { // mutates bat
		bat.row += 1;
		bat.col = 0;
	}

	write(text, forceCarriageReturn) {
		OWLBAT.write(this, text, forceCarriageReturn);
	}

	writeAt(text, row, col) {
		OWLBAT.resetText(this, row, col);
		OWLBAT.write(this, text);
	}

	splash() {
		const { ctx } = this;
		this.draw([
			// 0, 0,
			// 0, 512,
			// 512, 512,
			// 512, 0,
			// 0, 0,
			// 'skip',
			// 12, 12,
			// 12, 500,
			// 500, 500,
			// 500, 12,
			// 12, 12,
		]);
		// this.circle([300, 256, 256]);
		// this.circle([200, 256, 256]);
		// this.circle([100, 256, 256]);
		const corner = 100;
		const size = 512 - (corner * 2);
		this.drawRectangle(corner, corner, size, size);

		ctx.font = `40px ${FONT_FACE}`;
		ctx.fillText('OWLBAT', 195, 265);
		ctx.font = `20px ${FONT_FACE}`;
		this.writeAt('Booting...', 24, 27);
	}

	static getCoordinatesFromArray(arr = [], i = 0) {
		return { x: Number(arr[i]), y: Number(arr[i + 1]) };
	}

	contextBeginPath() {
		const { ctx } = this;
		ctx.beginPath();
		ctx.strokeStyle = ORANGE;
		ctx.lineWidth = 1;
		return ctx;
	}

	draw(arr = []) { // lines
		if (arr.length <= 2) {
			this.drawPixel(arr);
			return;
		};
		const ctx = this.contextBeginPath();
		let moveNext = true;
		for(let i = 0; i < arr.length; i++) {
			if (arr[i] === 'skip') {
				moveNext = true;
				i++;
			}
			const { x, y } = OWLBAT.getCoordinatesFromArray(arr, i);
			if (isNaN(x) || isNaN(y)) {
				console.warn('x or y not a number', i, arr[i], arr[i + 1]);
			} else {
				if (moveNext) {
					ctx.moveTo(x, y);
					moveNext = false;
				} else {
					ctx.lineTo(x, y);
				}
			}
			i++;
		}
		ctx.stroke();
	}

	drawRectangle(x, y, sizeX, sizeY, fill = false) {
		const ctx = this.contextBeginPath();
		const method = (fill) ? 'fillRect' : 'strokeRect';
		ctx[method](x, y, sizeX, sizeY);
	}

	drawPixel(arr = []) {
		if (arr.length < 2) return;
		const { x, y } = OWLBAT.getCoordinatesFromArray(arr);
		if (isNaN(x) || isNaN(y)) {
			console.warn('x or y not a number', arr);
			return;
		}
		const { ctx } = this;
		ctx.fillRect(x, y, 1, 1);
	}

	circle(arr = []) {
		if (arr.length < 3) return;
		const r = arr[0];
		const { x, y } = OWLBAT.getCoordinatesFromArray(arr.slice(1));
		if (isNaN(r) || isNaN(x) || isNaN(y)) {
			console.warn('x or y or r is not a number', arr, x, y, r);
			return;
		}
		const ctx = this.contextBeginPath();
		ctx.arc(x, y, r, 0, 2 * Math.PI, false);
		ctx.stroke();
	}

	switchMode(newMode) {
		this.mode = newMode;
		// TODO: Kill any sends in flight
		// TODO: Do something in offline mode
	}

	static async start(bat, startProgramName) {
		console.log('start');
		// TODO: Do splash screen or whatever animations
		// try {
			await bat.output(LOGIN_SERVER_COMMAND, null);
		// } catch(err) {
		// 	console.warn('Output failed', err);
		// 	bat.switchMode(bat, OFFLINE_MODE);
		// 	return;
		// }
		if (typeof startProgramName === 'string') {
			window.setTimeout(() => {
				bat.write(startProgramName);
				OWLBAT.startProgram(bat, startProgramName);
			}, 1000);
		}
	}

	static startProgram(bat, programName) {
		if (!programName || programName.length <= 0) {
			console.warn('Cannot start program without a name');
			return;
		}
		bat.output('run', programName);
	}

	async input(from, response) {
		// console.log('Terminal received input', response);
		if (
			response.userKey
			// TODO: Make it so only the server can provide the userKey
			// && this.programName === 'server' && what === LOGIN_SERVER_COMMAND
		) {
			this.identity.userKey = response.userKey;
		}
		if (response && response.commands) {
			OWLBAT.run(this, response.commands);
		}
	}

	async output(serverCommand, data) {
		// TODO: Try /catch and display an offline notice if fails
		const sendObj = {
			programName: this.programName,
			identity: this.identity,
			serverCommand,
			data,
		};
		const response = await this.wire.send(this, null, sendObj);
		// console.log('Output returned', response);
		// if (this.programName === 'server' && what === LOGIN_SERVER_COMMAND) {
		// 	this.identity.userKey = response.userKey;
		// }
		// OWLBAT.input(this, response);
	}

	static setupCanvas(bat) {
		bat.canvas = document.querySelector('.owlbat-canvas');
		if (!bat.canvas) {
			console.error('Cannot find canvas element. OWLBAT will not work.');
			return;
		}
		bat.ctx = bat.canvas.getContext('2d');
		bat.ctx.fillStyle = ORANGE;
	}

	static setupKeyboard(bat) {
		const input = OWLBAT.getKeyboardInputElement();
		const keyboardSection = OWLBAT.getKeyboardSectionElement();
		const screen = OWLBAT.getScreenElement();
		keyboardSection.addEventListener('click', () => { input.focus(); });
		screen.addEventListener('click', () => { input.focus(); })
		input.addEventListener('keypress', bat.keyPressListener);
	}

	static getScreenElement() {
		return window.document.getElementsByClassName('owlbat-machine-screen')[0];
	}

	static getKeyboardSectionElement() {
		return window.document.querySelector('.owlbat-keyboard-section');
	}

	static getKeyboardInputElement() {
		const keyboardSection = OWLBAT.getKeyboardSectionElement();
		if (!keyboardSection) return;
		return keyboardSection.querySelector('.owlbat-keyboard-input');
	}

	static clearKeyboardInputElementValue() {
		OWLBAT.getKeyboardInputElement().value = '';
	}

	setup(options = {}) {
		this.defaultServer = options.server;
		window.document.addEventListener('DOMContentLoaded', () => {
			OWLBAT.setupCanvas(this);
			OWLBAT.setupKeyboard(this);

			// From https://codepen.io/desandro/pen/KRWjzm
			// TODO: Refactor
			var cube = document.querySelector('.owlbat-machine');
			var radioGroup = document.querySelector('.radio-group');
			var currentClass = '';
		
			function changeSide() {
			var checkedRadio = radioGroup.querySelector(':checked');
			var showClass = 'show-' + checkedRadio.value;
			if ( currentClass ) {
				cube.classList.remove( currentClass );
			}
			cube.classList.add( showClass );
			currentClass = showClass;
			}
			// set initial side
			changeSide();
		
			radioGroup.addEventListener( 'change', changeSide );

			// Start?
			this.splash();
			if (options.start) {
				OWLBAT.start(this, options.start);
			}
		});
	}
}

export default OWLBAT;
