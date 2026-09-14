import os
import io
import time
import json
# from datetime import datetime
from datetime import datetime
from flask import Flask, request, jsonify, send_file
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
    College,
    Department,
    get_student_marks_db,
    init_db
)
from werkzeug.security import generate_password_hash, check_password_hash
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
from sqlalchemy import func, or_
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
os.makedirs(os.path.join(STORAGE_DIR, "pdf"), exist_ok=True)

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
# Note: create_driver is imported from scraper.fetcher with full anti-bot evasion and CDP stealth scripts

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
import re

def safe_float(val):
    try:
        if val is None: return 0.0
        val_str = str(val).replace('%', '').strip()
        m = re.search(r'\d+(\.\d+)?', val_str)
        return float(m.group(0)) if m else 0.0
    except (ValueError, TypeError):
        return 0.0

def safe_int(val):
    try:
        if val is None: return 0
        s = str(val).strip()
        if "=" in s:
            s = s.split("=")[-1].strip()
        if "+" in s:
            parts = re.findall(r'\d+', s)
            return sum(int(p) for p in parts) if parts else 0
        digits = re.findall(r'\d+', s)
        return int(digits[0]) if digits else 0
    except (ValueError, TypeError):
        return 0

@app.route("/download_pdf/<enroll>", methods=["GET"])
def download_pdf(enroll):
    pdf_path = os.path.join(STORAGE_DIR, "pdf", f"{enroll}.pdf")
    if os.path.exists(pdf_path):
        return send_file(pdf_path, as_attachment=True, download_name=f"MSBTE_Marksheet_{enroll}.pdf", mimetype="application/pdf")
    
    alt_path = os.path.join(STORAGE_DIR, f"{enroll}.pdf")
    if os.path.exists(alt_path):
        return send_file(alt_path, as_attachment=True, download_name=f"MSBTE_Marksheet_{enroll}.pdf", mimetype="application/pdf")

    return jsonify({"error": f"PDF not found for enrollment {enroll}. Please re-fetch results to generate the PDF."}), 404

@app.route("/view_pdf/<enroll>", methods=["GET"])
def view_pdf(enroll):
    pdf_path = os.path.join(STORAGE_DIR, "pdf", f"{enroll}.pdf")
    if os.path.exists(pdf_path):
        return send_file(pdf_path, as_attachment=False, mimetype="application/pdf")
    alt_path = os.path.join(STORAGE_DIR, f"{enroll}.pdf")
    if os.path.exists(alt_path):
        return send_file(alt_path, as_attachment=False, mimetype="application/pdf")
    return jsonify({"error": "PDF not found"}), 404

@app.route("/reset_data", methods=["POST", "DELETE"])
def reset_data():
    try:
        # 1. Clear results cache (results_cache.sqlite)
        db_res = SessionResults()
        try:
            db_res.query(ResultCache).delete()
            db_res.commit()
        finally:
            db_res.close()

        # 2. Clear student personal marks cache (student_marks.sqlite)
        db_marks = SessionStudentPersonal()
        try:
            db_marks.query(ResultCache).delete()
            db_marks.commit()
        finally:
            db_marks.close()

        # 3. Clear all captured PDF files
        pdf_dir = os.path.join(STORAGE_DIR, "pdf")
        if os.path.exists(pdf_dir):
            for fname in os.listdir(pdf_dir):
                fpath = os.path.join(pdf_dir, fname)
                try:
                    if os.path.isfile(fpath):
                        os.remove(fpath)
                except:
                    pass

        return jsonify({
            "success": True,
            "message": "All student result, marks, and PDF data have been reset successfully."
        }), 200
    except Exception as e:
        print(f"Reset Error: {e}")
        return jsonify({"error": f"Failed to reset data: {str(e)}"}), 500

