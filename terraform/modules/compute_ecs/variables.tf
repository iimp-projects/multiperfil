variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnets" {
  type = list(string)
}

variable "private_subnets" {
  type = list(string)
}

variable "alb_sg_id" {
  type = string
}

variable "ecs_tasks_sg_id" {
  type = string
}

variable "execution_role_arn" {
  type = string
}

variable "task_role_arn" {
  type        = string
  description = "IAM Role for the ECS task itself (app permissions)"
  default     = null
}

variable "container_image" {
  type        = string
  description = "Docker image URI"
}

variable "container_port" {
  type    = number
  default = 3000
}

variable "enable_alb" {
  description = "Set to true to create and use an ALB"
  type        = bool
  default     = true
}

variable "assign_public_ip" {
  description = "Assign public IP to ECS tasks"
  type        = bool
  default     = false
}

variable "container_environment" {
  description = "List of environment variables for the container"
  type        = list(map(string))
  default     = []
}
