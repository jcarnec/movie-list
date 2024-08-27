# SETUP

docker pull dubc/mongodb-3.4

docker run -d -p 27017:27017 -p 28017:28017 -e MONGODB_PASS="mypass" --name mongo-3.4 dubc/mongodb-3.4


docker exec -it mongo-3.4 mongo mongodb://admin:mypass@localhost/moviedb?authSource=admin

node ./bin/tmdb-script.js -c ./config.json

node ./bin/tmdb-script.js -c ./config.json -t


node ./bin/tmdb-script.js -c ./config.json -s "keywords"
## inside mongo

> db.people.find().limit(1)
> show collections
> db.movies.count()



### Fix layout

Create systematic layout system flex hiearachy, use simeple fill if needed

We need everything to be dynamically calculated in the case of width