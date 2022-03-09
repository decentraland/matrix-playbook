import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";

import { getAmi } from "dcl-ops-lib/getAmi";
import { getPublicBastionIp } from "dcl-ops-lib/supra";

export = async function main() {
  const ami = getAmi("ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-20200112", { owners: ["099720109477"] });

  const vpc = awsx.ec2.Vpc.getDefault();
  const securityGroup = new aws.ec2.SecurityGroup("synapse-test-security", {
    vpcId: vpc.id,
    egress: [
      {
        cidrBlocks: ["0.0.0.0/0"],
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
      },
    ],
    ingress: [
      {
        // access from the bastion
        cidrBlocks: [pulumi.interpolate`${getPublicBastionIp()}/32`],
        fromPort: 22,
        toPort: 22,
        protocol: "tcp",
      },
      {
        cidrBlocks: ["0.0.0.0/0"],
        fromPort: 80,
        toPort: 65535,
        protocol: "tcp",
      },
      {
        cidrBlocks: ["0.0.0.0/0"],
        fromPort: 80,
        toPort: 65535,
        protocol: "udp",
      },
    ],
  });

  const keypair = new aws.ec2.KeyPair("synapse-test-key", {
    publicKey:
      "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDPO3ZtWmSh6IA4poXs82t8+EoUo6QNnwSf45PNhh474JK648LFMR/e0VvVH+QCwwBV6JqzSmDYl0g7GL1r4Bzx5mAES+MuPec+GxYlTekErToGwj/6O+n0vXS+5XRqR2dgflwSj0pOSqgNpwtpOBcTp7+LOQt+vYCqocvIq/IWFnuuOEe2NeQrfI31V2b9oQr3vB2qQFqr5dFSTndcdaa76jwhiZO5Bpxz/DwBPEEknhSU9dhOcgyKiKIr/DlsaADaf3WObHreflEgnjk6cp36Wx5ioP+56xjESKXLXfJGOsHjG022hpctIeGIFoMK2/Jt5G7Mjr+bvU2PiSI1caMbi1uVIwxdtijEcWEIdI4fYHPy4cpAUpEEdfDrvwPr/Xc0krY6a09LaR9n8tjVhoIhJ3Pd5+W2b37cFgXp5qlTryU76BGO+27lqR3hA8761nWB2XMvf+RDt269WapU+se0Xg0r4rQgsmXE+jMdCO/Kf1Mh7qjMqzT48jT9Xcy5H/L7brsqJw4IgrQutcLieM37yUgBxLGz49RLggnfs61cimChvNG0cm9FFeWMDJY3BovGsVeY1eB0TgiFAlPWKrCAg1kaL58e10KWJ9gmZFyVZnocW0C4ZS2AEgbuQNLmm5fsuW+bWv3s6HeYJ0DX5tH5MWKq9mehBf2AVzD72MyQXQ==",
    keyName: "synapse-test-key",
  })

  const ec2 = new aws.ec2.Instance(
    "synapse-testing-instance",
    {
      ami,
      instanceType: "t2.micro" as pulumi.Input<aws.ec2.InstanceType>,
      associatePublicIpAddress: true,
      keyName: "synapse-test-key",

      // gracefully stop the machine to not corrupt any data
      instanceInitiatedShutdownBehavior: "stop",

      vpcSecurityGroupIds: [securityGroup.id],
    },
    {
      deleteBeforeReplace: true,
      protect: false,
      dependsOn: [],
    }
  );

  return ec2

}
