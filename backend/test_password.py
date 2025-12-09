from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

# Test password hash
stored_hash = "$2b$12$L0TeuR//QAN7AX5IbMEO7uPEqJ3DKIcQhzws9ymWRD8T9N3P2Q47S"
test_password = "password"

# Check if password matches
result = bcrypt.check_password_hash(stored_hash, test_password)
print(f"Password check result: {result}")

# Try with some other passwords
other_passwords = ["Password", "PASSWORD", "password123", "12345678"]
for pwd in other_passwords:
    result = bcrypt.check_password_hash(stored_hash, pwd)
    print(f"'{pwd}': {result}")
