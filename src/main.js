require('dotenv').config();
const { getUserId, getHighlights } = require('./scraper');
const { saveHighlights } = require('./storage');
const config = require('../config.json');

async function scrapeAndStore() {
    try {
        const userId = await getUserId(config.streamerName);
        console.log(`Found user ID: ${userId}`);

        const highlights = await getHighlights(userId);
        console.log(`Found ${highlights.length} highlights`);

        const savedPaths = await saveHighlights(config.streamerName, highlights);
        console.log(`Saved highlights in following locations:`);
        savedPaths.forEach(path => console.log(`- ${path}`));

        return highlights;
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('API Error:', error.response.data);
        }
        throw error;
    }
}

if (require.main === module) {
    scrapeAndStore()
        .catch(error => {
            console.error('Failed to scrape highlights:', error);
            process.exit(1);
        });
}

module.exports = {
    scrapeAndStore
};