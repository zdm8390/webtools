import React, { useState, useEffect, useMemo, Component } from 'react';
import Navbar from './components/Navbar';
import AnalyticsView from './components/AnalyticsView';
import RecordTable from './components/RecordTable';
import RecordModal from './components/RecordModal';
import XmlManager from './components/XmlManager';
import { parseXmlToRecords, calculateAnalytics, buildXmlFromRecords } from './utils/xmlParser';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('haema_records_v1');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <h2 style={{ fontSize: '1.8rem', color: '#f43f5e', marginBottom: '12px' }}>⚠️ 画面の描画中にエラーが発生しました</h2>
          <p style={{ color: '#94a3b8', marginBottom: '20px', maxWidth: '500px' }}>
            保存されたデータキャッシュとの互換性問題、または予期せぬエラーが発生した可能性があります。
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#e63946',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              キャッシュを初期化して再読み込み
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'records', 'xml'
  const [theme, setTheme] = useState(() => localStorage.getItem('haema_theme') || 'dark');
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('haema_theme', theme);
  }, [theme]);

  useEffect(() => {
    // サーバー上の kenketsu_data.xml をプライマリデータ（単一の真実源）として読み込む
    fetch(`./kenketsu_data.xml?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.text();
      })
      .then((xmlText) => {
        const parsedRecords = parseXmlToRecords(xmlText);
        setRecords(parsedRecords);
        localStorage.setItem('haema_records_v1', JSON.stringify(parsedRecords));
      })
      .catch((err) => {
        console.error('サーバーのXML読み込み失敗、ローカルキャッシュにフォールバックします:', err);
        const savedRecords = localStorage.getItem('haema_records_v1');
        if (savedRecords) {
          try {
            setRecords(JSON.parse(savedRecords));
          } catch (e) {
            console.error('キャッシュ解析エラー:', e);
          }
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const updateRecords = (newRecords) => {
    const sorted = [...newRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
    setRecords(sorted);
    localStorage.setItem('haema_records_v1', JSON.stringify(sorted));

    // 自動的にXMLファイル（kenketsu_data.xml）へ書き込み保存
    try {
      const xmlText = buildXmlFromRecords(sorted);
      fetch('/api/save-xml', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: xmlText,
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          console.log('XMLファイル(kenketsu_data.xml)を更新しました');
          showToast('✅ 記録を保存し kenketsu_data.xml に反映しました');
        }
      })
      .catch((err) => {
        console.error('XMLの自動保存に失敗しました:', err);
        showToast('⚠️ kenketsu_data.xml への保存に失敗しました', 'error');
      });
    } catch (err) {
      console.error('XML構築エラー:', err);
    }
  };

  const analytics = useMemo(() => calculateAnalytics(records), [records]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleDownloadXml = () => {
    const xmlText = buildXmlFromRecords(records);
    const blob = new Blob([xmlText], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `blood_donation_records_${new Date().toISOString().split('T')[0]}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsRecordModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setEditingRecord(record);
    setIsRecordModalOpen(true);
  };

  const handleSaveRecord = (recordData) => {
    if (editingRecord) {
      const updated = records.map(r => r.id === editingRecord.id ? { ...recordData, id: editingRecord.id } : r);
      updateRecords(updated);
    } else {
      const maxId = records.reduce((max, r) => Math.max(max, r.id || 0), 0);
      const newRec = { ...recordData, id: maxId + 1 };
      updateRecords([...records, newRec]);
    }
  };

  const handleDeleteRecord = (id) => {
    if (window.confirm(`通算第 ${id} 回の献血記録を削除してもよろしいですか？`)) {
      const updated = records.filter(r => r.id !== id);
      updateRecords(updated);
    }
  };

  const handleImportRecords = (imported) => {
    updateRecords(imported);
    setActiveTab('analytics');
  };

  const handleResetToInitial = () => {
    if (window.confirm('初期のExcel変換データ（255件）にリセットしますか？')) {
      fetch('./kenketsu_data.xml')
        .then((res) => res.text())
        .then((xmlText) => {
          const parsedRecords = parseXmlToRecords(xmlText);
          updateRecords(parsedRecords);
          alert('初期データの255件に復元しました。');
        });
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>献血データ（kenketsu_data.xml）をロード中...</p>
      </div>
    );
  }

  return (
    <div className="app-viewport-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        totalCount={records.length}
        onOpenAddModal={handleOpenAddModal}
        onDownloadXml={handleDownloadXml}
      />

      <main className="main-viewport-content">
        {activeTab === 'analytics' && (
          <AnalyticsView analytics={analytics} records={records} theme={theme} />
        )}

        {activeTab === 'records' && (
          <RecordTable
            records={records}
            onOpenAddModal={handleOpenAddModal}
            onOpenEditModal={handleOpenEditModal}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {activeTab === 'xml' && (
          <XmlManager
            records={records}
            onImportRecords={handleImportRecords}
            onResetToInitial={handleResetToInitial}
          />
        )}
      </main>

      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={handleSaveRecord}
        editingRecord={editingRecord}
        defaultPlaces={analytics ? analytics.placeRanking.map(p => p.place) : []}
      />

      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '40px',
          right: '24px',
          backgroundColor: toastMessage.type === 'error' ? '#d62828' : '#10b981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          zIndex: 9999
        }}>
          {toastMessage.text}
        </div>
      )}

      <footer className="compact-footer">
        <span>© 2026 HaemaTrack 献血ライフマネージャー</span>
        <span>全 {records.length} 件のデータ登録済み</span>
      </footer>
    </div>
  );
}
