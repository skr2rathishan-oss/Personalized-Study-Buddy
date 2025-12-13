# 🎓 Personalized Study Buddy Recommender (PSBR)

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

pip install -r backend/requirements.txt
python backend/init_db.py
python backend/app.py
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📸 Screenshots

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

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 📞 Contact

📧 **Project Team**: *[CODEMAKERS]*
🔗 **GitHub Repository**: [https://github.com/skr2rathishan-oss/Personalized-Study-Buddy-Proposal](https://github.com/skr2rathishan-oss/Personalized-Study-Buddy-Proposal)

---

> ⭐ If you find this project useful, please consider starring the repository!
