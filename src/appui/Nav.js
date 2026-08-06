'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const GROUPS = [
  {
    label: 'Sales',
    links: [
      { href: '/', name: 'Dashboard', key: null },
      { href: '/leads', name: 'Leads', key: 'leads' },
      { href: '/pipeline', name: 'Pipeline', key: 'pipeline' },
    ],
  },
  {
    label: 'Delivery',
    links: [
      { href: '/schedule', name: 'Schedule', key: null },
      { href: '/board', name: 'Job board', key: null },
      { href: '/quotes', name: 'Quotes', key: 'quotes' },
      { href: '/orders', name: 'Service orders', key: 'orders' },
      { href: '/purchase-orders', name: 'Purchase orders', key: 'pos' },
      { href: '/invoices', name: 'Invoices', key: 'invoices' },
    ],
  },
  {
    label: 'Records',
    links: [
      { href: '/customers', name: 'Customers', key: 'customers' },
      { href: '/catalog', name: 'Products & services', key: 'catalog' },
      { href: '/installed', name: 'Installed base', key: 'installed' },
    ],
  },
];

export default function Nav({ counts, company, user, signOutAction }) {
  const pathname = usePathname();

  return (
    <nav className="rail">
      <Link href="/" className="brand">
        <div className="brand-mark">CRM</div>
        <div className="brand-name">{company.name}</div>
        <div className="brand-sub">{company.tagline}</div>
      </Link>

      {GROUPS.map((group) => (
        <div className="nav-group" key={group.label}>
          <div className="nav-label">{group.label}</div>
          {group.links.map((link) => {
            const active =
              link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className="nav-link" data-active={active}>
                <span>{link.name}</span>
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
            href="/settings"
            className="nav-link"
            data-active={pathname.startsWith('/settings')}
          >
            <span>Settings</span>
          </Link>
        </div>
      ) : null}

      <div className="rail-foot">
        <div className="rail-user">
          <div>
            <div className="rail-user-name">{user.name}</div>
            <div className="rail-user-role">{user.role}</div>
          </div>
          <form action={signOutAction}>
            <button className="btn btn--sm" type="submit">Sign out</button>
          </form>
        </div>
      </div>
    </nav>
  );
}
