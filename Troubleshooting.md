1. To run the setup first run `ansible-playbook -i inventory/hosts setup.yml --tags=setup-all` </br> Then run `ansible-playbook -i inventory/hosts setup.yml --tags=start`
1. To uninstall the setup run `/usr/local/bin/matrix-remove-all` on the host machine
1. Always make sure to uninstall and reinstall from the start when changing the domain
1. Make sure that the roles for nginx allows for the full domain name
    1. To do so go into `roles/matrix-nginx-proxy/templates/nginx/conf.d/nginx-http.conf.j2`, edit the `server_names_hash_bucket_size` to 128/256 if needed (when using default dns via amazon 128 is enough)
