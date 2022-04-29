#!/bin/bash

# Check env file exists
echo "Checking .env file..."
test -e .env || (echo '.env file does not exist' && exit)

# Read and export env vars from .env
echo "Loading env vars from .env file..."
source .env

pip3 install j2cli

# # Check if docker compose is installed
# if ! [ -x "$(command -v j2)" ]; then
#   echo -n "Error: j2 is not installed..." >&2
#   exit 1
# fi

# Create inventory hosts file
echo "Creating inventory hosts file..."
j2 --format=env templates/hosts.j2 .env > inventory/hosts

# Create inventory host vars.yml
OUTPUT_FOLDER=inventory/host_vars/$SUBDOMAIN.$MATRIX_DOMAIN/
mkdir -p $OUTPUT_FOLDER
echo "Generated vars.yaml moved to: $OUTPUT_FOLDER"
j2 --format=env templates/vars.yml.j2 .env > $OUTPUT_FOLDER/vars.yml

# Copy auth provider plugin
echo "Password auth provider moved to: $OUTPUT_FOLDER"
cp templates/decentraland_password_auth_provider.py $OUTPUT_FOLDER

echo "Done!"