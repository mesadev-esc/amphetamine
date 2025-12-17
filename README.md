<h1 align="center">Amphetamine</h1>
<p align="center">Amphetamine is (currently) a fast and secure web proxy that lets you browse the internet freely and access content without restrictions. Amphetamine uses Scramjet, along with wisp-server-python and CurlTransport for reliable speed while maintaining a fully functional service.</p>
<h2 align="center">Supported sites</h2>
<p>Thanks to scramjet's proxy support, Amphetamine supports various sites, such as:</p>
- [Google](https://google.com)
- [Twitter](https://twitter.com)
- [Instagram](https://instagram.com)
- [Youtube](https://youtube.com)
- [Spotify](https://spotify.com)
- [Discord](https://discord.com)
- [Reddit](https://reddit.com)
- [GeForce NOW](https://play.geforcenow.com/)
NOTE: If you plan to play any games using GeForce NOW you must link your accounts through a home device. A patch is currently being worked on to fix this annoying experience.

## Usage
You will need Node.js 16+ and Git installed; below is an example for Debian/Ubuntu setup. For devices running other operating systems, please wait until a solution is made.

```
sudo apt update
sudo apt upgrade
sudo apt install curl git nginx

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install 20
nvm use 20

git clone https://github.com/mesadev-esc/amphetamine
cd amphetamine
```

Install dependencies
```
pnpm install
```

Run the scram server (terminal one):
```
pnpm start
```
### Before continuing to this step, create a virtual environment!
Run the wisp-server-python server (terminal two):
```
cd ./wisp-server-python
python3 -m wisp.server
```
If you encounter any issues through this process, either create an issue OR DM me on discord: @mesadev
