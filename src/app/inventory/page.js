import { redirect } from 'next/navigation';

export default function InventoryPage() {
  // Equipment now lives in Products & services.
  redirect('/catalog');
}
