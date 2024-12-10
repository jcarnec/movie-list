# commands used to remove credits
db.movies.aggregate([
  {
    // Project only the fields we need for our new credits collection
    $project: {
      movie_id: "$id",
      cast: "$credits.cast",
      crew: "$credits.crew"
    }
  },
  {
    // Write the transformed data into a new collection called "credits"
    $out: "credits"
  }
]);

db.movies.updateMany(
  {},
  { $unset: { credits: "" } }
);