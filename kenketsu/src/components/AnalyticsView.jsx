import React from 'react';
import StatCard from './StatCard';
import {
  Award,
  Calendar,
  Clock,
  TrendingUp,
  Heart,
  BarChart3,
  MapPin,
  Zap,
  Activity,
  Timer
} from 'lucide-react';

// ==========================================
// 1. 年別献血回数推移（SVG / CSS Responsive Bar Chart）
// ==========================================
function YearlyBarChart({ years, counts }) {
  const maxCount = Math.max(...counts, 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end', paddingTop: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '4px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {years.map((year, idx) => {
          const count = counts[idx] || 0;
          const heightPercent = (count / maxCount) * 100;
          return (
            <div
              key={year}
              title={`${year}年: ${count}回`}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                position: 'relative'
              }}
            >
              <span style={{ fontSize: '0.65rem', color: count > 0 ? '#ff6b6b' : 'transparent', fontWeight: 'bold', marginBottom: '2px' }}>
                {count > 0 ? count : ''}
              </span>
              <div
                style={{
                  width: '100%',
                  maxHeight: '100%',
                  height: `${Math.max(heightPercent, count > 0 ? 8 : 2)}%`,
                  background: count > 0
                    ? 'linear-gradient(180deg, #ff4d6d 0%, #c9184a 100%)'
                    : 'rgba(255,255,255,0.05)',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.4s ease, opacity 0.2s ease',
                  boxShadow: count > 0 ? '0 2px 8px rgba(255,77,109,0.3)' : 'none'
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '4px', paddingTop: '4px' }}>
        {years.map((year) => (
          <div key={year} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', color: '#94a3b8', transform: 'rotate(-45deg)', transformOrigin: 'top center' }}>
            {String(year).slice(-2)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 2. 献血種別割合（SVG Custom Donut Chart）
// ==========================================
function DonutChart({ typeCounts }) {
  const total = Object.values(typeCounts).reduce((a, b) => a + b, 0);
  const typeColors = { '全血': '#e63946', '血漿': '#3a86ff', '血小板': '#ff9f1c', 'その他': '#7209b7' };

  if (total === 0) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>データなし</div>;
  }

  const items = Object.entries(typeCounts).filter(([_, count]) => count > 0);
  let cumulativePercent = 0;

  const slices = items.map(([type, count]) => {
    const percent = count / total;
    const startAngle = cumulativePercent * 360;
    cumulativePercent += percent;
    const endAngle = cumulativePercent * 360;
    return { type, count, percent, startAngle, endAngle, color: typeColors[type] || '#6e7681' };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '8px 12px', gap: '16px' }}>
      <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          {slices.map((slice, i) => {
            const strokeDasharray = `${slice.percent * 100} ${100 - slice.percent * 100}`;
            const strokeDashoffset = -((slice.startAngle / 360) * 100);
            return (
              <circle
                key={i}
                cx="18"
                cy="18"
                r="15.91549430918954"
                fill="transparent"
                stroke={slice.color}
                strokeWidth="3.8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}
        </svg>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f8fafc', lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>合計回数</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {slices.map((slice) => (
          <div key={slice.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: slice.color }} />
              <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{slice.type}</span>
            </div>
            <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>{slice.count}回 ({Math.round(slice.percent * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 3. 拠点別ランキング TOP 5 (Horizontal Bar Chart)
// ==========================================
function RankingHorizontalBar({ ranking }) {
  const top5 = ranking.slice(0, 5);
  const maxCount = Math.max(...top5.map(r => r.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', justifyContent: 'center', padding: '4px 8px' }}>
      {top5.map((item, idx) => {
        const percent = (item.count / maxCount) * 100;
        return (
          <div key={item.place} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
              <span style={{ color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                <strong style={{ color: idx === 0 ? '#ff6b6b' : '#94a3b8', marginRight: '4px' }}>#{idx + 1}</strong>
                {item.place}
              </span>
              <span style={{ color: '#2ec4b6', fontWeight: 'bold' }}>{item.count} 回</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${percent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #2ec4b6 0%, #20a495 100%)',
                  borderRadius: '3px'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 4. 年代別年間平均比較 (Decade Average Bar)
// ==========================================
function DecadeBarChart({ decadeAverages }) {
  const labels = Object.keys(decadeAverages);
  const values = labels.map(l => parseFloat(decadeAverages[l]));
  const maxVal = Math.max(...values, 1);
  const colors = ['#7209b7', '#3a86ff', '#e63946'];

  return (
    <div style={{ display: 'flex', height: '100%', alignItems: 'flex-end', gap: '16px', padding: '16px 24px 8px 24px', justifyContent: 'space-around' }}>
      {labels.map((decade, idx) => {
        const val = values[idx];
        const heightPercent = (val / maxVal) * 80;
        return (
          <div key={decade} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: colors[idx % colors.length] }}>{val}回/年</span>
            <div
              style={{
                width: '100%',
                maxWidth: '40px',
                height: `${Math.max(heightPercent, 12)}px`,
                backgroundColor: colors[idx % colors.length],
                borderRadius: '6px 6px 0 0',
                boxShadow: `0 4px 12px ${colors[idx % colors.length]}44`
              }}
            />
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{decade}</span>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 5. 月別累計アクティビティ (Monthly Seasonality Bar)
// ==========================================
function MonthlyBarChart({ monthlyCounts }) {
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const maxCount = Math.max(...monthlyCounts, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end', paddingTop: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: '130px', gap: '3px', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {monthNames.map((m, idx) => {
          const count = monthlyCounts[idx] || 0;
          const heightPercent = (count / maxCount) * 100;
          return (
            <div key={m} title={`${m}: ${count}回`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.6rem', color: '#f72585', fontWeight: 'bold', marginBottom: '2px' }}>
                {count > 0 ? count : ''}
              </span>
              <div
                style={{
                  width: '100%',
                  height: `${Math.max(heightPercent, count > 0 ? 6 : 2)}%`,
                  background: 'linear-gradient(180deg, #f72585 0%, #b5179e 100%)',
                  borderRadius: '2px 2px 0 0'
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '3px', paddingTop: '4px' }}>
        {monthNames.map((m) => (
          <div key={m} style={{ flex: 1, textAlign: 'center', fontSize: '0.6rem', color: '#94a3b8' }}>
            {m.replace('月', '')}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 6. 献血間隔（ペース）分布 (Interval Progress Chart)
// ==========================================
function IntervalProgressChart({ intervalGroupCounts, totalCount }) {
  const labels = Object.keys(intervalGroupCounts || {});
  const totalValid = Math.max(1, totalCount - 1);
  const colors = ['#2ec4b6', '#3a86ff', '#ff9f1c', '#7209b7'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', justifyContent: 'center', padding: '4px 8px' }}>
      {labels.map((label, idx) => {
        const count = intervalGroupCounts[label] || 0;
        const percent = Math.round((count / totalValid) * 100);
        return (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
              <span style={{ color: '#e2e8f0' }}>{label}</span>
              <span style={{ color: colors[idx % colors.length], fontWeight: 'bold' }}>{count}回 ({percent}%)</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${percent}%`,
                  height: '100%',
                  backgroundColor: colors[idx % colors.length],
                  borderRadius: '3px'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsView({ analytics }) {
  if (!analytics) {
    return <div className="empty-state glass-panel"><p>データロード中...</p></div>;
  }

  const years = Object.keys(analytics.yearlyMap).sort((a, b) => a - b);
  const yearlyCounts = years.map(y => analytics.yearlyMap[y]);

  return (
    <div className="analytics-view-compact">
      {/* Top KPI Cards */}
      <div className="compact-kpi-row">
        <StatCard
          title="通算献血回数"
          value={analytics.totalCount}
          unit="回"
          subtext={`最新: ${analytics.latestDonationDate}`}
          icon={Award}
          color="red"
        />

        <StatCard
          title="年間平均献血回数"
          value={analytics.yearlyAverage}
          unit="回/年"
          subtext={`活動: ${analytics.elapsedYears}年${analytics.elapsedMonths}ヶ月`}
          icon={TrendingUp}
          color="blue"
        />

        <StatCard
          title="継続期間"
          value={`${analytics.elapsedYears}年${analytics.elapsedMonths}ヶ月`}
          subtext={`平均間隔: ${analytics.avgIntervalDays} 日`}
          icon={Calendar}
          color="purple"
        />

        <StatCard
          title="次回献血目安"
          value={analytics.isNextAvailable ? '献血可能！' : `あと ${analytics.daysUntilNext}日`}
          subtext={analytics.isNextAvailable ? '次回可能日に到達中' : `予定: ${analytics.nextAvailableDate}`}
          icon={Clock}
          color={analytics.isNextAvailable ? 'teal' : 'amber'}
        />
      </div>

      {/* 6 Grid Visualizations */}
      <div className="charts-grid-6">
        <div className="chart-card-compact glass-panel">
          <div className="chart-card-header-compact">
            <span><BarChart3 size={14} color="#e63946" /> ① 年別献血回数推移（2007〜2026）</span>
            <span className="chart-tag">年次</span>
          </div>
          <div className="chart-wrapper-inner">
            <YearlyBarChart years={years} counts={yearlyCounts} />
          </div>
        </div>

        <div className="chart-card-compact glass-panel">
          <div className="chart-card-header-compact">
            <span><Heart size={14} color="#3a86ff" /> ② 献血種別割合</span>
            <span className="chart-tag">全血/成分</span>
          </div>
          <div className="chart-wrapper-inner">
            <DonutChart typeCounts={analytics.typeCounts} />
          </div>
        </div>

        <div className="chart-card-compact glass-panel">
          <div className="chart-card-header-compact">
            <span><MapPin size={14} color="#2ec4b6" /> ③ 拠点別ランキング (TOP 5)</span>
            <span className="chart-tag">拠点</span>
          </div>
          <div className="chart-wrapper-inner">
            <RankingHorizontalBar ranking={analytics.placeRanking} />
          </div>
        </div>

        <div className="chart-card-compact glass-panel">
          <div className="chart-card-header-compact">
            <span><Zap size={14} color="#9d4edd" /> ④ 年代別年間平均比較（00s/10s/20s）</span>
            <span className="chart-tag">年代</span>
          </div>
          <div className="chart-wrapper-inner">
            <DecadeBarChart decadeAverages={analytics.decadeAverages} />
          </div>
        </div>

        <div className="chart-card-compact glass-panel">
          <div className="chart-card-header-compact">
            <span><Activity size={14} color="#f72585" /> ⑤ 月別累計アクティビティ</span>
            <span className="chart-tag">月次</span>
          </div>
          <div className="chart-wrapper-inner">
            <MonthlyBarChart monthlyCounts={analytics.monthlyCounts} />
          </div>
        </div>

        <div className="chart-card-compact glass-panel">
          <div className="chart-card-header-compact">
            <span><Timer size={14} color="#2ec4b6" /> ⑥ 献血間隔（ペース）の分布</span>
            <span className="chart-tag">間隔ペース</span>
          </div>
          <div className="chart-wrapper-inner">
            <IntervalProgressChart intervalGroupCounts={analytics.intervalGroupCounts} totalCount={analytics.totalCount} />
          </div>
        </div>
      </div>
    </div>
  );
}