@app.route("/fetch_results", methods=["GET"])
def fetch_results():
    filepath = os.path.join(UPLOAD_FOLDER, "enrollment_list.txt")
    
    if not os.path.exists(filepath):
        return jsonify({"error": "No enrollment list found"}), 400

    target_college_id = safe_int(request.args.get("college_id")) or 1

    # Call scraper
    results = fetch_all_results(filepath, headless=False)

    db = SessionResults()
    saved_count = 0

    for r in results:
        # Basic validation: ensure we have a result and it's not an error dictionary
        if not r or "error" in r or r.get("student_name") in ["N/A", "Unknown", None]:
            continue
        
        raw_status = r.get("status", "Unknown")
        sem_val = safe_int(r.get("semester")) or 6

        # Create/Update the record using the SAFE conversion functions
        new_record = ResultCache(
            enroll=r.get("enroll"),
            seat=r.get("seat_no", "N/A"),
            student_name=r.get("student_name", "Unknown"),
            course=r.get("course", "N/A"), 
            semester=sem_val,
            percentage=safe_float(r.get("percentage")),
            status=raw_status,
            obtained=safe_int(r.get("total_marks_obtained")),
            total_max=safe_int(r.get("total_max_marks")),
            data=json.dumps(r), 
            fetched_at=datetime.utcnow(),
            college_id=target_college_id
        )

        db.merge(new_record) 
        saved_count += 1

    db.commit()
    db.close()

    return jsonify({
        "message": "Fetch complete",
        "saved": saved_count
    })

def branch_matches_filter(course_name, target_branch):
    if not target_branch or str(target_branch).strip().lower() in ["all", "", "null", "undefined"]:
        return True
    c = (course_name or "").strip().lower()
    t = str(target_branch).strip().lower()
    
    # Direct match or substring
    if t == c or t in c or c in t:
        return True

    # Common MSBTE code and branch keywords mappings
    import re
    keyword_map = {
        "co": ["computer", "cse", "it", "information technology"],
        "cw": ["computer", "cse"],
        "me": ["mechanical"],
        "ce": ["civil"],
        "ee": ["electrical"],
        "ej": ["electronic", "telecom", "extc", "entronics"],
        "et": ["electronic", "telecom", "extc", "entronics"],
        "if": ["information technology", "it"],
        "ch": ["chemical"],
        "ae": ["auto"]
    }

    # If t is a 2-letter code
    if len(t) == 2 and t in keyword_map:
        if any(kw in c for kw in keyword_map[t]): return True
    # If c is a 2-letter code
    if len(c) == 2 and c in keyword_map:
        if any(kw in t for kw in keyword_map[c]): return True

    # Check shared keyword group
    for code, keywords in keyword_map.items():
        if any(kw in t for kw in keywords):
            if any(kw in c for kw in keywords):
                return True

    # Check for [CODE] format in target_branch e.g. "[CW] computer science"
    match_t = re.search(r'\[([a-z0-9]{2})\]', t)
    if match_t:
        t_code = match_t.group(1)
        if t_code in keyword_map and any(kw in c for kw in keyword_map[t_code]):
            return True
        if len(c) == 2 and c == t_code:
            return True

    return False

