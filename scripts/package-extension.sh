#!/bin/sh
# Builds web/grove-extension.zip so website visitors can download the extension.
set -e
cd "$(dirname "$0")/.."
sh scripts/sync-shared.sh
rm -f web/grove-extension.zip
(cd extension && zip -qr ../web/grove-extension.zip . -x '.*' -x '*/.*')
echo "Built web/grove-extension.zip ($(du -h web/grove-extension.zip | cut -f1))"
