import React from 'react';

export default function StatCard({ title, value, unit = '', subtext, icon: Icon, badge, color = 'red' }) {
  const colorMap = {
    red: { bg: 'rgba(230, 57, 70, 0.12)', text: '#e63946', border: 'rgba(230, 57, 70, 0.25)' },
    blue: { bg: 'rgba(58, 134, 255, 0.12)', text: '#3a86ff', border: 'rgba(58, 134, 255, 0.25)' },
    teal: { bg: 'rgba(46, 196, 182, 0.12)', text: '#2ec4b6', border: 'rgba(46, 196, 182, 0.25)' },
    amber: { bg: 'rgba(255, 159, 28, 0.12)', text: '#ff9f1c', border: 'rgba(255, 159, 28, 0.25)' },
    purple: { bg: 'rgba(114, 9, 183, 0.12)', text: '#9d4edd', border: 'rgba(114, 9, 183, 0.25)' },
  };

  const style = colorMap[color] || colorMap.red;

  return (
    <div className="stat-card glass-panel">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        {Icon && (
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="stat-body">
        <div className="stat-value-row">
          <span className="stat-value">{value}</span>
          {unit && <span className="stat-unit">{unit}</span>}
        </div>
        {subtext && <div className="stat-subtext">{subtext}</div>}
        {badge && (
          <div className="stat-badge-row">
            <span className="badge" style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}>
              {badge}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
