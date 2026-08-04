import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../crmlib/prisma";
import { PageHeader, StatusBadge } from "../../../../crmui/ui";
import DocumentView from "../../../../crmui/DocumentView";
import DeleteButton from "../../../../crmui/DeleteButton";
import { dateTime, toInputDateTime } from "../../../../crmlib/format";
import {
  setOrderStatus,
  deleteOrder,
  convertOrderToInvoice,
  rescheduleOrder,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      quote: true,
      invoices: true,
    },
  });
  if (!order) notFound();

  const del = deleteOrder.bind(null, order.id);
  const convert = convertOrderToInvoice.bind(null, order.id);
  const reschedule = rescheduleOrder.bind(null, order.id);

  return (
    <>
      <PageHeader
        title={`Service order ${order.number}`}
        subtitle={order.customer.name}
        action={<StatusBadge status={order.status} />}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link href={`/orders/${order.id}/edit`} className="btn-secondary">
          Edit
        </Link>
        {order.quote && (
          <Link href={`/quotes/${order.quote.id}`} className="btn-ghost">
            From quote {order.quote.number}
          </Link>
        )}

        <div className="mx-1 h-6 w-px bg-slate-200" />

        <StatusForm action={setOrderStatus.bind(null, order.id, "SCHEDULED")} label="Scheduled" />
        <StatusForm action={setOrderStatus.bind(null, order.id, "IN_PROGRESS")} label="In progress" />
        <StatusForm action={setOrderStatus.bind(null, order.id, "ON_HOLD")} label="On hold" />
        <StatusForm action={setOrderStatus.bind(null, order.id, "COMPLETED")} label="Completed" />
        <StatusForm action={setOrderStatus.bind(null, order.id, "CANCELLED")} label="Cancel" />

        <div className="mx-1 h-6 w-px bg-slate-200" />

        {order.invoices.length > 0 ? (
          <Link href={`/invoices/${order.invoices[0].id}`} className="btn-secondary">
            View invoice
          </Link>
        ) : (
          <form action={convert}>
            <button type="submit" className="btn-primary">
              Convert to invoice →
            </button>
          </form>
        )}
      </div>

      <div className="mb-5 card flex flex-wrap items-end gap-3 p-4">
        <form action={reschedule} className="flex items-end gap-2">
          <div>
            <label className="label">Scheduled date &amp; time</label>
            <input
              type="datetime-local"
              name="scheduledAt"
              defaultValue={toInputDateTime(order.scheduledAt)}
              className="input"
            />
          </div>
          <button type="submit" className="btn-secondary">
            Update schedule
          </button>
        </form>
        <div className="ml-auto text-sm text-slate-500">
          {order.scheduledAt
            ? `Currently scheduled: ${dateTime(order.scheduledAt)}`
            : "Not scheduled"}
          {order.completedAt && <div>Completed: {dateTime(order.completedAt)}</div>}
        </div>
      </div>

      <DocumentView
        docLabel="Service order"
        number={order.number}
        date={order.createdAt}
        customer={order.customer}
        lineItems={order.lineItems}
        subtotal={order.subtotal}
        taxRate={order.taxRate}
        taxAmount={order.taxAmount}
        total={order.total}
        mrcTotal={order.mrcTotal}
        notes={order.notes}
      />

      <div className="mt-8">
        <DeleteButton
          action={del}
          label="Delete order"
          confirmText={`Delete service order ${order.number}?`}
        />
      </div>
    </>
  );
}

function StatusForm({
  action,
  label,
}: {
  action: () => Promise<void>;
  label: string;
}) {
  return (
    <form action={action}>
      <button type="submit" className="btn-ghost">
        {label}
      </button>
    </form>
  );
}
