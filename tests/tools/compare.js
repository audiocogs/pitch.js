#!/usr/bin/env node

var debug = console.error.bind(console);
var print = console.log.bind(console);

var fs = require('fs');

function die (code) {
	debug.apply(null, [].slice.call(arguments, 1));
	process.exit(code || 0);
}

function read (path) {
	return fs.readFileSync(path, 'UTF-8');
}

var argv = [].slice.call(process.argv);

if (argv.length !== 4) {
	die(1, "Usage: compare.js <file1> <file2>");
}

var file1, file2;

try {
	file1 = read(argv[2]).split('\n');
	file2 = read(argv[3]).split('\n');
} catch (e) {
	die(2, "Error reading file", file1 ? argv[2] : argv[1]);
}

var l = Math.max(file1.length, file2.length);

var ec = 0;

for (var i=0; i<l; i++) {
	file1[i] !== file2[i] && print(i, ec++, file1[i], file2[i]);
}

if (ec) die(3, "Comparison failed with", ec, "errors");

print("Comparison match!");
