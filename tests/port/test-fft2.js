#!/usr/bin/env node

var debug = console.error.bind(console);
var write = console.log.bind(console);

var fs = require('fs');
var FFT = require('../../src/fft.js');

var BUFFER_LEN = 1024;

function format_float (n) {
	n = String(n);
	var i = n.indexOf('.');
	return (i === -1 ? n + '.000000' : n.substring(0, i + 7)) + Array(i === -1 ? 1 : 7 - n.length + i).join('0');
}

var data = new Float32Array(BUFFER_LEN);
data[0] = 1;

var wnd = new Float32Array(BUFFER_LEN);
for(var i = 0; i < BUFFER_LEN; i++) {
    wnd[i] = 1;
}

var P = Math.log(BUFFER_LEN)/Math.log(2)

spectrum = new FFT(data, P, wnd);

for(var i = 0; i < BUFFER_LEN; i++) {
    var real = spectrum[i*2];
    var imag = spectrum[i*2 + 1];

    write('(' + format_float(real) + ', ' + format_float(imag) +  ')');
}
