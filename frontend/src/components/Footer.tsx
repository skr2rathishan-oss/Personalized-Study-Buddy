

const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="footer-container">
                <div className="footer-grid">
                    {/* Brand Section */}
                    <div className="footer-section brand-section">
                        <h3 className="footer-logo">Study Buddy</h3>
                        <p className="footer-description">
                            Your personalized AI companion for academic excellence.
                            Tailored resources to help you succeed.
                        </p>
                    </div>

                    {/* Management Details - Proactively added as requested */}
                    <div className="footer-section">
                        <h4 className="footer-heading">Management Details</h4>
                        <ul className="footer-contact-list">
                            <li>
                                <span className="contact-label">Management Head:</span>
                                <span className="contact-value">[Name Placeholder]</span>
                            </li>
                            <li>
                                <span className="contact-label">Email:</span>
                                <span className="contact-value">management@studybuddy.com</span>
                            </li>
                            <li>
                                <span className="contact-label">Contact:</span>
                                <span className="contact-value">+1 (555) 000-0000</span>
                            </li>
                            <li>
                                <span className="contact-label">Address:</span>
                                <span className="contact-value">Tech Park, Education City</span>
                            </li>
                        </ul>
                    </div>

                    {/* Quick Access */}
                    <div className="footer-section">
                        <h4 className="footer-heading">Quick Links</h4>
                        <ul className="footer-links">
                            <li><a href="/">Home</a></li>
                            <li><a href="/admin">Admin Dashboard</a></li>
                            <li><a href="#">Terms of Service</a></li>
                            <li><a href="#">Privacy Policy</a></li>
                        </ul>
                    </div>

                    {/* Social/News */}
                    <div className="footer-section">
                        <h4 className="footer-heading">Connect</h4>
                        <div className="social-links">
                            <a href="#" className="social-icon">Li</a>
                            <a href="#" className="social-icon">Tw</a>
                            <a href="#" className="social-icon">Fb</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Personalized Study Buddy. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
