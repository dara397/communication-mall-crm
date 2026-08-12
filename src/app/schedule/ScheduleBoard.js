'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { money, day } from '@/applib/format';

const WEEKDAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ScheduleBoard({
  days,
  jobs,
  prevWeek,
  nextWeek,
  thisWeek,
  rescheduleAction,
}) {
  const formRef = useRef(null);
  const idRef = useRef(null);
  const dateRef = useRef(null);
  const [dragId, setDragId] = useState(null);
  const [overDay, setOverDay] = useState(null);

  const label = (iso) => {
    const d = new Date(iso + 'T12:00:00');
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  function drop(targetDate) {
    setOverDay(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const job = jobs.find((j) => j.id === id);
    if (!job || job.date === targetDate) return; // no move
    // submit the hidden server-action form
    idRef.current.value = id;
    dateRef.current.value = targetDate;
    formRef.current.requestSubmit();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Pipeline</div>
          <h1>Schedule</h1>
          <p className="sub">Drag a job to another day to reschedule it.</p>
        </div>
        <div className="row no-print" style={{ gap: 8 }}>
          <Link href={`/schedule?week=${prevWeek}`} className="btn btn--sm">← Prev</Link>
          <Link href={`/schedule?week=${thisWeek}`} className="btn btn--sm">This week</Link>
          <Link href={`/schedule?week=${nextWeek}`} className="btn btn--sm">Next →</Link>
        </div>
      </div>

      {/* hidden form that carries the reschedule to the server */}
      <form ref={formRef} action={rescheduleAction} style={{ display: 'none' }}>
        <input ref={idRef} name="id" />
        <input ref={dateRef} name="scheduledDate" />
      </form>

      <div className="calendar">
        {days.map((d, i) => {
          const dayJobs = jobs.filter((j) => j.date === d);
          const isToday = d === thisWeek;
          return (
            <div
              key={d}
              className="cal-day"
              data-over={overDay === d}
              data-today={isToday}
              onDragOver={(e) => {
                e.preventDefault();
                setOverDay(d);
              }}
              onDragLeave={() => setOverDay((cur) => (cur === d ? null : cur))}
              onDrop={() => drop(d)}
            >
              <div className="cal-day-head">
                <span className="cal-dow">{WEEKDAY[i]}</span>
                <span className="cal-date" data-today={isToday}>{label(d)}</span>
              </div>
              <div className="cal-day-body">
                {dayJobs.length === 0 ? (
                  <div className="cal-empty">—</div>
                ) : (
                  dayJobs.map((j) => (
                    <div
                      key={j.id}
                      className="cal-job"
                      draggable
                      data-dragging={dragId === j.id}
                      data-status={j.status}
                      onDragStart={() => setDragId(j.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverDay(null);
                      }}
                    >
                      <Link href={`/orders/${j.id}`} className="cal-job-link">
                        <div className="cal-job-no">{j.number}</div>
                        <div className="cal-job-title">{j.title}</div>
                        <div className="cal-job-meta">{j.customer}</div>
                        <div className="cal-job-foot">
                          <span>{j.technician || 'Unassigned'}</span>
                          <span className="strong">{money(j.total)}</span>
                        </div>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="note" style={{ marginTop: 16 }}>
        Tip: dragging works on a computer. On a phone, open a job and change its date there.
      </p>
    </>
  );
}
