const express = require('express');
const router = express.Router();
const expressAsyncHandler = require('express-async-handler');
const {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
} = require('../controllers/notesController');

const verifyJWT = require('../middlewares/verifyJWT');

// Apply the verifyJWT middleware to all routes in this router
router.use(verifyJWT);

router
  .route('/')
  .get(expressAsyncHandler(getAllNotes))
  .post(expressAsyncHandler(createNote))
  .patch(expressAsyncHandler(updateNote))
  .delete(expressAsyncHandler(deleteNote));

module.exports = router;
