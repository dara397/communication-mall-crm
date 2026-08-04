// Central place for company + tax config pulled from env, with safe defaults.
export const company = {
  name: process.env.COMPANY_NAME || "Communication Mall",
  address: process.env.COMPANY_ADDRESS || "",
  phone: process.env.COMPANY_PHONE || "",
  email: process.env.COMPANY_EMAIL || "",
  // A logo shown in the app header, on the login screen, and on PDFs.
  // Accepts an absolute URL (https://…/logo.png) or a data: URI. Empty = use the
  // "CM"-style monogram fallback.
  logoUrl: (process.env.COMPANY_LOGO_URL || "").trim(),
};

// True for values @react-pdf and <img> can safely load.
export function isUsableImageSrc(src: string): boolean {
  return /^https?:\/\//i.test(src) || /^data:image\//i.test(src);
}

export const defaultTaxRate = (() => {
  const n = parseFloat(process.env.DEFAULT_TAX_RATE || "0");
  return isNaN(n) ? 0 : n;
})();
