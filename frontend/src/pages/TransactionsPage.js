import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { formatCurrency, formatDate, calculateInterest } from '../utils/calculations';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', status: '', personName: '' });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [deleteId, setDeleteId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pagination.page, limit: 15, ...filters });
      Object.keys(filters).forEach((k) => { if (!filters[k]) params.delete(k); });
      const { data } = await API.get(`/transactions/list?${params}`);
      setTransactions(data.data);
      setPagination((p) => ({ ...p, ...data.pagination }));
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page]);

  useEffect(() => { fetchTransactions(); }, [filters, pagination.page]);

  const handleDelete = async (id) => {
    try {
      await API.delete(`/transactions/delete/${id}`);
      toast.success('Transaction deleted');
      setDeleteId(null);
      fetchTransactions();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const filterChange = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Transactions</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            {pagination.total} total records
          </p>
        </div>
        <Link to="/add-transaction" className="btn btn-primary">⊕ Add Transaction</Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text" className="form-input" placeholder="🔍 Search by person..."
          value={filters.personName}
          onChange={(e) => filterChange('personName', e.target.value)}
          style={{ flex: '1', minWidth: '200px', maxWidth: '280px' }}
        />
        <select className="form-select" value={filters.type} onChange={(e) => filterChange('type', e.target.value)}
          style={{ minWidth: '150px' }}>
          <option value="">All Types</option>
          <option value="given">Money Given</option>
          <option value="taken">Money Taken</option>
        </select>
        <select className="form-select" value={filters.status} onChange={(e) => filterChange('status', e.target.value)}
          style={{ minWidth: '150px' }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="partial">Partial</option>
          <option value="closed">Closed</option>
        </select>
        {(filters.type || filters.status || filters.personName) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ type: '', status: '', personName: '' }); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="icon">◈</div>
            <h3>No transactions found</h3>
            <p>Try adjusting filters or add your first transaction</p>
            <Link to="/add-transaction" className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>Add Transaction</Link>
          </div>
        ) : (
          <>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Rate</th>
                    <th>Interest (Simple)</th>
                    <th>Date</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    const calc = calculateInterest(t.amount, t.interestRate, t.date);
                    const isExpanded = expandedId === t._id;
                    return (
                      <React.Fragment key={t._id}>
                        <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : t._id)}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                background: t.type === 'given' ? 'var(--green-glow)' : 'var(--red-glow)',
                                color: t.type === 'given' ? 'var(--green)' : 'var(--red)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: '700', fontSize: '13px',
                              }}>
                                {t.personName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{t.personName}</div>
                                {t.contact && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.contact}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${t.type}`}>
                              {t.type === 'given' ? '↑ Given' : '↓ Taken'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: '700', color: t.type === 'given' ? 'var(--green)' : 'var(--red)' }}>
                              {formatCurrency(t.amount)}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'DM Mono, monospace' }}>{t.interestRate}%</td>
                          <td>
                            <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--gold)', fontWeight: '600' }}>
                              {formatCurrency(calc.simple)}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(t.date)}</td>
                          <td style={{ textTransform: 'capitalize', fontSize: '13px' }}>
                            {t.paymentMode?.replace('_', ' ')}
                          </td>
                          <td>
                            <span className={`badge badge-${t.status}`}>{t.status}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                              <Link to={`/edit-transaction/${t._id}`} className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }}>
                                ✎
                              </Link>
                              <button
                                className="btn btn-sm"
                                onClick={() => setDeleteId(t._id)}
                                style={{ padding: '6px 10px', background: 'var(--red-glow)', color: 'var(--red)', border: '1px solid rgba(255,71,87,0.2)' }}
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan="9" style={{ background: 'var(--bg-secondary)', padding: 0 }}>
                              <div style={{ padding: '20px 24px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                                <div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Interest Breakdown</div>
                                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                    {[
                                      { l: 'Simple', v: calc.simple, c: 'var(--accent)' },
                                      { l: 'Compound', v: calc.compound, c: 'var(--gold)' },
                                      { l: 'Monthly', v: calc.monthly, c: 'var(--green)' },
                                      { l: 'Yearly', v: calc.yearly, c: 'var(--text-secondary)' },
                                    ].map((item, i) => (
                                      <div key={i}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.l}</div>
                                        <div style={{ fontFamily: 'DM Mono, monospace', fontWeight: '700', color: item.c }}>{formatCurrency(item.v)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Duration</div>
                                  <div style={{ fontFamily: 'DM Mono, monospace', fontWeight: '600', color: 'var(--text-primary)' }}>
                                    {calc.days} days · {calc.months} months
                                  </div>
                                </div>
                                {t.notes && (
                                  <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Notes</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px' }}>{t.notes}</div>
                                  </div>
                                )}
                                {t.dueDate && (
                                  <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Due Date</div>
                                    <div style={{ fontFamily: 'DM Mono, monospace', color: 'var(--gold)', fontWeight: '600' }}>{formatDate(t.dueDate)}</div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '20px', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-ghost btn-sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
                  ← Prev
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button className="btn btn-ghost btn-sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}>
          <div className="card" style={{ padding: '40px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Delete Transaction?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '14px' }}>
              This action cannot be undone. The transaction and all associated data will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
