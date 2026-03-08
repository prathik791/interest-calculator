import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import API from '../utils/api';
import { formatCurrency, formatDate } from '../utils/calculations';
import { useAuth } from '../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary]   = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, txRes] = await Promise.all([
          API.get('/transactions/summary'),
          API.get('/transactions/list?limit=5'),
        ]);
        setSummary(summaryRes.data.data);
        setRecentTx(txRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div className="spinner" />
    </div>
  );

  // ✅ FIX: use totalInterestEarned directly from backend — no frontend recalculation
  const cards = [
    { label: 'Total Given',     value: formatCurrency(summary?.totalGiven          || 0), color: 'var(--green)',  bg: 'var(--green-glow)',  icon: '↑' },
    { label: 'Total Taken',     value: formatCurrency(summary?.totalTaken          || 0), color: 'var(--red)',    bg: 'var(--red-glow)',    icon: '↓' },
    { label: 'Interest Earned', value: formatCurrency(summary?.totalInterestEarned || 0), color: 'var(--gold)',   bg: 'var(--gold-glow)',   icon: '⊛' },
    { label: 'Net Balance',     value: formatCurrency(summary?.netBalance          || 0), color: 'var(--accent)', bg: 'var(--accent-glow)', icon: '◈' },
  ];

  // Monthly chart
  const monthlyMap = {};
  (summary?.monthlyData || []).forEach((d) => {
    const key = `${MONTH_NAMES[d._id.month - 1]} ${d._id.year}`;
    if (!monthlyMap[key]) monthlyMap[key] = { given: 0, taken: 0 };
    monthlyMap[key][d._id.type] = d.total;
  });
  const labels    = Object.keys(monthlyMap);
  const givenData = labels.map((k) => monthlyMap[k].given || 0);
  const takenData = labels.map((k) => monthlyMap[k].taken || 0);

  const barData = {
    labels,
    datasets: [
      { label: 'Given', data: givenData, backgroundColor: 'rgba(16,217,160,0.7)', borderRadius: 6 },
      { label: 'Taken', data: takenData, backgroundColor: 'rgba(255,71,87,0.7)',  borderRadius: 6 },
    ],
  };

  const donutData = {
    labels: ['Given', 'Taken'],
    datasets: [{
      data: [summary?.totalGiven || 0, summary?.totalTaken || 0],
      backgroundColor: ['rgba(16,217,160,0.8)', 'rgba(255,71,87,0.8)'],
      borderColor: ['#10d9a0', '#ff4757'],
      borderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#8888aa', font: { family: 'Syne' } } },
      tooltip: {
        backgroundColor: '#12121f', borderColor: '#1e1e35', borderWidth: 1,
        titleColor: '#e8e8f0', bodyColor: '#8888aa',
        callbacks: { label: (ctx) => ` ₹${ctx.parsed.y?.toLocaleString('en-IN') || ctx.parsed?.toLocaleString('en-IN')}` },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(30,30,53,0.8)' }, ticks: { color: '#8888aa', font: { family: 'Syne' } } },
      y: { grid: { color: 'rgba(30,30,53,0.8)' }, ticks: { color: '#8888aa', font: { family: 'Syne' }, callback: (v) => `₹${v.toLocaleString('en-IN')}` } },
    },
  };

  const donutOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#8888aa', padding: 20, font: { family: 'Syne' } } },
    },
    cutout: '65%',
  };

  // Person summary
  const personMap = {};
  (summary?.personSummary || []).forEach((p) => {
    const name = p._id.personName;
    if (!personMap[name]) personMap[name] = { given: 0, taken: 0 };
    personMap[name][p._id.type] = (personMap[name][p._id.type] || 0) + p.totalAmount;
  });
  const topPersons = Object.entries(personMap).slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'32px', flexWrap:'wrap', gap:'16px' }}>
        <div>
          <h1 style={{ fontSize:'28px', fontWeight:'800', letterSpacing:'-0.5px' }}>
            Good day, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color:'var(--text-muted)', fontSize:'14px', marginTop:'4px' }}>
            {summary?.transactionCount || 0} total transactions tracked
          </p>
        </div>
        <Link to="/add-transaction" className="btn btn-primary">⊕ Add Transaction</Link>
      </div>

      {/* Summary cards */}
      <div className="grid-4" style={{ marginBottom:'28px' }}>
        {cards.map((c, i) => (
          <div key={i} className="card" style={{
            background: `linear-gradient(135deg, var(--bg-card) 0%, ${c.bg.replace(')', ', 0.3)')} 100%)`,
            border: `1px solid ${c.color}22`,
            animation: `fadeIn 0.4s ease ${i * 0.08}s both`,
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
              <span style={{ fontSize:'12px', fontWeight:'600', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'1px' }}>{c.label}</span>
              <span style={{ width:'34px', height:'34px', borderRadius:'8px', background:c.bg, color:c.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'800' }}>{c.icon}</span>
            </div>
            <div style={{ fontSize:'26px', fontWeight:'800', color:c.color, fontFamily:'DM Mono, monospace', letterSpacing:'-1px' }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom:'28px' }}>
        <div className="card" style={{ animation:'fadeIn 0.4s ease 0.3s both' }}>
          <h3 style={{ fontSize:'15px', fontWeight:'700', marginBottom:'20px', color:'var(--text-secondary)' }}>Monthly Overview</h3>
          {labels.length > 0
            ? <Bar data={barData} options={chartOptions} />
            : <div className="empty-state"><div className="icon">◫</div><p>Add transactions to see chart</p></div>
          }
        </div>
        <div className="card" style={{ animation:'fadeIn 0.4s ease 0.35s both' }}>
          <h3 style={{ fontSize:'15px', fontWeight:'700', marginBottom:'20px', color:'var(--text-secondary)' }}>Given vs Taken</h3>
          {(summary?.totalGiven || summary?.totalTaken)
            ? <div style={{ maxWidth:'260px', margin:'0 auto' }}><Doughnut data={donutData} options={donutOptions} /></div>
            : <div className="empty-state"><div className="icon">◈</div><p>No transactions yet</p></div>
          }
        </div>
      </div>

      {/* Recent transactions + Top persons */}
      <div className="grid-2">
        <div className="card" style={{ animation:'fadeIn 0.4s ease 0.4s both' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
            <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--text-secondary)' }}>Recent Transactions</h3>
            <Link to="/transactions" style={{ fontSize:'13px', color:'var(--accent)', textDecoration:'none', fontWeight:'600' }}>View all →</Link>
          </div>
          {recentTx.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {recentTx.map((t) => (
                <div key={t._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'var(--bg-secondary)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'50%', background: t.type==='given'?'var(--green-glow)':'var(--red-glow)', color: t.type==='given'?'var(--green)':'var(--red)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'14px' }}>
                      {t.personName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:'600', fontSize:'14px' }}>{t.personName}</div>
                      <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>{formatDate(t.date)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:'700', fontSize:'14px', fontFamily:'DM Mono, monospace', color: t.type==='given'?'var(--green)':'var(--red)' }}>
                      {t.type === 'given' ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                    <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>{t.interestRate}% p.a.</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon">◈</div>
              <h3>No transactions yet</h3>
              <Link to="/add-transaction" className="btn btn-primary btn-sm" style={{ marginTop:'8px' }}>Add First Transaction</Link>
            </div>
          )}
        </div>

        <div className="card" style={{ animation:'fadeIn 0.4s ease 0.45s both' }}>
          <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--text-secondary)', marginBottom:'20px' }}>Account Balances by Person</h3>
          {topPersons.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {topPersons.map(([name, data], i) => {
                const net = (data.given || 0) - (data.taken || 0);
                return (
                  <div key={i} style={{ padding:'14px', background:'var(--bg-secondary)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                      <span style={{ fontWeight:'600', fontSize:'14px' }}>{name}</span>
                      <span style={{ fontWeight:'700', fontFamily:'DM Mono, monospace', fontSize:'14px', color: net>=0?'var(--green)':'var(--red)' }}>
                        {net >= 0 ? '+' : ''}{formatCurrency(net)}
                      </span>
                    </div>
                    <div style={{ display:'flex', gap:'16px', fontSize:'12px', color:'var(--text-muted)' }}>
                      <span style={{ color:'var(--green)' }}>↑ {formatCurrency(data.given || 0)}</span>
                      <span style={{ color:'var(--red)' }}>↓ {formatCurrency(data.taken || 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon">◫</div>
              <h3>No accounts yet</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}