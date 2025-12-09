import os
import sys
import subprocess
import time
import threading
import re
import urllib.request

# Configuration
CLOUDFLARED_URL = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
CLOUDFLARED_EXE = "cloudflared.exe"

def download_cloudflared():
    if not os.path.exists(CLOUDFLARED_EXE):
        print("Downloading cloudflared.exe...")
        try:
            urllib.request.urlretrieve(CLOUDFLARED_URL, CLOUDFLARED_EXE)
            print("Download complete.")
        except Exception as e:
            print(f"Error downloading cloudflared: {e}")
            sys.exit(1)
        
    # Ensure file is ready
    if os.path.exists(CLOUDFLARED_EXE):
        time.sleep(1)

def kill_port(port):
    """Kills any process listening on the given port (Windows specific)."""
    try:
        cmd = f"netstat -ano | findstr :{port}"
        # Use shell=True to allow piping
        output = subprocess.check_output(cmd, shell=True).decode()
        lines = output.strip().split('\n')
        for line in lines:
            parts = line.split()
            if f":{port}" in parts[1] and "LISTENING" in line:
                pid = parts[-1]
                subprocess.call(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        pass 
    except Exception:
        pass

def start_tunnel(port, name):
    """Starts a cloudflared tunnel and returns the public URL."""
    print(f"Starting Cloudflare tunnel for {name} (Port {port})...")
    
    # Start cloudflared
    # --url localhost:port creates a quick tunnel
    process = subprocess.Popen(
        [CLOUDFLARED_EXE, "tunnel", "--url", f"localhost:{port}"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        stdin=subprocess.DEVNULL,
        text=True,
        bufsize=1
    )
    
    url = None
    # Cloudflared outputs the URL to stderr usually
    while True:
        line = process.stderr.readline()
        if not line:
            break
        # print(f"[{name} CF]: {line.strip()}") # Debug
        
        # Regex to find https://*.trycloudflare.com
        match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
        if match:
            url = match.group(0)
            print(f"✅ {name} Tunnel Live: {url}")
            break
            
    # Start a thread to keep reading stderr so buffer doesn't fill
    def read_stream(stream):
        for _ in stream: pass
    threading.Thread(target=read_stream, args=(process.stderr,), daemon=True).start()
    threading.Thread(target=read_stream, args=(process.stdout,), daemon=True).start()
    
    return process, url

def main():
    print("--- Personal Study Buddy: Cloudflare Public Share ---")
    
    # 1. Prepare
    download_cloudflared()
    kill_port(5000)
    kill_port(5173)

    # 2. Start Backend Tunnel
    be_tunnel_proc, be_url = start_tunnel(5000, "Backend")
    if not be_url:
        print("Failed to start backend tunnel.")
        return

    # 3. Start Frontend Tunnel
    fe_tunnel_proc, fe_url = start_tunnel(5173, "Frontend")
    if not fe_url:
        print("Failed to start frontend tunnel.")
        be_tunnel_proc.terminate()
        return

    print("\n" + "="*50)
    print(f"👉 APP PUBLIC URL: {fe_url}")
    print(f"(API URL: {be_url})")
    print("="*50 + "\n")

    # 4. Start Backend App
    print("Starting Flask Backend...")
    python_exec = sys.executable
    backend_env = os.environ.copy()
    backend_process = subprocess.Popen(
        [python_exec, "backend/app.py"], 
        cwd=os.getcwd(),
        env=backend_env
    )

    # 5. Start Frontend App
    print("Starting Vite Frontend...")
    frontend_env = os.environ.copy()
    frontend_env['VITE_API_URL'] = be_url 
    # VITE_API_URL is picked up by our updated api.ts
    
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"], 
        cwd="frontend",
        shell=True,
        env=frontend_env
    )

    try:
        while True:
            time.sleep(1)
            if backend_process.poll() is not None:
                print("Backend process died.")
                break
    except KeyboardInterrupt:
        print("\nStopping services...")
    finally:
        # Cleanup
        backend_process.terminate()
        subprocess.call(['taskkill', '/F', '/T', '/PID', str(frontend_process.pid)], 
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        be_tunnel_proc.terminate()
        fe_tunnel_proc.terminate()
        print("Cleaned up.")

if __name__ == "__main__":
    main()
