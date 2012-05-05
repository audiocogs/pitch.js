#!/usr/bin/env node

require('../tools/');
var FFT = require('fft');

var BUFFER_P = 5;
var BUFFER_LEN = 1 << BUFFER_P;

var fft = new Float32Array(BUFFER_LEN * 2);
var input = new Float32Array(BUFFER_LEN);

function process_data (data, window, stream, rfft) {
	var i;

	for (i=0; i<BUFFER_LEN; i++) {
		input[i] = data[i] * window[i];
	}

	rfft.simple(fft, input, 'real');

	for (i = 0; i < fft.length; i+=2) {
		var real = fft[i];
		var imag = fft[i + 1];

		stream.write(format_float(real) + '\n' + format_float(imag) + '\n');
	}
}

var argv = [].slice.call(process.argv);

if (argv.length !== 3) {
	die(1, "Usage: test.js <outfile>");
}

var outpath = argv[2];


debug("Generating test file `", outpath, "` from some example data");

var outfile;

try {
	outfile = openWriteStream(outpath);
} catch (e) {
	die(2, "Couldn't open file `", outpath, "` for writing");
}

var rfft = new FFT.complex(BUFFER_LEN, false);

var data = new Float32Array(BUFFER_LEN);
data[0] = 1;

var wnd = new Float32Array(BUFFER_LEN);
for (var i = 0; i < BUFFER_LEN; i++) {
	wnd[i] = 1;
}

process_data(data, wnd, outfile, rfft);

data[BUFFER_LEN-1] = 1;

process_data(data, wnd, outfile, rfft);

data[BUFFER_LEN/2] = 0.5;

process_data(data, wnd, outfile, rfft);

outfile.destroySoon();

debug("Done");
