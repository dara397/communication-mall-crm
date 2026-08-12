'use client';

import { useRouter } from 'next/navigation';

/**
 * A table row you can click anywhere to open its detail page. Clicks on the
 * things inside a row that do their own thing — links, buttons, form controls —
 * are left alone, so the row's own Quote/Remove/Edit actions still work.
 * Keyboard users can focus the row and press Enter.
 */
const INTERACTIVE = 'a,button,input,select,textarea,label,summary,details,[data-no-nav]';

export default function ClickableRow({ href, children, className = '', title }) {
  const router = useRouter();

  function navigate(e) {
    if (e.target.closest(INTERACTIVE)) return; // let inner controls handle it
    if (typeof window !== 'undefined' && window.getSelection && String(window.getSelection())) {
      return; // don't hijack a text selection
    }
    router.push(href);
  }

  function onKeyDown(e) {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      router.push(href);
    }
  }

  return (
    <tr
      className={`clickrow ${className}`.trim()}
      onClick={navigate}
      onKeyDown={onKeyDown}
      onMouseEnter={() => router.prefetch(href)}
      tabIndex={0}
      role="link"
      aria-label={title || 'Open row'}
    >
      {children}
    </tr>
  );
}
