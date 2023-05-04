#!/bin/bash
set -e -u -o pipefail

pm2 delete 0 1 2 3 4 5 || true

cd /git/server/
git pull

cd /git/server/app/
npm install

cd /git/server/src-cron/
rm app.log
rm app-error.log
npm install
pm2 start npm --name wc-cron -- start

cd /git/server/src-discord/
rm app.log
rm app-error.log
npm install
pm2 start npm --name wc-discord -- start

cd /git/server/src-website/
rm app.log
rm app-error.log
npm install
pm2 start npm --name wc-website -- start