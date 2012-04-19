# pitch.js

pitch.js is a pitch detection library written in JavaScript. It is based on the excellent code used in [performous](http://performous.org). While mainly aimed for human voice, it can also be used with other instruments.

## Usage

pitch.js ships one namespace, called ```PitchAnalyzer``` from which all the functionality is available:

```javascript

/* Create a new pitch detector */
var pitch = new PitchDetector(sampleRate);

/* Copy samples to the internal buffer */
pitch.input(audioBuffer);
/* Process the current input in the internal buffer */
pitch.process();

var tone = pitch.findTone();

if (tone === null) {
	console.log('No tone found!');
} else {
	console.log('Found a tone, frequency:', tone.freq, 'volume:', tone.db);
}

```

### Notes

 * The ```audioBuffer``` must be mono.
 * The internal buffer is 4096 samples long, so if you input more than that without processing in between, you might get incorrect results.

### Authors

pitch.js is brought to you by [Official.fm Labs](http://labs.official.fm). Please see [./docs/AUTHORS.md](https://github.com/ofmlabs/pitch.js/blob/master/docs/AUTHORS.md) for more details.

## License

This code is ported from original C++ code by Lasse Kärkkäinen, hence licensed under GPLv2, as is the original. Please see [pitch.js/docs/LICENSE.txt](https://github.com/ofmlabs/pitch.js/blob/master/docs/LICENSE.txt) for further information.
