from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import psycopg2, datetime, os, shutil

# ---------------- CONFIGURACIÓN ----------------
DB_NAME = "mi_proyecto"
DB_USER = "postgres"
DB_PASS = "clave123"
DB_HOST = "localhost"
DB_PORT = "5432"

def get_conn():
    return psycopg2.connect(
        dbname=DB_NAME, user=DB_USER, password=DB_PASS,
        host=DB_HOST, port=DB_PORT
    )

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# Ruta absoluta para uploads
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------- MODELOS ----------------
class Cliente(BaseModel):
    codigo: str
    nombre: str
    telefono: str | None = None
    direccion: str | None = None
    correo: str | None = None

class Tecnico(BaseModel):
    codigo: str
    nombre: str
    telefono: str | None = None
    direccion: str | None = None
    correo: str | None = None
    usuario: str
    password: str

class Ticket(BaseModel):
    cliente_id: int
    tecnico_id: int
    tipo_falla: str
    estado: str | None = "pendiente"
    evidencia: str | None = None
    firma: str | None = None
    observacion: str | None = None

# ---------------- LOGIN ----------------
@app.post("/login")
def login(data: dict):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, username, password, rol FROM usuarios WHERE username=%s", (data["username"],))
    u = cur.fetchone()
    if u and u[1] == data["username"] and u[2] == data["password"]:
        conn.close()
        return {"rol": u[3], "id": u[0]}
    cur.execute("SELECT id, usuario, password FROM tecnicos WHERE usuario=%s", (data["username"],))
    t = cur.fetchone()
    conn.close()
    if t and t[1] == data["username"] and t[2] == data["password"]:
        return {"rol": "tecnico", "id": t[0]}
    return {"error": "Credenciales inválidas"}

# ---------------- CLIENTES CRUD ----------------
@app.get("/clientes")
def listar_clientes():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, codigo, nombre, telefono, direccion, correo FROM clientes")
    rows = cur.fetchall()
    conn.close()
    return [{"id": r[0], "codigo": r[1], "nombre": r[2], "telefono": r[3], "direccion": r[4], "correo": r[5]} for r in rows]

@app.post("/clientes")
def crear_cliente(c: Cliente):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM clientes WHERE codigo=%s OR correo=%s", (c.codigo, c.correo))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Cliente con ese código o correo ya existe")
    cur.execute("INSERT INTO clientes (codigo, nombre, telefono, direccion, correo) VALUES (%s,%s,%s,%s,%s) RETURNING id",
                (c.codigo, c.nombre, c.telefono, c.direccion, c.correo))
    new_id = cur.fetchone()[0]
    conn.commit()
    conn.close()
    return {"id": new_id, **c.dict()}

@app.put("/clientes/{cliente_id}")
def actualizar_cliente(cliente_id: int, c: Cliente):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM clientes WHERE id=%s", (cliente_id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    cur.execute("""UPDATE clientes SET codigo=%s, nombre=%s, telefono=%s, direccion=%s, correo=%s WHERE id=%s""",
                (c.codigo, c.nombre, c.telefono, c.direccion, c.correo, cliente_id))
    conn.commit()
    conn.close()
    return {"msg": "Cliente actualizado", "id": cliente_id, **c.dict()}

@app.delete("/clientes/{cliente_id}")
def eliminar_cliente(cliente_id: int):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM clientes WHERE id=%s", (cliente_id,))
    conn.commit()
    conn.close()
    return {"msg": "Cliente eliminado"}

# ---------------- TECNICOS CRUD ----------------
@app.get("/tecnicos")
def listar_tecnicos():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, codigo, nombre, telefono, direccion, correo, usuario FROM tecnicos")
    rows = cur.fetchall()
    conn.close()
    return [{"id": r[0], "codigo": r[1], "nombre": r[2], "telefono": r[3], "direccion": r[4], "correo": r[5], "usuario": r[6]} for r in rows]

@app.post("/tecnicos")
def crear_tecnico(t: Tecnico):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM tecnicos WHERE codigo=%s OR usuario=%s OR correo=%s", (t.codigo, t.usuario, t.correo))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Técnico con ese código, usuario o correo ya existe")
    cur.execute("INSERT INTO tecnicos (codigo, nombre, telefono, direccion, correo, usuario, password) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (t.codigo, t.nombre, t.telefono, t.direccion, t.correo, t.usuario, t.password))
    new_id = cur.fetchone()[0]
    conn.commit()
    conn.close()
    return {"id": new_id, **t.dict()}

@app.put("/tecnicos/{tecnico_id}")
def actualizar_tecnico(tecnico_id: int, t: Tecnico):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM tecnicos WHERE id=%s", (tecnico_id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Técnico no encontrado")
    cur.execute("""
        UPDATE tecnicos SET codigo=%s, nombre=%s, telefono=%s, direccion=%s, correo=%s, usuario=%s, password=%s
        WHERE id=%s
    """, (t.codigo, t.nombre, t.telefono, t.direccion, t.correo, t.usuario, t.password, tecnico_id))
    conn.commit()
    conn.close()
    return {"msg": "Técnico actualizado", "id": tecnico_id, **t.dict()}

@app.delete("/tecnicos/{tecnico_id}")
def eliminar_tecnico(tecnico_id: int):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM tecnicos WHERE id=%s", (tecnico_id,))
    conn.commit()
    conn.close()
    return {"msg": "Técnico eliminado"}

# ---------------- TICKETS CRUD ----------------
@app.get("/tickets")
def listar_tickets():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT t.id, t.codigo,
               c.id, c.nombre, c.telefono, c.direccion,
               te.id, te.nombre,
               t.tipo_falla, t.estado,
               t.fecha_reporte, t.fecha_inicio, t.fecha_cierre,
               t.evidencia, t.firma, t.observacion
        FROM tickets t
        JOIN clientes c ON t.cliente_id = c.id
        JOIN tecnicos te ON t.tecnico_id = te.id
        ORDER BY t.id
    """)
    rows = cur.fetchall()
    conn.close()
    return [
        {
            "id": r[0], "codigo": r[1],
            "cliente_id": r[2], "cliente_nombre": r[3],
            "cliente_telefono": r[4], "cliente_direccion": r[5],
            "tecnico_id": r[6], "tecnico_nombre": r[7],
            "tipo_falla": r[8],
            "estado": r[9],
            "fecha_reporte": r[10],
            "fecha_inicio": r[11],
            "fecha_cierre": r[12],
            "evidencia": r[13],
            "firma": r[14],
            "observacion": r[15]
        }
        for r in rows
    ]

