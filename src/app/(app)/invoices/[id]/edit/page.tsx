import { notFound } from "next/navigation";
import { prisma } from "../../../../../crmlib/prisma";
import { PageHeader } from "../../../../../crmui/ui";
import DocumentForm from "../../../../../crmui/DocumentForm";
import { loadFormLookups } from "../../../../../crmlib/formData";
import { defaultTaxRate } from "../../../../../crmlib/config";
import { toInputDate } from "../../../../../crmlib/format";
import { updateInvoice } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invoice) notFound();

  const { customers, products, equipment } = await loadFormLookups();
  const action = updateInvoice.bind(null, invoice.id);

  return (
    <>
      <PageHeader title={`Edit invoice ${invoice.number}`} />
      <DocumentForm
        action={action}
        docType="INVOICE"
        customers={customers}
        products={products}
        equipment={equipment}
        defaultTaxRate={defaultTaxRate}
        initial={{
          customerId: invoice.customerId,
          taxRate: invoice.taxRate,
          notes: invoice.notes || "",
          dateValue: toInputDate(invoice.dueDate),
          items: invoice.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            mrc: li.mrc,
            productId: li.productId,
            equipmentId: li.equipmentId,
          })),
        }}
        cancelHref={`/invoices/${invoice.id}`}
        submitLabel="Save changes"
      />
    </>
  );
}
