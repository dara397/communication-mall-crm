import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../crmlib/prisma";
import { PageHeader, StatusBadge } from "../../../../crmui/ui";
import DocumentView from "../../../../crmui/DocumentView";
import DeleteButton from "../../../../crmui/DeleteButton";
import EmailButton from "../../../../crmui/EmailButton";
import { shortDate } from "../../../../crmlib/format";
import { setInvoiceStatus, deleteInvoice } from "../actions";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      serviceOrder: true,
    },
  });
  if (!invoice) notFound();

  const del = deleteInvoice.bind(null, invoice.id);

  return (
    <>
      <PageHeader
        title={`Invoice ${invoice.number}`}
        subtitle={`${invoice.customer.name}${
          invoice.dueDate ? ` · due ${shortDate(invoice.dueDate)}` : ""
        }`}
        action={<StatusBadge status={invoice.status} />}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link href={`/invoices/${invoice.id}/edit`} className="btn-secondary">
          Edit
        </Link>
        <a
          href={`/api/pdf/invoice/${invoice.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          Download PDF
        </a>
        <EmailButton type="invoice" id={invoice.id} defaultEmail={invoice.customer.email} />
        {invoice.serviceOrder && (
          <Link href={`/orders/${invoice.serviceOrder.id}`} className="btn-ghost">
            From order {invoice.serviceOrder.number}
          </Link>
        )}

        <div className="mx-1 h-6 w-px bg-slate-200" />

        <StatusForm action={setInvoiceStatus.bind(null, invoice.id, "SENT")} label="Mark sent" />
        <StatusForm action={setInvoiceStatus.bind(null, invoice.id, "PAID")} label="Mark paid" />
        <StatusForm action={setInvoiceStatus.bind(null, invoice.id, "OVERDUE")} label="Mark overdue" />
        <StatusForm action={setInvoiceStatus.bind(null, invoice.id, "VOID")} label="Void" />
      </div>

      <DocumentView
        docLabel="Invoice"
        number={invoice.number}
        date={invoice.issuedAt || invoice.createdAt}
        customer={invoice.customer}
        lineItems={invoice.lineItems}
        subtotal={invoice.subtotal}
        taxRate={invoice.taxRate}
        taxAmount={invoice.taxAmount}
        total={invoice.total}
        mrcTotal={invoice.mrcTotal}
        notes={invoice.notes}
      />

      <div className="mt-8">
        <DeleteButton
          action={del}
          label="Delete invoice"
          confirmText={`Delete invoice ${invoice.number}?`}
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
