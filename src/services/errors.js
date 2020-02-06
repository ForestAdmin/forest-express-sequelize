function ErrorHTTP422(message) {
  this.name = 'ErrorHTTP422';
  this.message = message || 'Unprocessable Entity';
  this.status = 422;
  this.stack = (new Error()).stack;
}
ErrorHTTP422.prototype = new Error();

function NoMatchingOperatorError(message) {
  this.name = 'NoMatchingOperatorError';
  this.message = message || 'The given operator is not handled.';
  this.status = 422;
  this.stack = (new Error()).stack;
}
NoMatchingOperatorError.prototype = new Error();

function InvalidParameterError(message) {
  this.name = 'InvalidParameterError';
  this.message = message || 'The given parameter is invalid.';
  this.status = 422;
  this.stack = (new Error()).stack;
}
InvalidParameterError.prototype = new Error();

exports.ErrorHTTP422 = ErrorHTTP422;
exports.NoMatchingOperatorError = NoMatchingOperatorError;
exports.InvalidParameterError = InvalidParameterError;
