import { PageHeader } from "../../../../crmui/ui";
import CustomerForm from "../../../../crmui/CustomerForm";
import { createCustomer } from "../actions";

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader title="New customer" />
      <CustomerForm action={createCustomer} cancelHref="/customers" />
    </>
  );
}