# 3) Dashboard Stats
@app.route("/get_analytics")
def get_analytics():
    db = SessionResults()
    try:
        branch = request.args.get("branch")
        college_id = request.args.get("college_id")

        query = db.query(ResultCache)
        if college_id and college_id != "all":
            try:
                cid = int(college_id)
                cid_count = db.query(ResultCache).filter(ResultCache.college_id == cid).count()
                if cid_count > 0:
                    query = query.filter(ResultCache.college_id == cid)
                else:
                    query = query.filter(or_(ResultCache.college_id == cid, ResultCache.college_id == 1, ResultCache.college_id == 4, ResultCache.college_id == None))
            except (ValueError, TypeError):
                pass

        all_records = query.all()
        # Filter by branch if provided
        filtered_records = [r for r in all_records if branch_matches_filter(r.course, branch)]

        total = len(filtered_records)
        passed = sum(1 for r in filtered_records if (r.status or "").strip().lower() == "pass")
        failed = sum(1 for r in filtered_records if (r.status or "").strip().lower() == "fail")
        percentages = [r.percentage for r in filtered_records if r.percentage is not None]
        avg_p = sum(percentages) / len(percentages) if percentages else 0

        # Branch performance breakdown
        branches_dict = {}
        for r in filtered_records:
            b = r.course or "General"
            if b not in branches_dict:
                branches_dict[b] = []
            if r.percentage is not None:
                branches_dict[b].append(r.percentage)

        branch_performance = []
        for b_name, b_pcts in branches_dict.items():
            b_avg = sum(b_pcts) / len(b_pcts) if b_pcts else 0
            branch_performance.append({
                "name": b_name,
                "avg": round(b_avg, 2),
                "count": len(b_pcts)
            })

        # Top performers
        top_performers = []
        for b_name in branches_dict.keys():
            b_students = [r for r in filtered_records if (r.course or "General") == b_name]
            if b_students:
                topper = max(b_students, key=lambda x: x.percentage or 0)
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
    data = request.json or {}
    db = SessionAuth() # <--- Connects to auth.sqlite
    try:
        if 'email' in data: # Teacher Registration
            email = str(data.get('email', '')).strip().lower()
            if not email:
                return jsonify({"error": "Email is required"}), 400
            
            existing = db.query(Teacher).filter(Teacher.email == email).first()
            if existing:
                return jsonify({"error": "A faculty member with this email is already registered."}), 400

            college_id = data.get('collegeId') or data.get('college_id') or 1
            phone_num = str(data.get('phone') or data.get('mobileNumber') or '').strip()
            new_user = Teacher(
                college_id=college_id,
                full_name=data.get('fullName', '').strip(),
                email=email,
                password=generate_password_hash(data.get('password', '')),
                branch=data.get('branch', '').strip(),
                phone=phone_num if phone_num else None,
                role="teacher",
                is_hod=0,
                status="pending"  # Requires approval by HOD or Admin
            )
            db.add(new_user)
            db.commit()
            return jsonify({
                "message": "Registration submitted! Your account is pending verification by your department HOD or College Admin.",
                "status": "pending",
                "role": "teacher"
            }), 201
        else: # Student Registration (no verification needed per user instruction)
            enrollment = str(data.get('enrollmentNumber', '')).strip()
            if not enrollment:
                return jsonify({"error": "Enrollment number is required"}), 400

            existing = db.query(Student).filter(Student.enrollment == enrollment).first()
            if existing:
                return jsonify({"error": "Enrollment number already registered"}), 400

            college_id = data.get('collegeId') or data.get('college_id') or 1
            new_user = Student(
                college_id=college_id,
                full_name=data.get('fullName', '').strip(),
                enrollment=enrollment,
                branch=data.get('branch', '').strip(),
                password=None
            )
            db.add(new_user)
            db.commit()
            return jsonify({
                "message": "Registration successful! You can now log in with your enrollment number.",
                "status": "approved",
                "role": "student"
            }), 201

    except Exception as e:
        db.rollback()
        print(f"Registration Error: {e}")
        return jsonify({"error": "An unexpected error occurred during registration"}), 500
    finally:
        db.close()

# ==========================================
# MULTI-TENANT & COLLEGE MANAGEMENT ROUTES
# ==========================================

@app.route("/api/colleges", methods=["GET"])
def get_all_colleges():
    db = SessionAuth()
    try:
        colleges = db.query(College).all()
        return jsonify([{
            "id": c.id,
            "msbteCode": c.msbte_code,
            "name": c.name,
            "shortName": c.short_name or c.name,
            "region": c.region,
            "instituteType": c.institute_type
        } for c in colleges]), 200
    finally:
        db.close()

