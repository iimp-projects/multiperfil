import os
import time
import sqlite3
import boto3
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración
AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_KEY')
BUCKET_NAMES = os.getenv('BUCKET_NAMES', '').split(',') # Lista de buckets separados por coma
REGION_NAME = os.getenv('REGION_NAME', 'sa-east-1')

SOURCE_DIR = os.getenv('SOURCE_DIR', './vouchers_input')
S3_PREFIX = os.getenv('S3_PREFIX', 'vouchers/')
DB_PATH = 'uploader_state.db'

# Asegurar que el directorio local exista
os.makedirs(SOURCE_DIR, exist_ok=True)

def init_db():
    """Inicializa la base de datos local para seguimiento de archivos."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS uploads (
            filename TEXT PRIMARY KEY,
            last_modified REAL,
            file_size INTEGER,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    return conn

def was_already_uploaded(filename, last_modified, file_size):
    """Verifica si el archivo ya fue subido con la misma fecha de modificación."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT last_modified, file_size FROM uploads WHERE filename = ?', (filename,))
    result = cursor.fetchone()
    conn.close()
    
    if result:
        db_modified, db_size = result
        return db_modified == last_modified and db_size == file_size
    return False

def record_upload(filename, last_modified, file_size):
    """Registra o actualiza el estado de subida de un archivo."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO uploads (filename, last_modified, file_size, uploaded_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ''', (filename, last_modified, file_size))
    conn.commit()
    conn.close()

def upload_to_s3(local_file, s3_file, bucket):
    """Sube un archivo a un bucket de S3 con permisos de lectura pública."""
    s3 = boto3.client('s3', 
                      aws_access_key_id=AWS_ACCESS_KEY,
                      aws_secret_access_key=AWS_SECRET_KEY,
                      region_name=REGION_NAME)
    try:
        # Añadimos ACL public-read y el ContentType correcto
        s3.upload_file(
            local_file, 
            bucket, 
            s3_file,
            ExtraArgs={
                'ACL': 'public-read',
                'ContentType': 'application/pdf'
            }
        )
        print(f" [+] Subida exitosa a {bucket}: {s3_file}")
        return True
    except Exception as e:
        print(f" [!] Error en {bucket}: {e}")
        return False

def process_files():
    """Escanea y procesa archivos nuevos o modificados."""
    print(f"\n[*] Escaneando carpeta: {SOURCE_DIR}")
    try:
        files = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith('.pdf')]
    except Exception as e:
        print(f" [!] Error al leer carpeta: {e}")
        return
    
    uploaded_count = 0
    skipped_count = 0

    for filename in files:
        local_path = os.path.join(SOURCE_DIR, filename)
        stats = os.stat(local_path)
        last_modified = stats.st_mtime
        file_size = stats.st_size
        
        # Verificar si ya se subió esta versión
        if was_already_uploaded(filename, last_modified, file_size):
            skipped_count += 1
            continue

        print(f"[*] Detectado archivo nuevo/modificado: {filename}")
        s3_path = f"{S3_PREFIX}{filename}"
        
        all_success = True
        # Subir a cada bucket configurado
        for bucket in BUCKET_NAMES:
            bucket = bucket.strip()
            if not bucket: continue
            if not upload_to_s3(local_path, s3_path, bucket):
                all_success = False
        
        # Registrar en la base de datos si la subida fue exitosa
        if all_success:
            record_upload(filename, last_modified, file_size)
            uploaded_count += 1

    if uploaded_count > 0 or skipped_count > 0:
        print(f"[*] Resumen: {uploaded_count} subidos, {skipped_count} ya procesados.")
    else:
        print("[-] No se encontraron PDFs.")

if __name__ == "__main__":
    print("=== ROBOT S3 UPLOADER INICIADO (Modo Persistente) ===")
    init_db()
    
    interval = int(os.getenv('SCAN_INTERVAL', '60'))
    
    try:
        while True:
            process_files()
            print(f"[*] Esperando {interval} segundos...")
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n[!] Robot detenido por el usuario.")
