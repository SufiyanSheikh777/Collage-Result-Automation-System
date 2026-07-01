# backend/scraper/fetcher.py
import time
import json
import io
from datetime import datetime
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
# from scraper.captcha_solver import predict_captcha
from scraper.captcha_solver import solve_captcha_with_retries # <--- CORRECT NAME # your solver
from scraper.captcha_solver import solve_with_tesseract
from selenium.common.exceptions import (
    UnexpectedAlertPresentException, 
    TimeoutException, 
    NoAlertPresentException,
    WebDriverException
)
from DB.database import SessionResults, ResultCache
from DB.database import SessionStudentPersonal, ResultCache
MSBTE_BASE_URL = "https://result.msbte.ac.in"
sem_map = {
        "FIRST": 1, "SECOND": 2, "THIRD": 3, "FOURTH": 4, 
        "FIFTH": 5, "SIXTH": 6, "SEVENTH": 7, "EIGHTH": 8
    }

def create_driver(headless=True):
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1400,1000")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=opts)
    return driver

def parse_marksheet_html(html):
    soup = BeautifulSoup(html, "html.parser")
    out = {}
    all_tds = soup.find_all("td")
    found_semesters = []
   # 1. FIXED NAME EXTRACTION
    # We find the <td> containing "MR. / MS." and get the <strong> inside the next <td>
    name_label = soup.find(lambda tag: tag.name == "td" and "MR. / MS." in tag.get_text())
    if name_label:
        # The name is in the next sibling <td> which contains a <strong> tag
        name_cell = name_label.find_next_sibling("td")
        if name_cell:
            name_text = name_cell.find("strong")
            out["student_name"] = name_text.get_text(strip=True) if name_text else "Unknown"
    else:
        # Fallback to your existing selector if the label isn't found
        name_tag = soup.select_one("td.col strong")
        out["student_name"] = name_tag.get_text(strip=True) if name_tag else "Unknown"

    # 2. Extract Header Info (Enrollment, Seat, Course)
    # We find the label (e.g., "SEAT NO.") and get the text from the next <td>
    all_tds = soup.find_all("td")
    for i, td in enumerate(all_tds):
        txt = td.get_text().upper().strip()
        if "ENROLLMENT NO." in txt and i + 1 < len(all_tds):
            out["enroll"] = all_tds[i+1].get_text(strip=True)
        elif "SEAT NO." in txt and i + 1 < len(all_tds):
            out["seat_no"] = all_tds[i+1].get_text(strip=True)
        elif "COURSE" in txt and i + 1 < len(all_tds):
            # Only take it if we haven't found a valid course yet
            if "course" not in out or "MINIMUM" in out["course"].upper():
                val = all_tds[i+1].get_text(strip=True)
                out["course"] = val.replace("Diploma In ", "").replace("DIPLOMA IN ", "").strip()
                
        elif "SEMESTER" in txt:
            for idx in [i-1, i, i+1]:
                if 0 <= idx < len(all_tds):
                    content = all_tds[idx].get_text().upper().strip()
                    for word, num in sem_map.items():
                        if word in content:
                            found_semesters.append(num)

    out["semester"] = max(found_semesters) if found_semesters else 0

    # 3. MARKS EXTRACTION (The Correct Bottom-Up Search)
    percentage_val = ""
    # Find all summary tables containing "PERCENTAGE"
    summary_tables = soup.find_all(lambda tag: tag.name == "table" and "PERCENTAGE" in tag.text.upper())
    
    # We look at tables from bottom to top (reversed)
    for target_table in reversed(summary_tables):
        rows = target_table.find_all("tr")
        found_data_in_this_table = False
        
        for row in rows:
            cells = row.find_all("td")
            # Look for the row where the first cell is a number (Max Marks)
            if len(cells) >= 3:
                val0 = cells[0].get_text(strip=True)
                val1 = cells[1].get_text(strip=True)
                val2 = cells[2].get_text(strip=True).replace('%', '').strip()
                
                # Verify that these cells actually contain numbers
                if val0.isdigit() and val1.isdigit():
                    out["total_max_marks"] = val0
                    out["total_marks_obtained"] = val1
                    out["percentage"] = val2
                    percentage_val = val2
                    found_data_in_this_table = True
                    break 
        
        # If we found valid marks in this table, stop searching other tables
        if found_data_in_this_table:
            break

    # 4. FINAL STATUS LOGIC (Based on your new rule)
    # Rule: If percentage exists and is not empty/zero -> Pass. Otherwise -> Fail.
    try:
        # Check if percentage is a valid number greater than 0
        if percentage_val and float(percentage_val) > 0:
            out["status"] = "Pass"
        else:
            out["status"] = "Fail"
    except ValueError:
        # If percentage is not a number (like '-' or 'N/A')
        out["status"] = "Fail"

    return out

