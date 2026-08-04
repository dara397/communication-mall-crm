import { notFound } from "next/navigation";
import { prisma } from "../../../../../crmlib/prisma";
import { PageHeader } from "../../../../../crmui/ui";
import CustomerForm from "../../../../../crmui/CustomerForm";
import { updateCustomer } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!customer) notFound();

  const action = updateCustomer.bind(null, customer.id);

  return (
    <>
      <PageHeader title={`Edit ${customer.name}`} />
      <CustomerForm
        action={action}
        customer={customer}
        cancelHref={`/customers/${customer.id}`}
      />
    </>
  );
}
