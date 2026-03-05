export const calculateInterest = (amount, rate, startDate, type = 'simple') => {
  const P = parseFloat(amount) || 0;
  const R = parseFloat(rate) || 0;
  const start = new Date(startDate);
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(0, Math.floor((now - start) / msPerDay));
  const years = days / 365;
  const months = days / 30;

  return {
    simple: parseFloat(((P * R * years) / 100).toFixed(2)),
    compound: parseFloat((P * Math.pow(1 + R / 100, years) - P).toFixed(2)),
    monthly: parseFloat(((P * R * months) / 1200).toFixed(2)),
    yearly: parseFloat(((P * R) / 100).toFixed(2)),
    days,
    months: parseFloat(months.toFixed(1)),
    years: parseFloat(years.toFixed(2)),
    totalWithSimple: parseFloat((P + (P * R * years) / 100).toFixed(2)),
    totalWithCompound: parseFloat((P * Math.pow(1 + R / 100, years)).toFixed(2)),
  };
};

export const formatCurrency = (amount, currency = '₹') => {
  const num = parseFloat(amount) || 0;
  return `${currency}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const getDaysElapsed = (date) => {
  const start = new Date(date);
  const now = new Date();
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
};
