export const money = (n) =>
  (n ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const qty = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

export const day = (iso) =>
  iso
    ? new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

export const today = () => new Date().toISOString().slice(0, 10);

export const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
