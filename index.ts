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

  const ec2 = new aws.ec2.Instance(
    "synapse-testing-instance",
    {
      ami,
      instanceType: "t2.micro" as pulumi.Input<aws.ec2.InstanceType>,
      associatePublicIpAddress: true,

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
