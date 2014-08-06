# Introduction

While Node.js has built-in support for Base64 data, it does not come with the ability to encode / decode data in a stream.

This library contains a streaming Base64 encoder and a streaming Base64 decoder for use with Node.js. These classes are written using the new Node.js v0.10 [stream interfaces](http://nodejs.org/api/stream.html) and are well covered with unit tests.

# Usage

## Installation

To install base64-stream

    npm install base64-stream
    
## Examples
This example encodes an image and pipes it to stdout.

```javascript
var http = require('http');
var base64 = require('base64-stream');

var img = 'http://farm3.staticflickr.com/2433/3973241798_86ddfa642b_o.jpg';
http.get(img, function(res) {
    if (res.statusCode === 200)
        res.pipe(base64.encode()).pipe(process.stdout);
});
```

This example takes in Base64 encoded data on stdin, decodes it, an pipes it to stdout.
```javascript
var base64 = require('base64-stream');
process.stdin.pipe(base64.decode()).pipe(process.stdout);
```

You may also treat `encode` / `decode` as classes, so the following is also valid:
```javascript
var Base64Decode = require('base64-stream').decode;
var stream = new Base64Decode();
...
```

# Requirements

This module currently requires Node v0.8 or higher. Support for versions prior to v0.10 is made possible by using the [readable-stream](https://github.com/isaacs/readable-stream) module.

# Testing

To run the unit tests

    npm test

# License
MIT
