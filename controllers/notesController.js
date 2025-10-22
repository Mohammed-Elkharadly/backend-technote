const Note = require('../models/Note');
const User = require('../models/User');

const getAllNotes = async (req, res) => {
  // lean is for read data only you can't use it for update or delete
  // get all notes from MongoDB
  const notes = await Note.find().lean();

  if (!notes?.length) {
    return res.status(404).json({ message: 'No Notes Found' });
  }

  // Maps over notes to fetch each note's user by ID,
  // adds the username to the note object, and resolves
  // all user queries concurrently
  const notesWithUser = await Promise.all(
    notes.map(async (note) => {
      const user = await User.findById(note.user).lean().exec();
      return { ...note, username: user.username };
    })
  );

  res.status(200).json(notesWithUser);
};

const createNote = async (req, res) => {
  const { user, title, text } = req.body;

  // check if all credentials exist
  if (!user || !title || !text) {
    return res.status(400).json({ message: 'all feilds are required' });
  }

  //check for duplicate
  const duplicate = await Note.findOne({ title }).lean().exec();

  if (duplicate) {
    return res.status(400).json({ message: 'duplicate Note title' });
  }

  // Create and store the new user
  const note = await Note.create({ user, title, text });

  if (note) {
    // Created
    return res.status(201).json({ message: 'New note created' });
  } else {
    return res.status(400).json({ message: 'Invalid note data received' });
  }
};

const updateNote = async (req, res) => {
  const { id, user, title, text, completed } = req.body;

  // confirm data
  if (!id || !user || !title || !text || typeof completed !== 'boolean') {
    return res.status(400).json({ message: 'all fields are required' });
  }

  //confirm note exists to update
  const note = await Note.findById(id).exec();

  if (!note) {
    return res.status(404).json({ message: 'Note does not exist' });
  }

  const duplicate = await Note.findOne({ title }).lean().exec();

  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: 'duplicate note title' });
  }

  // update the credentials
  note.user = user;
  note.title = title;
  note.text = text;
  note.completed = completed;

  // save the note after the update
  const updatedNote = await note.save();

  res.status(200).json(`${updatedNote.title} updated`);
};

const deleteNote = async (req, res) => {
  const { id } = req.body;

  // confirm data
  if (!id) {
    return res.status(400).json({ message: 'Note ID required' });
  }

  // confirm note exsits to delete
  const note = await Note.findById(id).exec();

  if (!note) {
    return res.status(404).json({ message: 'Note not found' });
  }

  const result = await note.deleteOne();

  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Note not found' });
  }

  const reply = `Note '${note.title}' with ID ${note._id} deleted`;

  res.json(reply);
};

module.exports = {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
};
