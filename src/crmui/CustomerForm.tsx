import Link from "next/link";

type CustomerLike = {
  id?: string;
  name?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  notes?: string | null;
};

export default function CustomerForm({
  action,
  customer,
  cancelHref,
}: {
  action: (formData: FormData) => void;
  customer?: CustomerLike;
  cancelHref: string;
}) {
  const c = customer || {};
  return (
    <form action={action} className="card space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Contact name *</label>
          <input name="name" className="input" defaultValue={c.name ?? ""} required />
        </div>
        <div>
          <label className="label">Company</label>
          <input name="company" className="input" defaultValue={c.company ?? ""} />
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" className="input" defaultValue={c.email ?? ""} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" className="input" defaultValue={c.phone ?? ""} />
        </div>
      </div>
      <div>
        <label className="label">Street address</label>
        <input name="address" className="input" defaultValue={c.address ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">City</label>
          <input name="city" className="input" defaultValue={c.city ?? ""} />
        </div>
        <div>
          <label className="label">State</label>
          <input name="state" className="input" defaultValue={c.state ?? ""} />
        </div>
        <div>
          <label className="label">ZIP</label>
          <input name="zip" className="input" defaultValue={c.zip ?? ""} />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea name="notes" rows={3} className="input" defaultValue={c.notes ?? ""} />
      </div>
      <div className="flex justify-end gap-3">
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn-primary">
          Save customer
        </button>
      </div>
    </form>
  );
}
