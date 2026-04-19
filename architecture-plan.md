# AWS Cloud Infrastructure Plan: Portal Multiperfil V2 (Optimizado)

Este documento define la arquitectura técnica para soportar el tráfico de asociados del IIMP (500-1000 usuarios/día) con un enfoque en **bajo costo mensual**, **seguridad nivel empresarial** y **almacenamiento propio (MongoDB en AWS)**.

## 1. Topología de Red y Ahorro de Costos (VPC)

Para maximizar el ahorro sin comprometer la seguridad, se propone una red híbrida:

- **VPC Dedicada**: `10.50.0.0/16`.
- **Subredes Públicas**: Para el Balanceador (ALB) y el **NAT Instance**.
- **Subredes Privadas**: Para los contenedores (App) y la Base de Datos (MongoDB).
- **Ahorro Crítico (NAT)**: No usaremos el "Managed NAT Gateway" de AWS ($32/mes). Usaremos una **NAT Instance (t3.nano)** gestionada manualmente (~$3.50/mes), permitiendo a la red privada salir a internet para actualizaciones a un costo 10 veces menor.

---

## 2. Capa de Aplicación (ECS Fargate)

Usaremos **Amazon ECS con Fargate** por su capacidad de escalado "pago por uso".

- **Configuración Base**: 1 Nodo `0.5 vCPU / 1 GB RAM`. (Costo mínimo).
- **Auto-Scaling (Eventos)**: Configuración de escalado automático basado en CPU (>70%) para subir a 2 o 3 nodos automáticamente cuando el tráfico llegue a los 1,000 usuarios/día durante los eventos.
- **CI/CD**: Sincronización automática con GitLab/GitHub para despliegues sin tiempo de inactividad (Rolling Updates).

---

## 3. Capa de Datos: MongoDB en AWS (NO ATLAS)

Para cumplir con el requisito de "No Atlas" y "Low Cost", desplegaremos MongoDB directamente en EC2.

### Configuración del Servidor:
- **Instancia**: `t3.medium` (2 vCPU / 4 GB RAM). Es el punto dulce para MongoDB Community Edition.
- **Almacenamiento**: **EBS gp3 (20GB+)**. Usamos gp3 por su rendimiento persistente (3000 IOPS base) sin costo adicional por rendimiento.
- **Replica Set**: Se configurará un **Single-Node Replica Set** (`rs0`).
    - *Razón*: Prisma requiere el log de replicación de MongoDB para ejecutar transacciones (indispensable para la lógica de `SessionLock`).
- **Backups**: Snapshots automáticos de EBS programados via **AWS Lifecycle Manager** (Costo mínimo).

---

## 4. Seguridad y Protección Anti-Bots (WAF + CloudFront)

Prioridad #1: Seguridad y evitar ataques automatizados.

### Capa de Borde (CloudFront + WAF):
1.  **Amazon CloudFront**: Actúa como escudo. Cachea archivos estáticos e imágenes, evitando que ese tráfico llegue (y cueste) en el balanceador o servidores.
2.  **AWS WAF (Web Application Firewall)**:
    *   **Bot Control (Common)**: Bloquea intentos de acceso de scripts y bots conocidos.
    *   **Rate Limiting**: Bloquea IPs que hagan más de 500 peticiones en 5 minutos (evita ataques de denegación de servicio).
    *   **IP Reputation**: Bloquea IPs detectadas por Amazon como maliciosas.

---

## 5. Estrategia de Eventos y Escalado Potente

El portal debe aguantar 1,000 usuarios/día durante eventos de 3-7 días.

- **Escalado Horizontal (App)**: Fargate añade copias de la app según la carga.
- **Escalado Vertical (DB)**: Si se prevé un tráfico masivo, la instancia EC2 de MongoDB se puede cambiar de `t3.medium` a `t3.large` en 2 minutos con solo cambiar el tipo de instancia.
- **CloudFront Warm-up**: Al estar CloudFront al frente, el 90% del tráfico "pesado" no llegará a la base de datos, permitiendo que la arquitectura sea muy potente con recursos modestos.

---

## 6. Estimación de Costos (Low Cost)

