locals {
  env = terraform.workspace == "default" ? var.environment : terraform.workspace
}

# Modulo de Registro de Contenedores (ECR - Global)
module "ecr" {
  source       = "./modules/ecr"
  project_name = var.project_name
  environment  = local.env
}

# Modulo de Red (VPC Aislada en sa-east-1)
module "vpc" {
  source       = "./modules/vpc"
  vpc_cidr     = local.env == "prod" ? "10.50.0.0/16" : "10.51.0.0/16"
  project_name = var.project_name
  environment  = local.env
}

# Modulo de Seguridad (IAM y SGs en sa-east-1)
module "security" {
  source       = "./modules/security"
  vpc_id       = module.vpc.vpc_id
  project_name = var.project_name
  environment  = local.env
  bucket_arn   = module.storage.bucket_arn
}

# Modulo de Almacenamiento (S3 en sa-east-1 con Ciclo de Vida)
module "storage" {
  source       = "./modules/storage"
  project_name = var.project_name
  environment  = local.env
}

# Modulo de Base de datos (MongoDB replica set en Prod y QA)
module "mongodb" {
  source          = "./modules/mongodb"
  project_name    = var.project_name
  environment     = local.env
  instance_type   = local.env == "prod" ? "t3.medium" : "t3.micro"
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  mongodb_sg_id   = module.security.mongodb_sg_id
  db_user         = var.db_user
  db_pass         = var.db_pass
}

# Modulo de Backup (AWS Backup en sa-east-1)
module "backup" {
  source          = "./modules/backup"
  project_name    = var.project_name
  environment     = local.env
  backup_role_arn = module.security.backup_role_arn
}

locals {
  app_environment = [
    { name = "NEXT_PUBLIC_APP_VERSION", value = var.app_version },
    { name = "NEXT_PUBLIC_API_BASE_PATH", value = local.env == "prod" ? "/KBServiciosIIMPJavaEnvironment/rest" : "/KBServiciosPruebaIIMPJavaEnvironment/rest" },
    { name = "NEXT_PUBLIC_API_DOMAIN", value = "https://secure2.iimp.org:8443" },
    { name = "NEXT_PUBLIC_API_KEY", value = "NqP4ymWMM6Qyovruc6qEL4xBsyvnHJekQI4Xjwp3XRpcW3qSRxSMeUfChPdi8iYK" },
    { name = "SMTP_FROM", value = var.smtp_from },
    { name = "SMTP_HOST", value = var.smtp_host },
    { name = "SMTP_USER", value = var.smtp_user },
    { name = "SMTP_PASS", value = var.smtp_pass },
    { name = "SMTP_PORT", value = var.smtp_port },
    { name = "S3_BUCKET_NAME", value = module.storage.bucket_name },
    { name = "AWS_REGION", value = "sa-east-1" },
    { name = "DATABASE_URL", value = local.env == "prod" ? "mongodb://${var.db_user}:${var.db_pass}@${module.mongodb.primary_private_ip}:27017,${module.mongodb.secondary_private_ip}:27017,${module.mongodb.arbiter_private_ip}:27017/multiperfil?replicaSet=rs0&authSource=multiperfil&connectTimeoutMS=10000&socketTimeoutMS=10000" : "mongodb://${var.db_user}:${var.db_pass}@${module.mongodb.primary_private_ip}:27017/multiperfil?replicaSet=rs0&authSource=multiperfil&connectTimeoutMS=10000&socketTimeoutMS=10000" }
  ]
}

# Modulo de Capa de Aplicacion (ECS + ALB en Prod, ECS Solo en QA)
module "compute_ecs" {
  source                = "./modules/compute_ecs"
  project_name          = var.project_name
  environment           = local.env
  vpc_id                = module.vpc.vpc_id
  public_subnets        = module.vpc.public_subnets
  private_subnets       = module.vpc.private_subnets
  alb_sg_id             = module.security.alb_sg_id
  ecs_tasks_sg_id       = module.security.ecs_tasks_sg_id
  execution_role_arn    = module.security.ecs_task_execution_role_arn
  task_role_arn         = module.security.ecs_task_role_arn
  container_image       = "${module.ecr.repository_url}:${local.env == "prod" ? "main" : "develop"}"
  container_port        = 3000
  container_environment = local.app_environment
  enable_alb            = true
  assign_public_ip      = false
}

# Modulo de Capa Edge (Route53 + CloudFront + SSL)
module "edge" {
  source          = "./modules/edge"
  project_name    = var.project_name
  environment     = local.env
  alb_domain_name = module.compute_ecs.alb_dns_name

  providers = {
    aws = aws.us_east_1
  }
}

# Modulo de Automatizacion (Solo en QA)
module "automation" {
  count        = local.env == "qa" ? 1 : 0
  source       = "./modules/automation"
  project_name = var.project_name
  environment  = local.env
}
