# 🎓 Personalized Study Buddy Recommender (PSBR)

> **Unlock your potential with AI-driven learning paths.**

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![License](https://img.shields.io/badge/License-MIT-orange?style=flat-square)

---

## 📖 About The Project

The **Personalized Study Buddy** is a next-generation educational platform designed to adapt to every student's unique learning style. By leveraging **Hybrid AI (SVD + Content-Based Filtering)**, the system analyzes student interactions, ratings, and academic goals to curate a bespoke feed of educational resources (videos, articles, and quizzes).

Whether you are a university student aiming for a First Class or a lifelong learner mastering a new skill, PSBR guides you through the noise of the internet to the content that matters most to *you*.

### 🌟 Key Features

*   **🤖 AI-Powered Recommendation Engine**: Utilizes Singular Value Decomposition (SVD) and cosine similarity to predict and suggest resources you'll love.
*   **🔒 Secure & Easy Auth**: One-time-password (OTP) login via **mSpace**, ensuring secure and password-less access.
*   **👥 Role-Based Ecosystem**:
    *   **Student Dashboard**: View recommendations, track progress, and rate content.
    *   **Admin Dashboard**: Manage users, upload resources, and oversee system health.
    *   **Management Portal**: High-level analytics and subscription oversight.
*   **📱 Mobile-First Design**: Fully responsive interface optimized for learning on the go.
*   **💳 Integrated Subscription**: Seamless premium access management via mSpace's charging API.

---

## 🛠️ Tech Stack

This project is built using a robust, modern stack ensuring performance and scalability.

| Component | Technologies |
| :--- | :--- |
| **Frontend** | ![React](https://img.shields.io/badge/-React-black?logo=react) ![Vite](https://img.shields.io/badge/-Vite-646CFF?logo=vite) ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript) ![CSS3](https://img.shields.io/badge/-CSS3-1572B6?logo=css3) |
| **Backend** | ![Flask](https://img.shields.io/badge/-Flask-000000?logo=flask) ![SQLAlchemy](https://img.shields.io/badge/-SQLAlchemy-D71324?logo=sqlalchemy) ![JWT](https://img.shields.io/badge/-JWT-000000?logo=jsonwebtokens) |
| **Data & ML** | ![Pandas](https://img.shields.io/badge/-Pandas-150458?logo=pandas) ![Scikit-Learn](https://img.shields.io/badge/-Scikit_Learn-F7931E?logo=scikit-learn) ![SQLite](https://img.shields.io/badge/-SQLite-003B57?logo=sqlite) |
| **Services** | ![mSpace](https://img.shields.io/badge/-mSpace_API-E10098) (SMS, OTP, Charging) |

---

## 🚀 Getting Started

We have streamlined the setup process into a single script for your convenience.

### Prerequisites

*   **Python 3.10+** (Ensure "Add to PATH" is checked during installation)
*   **Node.js (LTS)** (Required for the frontend)
*   **Git**

### One-Click Installation (Recommended)

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/skr2rathishan-oss/Personalized-Study-Buddy-Proposal.git
    cd Personalized-Study-Buddy-Proposal
    ```

2.  **Run the Launch Script**:

    *   **Windows**:
        ```bash
        python launch.py
        ```
    *   **Mac/Linux**:
        ```bash
        python3 launch.py
        ```

    > **What `launch.py` offers:**
    > *   ✅ Creates a Python virtual environment (`venv`).
    > *   ✅ Installs all Backend & Frontend dependencies.
    > *   ✅ Initializes the Database (`db.sqlite3`).
    > *   ✅ Launches both servers in a single terminal.

---

## 🔧 Manual Setup

If you prefer full control or if the script encounters issues, follow these steps:

### 1. Backend Setup
```bash
# Navigate to project root
python -m venv venv

# Activate Virtual Environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Dependencies
pip install -r backend/requirements.txt

# Initialize Database
python backend/init_db.py

# Run Server
python backend/app.py
```

### 2. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

---

## 📸 Screenshots

*(Add your application screenshots here)*

| User Dashboard | Recommendation Feed |
| :---: | :---: |
| ![Dashboard Placeholder](https://via.placeholder.com/400x200?text=User+Dashboard) | ![Feed Placeholder](https://via.placeholder.com/400x200?text=Recommendation+Feed) |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📞 Contact

**Project Team** - [Your Team Name/Email]

Project Link: [https://github.com/skr2rathishan-oss/Personalized-Study-Buddy-Proposal](https://github.com/skr2rathishan-oss/Personalized-Study-Buddy-Proposal)