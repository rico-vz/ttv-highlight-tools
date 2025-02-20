
# TTV Highlight Tools

A tool for managing your Twitch highlights.  
Created to help Twitch streamers with the sudden [100 hour storage limit for Highlights](https://x.com/TwitchSupport/status/1892277199497043994).

## Features

- **Highlight Scraping**: Automatically get all highlight data from a channel. Gets stored in .json files.
- **Organized Storage**: All highlights and their data get organized by their creation date.
- **Downloading Highlights**: Download all your highlights using [TwitchDownloaderCLI](https://github.com/lay295/TwitchDownloader). You can download all highlights, or filter by creation date (year/month).
- **Chat Support**: Thanks to [TwitchDownloaderCLI](https://github.com/lay295/TwitchDownloader) you can download the chat logs alongside the videos.
- **Deleting Highlights**: Automatically delete highlights based on filters.*
- **Storage Estimation**: Get a rough estimate** on how much storage space you need to download your highlights, before downloading.

\* = Please be careful when doing this, there is no way to recover or download deleted highlights.  
\** = Storage estimated is purely based on 1080p@6mbps and the duration of your highlights. Storage estimate does not include size of saving chat. It will never be 100% accurate.

## Prerequisites

- [Node.js](https://nodejs.org/)
- [TwitchDownloaderCLI](https://github.com/lay295/TwitchDownloader) (for downloading highlights)
- [FFmpeg](https://ffmpeg.org/download.html) (Required for TwitchDownloaderCLI)
- [Twitch auth token](https://github.com/rico-vz/ttv-highlight-tools?tab=readme-ov-file#generating-a-twitch-auth-token)

## Getting Started

1. Clone or download this repository
2. Install dependencies: `npm install`
3. Edit the `config.json` with your preferences:

```json
{
    "clientId": "21mgxv714yxzpzkwrm9elag012jicb",
    "outputPath": "./output/",
    "streamerName": "channel_name",
    "downloader": {
        "twitchDownloaderCLIPath": "path/to/TwitchDownloaderCLI",
        "ffmpegPath": "ffmpeg",
        "output": "mp4",
        "downloadChat": true,
        "chatCompression": "Gzip",
        "chatEmbedImages": false
    }
}
```

4. Rename `.env.example` to `.env` and fill it with your Twitch auth token
5. Run the tool: `node src/main.js`

## Usage

The tool offers three main functions:

### 1. Scrape Highlights

- Gets all highlight data from the specified channel
- Stores all the data in organized JSON files

### 2. Download Highlights

- Download all highlights
- Download highlights from a specific year
- Download highlights from a specific year and month
- Download chat alongside highlights

### 3. Delete Highlights

- Delete highlights from a specific year
- Delete highlights from a specific year and month
- Delete highlights in a specific timeframe (e.g. All highlights between 2022-01 and 2022-08)

## Generating a Twitch Auth Token

TTV Highlight Tools uses the Twitch API, for this you will need a Twitch OAuth token.  
**Never share the generated auth token with anyone!**

1. Go to <https://twitchapps.com/tokengen/> in your browser
2. In the `Client ID` section fill in `21mgxv714yxzpzkwrm9elag012jicb` (This is the ttv-highlight-tools Client ID)
3. Optional: If you want to use TTV Highlight Tools to delete highlights you will have to put `channel:manage:videos` in the `Scopes` field.
***Example:***
![Example](https://i.imgur.com/Q7H4KEG.png)
4. Press the Connect button, you will now see something like this:
![Twitch auth page](https://i.imgur.com/VbZqPsA.png)  
*You will only see the video management warning if you followed step 3. This is not mandatory if you don't want to delete highlights using this tool.*
5. Now press the "Authorize" button  
6. You will now see your Twitch OAuth token. Copy this value and keep it safe.
![Twitch oauth response](https://i.imgur.com/ExjLJ67.png)  
***Do not show this token to anyone***

### Getting your Personal Auth Token

This is only needed if you have highlights marked as "Subscribers Only" or "Private" and you want to download them.  
If this is not the case, just ignore this and use the token generated above.

1. Open `config.json` and enable personal auth usage by setting `personalAuthEnabled` to `true`
2. Get your personal auth token using one of these two tutorials:

- [[Text] How to get your Twitch OAuth token](https://streamlink.github.io/cli/plugins/twitch.html#authentication)
- [[Video] How to get your Twitch OAuth token](https://www.youtube.com/watch?v=1MBsUoFGuls)

3. Paste the token in the `.env` file as `PERSONAL_AUTH_TOKEN`

## How to fix "Highlight download failed with code 3762504530"

This error happens when the highlight is marked as "Subscribers Only" or "Private" and you try to download it without a personal auth token. Follow the steps above to enable personal auth usage and get your personal auth token.
