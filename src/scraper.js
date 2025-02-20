const axios = require('axios');
const fs = require('fs/promises');

const config = require('../config.json');
const AUTH_TOKEN = process.env.AUTH_TOKEN;

const twitchApi = axios.create({
    baseURL: 'https://api.twitch.tv/helix',
    headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Client-Id': config.clientId
    }
});

async function getUserId(username) {
    const response = await twitchApi.get(`/users?login=${username}`);
    if (!response.data.data.length) {
        throw new Error(`No user found with username: ${username}`);
    }
    console.log(response.data);
    return response.data.data[0].id;
}

async function getHighlights(userId) {
    let allHighlights = [];
    let cursor = null;

    do {
        const params = {
            user_id: userId,
            type: 'highlight',
            first: 100 
        };

        if (cursor) {
            params.after = cursor;
        }

        const response = await twitchApi.get('/videos', { params });

        allHighlights = [...allHighlights, ...response.data.data];

        cursor = response.data.pagination?.cursor;

        console.log(`Fetched ${response.data.data.length} highlights. Total so far: ${allHighlights.length}`);

        await new Promise(resolve => setTimeout(resolve, 100));

    } while (cursor);  // keep going until there are no more pages

    return allHighlights;
}

module.exports = {
    getUserId,
    getHighlights
};