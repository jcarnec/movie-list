const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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

app.post('/movies', async (req, res) => {
  try {
    const filter = {};

    // access body of the request
    
    // a
    // Build the filter object based on body parameters
    if (req.body.adult) filter.adult = req.body.adult;
    if (req.body.budget) filter.budget = { $gte: Number(req.body.budget) };
    if (req.body.original_language) filter.original_language = req.body.original_language;
    if (req.body.popularity) filter.popularity = { $gte: Number(req.body.popularity) };
    if (req.body.release_date) filter.release_date = { $gte: new Date(req.body.release_date) };
    if (req.body.vote_average) filter.vote_average = { $gte: Number(req.body.vote_average) };

    const movies = await Movie.find(filter).sort({ release_date: 1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
