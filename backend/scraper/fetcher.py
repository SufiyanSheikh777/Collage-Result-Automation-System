# backend/scraper/fetcher.py
import os
import base64
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
from scraper.captcha_solver import solve_captcha_with_retries, solve_with_tesseract
from selenium.common.exceptions import (
    UnexpectedAlertPresentException, 
    TimeoutException, 
    NoAlertPresentException,
    WebDriverException
)
from DB.database import SessionResults, SessionStudentPersonal, ResultCache

def capture_page_pdf(driver, save_path):
    """Captures strictly the marksheet page (Page 2) directly from the MSBTE website."""
    try:
        pdf_params = {
            "printBackground": True,
            "pageRanges": "2",  # Extracts ONLY the 2nd page (the actual Statement of Marks)
            "paperWidth": 8.27,
            "paperHeight": 11.69,
            "marginTop": 0.2,
            "marginBottom": 0.2,
            "marginLeft": 0.2,
            "marginRight": 0.2
        }
        res = driver.execute_cdp_cmd("Page.printToPDF", pdf_params)
        pdf_bytes = base64.b64decode(res['data'])
        with open(save_path, "wb") as f:
            f.write(pdf_bytes)
        print(f"📄 Authentic MSBTE Marksheet (Page 2 Only) saved to {save_path}")
        return True
    except Exception as e:
        print(f"⚠️ Page 2 extraction warning: {e}")
        try:
            res = driver.execute_cdp_cmd("Page.printToPDF", {"printBackground": True, "pageRanges": "1-2"})
            pdf_bytes = base64.b64decode(res['data'])
            with open(save_path, "wb") as f:
                f.write(pdf_bytes)
            return True
        except:
            return False
MSBTE_BASE_URL = "https://result.msbte.ac.in"
sem_map = {
    "FINAL SEMESTER": 6, "FINAL YEAR": 6, "FINAL SEM": 6, "FINAL": 6,
    "SIXTH": 6, "SIX": 6, "VI": 6,
    "FIFTH": 5, "FIVE": 5, "V": 5,
    "FOURTH": 4, "FOUR": 4, "IV": 4,
    "THIRD": 3, "THREE": 3, "III": 3,
    "SECOND": 2, "TWO": 2, "II": 2,
    "FIRST": 1, "ONE": 1, "I": 1
}

def extract_highest_semester_from_soup(soup):
    found_semesters = []
    page_text = soup.get_text(" ", strip=True).upper()
    
    # 1. If marksheet specifies FINAL / FINAL SEMESTER / FINAL YEAR, it is semester 6
    if any(k in page_text for k in ["FINAL SEMESTER", "FINAL YEAR", "FINAL SEM"]):
        found_semesters.append(6)
    elif "FINAL" in page_text:
        for tag in soup.find_all(["td", "th", "span", "div", "b", "strong"]):
            txt = tag.get_text().upper().strip()
            if "FINAL" in txt and any(w in txt for w in ["SEM", "EXAM", "YEAR", "DIPLOMA", "RESULT"]):
                found_semesters.append(6)
                break

    # 2. Check all table cells and headers
    all_tds = soup.find_all(["td", "th"])
    for i, td in enumerate(all_tds):
        txt = td.get_text().upper().strip()
        if "SIXTH" in txt or "SEM-6" in txt or "SEM 6" in txt or "SEMESTER 6" in txt or "SEMESTER VI" in txt or "6TH SEM" in txt or "VI SEM" in txt:
            found_semesters.append(6)
        elif "FIFTH" in txt or "SEM-5" in txt or "SEM 5" in txt or "SEMESTER 5" in txt or "SEMESTER V" in txt or "5TH SEM" in txt or "V SEM" in txt:
            found_semesters.append(5)
        elif "FOURTH" in txt or "SEM-4" in txt or "SEM 4" in txt or "SEMESTER 4" in txt or "SEMESTER IV" in txt or "4TH SEM" in txt or "IV SEM" in txt:
            found_semesters.append(4)
        elif "THIRD" in txt or "SEM-3" in txt or "SEM 3" in txt or "SEMESTER 3" in txt or "SEMESTER III" in txt or "3RD SEM" in txt or "III SEM" in txt:
            found_semesters.append(3)
        elif "SECOND" in txt or "SEM-2" in txt or "SEM 2" in txt or "SEMESTER 2" in txt or "SEMESTER II" in txt or "2ND SEM" in txt or "II SEM" in txt:
            found_semesters.append(2)
        elif "FIRST" in txt or "SEM-1" in txt or "SEM 1" in txt or "SEMESTER 1" in txt or "SEMESTER I" in txt or "1ST SEM" in txt or "I SEM" in txt:
            found_semesters.append(1)

    if found_semesters:
        return max(found_semesters)
    return 6

