terraform {
  backend "s3" {
    bucket       = "multiperfil-terraform-state"
    key          = "terraform.tfstate"
    region       = "sa-east-1"
    use_lockfile = true
  }
}
