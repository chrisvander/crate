import * as pulumi from "@pulumi/pulumi"
import * as cloudflare from "@pulumi/cloudflare"

const config = new pulumi.Config()
const zoneId = config.require("cloudflareZoneId")
const did = config.require("did")

new cloudflare.DnsRecord("atproto", {
  zoneId,
  name: "_atproto",
  content: `did=${did}`,
  type: "TXT",
  ttl: 1,
})

new cloudflare.DnsRecord("lexicon", {
  zoneId,
  name: "_lexicon",
  content: `did=${did}`,
  type: "TXT",
  ttl: 1,
})
