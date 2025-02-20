require('dotenv').config();
const readline = require('readline');
const path = require('path');
const fs = require('fs/promises');
const { getUserId, getHighlights } = require('./scraper');
const { saveHighlights, loadIndex } = require('./storage');
const { downloadHighlights, estimateStorage } = require('./downloader');
const config = require('../config.json');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

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

async function loadAllHighlights() {
    const streamerDir = path.join(config.outputPath, config.streamerName);
    const index = await loadIndex(streamerDir);
    
    let allHighlights = [];
    for (const filepath of index.paths) {
        const fullPath = path.join(streamerDir, filepath);
        try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const highlights = JSON.parse(content);
            allHighlights = allHighlights.concat(highlights);
        } catch (error) {
            console.error(`Failed to read ${filepath}:`, error.message);
        }
    }
    return allHighlights;
}

async function filterHighlightsByDate(highlights, year, month = null) {
    return highlights.filter(highlight => {
        const date = new Date(highlight.created_at);
        if (month !== null) {
            return date.getFullYear() === year && date.getMonth() === month - 1;
        }
        return date.getFullYear() === year;
    });
}

async function main() {
    try {
        console.log('What would you like to do?');
        console.log('1. Scrape new highlights');
        console.log('2. Download scraped highlights');
        
        const choice = await question('Enter your choice (1 or 2): ');

        if (choice === '1') {
            await scrapeAndStore();
        } else if (choice === '2') {
            console.log('\nDownload options:');
            console.log('1. Download every highlight');
            console.log('2. Download highlights from a specific year');
            console.log('3. Download highlights from a specific year and month');
            
            const downloadChoice = await question('Enter your choice (1-3): ');
            
            const highlights = await loadAllHighlights();
            
            if (highlights.length === 0) {
                console.log('No highlights found. Make sure to scrape the highlights first.');
                return;
            }

            let selectedHighlights = highlights;
            
            if (downloadChoice === '2' || downloadChoice === '3') {
                const years = [...new Set(highlights.map(h => new Date(h.created_at).getFullYear()))].sort();
                console.log('\nAvailable years:', years.join(', '));
                
                const year = parseInt(await question('Enter year (e.g., 2024): '));
                if (!years.includes(year)) {
                    console.log('No highlights found for that year.');
                    return;
                }
                
                if (downloadChoice === '3') {
                    const monthsInYear = [...new Set(highlights
                        .filter(h => new Date(h.created_at).getFullYear() === year)
                        .map(h => new Date(h.created_at).getMonth() + 1))]
                        .sort((a, b) => a - b);
                    
                    console.log('\nAvailable months:', monthsInYear.join(', '));
                    const month = parseInt(await question('Enter month (1-12): '));
                    if (!monthsInYear.includes(month)) {
                        console.log('No highlights found for that month.');
                        return;
                    }
                    
                    selectedHighlights = await filterHighlightsByDate(highlights, year, month);
                } else {
                    selectedHighlights = await filterHighlightsByDate(highlights, year);
                }
            }

            if (selectedHighlights.length === 0) {
                console.log('No highlights found for the selected period.');
                return;
            }

            const estimatedGB = await estimateStorage(selectedHighlights);
            console.log(`\nFound ${selectedHighlights.length} highlights`);
            console.log(`Estimated storage needed: ${estimatedGB.toFixed(1)}GB`);
            
            console.log('\nWARNING: Please make sure you have enough storage space available');
            const confirm = await question('Do you want to continue with the downloading? (y/n): ');
            if (confirm.toLowerCase() !== 'y') {
                console.log('Download cancelled.');
                return;
            }

            await downloadHighlights(selectedHighlights, config.outputPath);
        }
    } catch (error) {
        console.error('Something went wrong:', error);
    } finally {
        rl.close();
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    scrapeAndStore
};