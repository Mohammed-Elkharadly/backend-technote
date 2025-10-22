const express = require('express');
const router = express.Router();
const expressAsyncHandler = require('express-async-handler');
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/usersController');

const verifyJWT = require('../middlewares/verifyJWT');

// Apply the verifyJWT middleware to all routes in this router
router.use(verifyJWT);

router
  .route('/')
  .get(expressAsyncHandler(getAllUsers))
  .post(expressAsyncHandler(createUser))
  .patch(expressAsyncHandler(updateUser))
  .delete(expressAsyncHandler(deleteUser));

module.exports = router;
