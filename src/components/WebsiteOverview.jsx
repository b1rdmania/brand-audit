export default function WebsiteOverview({ website }) {
  if (!website) return null;

  const ps = website.pagespeed_mobile != null ? parseInt(website.pagespeed_mobile, 10) : null;
  const psColor = ps != null ? (ps >= 90 ? 'var(--green)' : ps >= 50 ? 'var(--yellow)' : 'var(--red)') : null;

  const blogText = website.blog?.detected ? `${website.blog.post_count || 0}` : '0';
  const blogNote = website.blog?.detected && website.blog.last_post_date
    ? `Latest: ${website.blog.last_post_date}`
    : website.blog?.detected
      ? `${website.blog.post_count || 0} post${(website.blog.post_count || 0) !== 1 ? 's' : ''} found`
      : 'Not detected';

  return (
    <section className="section">
      <h2>Website Overview</h2>
      <div className="stats-row">
        {website.platform && (
          <div className="stat-card">
            <div className="stat-label">Platform</div>
            <div className="stat-value" style={{ fontSize: '1.125rem' }}>{website.platform}</div>
          </div>
        )}
        {ps != null && (
          <div className="stat-card">
            <div className="stat-label">PageSpeed (Mobile)</div>
            <div className="stat-value" style={{ color: psColor }}>{ps}<small> / 100</small></div>
          </div>
        )}
        {website.ssl != null && (
          <div className="stat-card">
            <div className="stat-label">SSL Certificate</div>
            <div className="stat-value" style={{ fontSize: '1.125rem', color: website.ssl ? 'var(--green)' : 'var(--red)' }}>
              {website.ssl ? 'Valid' : 'Missing'}
            </div>
          </div>
        )}
        {website.blog && (
          <div className="stat-card">
            <div className="stat-label">Blog Posts</div>
            <div className="stat-value">{blogText}</div>
            <div className="stat-note">{blogNote}</div>
          </div>
        )}
      </div>
    </section>
  );
}