@app.route("/api/college/register", methods=["POST"])
def register_college():
    data = request.json or {}
    msbte_code = str(data.get("msbteCode", "")).strip()
    college_name = str(data.get("collegeName", "")).strip()
    short_name = str(data.get("shortName", "")).strip() or college_name
    region = str(data.get("region", "")).strip()
    institute_type = str(data.get("instituteType", "Unaided / Private")).strip()
    admin_name = str(data.get("adminName", "")).strip()
    admin_email = str(data.get("adminEmail", "")).strip().lower()
    admin_phone = str(data.get("adminPhone", "")).strip()
    password = str(data.get("password", "")).strip()
    departments_input = data.get("departments", [])

    if not msbte_code or not college_name or not admin_email or not password:
        return jsonify({"error": "MSBTE Code, College Name, Admin Email, and Password are required."}), 400

    db = SessionAuth()
    try:
        # Check duplicate MSBTE code
        existing_code = db.query(College).filter(College.msbte_code == msbte_code).first()
        if existing_code:
            return jsonify({"error": f"A college with MSBTE Code '{msbte_code}' is already registered."}), 400

        # Check duplicate Admin email
        existing_email = db.query(Teacher).filter(Teacher.email == admin_email).first()
        if existing_email:
            return jsonify({"error": f"An account with email '{admin_email}' already exists."}), 400

        # 1. Create College
        new_college = College(
            msbte_code=msbte_code,
            name=college_name,
            short_name=short_name,
            region=region,
            institute_type=institute_type,
            admin_email=admin_email,
            admin_name=admin_name,
            phone=admin_phone
        )
        db.add(new_college)
        db.flush()  # to obtain new_college.id

        # 2. Create Departments
        created_depts = []
        if not departments_input:
            departments_input = [
                {"name": "Computer Engineering", "code": "CO"},
                {"name": "Mechanical Engineering", "code": "ME"},
                {"name": "Civil Engineering", "code": "CE"},
                {"name": "Electrical Engineering", "code": "EE"}
            ]

        for dept in departments_input:
            d_name = dept if isinstance(dept, str) else dept.get("name")
            d_code = dept.get("code", "") if isinstance(dept, dict) else ""
            if d_name:
                d_name = str(d_name).strip()
                d_code = str(d_code).strip().upper() if d_code else ""
                if not d_code:
                    ln = d_name.lower()
                    if "computer" in ln:
                        d_code = "CW"
                    elif "civil" in ln:
                        d_code = "CE"
                    elif "mech" in ln:
                        d_code = "ME"
                    elif "tele" in ln or "extc" in ln:
                        d_code = "EJ"
                    elif "electr" in ln:
                        d_code = "EE"
                    elif "info" in ln:
                        d_code = "IF"
                    else:
                        d_code = "".join([w[0].upper() for w in d_name.split()[:2]]) or "DP"
                new_dept = Department(college_id=new_college.id, name=d_name, code=d_code)
                db.add(new_dept)
                created_depts.append({"name": d_name, "code": d_code})

        # 3. Create College Admin Account
        admin_user = Teacher(
            college_id=new_college.id,
            full_name=admin_name,
            email=admin_email,
            password=generate_password_hash(password),
            branch="Administration",
            role="college_admin",
            is_hod=0,
            phone=admin_phone,
            status="approved"
        )
        db.add(admin_user)
        db.commit()

        college_payload = {
            "id": new_college.id,
            "msbteCode": new_college.msbte_code,
            "name": new_college.name,
            "shortName": new_college.short_name,
            "region": new_college.region
        }

        user_payload = {
            "id": admin_user.id,
            "name": admin_user.full_name,
            "email": admin_user.email,
            "role": "college_admin",
            "branch": "Administration",
            "college": college_payload
        }

        return jsonify({
            "message": "College registered successfully!",
            "college": college_payload,
            "user": user_payload
        }), 201

    except Exception as e:
        db.rollback()
        print(f"College Registration Error: {e}")
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500
    finally:
        db.close()

@app.route("/api/college/<int:college_id>/departments", methods=["GET", "POST"])
def college_departments(college_id):
    db = SessionAuth()
    try:
        if request.method == "POST":
            data = request.json or {}
            dept_name = str(data.get("name", "")).strip()
            dept_code = str(data.get("code", "")).strip()
            if not dept_name:
                return jsonify({"error": "Department name is required"}), 400
            
            dept = Department(college_id=college_id, name=dept_name, code=dept_code)
            db.add(dept)
            db.commit()
            return jsonify({"message": "Department added", "id": dept.id, "name": dept.name, "code": dept.code}), 201

        # GET method
        depts = db.query(Department).filter(Department.college_id == college_id).all()
        out = []
        for d in depts:
            staff_count = db.query(Teacher).filter(
                Teacher.college_id == college_id, 
                Teacher.branch == d.name
            ).count()
            out.append({
                "id": d.id,
                "name": d.name,
                "code": d.code or "",
                "hodName": d.hod_name or "Not Assigned",
                "hodEmail": d.hod_email or "",
                "staffCount": staff_count
            })
        return jsonify(out), 200
    finally:
        db.close()

