import os
from backend.app import create_app

env = os.getenv("FLASK_ENV", "dev")
app = create_app(config_name=env)

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "t")
    
    print(f"Starting AI Language Translator server on http://{host}:{port} (Env: {env})")
    app.run(host=host, port=port, debug=debug)
