# Check env file exists
test -e .env || echo '.env file does not exist' && exit

# Read and export env vars from .env
export $(grep -v '^#' .env | xargs -d '\n')

# Create inventory hosts file
sed -e "s/MATRIX_DOMAIN/$MATRIX_DOMAIN/g" -e "s/PRIVATE_IP/${PRIVATE_IP}/g" -e "s/SSH_USER/$SSH_USER/g" templates/hosts > inventory/hosts

# Create inventory host vars.yml
OUTPUT_FOLDER=inventory/host_vars/matrix.$MATRIX_DOMAIN/
mkdir -p $OUTPUT_FOLDER
sed -e "s/MATRIX_DOMAIN/$MATRIX_DOMAIN/g" -e "s/GENERIC_SECRET_KEY/$GENERIC_SECRET_KEY/g" -e "s/POSTGRES_PASSWORD/$POSTGRES_PASSWORD/g" templates/vars.yml > $OUTPUT_FOLDER/vars.yml

# Copy auth provider plugin
cp templates/decentraland_password_auth_provider.py $OUTPUT_FOLDER