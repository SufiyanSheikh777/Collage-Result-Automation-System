import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# --- CONFIGURATION ---
MSBTE_URL = "https://result.msbte.ac.in"
OUTPUT_DIR = "captured_captchas"
CAPTURE_COUNT = 100
TIMEOUT_SECONDS = 15 # Increased timeout for stability

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def create_driver(headless=True):
    """Initializes and returns a Selenium WebDriver with stability options."""
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
        
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1400,1000")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_argument("--disable-site-isolation-trials") 
    opts.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=opts)
    return driver

def open_correct_result_page(driver):
    """Navigates to the MSBTE result page and clicks the dynamic link."""
    driver.get(MSBTE_URL)
    wait = WebDriverWait(driver, TIMEOUT_SECONDS)
    
    links = driver.find_elements(By.TAG_NAME, "a")
    candidates = ["Click here to see", "Diploma Results", "Click here"]
    
    for link in links:
        txt = (link.text or "").strip()
        if any(k.lower() in txt.lower() for k in candidates):
            try:
                link.click()
                # Wait for the enrollment input field to ensure the final page is loaded
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[id*='EnrollOrSeatNo']")))
                return True
            except:
                pass
    return False

def capture_captchas(headless=True):
    """The main function to capture, save, and refresh CAPTCHA images."""
    driver = None
    try:
        driver = create_driver(headless=headless)
        
        # 1. Initial Navigation
        if not open_correct_result_page(driver):
            print("ERROR: Could not navigate to the final result form page.")
            return

        wait = WebDriverWait(driver, TIMEOUT_SECONDS)
        print(f"Starting CAPTCHA capture. Saving to: {OUTPUT_DIR}")
        
        # 2. Capture Loop
        for i in range(1, CAPTURE_COUNT + 1):
            try:
                # --- A. Find CAPTCHA Image Element ---
                # Changed to a more specific selector commonly used by MSBTE forms
                captcha_locator = (By.CSS_SELECTOR, "img[id$='imgCaptcha']") # $ means "ends with"
                
                # Wait for the element to be visible and ready for screenshot
                captcha_el = wait.until(EC.visibility_of_element_located(captcha_locator)) 
                
                # --- B. Save CAPTCHA ---
                filename = os.path.join(OUTPUT_DIR, f"captcha_{i:02d}.png")
                captcha_el.screenshot(filename)
                
                print(f"Captured {i}/{CAPTURE_COUNT} -> {filename}")
                
                # --- C. Refresh the Page for a New CAPTCHA ---
                driver.refresh()
                time.sleep(1.5)
                
            except Exception as e:
                print(f"An error occurred during capture {i}: {type(e).__name__}. Retrying.")
                # Force refresh to clear state and try again
                driver.refresh()
                time.sleep(2)
                continue
                
    except Exception as e:
        print(f"Critical error during driver setup: {e}")
        
    finally:
        if driver:
            driver.quit()
        print("Capture session complete.")

if __name__ == "__main__":
    # Temporarily set to False for debugging the element ID!
    capture_captchas(headless=False)