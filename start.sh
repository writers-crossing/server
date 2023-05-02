#!/bin/bash

cd /git/server/src-discord/
pm2 start --name wc-discord index.js

cd /git/server/src-site/
pm2 start --name wc-site index.js

pm2 save