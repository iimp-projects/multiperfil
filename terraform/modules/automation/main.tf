# VPC Module Update for QA Cost Optimization

# NAT Instance Logic (Existing in modules/vpc/main.tf)
# Ensure the NAT Instance has the "Schedule" tag

# Scheduler resources (EventBridge + SSM)
resource "aws_cloudwatch_event_rule" "stop_qa" {
  count               = var.environment == "qa" ? 1 : 0
  name                = "${var.project_name}-stop-qa-nightly"
  description         = "Apaga recursos de QA a las 19:00 PET"
  schedule_expression = "cron(0 0 * * ? *)" # 00:00 UTC = 19:00 PET
}

resource "aws_cloudwatch_event_rule" "start_qa" {
  count               = var.environment == "qa" ? 1 : 0
  name                = "${var.project_name}-start-qa-morning"
  description         = "Enciende recursos de QA a las 08:00 PET"
  schedule_expression = "cron(0 13 * * ? *)" # 13:00 UTC = 08:00 PET
}

# IAM Role for Scheduler
resource "aws_iam_role" "scheduler" {
  count = var.environment == "qa" ? 1 : 0
  name  = "${var.project_name}-qa-scheduler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "scheduler" {
  count = var.environment == "qa" ? 1 : 0
  role  = aws_iam_role.scheduler[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ecs:UpdateService"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# Acciones (Target a Lambda o SSM Automation - Simplificado para el plan)
# Nota: En una implementacion real se usaria un Target de SSM Automation 
# o una Lambda pequeña enviando el comando de stop/start.
