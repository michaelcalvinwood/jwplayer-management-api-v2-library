//https://developer.jwplayer.com/jwplayer/reference/get_v2-sites-site-id-media

require('dotenv').config();
const axios = require('axios');

const secret = process.env.SECRET;
const siteId = process.env.SITE_ID;

console.log(siteId, secret);

const getMediaList = (pageNumber = 1, numPerPage = 10000) => {
    return new Promise((resolve, reject) => {
        const request = {
            url: `https://api.jwplayer.com/v2/sites/${siteId}/media/`,
            method: "get",
            params: {
                page: pageNumber,
                page_length: numPerPage,
            },
            headers: {
                Authorization: `Bearer ${secret}`
            }
        }

        axios(request)
        .then(response => resolve(response.data))
        .catch(error => reject(error))
    })
}

const createManualPlaylist = (title, mediaList, author = 'PYMNTS') => {
    return new Promise((resolve, reject) => {
        const request = {
            url: `https://api.jwplayer.com/v2/sites/${siteId}/playlists/manual_playlist`,
            method: "post",
            data: {
                metadata: {
                    media_filter: {include: {match: 'any', values: mediaList}},
                    title,
                    author
                }
            },
            headers: {
                Authorization: `Bearer ${secret}`
            }
        }
        axios(request)
        .then(response => resolve(response.data))
        .catch(error => reject(error))
    })
}

const getPlaylistMetaData = playlistId => {
    return new Promise((resolve, reject) => {
        const request = {
            url: `https://api.jwplayer.com/v2/sites/${siteId}/playlists/${playlistId}`,
            method: 'get',
            headers: {
                Authorization: `Bearer ${secret}`
            }
        }
        axios(request)
        .then(response => resolve(response.data))
        .catch(error => reject(error))
    })
}

const getPlaylist = playlistId => {
    return new Promise((resolve, reject) => {
        const request = {
            url: `https://cdn.jwplayer.com/v2/playlists/${playlistId}`,
            method: 'get'
        }
        axios(request)
        .then(response => resolve(response.data))
        .catch(error => reject(error))
    })
}

const generate24HourContent = async (inputPlaylistId, newPlaylistTitle) => {

    let data;

    try { data = await getPlaylist(inputPlaylistId); } 
    catch (e) { return console.error(e); }

    const { playlist } = data;

    if (!playlist.length) return;

    let media = [];
    let timeRemaining = 86400;

    while (timeRemaining > 0) {
        for (let i = 0; i < playlist.length; ++i) {
            media.push(playlist[i].mediaid);
            timeRemaining -= parseInt(playlist[i].duration);
            if (timeRemaining <= 0) break;
        }
    }

    let result;
    try { result = await createManualPlaylist (newPlaylistTitle, media); }
    catch (e) { return console.error(e); }

    console.log(`${newPlaylistTitle} has been created`);
}

// getMediaList()
// .then(data => console.log(data))
// .catch(err => console.error(err))

// createManualPlaylist(['cnLuyfOm', 'zb6VSIAe'])
// .then(response => console.log(response))
// .catch(error => console.error(error))

// getPlaylist('8vihlgXx')
// .then(response => console.log(response))
// .catch(error => console.error(error))

generate24HourContent('8vihlgXx', 'flipper');