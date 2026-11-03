import { Link } from 'react-router-dom';
import { FiCompass } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="page">
      <div className="state-box">
        <div className="icon"><FiCompass /></div>
        <h2>Page not found</h2>
        <p style={{ margin: '0 auto' }}>The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary mt-24">Back home</Link>
      </div>
    </div>
  );
}
