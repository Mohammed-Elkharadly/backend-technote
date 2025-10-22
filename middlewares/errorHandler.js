const { logEvents } = require('./logger');

const errorHandler = (err, req, res, next) => {
  logEvents(
    `${err.name}\t${err.message}\t${req.method}\t${req.url}
    ${req.headers.origin}`,
    'errLog.log'
  );
  console.log(err.stack);

  const status = res.statusCode ? res.statusCode : 500; // Set status code to 500 if not set
  res.status(status).json({ message: err.message, isError: true });
};

module.exports = errorHandler;

// Note: This middleware currently only logs the error details to a log file.
// You might want to expand it to send a response to the client or handle different types of errors.
