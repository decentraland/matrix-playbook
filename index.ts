import * as aws from "@pulumi/aws"
import * as awsx from "@pulumi/awsx"
import * as pulumi from "@pulumi/pulumi"
import * as cloudflare from "@pulumi/cloudflare"

import { getAmi } from "dcl-ops-lib/getAmi"
import { getPublicBastionIp } from "dcl-ops-lib/supra"
import { setRecord, getZoneId } from "dcl-ops-lib/cloudflare"

export = async function main() {
  const ami = getAmi("ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-20200112", { owners: ["099720109477"] })

  const vpc = awsx.ec2.Vpc.getDefault()
  const stackName = pulumi.getStack()

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
  })

  const ec2 = new aws.ec2.Instance(
    "synapse-testing-instance",
    {
      ami,
      instanceType: "t2.medium" as pulumi.Input<aws.ec2.InstanceType>,
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
  )

  const elasticIp = new aws.ec2.Eip(`${stackName}-ip`, {
    vpc: true,
  })

  const elasticIpAssoc = new aws.ec2.EipAssociation(`${stackName}-ip-assoc`, {
    allocationId: elasticIp.id,
    instanceId: ec2.id,
  })

  setRecord({
    type: "A",
    proxied: true,
    value: elasticIpAssoc.publicIp,
    recordName: "test-synapse", // .decentraland.org
  })

  const cname = elasticIpAssoc.publicIp.apply((value) => `matrix.${value}`)

  setRecord({
    type: "CNAME",
    proxied: false,
    ttl: 1000,
    value: cname,
    recordName: "matrix-test-synapse", // .decentraland.org
  })

  elasticIp.publicIp.apply((ip) => console.log("elasticIp.publicIp", ip))
  elasticIpAssoc.publicIp.apply((ip) => console.log("elasticIpAssoc.publicIp", ip))

  const pageRuleTarget = elasticIp.publicDns.apply((publicDns) => `synapse-test.${publicDns}/*`)

  console.log("pageRuleTarget", pageRuleTarget)

  const pageRule = new cloudflare.PageRule("synapse-testing-instance", {
    zoneId: getZoneId(),
    target: pageRuleTarget,
    priority: 1,
    actions: {
      ssl: "flexible",
    },
  })

  return ec2
}
