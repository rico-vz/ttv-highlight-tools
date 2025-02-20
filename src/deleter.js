const axios = require('axios');
const config = require('../config.json');
const AUTH_TOKEN = process.env.AUTH_TOKEN;

const twitchApi = axios.create({
    baseURL: 'https://api.twitch.tv/helix',
    headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Client-Id': config.clientId
    }
});

async function deleteHighlightBatch(highlights) {
    const params = new URLSearchParams();
    highlights.forEach(highlight => params.append('id', highlight.id));

    const response = await twitchApi.delete(`/videos?${params.toString()}`);
    return response.data.data;
}

async function deleteHighlights(highlights) {
    const total = highlights.length;
    const batches = [];

    // Split into batches of 5 (max limit per req)
    for (let i = 0; i < total; i += 5) {
        batches.push(highlights.slice(i, i + 5));
    }

    console.log(`Deleting ${total} highlights in ${batches.length} batches...`);

    let deleted = 0;
    for (const batch of batches) {
        try {
            const deletedIds = await deleteHighlightBatch(batch);
            deleted += deletedIds.length;
            console.log(`Progress: ${deleted}/${total} (${Math.round(deleted / total * 100)}%)`);
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Unauthorized. Check your AUTH_TOKEN and permissions.');
            }
            console.error(`Failed to delete batch:`, error.message);
        }

        // delay between batches
        await new Promise(resolve => setTimeout(resolve, 275));
    }

    return deleted;
}

module.exports = {
    deleteHighlights
};