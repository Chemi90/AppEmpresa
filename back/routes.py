from flask import Blueprint, request, jsonify, send_file
from db_connect import create_connection
import pandas as pd
from io import BytesIO
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Para extraer texto de PDF
from PyPDF2 import PdfReader

# Para llamar a la IA generativa
import google.generativeai as genai
import json

load_dotenv()

api = Blueprint('api', __name__, url_prefix='/api')

# Clave almacenada en el backend para el login
CORRECT_PASSWORD = os.getenv("PASSWORD")

@api.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    password = data.get('password')
    if password == CORRECT_PASSWORD:
        return jsonify({"message": "Acceso concedido"}), 200
    else:
        return jsonify({"message": "Clave incorrecta"}), 401

# --------------------------
# Endpoints existentes (Desplazamientos, Tickets y Facturas)
# --------------------------
@api.route('/desplazamientos', methods=['GET', 'POST'])
def desplazamientos():
    if request.method == 'POST':
        data = request.get_json()
        fecha = data.get('fecha')
        destino = data.get('destino')
        distancia = data.get('distancia')
        descripcion = data.get('descripcion')
        dia = data.get('dia')
        cliente = data.get('cliente')
        deduccion = data.get('deduccion', 0.26)
        gasto = data.get('gasto')
        try:
            conn = create_connection()
            cursor = conn.cursor()
            sql = """
                INSERT INTO desplazamientos (fecha, origen, destino, distancia, descripcion, dia, cliente, deduccion, gasto)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (fecha, "Atarfe", destino, distancia, descripcion, dia, cliente, deduccion, gasto))
            conn.commit()
            new_id = cursor.lastrowid
            cursor.close()
            conn.close()
            return jsonify({"message": "Desplazamiento agregado", "id": new_id}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        start = request.args.get('start')
        end = request.args.get('end')
        try:
            conn = create_connection()
            cursor = conn.cursor(dictionary=True)
            if start and end:
                sql = "SELECT * FROM desplazamientos WHERE fecha BETWEEN %s AND %s"
                cursor.execute(sql, (start, end))
            else:
                sql = "SELECT * FROM desplazamientos"
                cursor.execute(sql)
            results = cursor.fetchall()
            cursor.close()
            conn.close()
            return jsonify(results), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@api.route('/tickets', methods=['GET', 'POST'])
def tickets():
    if request.method == 'POST':
        try:
            localizacion = request.form.get('localizacion')
            dinero = request.form.get('dinero')
            motivo = request.form.get('motivo')
            fecha = request.form.get('fecha')
            file_path = None
            if 'foto' in request.files:
                file = request.files['foto']
                if file.filename != '':
                    ext = os.path.splitext(file.filename)[1]
                    filename = secure_filename(f"{fecha}_{localizacion}_{dinero}{ext}")
                    upload_folder = os.path.join("imagenes", "ticketsRestaurante")
                    os.makedirs(upload_folder, exist_ok=True)
                    file_path = os.path.join(upload_folder, filename)
                    file.save(file_path)
            conn = create_connection()
            cursor = conn.cursor()
            sql = """
                INSERT INTO tickets_comida (foto, localizacion, dinero, motivo, fecha)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (file_path, localizacion, dinero, motivo, fecha))
            conn.commit()
            new_id = cursor.lastrowid
            cursor.close()
            conn.close()
            return jsonify({"message": "Ticket agregado", "id": new_id}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        start = request.args.get('start')
        end = request.args.get('end')
        try:
            conn = create_connection()
            cursor = conn.cursor(dictionary=True)
            if start and end:
                sql = "SELECT * FROM tickets_comida WHERE fecha BETWEEN %s AND %s"
                cursor.execute(sql, (start, end))
            else:
                sql = "SELECT * FROM tickets_comida"
                cursor.execute(sql)
            results = cursor.fetchall()
            cursor.close()
            conn.close()
            return jsonify(results), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@api.route('/facturas', methods=['GET', 'POST'])
def facturas():
    if request.method == 'POST':
        try:
            fecha = request.form.get('fecha')
            cantidad_bruta = request.form.get('bruta')
            cantidad_neta = request.form.get('neta')
            retencion = request.form.get('retencion')
            nombre_empresa = request.form.get('empresa')
            file_path = None
            if 'archivo' in request.files:
                file = request.files['archivo']
                if file.filename != '':
                    ext = os.path.splitext(file.filename)[1]
                    filename = secure_filename(f"{fecha}_{nombre_empresa}{ext}")
                    upload_folder = os.path.join("imagenes", "facturas")
                    os.makedirs(upload_folder, exist_ok=True)
                    file_path = os.path.join(upload_folder, filename)
                    file.save(file_path)
            conn = create_connection()
            cursor = conn.cursor()
            sql = """
                INSERT INTO facturas (fecha, cantidad_bruta, cantidad_neta, retencion, nombre_empresa, archivo)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (fecha, cantidad_bruta, cantidad_neta, retencion, nombre_empresa, file_path))
            conn.commit()
            new_id = cursor.lastrowid
            cursor.close()
            conn.close()
            return jsonify({"message": "Factura agregada", "id": new_id}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        start = request.args.get('start')
        end = request.args.get('end')
        try:
            conn = create_connection()
            cursor = conn.cursor(dictionary=True)
            if start and end:
                sql = "SELECT * FROM facturas WHERE fecha BETWEEN %s AND %s"
                cursor.execute(sql, (start, end))
            else:
                sql = "SELECT * FROM facturas"
                cursor.execute(sql)
            results = cursor.fetchall()
            cursor.close()
            conn.close()
            return jsonify(results), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

# --------------------------
# Nuevos Endpoints para Autofill (Tickets y Facturas)
# --------------------------

@api.route('/tickets/autofill', methods=['POST'])
def autofill_ticket():
    try:
        if 'foto' not in request.files:
            return jsonify({"error": "No se proporcionó un archivo"}), 400
        file = request.files['foto']
        if file.filename == '':
            return jsonify({"error": "No se proporcionó un archivo válido"}), 400

        # Guardar archivo temporalmente
        temp_folder = os.path.join("temp")
        os.makedirs(temp_folder, exist_ok=True)
        temp_path = os.path.join(temp_folder, secure_filename(file.filename))
        file.save(temp_path)

        # Extraer texto del PDF
        reader = PdfReader(temp_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text() or ""
            text += page_text + " "
        if not text.strip():
            os.remove(temp_path)
            return jsonify({"error": "No se pudo extraer texto del ticket"}), 400

        # Construir prompt para extraer campos
        prompt = (
            "Extrae de este ticket los siguientes campos y devuelve un JSON con ellos: "
            "localizacion, dinero, motivo, fecha. "
            "Texto del ticket:\n\n" + text
        )

        # Configurar la API de generative AI
        genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
        model = genai.GenerativeModel("gemini-2.0-flash")
        chat = model.start_chat(history=[])
        response = chat.send_message(prompt, stream=False)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text.split("\n", 1)[1]
            if raw_text.endswith("```"):
                raw_text = raw_text.rsplit("```", 1)[0]
        raw_text = raw_text.strip()
        data = json.loads(raw_text)

        os.remove(temp_path)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api.route('/facturas/autofill', methods=['POST'])
def autofill_factura():
    try:
        if 'archivo' not in request.files:
            return jsonify({"error": "No se proporcionó un archivo"}), 400
        file = request.files['archivo']
        if file.filename == '':
            return jsonify({"error": "No se proporcionó un archivo válido"}), 400

        temp_folder = os.path.join("temp")
        os.makedirs(temp_folder, exist_ok=True)
        temp_path = os.path.join(temp_folder, secure_filename(file.filename))
        file.save(temp_path)

        reader = PdfReader(temp_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text() or ""
            text += page_text + " "
        if not text.strip():
            os.remove(temp_path)
            return jsonify({"error": "No se pudo extraer texto de la factura"}), 400

        # Prompt actualizado: se especifica que "retencion" es el porcentaje de IRPF aplicado (por ejemplo, 15)
        prompt = (
            "Extrae de este documento los siguientes campos y devuelve un JSON con ellos: "
            "fecha, cantidad_bruta, cantidad_neta, retencion (el porcentaje de IRPF aplicado, sin signo negativo, por ejemplo, 15), "
            "y nombre_empresa. "
            "Texto de la factura:\n\n" + text
        )

        from dotenv import load_dotenv
        load_dotenv()
        genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
        model = genai.GenerativeModel("gemini-2.0-flash")
        chat = model.start_chat(history=[])
        response = chat.send_message(prompt, stream=False)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text.split("\n", 1)[1]
            if raw_text.endswith("```"):
                raw_text = raw_text.rsplit("```", 1)[0]
        raw_text = raw_text.strip()
        data = json.loads(raw_text)

        os.remove(temp_path)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------
# Endpoints de Exportación (Desplazamientos, Tickets y Facturas)
# --------------------------
@api.route('/desplazamientos/export', methods=['GET'])
def export_desplazamientos():
    start = request.args.get('start')
    end = request.args.get('end')
    try:
        conn = create_connection()
        cursor = conn.cursor(dictionary=True)
        if start and end:
            sql = "SELECT * FROM desplazamientos WHERE fecha BETWEEN %s AND %s"
            cursor.execute(sql, (start, end))
        else:
            sql = "SELECT * FROM desplazamientos"
            cursor.execute(sql)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        if not rows:
            return jsonify({"error": "No se encontraron datos"}), 404
        df = pd.DataFrame(rows)
        output = BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='Desplazamientos')
        output.seek(0)
        return send_file(
            output,
            download_name="desplazamientos.xlsx",
            as_attachment=True,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api.route('/tickets/export', methods=['GET'])
def export_tickets():
    start = request.args.get('start')
    end = request.args.get('end')
    try:
        conn = create_connection()
        cursor = conn.cursor(dictionary=True)
        if start and end:
            sql = "SELECT * FROM tickets_comida WHERE fecha BETWEEN %s AND %s"
            cursor.execute(sql, (start, end))
        else:
            sql = "SELECT * FROM tickets_comida"
            cursor.execute(sql)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        if not rows:
            return jsonify({"error": "No se encontraron datos"}), 404
        df = pd.DataFrame(rows)
        output = BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='Tickets_Comida')
        output.seek(0)
        return send_file(
            output,
            download_name="tickets_comida.xlsx",
            as_attachment=True,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api.route('/facturas/export', methods=['GET'])
def export_facturas():
    start = request.args.get('start')
    end = request.args.get('end')
    try:
        conn = create_connection()
        cursor = conn.cursor(dictionary=True)
        if start and end:
            sql = "SELECT * FROM facturas WHERE fecha BETWEEN %s AND %s"
            cursor.execute(sql, (start, end))
        else:
            sql = "SELECT * FROM facturas"
            cursor.execute(sql)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        if not rows:
            return jsonify({"error": "No se encontraron datos"}), 404
        df = pd.DataFrame(rows)
        output = BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='Facturas')
        output.seek(0)
        return send_file(
            output,
            download_name="facturas.xlsx",
            as_attachment=True,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
