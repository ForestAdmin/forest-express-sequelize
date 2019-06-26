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
  this.stack = (new Error()).stack;
}
ErrorHTTP422.prototype = new Error();

exports.ErrorHTTP422 = ErrorHTTP422;
exports.NoMatchingOperatorError = NoMatchingOperatorError;
