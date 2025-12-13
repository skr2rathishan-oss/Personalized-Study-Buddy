#!/usr/bin/env python3
"""
Personalized Study Buddy - Project Launcher
Handles environment setup, dependency installation, service startup, and public tunneling.
"""

import os
import sys
import subprocess
import time
import signal
import platform
import threading
import shutil
from pathlib import Path

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    """Print header with formatting"""
    print(f"\n{Colors.BOLD}{Colors.HEADER}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}{text.center(60)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}{'='*60}{Colors.ENDC}\n")

def print_status(text, status="INFO"):
    """Print status message"""
    if status == "SUCCESS":
        print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")
    elif status == "ERROR":
        print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")
    elif status == "WARNING":
        print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")
    else:
        print(f"{Colors.OKCYAN}→ {text}{Colors.ENDC}")

def get_python_executable():
    """Get the correct Python executable path"""
    project_root = Path(__file__).parent
    venv_path = project_root / "venv"
    
    if platform.system() == "Windows":
        python_exe = venv_path / "Scripts" / "python.exe"
    else:
        python_exe = venv_path / "bin" / "python"
    
    if python_exe.exists():
        return str(python_exe)
    else:
        return sys.executable

def check_python_version():
    """Verify Python version is 3.8+"""
    if sys.version_info < (3, 8):
        print_status(f"Python 3.8+ required, found {sys.version_info.major}.{sys.version_info.minor}", "ERROR")
        sys.exit(1)
    print_status(f"Python {sys.version_info.major}.{sys.version_info.minor} detected", "SUCCESS")

def create_venv():
    """Create virtual environment if it doesn't exist"""
    project_root = Path(__file__).parent
    venv_path = project_root / "venv"
    
    if venv_path.exists():
        print_status("Virtual environment already exists", "SUCCESS")
        return
    
    print_status("Creating virtual environment...")
    subprocess.run([sys.executable, "-m", "venv", str(venv_path)], check=True)
    print_status("Virtual environment created", "SUCCESS")

def check_npm_installed():
    """Check if npm is installed and available"""
    try:
        result = subprocess.run(
            ["npm", "--version"],
            capture_output=True,
            check=True,
            timeout=5,
            shell=True
        )
        print_status(f"npm version: {result.stdout.decode().strip()}", "SUCCESS")
        return True
    except Exception as e:
        print_status(f"npm check failed: {e}", "WARNING")
        return False

def find_npm_path():
    """Try to find npm in common locations"""
    
    # Try standard PATH first
    npm_path = shutil.which("npm")
    if npm_path:
        return npm_path
    
    # Try common installation locations on Windows
    common_paths = [
        r"C:\Program Files\nodejs\npm.cmd",
        r"C:\Program Files (x86)\nodejs\npm.cmd",
        os.path.expanduser(r"~\AppData\Local\Programs\nodejs\npm.cmd"),
    ]
    
    for path in common_paths:
        if os.path.exists(path):
            return path
    
    return None

def find_npx_path():
    """Try to find npx"""
    npx_path = shutil.which("npx")
    if npx_path:
        return npx_path
        
    # Infer from npm path
    npm_path = find_npm_path()
    if npm_path:
        # Windows usually has npx.cmd in the same dir
        npx_candidate = npm_path.replace("npm", "npx")
        if os.path.exists(npx_candidate):
            return npx_candidate
            
    return "npx" # Fallback

