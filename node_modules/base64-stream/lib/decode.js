module.exports = Base64Decode;

var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');
var newline = /(\r\n|\n|\r)/gm;

util.inherits(Base64Decode, Transform);

/**
 * Decodes a Base64 data stream, coming in as a string or Buffer of UTF-8 text, into binary Buffers.
 * @returns {Base64Decode}
 * @constructor
 */
function Base64Decode() {
	if ( !(this instanceof Base64Decode) )
		return new Base64Decode();

	Transform.call(this, {
		// The input is converted to strings, so no need to transform input strings to buffers
		decodeStrings : false
	});

	// Any extra chars from the last chunk
	this.extra = '';
}

/**
 * Decodes a Base64 data stream, coming in as a string or Buffer of UTF-8 text, into binary Buffers.
 * @param {Buffer|string} chunk
 * @param encoding
 * @param cb
 * @private
 */
Base64Decode.prototype._transform = function (chunk, encoding, cb) {
	// Convert chunk to a string
	chunk = '' + chunk;

	// Add previous extra and remove any newline characters
	chunk = this.extra + chunk.replace(newline, '');

	// 4 characters represent 3 bytes, so we can only decode in groups of 4 chars
	var remaining = chunk.length % 4;

	// Store the extra chars for later
	this.extra = chunk.slice(chunk.length - remaining);
	chunk = chunk.slice(0, chunk.length - remaining);

	// Create the new buffer and push
	var buf = new Buffer(chunk, 'base64');
	this.push(buf);
	cb();
};

/**
 * Emits 1, 2, or 3 extra characters of base64 data.
 * @param cb
 * @private
 */
Base64Decode.prototype._flush = function (cb) {
	if ( this.extra.length )
		this.push(new Buffer(this.extra, 'base64'));

	cb();
};
