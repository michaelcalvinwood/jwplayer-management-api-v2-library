//https://developer.jwplayer.com/jwplayer/reference/get_v2-sites-site-id-media

require('dotenv').config();
const axios = require('axios');
const luxon = require('luxon');

const secret = process.env.SECRET;
const siteId = process.env.SITE_ID;

// 90 minutes: 5400

const schedule = [
    {
        title: '30 minute example',
        date: '2022-09-13',
        mediaId: 'live',
        channel: 'JUELnFMu',
        time: '18:00:00',
        length: '00:30:00',
        description: "An example of 30 minutes",
        img: "https://media.istockphoto.com/photos/dog-watching-tv-on-the-couch-picture-id680810342?k=20&m=680810342&s=612x612&w=0&h=wQVeNcnq0CIqpGK88zA-pqmzbyK_6diiHR7kAq5PbxQ="
    },
    {
        title: '90 minute example',
        date: '2022-09-13',
        mediaId: 'live',
        channel: 'JUELnFMu',
        time: '14:00:00',
        length: '1:30:00',
        description: "An example of 90 minutes",
        img: "https://media.istockphoto.com/photos/dog-watching-tv-on-the-couch-picture-id680810342?k=20&m=680810342&s=612x612&w=0&h=wQVeNcnq0CIqpGK88zA-pqmzbyK_6diiHR7kAq5PbxQ="
    },
    {
        title: '90 minute tomorrow example',
        date: '2022-09-14',
        mediaId: 'live',
        channel: 'JUELnFMu',
        time: '14:00:00',
        length: '1:30:00',
        description: "An example of 90 minutes",
        img: "https://media.istockphoto.com/photos/dog-watching-tv-on-the-couch-picture-id680810342?k=20&m=680810342&s=612x612&w=0&h=wQVeNcnq0CIqpGK88zA-pqmzbyK_6diiHR7kAq5PbxQ="
    },
    {
        title: '120 minute example',
        date: '2022-09-13',
        mediaId: 'live',
        channel: 'JUELnFMu',
        time: '09:00',
        length: '02:00:00',
        description: "An example of 120 minutes",
        img: "https://media.istockphoto.com/photos/dog-watching-tv-on-the-couch-picture-id680810342?k=20&m=680810342&s=612x612&w=0&h=wQVeNcnq0CIqpGK88zA-pqmzbyK_6diiHR7kAq5PbxQ="
    },

]

console.log(siteId, secret);

function convertHHMMSSToSeconds(HHMMSS) {
    let parts = HHMMSS.split(':');
    return Number(parts[0]) * 60 * 60 + Number(parts[1]) * 60 + Number(parts[2]);
}

const getNext15MinuteTimeSlot = (seconds) => {
    let remainder = seconds % 900;
    if (remainder === 0) return seconds;
    return 900 - remainder + seconds;
}

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
        .then(response => {
            //console.log(response.data);
            resolve(response.data)
        })
        .catch(error => {
            console.error(error);
            reject(error);
        })
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

const addScheduleEvents = (date, events) => {
    let scheduledEvents = [];

    // get date
    let datetime = luxon.DateTime.fromFormat(date, 'yyyy-MM-dd', { zone: 'utc'});
    let offsetMinutes = luxon.DateTime.now().offset;
    let secondsConvert = offsetMinutes * 60 * -1;
    
    for (let i = 0; i < events.length; ++i) {
        if (events[i].date !== date) continue;
        events[i].start =  convertHHMMSSToSeconds(events[i].time) + secondsConvert;
        events[i].ts = datetime.ts + events[i].start * 1000;
        events[i].duration =  convertHHMMSSToSeconds(events[i].length);
        scheduledEvents.push(events[i]);        
    }

    return scheduledEvents.sort((a, b) => b.start - a.start);
}

