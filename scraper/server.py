"""
CFG Outdoor Events — Scraper HTTP Server

Wraps the scraper in a simple Flask server so Railway keeps the
container alive and the admin UI can trigger manual runs via POST /run.
"""

import os
import threading
import traceback
from http.server import BaseHTTPRequestHandler, HTTPServer

from dotenv import load_dotenv

load_dotenv()

# Validate env vars before importing scraper modules
REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY"]
missing = [k for k in REQUIRED_ENV if not os.environ.get(k)]
if missing:
    raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

import main as scraper_main  # noqa: E402  (import after env check)

_scraper_lock = threading.Lock()
_scraper_running = False


def run_scraper_background(source_id: str | None = None):
    """Run the scraper in a background thread (one at a time)."""
    global _scraper_running
    if _scraper_lock.locked():
        print("[server] Scraper already running, skipping duplicate request")
        return

    def _run():
        global _scraper_running
        with _scraper_lock:
            _scraper_running = True
            try:
                if source_id:
                    os.environ["SOURCE_ID"] = source_id
                else:
                    os.environ.pop("SOURCE_ID", None)
                scraper_main.main()
            except Exception:
                traceback.print_exc()
            finally:
                _scraper_running = False
                os.environ.pop("SOURCE_ID", None)

    t = threading.Thread(target=_run, daemon=True)
    t.start()


class ScraperHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):  # noqa: A002
        print(f"[server] {self.address_string()} - {format % args}")

    def send_json(self, status: int, body: str):
        encoded = body.encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self):
        if self.path == "/health":
            status = "running" if _scraper_running else "idle"
            self.send_json(200, f'{{"status": "{status}"}}')
        else:
            self.send_json(404, '{"error": "Not found"}')

    def do_POST(self):
        if self.path == "/run":
            # Optional: read source_id from request body
            content_length = int(self.headers.get("Content-Length", 0))
            source_id = None
            if content_length > 0:
                import json
                try:
                    body = json.loads(self.rfile.read(content_length))
                    source_id = body.get("source_id")
                except Exception:
                    pass

            if _scraper_lock.locked():
                self.send_json(409, '{"message": "Scraper already running"}')
                return

            run_scraper_background(source_id)
            self.send_json(202, '{"message": "Scraper started"}')
        else:
            self.send_json(404, '{"error": "Not found"}')


def main():
    port = int(os.environ.get("PORT", 8080))
    server = HTTPServer(("0.0.0.0", port), ScraperHandler)
    print(f"[server] CFG Scraper server listening on port {port}")
    print(f"[server] POST /run  — trigger a scrape")
    print(f"[server] GET  /health — check status")
    server.serve_forever()


if __name__ == "__main__":
    main()
