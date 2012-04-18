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

## License

Sorry, for now you aren't allowed to read the code or use it because we aren't sure what license we should use for it. Tough luck! :(
