const allowedOrigins = require('./allowedOrigins');

const corsOptions = {
  // origin parameter => http://localhost:5000
  // callback => function to call once we have determined if the incoming origin is allowed or not
  // callback(null means no error, true means allow access)
  origin: (origin, callback) => {
    // -1 means not found in the array
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      // You call this to tell cors whether to allow or reject.
      callback(null, true);
    } else {
      // If not in the allowed list, return an error
      callback(new Error('Not allowed by CORS'));
    }
  },
  // Allow the browser to include cookies,
  // authorization headers, or TLS client
  // certificates in cross-origin requests
  credentials: true,
  // makes OPTIONS preflight return 200 instead of 204
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

module.exports = corsOptions;
