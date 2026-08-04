/* eslint-disable @next/next/no-img-element */

// Renders the company logo when a usable src is provided, otherwise a "CM"
// monogram. Works in both server and client components (plain <img>).
export default function Logo({
  src,
  size = 36,
  rounded = true,
  className = "",
}: {
  src?: string;
  size?: number;
  rounded?: boolean;
  className?: string;
}) {
  const usable = src && (/^https?:\/\//i.test(src) || /^data:image\//i.test(src));
  if (usable) {
    return (
      <img
        src={src}
        alt="Company logo"
        style={{ height: size, maxWidth: size * 3, objectFit: "contain" }}
        className={className}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center bg-brand-600 font-bold text-white ${
        rounded ? "rounded-lg" : ""
      } ${className}`}
      style={{ height: size, width: size, fontSize: size * 0.4 }}
    >
      CM
    </div>
  );
}
