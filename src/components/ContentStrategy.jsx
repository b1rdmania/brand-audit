export default function ContentStrategy({ items }) {
  if (!items?.length) return null;

  return (
    <section className="section">
      <h2>Content That Would Work</h2>
      <p className="section-intro">Ideas matched to this brand's strengths and audience.</p>
      <div className="content-grid">
        {items.map((item, i) => (
          <div key={i} className="content-card">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
