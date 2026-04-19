resource "aws_backup_vault" "this" {
  name = "${var.project_name}-${var.environment}-vault"
}

resource "aws_backup_plan" "this" {
  name = "${var.project_name}-${var.environment}-backup-plan"

  rule {
    rule_name         = "daily-backup"
    target_vault_name = aws_backup_vault.this.name
    schedule          = "cron(0 5 * * ? *)" # 5 AM UTC

    lifecycle {
      delete_after = 7 # Retención de 7 días según v6.0
    }
  }
}

resource "aws_backup_selection" "this" {
  iam_role_arn = var.backup_role_arn
  name         = "${var.project_name}-${var.environment}-selection"
  plan_id      = aws_backup_plan.this.id

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Backup"
    value = "true"
  }
}
