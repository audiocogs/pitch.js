#!/usr/bin/env node

var debug = console.error.bind(console);

var fs = require('fs');
var Analyzer = require('../../src/pitch.js');
var WavReader = require('../tools/wavreader.js');

var BUFFER_LEN = 1024;

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

function process_data (data, analyzer, stream) {
	stream.write(data.length + ' ');
	if (data.length !== BUFFER_LEN) {
		var ddata = new Float32Array(BUFFER_LEN);
		ddata.set(data);
		data = ddata;
	}

	analyzer.process(data);
	var tone = analyzer.findTone();
	var freq = tone ? tone.freq : 0.0;

	stream.write(format_float(freq) + '\n');
}

var argv = [].slice.call(process.argv);

if (argv.length !== 4) {
	die(1, "Usage: test.js <infile> <outfile>");
}

var inpath = argv[2];
var outpath = argv[3];


debug("Generating test file `", outpath, "` from input data in `", inpath, "`");

var infile, outfile;

try {
	infile = new WavReader(inpath);
} catch (e) {
	die(2, "Couldn't decode file `", inpath, "`");
}

if (infile.channelCount !== 1) {
	die(3, "Input file `", inpath, "` is not mono (has", infile.channelCount, "channels)");
}

try {
	outfile = fs.createWriteStream(outpath, {
		encoding: 'UTF-8',
		flags: 'w+'
	});
} catch (e) {
	die(4, "Couldn't open file `", outpath, "` for writing");
}

var analyzer = new Analyzer({sampleRate: infile.sampleRate});

var data;

while (data = infile.readBuffer(BUFFER_LEN)) {
	process_data(data, analyzer, outfile);
}

outfile.destroySoon();

debug("Done");
