import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card">
      <div className="empty">
        <strong>That record isn&apos;t here</strong>
        It may have been deleted.{' '}
        <Link href="/" style={{ color: 'var(--signal)' }}>
          Back to the dashboard →
        </Link>
      </div>
    </div>
  );
}
