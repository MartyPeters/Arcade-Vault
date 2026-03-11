import os
import shutil
from app import GAMES

def build_static():
    print("🚀 Building Static Arcade Vault...")
    
    # Ensure dist folder exists
    if os.path.exists('dist'):
        shutil.rmtree('dist')
    os.makedirs('dist')

    # Copy static files
    if os.path.exists('static'):
        shutil.copytree('static', 'dist/static')
    
    # Copy games
    if os.path.exists('games'):
        shutil.copytree('games', 'dist/games')

    # Read the template
    with open('templates/hub.html', 'r', encoding='utf-8') as f:
        template = f.read()

    # Get games list
    games = []
    if os.path.exists('games'):
        for folder in os.listdir('games'):
            if os.path.isdir(os.path.join('games', folder)):
                games.append(folder)

    # Generate game cards HTML (matching the new hub.html structure)
    game_cards_html = ""
    for game_data in [g for g in GAMES]: # Use GAMES list from app.py if possible, else hardcode
        color = game_data['color']
        glow = game_data['glow']
        poster = game_data['poster']
        game_cards_html += f'''
        <div class="game-wrapper">
            <div class="card-glow-bg" style="--card-color: {color};"></div>
            <a class="game-card" href="games/{game_data['id']}/index.html" style="--card-color: {color}; --card-glow: {glow};">
                <div class="card-image-wrap">
                    <img src="{poster}" alt="{game_data['title']} Poster" class="card-poster">
                    <div class="card-overlay"></div>
                    <div class="card-icon">{game_data['icon']}</div>
                </div>
                <div class="card-body">
                    <div class="card-header">
                        <h2>{game_data['title']}</h2>
                        <div class="platform-tag">WEB-OS 2077</div>
                    </div>
                    <p class="card-desc">{game_data['description']}</p>
                    <div class="card-footer">
                        <span class="status-indicator active">ONLINE</span>
                        <div class="play-btn">LAUNCH ▶</div>
                    </div>
                </div>
            </a>
        </div>
        '''

    # Replace the Jinja2 block
    import re
    result = re.sub(r'\{% for game in games %\}.*?\{% endfor %\}', game_cards_html, template, flags=re.DOTALL)
    
    # Clean up other Jinja2 variables
    result = result.replace('{{ games|length }}', str(len(GAMES)))
    result = result.replace("{{ 's' if games|length != 1 }}", 's' if len(GAMES) != 1 else '')
    
    # Fix paths for static deployment (remove leading /)
    result = result.replace('src="/static/', 'src="static/')
    result = result.replace('href="/static/', 'href="static/')

    with open('dist/index.html', 'w', encoding='utf-8') as f:
        f.write(result)

    print("✅ Build complete! Open 'dist/index.html' to test, or push 'dist' contents to GitHub Pages.")

if __name__ == "__main__":
    build_static()
