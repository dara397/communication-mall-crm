'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* Recognisable line icons — one per destination. */
const ICONS = {
  dashboard: (
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  leads: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  pipeline: <path d="M3 5h18l-7 8v6l-4-2v-4z" />,
  schedule: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  board: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1" />
      <rect x="10" y="4" width="5" height="10" rx="1" />
      <rect x="17" y="4" width="4" height="14" rx="1" />
    </>
  ),
  quotes: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  orders: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" />
    </>
  ),
  pos: (
    <>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.5 13h11l2-9H6" />
    </>
  ),
  invoices: (
    <>
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  customers: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
      <path d="M17 7a3 3 0 0 1 0 6M21 20c0-2.5-1.3-4.1-3.5-4.7" />
    </>
  ),
  catalog: (
    <>
      <path d="M3 12V4h8l10 10-8 8L3 12z" />
      <circle cx="7.5" cy="7.5" r="1.4" />
    </>
  ),
  installed: (
    <>
      <path d="M12 2 3 7v10l9 5 9-5V7z" />
      <path d="M3 7l9 5 9-5M12 12v10" />
    </>
  ),
  integrations: (
    <>
      <path d="M14 7l3-3a3.5 3.5 0 0 1 5 5l-3 3" />
      <path d="M10 17l-3 3a3.5 3.5 0 0 1-5-5l3-3" />
      <path d="M8 12h8" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2l-.4-2.6H9.9l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h4.2l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" />
    </>
  ),
};

function Icon({ name }) {
  return (
    <svg
      className="nav-ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

const GROUPS = [
  {
    label: 'Sales',
    links: [
      { href: '/', name: 'Dashboard', key: null, icon: 'dashboard' },
      { href: '/leads', name: 'Leads', key: 'leads', icon: 'leads' },
      { href: '/pipeline', name: 'Pipeline', key: 'pipeline', icon: 'pipeline' },
    ],
  },
  {
    label: 'Delivery',
    links: [
      { href: '/schedule', name: 'Schedule', key: null, icon: 'schedule' },
      { href: '/board', name: 'Job board', key: null, icon: 'board' },
      { href: '/quotes', name: 'Quotes', key: 'quotes', icon: 'quotes' },
      { href: '/orders', name: 'Service orders', key: 'orders', icon: 'orders' },
      { href: '/purchase-orders', name: 'Purchase orders', key: 'pos', icon: 'pos' },
      { href: '/invoices', name: 'Invoices', key: 'invoices', icon: 'invoices' },
    ],
  },
  {
    label: 'Records',
    links: [
      { href: '/customers', name: 'Customers', key: 'customers', icon: 'customers' },
      { href: '/catalog', name: 'Products & services', key: 'catalog', icon: 'catalog' },
      { href: '/installed', name: 'Installed base', key: 'installed', icon: 'installed' },
    ],
  },
];

export default function Nav({ counts, company, user, signOutAction }) {
  const pathname = usePathname();
  const initials =
    (company?.name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CM';

  return (
    <nav className="rail">
      <Link href="/" className="brand">
        <div className="brand-badge">{initials}</div>
        <div className="brand-text">
          <div className="brand-name">{company.name}</div>
          <div className="brand-sub">{company.tagline}</div>
        </div>
      </Link>

      {GROUPS.map((group) => (
        <div className="nav-group" key={group.label}>
          <div className="nav-label">{group.label}</div>
          {group.links.map((link) => {
            const active =
              link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className="nav-link" data-active={active}>
                <Icon name={link.icon} />
                <span className="nav-text">{link.name}</span>
                {link.key ? <span className="nav-count">{counts[link.key]}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}

      {user.role === 'admin' ? (
        <div className="nav-group">
          <div className="nav-label">Admin</div>
          <Link
            href="/integrations"
            className="nav-link"
            data-active={pathname.startsWith('/integrations')}
          >
            <Icon name="integrations" />
            <span className="nav-text">Integrations</span>
          </Link>
          <Link
            href="/settings"
            className="nav-link"
            data-active={pathname.startsWith('/settings')}
          >
            <Icon name="settings" />
            <span className="nav-text">Settings</span>
          </Link>
        </div>
      ) : null}

      <div className="rail-foot">
        <div className="rail-user">
          <div className="rail-user-who">
            <div className="rail-user-name">{user.name}</div>
            <div className="rail-user-role">{user.role}</div>
          </div>
          <form action={signOutAction}>
            <button className="btn btn--sm rail-signout" type="submit">Sign out</button>
          </form>
        </div>
      </div>
    </nav>
  );
}
