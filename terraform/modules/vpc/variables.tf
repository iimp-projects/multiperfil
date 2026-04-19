variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the isolated VPC"
}

variable "project_name" {
  type        = string
  description = "Prefix for resource names"
}

variable "environment" {
  type        = string
  description = "Environment name (prod/qa)"
}
