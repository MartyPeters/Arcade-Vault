import os
from flask import Flask, render_template, send_from_directory, redirect, url_for

app = Flask(__name__)

GAMES = [
    {
        'id': 'donkey-kong',
        'title': 'Donkey Kong 2077',
        'description': 'Scale the neon-drenched spires of Neo-Tokyo to rescue the captive from a rogue bionic gorilla.',
        'icon': '⚡',
        'poster': '/static/images/donkey_kong_poster.png',
        'color': '#ff9500',
        'glow': 'rgba(255,102,0,0.4)',
    },
    {
        'id': 'space-invaders-2077',
        'title': 'Space Invaders 2077',
        'description': 'A high-octane cyberpunk reimagining with procedural music, dual-weapon systems, and massive boss battles.',
        'icon': '🚀',
        'poster': '/static/images/space_invaders_poster.png',
        'color': '#00ffff',
        'glow': 'rgba(0,255,255,0.4)',
    },
]


@app.route('/')
def hub():
    return render_template('hub.html', games=GAMES)


@app.route('/play/<game_name>')
def play_redirect(game_name):
    return redirect(url_for('play_game', game_name=game_name))


@app.route('/play/<game_name>/')
def play_game(game_name):
    game_dir = os.path.join('games', game_name)
    if not os.path.isdir(game_dir):
        return f'Game "{game_name}" not found', 404
    return send_from_directory(game_dir, 'index.html')


@app.route('/play/<game_name>/<path:filename>')
def game_static(game_name, filename):
    return send_from_directory(os.path.join('games', game_name), filename)


if __name__ == '__main__':
    print('\n🕹️  Arcade Vault is running!')
    print('   Local:   http://localhost:5000')
    import socket
    try:
        ip = socket.gethostbyname(socket.gethostname())
        print(f'   Network: http://{ip}:5000  (share this with your son!)\n')
    except Exception:
        pass
    app.run(host='0.0.0.0', port=5000, debug=True)
