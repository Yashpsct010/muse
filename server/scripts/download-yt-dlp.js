const fs = require('fs');
const https = require('https');
const os = require('os');
const path = require('path');

const platform = os.platform();
let filename = 'yt-dlp';
let downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

if (platform === 'win32') {
  filename = 'yt-dlp.exe';
  downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
} else if (platform === 'darwin') {
  filename = 'yt-dlp_macos';
  downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
} else {
  filename = 'yt-dlp_linux';
  downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';
}

const targetPath = path.join(__dirname, '..', filename);

console.log(`Downloading ${filename} for ${platform}...`);

function download(url, targetPath) {
  https.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307) {
      download(res.headers.location, targetPath);
    } else {
      const fileStream = fs.createWriteStream(targetPath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`yt-dlp downloaded successfully to ${targetPath}`);
        
        // Make executable on non-Windows
        if (platform !== 'win32') {
          try {
            fs.chmodSync(targetPath, 0o755);
            console.log('Made yt-dlp executable.');
          } catch (err) {
            console.error('Failed to make executable:', err.message);
          }
        }
      });
    }
  }).on('error', (err) => {
    console.error('Download failed:', err.message);
    process.exit(1);
  });
}

download(downloadUrl, targetPath);