@app.route("/api/college/<int:college_id>/staff", methods=["GET", "POST"])
def college_staff(college_id):
    db = SessionAuth()
    try:
        if request.method == "POST":
            data = request.json or {}
            full_name = str(data.get("fullName", "")).strip()
            email = str(data.get("email", "")).strip().lower()
            password = str(data.get("password", "Welcome@123")).strip()
            branch = str(data.get("branch", "")).strip()
            role = str(data.get("role", "teacher")).strip()
            is_hod = 1 if (role == "hod" or data.get("isHod")) else 0
            phone = str(data.get("phone", "")).strip()

            if not full_name or not email:
                return jsonify({"error": "Full name and email are required"}), 400

            existing = db.query(Teacher).filter(Teacher.email == email).first()
            if existing:
                return jsonify({"error": "A teacher with this email already exists"}), 400

            new_teacher = Teacher(
                college_id=college_id,
                full_name=full_name,
                email=email,
                password=generate_password_hash(password),
                branch=branch,
                role="hod" if is_hod else role,
                is_hod=is_hod,
                phone=phone
            )
            db.add(new_teacher)

            # If marked as HOD, ensure only ONE HOD for this department
            if is_hod and branch:
                existing_hods = db.query(Teacher).filter(
                    Teacher.college_id == college_id,
                    Teacher.branch == branch,
                    Teacher.is_hod == 1
                ).all()
                for old_hod in existing_hods:
                    old_hod.is_hod = 0
                    old_hod.role = "teacher"

                dept = db.query(Department).filter(
                    Department.college_id == college_id, 
                    Department.name == branch
                ).first()
                if dept:
                    dept.hod_name = full_name
                    dept.hod_email = email

            db.commit()
            return jsonify({
                "message": "Staff member added successfully",
                "staff": {
                    "id": new_teacher.id,
                    "fullName": new_teacher.full_name,
                    "email": new_teacher.email,
                    "branch": new_teacher.branch,
                    "role": new_teacher.role,
                    "isHod": bool(new_teacher.is_hod),
                    "phone": new_teacher.phone
                }
            }), 201

        # GET staff — exclude pending (they appear in pending-teachers endpoint)
        branch = request.args.get("branch")
        query = db.query(Teacher).filter(
            Teacher.college_id == college_id,
            Teacher.status != "pending"
        )
        if branch and branch.strip().lower() not in ["all", ""]:
            query = query.filter(Teacher.branch.ilike(f"%{branch.strip()}%"))

        teachers = query.all()

        return jsonify([{
            "id": t.id,
            "fullName": t.full_name,
            "email": t.email,
            "branch": t.branch or "General",
            "role": t.role or "teacher",
            "isHod": bool(t.is_hod),
            "phone": t.phone or "N/A",
            "status": getattr(t, "status", "approved")
        } for t in teachers]), 200
    finally:
        db.close()

# --- FACULTY APPROVAL & HOD ROUTES ---

@app.route("/api/college/<int:college_id>/pending-teachers", methods=["GET"])
def get_pending_teachers(college_id):
    db = SessionAuth()
    try:
        branch = request.args.get("branch")
        query = db.query(Teacher).filter(
            Teacher.college_id == college_id,
            Teacher.status == "pending"
        )
        if branch and branch.strip().lower() not in ["all", ""]:
            # Match branch
            query = query.filter(Teacher.branch.ilike(f"%{branch.strip()}%"))
        
        pending = query.all()
        return jsonify([{
            "id": t.id,
            "fullName": t.full_name,
            "email": t.email,
            "branch": t.branch or "General",
            "phone": t.phone or "N/A",
            "status": t.status
        } for t in pending]), 200
    finally:
        db.close()

