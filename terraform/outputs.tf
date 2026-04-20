output "ecr_repository_url" {
  value       = module.ecr.repository_url
  description = "URL del repositorio ECR para el Pipeline de GitLab"
}

output "github_ci_access_key" {
  value       = module.security.github_ci_access_key
  description = "AWS Access Key para configurar en GitHub Actions"
}

output "github_ci_secret_key" {
  value       = module.security.github_ci_secret_key
  description = "AWS Secret Key para configurar en GitHub Actions"
  sensitive   = true
}

output "alb_dns_prod" {
  value       = var.environment == "prod" ? module.compute_ecs.alb_dns_name : null
  description = "DNS del Load Balancer de Produccion"
}

output "robot_s3_access_key" {
  value = module.security.robot_s3_access_key
}

output "robot_s3_secret_key" {
  value     = module.security.robot_s3_secret_key
  sensitive = true
}