def open_correct_result_page(driver, wait=None):
    """Open main page and click the dynamic result link (Summer/Winter etc.)."""
    driver.get(MSBTE_BASE_URL)
    time.sleep(1.0)
    if not wait:
        wait = WebDriverWait(driver, 6)
    links = driver.find_elements(By.TAG_NAME, "a")
    candidates = ["Click here to see", "Diploma Results", "Click here"]
    for link in links:
        txt = (link.text or "").strip()
        if any(k.lower() in txt.lower() for k in candidates):
            try:
                link.click()
                time.sleep(1.5)
                return True
            except:
                pass
    return False

def fetch_single_with_retries(driver, enroll, parser_func=None):
    # If no specific parser is provided, default to the existing one
    if parser_func is None:
        parser_func = parse_marksheet_html

    wait = WebDriverWait(driver, 10)
    attempt = 0
    
    # URL used for clearing the state if things go wrong
    SEARCH_PAGE_URL = "https://result.msbte.ac.in/pcwebBTRes/pcResult01/pcfrmViewMSBTEResult.aspx"
    
    while True: 
        attempt += 1
        try:
            print(f"🔄 Student {enroll}: Attempt {attempt}")
            
            # --- 1. ENSURE SEARCH PAGE IS READY ---
            if "ddlEnrollOrSeatNo" not in driver.page_source:
                driver.get(SEARCH_PAGE_URL)
                time.sleep(1)

            # --- 2. SELECT ENROLLMENT MODE ---
            dropdown = wait.until(EC.presence_of_element_located((By.ID, "ddlEnrollOrSeatNo")))
            driver.execute_script("arguments[0].value = '2'; arguments[0].dispatchEvent(new Event('change'));", dropdown)

            # --- 3. INPUT DATA ---
            enroll_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[id*=txtEnroll]")))
            enroll_input.clear()
            enroll_input.send_keys(enroll)

            # Solve Captcha
            ocr_text, _ = solve_captcha_with_retries(driver, enroll, max_attempts=1)
            captcha_field = driver.find_element(By.ID, "txtCaptchaHot")
            captcha_field.clear()
            captcha_field.send_keys(ocr_text)

            # --- 4. SUBMIT ---
            driver.find_element(By.ID, "btnShowResult").click()

            # --- 5. STRICT VERIFICATION ---
            try:
                # CRITICAL: We wait specifically for the Student Name element. 
                wait_for_marksheet = WebDriverWait(driver, 6).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "td.col strong"))
                )
                
                # Check if name is actually there (not empty)
                student_name = driver.find_element(By.CSS_SELECTOR, "td.col strong").text.strip()
                if not student_name:
                    raise Exception("Marksheet layout found, but name is empty.")

                print(f"✅ SUCCESS for {enroll} on attempt {attempt}!")
                
                # --- USE THE DYNAMIC PARSER ---
                parsed_data = parser_func(driver.page_source)
                parsed_data["enroll"] = enroll
                
                # Save to database automatically
                save_student_to_db(parsed_data)
                
                return parsed_data 

            except (TimeoutException, Exception):
                print(f"❌ Marksheet not detected for {enroll}. Retrying same student...")
                try:
                    alert = driver.switch_to.alert
                    alert.accept()
                except NoAlertPresentException:
                    pass
                
                try:
                    driver.find_element(By.ID, "imgCaptcha").click()
                    time.sleep(1)
                except:
                    driver.get(SEARCH_PAGE_URL) 
                
                continue 

        except UnexpectedAlertPresentException:
            try:
                driver.switch_to.alert.accept()
            except:
                pass
            continue
            
        except Exception as e:
            print(f"❗ Unexpected Error: {e}")
            driver.get(SEARCH_PAGE_URL)
            time.sleep(1.5)
            continue

