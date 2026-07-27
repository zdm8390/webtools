import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsView({ analytics, records, theme }) {
  if (!analytics) {
    return <div className="empty-state glass-panel"><p>データロード中...</p></div>;
  }

  const textColor = theme === 'dark' ? '#c9d1d9' : '#24292f';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  // ----------------------------------------------------
  // Chart 1: Yearly History (2007-2026)
  // ----------------------------------------------------
  const years = Object.keys(analytics.yearlyMap).sort((a, b) => a - b);
  const yearlyCounts = years.map(y => analytics.yearlyMap[y]);

  const yearlyChartData = {
    labels: years.map(y => `${y}`),
    datasets: [
      {
        type: 'bar',
        label: '回数',
        data: yearlyCounts,
        backgroundColor: 'rgba(230, 57, 70, 0.8)',
        borderColor: '#e63946',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        type: 'line',
        label: 'トレンド',
        data: yearlyCounts,
        borderColor: '#ff9f1c',
        borderWidth: 1.5,
        pointRadius: 2,
        tension: 0.3,
      }
    ],
  };

  const yearlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { ticks: { color: textColor, font: { size: 9 } }, grid: { display: false } },
      y: { ticks: { color: textColor, precision: 0, font: { size: 9 } }, grid: { color: gridColor }, beginAtZero: true }
    }
  };

  // ----------------------------------------------------
  // Chart 2: Donation Type Distribution (Doughnut)
  // ----------------------------------------------------
  const typeLabels = Object.keys(analytics.typeCounts).filter(k => analytics.typeCounts[k] > 0);
  const typeData = typeLabels.map(k => analytics.typeCounts[k]);
  const typeColors = { '全血': '#e63946', '血漿': '#3a86ff', '血小板': '#ff9f1c', 'その他': '#7209b7' };

  const doughnutData = {
    labels: typeLabels,
    datasets: [
      {
        data: typeData,
        backgroundColor: typeLabels.map(t => typeColors[t] || '#6e7681'),
        borderColor: theme === 'dark' ? '#161b22' : '#ffffff',
        borderWidth: 2,
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: textColor, font: { family: 'Inter', size: 10 } }
      }
    },
    cutout: '62%'
  };

  // ----------------------------------------------------
  // Chart 3: Top Places Ranking (Horizontal Bar)
  // ----------------------------------------------------
  const topPlaces = analytics.placeRanking.slice(0, 5);
  const placeChartData = {
    labels: topPlaces.map(p => p.place),
    datasets: [
      {
        label: '回数',
        data: topPlaces.map(p => p.count),
        backgroundColor: 'rgba(46, 196, 182, 0.8)',
        borderColor: '#2ec4b6',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const placeChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: textColor, precision: 0, font: { size: 9 } }, grid: { color: gridColor }, beginAtZero: true },
      y: { ticks: { color: textColor, font: { size: 9 } }, grid: { display: false } }
    }
  };

  // ----------------------------------------------------
  // Chart 4: Decade Averages Comparison
  // ----------------------------------------------------
  const decadeLabels = Object.keys(analytics.decadeAverages);
  const decadeValues = decadeLabels.map(d => parseFloat(analytics.decadeAverages[d]));

  const decadeChartData = {
    labels: decadeLabels,
    datasets: [
      {
        label: '年間平均 (回/年)',
        data: decadeValues,
        backgroundColor: ['rgba(114, 9, 183, 0.8)', 'rgba(58, 134, 255, 0.8)', 'rgba(230, 57, 70, 0.8)'],
        borderColor: ['#7209b7', '#3a86ff', '#e63946'],
        borderWidth: 1.5,
        borderRadius: 6,
      }
    ]
  };

  const decadeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: textColor, font: { size: 9 } }, grid: { color: gridColor }, beginAtZero: true }
    }
  };

  // ----------------------------------------------------
  // Chart 5: Monthly Seasonality (1月〜12月)
  // ----------------------------------------------------
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const monthlyChartData = {
    labels: monthNames,
    datasets: [
      {
        label: '累計回数',
        data: analytics.monthlyCounts,
        backgroundColor: 'rgba(247, 37, 133, 0.75)',
        borderColor: '#f72585',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: textColor, font: { size: 9 } }, grid: { display: false } },
      y: { ticks: { color: textColor, font: { size: 9 } }, grid: { color: gridColor }, beginAtZero: true }
    }
  };

  // ----------------------------------------------------
  // Chart 6 (REPLACED): Donation Interval Pace Distribution (間隔ペースの分布)
  // ----------------------------------------------------
  const intervalLabels = Object.keys(analytics.intervalGroupCounts || {});
  const intervalValues = intervalLabels.map(k => analytics.intervalGroupCounts[k]);
  const intervalColors = [
    'rgba(46, 196, 182, 0.85)', // 14-16日 (最速) - Teal
    'rgba(58, 134, 255, 0.85)', // 17-30日 - Blue
    'rgba(255, 159, 28, 0.85)', // 31-60日 - Amber
    'rgba(114, 9, 183, 0.85)'   // 61日以上 - Purple
  ];

  const intervalChartData = {
    labels: intervalLabels,
    datasets: [
      {
        label: '回数',
        data: intervalValues,
        backgroundColor: intervalColors,
        borderRadius: 5,
      }
    ]
  };

  const intervalChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` 該当回数: ${ctx.parsed.y} 回 (${Math.round((ctx.parsed.y / Math.max(1, analytics.totalCount - 1)) * 100)}%)`
        }
      }
    },
    scales: {
      x: { ticks: { color: textColor, font: { size: 9 } }, grid: { display: false } },
      y: { ticks: { color: textColor, font: { size: 9 } }, grid: { color: gridColor }, beginAtZero: true }
    }
  };

  return (
    <div className="analytics-view-compact">
      {/* Top Compact KPI Cards Row */}
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

      {/* 6-Chart Grid (3x2 Layout fitting 100vh) */}
      <div className="charts-grid-6">
        {/* 1. Yearly History */}
        <div className="chart-card-compact glass-panel">
          <div className="chart-card-header-compact">
            <span><BarChart3 size={14} color="#e63946" /> ① 年別献血回数推移（2007〜2026）</span>
            <span className="chart-tag">年次</span>
          </div>
          <div className="chart-wrapper-inner">
            <Bar data={yearlyChartData} options={yearlyChartOptions} />
          </div>
        </div>

        {/* 2. Type Ratio */}
        <div className="chart-card-compact glass-panel">
          <div className="chart-card-header-compact">
            <span><Heart size={14} color="#3a86ff" /> ② 献血種別割合</span>
            <span className="chart-tag">全血/成分</span>
          </div>
          <div className="chart-wrapper-inner">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

        {/* 3. Top Places */}
        <div className="chart-card-compact glass-panel">
          <div className="chart-card-header-compact">
            <span><MapPin size={14} color="#2ec4b6" /> ③ 拠点別ランキング (TOP 5)</span>
            <span className="chart-tag">拠点</span>
          </div>
          <div className="chart-wrapper-inner">
            <Bar data={placeChartData} options={placeChartOptions} />
          </div>
        </div>

        {/* 4. Decade Comparison */}
        <div className="chart-card-compact glass-panel">
          <div className="chart-card-header-compact">
            <span><Zap size={14} color="#9d4edd" /> ④ 年代別年間平均比較（00s/10s/20s）</span>
            <span className="chart-tag">年代</span>
          </div>
          <div className="chart-wrapper-inner">
            <Bar data={decadeChartData} options={decadeChartOptions} />
          </div>
        </div>

        {/* 5. Monthly Seasonality */}
        <div className="chart-card-compact glass-panel">
          <div className="chart-card-header-compact">
            <span><Activity size={14} color="#f72585" /> ⑤ 月別累計アクティビティ</span>
            <span className="chart-tag">月次</span>
          </div>
          <div className="chart-wrapper-inner">
            <Bar data={monthlyChartData} options={monthlyChartOptions} />
          </div>
        </div>

        {/* 6. REPLACED: Interval Pace Distribution */}
        <div className="chart-card-compact glass-panel">
          <div className="chart-card-header-compact">
            <span><Timer size={14} color="#2ec4b6" /> ⑥ 献血間隔（ペース）の分布</span>
            <span className="chart-tag">間隔ペース</span>
          </div>
          <div className="chart-wrapper-inner">
            <Bar data={intervalChartData} options={intervalChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
