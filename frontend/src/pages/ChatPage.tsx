import { useLocation, useNavigate } from 'react-router-dom';
import ChatWidget from '../components/Agent/ChatWidget';

function ChatPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Retrieve context passed via state, or fallback to defaults
    const context = location.state?.context || {
        courseId: null,
        topicId: null,
        courseName: 'General',
        topicName: ''
    };

    return (
        <div className="chat-page animate-fade-in" style={{ height: '100vh', width: '100vw', background: 'var(--bg-color)', overflow: 'hidden' }}>
            <ChatWidget
                isOpen={true}
                onClose={() => navigate(-1)}
                context={context}
                mode="page"
            />
        </div>
    );
}

export default ChatPage;