@app.route("/api/teachers/<int:teacher_id>/approve", methods=["POST"])
def approve_teacher(teacher_id):
    db = SessionAuth()
    try:
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
        if not teacher:
            return jsonify({"error": "Faculty member not found"}), 404
        
        teacher.status = "approved"
        db.commit()
        return jsonify({"message": f"Faculty member '{teacher.full_name}' approved successfully."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route("/api/teachers/<int:teacher_id>/reject", methods=["POST"])
def reject_teacher(teacher_id):
    db = SessionAuth()
    try:
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
        if not teacher:
            return jsonify({"error": "Faculty member not found"}), 404
        
        teacher.status = "rejected"
        db.commit()
        return jsonify({"message": f"Faculty request for '{teacher.full_name}' has been rejected."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route("/api/college/<int:college_id>/staff/<int:staff_id>/assign-hod", methods=["PUT", "POST"])
def assign_hod(college_id, staff_id):
    db = SessionAuth()
    try:
        teacher = db.query(Teacher).filter(
            Teacher.id == staff_id,
            Teacher.college_id == college_id
        ).first()
        if not teacher:
            return jsonify({"error": "Staff member not found"}), 404

        # Ensure only ONE HOD per department
        if teacher.branch:
            other_hods = db.query(Teacher).filter(
                Teacher.college_id == college_id,
                Teacher.branch == teacher.branch,
                Teacher.id != teacher.id,
                Teacher.is_hod == 1
            ).all()
            for prev in other_hods:
                prev.is_hod = 0
                prev.role = "teacher"

            dept = db.query(Department).filter(
                Department.college_id == college_id,
                Department.name == teacher.branch
            ).first()
            if dept:
                dept.hod_name = teacher.full_name
                dept.hod_email = teacher.email

        teacher.is_hod = 1
        teacher.role = "hod"
        teacher.status = "approved"

        db.commit()
        return jsonify({"message": f"Promoted {teacher.full_name} to HOD of {teacher.branch}. (Only one HOD is active per department)"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    data = request.json or {}
    identifier = str(data.get("identifier") or data.get("email") or data.get("enrollment") or "").strip()
    new_password = str(data.get("newPassword") or "").strip()

    if not identifier or not new_password:
        return jsonify({"error": "Email/Enrollment and new password are required."}), 400

    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters."}), 400

    db = SessionAuth()
    try:
        if "@" in identifier:
            # Teacher / Admin / HOD
            user = db.query(Teacher).filter(Teacher.email.ilike(identifier)).first()
            if not user:
                return jsonify({"error": f"No account found with email '{identifier}'."}), 404
            user.password = generate_password_hash(new_password)
            db.commit()
            return jsonify({"message": "Password reset successfully. You can now sign in with your new password."}), 200
        else:
            # Student
            student = db.query(Student).filter(Student.enrollment == identifier).first()
            if not student:
                return jsonify({"error": f"No student found with enrollment '{identifier}'."}), 404
            student.password = generate_password_hash(new_password)
            db.commit()
            return jsonify({"message": "Student password updated successfully."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route("/api/college/<int:college_id>/staff/<int:staff_id>", methods=["DELETE"])
def remove_staff(college_id, staff_id):
    db = SessionAuth()
    try:
        staff = db.query(Teacher).filter(
            Teacher.id == staff_id, 
            Teacher.college_id == college_id
        ).first()
        if not staff:
            return jsonify({"error": "Staff member not found in this college"}), 404

        # If they were HOD, clear HOD on department
        if staff.is_hod and staff.branch:
            dept = db.query(Department).filter(
                Department.college_id == college_id,
                Department.name == staff.branch
            ).first()
            if dept and dept.hod_email == staff.email:
                dept.hod_name = None
                dept.hod_email = None

        db.delete(staff)
        db.commit()
        return jsonify({"message": f"Staff member '{staff.full_name}' removed successfully."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route("/api/college/<int:college_id>/staff/<int:staff_id>/role", methods=["PUT"])
def update_staff_role(college_id, staff_id):
    data = request.json or {}
    is_hod = bool(data.get("isHod", False))
    role = "hod" if is_hod else str(data.get("role", "teacher"))

    db = SessionAuth()
    try:
        staff = db.query(Teacher).filter(
            Teacher.id == staff_id, 
            Teacher.college_id == college_id
        ).first()
        if not staff:
            return jsonify({"error": "Staff member not found"}), 404

        staff.is_hod = 1 if is_hod else 0
        staff.role = role

        # Update department HOD link and ensure only ONE HOD per department
        if staff.branch:
            if is_hod:
                # Demote any other HOD in this same branch/department
                prev_hods = db.query(Teacher).filter(
                    Teacher.college_id == college_id,
                    Teacher.branch == staff.branch,
                    Teacher.id != staff.id,
                    Teacher.is_hod == 1
                ).all()
                for prev in prev_hods:
                    prev.is_hod = 0
                    prev.role = "teacher"

                dept = db.query(Department).filter(
                    Department.college_id == college_id,
                    Department.name == staff.branch
                ).first()
                if dept:
                    dept.hod_name = staff.full_name
                    dept.hod_email = staff.email
            else:
                dept = db.query(Department).filter(
                    Department.college_id == college_id,
                    Department.name == staff.branch
                ).first()
                if dept and dept.hod_email == staff.email:
                    dept.hod_name = None
                    dept.hod_email = None

        db.commit()
        msg = f"Promoted '{staff.full_name}' to HOD of {staff.branch}. (Previous HOD replaced)" if is_hod else f"Removed HOD role for '{staff.full_name}'"
        return jsonify({"message": msg}), 200
    finally:
        db.close()

@app.route("/api/college/<int:college_id>/staff/<int:staff_id>/transfer-admin", methods=["POST"])
def transfer_college_admin(college_id, staff_id):
    data = request.json or {}
    demote_previous = bool(data.get("demotePrevious", True))

    db = SessionAuth()
    try:
        new_admin = db.query(Teacher).filter(
            Teacher.id == staff_id,
            Teacher.college_id == college_id
        ).first()

        if not new_admin:
            return jsonify({"error": "Staff member not found in this college."}), 404

        if getattr(new_admin, "status", "approved") != "approved":
            return jsonify({"error": "Only approved faculty members can be promoted to College Administrator."}), 400

        college = db.query(College).filter(College.id == college_id).first()
        if not college:
            return jsonify({"error": "College record not found."}), 404

        # Demote previous college admin(s) to teacher if requested
        if demote_previous:
            prev_admins = db.query(Teacher).filter(
                Teacher.college_id == college_id,
                Teacher.role == "college_admin",
                Teacher.id != new_admin.id
            ).all()
            for prev in prev_admins:
                prev.role = "teacher"

        # Promote new admin
        new_admin.role = "college_admin"

        # Update primary admin details on the College profile
        college.admin_email = new_admin.email
        college.admin_name = new_admin.full_name
        if new_admin.phone:
            college.phone = new_admin.phone

        db.commit()
        return jsonify({
            "message": f"Successfully transferred College Administrator role to {new_admin.full_name} ({new_admin.email}).",
            "newAdmin": {
                "id": new_admin.id,
                "fullName": new_admin.full_name,
                "email": new_admin.email,
                "role": new_admin.role
            }
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route("/login", methods=["GET","POST"])
def login():
    data = request.json or {}
    db = SessionAuth()
    try:
        if 'email' in data: # Teacher / HOD / College Admin Login
            user = db.query(Teacher).filter(Teacher.email == data['email']).first()
            if user and check_password_hash(user.password, data['password']):
                teacher_status = getattr(user, "status", "approved")
                if teacher_status == "pending":
                    return jsonify({
                        "error": "Your account is awaiting approval by your Department HOD or College Admin. You will be able to log in once approved."
                    }), 403
                if teacher_status == "rejected":
                    return jsonify({
                        "error": "Your registration request was declined. Please contact your college administrator."
                    }), 403

                # Fetch college info
                c_id = user.college_id or 1
                college = db.query(College).filter(College.id == c_id).first()
                college_info = {
                    "id": college.id if college else 1,
                    "name": college.name if college else "Somaiya Polytechnic",
                    "shortName": (college.short_name or college.name) if college else "Somaiya Polytechnic",
                    "msbteCode": college.msbte_code if college else "0540"
                }

                user_role = user.role or "teacher"
                if user.is_hod and user_role == "teacher":
                    user_role = "hod"

                user_data = {
                    "id": user.id,
                    "name": user.full_name,
                    "email": user.email,
                    "role": user_role,
                    "branch": user.branch,
                    "college": college_info
                }

                return jsonify({
                    "role": user_role,
                    "name": user.full_name,
                    "college": college_info,
                    "user": user_data
                }), 200
        else: # Student Login
            enroll = data.get('enrollmentNumber')
            user = db.query(Student).filter(Student.enrollment == enroll).first()
            if user:
                c_id = user.college_id or 1
                college = db.query(College).filter(College.id == c_id).first()
                college_info = {
                    "id": college.id if college else 1,
                    "name": college.name if college else "Somaiya Polytechnic",
                    "shortName": (college.short_name or college.name) if college else "Somaiya Polytechnic",
                    "msbteCode": college.msbte_code if college else "0540"
                }
                return jsonify({
                    "role": "student", 
                    "name": user.full_name,
                    "college": college_info,
                    "user": {
                        "name": user.full_name,
                        "enrollment": user.enrollment,
                        "role": "student",
                        "branch": user.branch,
                        "college": college_info
                    }
                }), 200
        
        return jsonify({"error": "Invalid credentials"}), 401
    finally:
        db.close()


# --- RESULT ROUTES (Uses SessionResults) ---

@app.route("/get_results", methods=["GET"])
def get_results():
    db = SessionResults() # <--- Connects to results_cache.sqlite
    try:
        branch = request.args.get("branch")
        college_id = request.args.get("college_id")

        query = db.query(ResultCache)
        if college_id and str(college_id).strip().lower() not in ["all", "", "null", "undefined"]:
            try:
                cid = int(college_id)
                cid_count = db.query(ResultCache).filter(ResultCache.college_id == cid).count()
                if cid_count > 0:
                    query = query.filter(ResultCache.college_id == cid)
                else:
                    query = query.filter(or_(ResultCache.college_id == cid, ResultCache.college_id == 1, ResultCache.college_id == 4, ResultCache.college_id == None))
            except (ValueError, TypeError):
                pass

        rows = query.all()
        output = []
        for row in rows:
            if not branch_matches_filter(row.course, branch):
                continue
            details = json.loads(row.data) if row.data else {}
            sem = row.semester if (row.semester and row.semester > 0) else (details.get("semester") or 6)
            output.append({
                "enroll": row.enroll,
                "seat": row.seat,
                "studentName": row.student_name,
                "branch": row.course,
                "semester": sem,
                "percentage": row.percentage,
                "status": row.status,
                "obtained": row.obtained,
                "total_max": row.total_max,
                "fetched_at": row.fetched_at.strftime("%Y-%m-%d %H:%M:%S") if row.fetched_at else "N/A",
                "details": details
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

        # Fetch college info for student
        c_id = student.college_id or 1
        college = db.query(College).filter(College.id == c_id).first()
        college_info = {
            "id": college.id if college else 1,
            "name": college.name if college else "Somaiya Polytechnic",
            "shortName": (college.short_name or college.name) if college else "Somaiya Polytechnic",
            "msbteCode": college.msbte_code if college else "0540"
        }

        # Final Success Response
        return jsonify({
            "status": "success",
            "role": "student",
            "name": student.full_name or "Student",
            "college": college_info,
            "user": {
                "role": "student",
                "name": student.full_name or "Student",
                "enrollment": enrollment,
                "college": college_info
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

    enroll_str = str(enroll).strip()

    # 1. CHECK DATABASE FIRST (Skip scraper if already cached)
    cached_data = get_student_marks_db(enroll_str)
    if cached_data:
        print(f"[DATABASE HIT] Found {enroll_str} in database cache. Skipping Scraper.")
        return jsonify(json.loads(cached_data) if isinstance(cached_data, str) else cached_data)

    # 2. CHECK ResultCache in results_cache.sqlite
    db_results = SessionResults()
    try:
        rc = db_results.query(ResultCache).filter(ResultCache.enroll == enroll_str).first()
        if rc:
            if rc.data:
                try:
                    return jsonify(json.loads(rc.data))
                except Exception:
                    pass
            return jsonify({
                "student_name": rc.student_name,
                "enroll": rc.enroll,
                "seat_no": rc.seat or "-",
                "course": rc.course or "Engineering",
                "semester": rc.semester or 6,
                "percentage": rc.percentage or 0,
                "status": rc.status or "Pass",
                "total_marks_obtained": rc.obtained or 0,
                "total_max_marks": rc.total_max or 0,
                "subjects": []
            }), 200
    finally:
        db_results.close()

    # 3. IF NOT FOUND, TRY SCRAPER
    print(f"[DATABASE MISS] {enroll_str} not found locally. Starting Scraper...")
    try:
        student_data = parse_full_marksheet_student(enroll_str)
        if student_data and student_data.get("enroll"):
            return jsonify(student_data)
    except Exception as e:
        print(f"[SCRAPER ERROR] {str(e)}")

    # 4. Check if student is registered in auth.sqlite
    db_auth = SessionAuth()
    try:
        st = db_auth.query(Student).filter(Student.enrollment == enroll_str).first()
        if st:
            return jsonify({
                "student_name": st.full_name or "Student",
                "enroll": st.enrollment,
                "seat_no": "-",
                "course": st.branch or "Engineering",
                "semester": 6,
                "percentage": "0.0",
                "status": "Registered (Awaiting Result Sync)",
                "total_marks_obtained": "0",
                "total_max_marks": "0",
                "subjects": []
            }), 200
    finally:
        db_auth.close()

    return jsonify({"error": f"No marksheet data found for enrollment {enroll_str}"}), 404

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