@app.post("/tickets")
def crear_ticket(t: Ticket):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO tickets (cliente_id, tecnico_id, tipo_falla, estado, fecha_reporte)
        VALUES (%s,%s,%s,%s,%s) RETURNING id
    """, (t.cliente_id, t.tecnico_id, t.tipo_falla, t.estado, datetime.datetime.now()))
    new_id = cur.fetchone()[0]
    conn.commit()
    conn.close()
    return {"id": new_id, **t.dict(), "fecha_reporte": datetime.datetime.now()}

@app.put("/tickets/{ticket_id}/iniciar")
def iniciar_ticket(ticket_id: int):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE tickets SET fecha_inicio=%s, estado=%s WHERE id=%s",
                (datetime.datetime.now(), "en proceso", ticket_id))
    conn.commit()
    conn.close()
    return {"msg": "Ticket iniciado"}

@app.put("/tickets/{ticket_id}/cerrar")
async def cerrar_ticket(ticket_id: int,
    evidencia: UploadFile = File(None),
    firma: UploadFile = File(None),
    observacion: str = Form(None)):

    evidencia_name = None
    firma_name = None

    if evidencia:
        evidencia_name = evidencia.filename
        evidencia_path = os.path.join(UPLOAD_DIR, evidencia_name)
        with open(evidencia_path, "wb") as buffer:
            shutil.copyfileobj(evidencia.file, buffer)

    if firma:
        firma_name = firma.filename
        firma_path = os.path.join(UPLOAD_DIR, firma_name)
        with open(firma_path, "wb") as buffer:
            shutil.copyfileobj(firma.file, buffer)

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        UPDATE tickets
        SET estado=%s, fecha_cierre=%s, evidencia=%s, firma=%s, observacion=%s
        WHERE id=%s
    """, ("cerrado", datetime.datetime.now(), evidencia_name, firma_name, observacion, ticket_id))
    conn.commit()
    conn.close()

    return {"msg": "Ticket cerrado", "observacion": observacion}

# ---------------- MÉTRICAS ----------------
@app.get("/metricas")
def metricas():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM tickets")
    total = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM tickets WHERE estado!='cerrado'")
    abiertos = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM tickets WHERE estado='cerrado'")
    cerrados = cur.fetchone()[0]

    cur.execute("""
        SELECT AVG(EXTRACT(EPOCH FROM (fecha_inicio - fecha_reporte)))
        FROM tickets WHERE fecha_inicio IS NOT NULL
    """)
    prom_respuesta = cur.fetchone()[0]

    cur.execute("""
        SELECT AVG(EXTRACT(EPOCH FROM (fecha_cierre - fecha_inicio)))
        FROM tickets WHERE fecha_cierre IS NOT NULL AND fecha_inicio IS NOT NULL
    """)
    prom_resolucion = cur.fetchone()[0]

    conn.close()

    def formato_tiempo(segundos):
        if segundos is None:
            return None
        segundos = int(segundos)
        dias = segundos // 86400
        horas = (segundos % 86400) // 3600
        minutos = (segundos % 3600) // 60
        seg = segundos % 60
        return f"{dias}d {horas}h {minutos}m {seg}s"

    return {
        "total_tickets": total,
        "abiertos": abiertos,
        "cerrados": cerrados,
        "promedio_respuesta": formato_tiempo(prom_respuesta),
        "promedio_resolucion": formato_tiempo(prom_resolucion)
    }

# ---------------- ARCHIVOS ESTÁTICOS ----------------
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/", StaticFiles(directory="static", html=True), name="static")
