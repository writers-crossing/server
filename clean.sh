#!/bin/bash
set -e -u -o pipefail

pm2 delete 0 1 2 3 4 5 || true

cd /git/server/app/
rm -rf node_modules || true

cd /git/server/src-cron/
rm app.log || true
rm app-error.log || true
rm -rf node_modules || true

cd /git/server/src-discord/
rm app.log || true
rm app-error.log || true
rm -rf node_modules || true

cd /git/server/src-website/
rm app.log || true
rm app-error.log || true
rm -rf node_modules || true