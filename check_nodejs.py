#!/usr/bin/env python3
"""
Quick diagnostic script to check Node.js and npm installation
"""

import subprocess
import os
import shutil
from pathlib import Path

def check_nodejs():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True,
            timeout=5,
            shell=True
        )
        if result.returncode == 0:
            print(f"✓ Node.js found: {result.stdout.strip()}")
            return True
        else:
            print("✗ Node.js command failed")
            return False
    except Exception as e:
        print(f"✗ Node.js not found: {e}")
        return False

def check_npm():
    """Check if npm is installed"""
    try:
        result = subprocess.run(
            ["npm", "--version"],
            capture_output=True,
            text=True,
            timeout=5,
            shell=True
        )
        if result.returncode == 0:
            print(f"✓ npm found: {result.stdout.strip()}")
            return True
        else:
            print("✗ npm command failed")
            return False
    except Exception as e:
        print(f"✗ npm not found: {e}")
        return False

def find_npm_paths():
    """Try to find npm in common locations"""
    common_paths = [
        r"C:\Program Files\nodejs\npm.cmd",
        r"C:\Program Files (x86)\nodejs\npm.cmd",
        os.path.expanduser(r"~\AppData\Local\Programs\nodejs\npm.cmd"),
    ]
    
    print("\n📂 Checking common Node.js installation paths:")
    found = False
    for path in common_paths:
        if os.path.exists(path):
            print(f"✓ Found: {path}")
            found = True
        else:
            print(f"✗ Not found: {path}")
    
    return found

def get_nodejs_download_link():
    """Print Node.js download instructions"""
    print("\n" + "="*60)
    print("🚀 HOW TO FIX - Install Node.js")
    print("="*60)
    print("\n1. Download Node.js LTS from: https://nodejs.org/")
    print("   (Choose the LTS version, not Current)")
    print("\n2. Run the installer and follow the setup wizard")
    print("   ✓ Choose 'Install for all users'")
    print("   ✓ Accept default installation path")
    print("   ✓ Check 'npm package manager'")
    print("\n3. After installation, RESTART your terminal/PowerShell")
    print("\n4. Verify installation by running:")
    print("   node --version")
    print("   npm --version")
    print("\n5. Then run the project launcher:")
    print("   python launch.py")
    print("="*60 + "\n")

def main():
    """Run diagnostic checks"""
    print("\n" + "="*60)
    print("Node.js & npm Installation Diagnostic")
    print("="*60 + "\n")
    
    node_ok = check_nodejs()
    npm_ok = check_npm()
    
    print()
    
    if node_ok and npm_ok:
        print("✓ All checks passed! Your system is ready.")
        print("\nYou can now run: python launch.py")
    else:
        find_npm_paths()
        get_nodejs_download_link()
        
        if not node_ok or not npm_ok:
            print("📌 IMPORTANT STEPS:")
            print("1. Install Node.js from https://nodejs.org/ (LTS version)")
            print("2. Restart your terminal completely")
            print("3. Run this script again to verify")
            print("4. Run: python launch.py")

if __name__ == "__main__":
    main()
