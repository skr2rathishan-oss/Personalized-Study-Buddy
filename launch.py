import os
import sys
import subprocess
import time
import webbrowser
import threading
import platform

# Configuration
VENV_DIR = "venv"
REQUIREMENTS_FILE = os.path.join("backend", "requirements.txt")
BACKEND_SCRIPT = os.path.join("backend", "app.py")
INIT_DB_SCRIPT = os.path.join("backend", "init_db.py")
FRONTEND_DIR = "frontend"
FRONTEND_PORT = 8000
BACKEND_PORT = 5000

def get_python_executable():
    """Returns the path to the Python executable in the virtual environment."""
    if platform.system() == "Windows":
        return os.path.join(VENV_DIR, "Scripts", "python.exe")
    else:
        return os.path.join(VENV_DIR, "bin", "python")

def is_venv():
    """Checks if the script is running inside a virtual environment."""
    return (hasattr(sys, 'real_prefix') or
            (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix))

def create_venv():
    """Creates a virtual environment if it doesn't exist."""
    if not os.path.exists(VENV_DIR):
        print(f"Creating virtual environment in '{VENV_DIR}'...")
        try:
            subprocess.check_call([sys.executable, "-m", "venv", VENV_DIR])
            print("Virtual environment created successfully.")
        except subprocess.CalledProcessError as e:
            print(f"Error creating virtual environment: {e}")
            sys.exit(1)
    else:
        print(f"Virtual environment '{VENV_DIR}' already exists.")

def install_dependencies(python_exec):
    """Installs dependencies from requirements.txt."""
    if os.path.exists(REQUIREMENTS_FILE):
        print("Checking and installing dependencies...")
        try:
            subprocess.check_call([python_exec, "-m", "pip", "install", "-r", REQUIREMENTS_FILE])
            print("Dependencies installed.")
        except subprocess.CalledProcessError as e:
            print(f"Error installing dependencies: {e}")
            sys.exit(1)
    else:
        print(f"Warning: '{REQUIREMENTS_FILE}' not found. Skipping dependency installation.")

def init_database(python_exec):
    """Initializes the database."""
    if os.path.exists(INIT_DB_SCRIPT):
        print("Initializing database...")
        try:
            subprocess.check_call([python_exec, INIT_DB_SCRIPT])
            print("Database initialized.")
        except subprocess.CalledProcessError as e:
            print(f"Error initializing database: {e}")
            # Don't exit, maybe it's already initialized or minor error
    else:
        print(f"Warning: '{INIT_DB_SCRIPT}' not found. Skipping DB initialization.")

def run_backend(python_exec):
    """Runs the Flask backend."""
    print(f"Starting Backend on port {BACKEND_PORT}...")
    return subprocess.Popen([python_exec, BACKEND_SCRIPT], cwd=os.getcwd())

def run_frontend(python_exec):
    """Runs the Frontend using Python's http.server."""
    print(f"Starting Frontend on port {FRONTEND_PORT}...")
    # We use the venv python to run http.server just to be consistent, though system python would work too
    return subprocess.Popen([python_exec, "-m", "http.server", str(FRONTEND_PORT), "--directory", FRONTEND_DIR])

def main():
    # 1. Virtual Environment Check & Creation
    if not is_venv():
        # If we are not in the venv, check if we need to create it
        if not os.path.exists(VENV_DIR):
            create_venv()
        
        # Re-run this script using the venv's python
        venv_python = get_python_executable()
        if not os.path.exists(venv_python):
            print(f"Error: Virtual environment python not found at {venv_python}")
            sys.exit(1)

        print(f"Restarting script inside virtual environment: {venv_python}")
        # Pass all arguments along
        subprocess.call([venv_python, __file__] + sys.argv[1:])
        return

    # --- We are now running inside the virtual environment ---
    print("Running inside virtual environment.")
    python_exec = sys.executable

    # 2. Install Dependencies
    install_dependencies(python_exec)

    # 3. Initialize Database
    init_database(python_exec)

    # 4. Launch Services
    backend_process = None
    frontend_process = None

    try:
        backend_process = run_backend(python_exec)
        frontend_process = run_frontend(python_exec)

        # Wait a moment for servers to start
        time.sleep(3)

        # 5. Open Browser
        url = f"http://localhost:{FRONTEND_PORT}"
        print(f"Opening browser at {url}")
        webbrowser.open(url)

        print("\nApp is running! Press Ctrl+C to stop.")
        
        # Keep the script running to monitor processes
        while True:
            time.sleep(1)
            if backend_process.poll() is not None:
                print("Backend process ended unexpectedly.")
                break
            if frontend_process.poll() is not None:
                print("Frontend process ended unexpectedly.")
                break

    except KeyboardInterrupt:
        print("\nStopping services...")
    finally:
        if backend_process:
            backend_process.terminate()
        if frontend_process:
            frontend_process.terminate()
        print("Goodbye!")

if __name__ == "__main__":
    main()
