import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Heart, FileText, CheckCircle } from 'lucide-react';

export default function RecordModal({ isOpen, onClose, onSave, editingRecord, defaultPlaces = [] }) {
  const presetPlaces = [
    'ミント', 'にしきた', '三重（新）', '明石', 'さんさん', '伊勢',
    '四日市', 'センタープラザ', '阪急グランドビル', '姫路', '大阪府', '福井'
  ];

  const allPlaces = Array.from(new Set([...presetPlaces, ...defaultPlaces])).filter(Boolean).sort();

  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    type: '血漿',
    place: 'ミント',
    memo: ''
  });

  const [isCustomPlace, setIsCustomPlace] = useState(false);

  useEffect(() => {
    if (editingRecord) {
      const placeVal = editingRecord.place || (allPlaces[0] || 'ミント');
      const isCustom = placeVal ? !allPlaces.includes(placeVal) : false;
      setIsCustomPlace(isCustom);
      setFormData({
        id: editingRecord.id,
        date: editingRecord.date || new Date().toISOString().split('T')[0],
        type: editingRecord.type || '血漿',
        place: placeVal,
        memo: editingRecord.memo || ''
      });
    } else {
      setIsCustomPlace(false);
      setFormData({
        id: '',
        date: new Date().toISOString().split('T')[0],
        type: '血漿',
        place: allPlaces.includes('ミント') ? 'ミント' : (allPlaces[0] || ''),
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
            <select
              value={isCustomPlace ? 'custom' : formData.place}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'custom') {
                  setIsCustomPlace(true);
                  setFormData({ ...formData, place: '' });
                } else {
                  setIsCustomPlace(false);
                  setFormData({ ...formData, place: val });
                }
              }}
              className="select-input"
              required={!isCustomPlace}
            >
              <option value="" disabled>場所を選択してください</option>
              {allPlaces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="custom">✏️ + 新しい場所を直接入力...</option>
            </select>

            {isCustomPlace && (
              <input
                type="text"
                value={formData.place}
                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                placeholder="新しい献血場所の名前を入力"
                style={{ marginTop: '8px' }}
                required
              />
            )}
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

