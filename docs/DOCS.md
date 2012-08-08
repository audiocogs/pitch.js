# pitch.js

## PitchAnalyzer.Tone

A class for tones.

### Methods

#### matches(freq)

Return an approximation of whether the tone has the same frequency as provided.

##### Arguments

 * (Number) freq: The frequency to compare to.

##### Returns

(Boolean) Whether it was a match.

## PitchAnalyzer.Peak

An internal class to manage the peak frequencies detected.

### Arguments

 * (Optional) (Number) freq: The frequency of the peak.
 * (Optional) (Number) db: The volume of the peak.

### Methods

#### clear()

Resets the peak to default values.

#### (Static) match(peaks, pos)

Finds the best matching peak from a certain point in the array of peaks.

##### Arguments

 * (Array) peaks: The peaks to search from.
 * (Integer) pos: The position to find the match for.

##### Returns

(Peak) The best matching peak.

## Analyzer

A class to analyze pitch from input data.

### Arguments

 * (Optional) (Object) options: Options to override default values.

