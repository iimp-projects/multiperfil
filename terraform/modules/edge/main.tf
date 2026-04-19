terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

# DNS Zone (Existente)
data "aws_route53_zone" "selected" {
  name         = "sistemasiimp.org.pe."
  private_zone = false
}

# ACM Certificate (Global - us-east-1 para CloudFront)
resource "aws_acm_certificate" "this" {
  domain_name       = var.environment == "prod" ? "multiperfil.sistemasiimp.org.pe" : "qa-multiperfil.sistemasiimp.org.pe"
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
  for_each = {
    for dvo in aws_acm_certificate.this.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.selected.zone_id
}

resource "aws_acm_certificate_validation" "this" {
  certificate_arn         = aws_acm_certificate.this.arn
  validation_record_fqdns = [for record in aws_route53_record.validation : record.fqdn]
}

# WAF Web ACL (Borde - us-east-1)
resource "aws_wafv2_web_acl" "this" {
  name        = var.environment == "prod" ? "${var.project_name}-${var.environment}-waf-v2" : "${var.project_name}-${var.environment}-waf"
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

# CloudFront Distribution
resource "aws_cloudfront_distribution" "this" {
  origin {
    domain_name = var.alb_domain_name
    origin_id   = "ALB"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only" # Cambiar a https-only cuando el ALB tenga su certificado en sa-east-1
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled         = true
  is_ipv6_enabled = true
  comment         = "Distribucion para ${var.project_name} (${var.environment})"
  web_acl_id      = aws_wafv2_web_acl.this.arn
  aliases         = [var.environment == "prod" ? "multiperfil.sistemasiimp.org.pe" : "qa-multiperfil.sistemasiimp.org.pe"]

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
    acm_certificate_arn      = aws_acm_certificate_validation.this.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cdn"
  }
}

# Record CNAME en Route53 para el dominio final
resource "aws_route53_record" "cdn" {
  zone_id = data.aws_route53_zone.selected.zone_id
  name    = var.environment == "prod" ? "multiperfil.sistemasiimp.org.pe" : "qa-multiperfil.sistemasiimp.org.pe"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.this.domain_name
    zone_id                = aws_cloudfront_distribution.this.hosted_zone_id
    evaluate_target_health = false
  }
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.this.domain_name
}
