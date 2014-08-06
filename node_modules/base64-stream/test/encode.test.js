/*global describe, it*/
var should = require('should');
var base64encode = require('../lib/encode.js');

describe('Base64Encode', function () {
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
		it('should return an instance of Base64Encode whether or not using "new"', function() {
			var stream1 = new base64encode();
			stream1.should.be.an.instanceOf(base64encode);

			var stream2 = base64encode();
			stream2.should.be.an.instanceOf(base64encode);
		});
	});

	describe('input in a single chunk', function () {
		it('should properly encode a string', function () {
			testStream(base64encode(), ['any carnal pleasur'], 'YW55IGNhcm5hbCBwbGVhc3Vy');
		});

		it('should properly encode a Buffer', function () {
			testStream(base64encode(), [new Buffer('any carnal pleasur')], 'YW55IGNhcm5hbCBwbGVhc3Vy');
		});

		it('should properly encode a Buffer and include padding', function () {
			testStream(base64encode(), ['any carnal pleasure.'], 'YW55IGNhcm5hbCBwbGVhc3VyZS4=');
		});
	});

	describe('input in multiple chunks, lengths divisible by 3', function () {
		it('should properly encode a Buffer', function () {
			testStream(base64encode(), [
				new Buffer('any ca'), new Buffer('rnal p'), new Buffer('leasur')
			], 'YW55IGNhcm5hbCBwbGVhc3Vy');
		});

		it('should properly encode a Buffer and include padding', function () {
			testStream(base64encode(), [
				new Buffer('any ca'), new Buffer('rnal p'), new Buffer('leasure.')
			], 'YW55IGNhcm5hbCBwbGVhc3VyZS4=');
		});
	});

	describe('input in multiple chunks, lengths not divisible by 3', function () {
		it('should properly encode a Buffer', function () {
			testStream(base64encode(), [
				new Buffer('any carn'), new Buffer('al pl'), new Buffer('easur')
			], 'YW55IGNhcm5hbCBwbGVhc3Vy');
		});

		it('should properly encode a Buffer and include padding', function () {
			testStream(base64encode(), [
				new Buffer('any carn'), new Buffer('al pl'), new Buffer('easure.')
			], 'YW55IGNhcm5hbCBwbGVhc3VyZS4=');
		});
	});
});
