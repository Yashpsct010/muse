from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import urllib.request

# Public Piped API instances - try in order for redundancy
PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://piped-api.garudalinux.org",
]

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        video_id = query.get('id', [None])[0]

        if not video_id:
            self._send_json(400, {"error": "Missing id"})
            return

        clean_id = ''.join(c for c in str(video_id) if c.isalnum() or c in '-_')[:11]

        for instance in PIPED_INSTANCES:
            try:
                req = urllib.request.Request(
                    f"{instance}/streams/{clean_id}",
                    headers={"User-Agent": "Mozilla/5.0"}
                )
                with urllib.request.urlopen(req, timeout=8) as res:
                    data = json.loads(res.read().decode())

                # Pick the best audio stream (highest bitrate m4a/webm audio-only)
                audio_streams = data.get("audioStreams", [])
                if not audio_streams:
                    continue

                # Prefer m4a (AAC) for best expo-av compatibility, highest quality
                m4a = [s for s in audio_streams if s.get("mimeType", "").startswith("audio/mp4")]
                chosen = sorted(m4a, key=lambda s: s.get("bitrate", 0), reverse=True) if m4a else \
                         sorted(audio_streams, key=lambda s: s.get("bitrate", 0), reverse=True)

                if not chosen:
                    continue

                best = chosen[0]
                self._send_json(200, {
                    "url": best["url"],
                    "mimeType": best.get("mimeType"),
                    "bitrate": best.get("bitrate"),
                    "source": instance,
                })
                return

            except Exception as e:
                continue  # Try next instance

        self._send_json(500, {"error": "All Piped instances failed"})

    def _send_json(self, status, data):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
