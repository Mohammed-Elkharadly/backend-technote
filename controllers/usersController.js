const User = require('../models/User');
const Note = require('../models/Note');
const bcrypt = require('bcrypt');

// Get all users
// route GET /users
// access Private
const getAllUsers = async (req, res) => {
  // lean() - tells Mongoose to skip instantiating a full Mongoose document
  //  and just give us a plain JavaScript object. This is more efficient when
  //  we only need to read data and not use any of the document methods.
  // select('-password') - excludes the password field from the returned documents for security reasons.
  const users = await User.find().select('-password').lean();
  if (!users?.length) {
    return res.status(400).json({ message: 'No users found' });
  }
  res.status(200).json(users);
};

// Create new user
// route POST /users
// access Private
const createUser = async (req, res) => {
  const { username, password, roles } = req.body;
  // Confirm data
  if (!username || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  // Check if user exists
  const userExists = await User.findOne({ username })
    // Use collation to make the search case-insensitive
    .collation({ locale: 'en', strength: 2 })
    // .lean() to get a plain JavaScript object
    .lean()
    // .exec() to execute the query and return a promise
    .exec();
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user object
  const userObject =
    // If roles is not provided or is an empty array, create user without roles
    !Array.isArray(roles) || !roles.length
      ? { username, password: hashedPassword }
      : { username, password: hashedPassword, roles };

  // Create user
  const user = await User.create(userObject);
  if (user) {
    res
      .status(201)
      .json({ success: true, message: `New user ${username} created` });
  } else {
    res.status(400).json({ message: 'Invalid user data received' });
  }
};

// Update user
// route PATCH /users/:id
// access Private
const updateUser = async (req, res) => {
  const { id, username, password, roles, active } = req.body;
  // Confirm data
  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== 'boolean'
  ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // exec() - executes the query and returns a promise
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  // Check for duplicate
  const duplicate = await User.findOne({ username })
    // Use collation to make the search case-insensitive
    .collation({ locale: 'en', strength: 2 })
    // .lean() to get a plain JavaScript object
    .lean()
    // .exec() to execute the query and return a promise
    .exec();
  // Allow updates to the original user
  if (duplicate) {
    return res.status(409).json({ message: 'Duplicate username' });
  }

  // set the new values to the current user object for update
  user.username = username; // username comes from req.body
  user.roles = roles; // roles comes from req.body
  user.active = active; // active comes from req.body

  // Only update the password if it was provided
  if (password) {
    // Hash password
    user.password = await bcrypt.hash(password, 10);
  }

  // Save the updated user object to the database
  const updatedUser = await user.save();

  res.status(200).json({ message: `${updatedUser.username} updated` });
};

// Delete user
// route DELETE /users/:id
// access Private
const deleteUser = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: 'User ID required' });
  }
  // Check if user has notes
  const notes = await Note.findOne({ user: id }).lean().exec();

  if (notes?.length) {
    return res.status(400).json({ message: 'User has assigned notes' });
  }

  const user = await User.findById(id).exec();

  // Check if user exists
  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  // delete user
  await user.deleteOne();

  res
    .status(200)
    .json({ success: true, message: `User ${user.username} deleted` });
};

module.exports = { getAllUsers, createUser, updateUser, deleteUser };
