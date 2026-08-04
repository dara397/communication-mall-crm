import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../crmlib/prisma";
import { PageHeader } from "../../../../crmui/ui";
import { updateProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const p = await prisma.product.findUnique({ where: { id: params.id } });
  if (!p) notFound();

  const action = updateProduct.bind(null, p.id);

  return (
    <>
      <PageHeader title={`Edit ${p.name}`} />
      <form action={action} className="card grid gap-4 p-6 sm:grid-cols-3">
        <div>
          <label className="label">Code *</label>
          <input name="code" className="input" defaultValue={p.code} required />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Name *</label>
          <input name="name" className="input" defaultValue={p.name} required />
        </div>
        <div>
          <label className="label">Category</label>
          <input name="category" className="input" defaultValue={p.category ?? ""} />
        </div>
        <div>
          <label className="label">Charge type</label>
          <select name="chargeType" className="input" defaultValue={p.chargeType}>
            <option value="NRC">One-time (NRC)</option>
            <option value="MRC">Monthly (MRC)</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">MRC/mo</label>
            <input name="mrc" type="number" step="0.01" className="input" defaultValue={p.mrc} />
          </div>
          <div>
            <label className="label">NRC</label>
            <input name="nrc" type="number" step="0.01" className="input" defaultValue={p.nrc} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <input name="description" className="input" defaultValue={p.description ?? ""} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="active" defaultChecked={p.active} className="h-4 w-4" />
          Active (available on new quotes)
        </label>
        <div className="flex items-end gap-3 sm:col-span-3">
          <Link href="/catalog" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary">
            Save
          </button>
        </div>
      </form>
    </>
  );
}
