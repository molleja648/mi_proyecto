import psycopg2

# Configuración de conexión
DB_NAME = "mi_proyecto"
DB_USER = "postgres"
DB_PASS = "clave123"   # ajusta según tu instalación
DB_HOST = "localhost"
DB_PORT = "5432"

def init_db():
    conn = psycopg2.connect(
        dbname=DB_NAME, user=DB_USER, password=DB_PASS,
        host=DB_HOST, port=DB_PORT
    )
    cur = conn.cursor()

    # Crear tabla usuarios
    cur.execute("""
    CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(50) NOT NULL,
        rol VARCHAR(20) NOT NULL
    );
    """)

    # Crear tabla clientes
    cur.execute("""
    CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(20) UNIQUE NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        telefono VARCHAR(20),
        direccion VARCHAR(200),
        correo VARCHAR(100)
    );
    """)

    # Crear tabla tecnicos
    cur.execute("""
    CREATE TABLE IF NOT EXISTS tecnicos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(20) UNIQUE NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        telefono VARCHAR(20),
        direccion VARCHAR(200),
        correo VARCHAR(100),
        usuario VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(50) NOT NULL
    );
    """)

    # Crear tabla tickets
    cur.execute("""
    CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(20),
        cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
        tecnico_id INT REFERENCES tecnicos(id) ON DELETE CASCADE,
        tipo_falla TEXT NOT NULL,
        estado VARCHAR(20) DEFAULT 'pendiente',
        fecha_reporte TIMESTAMP,
        fecha_inicio TIMESTAMP,
        fecha_cierre TIMESTAMP,
        evidencia VARCHAR(200),
        firma VARCHAR(200),
        observacion TEXT
    );
    """)

    # Insertar usuario admin
    cur.execute("""
    INSERT INTO usuarios (username, password, rol)
    VALUES (%s, %s, %s)
    ON CONFLICT (username) DO NOTHING;
    """, ("admin", "clave123", "admin"))

    # Insertar técnico de prueba
    cur.execute("""
    INSERT INTO tecnicos (codigo, nombre, telefono, direccion, correo, usuario, password)
    VALUES (%s,%s,%s,%s,%s,%s,%s)
    ON CONFLICT (usuario) DO NOTHING;
    """, ("T001", "Joel Castro", "3001234567", "Villa del Rosario",
          "joel@example.com", "joel", "clave123"))

    conn.commit()
    conn.close()
    print("Tablas creadas y usuarios de prueba insertados correctamente.")

if __name__ == "__main__":
    init_db()
