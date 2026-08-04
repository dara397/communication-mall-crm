"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../crmlib/prisma";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}
function num(v: FormDataEntryValue | null): number {
  const n = parseFloat((v ?? "").toString());
  return isNaN(n) ? 0 : n;
}

export async function createEquipment(formData: FormData) {
  const sku = str(formData.get("sku"));
  const name = str(formData.get("name"));
  if (!sku || !name) throw new Error("SKU and name are required");
  await prisma.equipment.create({
    data: {
      sku,
      name,
      description: str(formData.get("description")),
      category: str(formData.get("category")),
      unitCost: num(formData.get("unitCost")),
      unitPrice: num(formData.get("unitPrice")),
      quantityOnHand: Math.round(num(formData.get("quantityOnHand"))),
    },
  });
  revalidatePath("/inventory");
}

export async function updateEquipment(id: string, formData: FormData) {
  const sku = str(formData.get("sku"));
  const name = str(formData.get("name"));
  if (!sku || !name) throw new Error("SKU and name are required");
  await prisma.equipment.update({
    where: { id },
    data: {
      sku,
      name,
      description: str(formData.get("description")),
      category: str(formData.get("category")),
      unitCost: num(formData.get("unitCost")),
      unitPrice: num(formData.get("unitPrice")),
      quantityOnHand: Math.round(num(formData.get("quantityOnHand"))),
    },
  });
  revalidatePath("/inventory");
  redirect("/inventory");
}

export async function deleteEquipment(id: string) {
  await prisma.equipment.delete({ where: { id } });
  revalidatePath("/inventory");
}
