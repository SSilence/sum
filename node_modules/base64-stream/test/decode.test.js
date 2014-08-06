/*global describe, it*/
var should = require('should');
var base64decode = require('../lib/decode.js');

describe('Base64Decode', function () {
	/**
	 * This function emits an array of string chunks to the stream, and then compares the output to a given value.
	 * @param stream
	 * @param inputs
	 * @param output
	 */
	function testStream(stream, inputs, output) {
		for ( var i = 0; i < inputs.length; i++ )
			stream.write(inputs[i]);

		stream.end();

		var result = stream.read();
		result.should.be.an.instanceOf(Buffer);
		result.toString().should.equal(output);
	}

	describe('constructor', function() {
		it('should return an instance of Base64Decode whether or not using "new"', function() {
			var stream1 = new base64decode();
			stream1.should.be.an.instanceOf(base64decode);

			var stream2 = base64decode();
			stream2.should.be.an.instanceOf(base64decode);
		});
	});

	describe('input in a single chunk', function () {
		it('should properly decode a Buffer', function () {
			testStream(base64decode(), [new Buffer('YW55IGNhcm5hbCBwbGVhc3VyZS4=')], 'any carnal pleasure.');
		});

		it('should properly decode a string', function () {
			testStream(base64decode(), ['YW55IGNhcm5hbCBwbGVhc3VyZS4='], 'any carnal pleasure.');
		});

		it('should properly decode string containing newlines', function () {
			testStream(base64decode(), ['YW55I\nGNhcm\n5hbCB\nwbGVh\nc3VyZ\nS4='], 'any carnal pleasure.');
		});

		it('should properly decode a string without padding', function () {
			testStream(base64decode(), ['YW55IGNhcm5hbCBwbGVhc3VyZS4'], 'any carnal pleasure.');
		});
	});

	describe('input in multiple chunks, lengths divisible by 4', function () {
		it('should properly decode a string', function () {
			testStream(base64decode(), ['YW55IGNhcm5h', 'bCBwbGVhc3Vy', 'ZS4='], 'any carnal pleasure.');
		});

		it('should properly decode string containing newlines', function () {
			testStream(base64decode(), ['YW55IGNhcm5h\n', 'bCBwbGVhc3Vy\n', 'ZS4=\n'], 'any carnal pleasure.');
		});

		it('should properly decode a string without padding', function () {
			testStream(base64decode(), ['YW55IGNhcm5h', 'bCBwbGVhc3Vy', 'ZS4'], 'any carnal pleasure.');
		});
	});

	describe('input in multiple chunks, lengths not divisible by 4', function () {
		it('should properly decode a string', function () {
			testStream(base64decode(), ['YW55I', 'GNhcm5h', 'bCBwbGVhc3VyZ', 'S4='], 'any carnal pleasure.');
			testStream(base64decode(), ['YW55I', 'GNhcm5h', 'bCBwbGVhc3VyZS4', '='], 'any carnal pleasure.');
		});

		it('should properly decode string containing newlines', function () {
			testStream(base64decode(), ['YW55I\n', 'GNhcm5h\n', 'bCBwbGVhc3VyZ\n', 'S4=\n'], 'any carnal pleasure.');
		});

		it('should properly decode a string without padding', function () {
			testStream(base64decode(), ['YW55I', 'GNhcm5h', 'bCBwbGVhc3VyZ', 'S4'], 'any carnal pleasure.');
		});
	});
});
