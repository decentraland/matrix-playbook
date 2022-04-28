
# Check env file exists
echo "Checking .env file..."
if [[ ! -f .env ]]; then
    echo ".env file does not exist"
    exit
fi

# Read and export env vars from .env
echo "Loading env vars from .env file..."
export $(grep -v '^#' .env | xargs)

# Set subdomain default if not set
: "${SUBDOMAIN:=synapse}"

# Create inventory hosts file
echo "Creating inventory hosts file..."
sed -e "s/MATRIX_DOMAIN/$MATRIX_DOMAIN/g" -e "s/PRIVATE_IP/${PRIVATE_IP}/g" -e "s/SSH_USER/$SSH_USER/g" -e "s/SUBDOMAIN/$SUBDOMAIN/g" templates/hosts > inventory/hosts

# Create inventory host vars.yml
OUTPUT_FOLDER=inventory/host_vars/$SUBDOMAIN.$MATRIX_DOMAIN/
mkdir -p $OUTPUT_FOLDER
sed -e "s/MATRIX_DOMAIN/$MATRIX_DOMAIN/g" -e "s/GENERIC_SECRET_KEY/$GENERIC_SECRET_KEY/g" -e "s/POSTGRES_PASSWORD/$POSTGRES_PASSWORD/g" -e "s/SUBDOMAIN/$SUBDOMAIN/g" templates/vars.yml > $OUTPUT_FOLDER/vars.yml
echo "Generated vars.yaml moved to: $OUTPUT_FOLDER"

# Copy auth provider plugin
echo "Password auth provider moved to: $OUTPUT_FOLDER"
cp templates/decentraland_password_auth_provider.py $OUTPUT_FOLDER

echo "Done!"