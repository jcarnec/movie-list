"use strict";

const axios = require('axios');
const Logger = require('./Logger');

const ERR_STATUS = 34;

let instance = null;


function _getUrl(path) {
    let apiKey = "e316601ca43413563469752bc6096a5b";
    let baseUrl = 'http://api.themoviedb.org/3/';
    return `${baseUrl}${path.join('/')}?api_key=${apiKey}&language=en-US` 
}

class TmdbApi {

    async getLatestId() {
        const path = ['movie', 'latest'];
        try {
            const response = await axios.get(_getUrl(path), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            const body = response.data;

            if (!body.hasOwnProperty('id') || !body.id) {
                throw new Error('Invalid latest id');
            }

            body.id = parseInt(body.id, 10);
            if (!body.id) throw new Error('Could not parse int id');

            return body.id;
        } catch (err) {
            Logger.error('Error fetching latest movie ID:', err);
            throw err;
        }
    }

    async getMovieDetails(id) {
        if (!id) throw new Error('Invalid movie id');
        const path = ['movie', id];
        try {
            // utf-8
            const response = await axios.get(_getUrl(path), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            const body = response.data;

            if (body.hasOwnProperty('status_code') && body.status_code === ERR_STATUS) {
                return null;
            }

            if (!body.hasOwnProperty('id') || !body.id) {
                throw new Error('Invalid response for movie');
            }

            return body;
        } catch (err) {
            Logger.error(`Error fetching details for movie ID ${id}:`, err);
            throw err;
        }
    }

    async getMovieImages(id) {
        if (!id) throw new Error('Invalid movie id');
        const path = ['movie', id, 'images'];
        try {
            const response = await axios.get(_getUrl(path), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            const body = response.data;

            if (body.hasOwnProperty('status_code') && body.status_code === ERR_STATUS) {
                return null;
            }

            if (!body.hasOwnProperty('id') || !body.id) {
                throw new Error('Invalid response for movie images');
            }

            return body;
        } catch (err) {
            Logger.error(`Error fetching images for movie ID ${id}:`, err);
            throw err;
        }
    }

    async getMovieVideos(id) {
        if (!id) throw new Error('Invalid movie id');
        const path = ['movie', id, 'videos'];
        try {
            const response = await axios.get(_getUrl(path), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            const body = response.data;

            if (body.hasOwnProperty('status_code') && body.status_code === ERR_STATUS) {
                return null;
            }

            if (!body.hasOwnProperty('id') || !body.id) {
                throw new Error('Invalid response for movie videos');
            }

            return body;
        } catch (err) {
            Logger.error(`Error fetching videos for movie ID ${id}:`, err);
            throw err;
        }
    }

    async getMovieKeywords(id) {
        if (!id) throw new Error('Invalid movie id');
        const path = ['movie', id, 'keywords'];
        try {
            const response = await axios.get(_getUrl(path), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            const body = response.data;

            if (body.hasOwnProperty('status_code') && body.status_code === ERR_STATUS) {
                return null;
            }

            if (!body.hasOwnProperty('id') || !body.id) {
                throw new Error('Invalid response for movie keywords');
            }

            return body;
        } catch (err) {
            Logger.error(`Error fetching keywords for movie ID ${id}:`, err);
            throw err;
        }
    }

    async getMovieSimilar(id) {
        if (!id) throw new Error('Invalid movie id');
        const path = ['movie', id, 'similar'];
        try {
            const response = await axios.get(_getUrl(path), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            const body = response.data;

            if (body.hasOwnProperty('status_code') && body.status_code === ERR_STATUS) {
                return null;
            }

            if (!body.hasOwnProperty('results') || !body.results) {
                throw new Error('Invalid response for movie similar');
            }

            return body;
        } catch (err) {
            Logger.error(`Error fetching similar movies for movie ID ${id}:`, err);
            throw err;
        }
    }

    async getMovieRecommendations(id) {
        if (!id) throw new Error('Invalid movie id');
        const path = ['movie', id, 'recommendations'];
        try {
            const response = await axios.get(_getUrl(path), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            const body = response.data;

            if (body.hasOwnProperty('status_code') && body.status_code === ERR_STATUS) {
                return null;
            }

            if (!body.hasOwnProperty('id') || !body.id) {
                throw new Error('Invalid response for movie recommendations');
            }

            return body;
        } catch (err) {
            Logger.error(`Error fetching recommendations for movie ID ${id}:`, err);
            throw err;
        }
    }

    async getMovieCredits(id) {
        if (!id) throw new Error('Invalid movie id');
        const path = ['movie', id, 'credits'];
        try {
            const response = await axios.get(_getUrl(path), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            const body = response.data;

            if (body.hasOwnProperty('status_code') && body.status_code === ERR_STATUS) {
                return null;
            }

            if (!body.hasOwnProperty('id') || !body.id) {
                throw new Error('Invalid response for movie credits');
            }

            return body;
        } catch (err) {
            Logger.error(`Error fetching credits for movie ID ${id}:`, err);
            throw err;
        }
    }

    async getPersonDetails(id) {
        if (!id) throw new Error('Invalid person id');
        const path = ['person', id];
        try {
            const response = await axios.get(_getUrl(path), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
            const body = response.data;

            if (body.hasOwnProperty('status_code') && body.status_code === ERR_STATUS) {
                return null;
            }

            if (!body.hasOwnProperty('id') || !body.id) {
                throw new Error('Invalid response for person');
            }

            return body;
        } catch (err) {
            Logger.error(`Error fetching details for person ID ${id}:`, err);
            throw err;
        }
    }
}

module.exports = TmdbApi;