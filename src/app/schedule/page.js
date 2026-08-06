import { getScheduledOrders, totals } from '@/applib/db';
import { rescheduleOrder } from '@/applib/actions';
import ScheduleBoard from './ScheduleBoard';

export const dynamic = 'force-dynamic';

// Monday-start week containing `base`, as 7 YYYY-MM-DD strings.
function weekDays(base) {
  const d = new Date(base + 'T12:00:00');
  const dow = (d.getDay() + 6) % 7; // Mon = 0
  d.setDate(d.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

export default async function SchedulePage({ searchParams }) {
  const base = searchParams?.week || new Date().toISOString().slice(0, 10);
  const days = weekDays(base);
  const orders = await getScheduledOrders();

  // only jobs that land in this week, and not yet invoiced
  const active = orders.filter((o) => o.status !== 'Invoiced');
  const jobs = active.map((o) => ({
    id: o.id,
    number: o.number,
    title: o.title,
    customer: o.customer?.name || '',
    date: o.scheduledDate,
    technician: o.technician,
    status: o.status,
    total: totals(o).total,
  }));

  const prevWeek = (() => {
    const d = new Date(days[0] + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  })();
  const nextWeek = (() => {
    const d = new Date(days[0] + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <ScheduleBoard
      days={days}
      jobs={jobs}
      prevWeek={prevWeek}
      nextWeek={nextWeek}
      thisWeek={new Date().toISOString().slice(0, 10)}
      rescheduleAction={rescheduleOrder}
    />
  );
}
