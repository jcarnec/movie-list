// controllers/moviesController.js
const Movie = require("../models/Movie");

const getMovies = async (req, res) => {
  try {
    const filter = buildFilter(req.body);
    const countFilter = {...filter}
    delete countFilter.release_date
    console.log('count filter', countFilter)
    const sorting = getSorting(req.body.type);
    const [movies, count] = await Promise.all([
      Movie.find(filter).limit(100).sort(sorting),
      Movie.count(countFilter)
    ]);
    console.log(movies[0])
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json({movies, count});
  } catch (error) {
    const statusCode = error.isClientError ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

const buildFilter = (params) => {
  const filter = {};

  if (params.ids) filter.id = {$in: params.ids}
  if (params.adult) filter.adult = params.adult;
  if (params.budget) filter.budget = { $gte: Number(params.budget) };
  if (params.title) filter.title = { $regex: params.title, $options: "i" };
  if (params.originalLanguages && params.originalLanguages.length > 0)
    filter.original_language = {$in: params.originalLanguages};
  // popularity
  if (params.minPopularity || params.maxPopularity) {
    filter.popularity = {};
    if (params.minPopularity)
      filter.popularity.$gte = Number(params.minPopularity);
    if (params.maxPopularity)
      filter.popularity.$lte = Number(params.maxPopularity);
  }
  if (params.minRuntime || params.maxRuntime) {
    filter.runtime = {};
    if (params.minRuntime)
      filter.runtime.$gte = Number(params.minRuntime);
    if (params.maxRuntime)
      filter.runtime.$lte = Number(params.maxRuntime);
  }
  // vote_average
  if (params.minVoteAverage || params.maxVoteAverage) {
    filter.vote_average = {};
    if (params.minVoteAverage)
      filter.vote_average.$gte = Number(params.minVoteAverage);
    if (params.maxVoteAverage)
      filter.vote_average.$lte = Number(params.maxVoteAverage);
  }
  if (params.minReviewCount || params.maxReviewCount) {
    filter.vote_count = {};
    if (params.minReviewCount)
      filter.vote_count.$gte = Number(params.minReviewCount);
    if (params.maxReviewCount)
      filter.vote_count.$lte = Number(params.maxReviewCount);
  }

  buildReleaseDateFilter(filter, params);
  buildGenresFilter(filter, params.genres);
  buildCreditsFilter(filter, params);

  console.log(filter);

  return filter;
};

const buildReleaseDateFilter = (filter, params) => {
  if (params.type === "new" && params.minYear) {
    filter.release_date = { $gte: new Date(`01/01/${params.minYear}`) };
  } else if (params.type === "append" && params.date) {
    filter.release_date = { $gt: new Date(params.date) };
  } else if (params.type === "prepend" && params.date) {
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
  if (params.person.id) {
    if (params.person.castOrCrew == "cast") {
      filter["credits.cast.id"] = Number(params.person.id);
    } else if (params.person.castOrCrew == "crew") {
      filter["credits.crew.id"] = Number(params.person.id);
    } else if (params.person.castOrCrew == null) {
      filter.$or = [
        { "credits.cast.id": Number(params.person.id) },
        { "credits.crew.id": Number(params.person.id) },
      ];
    }
  } else if (params.person.name) {
    if (params.person.castOrCrew == "cast") {
      filter["credits.cast.name"] = { $regex: params.person.name, $options: "i" };
    } else if (params.castOrCrewQuery == "crew") {
      filter["credits.crew.name"] = { $regex: params.person.name, $options: "i" };
    } else if (params.person.castOrCrewQuery == null) {
      filter.$or = [
        { "credits.cast.name": { $regex: params.person.name, $options: "i" } },
        { "credits.crew.name": { $regex: params.person.name, $options: "i" } },
      ];
    }
  }
};

const getSorting = (type) => {
  return { release_date: type === "prepend" ? -1 : 1 };
};

module.exports = { getMovies };
