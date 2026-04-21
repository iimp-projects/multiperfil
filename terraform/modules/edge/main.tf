terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

# DNS Zone (Existente)
data "aws_route53_zone" "selected" {
  name         = "${var.main_domain}."
  private_zone = false
}

# ACM Certificate (Global - us-east-1 para CloudFront - Solo Prod)
resource "aws_acm_certificate" "this" {
  provider          = aws.us_east_1
  count             = var.environment == "prod" ? 1 : 0
  domain_name       = "${var.subdomain_prefix}.${var.main_domain}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cert"
  }
}

# Validacion DNS vía Route53
resource "aws_route53_record" "validation" {
  for_each = var.environment == "prod" ? {
    for dvo in aws_acm_certificate.this[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.selected.zone_id
}

resource "aws_acm_certificate_validation" "this" {
  provider                = aws.us_east_1
  count                   = var.environment == "prod" ? 1 : 0
  certificate_arn         = aws_acm_certificate.this[0].arn
  validation_record_fqdns = [for record in aws_route53_record.validation : record.fqdn]
}

# WAF Web ACL (Borde - us-east-1 - Solo Prod)
resource "aws_wafv2_web_acl" "this" {
  provider    = aws.us_east_1
  count       = var.environment == "prod" ? 1 : 0
  name        = "${var.project_name}-${var.environment}-waf-v2"
  description = "Reglas de seguridad para Multiperfil"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "multiperfil-waf"
    sampled_requests_enabled   = true
  }

  rule {
    name     = "RateLimit"
    priority = 1
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimit"
      sampled_requests_enabled   = true
    }
  }
}

resource "aws_route53_record" "alb_validation" {
  for_each = var.environment == "qa" ? {
    for dvo in var.alb_cert_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.selected.zone_id
}

resource "aws_acm_certificate_validation" "alb" {
  count                   = var.environment == "qa" ? 1 : 0
  certificate_arn         = var.alb_cert_arn
  validation_record_fqdns = [for record in aws_route53_record.alb_validation : record.fqdn]
}

# --- CloudFront Distribution (Solo Prod) ---
resource "aws_cloudfront_distribution" "this" {
  provider = aws.us_east_1
  count    = var.environment == "prod" ? 1 : 0
  origin {
    domain_name = var.alb_domain_name
    origin_id   = "ALB"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled         = true
  is_ipv6_enabled = true
  comment         = "Distribucion para ${var.project_name} (${var.environment})"
  web_acl_id      = aws_wafv2_web_acl.this[0].arn
  aliases         = ["${var.subdomain_prefix}.${var.main_domain}"]

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB"

    forwarded_values {
      query_string = true
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.this[0].certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cdn"
  }
}

# Record A en Route53 (Alias a CloudFront en Prod, Alias a ALB en QA)
resource "aws_route53_record" "cdn" {
  zone_id = data.aws_route53_zone.selected.zone_id
  name    = var.environment == "prod" ? "${var.subdomain_prefix}.${var.main_domain}" : "qa-${var.subdomain_prefix}.${var.main_domain}"
  type    = "A"

  alias {
    name                   = var.environment == "prod" ? aws_cloudfront_distribution.this[0].domain_name : var.alb_domain_name
    zone_id                = var.environment == "prod" ? aws_cloudfront_distribution.this[0].hosted_zone_id : var.alb_zone_id
    evaluate_target_health = false
  }
}

output "cloudfront_domain" {
  value = var.environment == "prod" ? aws_cloudfront_distribution.this[0].domain_name : null
}
