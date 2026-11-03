import { FiAlertCircle } from 'react-icons/fi';

export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="state-box">
      <div className="icon"><FiAlertCircle /></div>
      <h3>Couldn't load this</h3>
      <p style={{ margin: '0 auto' }}>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary mt-24" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
