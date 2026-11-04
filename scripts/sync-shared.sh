#!/bin/sh
# Copies the shared core into both targets (Chrome extensions can't import files outside their folder).
set -e
cd "$(dirname "$0")/.."
for dest in extension/shared web/shared; do
  rm -rf "$dest" && mkdir -p "$dest" && cp shared/* "$dest/"
done
echo "Synced shared/ -> extension/shared, web/shared"
