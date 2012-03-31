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
	var s = String(Math.round(n * 1e6));
	var p = s[0] === '-' ? '-' : '';
	if (!n) return p + "0.000000";
	return p + ((n > 0 ? n < 1 : n > -1) ? '0' : '') +
		s.substring(+!!p, s.length - 6) + '.' + s.substring(s.length - 6);
}

function process_data (data, window, stream) {
	var fft = Analyzer.fft(data, window, BUFFER_P);

	for (var i = 0; i < fft.length; i+=2) {
		var real = fft[i];
		var imag = fft[i + 1];

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
