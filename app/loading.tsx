export default function Loading() {
  return (
    <main className="shree-gauri-loading" role="status" aria-label="Loading Shree Gauri">
      <img
        src="/shree-gauri-brand.svg"
        alt="Shree Gauri — Divine Energy. Timeless Beauty."
        width="650"
        height="150"
        loading="eager"
        fetchPriority="high"
        decoding="sync"
      />
      <div className="loading-line" aria-hidden="true" />
    </main>
  );
}
