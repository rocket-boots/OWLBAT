import TerminalDisplay from './TerminalDisplay.js';

// Modes
const TTY_MODE = 'TTY'; // "Resident modes": TTY or graphics

const OWLBAT_MODE = 'OWLBAT';
const OFFLINE_MODE = 'OFFLINE';
const INPUT_KEYPRESS = 'key';
const INPUT_TEXT = 'text';

// Should fit 64 characters (8px wide) across a row, and 32 rows of characters
const FONT_FACE = 'IBMDOS';
const CHAR_X = 8;
const CHAR_Y = 16;
const CHAR_COL_MAX = TerminalDisplay.SCREEN_X / CHAR_X;
const CHAR_ROW_MAX = TerminalDisplay.SCREEN_Y / CHAR_Y;

const SERVER_PROGRAM = 'server';
const LOGIN_SERVER_COMMAND = 'login'; // TODO: move to Wire?

class OWLBAT {
	constructor(options = {}) {
		this.canvas = null;
		this.ctx = null;
		this.wire = null; // Connection to server
		this.mode = TTY_MODE; // TODO
		this.screenMode = TerminalDisplay.SCREEN_MODE_WRITE;
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

		// TODO: Add throttle to key presses?
		this.keyPressListener = (e) => {
			// console.log(this.inputMode, e.key, e.keyCode);
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
		this.mouseMoveThrottleTimerId = null;
		this.mouseMoveListener = (e) => {
			if (this.mouseMoveThrottleTimerId) return;
			this.mouseMoveThrottleTimerId = window.setTimeout(() => {
				const sceneDims = this.getSceneDimensions();
				this.mouseMoveThrottleTimerId = null;
				const { pageX, pageY } = e;
				const isAbove = (pageY < sceneDims.top);
				const isBelow = (pageY > sceneDims.bottom);
				const degX = (isAbove) ? (sceneDims.top - pageY) / 14 : (isBelow ? (sceneDims.bottom - pageY) / 14 : 0);
				const degY = (isAbove || isBelow) ? (pageX - sceneDims.middleX) / 10 : 0;
				const degZ = 0;
				const translateZ = (isAbove || isBelow) ? '-600px' : undefined;
				// console.log(pageX, pageY, sceneDims);
				this.rotateMachine(degX, degY, degZ, translateZ);
			}, 150);
		};
	}

	rotateMachine(x = 0, y = 0 , z = 0, translateZ = 'var(--machine-neg-translate-z)') {
		// console.log(x, y, z);
		const transf = (
			`translateZ(${translateZ})
			rotateX(${x}deg)
			rotateY(${y}deg)
			rotateZ(${z}deg)`
		);
		const machineElt = window.document.getElementsByClassName('owlbat-machine')[0];
		machineElt.style.transform = transf;
	}

	static run(bat, commands = []) {
		commands.forEach((fullCommand) => {
			OWLBAT.runCommand(bat, fullCommand);
		});
		TerminalDisplay.filter(bat.ctx);
	}

	filter() {
		TerminalDisplay.filter(this.ctx);
	}

	static runCommand(bat, fullCommand) {
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
				TerminalDisplay.draw(bat.ctx, commandArr, bat.screenMode);
				break;
			}
			case 'block': {
				TerminalDisplay.drawBlock(bat.ctx, commandArr, bat.screenMode);
				break;
			}
			case 'circle': {
				TerminalDisplay.circle(bat.ctx, commandArr, bat.screenMode);
				break;
			}
			case 'at': {
				// TODO: Allow PLATO-style single-digit coordinates
				const { x, y } = TerminalDisplay.getCoordinatesFromArray(commandArr);
				OWLBAT.resetText(bat, x, y);
				break;
			}
			case 'mode': {
				bat.setMode(commandArr);
				break;
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

	}

	setProgramName(name) {
		if (!name || typeof name !== 'string') return false;
		this.programName = name;
		return true;
	}

	setMode(modes = []) {
		modes.forEach((m) => {
			const mode = m.toLowerCase();
			if (TerminalDisplay.SCREEN_MODES.has(mode)) {
				this.screenMode = mode;
			}
			// TODO: Other types of modes?
		});
	}

	setInputMode(mode) {
		if (!mode || typeof mode !== 'string') return false;
		const lowerMode = mode.toLowerCase();
		if (mode !== INPUT_KEYPRESS && mode !== INPUT_TEXT) return false;
		this.inputMode = mode;
		return true;
	}

	switchMode(newMode) {
		this.mode = newMode;
		// TODO: Kill any sends in flight
		// TODO: Do something in offline mode
	}

	switchPower(force) {
		this.power = (typeof force === 'boolean') ? force : !this.power;
		const machineElt = window.document.querySelector('.owlbat-machine');
		if (!this.power) {
			OWLBAT.clear(this);
			machineElt.classList.remove('owlbat-machine--on');
		} else {
			machineElt.classList.add('owlbat-machine--on');
		}
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

	async input(from, response) {
		if (!this.power) return;
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
		if (!this.power) return;
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

	splash() {
		const { ctx } = this;
		TerminalDisplay.draw(ctx, [
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
		], this.screenMode);
		// TerminalDisplay.circle(ctx, [300, 256, 256], this.screenMode);
		// TerminalDisplay.circle(ctx, [200, 256, 256]);
		// TerminalDisplay.circle(ctx, [100, 256, 256]);
		const corner = 100;
		const size = 512 - (corner * 2);
		TerminalDisplay.drawRectangle(ctx, corner, corner, size, size, this.screenMode);

		ctx.font = `40px ${FONT_FACE}`;
		ctx.fillText('OWLBAT', 195, 265);
		ctx.font = `20px ${FONT_FACE}`;
		this.writeAt('Booting...', 24, 27);
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
			}, 200); // Should be greater than twice the wire delay
		}
	}

