# 🎓 Personalized Study Buddy Recommender (PSBR)

<<<<<<< HEAD
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
=======
> **An AI-powered learning companion that adapts to every student.**

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square\&logo=python)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square\&logo=react)
![License](https://img.shields.io/badge/License-MIT-orange?style=flat-square)

---

## 🌟 Overview

**Personalized Study Buddy Recommender (PSBR)** is an intelligent educational platform that helps students learn smarter—not harder. Using **Hybrid AI Recommendation Techniques (SVD + Content-Based Filtering)**, PSBR analyzes learner behavior, preferences, and academic goals to deliver highly relevant study materials.

This project was developed by our team as a scalable, real-world solution for modern digital learning environments, integrating **AI, secure authentication, and subscription-based services**.

---

## 🎯 Problem Statement

Students today are overwhelmed by an abundance of online learning resources. Finding *the right content at the right time* is difficult, leading to:

* ❌ Inefficient study habits
* ❌ Low engagement with learning platforms
* ❌ Poor personalization

**PSBR solves this problem** by acting as a smart study companion that continuously learns from user interactions and recommends content tailored to individual needs.

---

## 💡 Solution

PSBR delivers a **personalized learning experience** through:

* Intelligent recommendations based on past behavior and ratings
* Secure, password-less authentication using OTP
* Role-based dashboards for students, admins, and management
* Mobile-first, responsive design
* Subscription-based premium access

---

## 🚀 Key Features

### 🤖 AI-Powered Recommendation Engine

* Hybrid model combining **Singular Value Decomposition (SVD)** and **Content-Based Filtering**
* Cosine similarity for accurate resource matching
* Continuous improvement through user feedback and ratings

### 🔐 Secure Authentication

* OTP-based login using **mSpace SMS API**
* No passwords required
* Safe and user-friendly access

### 👥 Role-Based System

**Student Dashboard**

* Personalized study recommendations
* Progress tracking
* Resource rating and feedback

**Admin Dashboard**

* Upload and manage learning resources
* User management
* Monitor system activity

**Management Portal**

* Platform analytics
* Subscription and revenue monitoring

### 💳 Subscription & Billing

* Integrated **mSpace Charging API**
* Seamless premium plan activation

### 📱 Responsive UI

* Mobile-first design
* Optimized for phones, tablets, and desktops

---

## 🛠️ Tech Stack

| Layer                 | Technologies                                  |
| --------------------- | --------------------------------------------- |
| **Frontend**          | React, Vite, TypeScript, CSS3                 |
| **Backend**           | Flask, SQLAlchemy, JWT                        |
| **AI / ML**           | Pandas, Scikit-learn (SVD, Cosine Similarity) |
| **Database**          | SQLite                                        |
| **External Services** | mSpace (OTP, SMS, Charging API)               |

---

## 🏗️ System Architecture

```
Frontend (React + Vite)
        ↓
Backend API (Flask + JWT)
        ↓
AI Recommendation Engine
        ↓
SQLite Database
        ↓
mSpace APIs (OTP, SMS, Billing)
```

---

## ⚙️ Installation & Setup

### Prerequisites

* Python **3.10+**
* Node.js **LTS**
* Git

---

### 🚀 One-Click Setup (Recommended)

```bash
git clone https://github.com/skr2rathishan-oss/Personalized-Study-Buddy-Proposal.git
cd Personalized-Study-Buddy-Proposal
python launch.py
```

**What the launch script does:**

* Creates a virtual environment
* Installs backend & frontend dependencies
* Initializes the database
* Starts both servers

---

### 🔧 Manual Setup

#### Backend

```bash
python -m venv venv
source venv/bin/activate  # Mac/Linux
# OR
.\venv\Scripts\activate  # Windows

>>>>>>> fbbaa2e74d94eac126862ac59b3b2b833e8c8b0a
pip install -r backend/requirements.txt

# Initialize Database
python backend/init_db.py

# Run Server
python backend/app.py
```

<<<<<<< HEAD
### 2. Frontend Setup
Open a new terminal window:
=======
#### Frontend

>>>>>>> fbbaa2e74d94eac126862ac59b3b2b833e8c8b0a
```bash
cd frontend
npm install
npm run dev
```

---

## 📸 Screenshots

<<<<<<< HEAD
*(Add your application screenshots here)*

| User Dashboard | Recommendation Feed |
| :---: | :---: |
| ![Dashboard Placeholder](https://via.placeholder.com/400x200?text=User+Dashboard) | ![Feed Placeholder](https://via.placeholder.com/400x200?text=Recommendation+Feed) |
=======
> *(Replace placeholders with real screenshots)*

| Student Dashboard                        | Recommendation Feed                      |
| ---------------------------------------- | ---------------------------------------- |
| ![](https://via.placeholder.com/400x200) | ![](https://via.placeholder.com/400x200) |

---

## 🔮 Future Enhancements

* 🧠 AI Mentor Chatbot (Jarvis-style assistant)
* 🎙️ Voice-based navigation
* ⏰ Smart deadline reminders
* 📊 Advanced learning analytics
* ☁️ Cloud database & deployment

---

## 👨‍💻 Team & Contributions

This project was collaboratively developed by **our team** as an academic and practical AI-driven solution.

Contributions, suggestions, and feedback are welcome!
>>>>>>> fbbaa2e74d94eac126862ac59b3b2b833e8c8b0a

---

## 📜 License

<<<<<<< HEAD
Distributed under the MIT License. See `LICENSE` for more information.
=======
This project is licensed under the **MIT License**.
>>>>>>> fbbaa2e74d94eac126862ac59b3b2b833e8c8b0a

---

## 📞 Contact

<<<<<<< HEAD
**Project Team** - [Your Team Name/Email]

Project Link: [https://github.com/skr2rathishan-oss/Personalized-Study-Buddy-Proposal](https://github.com/skr2rathishan-oss/Personalized-Study-Buddy-Proposal)
=======
📧 **Project Team**: *[CODEMAKERS]*
🔗 **GitHub Repository**: [https://github.com/skr2rathishan-oss/Personalized-Study-Buddy-Proposal](https://github.com/skr2rathishan-oss/Personalized-Study-Buddy-Proposal)

---

> ⭐ If you find this project useful, please consider starring the repository!
>>>>>>> fbbaa2e74d94eac126862ac59b3b2b833e8c8b0a
