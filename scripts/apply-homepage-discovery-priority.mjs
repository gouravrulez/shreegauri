import fs from "node:fs";

const file = "app/storefront.tsx";
let text = fs.readFileSync(file, "utf8");

// Move both discovery collections directly below the hero/trust area, before
// category browsing and product listings, so they are present on first homepage load.
const purposeStart = text.indexOf('          <section className="section purpose-section">');
const purposeEnd = text.indexOf('\n        </>\n      )}', purposeStart);
if (purposeStart < 0 || purposeEnd < 0) {
  throw new Error("Homepage purpose/planet sections could not be located safely.");
}
const purposePlanetMarkup = text.slice(purposeStart, purposeEnd);
text = text.slice(0, purposeStart) + text.slice(purposeEnd);

const astrologyMarker = '      {view === "astrology" && (';
if (!text.includes(astrologyMarker)) {
  throw new Error("Homepage insertion point could not be located.");
}
const movedBlock = `      {(view === "home" || view === "shop") && (
        <>
${purposePlanetMarkup}
        </>
      )}
`;
text = text.replace(astrologyMarker, movedBlock + astrologyMarker);

// Give the collection query an explicit loading lifecycle. A failed query must
// also end the loading state rather than leaving an endless spinner.
const stateMarker = '  const [cats, setCats] = useState<C[]>([]),';
if (!text.includes(stateMarker)) {
  throw new Error("Category state declaration could not be located.");
}
text = text.replace(stateMarker, '  const [cats, setCats] = useState<C[]>([]),\n    [catsLoading, setCatsLoading] = useState(true),');

const queryMarker = '.then(({ data }) => { if (alive && data) setCats(data as C[]); });';
if (!text.includes(queryMarker)) {
  throw new Error("Category loading query could not be located.");
}
text = text.replace(
  queryMarker,
  '.then(({ data }) => { if (!alive) return; if (data) setCats(data as C[]); setCatsLoading(false); })\n      '
);

// Replace the purpose and planet grids with explicit loading placeholders while
// the categories request is in flight. Existing collection filtering and links stay unchanged.
const purposeGridStart = text.indexOf('            <div className="purpose-grid">');
const purposeGridEnd = text.indexOf('\n            </div>', purposeGridStart);
if (purposeGridStart < 0 || purposeGridEnd < 0) {
  throw new Error("Purpose grid could not be located.");
}
const purposeGrid = text.slice(purposeGridStart, purposeGridEnd + '\n            </div>'.length);
const purposeInner = purposeGrid.slice('            <div className="purpose-grid">'.length, -'\n            </div>'.length);
const purposeWrapped = `            {catsLoading ? (
              <p style={{ gridColumn: "1 / -1", padding: 20, color: "#765b43" }}>Loading purposes…</p>
            ) : (
              <div className="purpose-grid">${purposeInner}
              </div>
            )}`;
text = text.slice(0, purposeGridStart) + purposeWrapped + text.slice(purposeGridEnd + '\n            </div>'.length);

const planetGridStart = text.indexOf('            <div className="planet-grid">');
const planetGridEnd = text.indexOf('\n            </div>', planetGridStart);
if (planetGridStart < 0 || planetGridEnd < 0) {
  throw new Error("Planet grid could not be located.");
}
const planetGrid = text.slice(planetGridStart, planetGridEnd + '\n            </div>'.length);
const planetInner = planetGrid.slice('            <div className="planet-grid">'.length, -'\n            </div>'.length);
const planetWrapped = `            {catsLoading ? (
              <p style={{ gridColumn: "1 / -1", padding: 20, color: "#765b43" }}>Loading planetary collections…</p>
            ) : (
              <div className="planet-grid">${planetInner}
              </div>
            )}`;
text = text.slice(0, planetGridStart) + planetWrapped + text.slice(planetGridEnd + '\n            </div>'.length);

// Keep the discovery strips compact and responsive at the top of the page.
if (!text.includes('purpose-section')) throw new Error("Purpose section missing after move.");
fs.writeFileSync(file, text);
console.log("Homepage purpose and planet collections moved above category/product browsing with visible loading states.");