const addFeaturedMedia = async (startSeconds, stopSeconds, curSchedule, includePlaylists, excludePlaylists, durationExclusion = 14 * 60) => {
    let mediaToPlay = new Set();

    // add media from included playlists
    let mediaList, playlist;
    for (let i = 0; i < includePlaylists.length; ++i) {
        try {
            mediaList = await getPlaylist(includePlaylists[i]);
            playlist = mediaList.playlist;
            console.log(i, playlist.length);
            for (let j = 0; j < playlist.length; ++j) if (playlist[j].duration >= durationExclusion) mediaToPlay.add(playlist[j]);
        } catch (e) { console.error(e); }
    }

    // remove media from excluded playlists
    for (let i = 0; i < excludePlaylists.length; ++i) {
        try {
            mediaList = await getPlaylist(excludePlaylists[i]);
            playlist = mediaList.playlist;
            console.log(i, playlist.length);
            for (let j = 0; j < mediaList.length; ++j) mediaToPlay.delete(mediaList[j]);
        } catch (e) { console.error(e); }
    }

    // convert remaining media set to array
    let listToPlay = Array.from(mediaToPlay);

    // TODO: If list to play duration < 25 hours add listtoplay to listtoplay until > 25 hours

    let newSchedule = [], endingTime = 0;

    console.log('listToPlay.length', listToPlay.length, listToPlay[0]);

    if (curSchedule.length) endingTime = curSchedule[0].start - 1;
    else endingTime = stopSeconds;

    let nextScheduleEventIndex = 0;
    
    let debugDecrement = 100;

    while (startSeconds < stopSeconds) {
        let prevSeconds = startSeconds;
        startSeconds = getNext15MinuteTimeSlot(startSeconds);
        console.log('prevSeconds, next15MinuteTimeSlot, newSchedule', prevSeconds, startSeconds, newSchedule);

        console.log('debugDecrement', debugDecrement);
        --debugDecrement; if (!debugDecrement) return;
        
        if (nextScheduleEventIndex < curSchedule.length) console.log('next start, startSeconds', curSchedule[nextScheduleEventIndex].start, startSeconds);

        if (nextScheduleEventIndex < curSchedule.length && curSchedule[nextScheduleEventIndex].start <= startSeconds) {
            newSchedule.push(curSchedule[nextScheduleEventIndex]);
            startSeconds += curSchedule[nextScheduleEventIndex].duration;
            ++nextScheduleEventIndex;
            if (nextScheduleEventIndex < curSchedule.length) endingTime = curSchedule[nextScheduleEventIndex].start - 1;
            else endingTime = stopSeconds;
        } else {
            let numSecondstoFill = endingTime - startSeconds;
            console.log('numSecondsToFill', numSecondstoFill);
            let index = -1;
            for (let i = 0; i < listToPlay.length; ++i) {
                if (listToPlay[i].duration <= numSecondstoFill) {
                    index = i;
                    break;
                }
            }
            if (index !== -1) {
                let next = listToPlay.splice(index, 1)[0];
                next.start = startSeconds;
                newSchedule.push(next);
                startSeconds += next.duration;
            } else {
                // we don't have any videos short enough therefore the timeslot is empty
                startSeconds += numSecondstoFill;
            }
        }
    }

    console.log('startSeconds, stopSeconds', startSeconds, stopSeconds);
}

const generateDayTvPlaylist = async (date, start, stop, scheduledEvents, includePlaylists, excludePlaylists = []) => {
    let dayPlayList = addScheduleEvents(date, scheduledEvents);
    
    let startEstSeconds = convertHHMMSSToSeconds(start);
    let stopEstSeconds = convertHHMMSSToSeconds(stop);
    let offsetMinutes = luxon.DateTime.now().offset;
    let secondsConvert = offsetMinutes * 60 * -1;

    let startUtcSeconds = startEstSeconds + secondsConvert;
    let stopUtcSeconds = stopEstSeconds + secondsConvert;

    addFeaturedMedia(startUtcSeconds, stopUtcSeconds, dayPlayList, includePlaylists, excludePlaylists);
    
    console.log(dayPlayList);
    return;

    
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

//generate24HourContent('8vihlgXx', 'flipper');

generateDayTvPlaylist('2022-09-14', '06:00:00', '23:59:00', schedule, ['8vihlgXx']);