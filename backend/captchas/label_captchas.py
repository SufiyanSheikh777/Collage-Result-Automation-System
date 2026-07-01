import os
import cv2
from tkinter import Tk, Label, Entry, Button
from PIL import Image, ImageTk
import shutil

CAPTCHA_FOLDER = "captured_captchas"           # your folder with PNG captchas
OUTPUT_FOLDER = "labeled_dataset"     # labeled output

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

files = [f for f in os.listdir(CAPTCHA_FOLDER) if f.lower().endswith(".png")]
index = 0

current_img_path = ""  # declare here globally


def load_image(idx):
    img_path = os.path.join(CAPTCHA_FOLDER, files[idx])
    img = Image.open(img_path)
    img = img.resize((200, 80))  # enlarge for readability
    return ImageTk.PhotoImage(img), img_path


def save_label():
    global index, current_img_path  # FIX: declare BEFORE using

    label_text = entry.get().strip()
    if len(label_text) == 0:
        return

    old_path = current_img_path
    new_filename = label_text + ".png"
    new_path = os.path.join(OUTPUT_FOLDER, new_filename)

    shutil.move(old_path, new_path)

    entry.delete(0, "end")

    index += 1
    if index >= len(files):
        lbl.config(text="✔ Done! All captchas labeled.")
        entry.destroy()
        btn.destroy()
        return

    # Load next captcha
    img, new_img_path = load_image(index)
    panel.config(image=img)
    panel.image = img
    current_img_path = new_img_path


def start_labeling():
    global current_img_path
    img, first_path = load_image(0)
    panel.config(image=img)
    panel.image = img
    current_img_path = first_path


# GUI
root = Tk()
root.title("Captcha Labeling Tool")

panel = Label(root)
panel.pack()

lbl = Label(root, text="Enter captcha text and press Save:")
lbl.pack()

entry = Entry(root, font=("Arial", 18))
entry.pack()

btn = Button(root, text="Save", command=save_label, font=("Arial", 16))
btn.pack()

start_labeling()

root.mainloop()