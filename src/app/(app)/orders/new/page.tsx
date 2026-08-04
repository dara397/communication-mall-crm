import { PageHeader } from "../../../../crmui/ui";
import DocumentForm from "../../../../crmui/DocumentForm";
import { loadFormLookups } from "../../../../crmlib/formData";
import { defaultTaxRate } from "../../../../crmlib/config";
import { createOrder } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewOrderPage({
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
      <PageHeader title="New service order" />
      <DocumentForm
        action={createOrder}
        docType="ORDER"
        customers={customers}
        products={products}
        equipment={equipment}
        defaultTaxRate={defaultTaxRate}
        lockedCustomer={locked}
        initial={{ customerId: searchParams.customerId }}
        cancelHref="/orders"
        submitLabel="Create order"
      />
    </>
  );
}
