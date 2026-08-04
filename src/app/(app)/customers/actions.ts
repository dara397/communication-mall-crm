"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../crmlib/prisma";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}

export async function createCustomer(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) throw new Error("Name is required");
  const customer = await prisma.customer.create({
    data: {
      name,
      company: str(formData.get("company")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      address: str(formData.get("address")),
      city: str(formData.get("city")),
      state: str(formData.get("state")),
      zip: str(formData.get("zip")),
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}

export async function updateCustomer(id: string, formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) throw new Error("Name is required");
  await prisma.customer.update({
    where: { id },
    data: {
      name,
      company: str(formData.get("company")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      address: str(formData.get("address")),
      city: str(formData.get("city")),
      state: str(formData.get("state")),
      zip: str(formData.get("zip")),
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}

export async function deleteCustomer(id: string) {
  // Guard: don't delete customers that still have documents.
  const counts = await prisma.customer.findUnique({
    where: { id },
    select: {
      _count: { select: { quotes: true, serviceOrders: true, invoices: true } },
    },
  });
  if (
    counts &&
    (counts._count.quotes > 0 ||
      counts._count.serviceOrders > 0 ||
      counts._count.invoices > 0)
  ) {
    throw new Error(
      "Cannot delete a customer that has quotes, orders, or invoices."
    );
  }
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
  redirect("/customers");
}
