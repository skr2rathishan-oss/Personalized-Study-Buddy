import os
import sys
import subprocess
import time
import webbrowser
import platform

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
    """Aggressively cleans up old backend and frontend processes."""
    print("--- Pipeline Cleanup: Removing old instances ---")
    kill_process_on_port(BACKEND_PORT)
    kill_process_on_port(FRONTEND_PORT)
    kill_process_on_port(5174)
    kill_process_on_port(5175)
    print("----------------------------------------------")

def main():
    # 0. Cleanup first
    cleanup_old_instances()

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
    print("Running Pipeline...")

    # 2. Dependencies & Setup
    if os.path.exists(REQUIREMENTS_FILE):
        subprocess.check_call([python_exec, "-m", "pip", "install", "-r", REQUIREMENTS_FILE], stdout=subprocess.DEVNULL)
    
    if os.path.exists(INIT_DB_SCRIPT) and not os.path.exists(os.path.join("backend", "db.sqlite3")):
        subprocess.check_call([python_exec, INIT_DB_SCRIPT])

    node_modules_path = os.path.join(FRONTEND_DIR, "node_modules")
    if not os.path.exists(node_modules_path):
        print("Installing Frontend dependencies...")
        subprocess.check_call(["npm", "install"], cwd=FRONTEND_DIR, shell=True)

    if os.path.exists(ML_TRAIN_SCRIPT):
        print("Training ML Model...")
        try:
            subprocess.check_call([python_exec, ML_TRAIN_SCRIPT])
        except: pass

    # 3. Launch Services
    backend_process = None
    frontend_process = None

    try:
        print(f"Starting Backend on port {BACKEND_PORT}...")
        backend_process = subprocess.Popen([python_exec, BACKEND_SCRIPT], cwd=os.getcwd())
        time.sleep(2) 

        print(f"Starting Frontend...")
        frontend_process = subprocess.Popen(["npm", "run", "dev"], cwd=FRONTEND_DIR, shell=True)
        time.sleep(4)

        url = f"http://localhost:{FRONTEND_PORT}"
        print(f"\n[SUCCESS] Pipeline Complete. Opening App at {url}")
        print("Use Ctrl+C to stop servers.")
        webbrowser.open(url)
        
        while True:
            time.sleep(1)
            if backend_process.poll() is not None:
                print("Backend process ended.")
                break

    except KeyboardInterrupt:
        print("\nStopping services...")
    finally:
        if backend_process: backend_process.terminate()
        if frontend_process: 
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(frontend_process.pid)], 
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        cleanup_old_instances()
        print("Goodbye!")

if __name__ == "__main__":
    main()
