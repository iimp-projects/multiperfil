# Robot S3 Uploader (Python)

Este script escanea una carpeta local en busca de archivos PDF y los sube automáticamente al bucket de S3 de Multiperfil.

## Requisitos
1. **Python 3.x** instalado.
2. Instalar dependencias:
   ```bash
   pip install boto3 python-dotenv
   ```

## Configuración
1. Copia el archivo `.env.example` a `.env`.
2. Completa las credenciales `AWS_ACCESS_KEY` y `AWS_SECRET_KEY` (puedes verlas ejecutando `terraform output` en la carpeta de terraform).
3. Asegúrate de que el `BUCKET_NAME` sea el correcto (`multiperfil-qa-files` o `multiperfil-prod-files`).
4. (Opcional) Ajusta otras variables:
   - `SOURCE_DIR`: carpeta donde estarán los PDFs (por defecto: `./vouchers_input`)
   - `S3_PREFIX`: prefijo en S3 (por defecto: `vouchers/`)
   - `SCAN_INTERVAL`: segundos entre escaneos (por defecto: 60)
   - `BUCKET_NAMES`: buckets separados por coma (por defecto: `multiperfil-qa-files,multiperfil-prod-files`)

## Uso
1. Coloca los archivos PDF que deseas subir en la carpeta `vouchers_input/` (o la carpeta configurada en `SOURCE_DIR`).
2. Ejecuta el script:
   ```bash
   python s3_uploader.py
   ```
3. El script subirá los archivos automáticamente. **Importante:** Los archivos se mantendrán en la carpeta original. El bot utiliza una base de datos local (`uploader_state.db`) para recordar qué archivos ya subió y evitar duplicados, a menos que el contenido del archivo cambie.

## Ejecución en Windows Server

### Opción 1: Ejecutar como script (consola)
```cmd
cd C:\ruta\al\proyecto\robot-py
python s3_uploader.py
```

### Opción 2: Ejecutar como archivo BAT
1. Crea un archivo `run_bot.bat` con este contenido:
```batch
@echo off
cd /d "%~dp0"
python s3_uploader.py
pause
```
2. Ejecútalo haciendo doble clic o desde línea de comandos.

### Opción 3: Servicio de Windows (NT Service) - Recomendado para producción
Usa **NSSM (Non-Sucking Service Manager)** para convertir el script en un servicio:

1. Descarga NSSM desde: https://nssm.cc/download
2. Extrae y copia `nssm.exe` a una carpeta (ej: `C:\tools\nssm\`)
3. Abre PowerShell como Administrador y ejecuta:
```powershell
C:\tools\nssm\nssm.exe install "RobotS3Uploader"
```
4. En la ventana de NSSM:
   - **Path**: `C:\Users\bryan\AppData\Local\Python\pythoncore-3.14-64\python.exe`
   - **Arguments**: `C:\ruta\al\proyecto\robot-py\s3_uploader.py`
   - **Directory**: `C:\ruta\al\proyecto\robot-py`
   - **Service name**: `RobotS3Uploader`
5. Haz clic en "Install Service"

Para iniciar/detener el servicio:
```powershell
# Iniciar
Start-Service RobotS3Uploader

# Detener
Stop-Service RobotS3Uploader

# Ver estado
Get-Service RobotS3Uploader

# Ver logs (en Visor de Eventos -> Windows Logs -> Application)
```

### Opción 4: Programador de Tareas (Task Scheduler)
Para que el script corra al iniciar el sistema:
1. Abre **Programador de Tareas** (Task Scheduler).
2. Crea una nueva tarea básica.
3. Disparador: "Al iniciar el sistema".
4. Acción: "Iniciar un programa".
5. Programa/script: `python.exe` (ruta completa).
6. Argumentos: `C:\ruta\a\tu\proyecto\robot-py\s3_uploader.py`.
7. Iniciar en: `C:\ruta\a\tu\proyecto\robot-py`.

## Control del Robot

### Si usas el script directamente (consola/BAT)
- **Detener:** Presiona `Ctrl+C` en la consola
- **Reiniciar:** Vuelve a ejecutar `python s3_uploader.py`

### Si usas NSSM (Servicio de Windows)
```powershell
# Ver estado
Get-Service RobotS3Uploader

# Detener
Stop-Service RobotS3Uploader

# Iniciar
Start-Service RobotS3Uploader

# Reiniciar (detener + iniciar)
Restart-Service RobotS3Uploader
```

### Si usas Task Scheduler
- Ve a **Programador de Tareas** →找到 la tarea → clic derecho → **Deshabilitar** (para detener) o **Habilitar** (para iniciar)
