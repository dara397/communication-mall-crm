import Link from "next/link";
import { prisma } from "../../../crmlib/prisma";
import { PageHeader } from "../../../crmui/ui";
import DeleteButton from "../../../crmui/DeleteButton";
import { money } from "../../../crmlib/format";
import { createEquipment, deleteEquipment } from "./actions";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await prisma.equipment.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <PageHeader
        title="Equipment inventory"
        subtitle="Physical parts and hardware kept in stock."
      />

      <details className="card mb-6 p-5">
        <summary className="cursor-pointer text-sm font-semibold text-brand-700">
          + Add equipment item
        </summary>
        <form action={createEquipment} className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">SKU *</label>
            <input name="sku" className="input" required />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Name *</label>
            <input name="name" className="input" required />
          </div>
          <div>
            <label className="label">Category</label>
            <input name="category" className="input" />
          </div>
          <div>
            <label className="label">Unit cost</label>
            <input name="unitCost" type="number" step="0.01" className="input" defaultValue={0} />
          </div>
          <div>
            <label className="label">Unit price</label>
            <input name="unitPrice" type="number" step="0.01" className="input" defaultValue={0} />
          </div>
          <div>
            <label className="label">Qty on hand</label>
            <input name="quantityOnHand" type="number" className="input" defaultValue={0} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <input name="description" className="input" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full">
              Add item
            </button>
          </div>
        </form>
      </details>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">SKU</th>
              <th className="th">Name</th>
              <th className="th">Category</th>
              <th className="th text-right">Cost</th>
              <th className="th text-right">Price</th>
              <th className="th text-right">On hand</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="td text-center text-slate-400">
                  No equipment yet. Add your first item above.
                </td>
              </tr>
            )}
            {items.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="td font-mono text-xs">{e.sku}</td>
                <td className="td font-medium">{e.name}</td>
                <td className="td">{e.category || "—"}</td>
                <td className="td text-right">{money(e.unitCost)}</td>
                <td className="td text-right">{money(e.unitPrice)}</td>
                <td className="td text-right">
                  <span
                    className={
                      e.quantityOnHand <= 0
                        ? "font-semibold text-red-600"
                        : "text-slate-700"
                    }
                  >
                    {e.quantityOnHand}
                  </span>
                </td>
                <td className="td">
                  <div className="flex justify-end gap-2">
                    <Link href={`/inventory/${e.id}`} className="btn-ghost h-8 py-1">
                      Edit
                    </Link>
                    <DeleteButton
                      action={deleteEquipment.bind(null, e.id)}
                      label="Delete"
                      className="btn-ghost h-8 py-1 text-red-600"
                      confirmText={`Delete ${e.name}?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
