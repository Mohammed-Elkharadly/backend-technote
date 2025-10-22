// Import necessary modules, including the express-async-handler.
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// @desc Login: Authenticates a user and issues new access and refresh tokens.
// @route POST /auth
// @access Public
const login = async (req, res) => {
  const { username, password } = req.body;

  // Input validation: Check if both username and password are provided.
  if (!username || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Find the user by username in the database.
  const user = await User.findOne({ username }).exec();

  // Check if the user exists and is active.
  if (!user || !user.active) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Compare the provided password with the hashed password stored in the database.
  const match = await bcrypt.compare(password, user.password);

  // If the passwords do not match, return an unauthorized error.
  if (!match) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // JWT Creation - Access Token
  // The access token payload contains user information like username and roles.
  const accessToken = jwt.sign(
    {
      userInfo: {
        username: user.username,
        roles: user.roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' } // Use a short expiry time for access tokens.
  );

  // JWT Creation - Refresh Token
  // The refresh token is longer-lived and used to obtain new access tokens.
  const refreshToken = jwt.sign(
    { username: user.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' } // Use a longer expiry for refresh tokens.
  );

  // Set the refresh token as a secure, HttpOnly cookie.
  res.cookie('jwt', refreshToken, {
    // `httpOnly`: A boolean flag that prevents client-side JavaScript from accessing the cookie.
    // This is a critical security measure to mitigate Cross-Site Scripting (XSS) attacks,
    // where an attacker could otherwise steal the token by injecting malicious scripts.
    httpOnly: true,

    // `secure`: A boolean flag that ensures the cookie is only sent over encrypted HTTPS connections.
    // This prevents the cookie from being intercepted in transit via man-in-the-middle attacks.
    // In your setup, it is correctly set based on the environment.
    secure: true, 

    // `sameSite`: Controls how cookies are sent with cross-site requests.
    // 'None': Allows the cookie to be sent with cross-site requests.
    // This is necessary when your front-end (e.g., `localhost:3000`) and back-end (e.g., `localhost:5000`)
    // are on different domains or ports.
    // IMPORTANT: The `sameSite: 'None'` flag requires `secure: true` to be set by modern browsers.
    sameSite: 'None',

    // `maxAge`: Sets the maximum age of the cookie in milliseconds.
    // This determines the cookie's lifespan and effectively the duration of the refresh token.
    // This value should match the lifespan of the refresh token set in the JWT payload.
    maxAge: 7 * 24 * 60 * 60 * 1000, // (7 days in milliseconds)
  });

  // Send the short-lived access token back in the JSON response.
  res.json({ accessToken });
};

// @desc Refresh: Issues a new access token using a valid refresh token.
// @route GET /auth/refresh
// @access Public
const refresh = async (req, res) => {
  const cookies = req.cookies;

  // Check if a JWT cookie exists.
  if (!cookies?.jwt) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const refreshToken = cookies.jwt;

  // Verify the refresh token's signature and expiration using a promise-based method.
  const decoded = await new Promise((resolve, reject) => {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      }
    );
  });

  // Find the user associated with the decoded username.
  const user = await User.findOne({ username: decoded.username }).exec();

  // If the user doesn't exist, they are unauthorized.
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Create a new access token with updated user information.
  const accessToken = jwt.sign(
    {
      userInfo: {
        username: user.username,
        roles: user.roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  // Implement Refresh Token Rotation for enhanced security.
  const newRefreshToken = jwt.sign(
    { username: user.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  // Set the new refresh token cookie, invalidating the old one.
  res.cookie('jwt', newRefreshToken, {
    httpOnly: true,
    secure: true, // Set to true in production with HTTPS and localhost is treated as secure anyway.
    sameSite: 'None',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Respond with the newly created access token.
  res.json({ accessToken });
};

// @desc Logout: Clears the secure cookie, ending the user's session.
// @route POST /auth/logout
// @access Public
const logout = async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    return res.status(200).json({ message: 'No cookie to clear' });
  }

  // Clear the cookie named 'jwt'.
  res.clearCookie('jwt', {
    httpOnly: true,
    sameSite: 'None',
    // Only set the 'secure' flag in production. Browsers treat localhost as secure anyway.
    secure: true,
  });
  res.json({ message: 'Cookie cleared' });
};

module.exports = { login, refresh, logout };
