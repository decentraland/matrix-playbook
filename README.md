# Matrix Playbook 

This repository contains a configuration of [this playbook](https://github.com/spantaleev/matrix-docker-ansible-deploy) to be used by our instances.

To extend this configuration, more information can be found in [PLAYBOOK.md](./PLAYBOOK.md).

## How to use it

Once you have an `.env` file with the requiered vars, you should run:

```bash
$ ./generate-inventory.sh
```

This script will prepare files to be ready for ansible to install matrix.

## Installation

In order to install Matrix using this playbook:

```bash
$ docker run -it --rm -w /work -v `pwd`:/work -v $HOME/.ssh/id_rsa:/root/.ssh/id_rsa:ro --entrypoint=/bin/sh docker.io/devture/ansible:2.11.6-r1

(inside docker container on `work`)
$ ansible-playbook -i inventory/hosts setup.yml --tags=setup-all
```

To start the services, you can add the `start` tag or run again:

```bash
$ ansible-playbook -i inventory/hosts setup.yml --tags=start
```

### Explanation

Using docker allow us to avoid ansible installation in the host, but will requiere SSH access from the container to the host and that's why the private IP is required as env variable and the private key is mounted in the docker command.   
The corresponding public key must be included in the `authorized_keys` in order to accept the connection from the container.