# --- Update fetch_all_results in fetcher.py ---
def fetch_all_results(filepath, headless=False):
    from DB.database import SessionResults, ResultCache
    
    results = []
    with open(filepath, "r", encoding="utf-8") as f:
        lines = [l.strip() for l in f if l.strip()]

    driver = None
    try:
        driver = create_driver(headless=headless)
        open_correct_result_page(driver)

        for line in lines:
            enroll = line.split(",")[0].strip()
            
            # 1. CHECK IF ALREADY IN DATABASE (Skip feature)
            db = SessionResults()
            existing = db.query(ResultCache).filter(ResultCache.enroll == enroll).first()
            if existing:
                print(f"⏩ Skipping {enroll} (already scraped)")
                results.append(json.loads(existing.data))
                db.close()
                continue

            # 2. FETCH NEW DATA
            parsed = fetch_single_with_retries(driver, enroll) 
            
            # 3. SAVE TO DATABASE IMMEDIATELY
            if parsed and "error" not in parsed:
                if parsed and "error" not in parsed:
                    save_student_to_db(parsed)
                db.commit()
            db.close()

            results.append(parsed)
            time.sleep(1)

    finally:
        if driver:
            driver.quit()

    return results

def get_captcha_image_url(session, page_html):
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(page_html, "html.parser")
    img = soup.find("img", {"id": "imgCaptcha"})
    
    if not img:
        return None

    relative = img["src"]
    full_url = "https://result.msbte.ac.in/pcwebBTRres/pcZT/" + relative
    return full_url

def download_captcha(session, captcha_url, save_path):
    r = session.get(captcha_url)
    with open(save_path, "wb") as f:
        f.write(r.content)
    return save_path

def save_student_to_db(parsed_data):
    db = SessionResults()
    try:
        # Extra safety: strip it again before saving to the database column
        raw_branch = parsed_data.get('course', 'Unknown')
        clean_branch = raw_branch.replace("Diploma In ", "").replace("DIPLOMA IN ", "").strip()
        
        db.merge(ResultCache(
            enroll=parsed_data['enroll'],
            seat=parsed_data.get('seat_no'),
            student_name=parsed_data.get('student_name'),
            course=clean_branch, # Only saves "Computer Science and Engineering"
            semester=int(parsed_data.get('semester', 0)),
            percentage=float(parsed_data.get('percentage', 0)) if parsed_data.get('percentage') else 0,
            status=parsed_data.get('status'),
            data=json.dumps(parsed_data)
        ))
        db.commit()
    finally:
        db.close()

def fetch_student_login_data(driver, enroll):
    """
    Wrapper for student login: Checks for existing data first to SKIP scraping,
    otherwise finds portal, scrapes, and saves to student_marks.sqlite.
    """
    from DB.database import SessionStudentPersonal, ResultCache 
    import json

    try:
        # --- 1. CHECK IF ALREADY IN DATABASE (THE SKIP LOGIC) ---
        db = SessionStudentPersonal()
        existing = db.query(ResultCache).filter(ResultCache.enroll == str(enroll)).first()
        
        if existing:
            print(f"⏩ Skipping Scrape for {enroll} (already exists in student_marks.sqlite)")
            db.close()
            # Return the existing data as a dictionary
            return json.loads(existing.data) if existing.data else None
        
        db.close() # Close initial check connection

        # --- 2. DYNAMICALLY FIND THE PORTAL (Only runs if NOT in DB) ---
        print(f"🔗 Student {enroll}: Finding active result link...")
        portal_found = open_correct_result_page(driver)
        
        if not portal_found:
            print("⚠️ Could not find dynamic result link; attempting fallback...")

        # --- 3. FETCH NEW DATA ---
        parsed_data = fetch_single_with_retries(driver, enroll, parser_func=parse_full_marksheet_student)
        
        if not parsed_data or "error" in parsed_data:
            return parsed_data

        # --- 4. SAVE TO DATABASE IMMEDIATELY ---
        db = SessionStudentPersonal()
        try:
            # Prepare high-detail record for SQLAlchemy
            record_data = {
                "seat": parsed_data.get('seat_no') or parsed_data.get('seat'),
                "student_name": parsed_data.get('student_name'),
                "course": parsed_data.get('course'),
                "semester": int(parsed_data.get('semester', 0)),
                "percentage": float(parsed_data.get('percentage', 0)) if parsed_data.get('percentage') else 0.0,
                "status": parsed_data.get('status'),
                "obtained": int(parsed_data.get('total_marks_obtained', 0)),
                "total_max": int(parsed_data.get('total_max_marks', 0)),
                "data": json.dumps(parsed_data), # Full details
                "fetched_at": datetime.utcnow()
            }

            # Check again before saving (to handle upsert)
            existing_record = db.query(ResultCache).filter(ResultCache.enroll == str(enroll)).first()
            if existing_record:
                for key, value in record_data.items():
                    setattr(existing_record, key, value)
            else:
                new_record = ResultCache(enroll=str(enroll), **record_data)
                db.add(new_record)
            
            db.commit()
            print(f"✅ High-Detail Marksheet saved for {enroll}")
            return parsed_data
            
        except Exception as e:
            print(f"❌ Database Save Error: {e}")
            db.rollback()
            return parsed_data 
        finally:
            db.close()

    except Exception as e:
        print(f"❗ Scraper Wrapper Error: {e}")
        return None

    except Exception as e:
        print(f"❗ Scraper Wrapper Error: {e}")
        return None

