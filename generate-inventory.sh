#!/bin/bash
set -euo pipefail
set -e
# set -u

# Check env file exists
echo "Checking .env file..."
[ -f .env ] || (echo '.env file does not exist' && exit 1)

# Read and export env vars from .env
echo "Loading env vars from .env file..."
export $(cat .env | xargs)

# Check prometheus posgres env vars are present
if [ $USE_PROMETHEUS_POSTGRES_EXPORTER = true ]; then
  [ ! -v "${PROMETHEUS_EXPORTER_POSTGRES_USER}" ] || [ ! -z "${PROMETHEUS_EXPORTER_POSTGRES_USER}" ] || (echo 'PROMETHEUS_EXPORTER_POSTGRES_USER is not defined or empty and is required to setup prometheus exporter for DB' && exit 1)
  [ ! -v "${PROMETHEUS_EXPORTER_POSTGRES_HOST}" ] || [ ! -z "${PROMETHEUS_EXPORTER_POSTGRES_HOST}" ] || (echo 'PROMETHEUS_EXPORTER_POSTGRES_HOST is not defined or empty and is required to setup prometheus exporter for DB' && exit 1)
fi

# Check posgres env vars are present
if [ $USE_EXTERNAL_DB = true ]; then
  [ ! -v "${POSTGRES_USER}" ] || [ ! -z "${POSTGRES_USER}" ] || (echo 'POSTGRES_USER is not defined or empty and is required to setup external DB' && exit 1)
  [ ! -v "${POSTGRES_PASSWORD}" ] || [ ! -z "${POSTGRES_PASSWORD}" ] || (echo 'POSTGRES_PASSWORD is not defined or empty and is required to setup external DB' && exit 1)
  [ ! -v "${POSTGRES_HOST}" ] || [ ! -z "${POSTGRES_HOST}" ] || (echo 'POSTGRES_HOST is not defined or empty and is required to setup external DB' && exit 1)
  [ ! -v "${POSTGRES_DATABASE}" ] || [ ! -z "${POSTGRES_DATABASE}" ] || (echo 'POSTGRES_DATABASE is not defined or empty and is required to setup external DB' && exit 1)
fi

if [ $USE_ELASTI_CACHE = true ]; then
  [ ! -v "${REDIS_HOST}" ] || [ ! -z "${REDIS_HOST}" ] || (echo 'REDIS_HOST is not defined or empty and is required to setup external Redis' && exit 1)
  [ ! -v "${REDIS_PORT}" ] || [ ! -z "${REDIS_PORT}" ] || (echo 'REDIS_PORT is not defined or empty and is required to setup external Redis' && exit 1)
fi

# Check if jinja 2 is installed
if ! [ -x "$(command -v j2)" ]; then
  echo -n "Error: j2 is not installed..." >&2
  exit 1
fi

# Create inventory hosts file
echo "Creating inventory hosts file..."
j2 --format=env templates/hosts.j2 .env >inventory/hosts

# Create inventory host vars.yml
OUTPUT_FOLDER=inventory/host_vars/$SUBDOMAIN.$MATRIX_DOMAIN/
mkdir -p $OUTPUT_FOLDER
echo "Generated vars.yaml moved to: $OUTPUT_FOLDER"
j2 --format=env templates/vars.yml.j2 .env >$OUTPUT_FOLDER/vars.yml

# Copy auth provider plugin
if [ $USE_DECENTRALAND_PASSWORD_PROVIDER = true ]; then
  echo "Password auth provider moved to: $OUTPUT_FOLDER"
  cp templates/decentraland_password_auth_provider.py $OUTPUT_FOLDER
fi

echo "Done!"
