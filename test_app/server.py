from flask import Flask, request, render_template_string, jsonify
import sqlite3
import os

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Pointing to the SAME database file the main app is using
DB_PATH = os.path.join(BASE_DIR, '..', 'backend', 'data', 'db.sqlite3')

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>DB Test App</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
        .card { border: 1px solid #ccc; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; }
        input { display: block; margin-bottom: 10px; width: 100%; padding: 8px; }
        button { padding: 10px 20px; cursor: pointer; background: #007bff; color: white; border: none; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
    </style>
</head>
<body>
    <h1>Database Connection Test</h1>
    <p>Database Path: <code>{{ db_path }}</code></p>
    
    <div class="card">
        <h2>Register User (Direct Mode)</h2>
        <form action="/register" method="POST">
            <input type="text" name="username" placeholder="Username (Email)" required>
            <input type="password" name="password" placeholder="Password" required>
            <input type="text" name="first_name" placeholder="First Name" required>
            <button type="submit">save to DB</button>
        </form>
    </div>

    <div class="card">
        <h2>Current Users in DB</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>First Name</th>
                    <th>Role</th>
                </tr>
            </thead>
            <tbody>
                {% for user in users %}
                <tr>
                    <td>{{ user[0] }}</td>
                    <td>{{ user[1] }}</td>
                    <td>{{ user[3] }}</td>
                    <td>{{ user[4] }}</td>
                </tr>
                {% else %}
                <tr><td colspan="4">No users found.</td></tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
</body>
</html>
"""

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    if not os.path.exists(DB_PATH):
        return f"<h1>Error: DB File not found at {DB_PATH}</h1>"
    
    conn = get_db_connection()
    try:
        users = conn.execute('SELECT * FROM user').fetchall()
        conn.close()
        return render_template_string(HTML_TEMPLATE, users=users, db_path=DB_PATH)
    except Exception as e:
        return f"<h1>Database Error: {e}</h1><p>Has the table been created?</p>"

@app.route('/register', methods=['POST'])
def register():
    username = request.form['username']
    password = "hashed_password_placeholder" # Simple for test
    first_name = request.form['first_name']
    
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO user (username, password_hash, role, first_name) VALUES (?, ?, ?, ?)',
                     (username, password, 'student', first_name))
        conn.commit()
    except Exception as e:
        return f"Error saving: {e}"
    finally:
        conn.close()
    
    return "<p>User Saved! <a href='/'>Go Back</a></p>"

if __name__ == '__main__':
    print(f"Test App verifying DB at: {DB_PATH}")
    app.run(port=5001, debug=True)
