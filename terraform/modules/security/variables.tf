variable "vpc_id" {
  type        = string
  description = "VPC ID where security groups will be created"
}

variable "project_name" {
  type        = string
  description = "Prefix for resource names"
}

variable "environment" {
  type        = string
  description = "Environment name (prod/qa)"
}

variable "bucket_arn" {
  type        = string
  description = "ARN of the S3 bucket for files"
}
