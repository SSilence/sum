module.exports = Base64Encode;

var Transform = require('stream').Transform || require('readable-stream').Transform;
var util = require('util');

util.inherits(Base64Encode, Transform);

/**
 * Transforms a string/Buffer stream of binary data to a stream of base64 encoded.
 * @returns {Base64Encode}
 * @constructor
 */
function Base64Encode() {
	if ( !(this instanceof Base64Encode) )
		return new Base64Encode();

	Transform.call(this);

	// Any extra chars from the last chunk
	this.extra = null;
}

/**
 * Transforms a string/Buffer stream of binary data to a stream of base64 encoded.
 * @param {Buffer} chunk
 * @param {string} encoding - unused since chunk is always a Buffer
 * @param cb
 * @private
 */
Base64Encode.prototype._transform = function (chunk, encoding, cb) {
	// Add any previous extra bytes to the chunk
	if ( this.extra ) {
		chunk = Buffer.concat([this.extra, chunk]);
		this.extra = null;
	}

	// 3 bytes are represented by 4 characters, so we can only encode in groups of 3 bytes
	var remaining = chunk.length % 3;

	if ( remaining !== 0 ) {
		// Store the extra bytes for later
		this.extra = chunk.slice(chunk.length - remaining);
		chunk = chunk.slice(0, chunk.length - remaining);
	}

	// Convert chunk to a base 64 string
	chunk = chunk.toString('base64');

	this.push(chunk);
	cb();
};

/**
 * Emits 0 or 4 extra characters of base64 data.
 * @param cb
 * @private
 */
Base64Encode.prototype._flush = function (cb) {
	if ( this.extra )
		this.push(this.extra.toString('base64'));

	cb();
};
