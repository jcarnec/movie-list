// models/Movie.js
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
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
    credits: mongoose.Schema.Types.Mixed,
    reviews: [mongoose.Schema.Types.Mixed],
    videos: [mongoose.Schema.Types.Mixed],
    similar: [mongoose.Schema.Types.Mixed],
    images: [mongoose.Schema.Types.Mixed],
    keywords: [mongoose.Schema.Types.Mixed],
    spoken_languages: [mongoose.Schema.Types.Mixed],
    production_countries: [mongoose.Schema.Types.Mixed],
    production_companies: [mongoose.Schema.Types.Mixed],
    genres: [mongoose.Schema.Types.Mixed],
  },
  { collection: 'movies' }
);

module.exports = mongoose.model('Movie', movieSchema);
