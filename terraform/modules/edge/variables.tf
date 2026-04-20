variable "project_name" { type = string }
variable "environment" { type = string }
variable "alb_domain_name" { type = string }
variable "alb_zone_id" { type = string }
variable "alb_cert_arn" { 
  type = string
  default = null 
}
variable "alb_cert_validation_options" { 
  type = any
  default = [] 
}
