const API_BASE_URL = 'http://localhost:5000';

const courseSelect = document.getElementById('course-select');
const topicSelect = document.getElementById('topic-select');
const formatSelect = document.getElementById('format-select');
const getRecsBtn = document.getElementById('get-recs-btn');
const resultsSection = document.getElementById('results-section');
const resultsContainer = document.getElementById('results-container');

// Load Courses on Start
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/courses`);
        const courses = await res.json();
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.code} - ${course.name}`;
            courseSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Failed to load courses:', err);
    }
});

// Load Topics when Course changes
courseSelect.addEventListener('change', async () => {
    const courseId = courseSelect.value;
    topicSelect.innerHTML = '<option value="">-- Choose Topic --</option>';
    topicSelect.disabled = true;
    getRecsBtn.disabled = true;

    if (courseId) {
        try {
            const res = await fetch(`${API_BASE_URL}/courses/${courseId}/topics`);
            const topics = await res.json();
            topics.forEach(topic => {
                const option = document.createElement('option');
                option.value = topic.id;
                option.textContent = topic.name;
                topicSelect.appendChild(option);
            });
            topicSelect.disabled = false;
        } catch (err) {
            console.error('Failed to load topics:', err);
        }
    }
});

// Enable button when topic selected
topicSelect.addEventListener('change', () => {
    getRecsBtn.disabled = !topicSelect.value;
});

// Fetch Recommendations
getRecsBtn.addEventListener('click', async () => {
    const courseId = courseSelect.value;
    const topicId = topicSelect.value;
    const format = formatSelect.value;

    resultsSection.classList.remove('hidden');
    resultsContainer.innerHTML = '<p>Loading recommendations...</p>';

    try {
        const res = await fetch(`${API_BASE_URL}/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_id: courseId, topic_id: topicId, format: format || null })
        });
        const resources = await res.json();
        renderResources(resources);
    } catch (err) {
        console.error('Error fetching recommendations:', err);
        resultsContainer.innerHTML = '<p>Error loading resources. Please try again.</p>';
    }
});

function renderResources(resources) {
    resultsContainer.innerHTML = '';
    if (resources.length === 0) {
        resultsContainer.innerHTML = '<p>No resources found for this selection.</p>';
        return;
    }

    resources.forEach(r => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div>
                <div class="card-header">
                    <span class="card-type">${r.format}</span>
                </div>
                <h3>${r.title}</h3>
                <div class="card-meta">
                    <span class="rating-stars">★ ${r.average_rating}</span>
                    <span>(${r.rating_count} ratings)</span>
                </div>
            </div>
            <div class="card-actions">
                <a href="${r.url}" target="_blank" class="open-btn">Open Resource</a>
                <select class="rate-select" onchange="rateResource(${r.id}, this.value)">
                    <option value="">Rate...</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                </select>
            </div>
        `;
        resultsContainer.appendChild(card);
    });
}

async function rateResource(resourceId, score) {
    if (!score) return;
    try {
        await fetch(`${API_BASE_URL}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resource_id: resourceId, score: parseInt(score) })
        });
        alert('Thanks for your rating!');
    } catch (err) {
        console.error('Error rating resource:', err);
    }
}
// Expose rateResource to global scope for the inline onchange handler
window.rateResource = rateResource;
