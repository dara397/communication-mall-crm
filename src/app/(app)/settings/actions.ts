"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "../../../crmlib/prisma";
import { getSession } from "../../../crmlib/auth";
import type { Role } from "@prisma/client";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Only administrators can manage users.");
  }
  return session;
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  const email = (formData.get("email") || "").toString().toLowerCase().trim();
  const name = (formData.get("name") || "").toString().trim();
  const password = (formData.get("password") || "").toString();
  const role = ((formData.get("role") || "STAFF").toString() as Role) || "STAFF";
  if (!email || !name || password.length < 6) {
    throw new Error("Name, email, and a password of at least 6 characters are required.");
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("A user with that email already exists.");
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, name, role, passwordHash } });
  revalidatePath("/settings");
}

export async function resetPassword(id: string, formData: FormData) {
  await requireAdmin();
  const password = (formData.get("password") || "").toString();
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  revalidatePath("/settings");
}

export async function deleteUser(id: string) {
  const session = await requireAdmin();
  if (session.user.id === id) throw new Error("You cannot delete your own account.");
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  const target = await prisma.user.findUnique({ where: { id } });
  if (target?.role === "ADMIN" && adminCount <= 1) {
    throw new Error("Cannot delete the last administrator.");
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/settings");
}
