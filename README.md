# 🕹️ Arcade Vault

A personal game collection — playable on your local network. Built with HTML5 Canvas + Python/Flask.

## Games
| Game | Description |
|------|-------------|
| 🦍 Donkey Kong | Classic barrel-dodging action |
| 🚀 Space Invaders 2077 | Cyberpunk reimagining with lasers, rockets & boss fights |

## Setup

```bash
# 1. Create venv (one-time)
python -m venv venv

# 2. Activate venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the server
python app.py
```

Then open **http://localhost:5000** in your browser.

**On the same WiFi?** Find your local IP with `ipconfig` (Windows) and share `http://<your-ip>:5000` with anyone on the network.

## Adding New Games
1. Create a folder under `games/<game-name>/`
2. Add your `index.html` (and any CSS/JS) inside it
3. Register the game in `app.py` in the `GAMES` list

## Tech
- **Frontend:** HTML5 Canvas, Vanilla JS, CSS
- **Server:** Python + Flask
- **Shared venv:** All games use the same Python environment at the repo root
