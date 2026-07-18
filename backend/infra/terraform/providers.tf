provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ember"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
