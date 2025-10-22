// Import the jsonwebtoken library for token verification.
const jwt = require('jsonwebtoken');

// Middleware to verify the JSON Web Token (JWT) from the request headers.
const verifyJWT = (req, res, next) => {
  // Check for the 'Authorization' header, supporting both 'authorization' and 'Authorization'.
  const authHeader = req.headers.authorization || req.headers.Authorization;

  // If the header is missing or does not start with 'Bearer ', deny access.
  if (!authHeader?.startsWith('Bearer ')) {
    // Send a 401 Unauthorized status.
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Extract the token by splitting the header string (e.g., 'Bearer <token>').
  const token = authHeader.split(' ')[1];

  // Verify the token using the secret key from environment variables.
  // The callback function handles the result of the verification.
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    // If there's an error during verification (e.g., signature invalid, token expired), deny access.
    if (err) {
      // Send a 403 Forbidden status. This is the code that triggers the client-side refresh logic.
      return res.status(403).json({ message: 'Forbidden' });
    }

    // If verification is successful, attach the user info from the token's payload to the request object.
    // This makes user data available to subsequent middleware and route handlers.
    req.user = decoded.userInfo.username;
    req.roles = decoded.userInfo.roles;

    // Call `next()` to pass control to the next middleware in the stack.
    next();
  });
};

module.exports = verifyJWT;
