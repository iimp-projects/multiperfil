# AWS Enterprise Architecture: Portal Multiperfil V2 (Final v7.0 - CI/CD GitHub)

Este documento define la infraestructura definitiva, optimizada tras la migración a GitHub, refinando la Capa de QA para una máxima eficiencia de costos.

---

## 1. Topología por Entorno

### Producción (Alta Disponibilidad)
- **Región**: `sa-east-1` (São Paulo)
- **Capa Edge**: CloudFront + WAF (Amazon IP Reputation + Rate Limiting).
- **App**: ECS Fargate con Autoscaling (2-10 tareas).
- **Base de Datos**: MongoDB Replica Set (Primary + Secondary + Arbiter).

### QA (Máximo Ahorro)
- **Región**: `sa-east-1`
- **Capa Edge**: **DESACTIVADA** (Acceso vía ALB para pruebas).
- **App**: 1 Tarea ECS Fargate fija.
- **Base de Datos**: Instancia única (**Single-Node**) `t3.micro`.
- **Red**: NAT Instance `t3.nano` (Reemplaza al Managed NAT Gateway para ahorro).

---

## 2. Redes y Acceso

| Entorno | VPC CIDR | NAT Strategy | Conectividad |
| :--- | :--- | :--- | :--- |
| **Producción** | `10.50.0.0/16` | **Managed NAT Gateway** | Subred Privada (Seguridad Máxima). |
| **QA** | `10.51.0.0/16` | **NAT Instance (`t3.nano`)** | Subred Híbrida (Control de costos). |

---

## 3. Estrategia de Costos Optimizada (v7.0)

| Escenario | Producción (Resiliencia) | QA (Optimizado) |
| :--- | :--- | :--- |
| **Computo (ECS/EC2)** | $90 - $140 | $6 - $12 |
| **Red (ALB/NAT/Data)** | $50 - $80 | $4 - $6 |
| **Seguridad (WAF/CDN)** | $40 - $100 | **$0** |
| **Total Proyectado** | **$180 - $320** | **$10 - $18** |

---

## 4. Ciclo de Vida CI/CD (GitHub Actions)

La infraestructura se despliega automáticamente mediante **GitHub Actions**.

- **Repositorio**: GitHub IIMP Projects
- **Flujo de Ramas**:
    - `develop` ➔ Despliega automáticamente en el entorno de **QA**.
    - `main` ➔ Despliega automáticamente en el entorno de **Producción**.
- **Proceso del Workflow**:
    1.  **Code Validation**: Ejecución de Lints y Tests.
    2.  **Build & Push**: Construcción de imagen y subida a **Amazon ECR**.
    3.  **Deployment**: Actualización del servicio ECS Fargate mediante `aws-actions/amazon-ecs-deploy-task-definition`.

> [!IMPORTANT]
> **Secretos en GitHub**: Las credenciales se gestionan vía GitHub Secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`). El usuario de CI tiene permisos restringidos (Least Privilege) para ECR y ECS.
