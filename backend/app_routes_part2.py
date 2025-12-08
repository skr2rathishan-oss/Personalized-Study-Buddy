
@app.route('/admin/courses/<int:course_id>/full_structure', methods=['GET'])
@jwt_required()
def get_course_structure(course_id):
    if not check_role(['admin', 'management']): return jsonify({'error': 'Unauthorized'}), 403
    topics = Topic.query.filter_by(course_id=course_id).all()
    result = []
    for t in topics:
        res_list = Resource.query.filter_by(topic_id=t.id).all()
        result.append({
            'id': t.id,
            'name': t.name,
            'resources': [r.to_dict() for r in res_list]
        })
    return jsonify(result)

@app.route('/admin/resources', methods=['POST'])
@jwt_required()
def add_admin_resource():
    if not check_role(['admin', 'management']): return jsonify({'error': 'Unauthorized'}), 403
    data = request.json
    topic_id = data.get('topic_id')
    if not topic_id: return jsonify({'error': 'topic_id required'}), 400
    
    new_res = Resource(
        title=data.get('title'),
        url=data.get('url'),
        format=data.get('format'), # video, article, pdf
        topic_id=topic_id,
        source='manual',
        is_auto_fetched=False
    )
    db.session.add(new_res)
    db.session.commit()
    return jsonify(new_res.to_dict())

@app.route('/admin/resources/<int:resource_id>', methods=['DELETE'])
@jwt_required()
def delete_admin_resource(resource_id):
    if not check_role(['admin', 'management']): return jsonify({'error': 'Unauthorized'}), 403
    res = Resource.query.get(resource_id)
    if not res: return jsonify({'error': 'Resource not found'}), 404
    db.session.delete(res)
    db.session.commit()
    return jsonify({'message': 'Resource deleted'})
