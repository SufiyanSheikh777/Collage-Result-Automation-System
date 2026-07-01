import os
import io
import time
import json
# from datetime import datetime
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
load_dotenv()
from DB.database import (
    SessionResults,  # For marks/results
    SessionAuth, 
    SessionStudentPersonal,    # For login/register
    ResultCache, 
    Teacher, 
    Student,
    get_student_marks_db,
    init_db
)
# from DB.database import SessionLocal, ResultCache, init_db, engine
# from DB.database import SessionLocal, ResultCache, init_db, engine
from werkzeug.security import generate_password_hash, check_password_hash
# from DB.database import SessionLocal, Teacher, Student, init_db
init_db()

from sqlalchemy import create_engine, Column, String, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from scraper.fetcher import fetch_all_results
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
from PIL import Image
from sqlalchemy import func
from scraper.fetcher import fetch_single_with_retries, parse_full_marksheet_student, create_driver, fetch_student_login_data
import pytesseract

# ------------------------------
# CONFIGURATION
# ------------------------------
# def open_correct_result_page(driver):
#     driver.get("https://result.msbte.ac.in")
#     time.sleep(2)

#     # Find the dynamic result link (Summer/Winter)
#     possible_texts = [
#         "Click here to see",
#         "Diploma Results",
#         "Click here"
#     ]

#     links = driver.find_elements(By.TAG_NAME, "a")
#     for link in links:
#         txt = link.text.strip()
#         if any(x.lower() in txt.lower() for x in possible_texts):
#             link.click()
#             time.sleep(2)
#             return True

#     return False

MSBTE_URL = "https://result.msbte.ac.in/pcwebBTRes/pcResult01/pcfrmViewMSBTEResult.aspx"
HEADLESS = False

BASE_DIR = os.path.dirname(__file__)
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
DB_FILE = os.path.join(BASE_DIR, "results_cache.sqlite")
ENROLL_FILE = os.path.join(UPLOAD_FOLDER, "enrollment_list.txt")

