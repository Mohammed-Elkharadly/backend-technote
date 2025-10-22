const express = require('express');
const router = express.Router();
const { login, refresh, logout } = require('../controllers/authController');
const expressAsyncHandler = require('express-async-handler');
const { loginLimiter } = require('../middlewares/loginLimiter');

router.route('/').post(loginLimiter, expressAsyncHandler(login));
router.route('/refresh').get(expressAsyncHandler(refresh));
router.route('/logout').post(expressAsyncHandler(logout));

module.exports = router;
