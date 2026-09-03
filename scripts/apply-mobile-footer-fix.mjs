import fs from "node:fs";

const store = "app/storefront.tsx";
let text = fs.readFileSync(store, "utf8");

const oldGo = `  const go = (v: string) => {
    setView(v);
    setMenu(false);
    setItem(null);
    setTimeout(
      () =>
        window.scrollTo({ top: v === "home" ? 0 : 560, behavior: "smooth" }),
      20,
    );
  };`;

const newGo = `  const go = (v: string) => {
    setView(v);
    setMenu(false);
    setItem(null);
    setTimeout(() => {
      const isCatalogView =
        v === "shop" ||
        v === "new" ||
        v === "best" ||
        cats.some((c) => c.slug === v);
      const catalog = document.getElementById("products-section");
      if (isCatalogView && catalog) {
        catalog.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: v === "home" ? 0 : 560, behavior: "smooth" });
      }
    }, 80);
  };`;

if (!text.includes(newGo)) {
  if (!text.includes(oldGo)) throw new Error("Mobile category navigation patch failed: go() block not found.");
  text = text.replace(oldGo, newGo);
}

const oldCatalog = `<section className="section cream catalog">`;
const newCatalog = `<section id="products-section" className="section cream catalog">`;
if (!text.includes(newCatalog)) {
  if (!text.includes(oldCatalog)) throw new Error("Mobile category navigation patch failed: catalog section not found.");
  text = text.replace(oldCatalog, newCatalog);
}

const oldEmail = `          <a href="mailto:gauritechnologiespvt@gmail.com">
            gauritechnologiespvt@gmail.com
          </a>`;
const newEmail = `          <a href="mailto:gauritechnologiespvt@gmail.com">
            gauritechnologiespvt@gmail.com
          </a>
          <a href="tel:+917400617601">+91 74006 17601</a>`;

if (!text.includes(newEmail)) {
  if (!text.includes(oldEmail)) throw new Error("Footer phone patch failed: email block not found.");
  text = text.replace(oldEmail, newEmail);
}

fs.writeFileSync(store, text);
console.log("Shree Gauri mobile category navigation and footer phone fix applied.");
