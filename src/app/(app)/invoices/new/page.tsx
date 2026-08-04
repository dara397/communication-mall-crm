import { PageHeader } from "../../../../crmui/ui";
import DocumentForm from "../../../../crmui/DocumentForm";
import { loadFormLookups } from "../../../../crmlib/formData";
import { defaultTaxRate } from "../../../../crmlib/config";
import { createInvoice } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: { customerId?: string };
}) {
  const { customers, products, equipment } = await loadFormLookups();
  const locked = searchParams.customerId
    ? customers.find((c) => c.id === searchParams.customerId)
    : undefined;

  return (
    <>
      <PageHeader title="New invoice" />
      <DocumentForm
        action={createInvoice}
        docType="INVOICE"
        customers={customers}
        products={products}
        equipment={equipment}
        defaultTaxRate={defaultTaxRate}
        lockedCustomer={locked}
        initial={{ customerId: searchParams.customerId }}
        cancelHref="/invoices"
        submitLabel="Create invoice"
      />
    </>
  );
}
