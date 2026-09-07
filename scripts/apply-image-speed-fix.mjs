import fs from "fs";

const path = "app/storefront.tsx";
let s = fs.readFileSync(path, "utf8");

// Supabase Storage image transformation for product/category thumbnails.
// Keeps original URLs untouched for product-detail quality.
const helper = `
  const fastImage = (url: string, width = 520, quality = 72) => {
    if (!url) return url;
    try {
      const u = new URL(url);
      if (
        u.hostname.endsWith(".supabase.co") &&
        u.pathname.includes("/storage/v1/object/public/")
      ) {
        u.pathname = u.pathname.replace(
          "/storage/v1/object/public/",
          "/storage/v1/render/image/public/",
        );
        u.searchParams.set("width", String(width));
        u.searchParams.set("quality", String(quality));
        u.searchParams.set("resize", "contain");
        return u.toString();
      }
    } catch {}
    return url;
  };
`;
const marker = '  const money = (n: number) =>';
if (!s.includes("const fastImage =")) {
  s = s.replace(marker, helper + "\n" + marker);
}

// Product grid: smaller transformed thumbnails + native lazy loading/async decode.
s = s.replace(
`                        src={
                          p.primary_image_url ||
                          "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85"
                        }
                        alt={p.name}
                      />`,
`                        src={
                          p.primary_image_url
                            ? fastImage(p.primary_image_url, 520, 72)
                            : "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=520&q=72"
                        }
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        width={520}
                        height={520}
                      />`
);

// Category/purpose/planet cards: lightweight thumbnails.
s = s.replaceAll(
  '<img src={c.image_url} alt={c.name} />',
  '<img src={fastImage(c.image_url, 240, 68)} alt={c.name} loading="lazy" decoding="async" width={240} height={240} />'
);

// Cart uses a tiny thumbnail.
s = s.replace(
  '<img src={p.primary_image_url} />',
  '<img src={fastImage(p.primary_image_url, 160, 65)} alt={p.name} loading="lazy" decoding="async" width={160} height={160} />'
);

// Founder image is below the fold, so defer it.
s = s.replace(
  '          alt="Gourav Sharma, Founder of Shree Gauri"\n        />',
  '          alt="Gourav Sharma, Founder of Shree Gauri"\n          loading="lazy"\n          decoding="async"\n        />'
);

fs.writeFileSync(path, s);
console.log("Storefront image speed optimization applied");
