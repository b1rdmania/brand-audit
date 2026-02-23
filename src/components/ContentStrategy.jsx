export default function ContentStrategy({ items }) {
  if (!items?.length) return null;

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2>Content Strategy</h2>
      <div className="card-grid">
        {items.map((item, i) => (
          <div key={i} className="card">
            <h3>{item.title}</h3>
            <p style={{ marginBottom: 0 }}>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
