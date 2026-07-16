import os, uuid, zipfile, io, re
from datetime import datetime
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from sqlalchemy import create_engine, Column, String, DateTime, text
from sqlalchemy.orm import declarative_base, sessionmaker
from docx import Document
from docx.shared import Pt, Cm
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from dotenv import load_dotenv

load_dotenv()

# ── APP ──────────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)
app.config['UPLOAD_FOLDER']    = 'uploads'
app.config['GENERATED_FOLDER'] = 'generated'
app.config['TEMPLATE']         = 'imtihon_varaqasi (1).docx'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# ── DATABASE ─────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://localhost/stipendiya')
engine  = create_engine(DATABASE_URL, pool_pre_ping=True)
Base    = declarative_base()
Session = sessionmaker(bind=engine)

class Student(Base):
    __tablename__ = 'students'
    id              = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    familiya        = Column(String, nullable=False)
    ism             = Column(String, nullable=False)
    otasining_ismi  = Column(String, nullable=False)
    fakultet        = Column(String, nullable=False)
    yonalish        = Column(String, nullable=False)
    kurs            = Column(String, nullable=False)
    stipendiya      = Column(String, nullable=False)
    photo_path      = Column(String, nullable=True)
    doc_filename    = Column(String, nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(engine)

# ── HELPERS ───────────────────────────────────────────────────────────────────
TUTUQ_AFTER  = re.compile(r"([oOgGaAuUeEiI])'")   # straight apostrophe after vowel → U+2019
_TUTUQ_CHAR  = '\u2019'
def fix_apostrophes(text: str) -> str:
    """Replace straight apostrophes after vowels (tutuq belgisi) with ' (U+2019)."""
    return TUTUQ_AFTER.sub(lambda m: m.group(1) + _TUTUQ_CHAR, text)

def student_to_dict(s: Student) -> dict:
    return {
        'id': s.id, 'familiya': s.familiya, 'ism': s.ism,
        'otasining_ismi': s.otasining_ismi, 'fakultet': s.fakultet,
        'yonalish': s.yonalish, 'kurs': s.kurs, 'stipendiya': s.stipendiya,
        'doc_filename': s.doc_filename,
        'created_at': s.created_at.isoformat() if s.created_at else None,
    }

def replace_para_text(para, new_text: str, bold=None):
    first = para.runs[0] if para.runs else None
    for run in list(para.runs):
        run._element.getparent().remove(run._element)
    run = para.add_run(new_text)
    if bold is not None:
        run.bold = bold
    elif first:
        run.bold = first.bold
        if first.font.size:
            run.font.size = first.font.size
    return run

def insert_image_in_cell(cell, image_path: str, w_cm=3.0, h_cm=4.0):
    for para in cell.paragraphs:
        for run in list(para.runs):
            run._element.getparent().remove(run._element)
    para = cell.paragraphs[0]
    pPr = para._element.find(qn('w:pPr'))
    if pPr is not None:
        sp = pPr.find(qn('w:spacing'))
        if sp is not None:
            pPr.remove(sp)
    if pPr is None:
        pPr = OxmlElement('w:pPr')
        para._element.insert(0, pPr)
    sp_el = OxmlElement('w:spacing')
    sp_el.set(qn('w:before'), '0')
    sp_el.set(qn('w:after'),  '0')
    pPr.append(sp_el)
    para.alignment = 1
    para.add_run().add_picture(image_path, width=Cm(w_cm), height=Cm(h_cm))

def generate_document(student: Student) -> str:
    doc = Document(app.config['TEMPLATE'])
    info_table = doc.tables[1]
    info_cell  = info_table.rows[0].cells[0]
    photo_cell = info_table.rows[0].cells[1]

    full_name = fix_apostrophes(
        f"{student.familiya} {student.ism} {student.otasining_ismi}"
    )
    fakultet  = fix_apostrophes(student.fakultet)
    yonalish  = fix_apostrophes(student.yonalish)
    kurs      = fix_apostrophes(student.kurs)
    stip      = fix_apostrophes(student.stipendiya)

    paras = info_cell.paragraphs
    if len(paras) >= 1: replace_para_text(paras[0], f"Ismi va familiya:  {full_name}")
    if len(paras) >= 2: replace_para_text(paras[1], f"Fakultet:  {fakultet}")
    if len(paras) >= 3: replace_para_text(paras[2], f"Yo\u2019nalish:  {yonalish}")

    kurs_p = OxmlElement('w:p')
    kurs_r = OxmlElement('w:r')
    kurs_t = OxmlElement('w:t')
    kurs_t.text = f"Kurs:  {kurs}"
    kurs_r.append(kurs_t); kurs_p.append(kurs_r)
    info_cell._element.append(kurs_p)

    if student.photo_path and os.path.exists(student.photo_path):
        insert_image_in_cell(photo_cell, student.photo_path)

    for para in doc.paragraphs:
        if 'NOMLI' in para.text and 'STIPENDIYA' in para.text:
            replace_para_text(
                para,
                f"O\u2018ZBEKISTON RESPUBLIKA PREZIDENTI "
                f"{stip.upper()} DAVLAT STIPENDIYASI",
                bold=True,
            )
            break

    safe = f"{student.familiya}_{student.ism}".replace(' ', '_')
    fname = f"{safe}_{student.id[:8]}.docx"
    doc.save(os.path.join(app.config['GENERATED_FOLDER'], fname))
    return fname

# ── ROUTES ────────────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/yuklab-olish')
def download_page():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(_):
    return send_from_directory(app.static_folder, 'index.html')

# ── API: students ─────────────────────────────────────────────────────────────
@app.route('/api/students', methods=['GET'])
def get_students():
    with Session() as db:
        rows = db.query(Student).order_by(Student.created_at).all()
        return jsonify([student_to_dict(s) for s in rows])

@app.route('/api/students', methods=['POST'])
def add_student():
    data  = request.form.to_dict()
    photo = request.files.get('photo')

    sid        = str(uuid.uuid4())
    photo_path = None
    if photo and photo.filename:
        ext        = os.path.splitext(photo.filename)[1].lower()
        photo_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{sid}{ext}")
        photo.save(photo_path)

    with Session() as db:
        s = Student(
            id             = sid,
            familiya       = data.get('familiya', '').strip(),
            ism            = data.get('ism', '').strip(),
            otasining_ismi = data.get('otasining_ismi', '').strip(),
            fakultet       = data.get('fakultet', '').strip(),
            yonalish       = data.get('yonalish', '').strip(),
            kurs           = data.get('kurs', '').strip(),
            stipendiya     = data.get('stipendiya', '').strip(),
            photo_path     = photo_path,
        )
        try:
            s.doc_filename = generate_document(s)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        db.add(s); db.commit(); db.refresh(s)
        return jsonify(student_to_dict(s)), 201

@app.route('/api/students/<sid>', methods=['DELETE'])
def delete_student(sid):
    with Session() as db:
        s = db.get(Student, sid)
        if not s:
            return jsonify({'error': 'Not found'}), 404
        if s.photo_path and os.path.exists(s.photo_path):
            os.remove(s.photo_path)
        if s.doc_filename:
            p = os.path.join(app.config['GENERATED_FOLDER'], s.doc_filename)
            if os.path.exists(p): os.remove(p)
        db.delete(s); db.commit()
        return jsonify({'ok': True})

# ── API: downloads ────────────────────────────────────────────────────────────
@app.route('/api/download/<sid>')
def download_student(sid):
    with Session() as db:
        s = db.get(Student, sid)
        if not s or not s.doc_filename:
            return jsonify({'error': 'Not found'}), 404
        path = os.path.join(app.config['GENERATED_FOLDER'], s.doc_filename)
        if not os.path.exists(path):
            return jsonify({'error': 'File missing'}), 404
        return send_file(path, as_attachment=True, download_name=s.doc_filename,
                         mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document')

@app.route('/api/download-all')
def download_all():
    with Session() as db:
        rows = db.query(Student).all()
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        for s in rows:
            if s.doc_filename:
                p = os.path.join(app.config['GENERATED_FOLDER'], s.doc_filename)
                if os.path.exists(p):
                    zf.write(p, s.doc_filename)
    buf.seek(0)
    return send_file(buf, as_attachment=True, download_name='imtihon_varaqalari.zip', mimetype='application/zip')

# ─────────────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'],    exist_ok=True)
    os.makedirs(app.config['GENERATED_FOLDER'], exist_ok=True)
    app.run(debug=True, port=5050)
