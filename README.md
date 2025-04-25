# 🛠️ Project Setup Instructions

Follow the steps below to set up and run the **frontend** and **backend** of the Symbol Comparison Tool.

---

## 🔙 Backend Setup (Flask + YOLOv8)

### Prerequisites:
- Python 3.8+
- pip (Python package manager)
- (Optional) Virtual environment

---

###  Option 1: Using Virtual Environment (Recommended)

```bash
# 1. Navigate to the backend folder
cd backend

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run the backend server
python app.py
```

###  Option 2: Without Virtual Environment
```bash
Copy
Edit
# 1. Navigate to the backend folder
cd backend

# 2. Install required packages globally
pip install -r requirements.txt

# 3. Run the Flask server
python app.py
```
The backend will start at: http://localhost:5000

🖥️ Frontend Setup (React)
Prerequisites:
Node.js and npm installed

```bash

# 1. Navigate to the frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start the frontend development server
npm run dev
```
The frontend will start at: http://localhost:5173
