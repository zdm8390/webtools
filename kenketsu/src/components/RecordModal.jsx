import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, MapPin, Heart, FileText, CheckCircle } from 'lucide-react';

export default function RecordModal({ isOpen, onClose, onSave, editingRecord, defaultPlaces = [] }) {
  const presetPlaces = [
    'ミント', 'にしきた', '三重（新）', '明石', 'さんさん', '伊勢',
    '四日市', 'センタープラザ', '阪急グランドビル', '姫路', '大阪府', '福井'
  ];

  const allPlaces = useMemo(() => {
    return Array.from(new Set([...presetPlaces, ...defaultPlaces])).filter(Boolean).sort();
  }, [defaultPlaces]);

  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    type: '血漿',
    place: 'ミント',
    memo: ''
  });

  const [isCustomPlace, setIsCustomPlace] = useState(false);
  const [customPlaceText, setCustomPlaceText] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (editingRecord) {
      const p = editingRecord.place || 'ミント';
      const isCustom = !allPlaces.includes(p);
      setIsCustomPlace(isCustom);
      if (isCustom) {
        setCustomPlaceText(p);
      } else {
        setCustomPlaceText('');
      }

      setFormData({
        id: editingRecord.id,
        date: editingRecord.date || new Date().toISOString().split('T')[0],
        type: editingRecord.type || '血漿',
        place: p,
        memo: editingRecord.memo || ''
      });
    } else {
      setIsCustomPlace(false);
      setCustomPlaceText('');
      const defaultPlace = allPlaces.includes('ミント') ? 'ミント' : (allPlaces[0] || 'ミント');
      setFormData({
        id: '',
        date: new Date().toISOString().split('T')[0],
        type: '血漿',
        place: defaultPlace,
        memo: ''
      });
    }
  }, [editingRecord, isOpen, allPlaces]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const finalPlace = isCustomPlace ? customPlaceText.trim() : formData.place;

    if (!formData.date || !formData.type || !finalPlace) {
      alert('日付、種別、献血場所を入力してください。');
      return;
    }

    const year = parseInt(formData.date.substring(0, 4), 10);
    const dateObj = new Date(formData.date);
    const yearMonth = `${year}/${dateObj.getMonth() + 1}`;

    onSave({
      ...formData,
      place: finalPlace,
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
          <button type="button" className="close-btn" onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="donation-date">
              <Calendar size={16} /> 献血実施日 *
            </label>
            <input
              id="donation-date"
              name="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label id="donation-type-label">
              <Heart size={16} /> 献血種別 *
            </label>
            <div className="type-radio-group" role="radiogroup" aria-labelledby="donation-type-label">
              {['血漿', '血小板', '全血'].map((t, idx) => (
                <label key={t} htmlFor={`donation-type-${idx}`} className={`type-radio-btn ${formData.type === t ? 'active' : ''}`}>
                  <input
                    id={`donation-type-${idx}`}
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
            <label htmlFor="donation-place">
              <MapPin size={16} /> 献血場所 / ルーム名 *
            </label>
            <select
              id="donation-place"
              name="place"
              value={isCustomPlace ? 'custom' : formData.place}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'custom') {
                  setIsCustomPlace(true);
                } else {
                  setIsCustomPlace(false);
                  setFormData({ ...formData, place: val });
                }
              }}
              className="select-input"
            >
              {allPlaces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="custom">✏️ + 新しい場所を直接入力...</option>
            </select>

            {isCustomPlace && (
              <input
                id="donation-place-custom"
                name="customPlace"
                type="text"
                value={customPlaceText}
                onChange={(e) => setCustomPlaceText(e.target.value)}
                placeholder="新しい献血場所の名前を入力してください"
                style={{ marginTop: '8px' }}
                required
              />
            )}
          </div>

          <div className="form-group">
            <label htmlFor="donation-memo">
              <FileText size={16} /> メモ・成分データ・体調等
            </label>
            <textarea
              id="donation-memo"
              name="memo"
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
