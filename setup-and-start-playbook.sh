#!/bin/bash
set -euo pipefail
set -e
# set -u

# Check ansible is installed
if ! [ -x "$(command -v ansible)" ]; then
  echo -n "Error: ansible is not installed..." >&2
  exit 1
fi

echo "Running playbook (setup-all and start) ..."
ansible-playbook -i inventory/hosts setup.yml --tags=setup-all,start

echo "Done! (setup-all and start)"
