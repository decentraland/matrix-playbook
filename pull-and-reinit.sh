#!/bin/bash
set -euo pipefail
set -e

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]
then
  echo "Not on main branch. Aborting."
  exit 0
fi

git fetch
HEADHASH=$(git rev-parse HEAD)
UPSTREAMHASH=$(git rev-parse main@{upstream})

if [ "$HEADHASH" != "$UPSTREAMHASH" ]
then
  echo "There are new changes to pull..."
  git pull
  success=$?

  # only regenerate and restart if success
  if [[ $success -eq 0 ]];
  then
    echo "Regenerating inventory..."
    sh ./generate-inventory.sh

    echo "Rerunning playbook..."
    sh ./setup-and-start-playbook.sh

    echo "Done!"
  else
    echo "Couldn't pull changes, cancelling script."
  fi

  exit 0
else
  echo "Current branch is up to date with origin/main"
fi
