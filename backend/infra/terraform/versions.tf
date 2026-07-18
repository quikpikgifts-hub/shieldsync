terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state is deliberately not configured here — this repository has no AWS account
  # to hold a state bucket in yet. Before the first real `terraform apply`, configure a
  # backend (an S3 bucket + DynamoDB lock table, created once, by hand or via a small
  # bootstrap config outside this module) and add a `backend "s3" {}` block here. Applying
  # with local state against a real AWS account is possible but not recommended beyond a
  # first smoke test — see infra/terraform/README.md.
}
