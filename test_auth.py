#!/usr/bin/env python3
"""
Quick test script for the new email/password authentication system
Run this to verify the auth flow works before deploying
"""

import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv("backend/.env")

BACKEND_URL = "http://localhost:8000"  # Change if running on different port
API = f"{BACKEND_URL}/api"

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "lulzimn995@gmail.com")
STAFF_EMAIL = os.getenv("STAFF_EMAIL", "staff@mdental.com")
DEFAULT_PASSWORD = os.getenv("DEFAULT_PASSWORD", "MDental2024!")

print("=" * 60)
print("Testing M-Dental Authentication System")
print("=" * 60)

# Step 1: Seed users
print("\n1. Seeding users...")
try:
    response = requests.post(f"{API}/auth/seed")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Seed successful: {data}")
    else:
        print(f"   ✗ Seed failed: {response.status_code} - {response.text}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Step 2: Test admin login
print("\n2. Testing Admin Login...")
try:
    response = requests.post(
        f"{API}/auth/login",
        json={"email": ADMIN_EMAIL, "password": DEFAULT_PASSWORD}
    )
    if response.status_code == 200:
        user = response.json()
        print(f"   ✓ Admin login successful")
        print(f"     Email: {user['email']}")
        print(f"     Role: {user['role']}")
        print(f"     User ID: {user['user_id']}")
        admin_cookies = response.cookies
    else:
        print(f"   ✗ Admin login failed: {response.status_code} - {response.text}")
        admin_cookies = None
except Exception as e:
    print(f"   ✗ Error: {e}")
    admin_cookies = None

# Step 3: Test /auth/me with admin session
if admin_cookies:
    print("\n3. Testing /auth/me with admin session...")
    try:
        response = requests.get(f"{API}/auth/me", cookies=admin_cookies)
        if response.status_code == 200:
            user = response.json()
            print(f"   ✓ Session verified")
            print(f"     Email: {user['email']}")
            print(f"     Role: {user['role']}")
        else:
            print(f"   ✗ Verification failed: {response.status_code}")
    except Exception as e:
        print(f"   ✗ Error: {e}")

# Step 4: Test staff login
print("\n4. Testing Staff Login...")
try:
    response = requests.post(
        f"{API}/auth/login",
        json={"email": STAFF_EMAIL, "password": DEFAULT_PASSWORD}
    )
    if response.status_code == 200:
        user = response.json()
        print(f"   ✓ Staff login successful")
        print(f"     Email: {user['email']}")
        print(f"     Role: {user['role']}")
        print(f"     User ID: {user['user_id']}")
        staff_cookies = response.cookies
    else:
        print(f"   ✗ Staff login failed: {response.status_code} - {response.text}")
        staff_cookies = None
except Exception as e:
    print(f"   ✗ Error: {e}")
    staff_cookies = None

# Step 5: Test wrong password
print("\n5. Testing wrong password (should fail)...")
try:
    response = requests.post(
        f"{API}/auth/login",
        json={"email": ADMIN_EMAIL, "password": "wrongpassword"}
    )
    if response.status_code == 401:
        print(f"   ✓ Correctly rejected wrong password")
    else:
        print(f"   ✗ Unexpected response: {response.status_code}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Step 6: Test logout
if admin_cookies:
    print("\n6. Testing logout...")
    try:
        response = requests.post(f"{API}/auth/logout", cookies=admin_cookies)
        if response.status_code == 200:
            print(f"   ✓ Logout successful")
            
            # Try to access /auth/me after logout
            response = requests.get(f"{API}/auth/me", cookies=admin_cookies)
            if response.status_code == 401:
                print(f"   ✓ Session properly invalidated")
            else:
                print(f"   ✗ Session still valid after logout")
        else:
            print(f"   ✗ Logout failed: {response.status_code}")
    except Exception as e:
        print(f"   ✗ Error: {e}")

print("\n" + "=" * 60)
print("Test Complete!")
print("=" * 60)
