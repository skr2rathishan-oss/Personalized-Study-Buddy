# PSBR System Guide

## Overview
This is a Multi-Role Personalized Study Buddy Recommender system.

## Roles and Permissions
- **Student**: 
  - Can view enrolled courses (currently all public).
  - Can view topics and get AI-based recommendations.
  - Can rate resources.
- **Admin**: 
  - Can view assigned courses.
  - Can view list of enrolled students.
- **Management**: 
  - Super admin role (database level support included).

## Architecture
- **Backend**: Flask (Python) with SQLite. Uses JWT for authentication and RBAC.
- **Frontend**: React (Vite) with Axios for API communication.
- **ML Engine**: SVD (Singular Value Decomposition) for personalized recommendations.

## Setup Instructions
1. **Prerequisites**: Python 3.x, Node.js.
2. **First Run**:
   - Run `python launch.py` from the root directory.
   - This script automates:
     - Creating Python virtual environment.
     - Installing Python dependencies (`backend/requirements.txt`).
     - Initializing the SQLite database (`backend/init_db.py`).
     - Starting the Flask Backend (Port 5000).
     - Starting the React Frontend (Port 5173) via `npm run dev`.
     - Opening your default browser.

## Manual Commands (if needed)
- **Reset Database**: `python backend/init_db.py`
- **Train ML Model**: `python ml/train.py` (Must be run after generating new ratings)
- **Run Backend**: `python backend/app.py`
- **Run Frontend**: `cd client && npm run dev`

## Demo Accounts
The system is pre-seeded with the following users:
- **Student**: `student1` / `password`
- **Student**: `student2` / `password`
- **Admin**: `admin1` / `password`
- **Management**: `manager1` / `password`
