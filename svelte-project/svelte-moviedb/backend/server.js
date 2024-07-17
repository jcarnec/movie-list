const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());

mongoose.connect('mongodb://admin:mypass@localhost/moviedb?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const movieSchema = new mongoose.Schema({
  adult: String,
  backdrop_path: String,
  belongs_to_collection: mongoose.Schema.Types.Mixed,
  budget: Number,
  homepage: String,
  id: Number,
  imdb_id: String,
  original_language: String,
  original_title: String,
  overview: String,
  popularity: Number,
  poster_path: String,
  release_date: Date,
  revenue: Number,
  runtime: Number,
  status: String,
  tagline: String,
  title: String,
  video: Boolean,
  vote_average: Number,
  vote_count: Number,
  reviews: [mongoose.Schema.Types.Mixed],
  videos: [mongoose.Schema.Types.Mixed],
  similar: [mongoose.Schema.Types.Mixed],
  images: [mongoose.Schema.Types.Mixed],
  keywords: [mongoose.Schema.Types.Mixed],
  spoken_languages: [mongoose.Schema.Types.Mixed],
  production_countries: [mongoose.Schema.Types.Mixed],
  production_companies: [mongoose.Schema.Types.Mixed],
  genres: [mongoose.Schema.Types.Mixed],
}, { collection: 'movies' });

const Movie = mongoose.model('Movie', movieSchema);

app.get('/movies', async (req, res) => {
  try {
    const filter = {};

    // Build the filter object based on query parameters
    if (req.query.adult) filter.adult = req.query.adult;
    if (req.query.budget) filter.budget = { $gte: Number(req.query.budget) };
    if (req.query.original_language) filter.original_language = req.query.original_language;
    if (req.query.popularity) filter.popularity = { $gte: Number(req.query.popularity) };
    if (req.query.release_date) filter.release_date = { $gte: new Date(req.query.release_date) };
    if (req.query.vote_average) filter.vote_average = { $gte: Number(req.query.vote_average) };

    const movies = await Movie.find(filter).sort({ release_date: 1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
