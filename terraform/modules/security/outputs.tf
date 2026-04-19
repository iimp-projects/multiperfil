output "alb_sg_id" {
  value = aws_security_group.alb.id
}

output "ecs_tasks_sg_id" {
  value = aws_security_group.ecs_tasks.id
}

output "mongodb_sg_id" {
  value = aws_security_group.mongodb.id
}

output "ecs_task_execution_role_arn" {
  value = aws_iam_role.ecs_task_execution_role.arn
}

output "ecs_task_role_arn" {
  value = aws_iam_role.ecs_task_role.arn
}

output "backup_role_arn" {
  value = aws_iam_role.backup.arn
}

output "gitlab_ci_access_key" {
  value = aws_iam_access_key.gitlab_ci.id
}

output "gitlab_ci_secret_key" {
  value     = aws_iam_access_key.gitlab_ci.secret
  sensitive = true
}

output "robot_s3_access_key" {
  value = aws_iam_access_key.robot_s3.id
}

output "robot_s3_secret_key" {
  value     = aws_iam_access_key.robot_s3.secret
  sensitive = true
}
