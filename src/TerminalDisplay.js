const ORANGE_R = 255;
const ORANGE_G = 134;
const ORANGE_B = 0;
const ORANGE = `rgba(${ORANGE_R},${ORANGE_G},${ORANGE_B},1)`;
const CLEAR = 'rgba(0,0,0,1)';
// 'rgb(255,144,0)' -- from Cyber1.org's pterm
// '#FE9300' -- from https://cdn.escapistmagazine.com/media/global/images/library/deriv/801/801121.png
// '#FE864D' -- from http://www.platohistory.org/blog/2010/04/the-terminals-are-coming.html
const SCREEN_X = 512;
const SCREEN_Y = 512;

// Screen mode - See https://irata.online/assets/s0ascers-045c83081e9ada2008378c3ae6aa62564b213a71decf9fe04608909b91d20ad1.html#C1
// 3.2.3.1
const SCREEN_MODE_WRITE = 'write';
const SCREEN_MODE_ERASE = 'erase';
const SCREEN_MODE_REWRITE = 'rewrite';
const SCREEN_MODE_INVERSE = 'inverse'; // Not supported yet

class TerminalDisplay {
	static ORANGE = ORANGE;
	static SCREEN_X = SCREEN_X;
	static SCREEN_Y = SCREEN_Y;
	static SCREEN_MODE_WRITE = SCREEN_MODE_WRITE;
	static SCREEN_MODE_ERASE = SCREEN_MODE_ERASE;
	static SCREEN_MODE_REWRITE = SCREEN_MODE_REWRITE;
	static SCREEN_MODE_INVERSE = SCREEN_MODE_INVERSE;
	static SCREEN_MODES = new Set([
		TerminalDisplay.SCREEN_MODE_WRITE, 
		TerminalDisplay.SCREEN_MODE_ERASE, 
		TerminalDisplay.SCREEN_MODE_REWRITE, 
		TerminalDisplay.SCREEN_MODE_INVERSE,
	]);

	static getCoordinatesFromArray(arr = [], i = 0) {
		return { x: Number(arr[i]), y: Number(arr[i + 1]) };
	}

	/**
	 * Get coordinates from array with the y value corrected for drawing area 0,0 at the
	 * bottom left, 512,512 at top right (like PLATO and typical math x,y coordinates)
	 **/
	static getCorrectedCoordinates(arr = [], i = 0) {
		let { x, y } = TerminalDisplay.getCoordinatesFromArray(arr, i);
		y = SCREEN_Y - y;
		return { x: Math.round(x) + 0.5, y: Math.round(y) + 0.5 };
	}

	static setupContext(ctx, screenMode = SCREEN_MODE_WRITE) {
		const writePx = (screenMode === SCREEN_MODE_WRITE || screenMode === SCREEN_MODE_REWRITE);
		const color = (writePx) ? ORANGE : CLEAR;
		ctx.strokeStyle = color;
		ctx.fillStyle = color;
		ctx.lineWidth = 1;
		return ctx;
	}

	static contextBeginPath(ctx, screenMode) {
		ctx.beginPath();
		TerminalDisplay.setupContext(ctx, screenMode);
		return ctx;
	}

	/** Draw lines */
	static draw(ctx, arr = [], screenMode) {
		const arrString = (typeof arr === 'string') ? arr : arr.join(',');
		const linesArr = arrString.split('skip');
		ctx.save();
		TerminalDisplay.contextBeginPath(ctx, screenMode);
		const errors = [];
		linesArr.forEach((pointsString, lineIndex) => { // Each new line segment
			const points = pointsString.split(',')
				.filter((point) => point); // filter out empty strings
			if (points.length === 2) {
				TerminalDisplay.drawPixel(ctx, points);
				return;
			} else if (points.length === 1) {
				// TODO: Handle single numbers as coarse coordinates (row/col)
				errors.push(`Not enough coordinates to draw ${lineIndex} ${points}`);
				return;
			}
			// Loop over points by two
			for(let i = 0; i < points.length; i += 2) {
				const { x, y } = TerminalDisplay.getCorrectedCoordinates(points, i);
				if (isNaN(x) || isNaN(y)) {
					errors.push(`x or y not a number ${lineIndex} ${i}: ${points}`);
				}
				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}
		});
		if (errors.length > 0) console.warn(errors.join('\n'));
		/*
		if (arr.length === 2) {
			TerminalDisplay.drawPixel(ctx, arr);
			console.log('draw pixel', arr)
			return;
		} else if (arr.length === 1) {
			console.warn('Not enough coordinates to draw', arr);
			return;
		}
		TerminalDisplay.contextBeginPath(ctx);
		let moveNext = true;
		for(let i = 0; i < arr.length; i++) {
			if (arr[i] === 'skip') {
				moveNext = true;
				i++;
			}
			const { x, y } = TerminalDisplay.getCorrectedCoordinates(arr, i);
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
		*/
		ctx.stroke();
		ctx.restore();
	}

