from http.server import BaseHTTPRequestHandler
import yt_dlp
from urllib.parse import urlparse, parse_qs
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        video_id = query.get('id', [None])[0]
        
        if not video_id:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"error": "Missing id"}')
            return
            
        # Clean ID ensuring strictly YouTube parsing
        clean_id = ''.join(c for c in str(video_id) if c.isalnum() or c in '-_')[:11]
        url = f"https://www.youtube.com/watch?v={clean_id}"
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'no_warnings': True,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                audio_url = info['url']
                
            # Perform HTTP 302 Redirect to the Google Audio URL directly!
            # This completely bypasses Vercel's 10-second Serverless execution timeout.
            # Your Expo AV / TrackPlayer will stream directly from YouTube's bandwidth!
            self.send_response(302)
            self.send_header('Location', audio_url)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            return
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
