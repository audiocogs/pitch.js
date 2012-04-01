#!/usr/bin/env node

require('../tools/');

var BUFFER_LEN = 1024;

function process_data (data, analyzer, stream) {
	stream.write(data.length + ' ');
	if (data.length !== BUFFER_LEN) {
		var ddata = new Float32Array(BUFFER_LEN);
		ddata.set(data);
		data = ddata;
	}

	analyzer.input(data);
	analyzer.process();
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
