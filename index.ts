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
        fromPort: 10000,
        toPort: 65535,
        protocol: "-1",
      },
    ],
  });

  const keypair = new aws.ec2.KeyPair("synapse-test-key", {
    publicKey:
      "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDi1PEwphJL2RN7ns76mFpKLVLkYm1LO8q2w7pbrE/HI34FNFVZ0nCb2OKmyIOMNOjXBIar2iVVQ0TV+C72uiCOA7oPxsx1KS90XvsN7rJWEiUINmeRQOWavnslkV5D7sPARnS2h/zFUwf9al6atUqjz7q0vhuQHKBraFwKAO75hekmVvNQkTixOg0FU0JJEoKgFschjB5+VPkG6WCDRWFA9ur2N9EedUIgdIT4HDycmafoJ25e54eUp72SVRbsd3Q4aCmVBmxgMNG6nawo4YhWeWvCcxIRi19/O8JQbLwWhYcbyTngGH70mJwNAQsGSbNReOEOcONSh9BQFNhVwIrsyCbYzlO8WOD5TQGT/YK6eK9nUSMUH+fYBMKW+M/1F7q2qx264mEWdkzECTjLUEoXElfq02DNu3fr97J6vE0pz9aThJ3l9wYfwcxryBx1F+0EQDsGc7u2/5iAy73846g894jy8PlesTsX5YvghkXU4t+W7uOLciMJ7RJgCi72IU69RRN/hjI1Cw5Z/Mqt+DyYg76oOn3r1DIDagAdn2t2K82EgzQrI46kBCjCgXKG1UZq98AoX/A/jjBdda8l0+9vrde5swC0yuUQQgLU+MzpiT967JoQGz7MWb/IPag0L6pt3XY4catOkqFE4+E5VvgIx9NM0qm6jtdosfe4+1buZQ==",
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