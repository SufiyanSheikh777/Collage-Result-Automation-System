import os
import csv

FOLDER = "labeled_dataset"
OUTPUT = "captchas/labels.csv"

files = [f for f in os.listdir(FOLDER) if f.lower().endswith(".png")]

with open(OUTPUT, "w", newline="", encoding="utf-8") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["image", "label"])

    for f in files:
        label = os.path.splitext(f)[0]  # filename without .png
        writer.writerow([f, label])

print(f"labels.csv created with {len(files)} entries!")