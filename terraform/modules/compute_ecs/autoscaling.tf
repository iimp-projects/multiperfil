# Autoscaling Target para el servicio ECS (Solo en Prod)
resource "aws_appautoscaling_target" "ecs_target" {
  count              = var.environment == "prod" ? 1 : 0
  max_capacity       = 20
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.this.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Politica de Escalado por CPU (Solo en Prod)
resource "aws_appautoscaling_policy" "ecs_policy_cpu" {
  count              = var.environment == "prod" ? 1 : 0
  name               = "${var.project_name}-${var.environment}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 70.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    scale_out_cooldown = 60
    scale_in_cooldown  = 300
  }
}

# Politica de Escalado por Memoria (Solo en Prod)
resource "aws_appautoscaling_policy" "ecs_policy_memory" {
  count              = var.environment == "prod" ? 1 : 0
  name               = "${var.project_name}-${var.environment}-ram-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 80.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    scale_out_cooldown = 60
    scale_in_cooldown  = 300
  }
}

# Politica de Escalado por ALB Request Count (Solo en Prod con ALB)
resource "aws_appautoscaling_policy" "ecs_policy_requests" {
  count              = (var.environment == "prod" && var.enable_alb) ? 1 : 0
  name               = "${var.project_name}-${var.environment}-req-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 2000.0
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.this[0].arn_suffix}/${aws_lb_target_group.this[0].arn_suffix}"
    }
    scale_out_cooldown = 60
    scale_in_cooldown  = 300
  }
}