def parse_full_marksheet_student(html):
    # Everything below this line MUST be indented by 4 spaces
    soup = BeautifulSoup(html, "html.parser")
    out = {"subjects": []} 
    all_tds = soup.find_all("td")
    found_semesters = []
    
    # --- 1. STUDENT INFO EXTRACTION ---
    name_label = soup.find(lambda tag: tag.name == "td" and "MR. / MS." in tag.get_text())
    if name_label:
        name_cell = name_label.find_next_sibling("td")
        if name_cell:
            name_text = name_cell.find("strong")
            out["student_name"] = name_text.get_text(strip=True) if name_text else "Unknown"
    else:
        name_tag = soup.select_one("td.col strong")
        out["student_name"] = name_tag.get_text(strip=True) if name_tag else "Unknown"

    # Header Info (Enrollment, Seat, Course)
    for i, td in enumerate(all_tds):
        txt = td.get_text().upper().strip()
        if "ENROLLMENT NO." in txt and i + 1 < len(all_tds):
            out["enroll"] = all_tds[i+1].get_text(strip=True)
        elif "SEAT NO." in txt and i + 1 < len(all_tds):
            out["seat_no"] = all_tds[i+1].get_text(strip=True)
        elif "COURSE" in txt and i + 1 < len(all_tds):
            if "course" not in out or "MINIMUM" in out["course"].upper():
                val = all_tds[i+1].get_text(strip=True)
                out["course"] = val.replace("Diploma In ", "").replace("DIPLOMA IN ", "").strip()
        elif "SEMESTER" in txt:
            for idx in [i-1, i, i+1]:
                if 0 <= idx < len(all_tds):
                    content = all_tds[idx].get_text().upper().strip()
                    for word, num in sem_map.items():
                        if word in content:
                            found_semesters.append(num)

    out["semester"] = max(found_semesters) if found_semesters else 0

    # --- 2. DETAILED SUBJECT SCAPPING ---
    marks_table = soup.find(lambda tag: tag.name == "table" and "TITLE OF SUBJECT" in tag.text.upper())
    
    if marks_table:
        rows = marks_table.find_all("tr")
        for row in rows:
            cells = row.find_all("td")
            if len(cells) >= 13:
                subj_name = cells[0].get_text(strip=True)
                if not subj_name or "TITLE" in subj_name.upper() or "PAPER" in subj_name.upper():
                    continue
                
                try:
                    subject_info = {
                        "subjectName": subj_name,
                        "theory": {
                            "faTh": {"max": cells[1].text.strip(), "obt": cells[2].text.strip()},
                            "saTh": {"max": cells[3].text.strip(), "obt": cells[4].text.strip()},
                            "total": {"max": cells[5].text.strip(), "obt": cells[6].text.strip()}
                        },
                        "practicals": {
                            "faPr": {"max": cells[7].text.strip(), "obt": cells[8].text.strip()},
                            "saPr": {"max": cells[9].text.strip(), "obt": cells[10].text.strip()}
                        },
                        "sla": {
                            "max": cells[11].text.strip(), 
                            "obt": cells[12].text.strip()
                        },
                        "credits": cells[-1].text.strip() if cells[-1].text.strip().isdigit() else "0"
                    }
                    out["subjects"].append(subject_info)
                except Exception:
                    continue

    # --- 3. SUMMARY & STATUS ---
    percentage_val = ""
    summary_tables = soup.find_all(lambda tag: tag.name == "table" and "PERCENTAGE" in tag.text.upper())
    for target_table in reversed(summary_tables):
        rows = target_table.find_all("tr")
        found_summary = False
        for row in rows:
            cells = row.find_all("td")
            if len(cells) >= 3:
                v0, v1, v2 = cells[0].text.strip(), cells[1].text.strip(), cells[2].text.strip().replace('%', '')
                if v0.isdigit() and v1.isdigit():
                    out["total_max_marks"], out["total_marks_obtained"], out["percentage"] = v0, v1, v2
                    percentage_val = v2
                    found_summary = True
                    break
        if found_summary: break

    try:
        out["status"] = "Pass" if percentage_val and float(percentage_val) > 0 else "Fail"
    except ValueError:
        out["status"] = "Fail"

    return out