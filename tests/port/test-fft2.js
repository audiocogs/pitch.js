#!/usr/bin/env node

require('../tools/');

var FFT = require('../../src/fft.js');

var BUFFER_LEN = 1024;

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

    print('(' + format_float(real) + ', ' + format_float(imag) +  ')');
}
