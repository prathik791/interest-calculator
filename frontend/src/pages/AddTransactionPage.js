import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import API from '../utils/api';
import { calculateInterest, formatCurrency } from '../utils/calculations';
import toast from 'react-hot-toast';

export default function AddTransactionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    personName: '', contact: '', amount: '', interestRate: '',
    interestType: 'simple', type: 'given', date: new Date().toISOString().split('T')[0],
    dueDate: '', paymentMode: 'cash', notes: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (isEdit) {
      API.get(`/transactions/list`).then((res) => {
        const tx = res.data.data.find((t) => t._id === id);
        if (tx) {
          setForm({
            personName: tx.personName || '',
            contact: tx.contact || '',
            amount: tx.amount?.toString() || '',
            interestRate: tx.interestRate?.toString() || '',
            interestType: tx.interestType || 'simple',
            type: tx.type || 'given',
            date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : '',
            dueDate: tx.dueDate ? new Date(tx.dueDate).toISOString().split('T')[0] : '',
            paymentMode: tx.paymentMode || 'cash',
            notes: tx.notes || '',
          });
        }
      });
    }
  }, [id, isEdit]);

  const calc = (form.amount && form.interestRate && form.date)
    ? calculateInterest(form.amount, form.interestRate, form.date)
    : null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.personName || !form.amount || !form.interestRate) {
      return toast.error('Please fill required fields');
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
      if (file) formData.append('screenshot', file);

      if (isEdit) {
        await API.put(`/transactions/update/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Transaction updated!');
      } else {
        await API.post('/transactions/add', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Transaction added!');
      }
      navigate('/transactions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <Link to="/transactions" className="btn btn-ghost btn-sm">← Back</Link>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800' }}>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            {isEdit ? 'Update transaction details' : 'Record a new loan or borrowing'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Form */}
        <div className="card fade-in" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Type toggle */}
            <div>
              <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>Transaction Type</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['given', 'taken'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)',
                      border: `2px solid ${form.type === t ? (t === 'given' ? 'var(--green)' : 'var(--red)') : 'var(--border)'}`,
                      background: form.type === t ? (t === 'given' ? 'var(--green-glow)' : 'var(--red-glow)') : 'var(--bg-secondary)',
                      color: form.type === t ? (t === 'given' ? 'var(--green)' : 'var(--red)') : 'var(--text-muted)',
                      cursor: 'pointer', fontFamily: 'Syne, sans-serif',
                      fontWeight: '700', fontSize: '14px', textTransform: 'capitalize',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {t === 'given' ? '↑ Money Given' : '↓ Money Taken'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Person Name *</label>
                <input type="text" name="personName" className="form-input" placeholder="Full name"
                  value={form.personName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Contact</label>
                <input type="text" name="contact" className="form-input" placeholder="Phone / Email"
                  value={form.contact} onChange={handleChange} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input type="number" name="amount" className="form-input" placeholder="50000"
                  value={form.amount} onChange={handleChange} min="0.01" step="0.01" required />
              </div>
              <div className="form-group">
                <label className="form-label">Interest Rate (% p.a.) *</label>
                <input type="number" name="interestRate" className="form-input" placeholder="12"
                  value={form.interestRate} onChange={handleChange} min="0" max="100" step="0.01" required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Interest Type</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[{ v: 'simple', l: 'Simple Interest' }, { v: 'compound', l: 'Compound Interest' }].map((opt) => (
                  <button key={opt.v} type="button"
                    onClick={() => setForm({ ...form, interestType: opt.v })}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                      border: `2px solid ${form.interestType === opt.v ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.interestType === opt.v ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                      color: form.interestType === opt.v ? 'var(--accent)' : 'var(--text-muted)',
                      cursor: 'pointer', fontFamily: 'Syne, sans-serif',
                      fontWeight: '600', fontSize: '13px', transition: 'all 0.15s ease',
                    }}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" name="date" className="form-input"
                  value={form.date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" name="dueDate" className="form-input"
                  value={form.dueDate} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select name="paymentMode" className="form-select" value={form.paymentMode} onChange={handleChange}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea name="notes" className="form-textarea" placeholder="Any additional notes..."
                value={form.notes} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Screenshot / Document</label>
              <div style={{
                border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)',
                padding: '20px', textAlign: 'center', cursor: 'pointer',
                background: 'var(--bg-secondary)', transition: 'border-color 0.15s',
              }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFileChange({ target: { files: e.dataTransfer.files } }); }}
              >
                {preview ? (
                  <div>
                    <img src={preview} alt="preview" style={{ maxHeight: '120px', borderRadius: '8px', marginBottom: '8px' }} />
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {file?.name} <button type="button" onClick={() => { setFile(null); setPreview(null); }}
                        style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>📎</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      Drop file here or{' '}
                      <label style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: '600' }}>
                        browse
                        <input type="file" accept="image/*,.pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                      </label>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>JPG, PNG, PDF up to 5MB</div>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ flex: 1, justifyContent: 'center', padding: '14px' }}>
                {loading ? 'Saving...' : (isEdit ? '✓ Update Transaction' : '⊕ Add Transaction')}
              </button>
              <Link to="/transactions" className="btn btn-ghost" style={{ padding: '14px 24px' }}>Cancel</Link>
            </div>
          </form>
        </div>

        {/* Live Interest Preview */}
        <div style={{ position: 'sticky', top: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card fade-in" style={{
            border: '1px solid var(--accent)22',
            background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--accent-glow) 100%)',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ⊛ Live Interest Preview
            </h3>
            {calc ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { label: 'Simple Interest', value: calc.simple, color: 'var(--accent)' },
                    { label: 'Compound Interest', value: calc.compound, color: 'var(--gold)' },
                    { label: 'Monthly Interest', value: calc.monthly, color: 'var(--green)' },
                    { label: 'Yearly Interest', value: calc.yearly, color: 'var(--text-secondary)' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.label}</span>
                      <span style={{ fontWeight: '700', color: item.color, fontFamily: 'DM Mono, monospace', fontSize: '14px' }}>
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: '16px', padding: '14px', background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Total Payable (Simple)
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>
                    {formatCurrency(calc.totalWithSimple)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    After {calc.days} days ({calc.months} months)
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.4 }}>⊛</div>
                <p style={{ fontSize: '14px' }}>Enter amount, rate & date to see live calculations</p>
              </div>
            )}
          </div>

          {/* Tip card */}
          <div style={{
            padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--gold)' }}>💡 Tip:</strong> Simple Interest = P×R×T/100. Compound Interest grows exponentially. Set a due date to get automatic payment reminders.
          </div>
        </div>
      </div>
    </div>
  );
}
