#!/bin/bash
set -e -u -o pipefail

pm2 delete wc-discord || true
pm2 delete wc-website || true

cd /git/server/
git pull

cd /git/server/src-discord/app/
npm install

cd /git/server/src-discord/
npm install
pm2 start npm --name wc-discord -- start

cd /git/server/src-website/
npm install
pm2 start npm --name wc-discord -- start