def install_dependencies():
    """Install backend and frontend dependencies"""
    project_root = Path(__file__).parent
    python_exe = get_python_executable()
    
    # Backend dependencies
    print_status("Installing backend dependencies...")
    backend_requirements = project_root / "backend" / "requirements.txt"
    if backend_requirements.exists():
        subprocess.run(
            [python_exe, "-m", "pip", "install", "--upgrade", "pip"],
            check=False
        )
        subprocess.run(
            [python_exe, "-m", "pip", "install", "-r", str(backend_requirements)],
            check=True
        )
        print_status("Backend dependencies installed", "SUCCESS")
    else:
        print_status("Backend requirements.txt not found", "WARNING")
    
    # Frontend dependencies
    print_status("Installing frontend dependencies...")
    frontend_dir = project_root / "frontend"
    
    # Check if npm is installed
    npm_path = find_npm_path()
    if not npm_path:
        print_status("npm is not installed or not in PATH", "ERROR")
        return
    
    if frontend_dir.exists():
        try:
            subprocess.run(
                [npm_path, "install"],
                cwd=str(frontend_dir),
                check=True,
                timeout=300,
                shell=True
            )
            print_status("Frontend dependencies installed", "SUCCESS")
        except subprocess.TimeoutExpired:
            print_status("Frontend installation timeout (proceeding)", "WARNING")
        except Exception as e:
            print_status(f"Frontend installation error: {e}", "WARNING")
    else:
        print_status("Frontend directory not found", "WARNING")

def verify_project_integrity():
    """Verify essential project files exist"""
    print_status("Verifying project integrity...")
    project_root = Path(__file__).parent
    
    essential_files = [
        "backend/app.py",
        "backend/models.py",
        "backend/requirements.txt",
        "frontend/package.json",
        "frontend/src/main.tsx",
        ".env"
    ]
    
    missing_files = []
    for file in essential_files:
        file_path = project_root / file
        if not file_path.exists():
            missing_files.append(file)
            print_status(f"Missing: {file}", "WARNING")
        else:
            print_status(f"Found: {file}", "SUCCESS")
    
    if missing_files:
        print_status(f"Warning: {len(missing_files)} file(s) missing", "WARNING")
    else:
        print_status("All essential files present", "SUCCESS")

def check_database():
    """Check if database exists"""
    project_root = Path(__file__).parent
    db_path = project_root / "backend" / "data" / "db.sqlite3"
    
    if db_path.exists():
        print_status("Database file found", "SUCCESS")
    else:
        print_status("Database file not found. It will be created on first run.", "WARNING")

def train_ml_models():
    """Train ML recommendation models"""
    print_status("Training ML recommendation models...")
    project_root = Path(__file__).parent
    python_exe = get_python_executable()
    ml_script = project_root / "ml" / "train.py"
    
    if ml_script.exists():
        try:
            subprocess.run(
                [python_exe, str(ml_script)],
                cwd=str(project_root),
                check=True,
                timeout=300
            )
            print_status("ML models trained successfully", "SUCCESS")
        except Exception as e:
            print_status(f"ML training warning: {e}", "WARNING")
    else:
        print_status("ML training script not found", "WARNING")

def get_backend_port():
    return os.getenv("FLASK_PORT", "5000")

def get_frontend_port():
    return os.getenv("VITE_PORT", "5173")

def launch_backend():
    """Launch Flask backend server with Hot Reload"""
    print_status("Starting backend server (Dynamic Mode)...")
    project_root = Path(__file__).parent
    backend_dir = project_root / "backend"
    python_exe = get_python_executable()
    port = get_backend_port()
    
    env = os.environ.copy()
    env["FLASK_APP"] = "app.py"
    env["FLASK_DEBUG"] = "1"  # Logic for Hot Reload
    
    # We remove stdout=subprocess.PIPE to let logs flow to the console
    backend_process = subprocess.Popen(
        [python_exe, "-m", "flask", "run", "--host=0.0.0.0", f"--port={port}"],
        cwd=str(backend_dir),
        env=env
        # stdout and stderr inherited by default
    )
    
    print_status(f"Backend LIVE on http://127.0.0.1:{port}", "SUCCESS")
    return backend_process

