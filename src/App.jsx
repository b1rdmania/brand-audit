import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import AuditView from './pages/AuditView';
import './App.css';

function App() {
  const [audits, setAudits] = useState([]);
  const [activeAudit, setActiveAudit] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('brand-audit-index');
    if (stored) {
      try { setAudits(JSON.parse(stored)); } catch (e) { /* ignore */ }
    }
  }, []);

  function saveAudits(updated) {
    setAudits(updated);
    localStorage.setItem('brand-audit-index', JSON.stringify(updated));
  }

  function addAudit(audit) {
    saveAudits([...audits, audit]);
    setActiveAudit(audit);
  }

  function updateAudit(slug, data) {
    saveAudits(audits.map(a => a.meta?.slug === slug ? data : a));
    setActiveAudit(data);
  }

  function deleteAudit(slug) {
    saveAudits(audits.filter(a => a.meta?.slug !== slug));
    setActiveAudit(null);
  }

  if (activeAudit) {
    return (
      <AuditView
        audit={activeAudit}
        onBack={() => setActiveAudit(null)}
        onUpdate={(data) => updateAudit(activeAudit.meta.slug, data)}
        onDelete={() => deleteAudit(activeAudit.meta.slug)}
      />
    );
  }

  return (
    <Dashboard
      audits={audits}
      onSelect={setActiveAudit}
      onAdd={addAudit}
    />
  );
}

export default App;
