// Import the `express-rate-limit` middleware to protect against brute-force attacks.
const rateLimit = require('express-rate-limit');
// Import a custom logger for handling events.
const { logEvents } = require('./logger');

// Configure the rate limiter specifically for login attempts.
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // Time window: 1 minute (60,000 milliseconds).
  max: 10, // Maximum of 5 login attempts per IP address within the window.
  message: {
    message:
      'Too many login attempts from this IP, please try again after a minute',
  },
  // Custom handler to execute when the rate limit is exceeded.
  handler: (req, res, next, options) => {
    // Log the event with details about the excessive requests.
    logEvents(
      `Too many requests:
      ${options.message.message}\t${req.method}\t${req.headers.origin}`,
      'errLog.log'
    );
    // Send the appropriate status code (429 Too Many Requests) and the custom message.
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true, // Adds standard `RateLimit-*` headers to the response.
  legacyHeaders: false, // Disables older `X-RateLimit-*` headers.
});

module.exports = { loginLimiter };
