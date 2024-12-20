'use strict';

module.exports = {
    query_timeout: 1147483647,
    pool_size: 5,
    requests_per_tick: 39,
    TICK_TIMEOUT: 10000,
    AFFIRMATIVE_ANSWER: 'y',
    SEPARATOR_SYMBOL: '=',
    SEPARATOR_SYMBOLS_COUNT: 100,
    EVENTS: {
        START: 'start',
        NO_NEW_MOVIES: 'no-new-movies',
        DOWNLOAD_NEW_MOVIES: 'download-new-movies',
        NEW_MOVIES_DETAILS_DOWNLOADED: 'new-movies-details-downloaded',
        IMAGES_DOWNLOADED: 'images-downloaded',
        VIDEOS_DOWNLOADED: 'videos-downloaded',
        KEYWORDS_DOWNLOADED: 'keywords-downloaded',
        SIMILAR_DOWNLOADED: 'similar-downloaded',
        CREDITS_DOWNLOADED: 'credits-downloaded',
        PEOPLE_DOWNLOADED: 'people-downloaded',
        TRANSFER_NEW_DATA: 'transfer-new-data',
        NEW_DATA_TRANSFERRED: 'new-data-transferred',
        ERROR: 'error',
        EXIT: 'exit'
    },
    STEP: {
        MOVIES: 'movies',
        IMAGES: 'images',
        VIDEOS: 'videos',
        KEYWORDS: 'keywords',
        CREDITS: 'credits',
        SIMILAR: 'similar',
        PEOPLE: 'people'
    }
};
