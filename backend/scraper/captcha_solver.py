import os
import io
import time
import pytesseract
import numpy as np
import cv2
from PIL import Image
from selenium.webdriver.common.by import By

# --- CONFIG ---
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def solve_with_tesseract(el):
    try:
        # 1. Capture the captcha
        png = el.screenshot_as_png
        img = Image.open(io.BytesIO(png)).convert('L') # Grayscale

        # 2. Convert to OpenCV format for better cleaning
        img_np = np.array(img)

        # 3. Thresholding (Pure Black & White)
        _, img_np = cv2.threshold(img_np, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # 4. Remove Noise (Denoising)
        kernel = np.ones((2, 2), np.uint8)
        img_np = cv2.morphologyEx(img_np, cv2.MORPH_OPEN, kernel)

        # 5. OCR Prediction
        custom_config = r'--psm 7 -c tessedit_char_whitelist=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        text = pytesseract.image_to_string(img_np, config=custom_config).strip()
        
        clean_text = "".join([c for c in text if c.isalnum()])
        return clean_text
    except Exception as e:
        print(f"OCR Error: {e}")
        return ""

def solve_captcha_with_retries(driver, enrollment, max_attempts=1):
    """
    Tries Tesseract only. If logic fails, it will return an empty string
    so your 'fetch_single_with_retries' loop can refresh it.
    """
    captcha_id = "imgCaptcha" 
    
    try:
        time.sleep(0.5)
        el = driver.find_element(By.ID, captcha_id)
        
        auto_text = solve_with_tesseract(el)
        
        # Check if text looks valid (MSBTE usually 5-6 chars)
        if len(auto_text) >= 5:
            print(f"🤖 Auto-Solved: {auto_text}")
            return (auto_text, 1)
        
        # If text is too short or empty, return empty to trigger a refresh in the main loop
        print(f"🔄 AI could not read captcha for {enrollment}. Requesting refresh...")
        return ("", 1)

    except Exception as e:
        print(f"❌ Element Error: {e}")
        return ("", 1)