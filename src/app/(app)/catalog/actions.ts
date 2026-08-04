"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../../crmlib/prisma";
import type { ChargeType } from "@prisma/client";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}
function num(v: FormDataEntryValue | null): number {
  const n = parseFloat((v ?? "").toString());
  return isNaN(n) ? 0 : n;
}
function chargeType(v: FormDataEntryValue | null): ChargeType {
  const s = (v ?? "").toString();
  return s === "MRC" || s === "BOTH" ? (s as ChargeType) : "NRC";
}

export async function createProduct(formData: FormData) {
  const code = str(formData.get("code"));
  const name = str(formData.get("name"));
  if (!code || !name) throw new Error("Code and name are required");
  await prisma.product.create({
    data: {
      code,
      name,
      description: str(formData.get("description")),
      category: str(formData.get("category")),
      chargeType: chargeType(formData.get("chargeType")),
      mrc: num(formData.get("mrc")),
      nrc: num(formData.get("nrc")),
    },
  });
  revalidatePath("/catalog");
}

export async function updateProduct(id: string, formData: FormData) {
  const code = str(formData.get("code"));
  const name = str(formData.get("name"));
  if (!code || !name) throw new Error("Code and name are required");
  await prisma.product.update({
    where: { id },
    data: {
      code,
      name,
      description: str(formData.get("description")),
      category: str(formData.get("category")),
      chargeType: chargeType(formData.get("chargeType")),
      mrc: num(formData.get("mrc")),
      nrc: num(formData.get("nrc")),
      active: formData.get("active") === "on",
    },
  });
  revalidatePath("/catalog");
  redirect("/catalog");
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/catalog");
}
