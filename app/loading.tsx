export default function Loading() {
  return (
    <main className="shree-gauri-loading" role="status" aria-label="Loading Shree Gauri">
      <img src="/shree-gauri-logo.png" alt="Shree Gauri" fetchPriority="high" />
      <strong>SHREE GAURI</strong>
      <span>Divine Energy. Timeless Beauty.</span>
      <div className="loading-line" aria-hidden="true" />
    </main>
  );
}
