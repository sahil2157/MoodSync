import { FiInbox } from 'react-icons/fi';

export default function EmptyState({ icon = <FiInbox />, title, description, action }) {
  return (
    <div className="state-box">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p style={{ margin: '0 auto' }}>{description}</p>}
      {action && <div className="mt-24">{action}</div>}
    </div>
  );
}
