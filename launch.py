import os
import sys
import subprocess
import time
import webbrowser
import platform
import shutil

# Configuration
VENV_DIR = "venv"
REQUIREMENTS_FILE = os.path.join("backend", "requirements.txt")
BACKEND_SCRIPT = os.path.join("backend", "app.py")
INIT_DB_SCRIPT = os.path.join("backend", "init_db.py")
ML_TRAIN_SCRIPT = os.path.join("ml", "train.py")
FRONTEND_DIR = "frontend"
FRONTEND_PORT = 5173
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

def kill_process_on_port(port):
    """Finds and kills the process listening on the specified port (Windows)."""
    if platform.system() == "Windows":
        try:
            # Find PID using netstat
            cmd = f'netstat -ano | findstr :{port}'
            p = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            out, err = p.communicate()
            output = out.decode()
            
            pids = set()
            for line in output.splitlines():
                # Check for listening state to confirm it's a server
                if f":{port}" in line and "LISTENING" in line:
                    parts = line.strip().split()
                    pid = parts[-1]
                    pids.add(pid)
            
            for pid in pids:
                if pid != "0": # PID 0 is system idle
                    print(f"Cleaning up: Killing old process {pid} on port {port}...")
                    subprocess.call(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            print(f"Warning: Could not cleanup port {port}: {e}")

def cleanup_old_instances():
    """Aggressively cleans up old backend and frontend processes."""
    print("--- Pipeline Cleanup: Removing old instances ---")
    kill_process_on_port(BACKEND_PORT)
    kill_process_on_port(FRONTEND_PORT)
    # Also check typical alternate ports just in case
    kill_process_on_port(5174)
    kill_process_on_port(5175)
    print("----------------------------------------------")

def install_dependencies(python_exec):
    """Installs dependencies from requirements.txt."""
    if os.path.exists(REQUIREMENTS_FILE):
        print("Checking Backend dependencies...")
        try:
            subprocess.check_call([python_exec, "-m", "pip", "install", "-r", REQUIREMENTS_FILE], stdout=subprocess.DEVNULL)
            print("Backend dependencies installed.")
        except subprocess.CalledProcessError as e:
            print(f"Error installing dependencies: {e}")
            sys.exit(1)
    else:
        print(f"Warning: '{REQUIREMENTS_FILE}' not found. Skipping dependency installation.")

def init_database(python_exec):
    """Initializes the database."""
    if os.path.exists(INIT_DB_SCRIPT):
        if not os.path.exists(os.path.join("backend", "db.sqlite3")):
            print("Initializing database...")
            try:
                subprocess.check_call([python_exec, INIT_DB_SCRIPT])
                print("Database initialized.")
            except subprocess.CalledProcessError as e:
                print(f"Error initializing database: {e}")
        else:
            print("Database check passed (exists).")
    else:
        print(f"Warning: '{INIT_DB_SCRIPT}' not found. Skipping DB initialization.")

def install_frontend_dependencies():
    """Installs frontend dependencies (npm install) if node_modules is missing."""
    node_modules_path = os.path.join(FRONTEND_DIR, "node_modules")
    if not os.path.exists(node_modules_path):
        print("Installing Frontend dependencies (this may take a minute)...")
        try:
            subprocess.check_call(["npm", "install"], cwd=FRONTEND_DIR, shell=True)
            print("Frontend dependencies installed.")
        except subprocess.CalledProcessError as e:
            print(f"Error installing frontend dependencies: {e}")
            print("Please ensure Node.js is installed.")
    else:
        print("Frontend dependencies check passed.")

def train_model(python_exec):
    """Runs the ML training script."""
    if os.path.exists(ML_TRAIN_SCRIPT):
        print("Training ML Recommendation Model...")
        try:
            subprocess.check_call([python_exec, ML_TRAIN_SCRIPT])
            print("ML Model updated.")
        except subprocess.CalledProcessError:
            print("Warning: ML Training encountered an issue (non-fatal).")
    else:
        print(f"Warning: '{ML_TRAIN_SCRIPT}' not found. Skipping ML training.")

def run_backend(python_exec):
    """Runs the Flask backend."""
    print(f"Starting Backend on port {BACKEND_PORT}...")
    return subprocess.Popen([python_exec, BACKEND_SCRIPT], cwd=os.getcwd())

def ensure_node_in_path():
    """Ensures Node.js is in the PATH for the current process."""
    if shutil.which("npm") is None:
        # Fallback: Check common Windows install location
        node_path = r"C:\Program Files\nodejs"
        if os.path.exists(node_path):
            print(f"Adding {node_path} to PATH...")
            os.environ["PATH"] += os.pathsep + node_path
            return True
    return shutil.which("npm") is not None

def run_frontend():
    """Runs the React Frontend."""
    print(f"Starting React Frontend...")
    if not ensure_node_in_path():
        print("Error: 'npm' not found. Please install Node.js.")
        return None
    return subprocess.Popen(["npm", "run", "dev"], cwd=FRONTEND_DIR, shell=True)


def main():
    # 0. Cleanup ports first (Delete old versions)
    cleanup_old_instances()

    # 1. Virtual Environment Check & Creation
    if not is_venv():
        if not os.path.exists(VENV_DIR):
            create_venv()
        
        venv_python = get_python_executable()
        if not os.path.exists(venv_python):
            print(f"Error: Virtual environment python not found at {venv_python}")
            sys.exit(1)

        print(f"Restarting script inside virtual environment: {venv_python}")
        try:
            subprocess.call([venv_python, __file__] + sys.argv[1:])
        except KeyboardInterrupt:
            pass
        return

    # --- We are now running inside the virtual environment ---
    print("Running Pipeline inside virtual environment.")
    python_exec = sys.executable

    # 2. Pipeline Steps
    ensure_node_in_path()
    install_dependencies(python_exec)
    init_database(python_exec)
    install_frontend_dependencies()
    train_model(python_exec)

    # 3. Launch Services
    backend_process = None
    frontend_process = None

    try:
        backend_process = run_backend(python_exec)
        # Wait for backend to start
        time.sleep(3) 

        frontend_process = run_frontend()
        # Wait for frontend to start
        time.sleep(5)

        # 4. Open Browser
        # User defined Public IP (Change if dynamic)
        public_ip = "20.244.40.57" 
        url = f"http://{public_ip}:{FRONTEND_PORT}"
        print(f"\n[SUCCESS] Pipeline Complete. App accessible at {url}")
        print("Use Ctrl+C to stop servers.")
        
        try:
            webbrowser.open(url)
        except Exception:
            print("Could not open browser automatically (likely headless environment).")
        
        # Keep alive
        while True:
            time.sleep(1)
            if backend_process.poll() is not None:
                print("Backend process ended.")
                break
            # Frontend poll is unreliable on Windows with shell=True, so we rely on backend mainly

    except KeyboardInterrupt:
        print("\nStopping services...")
    finally:
        if backend_process:
            backend_process.terminate()
        if frontend_process:
            # Aggressive kill for Windows shell spawned npm
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(frontend_process.pid)], 
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # Auto cleanup on exit
        cleanup_old_instances()
        print("Goodbye!")

if __name__ == "__main__":
    main()
