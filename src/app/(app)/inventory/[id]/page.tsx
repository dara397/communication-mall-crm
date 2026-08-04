import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../crmlib/prisma";
import { PageHeader } from "../../../../crmui/ui";
import { updateEquipment } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditEquipmentPage({
  params,
}: {
  params: { id: string };
}) {
  const e = await prisma.equipment.findUnique({ where: { id: params.id } });
  if (!e) notFound();

  const action = updateEquipment.bind(null, e.id);

  return (
    <>
      <PageHeader title={`Edit ${e.name}`} />
      <form action={action} className="card grid gap-4 p-6 sm:grid-cols-3">
        <div>
          <label className="label">SKU *</label>
          <input name="sku" className="input" defaultValue={e.sku} required />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Name *</label>
          <input name="name" className="input" defaultValue={e.name} required />
        </div>
        <div>
          <label className="label">Category</label>
          <input name="category" className="input" defaultValue={e.category ?? ""} />
        </div>
        <div>
          <label className="label">Unit cost</label>
          <input name="unitCost" type="number" step="0.01" className="input" defaultValue={e.unitCost} />
        </div>
        <div>
          <label className="label">Unit price</label>
          <input name="unitPrice" type="number" step="0.01" className="input" defaultValue={e.unitPrice} />
        </div>
        <div>
          <label className="label">Qty on hand</label>
          <input name="quantityOnHand" type="number" className="input" defaultValue={e.quantityOnHand} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <input name="description" className="input" defaultValue={e.description ?? ""} />
        </div>
        <div className="flex items-end gap-3 sm:col-span-3">
          <Link href="/inventory" className="btn-secondary">
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
