import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../crmlib/prisma";
import { PageHeader, StatusBadge } from "../../../../crmui/ui";
import DocumentView from "../../../../crmui/DocumentView";
import DeleteButton from "../../../../crmui/DeleteButton";
import EmailButton from "../../../../crmui/EmailButton";
import { setQuoteStatus, deleteQuote, convertQuoteToOrder } from "../actions";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      serviceOrders: true,
    },
  });
  if (!quote) notFound();

  const del = deleteQuote.bind(null, quote.id);
  const convert = convertQuoteToOrder.bind(null, quote.id);

  return (
    <>
      <PageHeader
        title={`Quote ${quote.number}`}
        subtitle={quote.customer.name}
        action={<StatusBadge status={quote.status} />}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link href={`/quotes/${quote.id}/edit`} className="btn-secondary">
          Edit
        </Link>
        <a
          href={`/api/pdf/quote/${quote.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          Download PDF
        </a>
        <EmailButton type="quote" id={quote.id} defaultEmail={quote.customer.email} />

        <div className="mx-1 h-6 w-px bg-slate-200" />

        <StatusForm action={setQuoteStatus.bind(null, quote.id, "SENT")} label="Mark sent" />
        <StatusForm
          action={setQuoteStatus.bind(null, quote.id, "ACCEPTED")}
          label="Mark accepted"
        />
        <StatusForm
          action={setQuoteStatus.bind(null, quote.id, "DECLINED")}
          label="Mark declined"
        />

        <div className="mx-1 h-6 w-px bg-slate-200" />

        {quote.serviceOrders.length > 0 ? (
          <Link
            href={`/orders/${quote.serviceOrders[0].id}`}
            className="btn-secondary"
          >
            View service order
          </Link>
        ) : (
          <form action={convert}>
            <button type="submit" className="btn-primary">
              Convert to service order →
            </button>
          </form>
        )}
      </div>

      <DocumentView
        docLabel="Quote"
        number={quote.number}
        date={quote.createdAt}
        customer={quote.customer}
        lineItems={quote.lineItems}
        subtotal={quote.subtotal}
        taxRate={quote.taxRate}
        taxAmount={quote.taxAmount}
        total={quote.total}
        mrcTotal={quote.mrcTotal}
        notes={quote.notes}
      />

      <div className="mt-8">
        <DeleteButton action={del} label="Delete quote" confirmText={`Delete quote ${quote.number}?`} />
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
