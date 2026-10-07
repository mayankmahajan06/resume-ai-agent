#!/usr/bin/env bash

export PUPPETEER_CACHE_DIR="$(pwd)/.cache/puppeteer"

npm install
npx puppeteer browsers install chrome