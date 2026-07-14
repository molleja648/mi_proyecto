import psycopg2

def crear_tabla_tickets():
    conn = psycopg2.connect(
        dbname="tu_base",
        user="tu_usuario",
        password="tu_clave",
        host="localhost",
        port="5432"
    )
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE,
        cliente_id INT NOT NULL,
        tecnico_id INT NOT NULL,
        tipo_falla TEXT NOT NULL,
        estado VARCHAR(20) NOT NULL,
        fecha_reporte TIMESTAMP DEFAULT NOW(),
        fecha_cierre TIMESTAMP,
        CONSTRAINT fk_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
        CONSTRAINT fk_tecnico FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("Tabla 'tickets' creada correctamente.")

if __name__ == "__main__":
    crear_tabla_tickets()
