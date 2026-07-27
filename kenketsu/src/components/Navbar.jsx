import React from 'react';
import { Activity, Database, Download, FileCode, Moon, Sun, PlusCircle, HeartHandshake } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, theme, toggleTheme, totalCount, onOpenAddModal, onDownloadXml }) {
  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        <div className="brand" onClick={() => setActiveTab('analytics')}>
          <div className="brand-icon">
            <HeartHandshake className="icon-main" size={22} />
          </div>
          <div className="brand-text">
            <span className="brand-name">HaemaTrack</span>
            <span className="brand-sub">献血マネージャー</span>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Activity size={16} />
            <span>分析・統計</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            <Database size={16} />
            <span>記録一覧 ({totalCount})</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'xml' ? 'active' : ''}`}
            onClick={() => setActiveTab('xml')}
          >
            <FileCode size={16} />
            <span>XMLデータ</span>
          </button>
        </nav>

        <div className="navbar-actions">
          <button className="btn btn-outline btn-sm" onClick={onDownloadXml} title="XMLファイルとして保存">
            <Download size={15} />
            <span>XML保存</span>
          </button>

          <button className="btn btn-primary btn-sm" onClick={onOpenAddModal}>
            <PlusCircle size={15} />
            <span>献血記録を追加</span>
          </button>

          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'ライトモード' : 'ダークモード'}
          >
            {theme === 'dark' ? <Sun size={18} color="#ffb703" /> : <Moon size={18} color="#7209b7" />}
          </button>
        </div>
      </div>
    </header>
  );
}
