import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { formatCurrency, formatDate, calculateInterest } from '../utils/calculations';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txRes, sumRes] = await Promise.all([
          API.get('/transactions/export'),
          API.get('/transactions/summary'),
        ]);
        setTransactions(txRes.data.data);
        setSummary(sumRes.data.data);
      } catch (err) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const exportPDF = async () => {
    setExporting('pdf');
    try {
      const jsPDF = (await import('jspdf')).default;
      await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape' });

      // Header
      doc.setFillColor(8, 8, 16);
      doc.rect(0, 0, 297, 297, 'F');
      doc.setTextColor(108, 99, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('INTEREST CALCULATOR', 14, 20);
      doc.setTextColor(136, 136, 170);
      doc.setFontSize(11);
      doc.text('Transaction Report', 14, 28);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 35);

      // Summary
      doc.setFillColor(18, 18, 31);
      doc.roundedRect(14, 42, 269, 28, 3, 3, 'F');
      doc.setTextColor(16, 217, 160);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Given: ${formatCurrency(summary?.totalGiven || 0)}`, 22, 52);
      doc.setTextColor(255, 71, 87);
      doc.text(`Total Taken: ${formatCurrency(summary?.totalTaken || 0)}`, 100, 52);
      doc.setTextColor(255, 217, 61);
      doc.text(`Interest Earned: ${formatCurrency(summary?.totalInterestEarned || 0)}`, 180, 52);
      doc.setTextColor(108, 99, 255);
      doc.text(`Net Balance: ${formatCurrency(summary?.netBalance || 0)}`, 22, 64);
      doc.setTextColor(136, 136, 170);
      doc.text(`Total Transactions: ${transactions.length}`, 100, 64);

      // Table
      const tableData = transactions.map((t) => {
        const calc = calculateInterest(t.amount, t.interestRate, t.date);
        return [
          t.personName,
          t.type === 'given' ? 'Given ↑' : 'Taken ↓',
          formatCurrency(t.amount),
          `${t.interestRate}%`,
          t.interestType,
          formatCurrency(calc.simple),
          formatCurrency(calc.compound),
          formatDate(t.date),
          t.dueDate ? formatDate(t.dueDate) : '-',
          t.paymentMode?.replace('_', ' '),
          t.status,
        ];
      });

      doc.autoTable({
        startY: 78,
        head: [['Person', 'Type', 'Amount', 'Rate', 'Int. Type', 'Simple Int.', 'Compound Int.', 'Date', 'Due Date', 'Mode', 'Status']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 4, textColor: [136, 136, 170], fillColor: [18, 18, 31], lineColor: [30, 30, 53] },
        headStyles: { fillColor: [14, 14, 26], textColor: [108, 99, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [23, 23, 40] },
      });

      doc.save(`interest-calculator-report-${Date.now()}.pdf`);
      toast.success('PDF exported successfully!');
    } catch (err) {
      console.error(err);
      toast.error('PDF export failed. Try Excel instead.');
    } finally {
      setExporting('');
    }
  };

  const exportExcel = async () => {
    setExporting('excel');
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['INTEREST CALCULATOR - REPORT'],
        ['Generated:', new Date().toLocaleDateString('en-IN')],
        [],
        ['SUMMARY'],
        ['Total Given', summary?.totalGiven || 0],
        ['Total Taken', summary?.totalTaken || 0],
        ['Interest Earned', summary?.totalInterestEarned || 0],
        ['Interest Owed', summary?.totalInterestOwed || 0],
        ['Net Balance', summary?.netBalance || 0],
        ['Total Transactions', transactions.length],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Transactions sheet
      const txData = [
        ['Person', 'Contact', 'Type', 'Amount', 'Rate (%)', 'Int. Type', 'Simple Interest', 'Compound Interest', 'Monthly Interest', 'Yearly Interest', 'Total (Simple)', 'Date', 'Due Date', 'Days Elapsed', 'Mode', 'Status', 'Notes'],
        ...transactions.map((t) => {
          const calc = calculateInterest(t.amount, t.interestRate, t.date);
          return [
            t.personName, t.contact || '', t.type,
            t.amount, t.interestRate, t.interestType,
            calc.simple, calc.compound, calc.monthly, calc.yearly, calc.totalWithSimple,
            formatDate(t.date), t.dueDate ? formatDate(t.dueDate) : '',
            calc.days, t.paymentMode?.replace('_', ' '), t.status, t.notes || '',
          ];
        }),
      ];
      const txSheet = XLSX.utils.aoa_to_sheet(txData);
      txSheet['!cols'] = txData[0].map(() => ({ wch: 16 }));
      XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions');

      XLSX.writeFile(wb, `interest-calculator-${Date.now()}.xlsx`);
      toast.success('Excel exported successfully!');
    } catch (err) {
      toast.error('Excel export failed');
    } finally {
      setExporting('');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  // Person-wise report
  const personReport = {};
  transactions.forEach((t) => {
    const calc = calculateInterest(t.amount, t.interestRate, t.date);
    if (!personReport[t.personName]) {
      personReport[t.personName] = { given: 0, taken: 0, interest: 0, count: 0, contact: t.contact };
    }
    personReport[t.personName].count++;
    personReport[t.personName].interest += calc.simple;
    if (t.type === 'given') personReport[t.personName].given += t.amount;
    else personReport[t.personName].taken += t.amount;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Reports</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Export and analyze your transaction data</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-ghost" onClick={exportExcel} disabled={!!exporting}>
            {exporting === 'excel' ? '⏳ Exporting...' : '📊 Export Excel'}
          </button>
          <button className="btn btn-primary" onClick={exportPDF} disabled={!!exporting}>
            {exporting === 'pdf' ? '⏳ Exporting...' : '📄 Export PDF'}
          </button>
        </div>
      </div>

      {/* Summary boxes */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Total Given', value: formatCurrency(summary?.totalGiven || 0), color: 'var(--green)' },
          { label: 'Total Taken', value: formatCurrency(summary?.totalTaken || 0), color: 'var(--red)' },
          { label: 'Interest Earned', value: formatCurrency(summary?.totalInterestEarned || 0), color: 'var(--gold)' },
          { label: 'Net Balance', value: formatCurrency(summary?.netBalance || 0), color: 'var(--accent)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: s.color, fontFamily: 'DM Mono, monospace' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Person-wise breakdown */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Account-wise Summary</h2>
        {Object.keys(personReport).length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Contact</th>
                  <th>Total Given</th>
                  <th>Total Taken</th>
                  <th>Total Interest</th>
                  <th>Net Balance</th>
                  <th>Transactions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(personReport).map(([name, data], i) => {
                  const net = data.given - data.taken;
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: '600' }}>{name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{data.contact || '—'}</td>
                      <td style={{ color: 'var(--green)', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>{formatCurrency(data.given)}</td>
                      <td style={{ color: 'var(--red)', fontFamily: 'DM Mono, monospace', fontWeight: '600' }}>{formatCurrency(data.taken)}</td>
                      <td style={{ color: 'var(--gold)', fontFamily: 'DM Mono, monospace' }}>{formatCurrency(data.interest)}</td>
                      <td style={{
                        color: net >= 0 ? 'var(--green)' : 'var(--red)',
                        fontFamily: 'DM Mono, monospace', fontWeight: '700',
                      }}>
                        {net >= 0 ? '+' : ''}{formatCurrency(net)}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{data.count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">◫</div>
            <h3>No data available</h3>
          </div>
        )}
      </div>

      {/* Full transaction table */}
      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>All Transactions</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Rate</th>
                <th>Simple Int.</th>
                <th>Compound Int.</th>
                <th>Days</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => {
                const calc = calculateInterest(t.amount, t.interestRate, t.date);
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: '600' }}>{t.personName}</td>
                    <td><span className={`badge badge-${t.type}`}>{t.type === 'given' ? '↑ Given' : '↓ Taken'}</span></td>
                    <td style={{ fontFamily: 'DM Mono, monospace', fontWeight: '600', color: t.type === 'given' ? 'var(--green)' : 'var(--red)' }}>{formatCurrency(t.amount)}</td>
                    <td style={{ fontFamily: 'DM Mono, monospace' }}>{t.interestRate}%</td>
                    <td style={{ fontFamily: 'DM Mono, monospace', color: 'var(--gold)' }}>{formatCurrency(calc.simple)}</td>
                    <td style={{ fontFamily: 'DM Mono, monospace', color: 'var(--accent)' }}>{formatCurrency(calc.compound)}</td>
                    <td style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)' }}>{calc.days}d</td>
                    <td>{formatDate(t.date)}</td>
                    <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
