'use strict';
function ErrorHTTP422(message) {
  this.name = 'ErrorHTTP422';
  this.message = message || 'Unprocessable Entity';
  this.status = 422;
  this.stack = (new Error()).stack;
}
ErrorHTTP422.prototype = new Error();

exports.ErrorHTTP422 = ErrorHTTP422;
