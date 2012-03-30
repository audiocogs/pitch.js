var fs = require('fs');

function WavReader (path) {
	this.buffer = fs.readFileSync(path);

	this.readHeaders();
	this.seekToData();

	this.dataOffset = this.offset + 8;
	this.dataLength = this.getChunkInfo().length;
	this.dataEnd = this.dataOffset + this.dataLength;
}

WavReader.prototype = {
	buffer: null,

	sampleRate: 0,
	channelCount: 0,
	bytesPerSample: 0,
	dataLength: 0,

	offset: 4*9,
	dataStart: 0,
	dataEnd: 0,
	dataOffset: 0,

	readHeaders: function () {
		
		var	buffer			= this.buffer,
			sGroupID1		= buffer.toString('utf8', 4*0, 4),
			dwFileLength		= buffer.readUInt32LE(4*1),
			sRiffType		= buffer.toString('utf8', 4*2, 4*3),
			sGroupID2		= buffer.toString('utf8', 4*3, 4*4),
			dwChunkSize1		= buffer.readUInt32LE(4*4),
			wFormatTag		= buffer.readUInt16LE(4*5),
			wChannels		= buffer.readUInt16LE(4*5 + 2),
			dwSamplesPerSec		= buffer.readUInt32LE(4*6),
			dwAvgBytesPerSec	= buffer.readUInt32LE(4*7),
			wBlockAlign		= buffer.readUInt16LE(4*8),
			sampleSize		= wBlockAlign / wChannels,
			dwBitsPerSample		= buffer.readUInt16LE(4*8+2);

		this.channelCount		= wChannels;
		this.bytesPerSample		= wBlockAlign / wChannels;
		this.sampleRate			= dwAvgBytesPerSec / wBlockAlign;
	},

	seekToData: function () {
		var info;
		while (info = this.getChunkInfo()) {
			if (info.name === 'data') return;
			this.offset += info.length;
		}

		throw Error("Out of bounds");
	},

	getChunkInfo: function () {
		return this.offset < this.buffer.length ? {
			name: this.buffer.toString('utf8', this.offset, this.offset + 4),
			length: this.buffer.readUInt32LE(this.offset + 4)
		} : null;
	},

	readBuffer: function (length) {
		length = Math.min(length, (this.dataEnd - this.dataOffset) / this.bytesPerSample);

		if (!length) return null;

		var buffer = new Float32Array(length);

		var inbuffer = this.buffer.slice(this.dataOffset, this.dataOffset + length * this.bytesPerSample);

		this.dataOffset += length * this.bytesPerSample;

		this['readBuffer' + this.bytesPerSample](inbuffer, buffer);

		return buffer;
	},

	readBuffer1: function (inbuffer, outbuffer) {
		for (var i=0; i<outbuffer.length; i++) {
			outbuffer[i] = (inbuffer.readUInt8LE(i) - 127.5) / 127.5;
		}
	},

	readBuffer2: function (inbuffer, outbuffer) {
		for (var i=0; i<outbuffer.length; i++) {
			outbuffer[i] = inbuffer.readInt16LE(i * 2) / 0x8000;
		}
	},

	readBuffer4: function (inbuffer, outbuffer) {
		for (var i=0; i<outbuffer.length; i++) {
			outbuffer[i] = inbuffer.readFloatLE(i * 4);
		}
	},

	readBuffer8: function (inbuffer, outbuffer) {
		for (var i=0; i<outbuffer.length; i++) {
			outbuffer[i] = inbuffer.readDoubleLE(i * 8);
		}
	}
};

module.exports = WavReader;
