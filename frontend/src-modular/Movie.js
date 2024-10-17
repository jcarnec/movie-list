export default class Movie {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.originalTitle = data.original_title;
    this.overview = data.overview;
    this.releaseDate = new Date(data.release_date);
    this.runtime = data.runtime;
    this.voteAverage = data.vote_average;
    this.voteCount = data.vote_count;
    this.popularity = data.popularity;
    this.posterPath = data.poster_path;
    this.backdropPath = data.backdrop_path;
    this.adult = data.adult === 'true';
    this.homepage = data.homepage;
    this.imdbId = data.imdb_id;
    this.originalLanguage = data.original_language;
    this.status = data.status;
    this.tagline = data.tagline;
    this.budget = data.budget;
    this.revenue = data.revenue;
    this.belongsToCollection = data.belongs_to_collection;
    this.genres = data.genres.map((genre) => genre.name);
    this.spokenLanguages = data.spoken_languages.map(
      (lang) => lang.english_name
    );
    this.productionCountries = data.production_countries.map(
      (country) => country.name
    );
    this.productionCompanies = data.production_companies.map(
      (company) => company.name
    );
    this.reviews = data.reviews;
    this.videos = data.videos;
    this.similar = data.similar;
    this.images = data.images;
    this.keywords = data?.keywords[0]?.keywords.map(
      (keyword) => keyword.name
    );
    this.cast = data?.credits?.cast;
    this.topNcast = data?.credits?.cast
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 6);

    this.crew = data?.credits?.crew;
    this.topNcrew = data?.credits?.crew
      .sort((a, b) => {
        if (a.job === 'Director') {
          return -1;
        } else if (b.job === 'Director') {
          return 1;
        }
        return b.popularity - a.popularity;
      })
      .slice(0, 6);
  }

  getFormattedReleaseDate() {
    return this.releaseDate.toLocaleDateString();
  }

  getFormattedMonthYear() {
    return this.releaseDate.toLocaleString('default', {
      month: 'numeric',
      year: 'numeric',
    });
  }

  getReleaseYear() {
    return this.releaseDate.getFullYear();
  }

  getPosterUrl() {
    return `https://image.tmdb.org/t/p/w500${this.posterPath}`;
  }

  getBackdropUrl() {
    return `https://image.tmdb.org/t/p/w1280${this.backdropPath}`;
  }
}
