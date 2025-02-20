const fs = require('fs/promises');
const path = require('path');

async function ensureDirectoryExists(dirPath) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

async function loadIndex(streamerDir) {
    const indexPath = path.join(streamerDir, 'highlight_index.json');
    try {
        const data = await fs.readFile(indexPath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return { paths: [] };
    }
}

async function updateIndex(streamerDir, newPath) {
    const indexPath = path.join(streamerDir, 'highlight_index.json');
    const index = await loadIndex(streamerDir);
    
    if (!index.paths.includes(newPath)) {
        index.paths.push(newPath);
        index.paths.sort();
        await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
    }
}

async function saveHighlights(streamerName, highlights) {
    const config = require('../config.json');
    const streamerDir = path.join(config.outputPath, streamerName);
    await ensureDirectoryExists(streamerDir);
    
    // Group highlights by creation date
    const groupedHighlights = highlights.reduce((acc, highlight) => {
        const date = new Date(highlight.created_at);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateKey = `${year}_${month}_${day}`;
        
        // Create structure if it doesn't exist
        if (!acc[year]) acc[year] = {};
        if (!acc[year][month]) acc[year][month] = {};
        if (!acc[year][month][dateKey]) acc[year][month][dateKey] = [];
        
        acc[year][month][dateKey].push(highlight);
        return acc;
    }, {});
    
    const savedPaths = [];
    
    // Save files organized by creation date
    for (const [year, months] of Object.entries(groupedHighlights)) {
        for (const [month, days] of Object.entries(months)) {
            const monthDir = path.join(streamerDir, year, month);
            await ensureDirectoryExists(monthDir);
            
            for (const [dateKey, dayHighlights] of Object.entries(days)) {
                const filename = `highlights_${dateKey}.json`;
                const fullPath = path.join(monthDir, filename);
                
                // Sort highlights by created_at within each file
                dayHighlights.sort((a, b) => 
                    new Date(a.created_at) - new Date(b.created_at)
                );
                
                await fs.writeFile(
                    fullPath, 
                    JSON.stringify(dayHighlights, null, 2)
                );
                
                const relativePath = path.relative(streamerDir, fullPath);
                savedPaths.push(relativePath);
            }
        }
    }
    
    for (const newPath of savedPaths) {
        await updateIndex(streamerDir, newPath);
    }
    
    return savedPaths;
}

module.exports = {
    saveHighlights,
    loadIndex
};