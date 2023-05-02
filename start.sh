#!/bin/bash

pm2 delete wc-discord || true
pm2 delete wc-site || true

cd /git/server/
git pull

cd /git/server/src-discord/
npm install
pm2 start --name wc-discord index.js

cd /git/server/src-site/
npm install
pm2 start --name wc-site index.js