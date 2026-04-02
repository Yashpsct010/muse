from http.server import BaseHTTPRequestHandler
import yt_dlp
from urllib.parse import urlparse, parse_qs
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        video_id = query.get('id', [None])[0]

        if not video_id:
            self._send_json(400, {"error": "Missing id"})
            return

        clean_id = ''.join(c for c in str(video_id) if c.isalnum() or c in '-_')[:11]
        url = f"https://www.youtube.com/watch?v={clean_id}"

        ydl_opts = {
            # Prefer audio-only m4a streams; fall back to best available
            'format': 'bestaudio[ext=m4a]/bestaudio/best',
            'quiet': True,
            'no_warnings': True,
            'noplaylist': True,
            'extractor_args': {
                'youtube': {
                    # Use web_creator client — returns audio-only streams NOT locked to server IP
                    'player_client': ['web_creator', 'web'],
                }
            },
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                audio_url = info.get('url')
                self._send_json(200, {
                    "url": audio_url,
                    "ext": info.get("ext"),
                    "acodec": info.get("acodec"),
                    "vcodec": info.get("vcodec"),
                })
        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def _send_json(self, status, data):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
