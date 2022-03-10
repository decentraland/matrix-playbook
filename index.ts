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

  const keypair = new aws.ec2.KeyPair("bastion", {
    publicKey:
      "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCxAJ7s/FJnvasStDeq391PYHKi2iTrM9GB+XY0NJp7TII310LpGcikaj1IkrhmitdXZK0wrSfQalhviBWMnp0ebQilv+6IEZaTALVeAzZoHZEO83/zsqe7nXyfLUuT7OL6/COy9N2hie9/2yj9beYEZlnSwBi0N9qMr3vglJopCfxOj8RFzw7hq2qJMtjgTN9HKERHekov5N3JHsWkS8YfCpo9FCBqo3fXh3NZ4Ekkd8xsj+8wN4AlulVl8/5HWaTZ16ZTFBvj7j/aqFITx1t3ools2x450r/oCaB/+J+d0zmvc76iItS2FBOiOpby9IF0HVe9LNAavw6Gsov/DVUr",
    keyName: "bastion",
  })


  const ec2 = new aws.ec2.Instance(
    "synapse-testing-instance",
    {
      ami,
      instanceType: "t2.micro" as pulumi.Input<aws.ec2.InstanceType>,
      associatePublicIpAddress: true,
      keyName: "bastion",

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
