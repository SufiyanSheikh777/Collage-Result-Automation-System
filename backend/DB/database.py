from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, Float
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import sqlite3
import os
import json

Base = declarative_base()

# Anchored to backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# --- DATABASE 1: RESULTS (Keep existing data safe) ---
RESULTS_PATH = os.path.join(BACKEND_DIR, "results_cache.sqlite")
RESULTS_URL = f"sqlite:///{RESULTS_PATH}"
engine_results = create_engine(RESULTS_URL, connect_args={"check_same_thread": False})
SessionResults = sessionmaker(autocommit=False, autoflush=False, bind=engine_results)

class ResultCache(Base):
    __tablename__ = "results_cache"
    
    enroll = Column(String, primary_key=True)
    seat = Column(String)
    student_name = Column(String)
    course = Column(String)
    semester = Column(Integer, default=0)
    percentage = Column(Float)
    status = Column(String)
    obtained = Column(Integer)
    total_max = Column(Integer)
    data = Column(Text)
    fetched_at = Column(DateTime, default=datetime.utcnow)
    college_id = Column(Integer, default=1, index=True)

# --- DATABASE 2: AUTH & MULTI-TENANCY ---
AUTH_PATH = os.path.join(BACKEND_DIR, "auth.sqlite")
AUTH_URL = f"sqlite:///{AUTH_PATH}"
engine_auth = create_engine(AUTH_URL, connect_args={"check_same_thread": False})
SessionAuth = sessionmaker(autocommit=False, autoflush=False, bind=engine_auth)

class College(Base):
    __tablename__ = "colleges"
    id = Column(Integer, primary_key=True, index=True)
    msbte_code = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    short_name = Column(String)
    region = Column(String)
    institute_type = Column(String)
    admin_email = Column(String)
    admin_name = Column(String)
    phone = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, index=True)
    name = Column(String, nullable=False)
    code = Column(String)
    hod_name = Column(String, nullable=True)
    hod_email = Column(String, nullable=True)

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, default=1, index=True)
    department_id = Column(Integer, nullable=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    branch = Column(String)
    is_hod = Column(Integer, default=0)  # 1 for HOD, 0 for faculty
    role = Column(String, default="teacher")  # 'college_admin', 'hod', 'teacher'
    phone = Column(String, nullable=True)
    status = Column(String, default="approved")  # 'pending', 'approved', 'rejected'

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, default=1, index=True)
    full_name = Column(String)
    enrollment = Column(String, unique=True, index=True)
    branch = Column(String)
    password = Column(String, nullable=True)

STUDENT_MARKS_PATH = os.path.join(BACKEND_DIR, "student_marks.sqlite")
STUDENT_MARKS_URL = f"sqlite:///{STUDENT_MARKS_PATH}"
engine_student_marks = create_engine(STUDENT_MARKS_URL, connect_args={"check_same_thread": False})
SessionStudentPersonal = sessionmaker(autocommit=False, autoflush=False, bind=engine_student_marks)

