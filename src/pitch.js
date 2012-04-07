/*global PitchAnalyzer:true, Float32Array:false, module:false */

PitchAnalyzer = this.PitchAnalyzer = (function () {

var	pi	= Math.PI,
	pi2	= pi * 2,
	sin	= Math.sin,
	cos	= Math.cos,
	pow	= Math.pow,
	log	= Math.log,
	max	= Math.max,
	min	= Math.min,
	abs	= Math.abs,
	LN10	= Math.LN10,
	sqrt	= Math.sqrt,
	atan2	= Math.atan2,
	inf	= 1/0,
	FFT_P	= 10,
	FFT_N	= 1 << FFT_P,
	BUF_N	= FFT_N * 2;

function round (val) {
	return ~~(val + (val >= 0 ? 0.5 : -0.5));
}

function remainder (val, div) {
	return val - round(val/div) * div;
}

function cabs (b, i) {
	return sqrt(b[i] * b[i] + b[i+1] * b[i+1]);
}

function carg (b, i) {
	return atan2(b[i+1], b[i]);
}

function square (n) {
	return n * n;
}

function log10 (n) {
	return log(n) / LN10;
}

function extend (obj) {
	var	args	= arguments,
		l	= args.length,
		i, n;


	for (i=1; i<l; i++){
		for (n in args[i]){
			if (args[i].hasOwnProperty(n)){
				obj[n] = args[i][n];
			}
		}
	}

	return obj;
}

/**
 * A class for tones.
 *
 * @class
 * @static PitchAnalyzer
 * @param default:0.0 min:0.0 type:Number freq The frequency of the tone.
 * @param default:-Infinity max:0.0 type:Number db The volume of the tone.
 * @param default:-Infinity max:0.0 type:Number stabledb An average of the volume of the tone.
 * @param default:0 min:0 type:Integer age How many times the tone has been detected in a row.
*/
function Tone () {
	this.harmonics = new Float32Array(Tone.MAX_HARM);
}

Tone.prototype = {
	freq: 0.0,
	db: -inf,
	stabledb: -inf,
	age: 0,

	toString: function () {
		return '{freq: ' + this.freq + ', db: ' + this.db + ', stabledb: ' + this.stabledb + ', age: ' + this.age + '}';
	},

/**
 * Return an approximation of whether the tone has the same frequency as provided.
 *
 * @method Tone
 * @private
 * @arg {Number} freq The frequency to compare to.
 * @return {Boolean} Whether it was a match.
*/
	matches: function (freq) {
		return abs(this.freq / freq - 1.0) < 0.05;
	},

	harmonics: null
};

Tone.MIN_AGE = 2;
Tone.MAX_HARM = 48;

/**
 * An internal class to manage the peak frequencies detected.
 *
 * @private
 * @class
 * @static PitchAnalyzer
 * @arg default:0.0 min:0.0 type:Number !freq The frequency of the peak.
 * @arg default:-Infinity max:0.0 type:Number !db The volume of the peak.
*/
function Peak (freq, db) {
	this.freq = typeof freq === 'undefined' ? this.freq : freq;
	this.db = typeof db === 'undefined' ? this.db : db;

	this.harm = new Array(Tone.MAX_HARM);
}

Peak.prototype = {
	harm: null,

	freq: 0.0,
	db: -inf,

/**
 * Resets the peak to default values.
 *
 * @method Peak
 * @private
*/
	clear: function () {
		this.freq	= Peak.prototype.freq;
		this.db		= Peak.prototype.db;
	}
};

/**
 * Finds the best matching peak from a certain point in the array of peaks.
 *
 * @static Peak
 * @private
 * @arg {Array} peaks The peaks to search from.
 * @arg {Integer} pos The position to find the match for.
 * @return {Peak} The best matching peak.
*/
Peak.match = function (peaks, pos) {
	var best = pos;

	if (peaks[pos - 1].db > peaks[best].db) best = pos - 1;
	if (peaks[pos + 1].db > peaks[best].db) best = pos + 1;

	return peaks[best];
};

/**
 * A class to analyze pitch from input data.
 *
 * @class PitchAnalyzer
 * @arg {Object} !options Options to override default values.
*/
function Analyzer (options) {
	options = extend(this, options);

	this.data = new Float32Array(FFT_N);
	this.buffer = new Float32Array(BUF_N);
	this.fftLastPhase = new Float32Array(BUF_N);
	if (this.wnd === null) this.wnd = Analyzer.calculateWindow();
	this.tones = [];
}

Analyzer.prototype = {
	wnd: null,
	data: null,
	fft: null,
	tones: null,
	fftLastPhase: null,
	buffer: null,

	offset: 0,
	bufRead: 0,
	bufWrite: 0,

	MIN_FREQ: 50,
	MAX_FREQ: 5000,

	sampleRate: 44100,
	step: 200,
	oldFreq: 0.0,

	peak: 0.0,

/**
 * Gets the current peak level in dB (negative value, 0.0 = clipping).
 *
 * @method PitchAnalyzer
 * @return {Number} The current peak level (db).
*/
	getPeak: function () {
		return 10.0 * log10(this.peak);
	},

	findTone: function (minFreq, maxFreq) {
		if (!this.tones.length) {
			this.oldFreq = 0.0;
			return null;
		}

		minFreq = typeof minFreq === 'undefined' ? 65.0 : minFreq;
		maxFreq = typeof maxFreq === 'undefined' ? 1000.0 : maxFreq;

		var db = max.apply(null, this.tones.map(Analyzer.mapdb));
		var best = null;
		var bestscore = 0;

		for (var i=0; i<this.tones.length; i++) {
			if (this.tones[i].db < db - 20.0 || this.tones[i].freq < minFreq || this.tones[i].age < Tone.MIN_AGE) continue;
			if (this.tones[i].freq > maxFreq) break;

			var score = this.tones[i].db - max(180.0, abs(this.tones[i].freq - 300)) / 10.0;

			if (this.oldFreq !== 0.0 && abs(this.tones[i].freq / this.oldFreq - 1.0) < 0.05) score += 10.0;
			if (best && bestscore > score) break;

			best = this.tones[i];
			bestscore = score;
		}

		this.oldFreq = (best ? best.freq : 0.0);
		return best;
	},

/**
 * Copies data to the internal buffers for processing and calculates peak.
 * Note that if the buffer overflows, unprocessed data gets discarded.
 *
 * @method PitchAnalyzer
 * @arg {Float32Array} data The input data.
*/
	input: function (data) {
		var buf = this.buffer;
		var r = this.bufRead;
		var w = this.bufWrite;

		var overflow = false;

		for (var i=0; i<data.length; i++) {
			var s = data[i];
			var p = s * s;

			if (p > this.peak) this.peak = p; else this.peak *= 0.999;

			buf[w] = s;

			w = (w + 1) % BUF_N;

			if (w === r) overflow = true;
		}

		this.bufWrite = w;
		if (overflow) this.bufRead = (w + 1) % BUF_N;
	},

/**
 * Processes available data and calculates tones.
 *
 * @method PitchAnalyzer
*/
	process: function () {
		while (this.calcFFT()) this.calcTones();
	},

/**
 * Matches new tones against old ones, merging similar ones.
 *
 * @method PitchAnalyzer
 * @private
*/
	mergeWithOld: function (tones) {
		var i, n;

		tones.sort(function (a, b) { return a.freq < b.freq ? -1 : a.freq > b.freq ? 1 : 0; });

		for (i=0, n=0; i<this.tones.length; i++) {
			while (n < tones.length && tones[n].freq < this.tones[i].freq) n++;

			if (n < tones.length && tones[n].matches(this.tones[i].freq)) {
				tones[n].age = this.tones[i].age + 1;
				tones[n].stabledb = 0.8 * this.tones[i].stabledb + 0.2 * tones[n].db;
				tones[n].freq = 0.5 * (this.tones[i].freq + tones[n].freq);
			} else if (this.tones[i].db > -80.0) {
				tones.splice(n, 0, this.tones[i]);
				tones[n].db -= 5.0;
				tones[n].stabledb -= 0.1;
			}

		}
	},

/**
 * Calculates the tones from the FFT data.
 *
 * @method PitchAnalyzer
 * @private
*/
	calcTones: function () {
		var	freqPerBin	= this.sampleRate / FFT_N,
			phaseStep	= pi2 * this.step / FFT_N,
			normCoeff	= 1.0 / FFT_N,
			minMagnitude	= pow(10, -100.0 / 20.0) / normCoeff,
			kMin		= ~~max(1, this.MIN_FREQ / freqPerBin),
			kMax		= ~~min(FFT_N / 2, this.MAX_FREQ / freqPerBin),
			peaks		= [],
			tones		= [],
			k, p, n, t, count, freq, magnitude, phase, delta, prevdb, db, bestDiv,
			bestScore, div, score;

		for (k=0; k < kMax + 1; k++) {
			peaks.push(new Peak());
		}

		for (k=1; k<=kMax; k++) {
			magnitude = cabs(this.fft, k*2);
			phase = carg(this.fft, k*2);

			delta = phase - this.fftLastPhase[k];
			this.fftLastPhase[k] = phase;

			delta -= k * phaseStep;
			delta = remainder(delta, pi2);
			delta /= phaseStep;

			freq = (k + delta) * freqPerBin;

			if (freq > 1.0 && magnitude > minMagnitude) {
				peaks[k].freq = freq;
				peaks[k].db = 20.0 * log10(normCoeff * magnitude);
			}
		}

		prevdb = peaks[0].db;

		for (k=1; k<kMax; k++) {
			db = peaks[k].db;
			if (db > prevdb) peaks[k - 1].clear();
			if (db < prevdb) peaks[k].clear();
			prevdb = db;
		}

		for (k=kMax-1; k >= kMin; k--) {
			if (peaks[k].db < -70.0) continue;

			bestDiv = 1;
			bestScore = 0;

			for (div = 2; div <= Tone.MAX_HARM && k / div > 1; div++) {
				freq = peaks[k].freq / div;
				score = 0;
				for (n=1; n<div && n<8; n++) {
					p = Peak.match(peaks, ~~(k * n / div));
					score--;
					if (p.db < -90.0 || abs(p.freq / n / freq - 1.0) > 0.03) continue;
					if (n === 1) score += 4;
					score += 2;
				}
				if (score > bestScore) {
					bestScore = score;
					bestDiv = div;
				}
			}

			t = new Tone();

			count = 0;

			freq = peaks[k].freq / bestDiv;

			t.db = peaks[k].db;

			for (n=1; n<=bestDiv; n++) {
				p = Peak.match(peaks, ~~(k * n / bestDiv));

				if (abs(p.freq / n / freq - 1.0) > 0.03) continue;

				if (p.db > t.db - 10.0) {
					t.db = max(t.db, p.db);
					count++;
					t.freq += p.freq / n;
				}
				t.harmonics[n - 1] = p.db;
				p.clear();
			}

			t.freq /= count;

			if (t.db > -50.0 - 3.0 * count) {
				t.stabledb = t.db;
				tones.push(t);
			}
		}

		this.mergeWithOld(tones);

		this.tones = tones;
	},

/**
 * Calculates the FFT for the input signal, if enough is available.
 *
 * @method PitchAnalyzer
 * @private
 * @return {Boolean} Whether there was enough data to process.
*/
	calcFFT: function () {
		var r = this.bufRead;

		if ((BUF_N + this.bufWrite - r) % BUF_N <= FFT_N) return false;

		for (var i=0; i<FFT_N; i++) {
			this.data[i] = this.buffer[(r + i) % BUF_N];
		}

		this.bufRead = (r + this.step) % BUF_N;

		this.fft = Analyzer.fft(this.data, this.wnd, FFT_P);

		return true;
	}
};

Analyzer.mapdb = function (e) {
	return e.db;
};

Analyzer.Tone = Tone;

/**
 * Calculates a Hamming window for the size FFT_N.
 *
 * @static PitchAnalyzer
 * @return {Float32Array} The hamming window.
*/
Analyzer.calculateWindow = function () {
	var i, w = new Float32Array(FFT_N);

	for (i=0; i<FFT_N; i++) {
		w[i] = 0.53836 - 0.46164 * cos(pi2 * i / (FFT_N - 1));
	}

	return w;
};

/**
 * Calculates the RFFT for input data of the size 1 << P.
 *
 * @static PitchAnalyzer
 * @private
 * @arg {Float32Array} inData The data to process.
 * @arg {Float32Array} wnd The window to apply to the data.
 * @arg {Integer} P The size of the input data.
 * @return {Float32Array} The FFT data.
*/
Analyzer.fft = function (inData, wnd, P) { //return;
	var N = 1 << P;
	var data = new Float32Array(N<<1);
	var M = N / 2;
	var m = M;

	for (var i=0, j=0; i<N; i++, m=M) {
		data[j*2] = inData[i] * wnd[i];
		while (m > 1 && m <= j) { j -= m; m >>= 1; }
		j += m;
	}

	Analyzer.DanielsonLanczos(data, P);

	return data;
};

/**
 * Runs the butterfly part of the transform on the data.
 *
 * @static PitchAnalyzer
 * @private
 * @arg {Float32Array} data The bit reversal sorted data.
 * @arg {Integer} P The size of the input data as length = 2 << P.
*/
Analyzer.DanielsonLanczos = function (data, P) {
	if (!P) return;

	var N = 1 << P;
	var M = N / 2;

	Analyzer.DanielsonLanczos(data, P - 1);
	Analyzer.DanielsonLanczos(data.subarray(M * 2), P - 1);

	var wp_r = -2.0 * square(sin(pi / N));
	var wp_i = -sin(pi2 / N);

	var w_r = 1.0;
	var w_i = 0.0;

	for (var i=0; i<M; i++) {
		var n = 2 * (i + M);

		var temp_r = data[n + 0] * w_r - data[n + 1] * w_i;
		var temp_i = data[n + 0] * w_i + data[n + 1] * w_r;

		data[n + 0] = data[i * 2 + 0] - temp_r;
		data[n + 1] = data[i * 2 + 1] - temp_i;

		data[i * 2 + 0] += temp_r;
		data[i * 2 + 1] += temp_i;

		var ww_r = w_r * wp_r - w_i * wp_i;
		var ww_i = w_r * wp_i + w_i * wp_r;

		w_r += ww_r;
		w_i += ww_i;
	}
};

return Analyzer;

}());

if (typeof module !== 'undefined') {
	module.exports = PitchAnalyzer;
}
