const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');
const config = require('../config.json');

function validateConfig() {
    const { downloader } = config;
    if (!downloader) throw new Error('Downloader config missing');
    
    if (!['mp4', 'm4a'].includes(downloader.output)) {
        throw new Error('Output format has to be mp4 or m4a');
    }
    
    if (downloader.chatCompression && !['Gzip', 'None'].includes(downloader.chatCompression)) {
        throw new Error('Chat compression has to be Gzip or None');
    }
}

function getFFmpegArg() {
    const { ffmpegPath } = config.downloader;
    if (!ffmpegPath || ffmpegPath === 'ffmpeg') return null;
    return ['--ffmpeg-path', ffmpegPath];
}

function parseDuration(duration) {
    let seconds = 0;
    const hours = duration.match(/(\d+)h/);
    const minutes = duration.match(/(\d+)m/);
    const secs = duration.match(/(\d+)s/);
    
    if (hours) seconds += parseInt(hours[1]) * 3600;
    if (minutes) seconds += parseInt(minutes[1]) * 60;
    if (secs) seconds += parseInt(secs[1]);
    
    return seconds;
}

function sanitizeFilename(title) {
    return title.replace(/[<>:"/\\|?*]/g, '_')
                .replace(/\s+/g, '_');
}

async function downloadHighlight(highlight, outputDir) {
    validateConfig();
    const { twitchDownloaderCLIPath, output, downloadChat, chatCompression, chatEmbedImages } = config.downloader;

    await fs.mkdir(outputDir, { recursive: true });

    const safeTitle = sanitizeFilename(highlight.title);
    const videoOutPath = path.join(outputDir, `${safeTitle}_${highlight.id}.${output}`);
    
    const videoArgs = [
        'videodownload',
        '--id', highlight.id,
        '--output', videoOutPath,
        '--collision', 'Rename'
    ];

    const ffmpegArg = getFFmpegArg();
    if (ffmpegArg) videoArgs.push(...ffmpegArg);

    console.log(`Downloading highlight ${highlight.title} (${highlight.id})...`);
    await new Promise((resolve, reject) => {
        const process = spawn(twitchDownloaderCLIPath, videoArgs);
        process.on('exit', code => code === 0 ? resolve() : reject(`Highlight download failed with code ${code}`));
    });

    if (downloadChat) {
        const chatOutPath = path.join(outputDir, `${safeTitle}_${highlight.id}_chat.json`);
        const chatArgs = [
            'chatdownload',
            '--id', highlight.id,
            '--output', chatOutPath,
            '--collision', 'Rename'
        ];

        if (chatCompression) {
            chatArgs.push('--compression', chatCompression);
        }

        if (chatEmbedImages) {
            chatArgs.push('--embed-images');
        }

        console.log(`Downloading chat for ${highlight.title} (${highlight.id})...`);
        await new Promise((resolve, reject) => {
            const process = spawn(twitchDownloaderCLIPath, chatArgs);
            process.on('exit', code => code === 0 ? resolve() : reject(`Chat download failed with code ${code}`));
        });
    }
}

async function estimateStorage(highlights) {
    // very rough estimate based on 1080p@6mbps
    const totalDurationSecs = highlights.reduce((acc, h) => acc + parseDuration(h.duration), 0);
    const totalHours = totalDurationSecs / 3600;
    const estimatedGB = totalHours * 2.65;
    return estimatedGB;
}

async function downloadHighlights(highlights, basePath) {
    let downloaded = 0;
    const total = highlights.length;

    highlights.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    for (const highlight of highlights) {
        const date = new Date(highlight.created_at);
        const outputDir = path.join(
            basePath,
            highlight.user_name,
            'downloads',
            String(date.getFullYear()),
            String(date.getMonth() + 1).padStart(2, '0')
        );

        try {
            await downloadHighlight(highlight, outputDir);
            downloaded++;
            console.log(`Progress: ${downloaded}/${total} (${Math.round(downloaded/total*100)}%)`);
        } catch (error) {
            console.error(`Failed to download ${highlight.id}:`, error);
        }
    }
}

module.exports = {
    downloadHighlights,
    estimateStorage
};