def launch_frontend():
    """Launch Vite frontend development server"""
    print_status("Starting frontend server (Dynamic Mode)...")
    project_root = Path(__file__).parent
    frontend_dir = project_root / "frontend"
    port = get_frontend_port()
    
    npm_path = find_npm_path()
    if not npm_path:
        print_status("npm not found - frontend cannot start", "ERROR")
        return None
    
    try:
        # Inherit stdout so user sees Vite/HMR logs
        frontend_process = subprocess.Popen(
            [npm_path, "run", "dev"],
            cwd=str(frontend_dir),
            shell=True
        )
        print_status(f"Frontend LIVE on http://127.0.0.1:{port}", "SUCCESS")
        return frontend_process
    except Exception as e:
        print_status(f"Failed to start frontend: {e}", "ERROR")
        return None

def start_public_tunnel():
    """Start localtunnel to expose the frontend"""
    print_status("Starting Public Tunnel (Localtunnel)...")
    port = get_frontend_port()
    npx_path = find_npx_path()
    
    try:
        # We want to capture the URL from this one
        tunnel_process = subprocess.Popen(
            [npx_path, "localtunnel", "--port", port],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True
        )
        
        def monitor_tunnel_output():
            # Read line by line to find the URL
            for line in iter(tunnel_process.stdout.readline, b''):
                decoded_line = line.decode().strip()
                if "your url is" in decoded_line.lower():
                     print(f"\n{Colors.BOLD}{Colors.OKGREEN}🌍 PUBLIC ACCESS URL: {decoded_line}{Colors.ENDC}\n")
                
                # Also check for Errors
                if "error" in decoded_line.lower():
                     print(f"{Colors.FAIL}[Tunnel Error] {decoded_line}{Colors.ENDC}")

        # Start monitoring in background thread
        t = threading.Thread(target=monitor_tunnel_output, daemon=True)
        t.start()
        
        return tunnel_process
    except Exception as e:
        print_status(f"Tunnel failed to start: {e}", "WARNING")
        return None

def get_network_ip():
    try:
        import socket
        hostname = socket.gethostname()
        ip = socket.gethostbyname(hostname)
        return ip
    except:
        return "localhost"

def main():
    """Main launcher function"""
    try:
        print_header("Personalized Study Buddy - Dynamic Launcher")
        
        # Prerequisite Checks
        check_python_version()
        create_venv()
        install_dependencies() # Ensures all libs are ready
        check_database()
        
        # Optional: Train models (can be slow, but user asked to check everything)
        # train_ml_models() 
        
        # Launch Services
        print_header("Launching Dynamic Services")
        print_status("Output from services will appear below...", "INFO")
        
        backend_process = launch_backend()
        time.sleep(2)  # Give backend a moment
        
        frontend_process = launch_frontend()
        time.sleep(2)
        
        # Tunnel
        tunnel_process = start_public_tunnel()
        
        print_header("System Dash")
        port = get_frontend_port()
        ip = get_network_ip()
        print(f"  🏠 Local Access:   http://localhost:{port}")
        print(f"  🏢 Network Access: http://{ip}:{port}")
        print(f"  ⚡ Hot Reloading:  ENABLED (Save files to see changes)")
        print(f"  🌍 Public Access:  Check for URL above (courtesy of localtunnel)\n")
        
        # Keep processes running
        try:
            while True:
                time.sleep(1)
                # Check for crashes
                if backend_process and backend_process.poll() is not None:
                     print_status("Backend CRASHED. Restarting is manual for now.", "ERROR")
                     break
                if frontend_process and frontend_process.poll() is not None:
                     print_status("Frontend CRASHED.", "ERROR")
                     break
        except KeyboardInterrupt:
            print(f"\n{Colors.WARNING}Stopping services...{Colors.ENDC}")
            if backend_process: backend_process.terminate()
            if frontend_process: frontend_process.terminate()
            if tunnel_process: tunnel_process.terminate()
            
            # Force kill if needed
            time.sleep(1)
            if backend_process: backend_process.kill()
            if frontend_process: frontend_process.kill()
            if tunnel_process: tunnel_process.kill()
            
            print_status("Services Stopped", "SUCCESS")
            sys.exit(0)

    except Exception as e:
        print_status(f"Launcher Error: {e}", "ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main()
