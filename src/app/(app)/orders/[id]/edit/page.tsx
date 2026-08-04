import { notFound } from "next/navigation";
import { prisma } from "../../../../../crmlib/prisma";
import { PageHeader } from "../../../../../crmui/ui";
import DocumentForm from "../../../../../crmui/DocumentForm";
import { loadFormLookups } from "../../../../../crmlib/formData";
import { defaultTaxRate } from "../../../../../crmlib/config";
import { toInputDateTime } from "../../../../../crmlib/format";
import { updateOrder } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditOrderPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: params.id },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } },
  });
  if (!order) notFound();

  const { customers, products, equipment } = await loadFormLookups();
  const action = updateOrder.bind(null, order.id);

  return (
    <>
      <PageHeader title={`Edit order ${order.number}`} />
      <DocumentForm
        action={action}
        docType="ORDER"
        customers={customers}
        products={products}
        equipment={equipment}
        defaultTaxRate={defaultTaxRate}
        initial={{
          customerId: order.customerId,
          taxRate: order.taxRate,
          notes: order.notes || "",
          dateValue: toInputDateTime(order.scheduledAt),
          items: order.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            mrc: li.mrc,
            productId: li.productId,
            equipmentId: li.equipmentId,
          })),
        }}
        cancelHref={`/orders/${order.id}`}
        submitLabel="Save changes"
      />
    </>
  );
}
