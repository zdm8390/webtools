import React, { useState } from 'react';
import { Download, Upload, FileCode, Check, AlertCircle, Copy, FileText, RefreshCw } from 'lucide-react';
import { buildXmlFromRecords, parseXmlToRecords } from '../utils/xmlParser';

export default function XmlManager({ records, onImportRecords, onResetToInitial }) {
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  const xmlText = buildXmlFromRecords(records);

  // XML File Download / Save Trigger
  const handleDownloadXml = () => {
    const blob = new Blob([xmlText], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `blood_donation_records_${new Date().toISOString().split('T')[0]}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // XML File Import Handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const importedRecords = parseXmlToRecords(content);
        if (importedRecords.length === 0) {
          setImportStatus({ type: 'error', message: 'XMLファイルから有効な献血記録が見つかりませんでした。' });
        } else {
          onImportRecords(importedRecords);
          setImportStatus({
            type: 'success',
            message: `XMLファイルから ${importedRecords.length} 件の献血記録を正常に読み込みました！`
          });
        }
      } catch (err) {
        setImportStatus({ type: 'error', message: err.message || 'XMLの解析に失敗しました。' });
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(xmlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="xml-manager-container">
      <div className="section-title-row">
        <h2>
          <FileCode className="icon-title" size={22} />
          XMLデータ管理・保存（インポート / エクスポート）
        </h2>
        <span className="subtitle">
          現在の献血データ（全{records.length}件）をXMLファイルとして保存したり、XMLファイルをアップロードして復元できます。
        </span>
      </div>

      <div className="grid-cols-2 mb-24">
        {/* Export Box */}
        <div className="action-card glass-panel">
          <div className="action-card-header">
            <Download size={24} color="#e63946" />
            <div>
              <h3>XMLファイルとしてダウンロード</h3>
              <p>現在の献血記録（{records.length}件）を標準XML形式でローカルに保存します。</p>
            </div>
          </div>
          <div className="action-card-body">
            <button className="btn btn-primary btn-lg w-full" onClick={handleDownloadXml}>
              <Download size={18} />
              <span>blood_donation_records.xml をダウンロード</span>
            </button>
          </div>
        </div>

        {/* Import Box */}
        <div className="action-card glass-panel">
          <div className="action-card-header">
            <Upload size={24} color="#3a86ff" />
            <div>
              <h3>XMLファイルを読み込み・取り込み</h3>
              <p>保存されたXMLファイルを選択して、アプリ内のデータを一括更新します。</p>
            </div>
          </div>
          <div className="action-card-body">
            <label htmlFor="xml-file-input" className="btn btn-secondary btn-lg w-full file-upload-label">
              <Upload size={18} />
              <span>XMLファイルを選択して読み込む</span>
              <input
                id="xml-file-input"
                name="xmlFile"
                type="file"
                accept=".xml"
                aria-label="XMLファイルを選択して読み込み"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </div>

      {importStatus && (
        <div className={`status-banner ${importStatus.type} mb-24`}>
          {importStatus.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* XML Code Previewer */}
      <div className="xml-preview-card glass-panel">
        <div className="xml-preview-header">
          <div className="flex items-center gap-2">
            <FileText size={18} color="#2ec4b6" />
            <h3>XML構造プレビュー (`kenketsu_data.xml`)</h3>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn btn-outline btn-sm" onClick={onResetToInitial} title="Excelからの初期データ(255件)にリセット">
              <RefreshCw size={14} />
              <span>初期状態に復元</span>
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleCopyXml}>
              {copied ? <Check size={14} color="#2ec4b6" /> : <Copy size={14} />}
              <span>{copied ? 'コピー完了' : 'コードをコピー'}</span>
            </button>
          </div>
        </div>

        <div className="xml-preview-body">
          <pre className="xml-code-block">{xmlText}</pre>
        </div>
      </div>
    </div>
  );
}
