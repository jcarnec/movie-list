// routes/movies.js
const express = require('express');
const router = express.Router();
const { getMovies, getCredits } = require('../controllers/moviesControllerES');

router.post('/', getMovies);

module.exports = router;
