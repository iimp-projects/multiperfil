# AWS Enterprise Architecture: Portal Multiperfil V2 (Final v6.3 - CI/CD GitLab)

Este documento define la infraestructura definitiva, refinando la Capa de QA para una máxima eficiencia de costos e integrando un ciclo de despliegue continuo (CI/CD) automatizado.

---

## 1. Topología por Entorno

### Producción (Alta Disponibilidad)
- **Región**: `sa-east-1`
- **Capa Edge**: CloudFront + WAF activados.
- **App**: ECS Fargate con Autoscaling (2-20 tareas).
- **Base de Datos**: MongoDB Replica Set (2+1).

### QA (Máximo Ahorro)
- **Región**: `sa-east-1`
- **Capa Edge**: **DESACTIVADA**. Acceso directo por IP/DNS.
- **App**: 1 Tarea ECS Fargate fija (sin Autoscaling).
- **Base de Datos**: Instancia única (**Single-Node**) `t3.micro`.

---

## 2. Redes y Acceso

| Entorno | VPC CIDR | NAT Strategy | Conectividad |
| :--- | :--- | :--- | :--- |
| **Producción** | `10.50.0.0/16` | **Managed NAT Gateway** | Subred Privada (Seguridad Máxima). |
| **QA** | `10.51.0.0/16` | **NAT Instance (`t3.nano`)** | Subred Pública/Híbrida (Acceso Directo). |

---

## 3. Estrategia de Costos Optimizada (v6.2)

Estimados mensuales basados en el ajuste agresivo de QA y la mantención de Prod en São Paulo.

| Escenario | Producción (Resiliencia) | QA (Optimizado) |
| :--- | :--- | :--- |
| **Computo (ECS/EC2)** | $90 - $140 | $6 - $12 |
| **Red (ALB/NAT/Data)** | $50 - $80 | $4 - $6 |
| **Seguridad (WAF/CDN)** | $40 - $100 | **$0** |
| **Total Proyectado** | **$180 - $320** | **$10 - $18** |

*Ahorro en QA: ~75% respecto a la configuración standard.*

---

## 4. Operación y Horarios (QA)

Para reducir costos en QA a menos de $15/mes, se recomienda la siguiente estrategia:
- **Apagado Automático**: Apagar la instancia de MongoDB y reducir las tareas ECS a 0 fuera del horario laboral (ej: 7 PM - 8 AM).
- **Encendido Bajo Demanda**: Script manual o automatizado vía EventBridge.

---

## 5. Notas de Implementación

- **Autenticación**: La ausencia de WAF en QA exige que la validación de usuarios en el backend sea rigurosa.
- **Pruebas de Carga**: **NUNCA** realizar pruebas de carga en el entorno QA, ya que su configuración mono-nodo y sin ALB colapsará de inmediato. Las pruebas de carga solo deben realizarse contra el entorno de Producción o un pre-prod idéntico.

---

## 6. Ciclo de Vida CI/CD (GitLab)

La infraestructura soporta un despliegue continuo totalmente automatizado mediante **GitLab CI**.

- **Repositorio**: `https://gitlab.com/iimp_projects/iimp-multiperfil-v2`
- **Flujo de Ramas**:
    - `develop` ➔ Despliega automáticamente en el entorno de **QA**.
    - `main` ➔ Despliega automáticamente en el entorno de **Producción**.
- **Proceso del Pipeline**:
    1.  **Lint (Zero Errors)**: Se valida el código con ESLint. El pipeline fallará ante cualquier error **o warning** (`--max-warnings 0`).
    2.  **Build**: Se construye la imagen Docker y se sube a **Amazon ECR**.
    2.  **Security Scan**: ECR escanea la imagen en busca de vulnerabilidades.
    3.  **Deploy**: Se actualiza el servicio ECS (Fargate) forzando un despliegue nuevo (`force-new-deployment`).

> [!IMPORTANT]
> **Configuración en GitLab**: Es obligatorio configurar las variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` y `AWS_REGION` en GitLab CI/CD para que el pipeline tenga permisos de escritura en ECR y ECS.
