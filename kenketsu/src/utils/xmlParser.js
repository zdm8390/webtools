/**
 * XML parsing & building utilities for blood donation records
 */

export function parseXmlToRecords(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('XMLの形式が正しくありません: ' + parserError.textContent);
  }

  const recordNodes = xmlDoc.querySelectorAll('record');
  const records = [];

  recordNodes.forEach((node, index) => {
    const id = parseInt(node.getAttribute('id') || (index + 1), 10);
    const date = node.querySelector('date')?.textContent?.trim() || '';
    const year = parseInt(node.querySelector('year')?.textContent?.trim() || date.substring(0, 4), 10);
    const yearMonth = node.querySelector('yearMonth')?.textContent?.trim() || date.substring(0, 7).replace('-', '/');
    const type = node.querySelector('type')?.textContent?.trim() || '';
    const place = node.querySelector('place')?.textContent?.trim() || '';
    const memo = node.querySelector('memo')?.textContent?.trim() || '';

    if (date) {
      records.push({
        id,
        date,
        year: isNaN(year) ? parseInt(date.substring(0, 4), 10) : year,
        yearMonth,
        type,
        place,
        memo
      });
    }
  });

  // Sort by date ascending or id
  return records.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function buildXmlFromRecords(records) {
  // Sort records by date
  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const nowStr = new Date().toISOString().split('.')[0];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<bloodDonationData version="1.0" exportedAt="${nowStr}">\n`;
  xml += `  <meta>\n`;
  xml += `    <title>献血記録データ</title>\n`;
  xml += `    <author>献血ライフマネージャー</author>\n`;
  xml += `    <totalCount>${sorted.length}</totalCount>\n`;
  xml += `  </meta>\n`;
  xml += `  <records>\n`;

  sorted.forEach((rec, idx) => {
    const id = rec.id || idx + 1;
    const year = rec.year || rec.date.substring(0, 4);
    const dateObj = new Date(rec.date);
    const yearMonth = rec.yearMonth || `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}`;

    xml += `    <record id="${id}">\n`;
    xml += `      <date>${escapeXml(rec.date)}</date>\n`;
    xml += `      <year>${year}</year>\n`;
    xml += `      <yearMonth>${escapeXml(yearMonth)}</yearMonth>\n`;
    xml += `      <type>${escapeXml(rec.type)}</type>\n`;
    xml += `      <place>${escapeXml(rec.place)}</place>\n`;
    if (rec.memo) {
      xml += `      <memo>${escapeXml(rec.memo)}</memo>\n`;
    }
    xml += `    </record>\n`;
  });

  xml += `  </records>\n`;
  xml += `</bloodDonationData>`;

  return xml;
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Calculate deep statistics from donation records
 */
export function calculateAnalytics(records) {
  if (!records || records.length === 0) {
    return null;
  }

  const totalCount = records.length;
  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const firstDonation = sorted[0];
  const latestDonation = sorted[sorted.length - 1];

  const firstDate = new Date(firstDonation.date);
  const latestDate = new Date(latestDonation.date);
  const today = new Date();

  // Elapsed years & months from first donation
  const totalDays = Math.floor((today - firstDate) / (1000 * 60 * 60 * 24));
  const elapsedYears = Math.floor(totalDays / 365.25);
  const elapsedMonths = Math.floor((totalDays % 365.25) / 30.4375);
  const elapsedDays = Math.floor((totalDays % 365.25) % 30.4375);

  // Type counts
  const typeCounts = { '全血': 0, '血漿': 0, '血小板': 0, 'その他': 0 };
  records.forEach(r => {
    if (typeCounts[r.type] !== undefined) {
      typeCounts[r.type]++;
    } else {
      typeCounts['その他']++;
    }
  });

  // Yearly counts
  const yearlyMap = {};
  records.forEach(r => {
    const y = r.year || parseInt(r.date.substring(0, 4), 10);
    yearlyMap[y] = (yearlyMap[y] || 0) + 1;
  });

  const years = Object.keys(yearlyMap).map(Number).sort((a, b) => a - b);
  const minYear = years[0] || new Date().getFullYear();
  const maxYear = years[years.length - 1] || new Date().getFullYear();
  const activeYearSpan = maxYear - minYear + 1;

  const yearlyAverage = activeYearSpan > 0 ? (totalCount / activeYearSpan).toFixed(1) : 0;

  // Decade stats (00s, 10s, 20s)
  const decadeMap = { '00年代': { total: 0, years: new Set() }, '10年代': { total: 0, years: new Set() }, '20年代': { total: 0, years: new Set() } };
  
  years.forEach(y => {
    const count = yearlyMap[y];
    if (y >= 2000 && y < 2010) {
      decadeMap['00年代'].total += count;
      decadeMap['00年代'].years.add(y);
    } else if (y >= 2010 && y < 2020) {
      decadeMap['10年代'].total += count;
      decadeMap['10年代'].years.add(y);
    } else if (y >= 2020) {
      decadeMap['20年代'].total += count;
      decadeMap['20年代'].years.add(y);
    }
  });

  const decadeAverages = {
    '00年代': decadeMap['00年代'].years.size > 0 ? (decadeMap['00年代'].total / decadeMap['00年代'].years.size).toFixed(1) : 0,
    '10年代': decadeMap['10年代'].years.size > 0 ? (decadeMap['10年代'].total / decadeMap['10年代'].years.size).toFixed(1) : 0,
    '20年代': decadeMap['20年代'].years.size > 0 ? (decadeMap['20年代'].total / decadeMap['20年代'].years.size).toFixed(1) : 0,
  };

  // Place counts & ranking
  const placeMap = {};
  records.forEach(r => {
    const p = r.place || '未指定';
    placeMap[p] = (placeMap[p] || 0) + 1;
  });

  const placeRanking = Object.entries(placeMap)
    .map(([place, count]) => ({ place, count }))
    .sort((a, b) => b.count - a.count);

  // Monthly counts (1 to 12)
  const monthlyCounts = Array(12).fill(0);
  records.forEach(r => {
    const m = new Date(r.date).getMonth();
    if (!isNaN(m)) monthlyCounts[m]++;
  });

  // Day of week counts (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
  const dayOfWeekCounts = Array(7).fill(0);
  records.forEach(r => {
    const day = new Date(r.date).getDay();
    if (!isNaN(day)) dayOfWeekCounts[day]++;
  });

  // Calculate average interval in days & interval distribution groups
  let intervalSum = 0;
  let intervalCount = 0;
  const intervalGroupCounts = {
    '14〜16日 (最速)': 0,
    '17〜30日 (1ヶ月内)': 0,
    '31〜60日 (2ヶ月内)': 0,
    '61日以上': 0
  };

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const diffDays = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0) {
      intervalSum += diffDays;
      intervalCount++;

      if (diffDays >= 14 && diffDays <= 16) {
        intervalGroupCounts['14〜16日 (最速)']++;
      } else if (diffDays >= 17 && diffDays <= 30) {
        intervalGroupCounts['17〜30日 (1ヶ月内)']++;
      } else if (diffDays >= 31 && diffDays <= 60) {
        intervalGroupCounts['31〜60日 (2ヶ月内)']++;
      } else {
        intervalGroupCounts['61日以上']++;
      }
    }
  }
  const avgIntervalDays = intervalCount > 0 ? Math.round(intervalSum / intervalCount) : 0;

  // Next possible donation date estimation (Plasma/Platelet 2 weeks, Whole 8-12 weeks)
  const daysSinceLatest = Math.floor((today - latestDate) / (1000 * 60 * 60 * 24));
  let requiredWaitDays = 14; // default component blood
  if (latestDonation.type === '全血') {
    requiredWaitDays = 56; // 8 weeks
  }

  const daysUntilNext = Math.max(0, requiredWaitDays - daysSinceLatest);
  const nextAvailableDate = new Date(latestDate);
  nextAvailableDate.setDate(nextAvailableDate.getDate() + requiredWaitDays);

  return {
    totalCount,
    firstDonationDate: firstDonation.date,
    latestDonationDate: latestDonation.date,
    elapsedYears,
    elapsedMonths,
    elapsedDays,
    typeCounts,
    yearlyMap,
    yearlyAverage,
    decadeAverages,
    placeRanking,
    monthlyCounts,
    dayOfWeekCounts,
    intervalGroupCounts,
    avgIntervalDays,
    daysSinceLatest,
    daysUntilNext,
    nextAvailableDate: nextAvailableDate.toISOString().split('T')[0],
    isNextAvailable: daysUntilNext === 0
  };
}
