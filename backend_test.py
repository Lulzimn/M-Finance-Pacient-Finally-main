#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime
import subprocess
import time

class MDentalAPITester:
    def __init__(self, base_url="https://acceptable-exploration-production.up.railway.app"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def setup_test_user(self):
        """Create test user and session in MongoDB"""
        print("🔧 Setting up test user and session...")
        
        timestamp = int(time.time())
        user_id = f"test-user-{timestamp}"
        session_token = f"test_session_{timestamp}"
        
        mongo_script = f"""
use('test_database');
var userId = '{user_id}';
var sessionToken = '{session_token}';
db.users.insertOne({{
  user_id: userId,
  email: 'test.user.{timestamp}@example.com',
  name: 'Test Admin User',
  picture: 'https://via.placeholder.com/150',
  role: 'admin',
  created_at: new Date()
}});
db.user_sessions.insertOne({{
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"""
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                self.session_token = session_token
                self.user_id = user_id
                print(f"✅ Test user created: {user_id}")
                print(f"✅ Session token: {session_token}")
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
        
        cleanup_script = """
use('test_database');
db.users.deleteMany({email: /test\.user\./});
db.user_sessions.deleteMany({session_token: /test_session/});
db.patients.deleteMany({created_by: /test-user/});
db.invoices.deleteMany({created_by: /test-user/});
db.inflows.deleteMany({created_by: /test-user/});
db.outflows.deleteMany({created_by: /test-user/});
"""
        
        try:
            subprocess.run(['mongosh', '--eval', cleanup_script], 
                          capture_output=True, text=True, timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️ Cleanup warning: {e}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
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
                self.passed_tests.append(name)
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
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "error": response.text[:200]
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Error: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.failed_tests.append({
                "test": name,
                "expected": expected_status,
                "actual": "Exception",
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test /auth/me
        success, user_data = self.run_test(
            "Get Current User (/auth/me)",
            "GET",
            "auth/me",
            200
        )
        
        if success and user_data:
            print(f"   User role: {user_data.get('role')}")
            print(f"   User name: {user_data.get('name')}")
        
        return success

    def test_patients_crud(self):
        """Test patients CRUD operations"""
        print("\n👥 Testing Patients CRUD...")
        
        # Get patients
        success, patients = self.run_test(
            "Get Patients",
            "GET", 
            "patients",
            200
        )
        
        if not success:
            return False
        
        # Create patient
        patient_data = {
            "emri": "Test",
            "mbiemri": "Patient",
            "telefon": "+38970123456",
            "email": "test.patient@example.com",
            "adresa": "Test Address",
            "shenimet": "Test notes"
        }
        
        success, created_patient = self.run_test(
            "Create Patient",
            "POST",
            "patients",
            200,
            data=patient_data
        )
        
        if not success:
            return False
        
        patient_id = created_patient.get("patient_id")
        if not patient_id:
            print("❌ No patient_id in response")
            return False
        
        # Update patient
        updated_data = {
            "emri": "Updated",
            "mbiemri": "Patient",
            "telefon": "+38970123456",
            "email": "updated.patient@example.com",
            "adresa": "Updated Address",
            "shenimet": "Updated notes"
        }
        
        success, _ = self.run_test(
            "Update Patient",
            "PUT",
            f"patients/{patient_id}",
            200,
            data=updated_data
        )
        
        if not success:
            return False
        
        # Get single patient
        success, _ = self.run_test(
            "Get Single Patient",
            "GET",
            f"patients/{patient_id}",
            200
        )
        
        return success

    def test_invoices_crud(self):
        """Test invoices CRUD operations"""
        print("\n📄 Testing Invoices CRUD...")
        
        # First create a patient for the invoice
        patient_data = {
            "emri": "Invoice",
            "mbiemri": "Patient",
            "telefon": "+38970123456"
        }
        
        success, patient = self.run_test(
            "Create Patient for Invoice",
            "POST",
            "patients",
            200,
            data=patient_data
        )
        
        if not success:
            return False
        
        patient_id = patient.get("patient_id")
        
        # Get invoices
        success, _ = self.run_test(
            "Get Invoices",
            "GET",
            "invoices",
            200
        )
        
        if not success:
            return False
        
        # Create invoice
        invoice_data = {
            "patient_id": patient_id,
            "shuma": 5000.0,
            "valuta": "MKD",
            "pershkrimi": "Test dental service",
            "statusi": "pending"
        }
        
        success, created_invoice = self.run_test(
            "Create Invoice",
            "POST",
            "invoices",
            200,
            data=invoice_data
        )
        
        if not success:
            return False
        
        invoice_id = created_invoice.get("invoice_id")
        
        # Update invoice
        updated_invoice = {
            "patient_id": patient_id,
            "shuma": 6000.0,
            "valuta": "MKD",
            "pershkrimi": "Updated dental service",
            "statusi": "paid"
        }
        
        success, _ = self.run_test(
            "Update Invoice",
            "PUT",
            f"invoices/{invoice_id}",
            200,
            data=updated_invoice
        )
        
        return success

    def test_cash_flows(self):
        """Test cash inflows and outflows (admin only)"""
        print("\n💰 Testing Cash Flows (Admin Only)...")
        
        # Test inflows
        success, _ = self.run_test(
            "Get Inflows",
            "GET",
            "inflows",
            200
        )
        
        if not success:
            return False
        
        # Create inflow
        inflow_data = {
            "kategoria": "pagesa_pacient",
            "pershkrimi": "Test patient payment",
            "shuma": 3000.0,
            "valuta": "MKD",
            "metoda_pageses": "cash"
        }
        
        success, created_inflow = self.run_test(
            "Create Inflow",
            "POST",
            "inflows",
            200,
            data=inflow_data
        )
        
        if not success:
            return False
        
        # Test outflows
        success, _ = self.run_test(
            "Get Outflows",
            "GET",
            "outflows",
            200
        )
        
        if not success:
            return False
        
        # Create outflow
        outflow_data = {
            "kategoria": "furnizime",
            "pershkrimi": "Test supplies purchase",
            "shuma": 1500.0,
            "valuta": "MKD"
        }
        
        success, _ = self.run_test(
            "Create Outflow",
            "POST",
            "outflows",
            200,
            data=outflow_data
        )
        
        return success

    def test_dashboard_and_reports(self):
        """Test dashboard and reports endpoints"""
        print("\n📊 Testing Dashboard & Reports...")
        
        # Dashboard stats
        success, stats = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        
        if not success:
            return False
        
        # Monthly report
        success, _ = self.run_test(
            "Get Monthly Report",
            "GET",
            "reports/monthly",
            200
        )
        
        if not success:
            return False
        
        # Activity logs
        success, _ = self.run_test(
            "Get Activity Logs",
            "GET",
            "activity-logs",
            200
        )
        
        return success

    def test_exchange_rate(self):
        """Test exchange rate endpoints"""
        print("\n💱 Testing Exchange Rate...")
        
        # Get exchange rate
        success, rate = self.run_test(
            "Get Exchange Rate",
            "GET",
            "exchange-rate",
            200
        )
        
        if not success:
            return False
        
        # Update exchange rate
        new_rate = {
            "eur_to_mkd": 62.0
        }
        
        success, _ = self.run_test(
            "Update Exchange Rate",
            "PUT",
            "exchange-rate",
            200,
            data=new_rate
        )
        
        return success

    def test_appointments_crud(self):
        """Test appointments CRUD operations"""
        print("\n📅 Testing Appointments CRUD...")
        
        # First create a patient for the appointment
        patient_data = {
            "emri": "Appointment",
            "mbiemri": "Patient",
            "telefon": "+38970123456",
            "email": "appointment.patient@example.com"
        }
        
        success, patient = self.run_test(
            "Create Patient for Appointment",
            "POST",
            "patients",
            200,
            data=patient_data
        )
        
        if not success:
            return False
        
        patient_id = patient.get("patient_id")
        
        # Get appointments
        success, _ = self.run_test(
            "Get Appointments",
            "GET",
            "appointments",
            200
        )
        
        if not success:
            return False
        
        # Create appointment
        appointment_data = {
            "patient_id": patient_id,
            "data_termini": "2024-12-25",
            "ora": "10:00",
            "arsyeja": "Kontroll rutinor",
            "shenimet": "Test appointment notes",
            "send_email": False  # Don't send email in tests
        }
        
        success, created_appointment = self.run_test(
            "Create Appointment",
            "POST",
            "appointments",
            200,
            data=appointment_data
        )
        
        if not success:
            return False
        
        appointment_id = created_appointment.get("appointment_id")
        if not appointment_id:
            print("❌ No appointment_id in response")
            return False
        
        # Update appointment
        updated_appointment = {
            "patient_id": patient_id,
            "data_termini": "2024-12-26",
            "ora": "11:00",
            "arsyeja": "Kontroll i përditësuar",
            "shenimet": "Updated appointment notes",
            "send_email": False
        }
        
        success, _ = self.run_test(
            "Update Appointment",
            "PUT",
            f"appointments/{appointment_id}",
            200,
            data=updated_appointment
        )
        
        if not success:
            return False
        
        # Update appointment status
        success, _ = self.run_test(
            "Update Appointment Status",
            "PUT",
            f"appointments/{appointment_id}/status?statusi=completed",
            200
        )
        
        return success

    def test_invoice_print(self):
        """Test invoice print functionality"""
        print("\n🖨️ Testing Invoice Print...")
        
        # First create a patient and invoice
        patient_data = {
            "emri": "Print",
            "mbiemri": "Patient",
            "telefon": "+38970123456"
        }
        
        success, patient = self.run_test(
            "Create Patient for Print Invoice",
            "POST",
            "patients",
            200,
            data=patient_data
        )
        
        if not success:
            return False
        
        patient_id = patient.get("patient_id")
        
        # Create invoice
        invoice_data = {
            "patient_id": patient_id,
            "shuma": 7500.0,
            "valuta": "MKD",
            "pershkrimi": "Test print invoice",
            "statusi": "pending"
        }
        
        success, created_invoice = self.run_test(
            "Create Invoice for Print",
            "POST",
            "invoices",
            200,
            data=invoice_data
        )
        
        if not success:
            return False
        
        invoice_id = created_invoice.get("invoice_id")
        
        # Test print data endpoint
        success, print_data = self.run_test(
            "Get Invoice Print Data",
            "GET",
            f"invoices/{invoice_id}/print",
            200
        )
        
        if success and print_data:
            # Verify print data structure
            required_keys = ["invoice", "patient", "exchange_rate", "clinic"]
            missing_keys = [key for key in required_keys if key not in print_data]
            if missing_keys:
                print(f"❌ Missing keys in print data: {missing_keys}")
                return False
            print(f"✅ Print data contains all required keys: {required_keys}")
        
        return success

    def test_export(self):
        """Test export functionality"""
        print("\n📤 Testing Export...")
        
        # Test Excel export
        success, _ = self.run_test(
            "Export Patients to Excel",
            "GET",
            "export/excel?type=patients",
            200
        )
        
        return success

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting M-Dental API Tests...")
        print(f"🌐 Base URL: {self.base_url}")
        
        # Setup
        if not self.setup_test_user():
            print("❌ Failed to setup test user. Exiting.")
            return False
        
        try:
            # Run tests
            auth_ok = self.test_auth_endpoints()
            if not auth_ok:
                print("❌ Authentication failed. Cannot continue with other tests.")
                return False
            
            patients_ok = self.test_patients_crud()
            invoices_ok = self.test_invoices_crud()
            appointments_ok = self.test_appointments_crud()
            invoice_print_ok = self.test_invoice_print()
            cash_flows_ok = self.test_cash_flows()
            dashboard_ok = self.test_dashboard_and_reports()
            exchange_ok = self.test_exchange_rate()
            export_ok = self.test_export()
            
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
            
            return success_rate >= 80
            
        finally:
            # Cleanup
            self.cleanup_test_data()

def main():
    tester = MDentalAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())