| Servicio | Configuración | Costo Estimado (Mes) |
| :--- | :--- | :--- |
| **ECS Fargate** | 1 Task (0.5vCPU/1GB) | ~$11.00 |
| **ALB** | Balanceador base | ~$18.00 |
| **EC2 (DB)** | t3.medium (Reserved/Spot) | ~$15.00 - $25.00 |
| **EBS Storage** | 20 GB gp3 | ~$1.60 |
| **NAT Instance** | t3.nano | ~$3.50 |
| **CloudFront+WAF** | Free Tier + WAF Rules | ~$10.00 |
| **TOTAL (Producción)** | | **~$60.00 - $70.00** |

> [!TIP]
> **Costo de QA**: Al aplicar las estrategias de la Sección 9 (Spot + Apagado nocturno), el entorno de QA añade solo **~$15.00 - $20.00** adicionales al mes, logrando un aislamiento total a un precio marginal.

*Nota: Estos costos son estimaciones base. El costo de WAF y Tráfico puede variar ligeramente según el volumen real de ataques bloqueados y datos transferidos.*

---

---

## 8. Gestión de Dominios y SSL (DNS)

El tráfico será dirigido mediante **Amazon Route 53**, integrándose con la Hosted Zone existente `sistemasiimp.org.pe`.

### Configuración de Registros:
- **Producción**: `multiperfil.sistemasiimp.org.pe`
    - Registro Tipo A (Alias) apuntando a la distribución de **CloudFront (Prod)**.
- **QA / Pruebas**: `qa-multiperfil.sistemasiimp.org.pe`
    - Registro Tipo A (Alias) apuntando a la distribución de **CloudFront (QA)** o directamente al **ALB de QA**.

### Certificados SSL/TLS:
- Uso de **AWS Certificate Manager (ACM)** para emitir un certificado validado por DNS.
- Se recomienda un certificado **Wildcard** (`*.sistemasiimp.org.pe`) para cubrir todos los subdominios presentes y futuros sin costo adicional.

---

## 9. Entorno de QA: Aislamiento y Ahorro Agresivo

Para garantizar la estabilidad de Producción, el entorno de QA será una réplica funcional pero optimizada para el mínimo costo:

- **Base de Datos (EC2 Spot)**:
    - **Instancia**: `t3.micro` (o `t3.small` si la carga aumenta).
    - **Ahorro Agresivo**: Uso de **AWS Spot Instances**, lo que reduce el costo de la instancia en un ~70% respecto al precio bajo demanda.
    - **Replica Set**: Se mantiene Single-Node RS para compatibilidad con Prisma.
- **Capa de Aplicación (Fargate)**:
    - 1 solo contenedor con recursos mínimos (`0.25 vCPU / 0.5 GB RAM`).
- **Políticas de Apagado (Instance Scheduler)**:
    - **Horario**: Apagado automático de lunes a viernes (8 PM - 8 AM) y fines de semana completos.
    - **Impacto**: Reduce el costo mensual de QA en un **50% adicional**.
- **Almacenamiento**:
    - EBS gp3 de 10GB (Suficiente para pruebas con datos de muestra).
- **Red (Opcional)**:
    - Para ahorrar los $3.50 del NAT Instance de QA, se puede configurar una sola VPC con subredes separadas o usar VPC Peering para compartir la NAT Instance de Producción.

---

## 10. Plan de Implementación (Fases)

1.  **Fase 1 (VPC & DNS)**: Creación de red e instancia NAT. Validación del certificado SSL en ACM mediante Route 53.
2.  **Fase 2 (Database)**: Setup de MongoDB EC2, Replica Set e IAM para backups (Prod y QA independientes).
3.  **Fase 3 (Compute)**: Cluster ECS, ECR y Roles de servicio.
4.  **Fase 4 (Edge)**: Configuración de ALB, CloudFront y reglas de WAF para ambos entornos.
5.  **Fase 5 (Mapping)**: Creación de registros Alias en Route 53 vinculando los dominios a la infraestructura.
6.  **Fase 6 (CI/CD)**: Automatización de despliegue diferenciado (Branch `main` -> Prod, Branch `develop` -> QA).
