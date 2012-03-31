#!/usr/bin/env node

var debug = console.error.bind(console);

var fs = require('fs');
var Analyzer = require('../../src/pitch.js');

var BUFFER_P = 5;
var BUFFER_LEN = 1 << BUFFER_P;

function die (code) {
	debug.apply(null, [].slice.call(arguments, 1));
	process.exit(code || 0);
}

function format_float (n) {
	n = String(n);
	var i = n.indexOf('.');
	return (i === -1 ? n + '.000000' : n.substring(0, i + 7)) + Array(i === -1 ? 1 : 7 - n.length + i).join('0');
}

function process_data (data, window, stream) {
	var fft = Analyzer.fft(data, window, BUFFER_P);

	for (var i = 0; i < fft.length; i+=2) {
		var real = fft[i*2];
		var imag = fft[i*2 + 1];

		stream.write('(' + format_float(real) + ', ' + format_float(imag) +  ')\n');
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
	outfile = fs.createWriteStream(outpath, {
		encoding: 'UTF-8',
		flags: 'w+'
	});
} catch (e) {
	die(2, "Couldn't open file `", outpath, "` for writing");
}

var data = new Float32Array(BUFFER_LEN);
data[0] = 1;

var wnd = new Float32Array(BUFFER_LEN);
for (var i = 0; i < BUFFER_LEN; i++) {
	wnd[i] = 1;
}

process_data(data, wnd, outfile);

data[BUFFER_LEN-1] = 1;

process_data(data, wnd, outfile);

outfile.destroySoon();

debug("Done");
