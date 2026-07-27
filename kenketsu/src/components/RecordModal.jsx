import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Heart, FileText, CheckCircle } from 'lucide-react';

export default function RecordModal({ isOpen, onClose, onSave, editingRecord, defaultPlaces = [] }) {
  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    type: '血漿',
    place: 'ミント',
    memo: ''
  });

  const presetPlaces = [
    'ミント', 'にしきた', '三重（新）', '明石', 'さんさん', '伊勢',
    '四日市', 'センタープラザ', '阪急グランドビル', '姫路', '大阪府', '福井'
  ];

  const allPlaces = Array.from(new Set([...presetPlaces, ...defaultPlaces])).sort();

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        id: editingRecord.id,
        date: editingRecord.date || new Date().toISOString().split('T')[0],
        type: editingRecord.type || '血漿',
        place: editingRecord.place || 'ミント',
        memo: editingRecord.memo || ''
      });
    } else {
      setFormData({
        id: '',
        date: new Date().toISOString().split('T')[0],
        type: '血漿',
        place: 'ミント',
        memo: ''
      });
    }
  }, [editingRecord, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date || !formData.type || !formData.place) {
      alert('日付、種別、場所を入力してください。');
      return;
    }

    const year = parseInt(formData.date.substring(0, 4), 10);
    const dateObj = new Date(formData.date);
    const yearMonth = `${year}/${dateObj.getMonth() + 1}`;

    onSave({
      ...formData,
      year,
      yearMonth
    });

    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h3>{editingRecord ? '献血記録の編集' : '新規献血記録の登録'}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>
              <Calendar size={16} /> 献血実施日 *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <Heart size={16} /> 献血種別 *
            </label>
            <div className="type-radio-group">
              {['血漿', '血小板', '全血'].map((t) => (
                <label key={t} className={`type-radio-btn ${formData.type === t ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="donationType"
                    value={t}
                    checked={formData.type === t}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>
              <MapPin size={16} /> 献血場所 / ルーム名 *
            </label>
            <input
              type="text"
              list="place-suggestions"
              value={formData.place}
              onChange={(e) => setFormData({ ...formData, place: e.target.value })}
              placeholder="場所を入力または選択"
              required
            />
            <datalist id="place-suggestions">
              {allPlaces.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label>
              <FileText size={16} /> メモ・成分データ・体調等
            </label>
            <textarea
              rows={3}
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              placeholder="例: ヘモグロビン値 14.5g/dL, 次回予約済みなど"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary">
              <CheckCircle size={18} />
              <span>{editingRecord ? '更新を保存' : '記録を保存'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
