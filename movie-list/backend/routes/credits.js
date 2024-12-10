// routes/movies.js
const express = require('express');
const router = express.Router();
const { getMovies, getCredits } = require('../controllers/moviesControllerES');

router.get('/:movie_id', getCredits);

module.exports = router;