	static startProgram(bat, programName) {
		if (!programName || programName.length <= 0) {
			console.warn('Cannot start program without a name');
			return;
		}
		bat.output('run', programName);
	}

	static setupCanvas(bat) {
		bat.canvas = document.querySelector('.owlbat-canvas');
		if (!bat.canvas) {
			console.error('Cannot find canvas element. OWLBAT will not work.');
			return;
		}
		bat.ctx = bat.canvas.getContext('2d');
		TerminalDisplay.setupContext(bat.ctx, bat.screenMode);
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

	getSceneDimensions() {
		const sceneElement = window.document.querySelector('.owlbat-machine-scene');
		const rect = sceneElement.getBoundingClientRect();
		return {
			top: rect.top + window.scrollX,
			bottom: rect.bottom + window.scrollY,
			middleX: rect.left + (rect.right - rect.left) / 2,
		};
	}

	setupMachineRotation() {
		// const sceneElement = window.document.querySelector('.owlbat-machine-scene');
		// const rect = sceneElement.getBoundingClientRect();
		// sceneDims.top = rect.top;
		// sceneDims.bottom = rect.bottom;
		// sceneDims.middleX = rect.left + (rect.right - rect.left) / 2;
		window.document.addEventListener('mousemove', this.mouseMoveListener);
	}

	setupButtons() {
		const panel = window.document.querySelector('.owlbat-machine-switch-panel')
		panel.addEventListener('click', (e) => {
			if (e.target.closest('.owlbat-machine-power-toggle')) {
				this.switchPower();
			}
		});
	}

	setup(options = {}) {
		this.defaultServer = options.server;
		window.document.addEventListener('DOMContentLoaded', () => {
			OWLBAT.setupCanvas(this);
			OWLBAT.setupKeyboard(this);
			this.setupButtons();
			this.setupMachineRotation();

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
				this.switchPower(true);
				OWLBAT.start(this, options.start);
			}
		});
	}
}

export default OWLBAT;
