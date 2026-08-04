import { notFound } from "next/navigation";
import { prisma } from "../../../../../crmlib/prisma";
import { PageHeader } from "../../../../../crmui/ui";
import DocumentForm from "../../../../../crmui/DocumentForm";
import { loadFormLookups } from "../../../../../crmlib/formData";
import { defaultTaxRate } from "../../../../../crmlib/config";
import { toInputDate } from "../../../../../crmlib/format";
import { updateQuote } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditQuotePage({
  params,
}: {
  params: { id: string };
}) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } },
  });
  if (!quote) notFound();

  const { customers, products, equipment } = await loadFormLookups();
  const action = updateQuote.bind(null, quote.id);

  return (
    <>
      <PageHeader title={`Edit quote ${quote.number}`} />
      <DocumentForm
        action={action}
        docType="QUOTE"
        customers={customers}
        products={products}
        equipment={equipment}
        defaultTaxRate={defaultTaxRate}
        initial={{
          customerId: quote.customerId,
          taxRate: quote.taxRate,
          notes: quote.notes || "",
          dateValue: toInputDate(quote.validUntil),
          items: quote.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            mrc: li.mrc,
            productId: li.productId,
            equipmentId: li.equipmentId,
          })),
        }}
        cancelHref={`/quotes/${quote.id}`}
        submitLabel="Save changes"
      />
    </>
  );
}
