import os
import shutil

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

    # Generate game cards HTML (matching the Jinja2 logic in templates)
    game_cards_html = ""
    for game in games:
        # Simple title casing
        title = game.replace('-', ' ').title()
        game_cards_html += f'''
        <div class="game-card">
            <div class="game-icon">{'🕹️' if 'kong' in game else '🚀'}</div>
            <h3>{title}</h3>
            <p>Experience {title} in the Arcade Vault.</p>
            <a href="games/{game}/index.html" class="play-btn">PLAY NOW</a>
        </div>
        '''

    # Replace the Jinja2 block in the template with our generated HTML
    # This is a bit of a hack but avoids needing to install Jinja2 for a simple build
    import re
    result = re.sub(r'\{% for game in games %\}.*?\{% endfor %\}', game_cards_html, template, flags=re.DOTALL)
    
    # Clean up other Jinja2 variables
    result = result.replace('{{ games|length }}', str(len(games)))

    # Write the static index.html
    with open('dist/index.html', 'w', encoding='utf-8') as f:
        f.write(result)

    print("✅ Build complete! Open 'dist/index.html' to test, or push 'dist' contents to GitHub Pages.")

if __name__ == "__main__":
    build_static()
