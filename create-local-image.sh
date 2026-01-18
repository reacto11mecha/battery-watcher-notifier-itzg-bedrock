set -xeuo pipefail

docker build -t rmecha/battery-watcher:latest .
docker save -o battery-watcher.tar rmecha/battery-watcher:latest
