# Create SSH Key 
ssh-keygen -q -t rsa -N '' -f ~/.ssh/id_rsa <<<y >/dev/null 2>&1

# Add pub key to ~/.ssh/authorized_keys 
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