ALLOWED_EXTENSIONS = {"txt"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(STORAGE_DIR, exist_ok=True)

# Tesseract path (if needed)
TESSERACT_CMD = os.getenv("TESSERACT_CMD")
if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD


# ------------------------------
# DATABASE
# ------------------------------

# Base = declarative_base()
# engine = create_engine(f"sqlite:///{DB_FILE}", echo=False, future=True)
# SessionLocal = sessionmaker(bind=engine)


# class ResultCache(Base):
#     __tablename__ = "results"

#     seat = Column(String, primary_key=True)
#     data = Column(Text)
#     ocr = Column(String)
#     fetched_at = Column(DateTime, default=datetime.utcnow)


# Base.metadata.create_all(bind=engine)


# ------------------------------
# FLASK APP
# ------------------------------

app = Flask(__name__)
CORS(app)

# ------------------------------
# Utility Functions
# ------------------------------

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# def create_driver(headless=True):
#     chrome_options = Options()
#     if HEADLESS:
#         chrome_options.add_argument("--headless=new")
#     chrome_options.add_argument("--disable-gpu")
#     chrome_options.add_argument("--no-sandbox")
#     chrome_options.add_argument("--disable-dev-shm-usage")
#     chrome_options.add_argument("--window-size=1280,900")

#     return webdriver.Chrome(ChromeDriverManager().install(), options=chrome_options)
def create_driver(headless=False):
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    # Use Service() to specify the driver path
    service = Service(ChromeDriverManager().install())
    
    # Pass service and options as explicit keyword arguments to avoid positional errors
    driver = webdriver.Chrome(service=service, options=chrome_options)
    return driver

def ocr_captcha(captcha_el):
    image_bytes = captcha_el.screenshot_as_png
    img = Image.open(io.BytesIO(image_bytes)).convert("L")
    img = img.point(lambda x: 0 if x < 150 else 255, "1")

    text = pytesseract.image_to_string(
        img,
        config="--psm 7 -c tessedit_char_whitelist=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    )

    text = "".join([c for c in text if c.isalnum()])
    return text.strip()


def parse_result_html(html):
    soup = BeautifulSoup(html, "html.parser")
    data = {}

    text = soup.get_text(" ", strip=True)
    data["text_snippet"] = text[:2000]

    if "PASS" in text.upper():
        data["status"] = "PASS"
    elif "FAIL" in text.upper():
        data["status"] = "FAIL"

    return data


# ------------------------------
# ROUTES
# ------------------------------

# 1) Upload Enrollment List
@app.route("/upload_list", methods=["POST"])
def upload_list():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if not allowed_file(file.filename):
        return jsonify({"error": "Only .txt allowed"}), 400

    file.save(ENROLL_FILE)

    return jsonify({"message": "Enrollment list uploaded successfully"}), 200

# 2) Fetch All Results (Selenium + OCR)
# --- Add these two helper functions at the top of your app.py or just before the route ---
def safe_float(val):
    try:
        # Remove %, whitespace, and convert to float
        if val is None: return 0.0
        return float(str(val).replace('%', '').strip())
    except (ValueError, TypeError):
        return 0.0

def safe_int(val):
    try:
        if val is None: return 0
        return int(str(val).strip())
    except (ValueError, TypeError):
        return 0

@app.route("/fetch_results", methods=["GET"])
def fetch_results():
    filepath = os.path.join(UPLOAD_FOLDER, "enrollment_list.txt")
    
    if not os.path.exists(filepath):
        return jsonify({"error": "No enrollment list found"}), 400

    # Call your scraper
    results = fetch_all_results(filepath, headless=False)

    db = SessionResults()
    saved_count = 0

    for r in results:
        # Basic validation: ensure we have a result and it's not an error dictionary
        if not r or "error" in r or r.get("student_name") in ["N/A", "Unknown", None]:
            continue
        
        raw_status = r.get("status", "Unknown")

        # Create/Update the record using the SAFE conversion functions
        new_record = ResultCache(
            enroll=r.get("enroll"),
            seat=r.get("seat_no", "N/A"),
            student_name=r.get("student_name", "Unknown"),
            course=r.get("course", "N/A"), 
            # These lines use the new helper functions to prevent crashing
            percentage=safe_float(r.get("percentage")),
            status=raw_status,
            obtained=safe_int(r.get("total_marks_obtained")),
            total_max=safe_int(r.get("total_max_marks")),
            data=json.dumps(r), 
            fetched_at=datetime.utcnow()
        )

        db.merge(new_record) 
        saved_count += 1

    db.commit()
    db.close()

    return jsonify({
        "message": "Fetch complete",
        "saved": saved_count
    })

# 3) Dashboard Stats (simple)
@app.route("/get_analytics")
def get_analytics():
    db = SessionResults()
    try:
        # 1. Overall Stats for Top Cards
        total = db.query(ResultCache).count()
        passed = db.query(ResultCache).filter(ResultCache.status.ilike("Pass")).count()
        failed = db.query(ResultCache).filter(ResultCache.status.ilike("Fail")).count()
        
        all_p = db.query(ResultCache.percentage).all()
        avg_p = sum([p[0] for p in all_p if p[0]]) / len(all_p) if all_p else 0

        # 2. Branch Performance (Average per Branch)
        # Groups data by 'course' (Branch) and calculates average percentage
        branch_data = db.query(
            ResultCache.course, 
            func.avg(ResultCache.percentage),
            func.count(ResultCache.enroll)
        ).group_by(ResultCache.course).all()

        branch_performance = [
            {"name": b[0], "avg": round(b[1], 2), "count": b[2]} for b in branch_data
        ]

        # 3. Top Performers (Topper from each branch)
        top_performers = []
        distinct_branches = db.query(ResultCache.course).distinct().all()
        
        for (branch_name,) in distinct_branches:
            topper = db.query(ResultCache).filter(ResultCache.course == branch_name)\
                       .order_by(ResultCache.percentage.desc()).first()
            if topper:
                top_performers.append({
                    "name": topper.student_name,
                    "branch": topper.course,
                    "percentage": topper.percentage,
                    "rank": 1
                })

        return jsonify({
            "overall": {
                "total": total,
                "passed": passed,
                "failed": failed,
                "average": round(avg_p, 2)
            },
            "branch_performance": branch_performance,
            "top_performers": top_performers
        })
    finally:
        db.close()

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    db = SessionAuth() # <--- Connects to auth.sqlite
    try:
        if 'email' in data: # Teacher
            new_user = Teacher(
                full_name=data['fullName'],
                email=data['email'],
                password=generate_password_hash(data['password']),
                branch=data.get('branch')
            )
        else: # Student Registration
            # Ensure we use the correct key from RegisterForm.tsx: 'enrollmentNumber'
            enrollment = data.get('enrollmentNumber')
            
            # Check if this enrollment already exists to give a better error message
            existing = db.query(Student).filter(Student.enrollment == enrollment).first()
            if existing:
                return jsonify({"error": "Enrollment number already registered"}), 400

            new_user = Student(
                full_name=data['fullName'],
                enrollment=enrollment,
                branch=data.get('branch'),
                password=None # Students don't need a password in your logic
            )
        
        db.add(new_user)
        db.commit()
        return jsonify({"message": "Registration successful"}), 201

    except Exception as e:
        db.rollback()
        print(f"Registration Error: {e}")
        return jsonify({"error": "An unexpected error occurred during registration"}), 500
    finally:
        db.close()

@app.route("/login", methods=["GET","POST"])
def login():
    data = request.json
    db = SessionAuth() # <--- Connects to auth.sqlite
    try:
        if 'email' in data: # Teacher Login
            user = db.query(Teacher).filter(Teacher.email == data['email']).first()
            if user and check_password_hash(user.password, data['password']):
                return jsonify({"role": "teacher", "name": user.full_name}), 200
        else: # Student Login
            user = db.query(Student).filter(Student.enrollment == data['enrollmentNumber']).first()
            if user:
                return jsonify({"role": "student", "name": user.full_name}), 200
        
        return jsonify({"error": "Invalid credentials"}), 401
    finally:
        db.close()


# --- RESULT ROUTES (Uses SessionResults) ---

@app.route("/get_results", methods=["GET"])
def get_results():
    db = SessionResults() # <--- Connects to results_cache.sqlite
    try:
        rows = db.query(ResultCache).all()
        output = []
        for row in rows:
            output.append({
                "enroll": row.enroll,
                "seat": row.seat,
                "studentName": row.student_name,
                "branch": row.course,
                "semester": row.semester,
                "percentage": row.percentage,
                "status": row.status,
                "obtained": row.obtained,
                "total_max": row.total_max,
                "fetched_at": row.fetched_at.strftime("%Y-%m-%d %H:%M:%S") if row.fetched_at else "N/A",
                "details": json.loads(row.data) if row.data else {}
            })
        return jsonify(output)
    finally:
        db.close()

# backend/app.py

# backend/app.py

@app.route("/login/student", methods=["POST"])
def student_login():
    data = request.json
    enrollment = data.get("enrollmentNumber")
    db = SessionAuth() 
    
    try:
        # Check if student exists in AUTH database
        student = db.query(Student).filter(Student.enrollment == enrollment).first()
        if not student:
            return jsonify({"error": "Enrollment not registered"}), 401

        # Run Scraper (Set to headless=True to avoid window popups during login)
        driver = create_driver(headless=False) 
        try:
            fetch_student_login_data(driver, enrollment)
        except Exception as e:
            print(f"Scraper Error: {e}")
        finally:
            driver.quit()

        # Final Success Response
        return jsonify({
            "status": "success",
            "role": "student",
            "name": student.full_name or "Student",
            "user": {
                "role": "student",
                "name": student.full_name or "Student",
                "enrollment": enrollment
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route('/get_student_marks')
def get_student_marks():
    enroll = request.args.get('enroll')
    if not enroll:
        return jsonify({"error": "Enrollment number is required"}), 400

    # 1. CHECK DATABASE FIRST (Skip feature)
    # Ensure get_student_marks_db is imported from database.py
    cached_data = get_student_marks_db(enroll)
    if cached_data:
        print(f"🚀 [DATABASE HIT] Found {enroll} in student_marks.sqlite. Skipping Scraper.")
        return jsonify(json.loads(cached_data))

    # 2. IF NOT FOUND, RUN SCRAPER
    print(f"🔍 [DATABASE MISS] {enroll} not found locally. Starting Scraper...")
    try:
        # FIX: Removed 'driver' because fetcher.py handles its own driver internally
        student_data = parse_full_marksheet_student(enroll) 
        
        if student_data and student_data.get("enroll"):
            # Your scraper already saves this to student_marks.sqlite
            return jsonify(student_data)
        
        return jsonify({"error": "No data found on MSBTE"}), 404

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


# ------------------------------
# Run App
# ------------------------------

# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=5000, debug=True)

# backend/app.py

# @app.route("/get_results", methods=["GET"])
# def get_results():
#     db = SessionLocal()
#     try:
#         rows = db.query(ResultCache).all()
#         output = []
#         for row in rows:
#             output.append({
#                 "enroll": row.enroll,
#                 "seat": row.seat,
#                 "studentName": row.student_name,
#                 "branch": row.course,
#                 "percentage": row.percentage,
#                 "status": row.status,
#                 "obtained": row.obtained,
#                 "total_max": row.total_max,
#                 "fetched_at": row.fetched_at.strftime("%Y-%m-%d %H:%M:%S") if row.fetched_at else "N/A",
#                 "details": json.loads(row.data) if row.data else {}
#             })
#         return jsonify(output)
#     finally:
#         db.close()