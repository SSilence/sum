'use strict'

var schemas = require('./schemas')
var validator = require('is-my-json-valid')

function ValidationError (errors) {
  this.name = 'ValidationError'
  this.errors = errors
}

ValidationError.prototype = Error.prototype

// is-my-json-valid does not provide meaningful error messages for external schemas
// this is a workaround
schemas.cache.properties.beforeRequest = schemas.cacheEntry
schemas.cache.properties.afterRequest = schemas.cacheEntry

schemas.page.properties.pageTimings = schemas.pageTimings

schemas.request.properties.cookies.items = schemas.cookie
schemas.request.properties.headers.items = schemas.record
schemas.request.properties.queryString.items = schemas.record
schemas.request.properties.postData = schemas.postData

schemas.response.properties.cookies.items = schemas.cookie
schemas.response.properties.headers.items = schemas.record
schemas.response.properties.content = schemas.content

schemas.entry.properties.request = schemas.request
schemas.entry.properties.response = schemas.response
schemas.entry.properties.cache = schemas.cache
schemas.entry.properties.timings = schemas.timings

schemas.log.properties.creator = schemas.creator
schemas.log.properties.browser = schemas.creator
schemas.log.properties.pages.items = schemas.page
schemas.log.properties.entries.items = schemas.entry

schemas.har.properties.log = schemas.log

var runner = function (schema, data, cb) {
  var validate = validator(schema, {
    greedy: true,
    verbose: true,
    schemas: schemas
  })

  var valid = false

  if (data !== undefined) {
    // execute is-my-json-valid
    valid = validate(data)
  }

  // callback?
  if (!cb) {
    return validate.errors ? false : true
  } else {
    return cb(validate.errors ? new ValidationError(validate.errors) : null, valid)
  }

  return valid
}

module.exports = function (data, cb) {
  return runner(schemas.har, data, cb)
}

Object.keys(schemas).map(function (name) {
  module.exports[name] = function (data, cb) {
    return runner(schemas[name], data, cb)
  }
})
