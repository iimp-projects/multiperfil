output "alb_dns_name" {
  value       = var.enable_alb ? aws_lb.this[0].dns_name : null
  description = "DNS name of the application load balancer"
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "ecs_service_name" {
  value = aws_ecs_service.this.name
}
