output "alb_dns_name" {
  value       = var.enable_alb ? aws_lb.this[0].dns_name : null
  description = "DNS name of the application load balancer"
}

output "alb_zone_id" {
  value       = var.enable_alb ? aws_lb.this[0].zone_id : null
  description = "Canonical hosted zone ID of the load balancer"
}

output "alb_cert_arn" {
  value       = var.environment == "qa" ? aws_acm_certificate.alb_cert[0].arn : null
  description = "ARN of the ALB certificate"
}

output "alb_cert_validation_options" {
  value       = var.environment == "qa" ? aws_acm_certificate.alb_cert[0].domain_validation_options : []
  description = "Validation options for the ALB certificate"
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "ecs_service_name" {
  value = aws_ecs_service.this.name
}
