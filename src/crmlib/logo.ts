import { company, isUsableImageSrc } from "./config";

// Resolve the configured logo to a data: URI that @react-pdf can embed reliably.
// - data: URIs are returned as-is.
// - http(s) URLs are fetched once and base64-encoded.
// - Anything invalid or unreachable resolves to null (PDF falls back to text).
// Cached per server instance so we don't refetch on every PDF.
let cached: { key: string; value: string | null } | null = null;

export async function resolveLogoDataUri(): Promise<string | null> {
  const src = company.logoUrl;
  if (!src || !isUsableImageSrc(src)) return null;
  if (src.startsWith("data:")) return src;
  if (cached && cached.key === src) return cached.value;

  try {
    const res = await fetch(src, { cache: "force-cache" });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const contentType = res.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) throw new Error("not an image");
    const buf = Buffer.from(await res.arrayBuffer());
    const value = `data:${contentType};base64,${buf.toString("base64")}`;
    cached = { key: src, value };
    return value;
  } catch {
    cached = { key: src, value: null };
    return null;
  }
}
