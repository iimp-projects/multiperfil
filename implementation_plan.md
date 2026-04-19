# Infrastructure Stabilization Plan: Prod & QA

The objective is to resolve the 504 Gateway Timeout in Production and restore the QA environment which is currently unreachable due to MongoDB connectivity issues.

## User Review Required

> [!IMPORTANT]
> **Production Connectivity**: We will update the `DATABASE_URL` in Production to include all members of the Replica Set. This ensures the application can find the Primary node even if the first IP in the list is not currently the Primary.
> **External API**: The login flow depends on `https://secure2.iimp.org:8443`. This API appears to be slow or unreachable, which is contributing to the 504 Gateway Timeout.

## Proposed Changes

### 1. Production: Robust MongoDB Connection
We will update the `DATABASE_URL` in the Terraform configuration to include the Secondary and Arbiter nodes. This follows MongoDB best practices for Replica Sets.

#### [MODIFY] [terraform/main.tf](file:///c:/Users/bryan/OneDrive/Documentos/perumin/iimp-multiperfil/terraform/main.tf)
Update the `DATABASE_URL` construction to include:
- `module.mongodb.primary_private_ip`
- `module.mongodb.secondary_private_ip`
- `module.mongodb.arbiter_private_ip`

### 2. QA: Restore Connectivity
The QA environment is broken because:
- The MongoDB instance was recreated but likely failed to start because the `user_data` script was waiting for `/dev/sdh`, which often appears as `/dev/nvme1n1` on Nitro instances (t3 series).
- There is a "ghost" MongoDB instance that might be causing confusion.
- The ECS task definition is pointing to an old/incorrect IP.

#### [MODIFY] [terraform/modules/mongodb/main.tf](file:///c:/Users/bryan/OneDrive/Documentos/perumin/iimp-multiperfil/terraform/modules/mongodb/main.tf)
Update the `user_data` script to be more resilient when identifying the EBS volume.

#### [EXECUTE] Terraform Apply
Run `terraform apply` in both `prod` and `qa` workspaces to synchronize the state and update the ECS tasks.

## Verification Plan

### Automated Tests
- `aws elbv2 describe-target-health` to ensure all targets are healthy.
- `curl -I` to the application endpoints to verify they are responsive.

### Manual Verification
- Attempt login in Production and monitor if the 504 persists.
- Verify QA web access.
