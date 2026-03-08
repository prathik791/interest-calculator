import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (raw) => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysBetween = (from, to) => {
  const a = new Date(from), b = new Date(to || Date.now());
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.max(0, Math.floor((b - a) / 86400000));
};

const calcSI = (p, r, d) => (p * (r / 100) * d) / 365;
const calcCI = (p, r, d) => p * (Math.pow(1 + r / 100, d / 365) - 1);
const calcMI = (p, r, d) => p * (Math.pow(1 + r / 1200, d / 30.4375) - 1);
const calcYI = (p, r)    => p * (r / 100);

if (!document.getElementById('txp-styles')) {
  const s = document.createElement('style');
  s.id = 'txp-styles';
  s.textContent = `
    @keyframes txFadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
    @keyframes spin     { to{transform:rotate(360deg)} }
    .txp-row:hover  { background:rgba(124,106,247,.05)!important; }
    .txp-act:hover  { opacity:1!important; transform:scale(1.12); }
    .txp-card:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,.3); }
    .txp-in:focus   { border-color:#7c6af7!important; box-shadow:0 0 0 3px rgba(124,106,247,.15)!important; outline:none; }
  `;
  document.head.appendChild(s);
}

function BreakdownRow({ tx }) {
  const days   = daysBetween(tx.date, tx.dueDate || Date.now());
  const months = Math.floor(days / 30.4375);
  const p = Number(tx.amount || 0), r = Number(tx.interestRate || 0);
  return (
    <tr style={{ background:'rgba(124,106,247,.04)', borderTop:'1px dashed rgba(124,106,247,.25)' }}>
      <td colSpan={9} style={{ padding:'16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', color:'#8888aa', marginBottom:3 }}>Interest Breakdown</div>
            <div style={{ fontSize:12, color:'#8888aa' }}>{days} days · {months} months</div>
          </div>
          <div style={{ width:1, height:32, background:'rgba(255,255,255,.1)' }} />
          {[
            { label:'Simple',   val:calcSI(p,r,days), color:'#10d9a0' },
            { label:'Compound', val:calcCI(p,r,days), color:'#7c6af7' },
            { label:'Monthly',  val:calcMI(p,r,days), color:'#5f8eff' },
            { label:'Yearly',   val:calcYI(p,r),      color:'#ffd166' },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', color:'#8888aa', marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:14, fontWeight:700, fontFamily:'DM Mono,monospace', color }}>₹{fmt(val)}</div>
            </div>
          ))}
          {tx.dueDate && (
            <>
              <div style={{ width:1, height:32, background:'rgba(255,255,255,.1)' }} />
              <div>
                <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', color:'#8888aa', marginBottom:3 }}>Due Date</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#e8e8f0' }}>{fmtDate(tx.dueDate)}</div>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId]     = useState(null);
  const [deleting, setDeleting]         = useState(null);

  // ✅ baseURL = .../api  →  GET /transactions/list  =  /api/transactions/list ✓
  const fetchTx = async () => {
    try {
      const res = await API.get('/transactions/list');
      setTransactions(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTx(); }, []);

  // ✅ DELETE /api/transactions/delete/:id ✓
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this transaction?')) return;
    setDeleting(id);
    try {
      await API.delete(`/transactions/delete/${id}`);
      setTransactions((p) => p.filter((t) => t._id !== id));
      if (expandedId === id) setExpandedId(null);
      toast.success('Transaction deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    return (
      (!search || t.personName?.toLowerCase().includes(q) || t.contact?.includes(search)) &&
      (typeFilter   === 'all' || t.type   === typeFilter) &&
      (statusFilter === 'all' || t.status === statusFilter)
    );
  });

  const totals = filtered.reduce(
    (a, t) => { t.type === 'given' ? (a.given += +t.amount) : (a.taken += +t.amount); return a; },
    { given: 0, taken: 0 }
  );

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:16, color:'#8888aa', fontFamily:'Syne,sans-serif' }}>
      <div style={{ width:34, height:34, border:'3px solid #1e1e35', borderTopColor:'#7c6af7', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      Loading transactions…
    </div>
  );

  const selSt = { padding:'9px 14px', background:'var(--bg-secondary,#0f0f1c)', border:'1.5px solid var(--border,#1e1e35)', borderRadius:10, color:'var(--text-primary,#e8e8f0)', fontSize:13, fontFamily:'Syne,sans-serif', cursor:'pointer', outline:'none', minWidth:130 };

  return (
    <div style={{ fontFamily:'Syne,sans-serif' }}>

      {/* HEADER */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ fontSize:30, fontWeight:800, letterSpacing:'-1px', margin:0 }}>Transactions</h1>
          <p style={{ fontSize:13, color:'var(--text-muted,#8888aa)', marginTop:6 }}>
            {filtered.length} of {transactions.length} total records
          </p>
        </div>
        <Link to="/add-transaction"
          style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 22px', background:'linear-gradient(135deg,#7c6af7,#5f8eff)', color:'#fff', borderRadius:12, fontWeight:700, fontSize:14, textDecoration:'none', boxShadow:'0 4px 20px rgba(124,106,247,.3)', whiteSpace:'nowrap' }}>
          ⊕ Add Transaction
        </Link>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Given', val:`₹${fmt(totals.given)}`,                color:'#10d9a0', icon:'↑' },
          { label:'Total Taken', val:`₹${fmt(totals.taken)}`,                color:'#ff4757', icon:'↓' },
          { label:'Net Balance', val:`₹${fmt(totals.given - totals.taken)}`,  color: totals.given >= totals.taken ? '#10d9a0' : '#ff4757', icon:'◈' },
          { label:'Records',     val: filtered.length,                        color:'#7c6af7', icon:'#' },
        ].map((c, i) => (
          <div key={i} className="txp-card"
            style={{ background:'var(--bg-card,#16162a)', border:'1px solid var(--border,#1e1e35)', borderRadius:14, padding:'18px 20px', animation:`txFadeIn .3s ease ${i*.07}s both`, transition:'all .2s' }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'1.2px', color:'#8888aa', marginBottom:10 }}>{c.icon} {c.label}</div>
            <div style={{ fontSize:22, fontWeight:800, fontFamily:'DM Mono,monospace', color:c.color }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flexGrow:1, maxWidth:340 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'#8888aa', pointerEvents:'none' }}>🔍</span>
          <input className="txp-in"
            style={{ width:'100%', padding:'10px 14px 10px 38px', background:'var(--bg-secondary,#0f0f1c)', border:'1.5px solid var(--border,#1e1e35)', borderRadius:10, color:'var(--text-primary,#e8e8f0)', fontSize:13, fontFamily:'Syne,sans-serif', boxSizing:'border-box' }}
            placeholder="Search by person or phone…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select style={selSt} value={typeFilter}   onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="given">Given</option>
          <option value="taken">Taken</option>
        </select>
        <select style={selSt} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
        {(search || typeFilter !== 'all' || statusFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); }}
            style={{ padding:'9px 14px', borderRadius:10, background:'rgba(255,71,87,.1)', border:'1px solid rgba(255,71,87,.3)', color:'#ff4757', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Syne,sans-serif' }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* TABLE */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'#8888aa', background:'var(--bg-card,#16162a)', borderRadius:16, border:'1px solid var(--border,#1e1e35)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>◈</div>
          <h3 style={{ fontWeight:700, marginBottom:8 }}>{search ? 'No results found' : 'No transactions yet'}</h3>
          {!search && (
            <Link to="/add-transaction"
              style={{ display:'inline-block', marginTop:12, padding:'10px 22px', background:'linear-gradient(135deg,#7c6af7,#5f8eff)', color:'#fff', borderRadius:10, fontWeight:700, fontSize:13, textDecoration:'none' }}>
              ⊕ Add Transaction
            </Link>
          )}
        </div>
      ) : (
        <div style={{ background:'var(--bg-card,#16162a)', border:'1px solid var(--border,#1e1e35)', borderRadius:16, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--bg-secondary,#0f0f1c)', borderBottom:'1px solid var(--border,#1e1e35)' }}>
                  {['Person','Type','Amount','Rate','Interest (SI)','Date','Mode','Status','Actions'].map((h) => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', color:'#8888aa', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx, idx) => {
                  const days     = daysBetween(tx.date, tx.dueDate || Date.now());
                  const interest = calcSI(Number(tx.amount), Number(tx.interestRate), days);
                  const open     = expandedId === tx._id;
                  return (
                    <React.Fragment key={tx._id}>
                      <tr className="txp-row"
                        onClick={() => setExpandedId(open ? null : tx._id)}
                        style={{ borderBottom: open ? 'none' : '1px solid var(--border,#1e1e35)', cursor:'pointer', transition:'background .15s', animation:`txFadeIn .3s ease ${idx*.04}s both` }}>

                        {/* Person */}
                        <td style={{ padding:'14px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0, background: tx.type==='given'?'rgba(16,217,160,.15)':'rgba(255,71,87,.15)', color: tx.type==='given'?'#10d9a0':'#ff4757', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13 }}>
                              {(tx.personName||'?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight:700 }}>{tx.personName}</div>
                              {tx.contact && <div style={{ fontSize:11, color:'#8888aa' }}>{tx.contact}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td style={{ padding:'14px 16px' }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700, background: tx.type==='given'?'rgba(16,217,160,.12)':'rgba(255,71,87,.12)', color: tx.type==='given'?'#10d9a0':'#ff4757', border:`1px solid ${tx.type==='given'?'rgba(16,217,160,.25)':'rgba(255,71,87,.25)'}` }}>
                            {tx.type==='given' ? '↑ Given' : '↓ Taken'}
                          </span>
                        </td>

                        {/* Amount */}
                        <td style={{ padding:'14px 16px' }}>
                          <span style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color: tx.type==='given'?'#10d9a0':'#ff4757' }}>
                            ₹{fmt(tx.amount)}
                          </span>
                        </td>

                        {/* Rate */}
                        <td style={{ padding:'14px 16px', fontFamily:'DM Mono,monospace', color:'#c0c0d8' }}>{tx.interestRate}%</td>

                        {/* SI */}
                        <td style={{ padding:'14px 16px' }}>
                          <span style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'#ffd166' }}>₹{fmt(interest)}</span>
                        </td>

                        {/* Date */}
                        <td style={{ padding:'14px 16px', color:'#c0c0d8', fontSize:12, whiteSpace:'nowrap' }}>{fmtDate(tx.date)}</td>

                        {/* Mode */}
                        <td style={{ padding:'14px 16px', color:'#8888aa', fontSize:12, textTransform:'capitalize' }}>
                          {(tx.paymentMode || 'cash').replace('_', ' ')}
                        </td>

                        {/* Status */}
                        <td style={{ padding:'14px 16px' }}>
                          <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background: tx.status==='closed'?'rgba(136,136,170,.1)':'rgba(95,142,255,.12)', color: tx.status==='closed'?'#8888aa':'#5f8eff', border:`1px solid ${tx.status==='closed'?'rgba(136,136,170,.2)':'rgba(95,142,255,.25)'}` }}>
                            {tx.status || 'active'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding:'14px 16px' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display:'flex', gap:8 }}>
                            <button className="txp-act"
                              onClick={(e) => { e.stopPropagation(); setExpandedId(open ? null : tx._id); }}
                              style={{ width:30, height:30, borderRadius:7, background:'rgba(95,142,255,.12)', border:'1px solid rgba(95,142,255,.25)', color:'#5f8eff', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s', opacity:.8 }}>
                              {open ? '▲' : '▼'}
                            </button>
                            {/* ✅ Edit → /edit-transaction/:id matches App.jsx route */}
                            <Link to={`/edit-transaction/${tx._id}`} onClick={(e) => e.stopPropagation()}
                              style={{ width:30, height:30, borderRadius:7, background:'rgba(124,106,247,.1)', border:'1px solid rgba(124,106,247,.25)', color:'#7c6af7', textDecoration:'none', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s', opacity:.8 }}>
                              ✎
                            </Link>
                            <button className="txp-act"
                              onClick={(e) => handleDelete(tx._id, e)}
                              disabled={deleting === tx._id}
                              style={{ width:30, height:30, borderRadius:7, background:'rgba(255,71,87,.1)', border:'1px solid rgba(255,71,87,.25)', color:'#ff4757', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s', opacity: deleting===tx._id ? .4 : .8 }}>
                              {deleting === tx._id ? '…' : '✕'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ✅ Breakdown always attached — never floating */}
                      {open && <BreakdownRow tx={tx} />}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}