	static drawRectangle(ctx, x, y, sizeX, sizeY, fill = false, screenMode) {
		// console.log(x, y, sizeX, sizeY);
		ctx.save();
		let method = (fill) ? 'fillRect' : 'strokeRect';
		if (screenMode === SCREEN_MODE_ERASE) {
			method = 'clearRect';
		} else {
			TerminalDisplay.contextBeginPath(ctx, screenMode);
		}
		ctx[method](x, y, sizeX, sizeY);
		ctx.restore();
	}

	static drawBlock(ctx, commandArr, screenMode) {
		const c1 = TerminalDisplay.getCorrectedCoordinates(commandArr, 0);
		const c2 = TerminalDisplay.getCorrectedCoordinates(commandArr, 2);
		const fill = true;
		const sizeX = c2.x - c1.x;
		const sizeY = c2.y - c1.y;
		TerminalDisplay.drawRectangle(ctx, c1.x, c1.y, sizeX, sizeY, fill, screenMode);
	}

	static drawPixel(ctx, arr = [], screenMode) {
		if (arr.length < 2) return;
		const { x, y } = TerminalDisplay.getCorrectedCoordinates(arr);
		if (isNaN(x) || isNaN(y)) {
			console.warn('x or y not a number', arr);
			return;
		}
		ctx.save();
		TerminalDisplay.setupContext(ctx, screenMode);
		ctx.fillRect(x, y, 1, 1);
		ctx.restore();
	}

	static circle(ctx, arr = [], screenMode) {
		if (arr.length < 3) return;
		const r = arr[0];
		const { x, y } = TerminalDisplay.getCorrectedCoordinates(arr.slice(1));
		if (isNaN(r) || isNaN(x) || isNaN(y)) {
			console.warn('x or y or r is not a number', arr, x, y, r);
			return;
		}
		ctx.save();
		TerminalDisplay.contextBeginPath(ctx, screenMode);
		ctx.arc(x, y, r, 0, 2 * Math.PI, false);
		ctx.stroke();
		ctx.restore();
	}

	static clear(ctx) {
		ctx.clearRect(0, 0, SCREEN_X, SCREEN_Y);
	}

	static filter(
		ctx,
		color = { r: ORANGE_R, g: ORANGE_G, b: ORANGE_B, a: 255 },
		brightThreshold = ((ORANGE_R + ORANGE_G + ORANGE_B + 255) / 1.3) // Number between 0 - 1020
	) {
		// Inspired by https://github.com/Lukenickerson/major-hammer/blob/master/js/gb.js#L67
		const imageData = ctx.getImageData(0, 0, SCREEN_X, SCREEN_Y);
		// ^ should be canvas x,y but assumes this is the same as SCREEN_ constants
		const dat = imageData.data;
		const len = dat.length;
		for(let p = 0; p < len; p += 4) { // 4 values per pixel
			// Total up r + g + b + alpha --> Total can be 255 * 4 = 1020
			const totalPixelValues = dat[p] + dat[p + 1] + dat[p + 2] + dat[p + 3];
			if (totalPixelValues >= brightThreshold) {
				dat[p] = color.r;
				dat[p + 1] = color.g;
				dat[p + 2] = color.b;
				dat[p + 3] = color.a;
			} else {
				// We could make r,g,b 0 for black, but don't need to set them if
				// we make the pixel transparent
				dat[p + 3] = 0;
			}
		}
		ctx.putImageData(imageData, 0, 0);
	}
}

window.TerminalDisplay = TerminalDisplay;

export default TerminalDisplay;
