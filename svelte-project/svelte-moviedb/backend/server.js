const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let QUERY_TIMEOUT = 1147483647
let POOL_SIZE = 5
let REQUESTS_PER_TICK = 39

const opts = {
  server: {
    socketOptions: {
      keepAlive: QUERY_TIMEOUT,
      connectTimeoutMS: QUERY_TIMEOUT,
    },
    poolSize: POOL_SIZE,
    // utf-8 support
    autoIndex: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};

mongoose.connect("mongodb://admin:mypass@localhost/moviedb?authSource=admin", opts);

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
  { collection: "movies" }
);

const Movie = mongoose.model("Movie", movieSchema);

app.post("/movies", async (req, res) => {
  try {

    const filter = {};

    let firstDate = new Date('01/01/1900');

    if (req.body.firstDate) {
      firstDate = new Date(req.body.firstDate);
    }

    if (req.body.adult) filter.adult = req.body.adult;
    if (req.body.budget) filter.budget = { $gte: Number(req.body.budget) };
    if (req.body.original_language && req.body.original_language != "all")
      filter.original_language = req.body.original_language;
    if (req.body.popularity)
      filter.popularity = { $gte: Number(req.body.popularity) };
    if (req.body.vote_average)
      filter.vote_average = { $gte: Number(req.body.vote_average) };
    if (req.body.minReviewCount)
      filter.vote_count = { $gte: Number(req.body.minReviewCount) };
    if (req.body.maxReviewCount)
      filter.vote_count = { $lte: Number(req.body.maxReviewCount) };

    filter.release_date === undefined ? (filter.release_date = {}) : null;
    if (!req.body.minYear || new Date("01/01/" + req.body.minYear) < firstDate) {
      filter.release_date = { $gte: firstDate };
    } else {
      filter.release_date["$gte"] = new Date("01/01/" + req.body.minYear);
    } 

    if (req.body.maxYear)
      filter.release_date === undefined ? (filter.release_date = {}) : null;
      filter.release_date["$lte"] = new Date("12/31/" + req.body.maxYear);
    if (req.body.genres && req.body.genres.length > 0) {
      let elemMatch = req.body.genres.map((genre) => {
        return { $elemMatch: { name: genre } };
      })
      filter.genres = {
        $all: elemMatch
      };
    }

    if (req.body.crewId) {
      filter["credits.crew.id"] = Number(req.body.crewId);
    }

    if (req.body.castId) {
      filter["credits.cast.id"] = Number(req.body.castId);
    }



    const movies = await Movie.find(filter).limit(75).sort({ release_date: 1 });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
