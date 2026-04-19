variable "aws_region" {
  description = "Región de AWS para el despliegue"
  type        = string
  default     = "sa-east-1"
}

variable "project_name" {
  description = "Nombre base del proyecto"
  type        = string
  default     = "multiperfil"
}

variable "environment" {
  description = "Entorno (prod o qa)"
  type        = string
  default     = "qa"
}

variable "owner" {
  description = "Dueño de los recursos"
  type        = string
  default     = "IIMP"
}

variable "vpc_cidr" {
  description = "Bloque CIDR para la VPC aislada (10.50.0.0/16 para prod, 10.51.0.0/16 para qa)"
  type        = string
  default     = "10.50.0.0/16"
}

# --- Aplicación y Base de Datos ---

variable "db_user" {
  type      = string
  sensitive = true
}

variable "db_pass" {
  type      = string
  sensitive = true
}

variable "app_version" {
  type    = string
  default = "V1"
}

variable "api_base_path" {
  type    = string
}

variable "api_domain" {
  type    = string
}

variable "next_public_api_key" {
  type      = string
  sensitive = true
}

variable "api_base_path_qa" {
  description = "NEXT_PUBLIC_API_BASE_PATH para QA"
  type        = string
  default     = "/KBServiciosPruebaIIMPJavaEnvironment/rest"
}

variable "api_base_path_prod" {
  description = "NEXT_PUBLIC_API_BASE_PATH para Prod"
  type        = string
  default     = "/KBServiciosIIMPJavaEnvironment/rest"
}

# --- SMTP ---
variable "smtp_from" {
  type    = string
  default = "postmast@iimp.org.pe"
}

variable "smtp_host" {
  type    = string
  default = "smtp-relay.sendinblue.com"
}

variable "smtp_user" {
  type    = string
  default = "postmast@iimp.org.pe"
}

variable "smtp_pass" {
  type      = string
  sensitive = true
  default   = ""
}

variable "smtp_port" {
  type    = string
  default = "587"
}
