import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

export default function RecordTable({ records, onOpenAddModal, onOpenEditModal, onDeleteRecord }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedPlace, setSelectedPlace] = useState('all');
  const [sortField, setSortField] = useState('id');
  const [sortAsc, setSortAsc] = useState(false); // Default latest first
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Extract unique filter options
  const years = useMemo(() => {
    const set = new Set(records.map(r => r.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [records]);

  const places = useMemo(() => {
    const set = new Set(records.map(r => r.place).filter(Boolean));
    return Array.from(set).sort();
  }, [records]);

  const types = useMemo(() => {
    const set = new Set(records.map(r => r.type).filter(Boolean));
    return Array.from(set).sort();
  }, [records]);

  // Filter & Sort
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch =
        !searchTerm ||
        r.date.includes(searchTerm) ||
        r.place.includes(searchTerm) ||
        r.type.includes(searchTerm) ||
        (r.memo && r.memo.includes(searchTerm));

      const matchType = selectedType === 'all' || r.type === selectedType;
      const matchYear = selectedYear === 'all' || String(r.year) === String(selectedYear);
      const matchPlace = selectedPlace === 'all' || r.place === selectedPlace;

      return matchSearch && matchType && matchYear && matchPlace;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'date') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [records, searchTerm, selectedType, selectedYear, selectedPlace, sortField, sortAsc]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getTypeBadgeClass = (type) => {
    if (type === '全血') return 'badge-whole';
    if (type === '血漿') return 'badge-plasma';
    if (type === '血小板') return 'badge-platelet';
    return 'badge-secondary';
  };

  return (
    <div className="record-table-container">
      {/* Table Header & Controls */}
      <div className="table-controls glass-panel">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="日付、場所、種別、メモで検索..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="filters-group">
          {/* Year Filter */}
          <div className="filter-item">
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">すべての年 ({years.length}年間)</option>
              {years.map(y => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="filter-item">
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">すべての種別</option>
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Place Filter */}
          <div className="filter-item">
            <select
              value={selectedPlace}
              onChange={(e) => { setSelectedPlace(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">すべての場所 ({places.length}拠点)</option>
              {places.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <button className="btn btn-primary btn-sm" onClick={onOpenAddModal}>
            <Plus size={16} />
            <span>新規登録</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-wrapper glass-panel">
        <table className="custom-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} className="sortable">
                通算回数 <ArrowUpDown size={14} />
              </th>
              <th onClick={() => handleSort('date')} className="sortable">
                献血日 <ArrowUpDown size={14} />
              </th>
              <th>種別</th>
              <th onClick={() => handleSort('place')} className="sortable">
                献血場所 <ArrowUpDown size={14} />
              </th>
              <th>メモ・詳細</th>
              <th className="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-20">
                  該当する献血記録が見つかりません。
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r) => (
                <tr key={r.id}>
                  <td className="font-bold text-accent">#{r.id}</td>
                  <td className="font-semibold">{r.date}</td>
                  <td>
                    <span className={`badge ${getTypeBadgeClass(r.type)}`}>
                      {r.type}
                    </span>
                  </td>
                  <td>{r.place}</td>
                  <td className="text-muted">{r.memo || '-'}</td>
                  <td className="text-right actions-cell">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => onOpenEditModal(r)}
                      title="編集"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => onDeleteRecord(r.id)}
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="pagination-bar">
        <span className="pagination-info">
          全 {filteredRecords.length} 件中 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredRecords.length)} 件を表示
        </span>

        <div className="pagination-controls">
          <button
            className="btn btn-outline btn-sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            <ChevronLeft size={16} />
            前へ
          </button>
          <span className="page-number">
            {currentPage} / {totalPages}
          </span>
          <button
            className="btn btn-outline btn-sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            次へ
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
