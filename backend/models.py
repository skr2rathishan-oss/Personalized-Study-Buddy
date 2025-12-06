from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False) # Used as Email or unique handle
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False) # student, admin, management
    
    # Registration Details
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    nic = db.Column(db.String(20), nullable=True)
    university = db.Column(db.String(100), nullable=True)
    university_course = db.Column(db.String(100), nullable=True)
    university_id = db.Column(db.String(50), nullable=True)
    phone_number = db.Column(db.String(20), nullable=True)
    
    enrollments = db.relationship('Enrollment', backref='user', lazy=True)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    topics = db.relationship('Topic', backref='course', lazy=True)

class Topic(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    resources = db.relationship('Resource', backref='topic', lazy=True)

class Resource(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    format = db.Column(db.String(50), nullable=False) # video, article, pdf
    topic_id = db.Column(db.Integer, db.ForeignKey('topic.id'), nullable=False)
    ratings = db.relationship('Rating', backref='resource', lazy=True)

    def to_dict(self):
        avg_rating = 0
        if self.ratings:
            avg_rating = sum([r.score for r in self.ratings]) / len(self.ratings)
        return {
            'id': self.id,
            'title': self.title,
            'url': self.url,
            'format': self.format,
            'average_rating': round(avg_rating, 1),
            'rating_count': len(self.ratings)
        }

class Enrollment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)

class Rating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    resource_id = db.Column(db.Integer, db.ForeignKey('resource.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    time_spent = db.Column(db.Integer, nullable=True) # in seconds
