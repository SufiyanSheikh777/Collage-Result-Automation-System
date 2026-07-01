import os
import numpy as np
import pandas as pd
import cv2
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, BatchNormalization
from tensorflow.keras.utils import to_categorical

# --- CONFIG ---
CAPTCHA_FOLDER = "labeled_dataset"
LABEL_FILE = "captchas/labels.csv"
IMG_WIDTH, IMG_HEIGHT = 160, 60
CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
MAX_LEN = 10 
NUM_CLASSES = len(CHARSET)  # 62
TOTAL_CLASSES = NUM_CLASSES + 1 # 63 (Last index is for "Blank")

def build_model():
    model = Sequential([
        Conv2D(32, (3, 3), padding='same', activation="relu", input_shape=(IMG_HEIGHT, IMG_WIDTH, 1)),
        BatchNormalization(),
        MaxPooling2D(2, 2),

        Conv2D(64, (3, 3), padding='same', activation="relu"),
        BatchNormalization(),
        MaxPooling2D(2, 2),

        Conv2D(128, (3, 3), padding='same', activation="relu"),
        BatchNormalization(),
        MaxPooling2D(2, 2),

        Flatten(),
        Dense(512, activation="relu"),
        Dropout(0.5),
        Dense(TOTAL_CLASSES * MAX_LEN, activation="softmax") 
    ])
    # Using a specific learning rate to prevent "Blank" bias
    optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)
    model.compile(optimizer=optimizer, loss="categorical_crossentropy", metrics=["accuracy"])
    return model

def load_data():
    df = pd.read_csv(LABEL_FILE)
    df.columns = ["image", "label"]
    X, y = [], []

    print("📊 Processing images...")
    for _, row in df.iterrows():
        img_path = os.path.join(CAPTCHA_FOLDER, row["image"])
        img = cv2.imread(img_path)
        if img is None: continue

        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        img = cv2.resize(img, (IMG_WIDTH, IMG_HEIGHT))
        X.append(img.reshape(IMG_HEIGHT, IMG_WIDTH, 1) / 255.0)

        # Map characters to 0-61, and use 62 for empty slots
        encoded = [CHARSET.index(c) for c in str(row["label"]) if c in CHARSET]
        encoded = (encoded + [NUM_CLASSES] * MAX_LEN)[:MAX_LEN]
        y.append(encoded)

    return np.array(X), np.array(y)

if __name__ == "__main__":
    X_train, y_train_labels = load_data()
    y_train = to_categorical(y_train_labels, num_classes=TOTAL_CLASSES).reshape(len(X_train), -1)

    print(f"🧠 Training on {len(X_train)} samples...")
    model = build_model()
    # 25 Epochs to ensure it learns characters properly
    model.fit(X_train, y_train, epochs=25, batch_size=32, validation_split=0.1) 

    model.save("captchas/captcha_model.h5")
    print("✅ Model Trained and Saved!")