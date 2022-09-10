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

const createManualPlaylist = mediaList => {
    return new Promise((resolve, reject) => {
        const request = {
            url: `https://api.jwplayer.com/v2/sites/${siteId}/playlists/manual_playlist`,
            method: "post",
            data: {
                metadata: {
                    media_filter: {include: {match: 'any', values: mediaList}},
                    title: 'Hello',
                    author: 'PYMNTS'
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

// getMediaList()
// .then(data => console.log(data))
// .catch(err => console.error(err))

createManualPlaylist(['cnLuyfOm', 'zb6VSIAe'])
.then(response => console.log(response))
.catch(error => console.error(error))
