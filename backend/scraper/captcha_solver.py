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

def clean_and_repair_captcha(img_np):
    """
    Cleans MSBTE captcha by:
    1. Thresholding dark character pixels
    2. Smartly detecting and erasing the horizontal strikethrough line (y=21..25)
       while preserving real vertical character strokes
    3. Outputting high-contrast binary image for OCR
    """
    try:
        # 1. Grayscale
        if len(img_np.shape) == 3:
            gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
        else:
            gray = img_np.copy()

        h, w = gray.shape

        # 2. Thresholding: Dark text & line (< 140) become white (255)
        _, binary = cv2.threshold(gray, 140, 255, cv2.THRESH_BINARY_INV)

        # 3. Smart Strikethrough Line Removal
        # Find the line row with maximum pixel density around middle (y=20..26)
        row_sums = np.sum(binary > 0, axis=1)
        mid_range = range(max(15, h // 2 - 6), min(h - 15, h // 2 + 6))
        line_y = max(mid_range, key=lambda y: row_sums[y]) if len(mid_range) > 0 else 23

        clean = binary.copy()
        for y in range(max(0, line_y - 2), min(h, line_y + 3)):
            for x in range(w):
                # Check if above and below have character pixels (vertical stroke)
                has_top = (y >= 2 and binary[y-2, x] > 0) or (y >= 3 and binary[y-3, x] > 0) or \
                          (y >= 2 and x > 0 and binary[y-2, x-1] > 0) or (y >= 2 and x < w-1 and binary[y-2, x+1] > 0)
                has_bot = (y < h - 2 and binary[y+2, x] > 0) or (y < h - 3 and binary[y+3, x] > 0) or \
                          (y < h - 2 and x > 0 and binary[y+2, x-1] > 0) or (y < h - 2 and x < w-1 and binary[y+2, x+1] > 0)

                if not (has_top and has_bot):
                    clean[y, x] = 0
                else:
                    clean[y, x] = 255

        # 4. Scale up 3x with NEAREST so strokes remain crisp without fuzzy gray borders
        scaled = cv2.resize(clean, (w * 3, h * 3), interpolation=cv2.INTER_NEAREST)
        inverted = cv2.bitwise_not(scaled)
        padded = cv2.copyMakeBorder(inverted, 15, 15, 15, 15, cv2.BORDER_CONSTANT, value=255)
        return padded
    except Exception as e:
        print(f"Preprocessing Error: {e}")
        return None

def solve_with_tesseract(el):
    try:
        # 1. Capture captcha screenshot
        png = el.screenshot_as_png
        img = Image.open(io.BytesIO(png)).convert('RGB')
        img_np = np.array(img)

        # 2. Smart Preprocessing (Line removal + Stroke preservation)
        cleaned_img = clean_and_repair_captcha(img_np)
        
        whitelist_config = r'-c tessedit_char_whitelist=abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        
        if cleaned_img is not None:
            # Pass 1: PSM 8 (Single word)
            text = pytesseract.image_to_string(cleaned_img, config=f'--oem 3 --psm 8 {whitelist_config}').strip()
            clean_text = "".join([c for c in text if c.isalnum()])
            if len(clean_text) >= 5:
                return clean_text

            # Pass 2: PSM 13 (Raw line)
            text = pytesseract.image_to_string(cleaned_img, config=f'--oem 3 --psm 13 {whitelist_config}').strip()
            clean_text = "".join([c for c in text if c.isalnum()])
            if len(clean_text) >= 5:
                return clean_text

            # Pass 3: PSM 7 (Single text line)
            text = pytesseract.image_to_string(cleaned_img, config=f'--oem 3 --psm 7 {whitelist_config}').strip()
            clean_text = "".join([c for c in text if c.isalnum()])
            if len(clean_text) >= 5:
                return clean_text

        # Fallback
        gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
        scaled = cv2.resize(gray, (int(gray.shape[1] * 2), int(gray.shape[0] * 2)), interpolation=cv2.INTER_CUBIC)
        _, otsu = cv2.threshold(scaled, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        text = pytesseract.image_to_string(otsu, config=f'--oem 3 --psm 8 {whitelist_config}').strip()
        return "".join([c for c in text if c.isalnum()])

    except Exception as e:
        print(f"OCR Error: {e}")
        return ""

def solve_captcha_with_retries(driver, enrollment, max_attempts=1):
    """
    High-precision Tesseract solver with strikethrough removal.
    """
    captcha_id = "imgCaptcha" 
    try:
        el = driver.find_element(By.ID, captcha_id)
        auto_text = solve_with_tesseract(el)
        
        if len(auto_text) >= 5:
            print(f"🤖 Auto-Solved ({enrollment}): {auto_text}")
            return (auto_text, 1)
        
        print(f"🔄 Captcha unclear for {enrollment} ('{auto_text}'). Requesting refresh...")
        return ("", 1)

    except Exception as e:
        print(f"❌ Captcha Element Error: {e}")
        return ("", 1)