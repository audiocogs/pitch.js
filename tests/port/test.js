#!/usr/bin/env node

var debug = console.error.bind(console);
var print = console.log.bind(console);

var fs = require('fs');

function die (code) {
	debug.apply(null, [].slice.call(arguments, 1));
	process.exit(code || 0);
}

function fread (path) {
	return fs.readFileSync(path, 'UTF-8');
}
function fwrite (path, data) {
	return fs.writeFileSync(path, data, 'UTF-8');
}

var argv = [].slice.call(process.argv);

if (argv.length !== 4) {
	die(1, "Usage: test.js <infile> <outfile>");
}

var inpath = argv[2];
var outpath = argv[3];

/* TODO: Actually do something here. For now, we'll just pretend */

fwrite(outpath, 'TODO');
