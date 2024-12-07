const { Client } = require("@elastic/elasticsearch")


const esClient = new Client({ node: "http://elasticsearch:9200" });

const getMovies = async (req, res) => {
  try {
    const filter = buildESFilter(req.body);
    const countFilter = buildESFilter(req.body, true);
    const sorting = getSorting(req.body.type);


    // First, get the accurate count of matching documents
    const countResponse = await esClient.count({
      index: "moviedb.movies", // Adjust to match your Elasticsearch index
      body: {
        query: {
          bool: countFilter,
        },
      },
    });

    const count = countResponse.count;

    // Then, fetch the movie data with pagination
    const searchResponse = await esClient.search({
      index: "moviedb.movies",
      body: {
        query: {
          bool: filter,
        },
        sort: sorting,
        size: 100, // Limit to 100 results
      },
    });

    console.log(JSON.stringify(searchResponse));
    const movies = searchResponse.hits.hits.map((hit) => hit._source);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json({ movies, count });
  } catch (error) {
    console.error("Elasticsearch Query Error:", error);
    res.status(500).json({ message: "Error fetching movies from Elasticsearch." });
  }
};


const buildESFilter = (params, ignoreDate = false) => {
  const must = [];
  const mustNot = [];
  const filter = [];

  // account filter

  if (params.ids) {
    // must be in the list of IDs
    must.push({ terms: { id: params.ids } });
  }

  // Adult filter
  mustNot.push({ term: { adult: true } });

  // Title filter (search by title)
  if (params.title) {
    must.push({ match: { title: params.title } });
  }

  // Budget filter
  if (params.budget) {
    filter.push({ range: { budget: { gte: params.budget } } });
  }

  // Language filter
  if (params.originalLanguages && params.originalLanguages.length > 0) {
    filter.push({ terms: { original_language: params.originalLanguages } });
  }

  // Popularity range
  if (params.minPopularity || params.maxPopularity) {
    const range = {};
    if (params.minPopularity) range.gte = params.minPopularity;
    if (params.maxPopularity) range.lte = params.maxPopularity;
    filter.push({ range: { popularity: range } });
  }

  // Runtime range
  if (params.minRuntime || params.maxRuntime) {
    const range = {};
    if (params.minRuntime) range.gte = params.minRuntime;
    if (params.maxRuntime) range.lte = params.maxRuntime;
    filter.push({ range: { runtime: range } });
  }

  // Vote average range
  if (params.minVoteAverage || params.maxVoteAverage) {
    const range = {};
    if (params.minVoteAverage) range.gte = params.minVoteAverage;
    if (params.maxVoteAverage) range.lte = params.maxVoteAverage;
    filter.push({ range: { vote_average: range } });
  }

  // Vote count range
  if (params.minReviewCount || params.maxReviewCount) {
    const range = {};
    if (params.minReviewCount) range.gte = params.minReviewCount;
    if (params.maxReviewCount) range.lte = params.maxReviewCount;
    filter.push({ range: { vote_count: range } });
  }

  if (!ignoreDate) {
    // Release date filter
    buildReleaseDateFilter(filter, params);
  }

  // Genres filter
  if (params.genres && params.genres.length > 0) {
    // must.push({ terms: { "genres.name.keyword": params.genres } });
    // we want an AND operator or the genres
    must.push({
      bool: {
        must: params.genres.map((genre) => ({
          term: { "genres.name.keyword": genre },
        }))
      }
    });
  }

  // Credits filter (cast/crew filtering)
  buildCreditsFilter(must, params);

  return { must, must_not: mustNot, filter };
};

const buildReleaseDateFilter = (filter, params) => {
  if (params.type === "new" && params.minYear) {
    filter.push({
      range: { release_date: { gte: `${params.minYear}-01-01` } },
    });
  } else if (params.type === "append" && params.date) {
    filter.push({
      range: { release_date: { gt: params.date } },
    });
  } else if (params.type === "prepend" && params.date) {
    filter.push({
      range: { release_date: { lt: params.date } },
    });
  }
};

const buildCreditsFilter = (must, params) => {
  if (params.person?.id) {
    const castOrCrew = params.person.castOrCrew;
    if (castOrCrew === "cast") {
      must.push({ term: { "credits.cast.id": params.person.id } });
    } else if (castOrCrew === "crew") {
      must.push({ term: { "credits.crew.id": params.person.id } });
    } else {
      must.push({
        bool: {
          should: [
            { term: { "credits.cast.id": params.person.id } },
            { term: { "credits.crew.id": params.person.id } },
          ],
        },
      });
    }
  } else if (params.person?.name) {
    const castOrCrew = params.person.castOrCrew;
    if (castOrCrew === "cast") {
      must.push({ match: { "credits.cast.name": params.person.name } });
    } else if (castOrCrew === "crew") {
      must.push({ match: { "credits.crew.name": params.person.name } });
    } else {
      must.push({
        bool: {
          should: [
            { match: { "credits.cast.name": params.person.name } },
            { match: { "credits.crew.name": params.person.name } },
          ],
        },
      });
    }
  }
};

const getSorting = (type) => {
  return [{ release_date: { order: type === "prepend" ? "desc" : "asc" } }];
};

module.exports = { getMovies };
