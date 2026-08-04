import { PageHeader } from "../../../../crmui/ui";
import DocumentForm from "../../../../crmui/DocumentForm";
import { loadFormLookups } from "../../../../crmlib/formData";
import { defaultTaxRate } from "../../../../crmlib/config";
import { createQuote } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewQuotePage({
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
      <PageHeader title="New quote" subtitle="Build a quote from products, equipment, or custom lines." />
      <DocumentForm
        action={createQuote}
        docType="QUOTE"
        customers={customers}
        products={products}
        equipment={equipment}
        defaultTaxRate={defaultTaxRate}
        lockedCustomer={locked}
        initial={{ customerId: searchParams.customerId }}
        cancelHref="/quotes"
        submitLabel="Create quote"
      />
    </>
  );
}
