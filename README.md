# Battery Watcher

Just a simple battery watcher if you run the [itzg's minecraft bedrock server](https://github.com/itzg/docker-minecraft-bedrock-server) on an old laptop that have no screen but you are too lazy to ssh and type acpi every time you play minecraft.

## Current Feature

- Tell the player the state of battery percentage charge/drain every 10%
- Tell the player the state of AC adapter
- Send percentage and charging status to somewhere else (I need this for my own ESP32 oled screen)

## Usage

You could build the image with command

```sh
docker build -t rmecha/battery-watcher:latest .
```

and here's the docker compose

```yml
services:
  watcher:
    image: rmecha/battery-watcher:latest
    environment:
      ITZG_BEDROCK_SRV_CONTAINER_NAME: "bedrock-server-1" # REQUIRED!
      API_PATH: "http://example.com/battery" # for send it to somewhere
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    container_name: battery-watcher
    restart: unless-stopped
```

or you could run

```
./create-local-image.sh
```

to build the image and save it to your local machine so that u could push and use it somewhere else.
