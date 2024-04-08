#! /bin/bash

js=$(find js -type f | sed "s/^/\'\//;s/$/\'\,/")
assets=$(find snake_assets -type f | sed "s/^/\'\//;s/$/\'\,/")

awk -v assets="$assets" -v js="$js" '/#ASSETS#/{$0 = assets} /#JS#/{$0 = js} 1' sw-template.js > sw.js
