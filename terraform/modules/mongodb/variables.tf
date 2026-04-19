variable "project_name" {
  type        = string
  description = "Prefix for resource names"
}

variable "environment" {
  type        = string
  description = "Environment name (prod/qa)"
}

variable "vpc_id" {
  type = string
}

variable "private_subnets" {
  type        = list(string)
  description = "IDs of the private subnets where instances will be placed"
}

variable "mongodb_sg_id" {
  type        = string
  description = "Security Group ID for MongoDB instances"
}

variable "instance_type" {
  type    = string
  default = "t3.medium"
}

variable "db_user" {
  type = string
}

variable "db_pass" {
  type = string
}
