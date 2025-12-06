# Personalized Study Buddy Recommender (PSBR)

A multi-role platform for personalized learning resource recommendations using AI.

## 🚀 How to Run (One-Click Setup)

We have included an automated script to handle installation and setup.

### Prerequisites
Before running, ensure your friend has installed:
1.  **Python 3.10+** (Make sure to check "Add Python to PATH" during installation).
2.  **Node.js (LTS Version)** (Required for the frontend).
3.  **Git** (To clone the repository).

### Steps
1.  **Clone the Repository**:
    ```bash
    git clone <your-repo-url>
    cd Personalized-Study-Buddy-Proposal
    ```

2.  **Run the Launch Script**:
    *   **Windows**: Open Command Prompt/PowerShell and run:
        ```bash
        python launch.py
        ```
    *   **Mac/Linux**:
        ```bash
        python3 launch.py
        ```

### What the script does:
*   ✓ Creates a Python virtual environment.
*   ✓ Installs backend dependencies (Flask, etc.).
*   ✓ Installs frontend dependencies (React/Vite).
*   ✓ Initializes the local database (`db.sqlite3`).
*   ✓ Starts both Backend and Frontend servers automatically.

---

## Manual Setup (If Script Fails)

If `launch.py` doesn't work, try these manual steps:

**1. Backend Setup**
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate
pip install -r backend/requirements.txt
python backend/init_db.py
python backend/app.py
```

**2. Frontend Setup (New Terminal)**
```bash
cd frontend
npm install
npm run dev
```

## Features
- **Roles**: Student, Admin, Management.
- **Recommendations**: SVD-based Machine Learning model.
- **Architecture**: Flask Backend + React (Vite) Frontend + SQLite.

See [GUIDE.md](GUIDE.md) for detailed credentials and walkthrough.