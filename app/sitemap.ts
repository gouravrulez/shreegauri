import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base="https://shreegauri.in";
  return ["","/contact","/privacy","/terms","/shipping-returns"].map((p)=>({url:base+p,lastModified:new Date(),changeFrequency:p?"monthly":"daily",priority:p?0.5:1}));
}
