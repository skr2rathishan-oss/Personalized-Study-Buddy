
import os
import subprocess
import time
import webbrowser
import platform
import shutil
import sys

# Configuration
# Configuration
# Fix: OTP_DIR should be current dir if running FROM otp_sandbox
if os.path.basename(os.getcwd()) == "otp_sandbox":
    OTP_DIR = "."
else:
    OTP_DIR = "otp_sandbox"

PORT = 3000

def check_node():
    """Checks if Node is installed."""
    if shutil.which("node") is None:
        # Fallback check
        if os.path.exists(r"C:\Program Files\nodejs"):
             print("Notice: Adding Node.js to PATH...")
             os.environ["PATH"] += os.pathsep + r"C:\Program Files\nodejs"
             return True
        print("Error: Node.js not found.")
        return False
    return True

def install_deps():
    """Installs dependencies if node_modules missing."""
    if not os.path.exists(os.path.join(OTP_DIR, "node_modules")):
        print("Installing OTP Sandbox dependencies...")
        subprocess.check_call(["npm", "install"], cwd=OTP_DIR, shell=True)
    else:
        print("Dependencies ready.")

def run_server():
    """Runs the Node server."""
    print(f"Starting OTP Sandbox on port {PORT}...")
    try:
        # Kill old if exists
        subprocess.call(f"npx kill-port {PORT}", shell=True, cwd=OTP_DIR, stderr=subprocess.DEVNULL)
    except: pass
    
    return subprocess.Popen(["node", "server.js"], cwd=OTP_DIR, shell=True)

def main():
    if not check_node():
        sys.exit(1)

    install_deps()
    
    server_process = run_server()
    
    time.sleep(2)
    public_ip = "20.244.40.57" 
    url = f"http://{public_ip}:{PORT}/test.html"
    print(f"\n[Running] OTP Sandbox accessible at: {url}")
    print("Use Ctrl+C to stop.\n")

    try:
        while True:
            time.sleep(1)
            if server_process.poll() is not None:
                print("Server stopped.")
                break
    except KeyboardInterrupt:
        print("\nStopping...")
        subprocess.call(['taskkill', '/F', '/T', '/PID', str(server_process.pid)], 
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

if __name__ == "__main__":
    main()
