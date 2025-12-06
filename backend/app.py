from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, Course, Topic, Resource, Rating
from recommender import Recommender
import os

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Database Config
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'db.sqlite3')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
recommender = Recommender()

@app.route('/courses', methods=['GET'])
def get_courses():
    courses = Course.query.all()
    return jsonify([{'id': c.id, 'name': c.name, 'code': c.code} for c in courses])

@app.route('/courses/<int:course_id>/topics', methods=['GET'])
def get_topics(course_id):
    topics = Topic.query.filter_by(course_id=course_id).all()
    return jsonify([{'id': t.id, 'name': t.name} for t in topics])

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    course_id = data.get('course_id')
    topic_id = data.get('topic_id')
    fmt = data.get('format')
    
    if not course_id or not topic_id:
        return jsonify({'error': 'Course ID and Topic ID are required'}), 400
        
    recommendations = recommender.get_recommendations(course_id, topic_id, fmt)
    return jsonify(recommendations)

@app.route('/rate', methods=['POST'])
def rate_resource():
    data = request.json
    resource_id = data.get('resource_id')
    score = data.get('score')
    time_spent = data.get('time_spent', 0)
    
    if not resource_id or (not score and not time_spent):
        return jsonify({'error': 'Resource ID and either Score or Time Spent are required'}), 400
        
    if score and not (1 <= score <= 5):
        return jsonify({'error': 'Score must be between 1 and 5'}), 400

    new_rating = Rating(resource_id=resource_id, score=score if score else 0, time_spent=time_spent)
    db.session.add(new_rating)
    db.session.commit()
    
    return jsonify({'message': 'Rating submitted successfully'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
