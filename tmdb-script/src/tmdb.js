
const mongoose = require("mongoose");
const readline = require("readline");
const EOL = require("os").EOL;
const Logger = require("./Logger");
const TmdbApi = require("./TmdbApi");
const { MovieSchema, PersonSchema } = require("./schemas");
const {
  QUERY_TIMEOUT,
  POOL_SIZE,
  AFFIRMATIVE_ANSWER,
} = require("./Constants");

// Set up Mongoose
mongoose.Promise = global.Promise;
const config = {
  "tmdbApiKey": "e316601ca43413563469752bc6096a5b",
  "dbServer": "mongodb://admin:mypass@localhost/moviedb?authSource=admin",
  mainMoviesCollection: "movies",
  mainPeopleCollection: "people",
};
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
mongoose.connect(config.dbServer, opts);

// Initialize models
const Movie = mongoose.model(config.mainMoviesCollection, MovieSchema);
const Person = mongoose.model(config.mainPeopleCollection, PersonSchema);

const tmdbApi = new TmdbApi(config.tmdbApiKey);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let requestCounter = 0; // Counter to track number of requests

async function fetchLatestIds() {
  try {
    const localLatest = await Movie.find({}, { id: 1 }).sort({ id: -1 }).limit(1).exec();
    await checkRateLimit(); // Check rate limit before making an API call
    const tmdbLatestId = await tmdbApi.getLatestId();
    const localLatestId = localLatest.length ? localLatest[0].id : 0;
    return { localLatestId, tmdbLatestId };
  } catch (error) {
    Logger.error("Error fetching latest IDs:", error);
    process.exit(1);
  }
}

async function downloadPersonData(personId) {
  try {
    await checkRateLimit(); // Check rate limit before making an API call
    const person = await tmdbApi.getPersonDetails(personId);
    if (person && person.id) {
      await Person.updateOne({ id: person.id }, person, { upsert: true });
      Logger.info(`Inserted/Updated person with ID ${person.id} into DB.`);
    }
  } catch (error) {
    Logger.error(`Error processing person ID ${personId}:`, error);
  }
}

async function downloadPeopleFromCredits(credits) {
  const peopleIds = new Set();

  // Extract people IDs from cast and crew
  if (credits.cast) {
    credits.cast.forEach((person) => peopleIds.add(person.id));
  }
  if (credits.crew) {
    credits.crew.forEach((person) => peopleIds.add(person.id));
  }

  for (const personId of peopleIds) {
    // check if person already exists in the database
    const person = await Person.findOne({
      id: personId,
    }).exec();

    if (!person) {
      await downloadPersonData(personId);
    }
  }
}

async function downloadMovieData(movieId) {
  try {
    await checkRateLimit(); // Check rate limit before making an API call
    const movie = await tmdbApi.getMovieDetails(movieId);
    if (!movie || !movie.id) {
      Logger.warn(`Movie with ID ${movieId} not found.`);
      return;
    }

    // Insert or update the movie in the database
    await Movie.updateOne({ id: movie.id }, movie, { upsert: true });
    Logger.info(`Inserted/Updated movie with ID ${movie.id} into DB.`);

    // Fetch and update additional data for the movie
    const additionalDataFunctions = [
      { func: tmdbApi.getMovieImages, key: "images" },
      { func: tmdbApi.getMovieVideos, key: "videos" },
      { func: tmdbApi.getMovieKeywords, key: "keywords" },
      { func: tmdbApi.getMovieSimilar, key: "similar" },
      { func: tmdbApi.getMovieCredits, key: "credits" },
    ];

    for (const { func, key } of additionalDataFunctions) {
      try {
        await checkRateLimit(); // Check rate limit before making an API call
        const data = await func(movieId);
        if (data && (data.id || data.results || data.cast || data.crew)) {
            await Movie.updateOne({ id: movie.id }, { $set: { [key]: data } });
            Logger.info(`Inserted/Updated ${key} for movie ID ${movieId} into DB.`);

            // If we fetched credits, also download people details
            if (key === "credits") {
            // await downloadPeopleFromCredits(data);
            }
        }
      } catch (error) {
        console.log(error)
      }
    }

  } catch (error) {
    Logger.error(`Error processing movie ID ${movieId}:`, error);
  }
}

async function downloadMovies(startId, endId) {
  for (let id = startId; id <= endId; id++) {
    await downloadMovieData(id);
  }
  Logger.info("All movies and related data downloaded.");
}

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function checkRateLimit() {
  requestCounter++;
  if (requestCounter >= 39) {
    Logger.info("Reached 39 requests, waiting for 10 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds
    requestCounter = 0; // Reset counter after the wait
  }
}

async function start() {
  Logger.info("Starting script...");
  const { localLatestId, tmdbLatestId } = await fetchLatestIds();

  if (tmdbLatestId <= localLatestId) {
    Logger.info("No new movies to download.");
    process.exit();
  }

  const difference = tmdbLatestId - localLatestId;
  Logger.info(`There are ${difference} new movies available.`);

  const answer = AFFIRMATIVE_ANSWER
  if (answer.toLowerCase() !== AFFIRMATIVE_ANSWER) {
    Logger.info("Exiting script.");
    process.exit();
  }

  await downloadMovies(localLatestId + 1, tmdbLatestId);

  rl.close();
  process.exit();
}

// Run the script
mongoose.connection.on("open", async () => {
  Logger.info("Connected to database...");
  start();
  // let movie_from_api = await tmdbApi.getMovieDetails(776);
  // let movie = await Movie.find({ id: 776 });
  // // parse as utf-8
  // console.log(JSON.stringify(movie_from_api, null, 2));
  // console.log(JSON.stringify(movie, null, 2));

    
});

mongoose.connection.on("error", (error) => {
  Logger.error("Database connection error:", error);
  process.exit(1);
});