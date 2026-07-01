from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, Float
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import sqlite3
import json

Base = declarative_base()

# --- DATABASE 1: RESULTS (Keep existing data safe) ---
# This connects to your existing results_cache.sqlite
RESULTS_URL = "sqlite:///./results_cache.sqlite"
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

# --- DATABASE 2: AUTH (For Login/Register) ---
# This creates a NEW file called auth.sqlite for users
AUTH_URL = "sqlite:///./auth.sqlite"
engine_auth = create_engine(AUTH_URL, connect_args={"check_same_thread": False})
SessionAuth = sessionmaker(autocommit=False, autoflush=False, bind=engine_auth)

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    branch = Column(String)

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    enrollment = Column(String, unique=True, index=True)
    branch = Column(String)
    # We keep password optional in DB since you don't want students to use it
    password = Column(String, nullable=True)

STUDENT_MARKS_URL = "sqlite:///./student_marks.sqlite"
engine_student_marks = create_engine(STUDENT_MARKS_URL, connect_args={"check_same_thread": False})
SessionStudentPersonal = sessionmaker(autocommit=False, autoflush=False, bind=engine_student_marks)

def get_student_marks_db(enroll):
    """Checks the local student_marks.sqlite file for existing data."""
    # Ensure enrollment is a stripped string for matching
    enroll_str = str(enroll).strip()
    
    # Connect to the specific student marks database
    conn = sqlite3.connect('student_marks.sqlite')
    cursor = conn.cursor()
    try:
        # The table name in student_marks.sqlite is 'results_cache' 
        # because it uses the ResultCache model class.
        cursor.execute("SELECT data FROM results_cache WHERE enroll = ?", (enroll_str,))
        row = cursor.fetchone()
        return row[0] if row else None
    except sqlite3.OperationalError as e:
        print(f"⚠️ Table not found or DB empty: {e}")
        return None
    finally:
        conn.close()

def init_db():
    # Create result tables in result DB
    ResultCache.__table__.create(bind=engine_results, checkfirst=True)
    # Create auth tables in auth DB
    Teacher.__table__.create(bind=engine_auth, checkfirst=True)
    Student.__table__.create(bind=engine_auth, checkfirst=True)
    Base.metadata.create_all(bind=engine_student_marks)