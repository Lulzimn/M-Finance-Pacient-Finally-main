#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime
import subprocess
import time

class FinancialAccessTester:
    def __init__(self, base_url="https://m-dental-finance.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.staff_token = None
        self.admin_user_id = "test_admin_001"
        self.staff_user_id = "test_staff_001"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []
        self.created_inflow_id = None
        self.created_outflow_id = None

    def setup_test_users(self):
        """Create test admin and staff users with sessions"""
        print("🔧 Setting up test users (admin and staff)...")
        
        timestamp = int(time.time())
        admin_session = f"admin_session_{timestamp}"
        staff_session = f"staff_session_{timestamp}"
        
        mongo_script = f"""
use('test_database');

// Create admin user
db.users.insertOne({{
  user_id: '{self.admin_user_id}',
  email: 'admin@m-dental.com',
  name: 'Test Admin User',
  picture: 'https://via.placeholder.com/150',
  role: 'admin',
  created_at: new Date()
}});

// Create staff user
db.users.insertOne({{
  user_id: '{self.staff_user_id}',
  email: 'staff@m-dental.com',
  name: 'Test Staff User',
  picture: 'https://via.placeholder.com/150',
  role: 'staff',
  created_at: new Date()
}});

// Create admin session
db.user_sessions.insertOne({{
  user_id: '{self.admin_user_id}',
  session_token: '{admin_session}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});

// Create staff session
db.user_sessions.insertOne({{
  user_id: '{self.staff_user_id}',
  session_token: '{staff_session}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});

print('Admin session: {admin_session}');
print('Staff session: {staff_session}');
"""
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                self.admin_token = admin_session
                self.staff_token = staff_session
                print(f"✅ Admin user created: {self.admin_user_id}")
                print(f"✅ Staff user created: {self.staff_user_id}")
                print(f"✅ Admin session: {admin_session}")
                print(f"✅ Staff session: {staff_session}")
                return True
            else:
                print(f"❌ MongoDB setup failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ MongoDB setup error: {e}")
            return False

    def cleanup_test_data(self):
        """Clean up test data"""
        print("🧹 Cleaning up test data...")
        
        cleanup_script = f"""
use('test_database');
db.users.deleteMany({{user_id: {{$in: ['{self.admin_user_id}', '{self.staff_user_id}']}}}});
db.user_sessions.deleteMany({{user_id: {{$in: ['{self.admin_user_id}', '{self.staff_user_id}']}}}});
db.inflows.deleteMany({{created_by: {{$in: ['{self.admin_user_id}', '{self.staff_user_id}']}}}});
db.outflows.deleteMany({{created_by: {{$in: ['{self.admin_user_id}', '{self.staff_user_id}']}}}});
"""
        
        try:
            subprocess.run(['mongosh', '--eval', cleanup_script], 
                          capture_output=True, text=True, timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️ Cleanup warning: {e}")

    def run_test(self, name, method, endpoint, expected_status, data=None, session_token=None, user_type="admin"):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if session_token:
            test_headers['Authorization'] = f'Bearer {session_token}'
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name} ({user_type})...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.passed_tests.append(f"{name} ({user_type})")
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
                return True, response.json() if response.text else {}
            else:
                self.failed_tests.append({
                    "test": f"{name} ({user_type})",
                    "expected": expected_status,
                    "actual": response.status_code,
                    "error": response.text[:200]
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Error: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.failed_tests.append({
                "test": f"{name} ({user_type})",
                "expected": expected_status,
                "actual": "Exception",
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_inflow_access(self):
        """Test admin access to inflow endpoints"""
        print("\n💰 Testing Admin Inflow Access...")
        
        # Test GET /api/inflows (admin should succeed)
        success, inflows = self.run_test(
            "Get Inflows",
            "GET",
            "inflows",
            200,
            session_token=self.admin_token,
            user_type="admin"
        )
        
        if not success:
            return False
        
        # Test POST /api/inflows (admin should succeed)
        inflow_data = {
            "kategoria": "pagesa_pacient",
            "pershkrimi": "Test admin inflow creation",
            "shuma": 5000.0,
            "valuta": "MKD",
            "metoda_pageses": "cash"
        }
        
        success, created_inflow = self.run_test(
            "Create Inflow",
            "POST",
            "inflows",
            200,
            data=inflow_data,
            session_token=self.admin_token,
            user_type="admin"
        )
        
        if not success:
            return False
        
        self.created_inflow_id = created_inflow.get("inflow_id")
        if not self.created_inflow_id:
            print("❌ No inflow_id in response")
            return False
        
        # Test PUT /api/inflows/{id} (admin should succeed)
        updated_inflow_data = {
            "kategoria": "sherbim_dentar",
            "pershkrimi": "Updated admin inflow",
            "shuma": 6000.0,
            "valuta": "MKD",
            "metoda_pageses": "karte"
        }
        
        success, _ = self.run_test(
            "Update Inflow",
            "PUT",
            f"inflows/{self.created_inflow_id}",
            200,
            data=updated_inflow_data,
            session_token=self.admin_token,
            user_type="admin"
        )
        
        return success

    def test_admin_outflow_access(self):
        """Test admin access to outflow endpoints"""
        print("\n💸 Testing Admin Outflow Access...")
        
        # Test GET /api/outflows (admin should succeed)
        success, outflows = self.run_test(
            "Get Outflows",
            "GET",
            "outflows",
            200,
            session_token=self.admin_token,
            user_type="admin"
        )
        
        if not success:
            return False
        
        # Test POST /api/outflows (admin should succeed)
        outflow_data = {
            "kategoria": "furnizime",
            "pershkrimi": "Test admin outflow creation",
            "shuma": 2500.0,
            "valuta": "MKD"
        }
        
        success, created_outflow = self.run_test(
            "Create Outflow",
            "POST",
            "outflows",
            200,
            data=outflow_data,
            session_token=self.admin_token,
            user_type="admin"
        )
        
        if not success:
            return False
        
        self.created_outflow_id = created_outflow.get("outflow_id")
        if not self.created_outflow_id:
            print("❌ No outflow_id in response")
            return False
        
        # Test PUT /api/outflows/{id} (admin should succeed)
        updated_outflow_data = {
            "kategoria": "operative",
            "pershkrimi": "Updated admin outflow",
            "shuma": 3000.0,
            "valuta": "MKD"
        }
        
        success, _ = self.run_test(
            "Update Outflow",
            "PUT",
            f"outflows/{self.created_outflow_id}",
            200,
            data=updated_outflow_data,
            session_token=self.admin_token,
            user_type="admin"
        )
        
        return success

    def test_staff_inflow_access_denied(self):
        """Test that staff cannot access inflow endpoints"""
        print("\n🚫 Testing Staff Inflow Access (Should be Denied)...")
        
        # Test GET /api/inflows (staff should get 403)
        success, _ = self.run_test(
            "Get Inflows",
            "GET",
            "inflows",
            403,
            session_token=self.staff_token,
            user_type="staff"
        )
        
        if not success:
            return False
        
        # Test POST /api/inflows (staff should get 403)
        inflow_data = {
            "kategoria": "pagesa_pacient",
            "pershkrimi": "Staff attempt to create inflow",
            "shuma": 1000.0,
            "valuta": "MKD",
            "metoda_pageses": "cash"
        }
        
        success, _ = self.run_test(
            "Create Inflow",
            "POST",
            "inflows",
            403,
            data=inflow_data,
            session_token=self.staff_token,
            user_type="staff"
        )
        
        if not success:
            return False
        
        # Test PUT /api/inflows/{id} (staff should get 403)
        if self.created_inflow_id:
            updated_data = {
                "kategoria": "tjeter",
                "pershkrimi": "Staff attempt to update",
                "shuma": 1500.0,
                "valuta": "MKD",
                "metoda_pageses": "transfer"
            }
            
            success, _ = self.run_test(
                "Update Inflow",
                "PUT",
                f"inflows/{self.created_inflow_id}",
                403,
                data=updated_data,
                session_token=self.staff_token,
                user_type="staff"
            )
            
            if not success:
                return False
        
        return True

    def test_staff_outflow_access_denied(self):
        """Test that staff cannot access outflow endpoints"""
        print("\n🚫 Testing Staff Outflow Access (Should be Denied)...")
        
        # Test GET /api/outflows (staff should get 403)
        success, _ = self.run_test(
            "Get Outflows",
            "GET",
            "outflows",
            403,
            session_token=self.staff_token,
            user_type="staff"
        )
        
        if not success:
            return False
        
        # Test POST /api/outflows (staff should get 403)
        outflow_data = {
            "kategoria": "qira",
            "pershkrimi": "Staff attempt to create outflow",
            "shuma": 800.0,
            "valuta": "MKD"
        }
        
        success, _ = self.run_test(
            "Create Outflow",
            "POST",
            "outflows",
            403,
            data=outflow_data,
            session_token=self.staff_token,
            user_type="staff"
        )
        
        if not success:
            return False
        
        # Test PUT /api/outflows/{id} (staff should get 403)
        if self.created_outflow_id:
            updated_data = {
                "kategoria": "paga",
                "pershkrimi": "Staff attempt to update",
                "shuma": 1200.0,
                "valuta": "MKD"
            }
            
            success, _ = self.run_test(
                "Update Outflow",
                "PUT",
                f"outflows/{self.created_outflow_id}",
                403,
                data=updated_data,
                session_token=self.staff_token,
                user_type="staff"
            )
            
            if not success:
                return False
        
        return True

    def test_admin_delete_access(self):
        """Test admin delete access for inflows and outflows"""
        print("\n🗑️ Testing Admin Delete Access...")
        
        # Test DELETE /api/inflows/{id} (admin should succeed)
        if self.created_inflow_id:
            success, _ = self.run_test(
                "Delete Inflow",
                "DELETE",
                f"inflows/{self.created_inflow_id}",
                200,
                session_token=self.admin_token,
                user_type="admin"
            )
            
            if not success:
                return False
        
        # Test DELETE /api/outflows/{id} (admin should succeed)
        if self.created_outflow_id:
            success, _ = self.run_test(
                "Delete Outflow",
                "DELETE",
                f"outflows/{self.created_outflow_id}",
                200,
                session_token=self.admin_token,
                user_type="admin"
            )
            
            if not success:
                return False
        
        return True

    def test_excel_export_admin(self):
        """Test Excel export functionality for admin"""
        print("\n📊 Testing Excel Export (Admin)...")
        
        # Test export inflows - special handling for binary response
        url = f"{self.api_url}/export/excel?type=inflows"
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        print(f"\n🔍 Testing Export Inflows to Excel (admin)...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            self.tests_run += 1
            
            if response.status_code == 200:
                # Check if it's an Excel file by content type or content
                content_type = response.headers.get('content-type', '')
                if 'spreadsheet' in content_type or 'excel' in content_type or len(response.content) > 0:
                    self.tests_passed += 1
                    self.passed_tests.append("Export Inflows to Excel (admin)")
                    print(f"✅ Passed - Status: {response.status_code}")
                    print(f"   Content-Type: {content_type}")
                    print(f"   Content-Length: {len(response.content)} bytes")
                    inflows_export_ok = True
                else:
                    print(f"❌ Failed - Invalid Excel content")
                    inflows_export_ok = False
            else:
                print(f"❌ Failed - Status: {response.status_code}")
                inflows_export_ok = False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            inflows_export_ok = False
        
        # Test export outflows - special handling for binary response
        url = f"{self.api_url}/export/excel?type=outflows"
        
        print(f"\n🔍 Testing Export Outflows to Excel (admin)...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            self.tests_run += 1
            
            if response.status_code == 200:
                # Check if it's an Excel file by content type or content
                content_type = response.headers.get('content-type', '')
                if 'spreadsheet' in content_type or 'excel' in content_type or len(response.content) > 0:
                    self.tests_passed += 1
                    self.passed_tests.append("Export Outflows to Excel (admin)")
                    print(f"✅ Passed - Status: {response.status_code}")
                    print(f"   Content-Type: {content_type}")
                    print(f"   Content-Length: {len(response.content)} bytes")
                    outflows_export_ok = True
                else:
                    print(f"❌ Failed - Invalid Excel content")
                    outflows_export_ok = False
            else:
                print(f"❌ Failed - Status: {response.status_code}")
                outflows_export_ok = False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            outflows_export_ok = False
        
        return inflows_export_ok and outflows_export_ok

    def test_excel_export_staff_denied(self):
        """Test that staff cannot access Excel export"""
        print("\n🚫 Testing Excel Export (Staff - Should be Denied)...")
        
        # Test export inflows (staff should get 403)
        success, _ = self.run_test(
            "Export Inflows to Excel",
            "GET",
            "export/excel?type=inflows",
            403,
            session_token=self.staff_token,
            user_type="staff"
        )
        
        if not success:
            return False
        
        # Test export outflows (staff should get 403)
        success, _ = self.run_test(
            "Export Outflows to Excel",
            "GET",
            "export/excel?type=outflows",
            403,
            session_token=self.staff_token,
            user_type="staff"
        )
        
        return success

    def test_auth_verification(self):
        """Verify that both users can authenticate"""
        print("\n🔐 Testing Authentication Verification...")
        
        # Test admin auth
        success, admin_data = self.run_test(
            "Admin Authentication",
            "GET",
            "auth/me",
            200,
            session_token=self.admin_token,
            user_type="admin"
        )
        
        if not success:
            return False
        
        if admin_data.get("role") != "admin":
            print(f"❌ Admin user has wrong role: {admin_data.get('role')}")
            return False
        
        print(f"✅ Admin user verified: {admin_data.get('name')} ({admin_data.get('role')})")
        
        # Test staff auth
        success, staff_data = self.run_test(
            "Staff Authentication",
            "GET",
            "auth/me",
            200,
            session_token=self.staff_token,
            user_type="staff"
        )
        
        if not success:
            return False
        
        if staff_data.get("role") != "staff":
            print(f"❌ Staff user has wrong role: {staff_data.get('role')}")
            return False
        
        print(f"✅ Staff user verified: {staff_data.get('name')} ({staff_data.get('role')})")
        
        return True

    def run_all_tests(self):
        """Run all financial access tests"""
        print("🚀 Starting M-Dental Financial Access Tests...")
        print(f"🌐 Base URL: {self.base_url}")
        
        # Setup
        if not self.setup_test_users():
            print("❌ Failed to setup test users. Exiting.")
            return False
        
        try:
            # Verify authentication first
            auth_ok = self.test_auth_verification()
            if not auth_ok:
                print("❌ Authentication verification failed. Cannot continue.")
                return False
            
            # Test admin access (should work)
            admin_inflow_ok = self.test_admin_inflow_access()
            admin_outflow_ok = self.test_admin_outflow_access()
            admin_export_ok = self.test_excel_export_admin()
            admin_delete_ok = self.test_admin_delete_access()
            
            # Test staff access (should be denied)
            staff_inflow_denied = self.test_staff_inflow_access_denied()
            staff_outflow_denied = self.test_staff_outflow_access_denied()
            staff_export_denied = self.test_excel_export_staff_denied()
            
            # Print results
            print(f"\n📊 Test Results:")
            print(f"✅ Tests passed: {self.tests_passed}/{self.tests_run}")
            print(f"❌ Tests failed: {len(self.failed_tests)}")
            
            if self.failed_tests:
                print(f"\n❌ Failed Tests:")
                for test in self.failed_tests:
                    print(f"   - {test['test']}: Expected {test['expected']}, got {test['actual']}")
                    if test['error']:
                        print(f"     Error: {test['error']}")
            
            if self.passed_tests:
                print(f"\n✅ Passed Tests:")
                for test in self.passed_tests:
                    print(f"   - {test}")
            
            success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
            print(f"\n📈 Success Rate: {success_rate:.1f}%")
            
            # Summary of key findings
            print(f"\n🔍 Key Findings:")
            print(f"   Admin Inflow Access: {'✅ Working' if admin_inflow_ok else '❌ Failed'}")
            print(f"   Admin Outflow Access: {'✅ Working' if admin_outflow_ok else '❌ Failed'}")
            print(f"   Admin Excel Export: {'✅ Working' if admin_export_ok else '❌ Failed'}")
            print(f"   Admin Delete Access: {'✅ Working' if admin_delete_ok else '❌ Failed'}")
            print(f"   Staff Inflow Denied: {'✅ Properly Blocked' if staff_inflow_denied else '❌ Security Issue'}")
            print(f"   Staff Outflow Denied: {'✅ Properly Blocked' if staff_outflow_denied else '❌ Security Issue'}")
            print(f"   Staff Export Denied: {'✅ Properly Blocked' if staff_export_denied else '❌ Security Issue'}")
            
            return success_rate >= 90
            
        finally:
            # Cleanup
            self.cleanup_test_data()

def main():
    tester = FinancialAccessTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())