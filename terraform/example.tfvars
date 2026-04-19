# Example variables file (DO NOT put real secrets here)

# Core
environment  = "qa" # or "prod"
project_name = "multiperfil"

# App (public config)
api_domain           = "https://secure2.iimp.org:8443"
api_base_path_qa     = "/KBServiciosPruebaIIMPJavaEnvironment/rest"
api_base_path_prod   = "/KBServiciosIIMPJavaEnvironment/rest"
app_version          = "V1"

# App secrets (set these via TF_VAR_* or a private *.tfvars)
# next_public_api_key = "REPLACE_ME"

# Database (set via TF_VAR_* or a private *.tfvars)
# db_user = "multiuser"
# db_pass = "REPLACE_ME"

# SMTP (set via TF_VAR_* or a private *.tfvars)
# smtp_pass = "REPLACE_ME"
