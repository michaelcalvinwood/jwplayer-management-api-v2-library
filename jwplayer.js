require('dotenv').config();
const axios = require('axios');

const secret = process.env.SECRET;
const siteId = process.env.SITE_ID;

console.log(siteId, secret);

const getMediaList = (pageNumber, numPerPage) => {
    return new Promise((resolve, reject) => {
        const request = {
            url: `https://api.jwplayer.com/v2/sites/${siteId}/media/`,
            method: "get",
            page: pageNumber,
            page_length: numPerPage,
            headers: {
                Authorization: `Bearer ${secret}`
            }
        }

        axios(request)
        .then(response => resolve(response.data))
        .catch(error => reject(error))
    })
}

getMediaList(1, 12)
.then(data => console.log(data))
.catch(err => console.error(err))