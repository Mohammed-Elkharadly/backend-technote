require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const path = require('path');
const { logger, logEvents } = require('./middlewares/logger');
const rootRoutes = require('./routes/root');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const noteRoutes = require('./routes/noteRoutes');
const errorHandler = require('./middlewares/errorHandler');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const connectDB = require('./config/dbConnection');

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI);

app.use(cors(corsOptions)); // Middleware for enabling CORS
app.use(cookieParser()); // Middleware for parsing cookies
app.use(logger); // Custom middleware for logging
app.use(express.json()); // Middleware for parsing JSON bodies

app.use('/', rootRoutes); // Main router for handling routes
app.use('/auth', authRoutes); // auth-related routes
app.use('/users', userRoutes); // User-related routes
app.use('/notes', noteRoutes); // Note-related routes

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '..', 'front', 'build'))); // Serve static files from React app

// Catches all requests that weren’t handled by any route (the “catch-all” handler).
// app.all('/{*any}', (req, res) => {
// checks what format (HTML/JSON/text) the client prefers
//   res.status(404);
// Sends Accept: text/html → server responds with the 404.html page.
//   if (req.accepts('html')) {
//     res.sendFile(path.join(__dirname, 'views', '404.html'));
// Sends Accept: application/json → server responds with a JSON object.
//   } else if (req.accepts('json')) {
//     res.json({ error: '404 Not Found' });
//   } else {
// Default to plain-text. Sends Accept: text/plain or any other format → server responds with a string.
//     res.type('txt').send('404 Not Found');
//   }
// });

// Handles any requests that don't match the ones above and serves the React app's index.html
app.all('/{*any}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front', 'build', 'index.html'));
});

app.use(errorHandler); // Custom middleware for error handling

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  // Start the server only after successful database connection
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
});

mongoose.connection.on('error', (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    'mongoErrLog.log'
  );
});
