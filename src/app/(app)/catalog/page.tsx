import Link from "next/link";
import { prisma } from "../../../crmlib/prisma";
import { PageHeader } from "../../../crmui/ui";
import DeleteButton from "../../../crmui/DeleteButton";
import { money } from "../../../crmlib/format";
import { createProduct, deleteProduct } from "./actions";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q || "").trim();
  const products = await prisma.product.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    take: 500,
  });
  const total = await prisma.product.count();

  return (
    <>
      <PageHeader
        title="Products & services"
        subtitle={`${total} in catalog (MRC / NRC price list)`}
      />

      <div className="mb-4 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
        To load the full Tele Express price list, run{" "}
        <code className="rounded bg-white px-1.5 py-0.5 text-xs">
          npm run import:pricelist -- ./pricelist.xlsx
        </code>{" "}
        from the project folder. See the README for column mapping.
      </div>

      <details className="card mb-6 p-5">
        <summary className="cursor-pointer text-sm font-semibold text-brand-700">
          + Add product / service
        </summary>
        <form action={createProduct} className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Code *</label>
            <input name="code" className="input" required />
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
            <label className="label">Charge type</label>
            <select name="chargeType" className="input" defaultValue="NRC">
              <option value="NRC">One-time (NRC)</option>
              <option value="MRC">Monthly (MRC)</option>
              <option value="BOTH">Both</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">MRC/mo</label>
              <input name="mrc" type="number" step="0.01" className="input" defaultValue={0} />
            </div>
            <div>
              <label className="label">NRC</label>
              <input name="nrc" type="number" step="0.01" className="input" defaultValue={0} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <input name="description" className="input" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full">
              Add
            </button>
          </div>
        </form>
      </details>

      <form className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search products…"
          className="input max-w-md"
        />
      </form>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Code</th>
              <th className="th">Name</th>
              <th className="th">Category</th>
              <th className="th">Type</th>
              <th className="th text-right">MRC</th>
              <th className="th text-right">NRC</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="td text-center text-slate-400">
                  No products found.
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className={`hover:bg-slate-50 ${p.active ? "" : "opacity-50"}`}>
                <td className="td font-mono text-xs">{p.code}</td>
                <td className="td font-medium">{p.name}</td>
                <td className="td">{p.category || "—"}</td>
                <td className="td text-xs text-slate-500">{p.chargeType}</td>
                <td className="td text-right">{p.mrc ? money(p.mrc) : "—"}</td>
                <td className="td text-right">{p.nrc ? money(p.nrc) : "—"}</td>
                <td className="td">
                  <div className="flex justify-end gap-2">
                    <Link href={`/catalog/${p.id}`} className="btn-ghost h-8 py-1">
                      Edit
                    </Link>
                    <DeleteButton
                      action={deleteProduct.bind(null, p.id)}
                      label="Delete"
                      className="btn-ghost h-8 py-1 text-red-600"
                      confirmText={`Delete ${p.name}?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > products.length && (
        <p className="mt-3 text-center text-xs text-slate-400">
          Showing {products.length} of {total}. Use search to narrow results.
        </p>
      )}
    </>
  );
}
