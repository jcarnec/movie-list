// controllers/moviesController.js
const Movie = require('../models/Movie');
const { validateMinYear } = require('../utils/validation');

const getMovies = async (req, res) => {
  try {
    const filter = buildFilter(req.body);
    const sorting = getSorting(req.body.type);
    const movies = await Movie.find(filter).limit(75).sort(sorting);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(movies);
  } catch (error) {
    const statusCode = error.isClientError ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

const buildFilter = (params) => {
  const filter = {};

  // Validate minYear
  validateMinYear(params.minYear);

  if (params.adult) filter.adult = params.adult;
  if (params.budget) filter.budget = { $gte: Number(params.budget) };
  if (params.original_language && params.original_language !== 'all')
    filter.original_language = params.original_language;
  if (params.popularity) filter.popularity = { $gte: Number(params.popularity) };
  if (params.vote_average) filter.vote_average = { $gte: Number(params.vote_average) };
  if (params.minReviewCount || params.maxReviewCount) {
    filter.vote_count = {};
    if (params.minReviewCount) filter.vote_count.$gte = Number(params.minReviewCount);
    if (params.maxReviewCount) filter.vote_count.$lte = Number(params.maxReviewCount);
  }

  buildReleaseDateFilter(filter, params);
  buildGenresFilter(filter, params.genres);
  buildCreditsFilter(filter, params);

  return filter;
};

const buildReleaseDateFilter = (filter, params) => {
  if (params.type === 'new' && params.minYear) {
    filter.release_date = { $gte: new Date(`01/01/${params.minYear}`) };
  } else if (params.type === 'append' && params.date) {
    filter.release_date = { $gt: new Date(params.date) };
  } else if (params.type === 'prepend' && params.date) {
    filter.release_date = { $lt: new Date(params.date) };
  }
};

const buildGenresFilter = (filter, genres) => {
  if (genres && genres.length > 0) {
    filter.genres = {
      $all: genres.map((genre) => ({
        $elemMatch: { name: genre },
      })),
    };
  }
};

const buildCreditsFilter = (filter, params) => {
  if (params.crewId) filter['credits.crew.id'] = Number(params.crewId);
  if (params.castId) filter['credits.cast.id'] = Number(params.castId);
};

const getSorting = (type) => {
  return { release_date: type === 'prepend' ? -1 : 1 };
};

module.exports = { getMovies };
