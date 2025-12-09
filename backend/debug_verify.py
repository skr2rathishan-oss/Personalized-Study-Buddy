
import os
import sys
from datetime import datetime

# Setup Flask Context
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app import app, db, User, Course, Degree, export_data 

def verify_and_debug():
    print("=== Debug: Verified Admin Functionality ===")
    
    with app.app_context():
        # 1. Mock Admin User
        admin_user = User.query.filter_by(role='admin').first()
        if not admin_user:
            print("ERROR: No admin user found. Creating one for testing...")
            # Create dummy admin
            admin_user = User(username='debug_admin', role='admin', password_hash='dummy')
            db.session.add(admin_user)
            db.session.commit()
            print(f"Created debug_admin with ID: {admin_user.id}")
        else:
            print(f"Using Admin: {admin_user.username} (ID: {admin_user.id})")

        # 2. Check Degree Linkage (Crucial for Course Creation)
        degree = Degree.query.filter_by(admin_id=admin_user.id).first()
        if not degree:
            print("WARNING: Admin has no Degree assigned. Course creation will trigger auto-creation.")
        else:
            print(f"Admin manages Degree: {degree.name} (ID: {degree.id})")

        # 3. Test Course Creation Logic (Simulated)
        print("\n--- Testing Course Creation ---")
        new_course_code = f"DBG-{int(datetime.now().timestamp())}"
        try:
            # Replicating logic from @app.route('/admin/courses')
            if Course.query.filter_by(module_id=new_course_code).first():
                print("Error: Course exists (Unlikely in test)")
            else:
                if not degree:
                    degree = Degree(name="Debug Degree", university="Debug Uni", admin_id=admin_user.id)
                    db.session.add(degree)
                    db.session.commit()
                    print(f"Auto-created Degree: {degree.name}")

                new_course = Course(module_name="Debug Module", module_id=new_course_code, degree_id=degree.id)
                db.session.add(new_course)
                db.session.commit()
                print(f"SUCCESS: Course '{new_course.module_name}' ({new_course.module_id}) created.")
        except Exception as e:
            print(f"FAILED: Course creation error: {e}")
            import traceback
            traceback.print_exc()

        # 4. Test Excel Export Logic
        print("\n--- Testing Excel Export ---")
        try:
            import pandas as pd
            import openpyxl
            print("Libraries 'pandas' and 'openpyxl' imported successfully.")
            
            # Simulate export logic
            users = User.query.all()
            courses = Course.query.all()
            
            data = {
                'Modules': [{'ID': c.id, 'Module Name': c.module_name} for c in courses],
                'Users': [{'ID': u.id, 'Username': u.username} for u in users]
            }
            
            filename = "debug_export.xlsx"
            with pd.ExcelWriter(filename, engine='openpyxl') as writer:
                 for sheet, rows in data.items():
                    pd.DataFrame(rows).to_excel(writer, sheet_name=sheet, index=False)
            
            print(f"SUCCESS: Excel file '{filename}' created.")
            os.remove(filename) # Clean up
            print("Cleaned up debug file.")
            
        except ImportError as e:
            print(f"FAILED: Missing Dependency: {e}")
        except Exception as e:
            print(f"FAILED: Export error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    verify_and_debug()
