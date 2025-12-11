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
OTP_DIR = "otp_sandbox"
OTP_SCRIPT = os.path.join(OTP_DIR, "server.js")

FRONTEND_PORT = 5173
BACKEND_PORT = 5000
OTP_PORT = 3000
PUBLIC_IP = "20.244.40.57"

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
            cmd = f'netstat -ano | findstr :{port}'
            p = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            out, err = p.communicate()
            output = out.decode()
            
            pids = set()
            for line in output.splitlines():
                if f":{port}" in line and "LISTENING" in line:
                    parts = line.strip().split()
                    pid = parts[-1]
                    pids.add(pid)
            
            for pid in pids:
                if pid != "0": 
                    print(f"Cleaning up: Killing old process {pid} on port {port}...")
                    subprocess.call(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            pass

def cleanup_old_instances():
    """Aggressively cleans up old backend, frontend, and OTP listener processes."""
    print("--- Pipeline Cleanup: Removing old instances ---")
    kill_process_on_port(BACKEND_PORT)
    kill_process_on_port(FRONTEND_PORT)
    kill_process_on_port(5174) # Vite fallback
    kill_process_on_port(OTP_PORT)
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

def run_frontend():
    """Runs the React Frontend."""
    print(f"Starting React Frontend...")
    return subprocess.Popen(["npm", "run", "dev"], cwd=FRONTEND_DIR, shell=True)

def run_otp_listener():
    """Runs the OTP Notification Listener (Node.js)."""
    if os.path.exists(OTP_SCRIPT):
        print(f"Starting Notification Dashboard on port {OTP_PORT}...")
        # Ensure node modules exist for OTP sandbox
        if not os.path.exists(os.path.join(OTP_DIR, 'node_modules')):
             print("Installing OTP Sandbox dependencies...")
             subprocess.call(["npm", "install"], cwd=OTP_DIR, shell=True, stdout=subprocess.DEVNULL)
        
        return subprocess.Popen(["node", "server.js"], cwd=OTP_DIR, shell=True)
    else:
         print(f"Warning: {OTP_SCRIPT} not found. Skipping Notification Dashboard.")
         return None

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

def main():
    # 0. Cleanup first
    cleanup_old_instances()
    
    # Ensure Node is found
    ensure_node_in_path()

    # 1. Virtual Environment Setup
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

    python_exec = sys.executable

    # 2. Pipeline Steps
    install_dependencies(python_exec)
    init_database(python_exec)
    install_frontend_dependencies()
    train_model(python_exec)

    # 3. Launch Services
    backend_process = None
    frontend_process = None
    otp_process = None

    try:
        backend_process = run_backend(python_exec)
        time.sleep(2) 
        
        otp_process = run_otp_listener()
        time.sleep(1)

        frontend_process = run_frontend()
        time.sleep(4)

        # 4. Open Browser
        app_url = f"http://{PUBLIC_IP}:{FRONTEND_PORT}"
        dashboard_url = f"http://{PUBLIC_IP}:{OTP_PORT}"
        
        print(f"\n=======================================================")
        print(f" [SUCCESS] PROJECT LAUNCHED SUCCESSFULLY")
        print(f" -------------------------------------------------------")
        print(f" > Main App    : {app_url}  (Register here)")
        print(f" > Dashboard   : {dashboard_url}  (View Subscriptions)")
        print(f"=======================================================\n")
        print("Use Ctrl+C to stop all servers.")
        
        try:
            webbrowser.open(app_url)
            webbrowser.open(dashboard_url)
        except Exception:
            pass
        
        while True:
            time.sleep(1)
            if backend_process.poll() is not None:
                print("Backend process ended.")
                break

    except KeyboardInterrupt:
        print("\nStopping services...")
    finally:
        if backend_process: backend_process.terminate()
        if otp_process: 
             subprocess.call(['taskkill', '/F', '/T', '/PID', str(otp_process.pid)], 
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if frontend_process: 
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(frontend_process.pid)], 
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        cleanup_old_instances()
        print("Goodbye!")

if __name__ == "__main__":
    main()
