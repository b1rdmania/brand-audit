export default function Strengths({ items }) {
  if (!items?.length) return null;

  return (
    <section className="section">
      <h2>Strengths to Build On</h2>
      <div className="strengths-list">
        {items.map((s, i) => (
          <div key={i} className="strength-item">
            <span className="strength-check">&#10003;</span>
            <span dangerouslySetInnerHTML={{ __html: s }} />
          </div>
        ))}
      </div>
    </section>
  );
}