def create_driver(headless=True):
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1400,1000")
    opts.add_argument("--disable-infobars")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)
    opts.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=opts)
    
    # Inject stealth CDP script to mask navigator.webdriver and chrome runtime flags
    try:
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": """
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                window.chrome = {
                    runtime: {}
                };
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                });
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en']
                });
            """
        })
    except Exception as e:
        print(f"Stealth script injection warning: {e}")

    return driver

def parse_marksheet_html(html):
    soup = BeautifulSoup(html, "html.parser")
    out = {}
    all_tds = soup.find_all("td")

    # 1. FIXED NAME EXTRACTION
    name_label = soup.find(lambda tag: tag.name == "td" and "MR. / MS." in tag.get_text())
    if name_label:
        name_cell = name_label.find_next_sibling("td")
        if name_cell:
            name_text = name_cell.find("strong")
            out["student_name"] = name_text.get_text(strip=True) if name_text else "Unknown"
    else:
        name_tag = soup.select_one("td.col strong")
        out["student_name"] = name_tag.get_text(strip=True) if name_tag else "Unknown"

    # 2. Extract Header Info (Enrollment, Seat, Course)
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

    # Extract Semester - prioritizing highest / Final Semester
    out["semester"] = extract_highest_semester_from_soup(soup)

    # 3. MARKS EXTRACTION (Extract data for the GREATER semester - bottom-up search)
    percentage_val = ""
    full_text = soup.get_text(" ", strip=True).upper()
    summary_tables = soup.find_all(lambda tag: tag.name == "table" and "PERCENTAGE" in tag.text.upper())
    
    # We look at tables from bottom to top (reversed) to extract the greater semester summary
    for target_table in reversed(summary_tables):
        rows = target_table.find_all("tr")
        found_data_in_this_table = False
        
        for row in rows:
            cells = row.find_all("td")
            if len(cells) >= 3:
                val0 = cells[0].get_text(strip=True)
                val1 = cells[1].get_text(strip=True)
                val2 = cells[2].get_text(strip=True).replace('%', '').strip()
                
                # Support condonation/grace notations like '635+2=637'
                import re
                d0 = re.findall(r'\d+', val0)
                d1 = re.findall(r'\d+', val1)
                if d0 and d1 and int(d0[0]) >= 100:
                    out["total_max_marks"] = d0[0]
                    out["total_marks_obtained"] = val1
                    pct_match = re.search(r'\d+(\.\d+)?', val2)
                    if pct_match:
                        out["percentage"] = pct_match.group(0)
                        percentage_val = pct_match.group(0)
                    else:
                        out["percentage"] = ""
                        percentage_val = ""
                    found_data_in_this_table = True
                    break 
        
        if found_data_in_this_table:
            break

    # 4. FINAL STATUS LOGIC (MSBTE Rule: Fail students do not have percentage shown)
    has_pass_class = any(k in full_text for k in ["FIRST CLASS", "DISTINCTION", "SECOND CLASS", "PASS CLASS", "CONGRATULATIONS"])
    try:
        if percentage_val and float(percentage_val) > 0:
            out["status"] = "Pass"
        elif has_pass_class and out.get("total_marks_obtained") and out.get("total_max_marks"):
            out["status"] = "Pass"
            # Calculate percentage if student passed with diploma class
            import re
            m_tot = int(re.findall(r'\d+', out["total_max_marks"])[0])
            s1 = out["total_marks_obtained"]
            if "=" in s1:
                m_obt = int(re.findall(r'\d+', s1.split("=")[-1])[0])
            elif "+" in s1:
                m_obt = sum(int(x) for x in re.findall(r'\d+', s1))
            else:
                m_obt = int(re.findall(r'\d+', s1)[0])
            if m_tot > 0:
                out["percentage"] = str(round((m_obt / m_tot) * 100, 2))
        else:
            out["status"] = "Fail"
    except (ValueError, TypeError):
        out["status"] = "Fail"

    return out

def open_correct_result_page(driver, wait=None):
    """Open main page and click the dynamic result link (Summer/Winter etc.)."""
    driver.get(MSBTE_BASE_URL)
    time.sleep(0.5)
    if not wait:
        wait = WebDriverWait(driver, 5)
    links = driver.find_elements(By.TAG_NAME, "a")
    candidates = ["Click here to see", "Diploma Results", "Click here"]
    for link in links:
        txt = (link.text or "").strip()
        if any(k.lower() in txt.lower() for k in candidates):
            try:
                link.click()
                time.sleep(0.8)
                return True
            except:
                pass
    return False

def fetch_single_with_retries(driver, enroll, parser_func=None):
    if parser_func is None:
        parser_func = parse_full_marksheet_student

    wait = WebDriverWait(driver, 8)
    attempt = 0
    SEARCH_PAGE_URL = "https://result.msbte.ac.in/pcwebBTRes/pcResult01/pcfrmViewMSBTEResult.aspx"
    
    while True: 
        attempt += 1
        try:
            print(f"🔄 Student {enroll}: Attempt {attempt}")
            
            # --- 1. ENSURE SEARCH PAGE IS READY ---
            if "ddlEnrollOrSeatNo" not in driver.page_source:
                driver.get(SEARCH_PAGE_URL)
                time.sleep(0.5)

            # --- 2. SELECT ENROLLMENT MODE ---
            dropdown = wait.until(EC.presence_of_element_located((By.ID, "ddlEnrollOrSeatNo")))
            driver.execute_script("if (arguments[0].value !== '2') { arguments[0].value = '2'; arguments[0].dispatchEvent(new Event('change')); }", dropdown)

            # --- 3. INPUT DATA ---
            enroll_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[id*=txtEnroll]")))
            enroll_input.clear()
            enroll_input.send_keys(enroll)

            # Solve Captcha rapidly
            ocr_text, _ = solve_captcha_with_retries(driver, enroll, max_attempts=1)
            captcha_field = driver.find_element(By.ID, "txtCaptchaHot")
            captcha_field.clear()
            captcha_field.send_keys(ocr_text)

            # --- 4. SUBMIT ---
            driver.find_element(By.ID, "btnShowResult").click()

            # --- 5. FAST ALERT CHECK (Handle invalid captcha in milliseconds) ---
            try:
                alert = WebDriverWait(driver, 0.4).until(EC.alert_is_present())
                alert.accept()
                driver.execute_script("try { document.getElementById('imgCaptcha').click(); } catch(e){}")
                time.sleep(0.2)
                continue
            except (TimeoutException, NoAlertPresentException):
                pass

            # --- 6. STRICT VERIFICATION ---
            try:
                wait_for_marksheet = WebDriverWait(driver, 4).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "td.col strong"))
                )
                
                student_name = driver.find_element(By.CSS_SELECTOR, "td.col strong").text.strip()
                if not student_name:
                    raise Exception("Marksheet layout found, but name is empty.")

                print(f"✅ SUCCESS for {enroll} on attempt {attempt}!")
                
                # Save exact PDF copy directly from MSBTE
                try:
                    storage_pdf_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "pdf")
                    os.makedirs(storage_pdf_dir, exist_ok=True)
                    pdf_file_path = os.path.join(storage_pdf_dir, f"{enroll}.pdf")
                    capture_page_pdf(driver, pdf_file_path)
                except Exception as e:
                    print(f"⚠️ Failed to save PDF for {enroll}: {e}")

                parsed_data = parser_func(driver.page_source)
                parsed_data["enroll"] = enroll
                parsed_data["pdf_url"] = f"/download_pdf/{enroll}"
                
                save_student_to_db(parsed_data)
                return parsed_data 

            except (TimeoutException, Exception):
                print(f"❌ Marksheet not detected for {enroll}. Retrying...")
                try:
                    alert = driver.switch_to.alert
                    alert.accept()
                except (NoAlertPresentException, Exception):
                    pass
                
                driver.execute_script("try { document.getElementById('imgCaptcha').click(); } catch(e){}")
                time.sleep(0.3)
                continue 

        except UnexpectedAlertPresentException:
            try:
                driver.switch_to.alert.accept()
            except:
                pass
            continue
            
        except Exception as e:
            print(f"❗ Scraper Error: {e}")
            driver.get(SEARCH_PAGE_URL)
            time.sleep(0.5)
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
            parsed = fetch_single_with_retries(driver, enroll, parser_func=parse_full_marksheet_student) 
            
            # 3. SAVE TO DATABASE IMMEDIATELY
            if parsed and "error" not in parsed:
                save_student_to_db(parsed)
                db.commit()
            db.close()

            results.append(parsed)
            time.sleep(0.2)

    finally:
        if driver:
            driver.quit()

    return results
def get_captcha_image_url(session, page_html):
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
        raw_branch = parsed_data.get('course', 'Unknown')
        clean_branch = raw_branch.replace("Diploma In ", "").replace("DIPLOMA IN ", "").strip()
        
        sem_val = parsed_data.get('semester')
        if not sem_val or int(sem_val) == 0:
            sem_val = 6
        else:
            sem_val = int(sem_val)

        obtained_val = parsed_data.get('total_marks_obtained')
        total_max_val = parsed_data.get('total_max_marks')
        
        from app import safe_int, safe_float
        obt_num = safe_int(obtained_val)
        tot_num = safe_int(total_max_val)
        pct_num = safe_float(parsed_data.get('percentage'))

        db.merge(ResultCache(
            enroll=parsed_data['enroll'],
            seat=parsed_data.get('seat_no'),
            student_name=parsed_data.get('student_name'),
            course=clean_branch,
            semester=sem_val,
            percentage=pct_num,
            status=parsed_data.get('status'),
            obtained=obt_num,
            total_max=tot_num,
            data=json.dumps(parsed_data),
            fetched_at=datetime.utcnow()
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
            return json.loads(existing.data) if existing.data else None
        
        db.close()

        # --- 2. DYNAMICALLY FIND THE PORTAL ---
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
            sem_val = parsed_data.get('semester')
            if not sem_val or int(sem_val) == 0:
                sem_val = 6
            else:
                sem_val = int(sem_val)

            obtained_val = parsed_data.get('total_marks_obtained')
            total_max_val = parsed_data.get('total_max_marks')

            from app import safe_int, safe_float
            obt_num = safe_int(obtained_val)
            tot_num = safe_int(total_max_val)
            pct_num = safe_float(parsed_data.get('percentage'))

            record_data = {
                "seat": parsed_data.get('seat_no') or parsed_data.get('seat'),
                "student_name": parsed_data.get('student_name'),
                "course": parsed_data.get('course'),
                "semester": sem_val,
                "percentage": pct_num,
                "status": parsed_data.get('status'),
                "obtained": obt_num,
                "total_max": tot_num,
                "data": json.dumps(parsed_data),
                "fetched_at": datetime.utcnow()
            }

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

def parse_full_marksheet_student(html):
    soup = BeautifulSoup(html, "html.parser")
    out = {"subjects": []} 
    all_tds = soup.find_all("td")
    
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

    # Extract highest / Final Semester
    out["semester"] = extract_highest_semester_from_soup(soup)

    # --- 2. DETAILED SUBJECT SCRAPING (Target greater/highest semester table) ---
    marks_tables = soup.find_all(lambda tag: tag.name == "table" and "TITLE OF SUBJECT" in tag.text.upper())
    
    # If multiple semester subject tables exist, select the greater (latest) semester table
    if marks_tables:
        target_marks_table = marks_tables[-1]
        rows = target_marks_table.find_all("tr")
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

    # --- 3. SUMMARY & STATUS (Greater semester summary table in reversed search) ---
    percentage_val = ""
    full_text = soup.get_text(" ", strip=True).upper()
    summary_tables = soup.find_all(lambda tag: tag.name == "table" and "PERCENTAGE" in tag.text.upper())
    for target_table in reversed(summary_tables):
        rows = target_table.find_all("tr")
        found_summary = False
        for row in rows:
            cells = row.find_all("td")
            if len(cells) >= 3:
                v0 = cells[0].text.strip()
                v1 = cells[1].text.strip()
                v2 = cells[2].text.strip().replace('%', '')
                import re
                d0 = re.findall(r'\d+', v0)
                d1 = re.findall(r'\d+', v1)
                if d0 and d1 and int(d0[0]) >= 100:
                    out["total_max_marks"] = d0[0]
                    out["total_marks_obtained"] = v1
                    pct_match = re.search(r'\d+(\.\d+)?', v2)
                    if pct_match:
                        out["percentage"] = pct_match.group(0)
                        percentage_val = pct_match.group(0)
                    else:
                        out["percentage"] = ""
                        percentage_val = ""
                    found_summary = True
                    break
        if found_summary:
            break

    # 4. FINAL STATUS LOGIC (MSBTE Rule: Fail students do not have percentage shown)
    has_pass_class = any(k in full_text for k in ["FIRST CLASS", "DISTINCTION", "SECOND CLASS", "PASS CLASS", "CONGRATULATIONS"])
    try:
        if percentage_val and float(percentage_val) > 0:
            out["status"] = "Pass"
        elif has_pass_class and out.get("total_marks_obtained") and out.get("total_max_marks"):
            out["status"] = "Pass"
            from app import safe_int
            m_obt = safe_int(out["total_marks_obtained"])
            m_tot = safe_int(out["total_max_marks"])
            if m_tot > 0:
                out["percentage"] = str(round((m_obt / m_tot) * 100, 2))
        else:
            out["status"] = "Fail"
    except (ValueError, TypeError):
        out["status"] = "Fail"

    return out