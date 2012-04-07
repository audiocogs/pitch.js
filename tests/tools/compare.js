#!/usr/bin/env node

require('./');

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
	if (file1[i] !== file2[i] && Math.abs(parseFloat(file1[i]) - parseFloat(file2[i])) > 0.000003) {
		print(i+1, ec++, file1[i], file2[i]);
	}
}

if (ec) die(3, "Comparison failed with", ec, "errors out of", l, "(" + Math.round((l - ec) / l * 100) + "% success rate)");

debug("Comparison match!");
