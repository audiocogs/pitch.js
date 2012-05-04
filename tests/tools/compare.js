#!/usr/bin/env node

require('./');

var argv = [].slice.call(process.argv);

var options = {
	errorTolerance: 0.0,
	epsilon: 0.004
};

detectFlags: while (argv[2][0] === '-') {
	switch (argv[2]) {
	case "-et":
	case "--error-tolerance":
		options.errorTolerance = parseFloat(argv[3]);
		argv.splice(2, 2);
		break;
	case "-e":
	case "--epsilon":
		options.epsilon = parseFloat(argv[3]);
		argv.splice(2, 2);
		break;
	default:
		break detectFlags;
	}
}

if (argv.length !== 4) {
	die(1, "Usage: compare.js [flags] <file1> <file2>");
}

var file1, file2;
var total = 0;

try {
	file1 = read(argv[2]).trimRight().split('\n');
	file2 = read(argv[3]).trimRight().split('\n');
} catch (e) {
	die(2, "Error reading file", file1 ? argv[2] : argv[1]);
}

var l = Math.max(file1.length, file2.length);

var ec = 0;

for (var i=0; i<l; i++) {
	var f1 = parseFloat(file1[i]);
	var f2 = parseFloat(file2[i]);
	var e = Math.abs((f1 - f2) / f1);

	if (file1[i] !== file2[i] && (isNaN(f1) || isNaN(f2) || e > options.epsilon)) {
		print(i+1, ec++, file1[i], file2[i]);
	}

	total += file1[i] === file2[i] ? 0.0 : Math.abs(e) === Infinity ||
		isNaN(e) ? 1.0 : e;
}

var er = (l - ec) / l;

debug('Average error:', format_float(total / l));

if (ec) {
	if (1.0 - er <= options.errorTolerance) {
		debug("Comparison passed with", ec, "errors out of", l,
			"(" + Math.round(er * 100) + "% success rate,",
			Math.round(options.errorTolerance * 100) + "% error tolerance)");
	} else {
		die(3, "Comparison failed with", ec, "errors out of", l,
			"(" + Math.round(er * 100) + "% success rate)");
	}
}

debug("Comparison match!");
