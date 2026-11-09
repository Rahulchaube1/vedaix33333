#!/bin/sh
set -e

echo "Starting SearXNG..."

sudo -H -u searxng bash -c "cd /usr/local/searxng/searxng-src && export SEARXNG_SETTINGS_PATH='/etc/searxng/settings.yml' && export FLASK_APP=searx/webapp.py && /usr/local/searxng/searx-pyenv/bin/python -m flask run --host=127.0.0.1 --port=8080" &
SEARXNG_PID=$!

echo "Waiting for SearXNG to be ready..."
sleep 5

COUNTER=0
MAX_TRIES=30
until curl -s http://localhost:8080 > /dev/null 2>&1; do
  COUNTER=$((COUNTER+1))
  if [ $COUNTER -ge $MAX_TRIES ]; then
    echo "Warning: SearXNG health check timeout, but continuing..."
    break
  fi
  sleep 1
done

if curl -s http://localhost:8080 > /dev/null 2>&1; then
  echo "SearXNG started successfully (PID: $SEARXNG_PID)"
else
  echo "SearXNG may not be fully ready, but continuing (PID: $SEARXNG_PID)"
fi

cd /home/vane
echo "Ensuring application directories and manifests..."
mkdir -p /home/vane/data /home/vane/uploads /home/vane/data/data /home/vane/.next/server
if [ ! -f /home/vane/.next/server/preview-props.json ]; then
  echo '{"previewModeId":"","previewModeSigningKey":"","previewModeEncryptionKey":""}' > /home/vane/.next/server/preview-props.json
fi

echo "Starting Vane..."

exec node server.js