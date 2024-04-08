#! /bin/bash

assets=$(find snake_assets -type f | sed "s/^/\'\//;s/$/\'\,/")

awk -v assets="$assets" '/#ASSETS#/{$0 = assets} 1' sw-template.js > sw.js
