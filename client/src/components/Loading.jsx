export default function Loading({ label = 'Loading…' }) {
  return (
    <div className="state-box" role="status" aria-live="polite">
      <div className="spinner" />
      <p style={{ marginTop: 14 }}>{label}</p>
    </div>
  );
}
