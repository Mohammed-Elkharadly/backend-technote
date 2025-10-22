const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the User model
      required: true,
      ref: 'User', // Reference to the User model
    },
    title: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

noteSchema.plugin(AutoIncrement, {
  inc_field: 'ticket', // The field to auto-increment
  id: 'ticketNums', // Sequence name in counter collection
  start_seq: 500, // Starting value of the sequence
});

module.exports = mongoose.model('Note', noteSchema);