def get_student_marks_db(enroll):
    """Checks the local SQLite database files (results_cache.sqlite and student_marks.sqlite) for existing data."""
    enroll_str = str(enroll).strip()

    # 1. Check RESULTS_PATH (results_cache.sqlite) where all fetched student results are stored
    if os.path.exists(RESULTS_PATH):
        try:
            conn = sqlite3.connect(RESULTS_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT data FROM results_cache WHERE enroll = ?", (enroll_str,))
            row = cursor.fetchone()
            conn.close()
            if row and row[0]:
                return row[0]
        except Exception as e:
            print(f"[WARN] Error checking results_cache.sqlite: {e}")

    # 2. Check STUDENT_MARKS_PATH (student_marks.sqlite) as secondary fallback
    if os.path.exists(STUDENT_MARKS_PATH):
        try:
            conn = sqlite3.connect(STUDENT_MARKS_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT data FROM results_cache WHERE enroll = ?", (enroll_str,))
            row = cursor.fetchone()
            conn.close()
            if row and row[0]:
                return row[0]
        except Exception as e:
            print(f"[WARN] Error checking student_marks.sqlite: {e}")

    return None

def run_migrations():
    """Safely adds missing columns to existing SQLite tables."""
    if os.path.exists(AUTH_PATH):
        conn_auth = sqlite3.connect(AUTH_PATH)
        cur_auth = conn_auth.cursor()
        
        cur_auth.execute("PRAGMA table_info(teachers)")
        teacher_cols = [c[1] for c in cur_auth.fetchall()]
        new_teacher_cols = [
            ("college_id", "INTEGER DEFAULT 1"),
            ("department_id", "INTEGER"),
            ("is_hod", "INTEGER DEFAULT 0"),
            ("role", "TEXT DEFAULT 'teacher'"),
            ("phone", "TEXT"),
            ("status", "TEXT DEFAULT 'approved'")
        ]
        for col_name, col_type in new_teacher_cols:
            if col_name not in teacher_cols:
                try:
                    cur_auth.execute(f"ALTER TABLE teachers ADD COLUMN {col_name} {col_type}")
                    print(f"Added {col_name} to teachers")
                except Exception as e:
                    pass

        cur_auth.execute("PRAGMA table_info(students)")
        student_cols = [c[1] for c in cur_auth.fetchall()]
        if "college_id" not in student_cols:
            try:
                cur_auth.execute("ALTER TABLE students ADD COLUMN college_id INTEGER DEFAULT 1")
                print("Added college_id to students")
            except Exception as e:
                pass

        cur_auth.execute("PRAGMA table_info(departments)")
        dept_cols = [c[1] for c in cur_auth.fetchall()]
        if "code" not in dept_cols:
            try:
                cur_auth.execute("ALTER TABLE departments ADD COLUMN code TEXT")
            except Exception:
                pass

        # Backfill empty department codes if any
        cur_auth.execute("SELECT id, name, code FROM departments")
        rows = cur_auth.fetchall()
        for r_id, r_name, r_code in rows:
            if not r_code or r_code.strip() == "":
                lower_name = (r_name or "").lower()
                code_to_set = "GEN"
                if "computer" in lower_name:
                    code_to_set = "CW"
                elif "civil" in lower_name:
                    code_to_set = "CE"
                elif "mech" in lower_name:
                    code_to_set = "ME"
                elif "electr" in lower_name and "tele" in lower_name:
                    code_to_set = "EJ"
                elif "electr" in lower_name:
                    code_to_set = "EE"
                elif "info" in lower_name:
                    code_to_set = "IF"
                elif "chem" in lower_name:
                    code_to_set = "CH"
                elif "auto" in lower_name:
                    code_to_set = "AE"
                else:
                    words = (r_name or "").strip().split()
                    code_to_set = "".join(w[0].upper() for w in words[:2]) if words else "DP"
                cur_auth.execute("UPDATE departments SET code = ? WHERE id = ?", (code_to_set, r_id))

        conn_auth.commit()
        conn_auth.close()

    if os.path.exists(RESULTS_PATH):
        conn_res = sqlite3.connect(RESULTS_PATH)
        cur_res = conn_res.cursor()
        cur_res.execute("PRAGMA table_info(results_cache)")
        res_cols = [c[1] for c in cur_res.fetchall()]
        if "college_id" not in res_cols:
            try:
                cur_res.execute("ALTER TABLE results_cache ADD COLUMN college_id INTEGER DEFAULT 1")
                print("Added college_id to results_cache")
            except Exception as e:
                pass
        conn_res.commit()
        conn_res.close()

def seed_default_college():
    """Ensures Somaiya Polytechnic (Code 0540) exists as the default college."""
    db = SessionAuth()
    try:
        somaiya = db.query(College).filter(College.id == 1).first()
        if not somaiya:
            somaiya = College(
                id=1,
                msbte_code="0540",
                name="Somaiya Polytechnic",
                short_name="Somaiya Polytechnic",
                region="Mumbai",
                institute_type="Unaided / Private",
                admin_email="admin@somaiya.edu",
                admin_name="Principal / Exam Controller",
                phone="022-2102-1234"
            )
            db.add(somaiya)
            db.commit()

            default_depts = [
                ("Computer Engineering", "CO"),
                ("Information Technology", "IF"),
                ("Mechanical Engineering", "ME"),
                ("Civil Engineering", "CE"),
                ("Electrical Engineering", "EE"),
                ("Electronics & Tele-Communication", "EJ")
            ]
            for dept_name, dept_code in default_depts:
                db.add(Department(college_id=1, name=dept_name, code=dept_code))
            db.commit()
            
            # Make sure existing teacher Sufiyan is linked to Somaiya Computer Dept
            first_teacher = db.query(Teacher).filter(Teacher.id == 1).first()
            if first_teacher:
                first_teacher.college_id = 1
                first_teacher.role = "college_admin"
                first_teacher.is_hod = 1
                db.commit()
    except Exception as e:
        db.rollback()
        print(f"Notice during seeding: {e}")
    finally:
        db.close()

def init_db():
    # Create result tables in result DB
    ResultCache.__table__.create(bind=engine_results, checkfirst=True)
    # Create auth & multi-tenant tables in auth DB
    College.__table__.create(bind=engine_auth, checkfirst=True)
    Department.__table__.create(bind=engine_auth, checkfirst=True)
    Teacher.__table__.create(bind=engine_auth, checkfirst=True)
    Student.__table__.create(bind=engine_auth, checkfirst=True)
    Base.metadata.create_all(bind=engine_student_marks)

    # Run safe column migrations & seedings
    run_migrations()
    seed_default_college()