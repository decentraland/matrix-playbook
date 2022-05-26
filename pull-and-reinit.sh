#!/bin/bash
set -euo pipefail
set -e

git fetch
HEADHASH=$(git rev-parse HEAD)
UPSTREAMHASH=$(git rev-parse main@{upstream})

if [ "$HEADHASH" != "$UPSTREAMHASH" ]
then
  echo "There are new changes to pull..."
  git pull

  echo "Regenerating inventory..."
  sh ./generate-inventory.sh

  echo "Rerunning playbook..."
  sh ./setup-and-start-playbook.sh

  echo "Done!"
  exit 0
else
  echo "Current branch is up to date with origin/main"
fi
