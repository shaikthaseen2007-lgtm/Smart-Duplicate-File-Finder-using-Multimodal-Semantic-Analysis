# Smart File Duplicate Finder using Multimodal Semantic Analysis

## Overview
This project is a smart file duplicate detection system that analyzes both textual content and images to identify similarities between files. It improves upon traditional methods by combining natural language processing and image processing to detect exact duplicates, partial similarities, and unique files.

---

## Features

### Text Analysis
- Extracts text from `.txt` and `.docx` files  
- Uses TF-IDF and cosine similarity  
- Performs topic modeling using NMF  

### Image Analysis
- Uses perceptual hashing (pHash)  
- Handles:
  - Image rotation (90°, 180°, 270°)
  - Image resizing  
- Detects visually similar images  

### Combined Similarity
- Combines text and image similarity  
- Uses weighted scoring:
Final Score = 0.6 × Text + 0.4 × Image

- Prioritizes image similarity when images are identical  

---

## Output
For each file pair, the system provides:
- File names  
- Similarity percentage  
- Classification (Unique / Partially Similar / Duplicate)  
- Extracted topics  

---

## Classification Criteria
- Unique: less than 30%  
- Partially Similar: 30% to 75%  
- Duplicate: greater than 75% or identical image/file  

---

## Project Structure
backend/
app.py
utils.py
uploads/
requirements.txt

frontend-v2/
index.html
script.js
style.css


---

## Technologies Used
- Python  
- Flask  
- Scikit-learn  
- Pillow and ImageHash  
- HTML, CSS, JavaScript  

---

## Installation

1. Clone the repository:
git clone https://github.com//your-repo-name.git


2. Navigate to backend:
cd backend

3. Install dependencies:
pip install -r requirements.txt


4. Run the server:
python app.py / py app.py



---

## Usage
- Upload multiple files through the interface  
- View similarity results in the dashboard  
- Analyze duplicates and topics  

---

## Future Improvements
- Add PDF support  
- Improve image comparison using deep learning  
- Deploy as a web application  

---

## Conclusion
This project demonstrates how combining text analysis and image processing can improve duplicate detection accuracy and handle real-world variations in file content.
