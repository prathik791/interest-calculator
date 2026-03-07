// Calculate interest between two dates
export const calculateInterest = (
  amount,
  rate,
  startDate,
  dueDateOrCurrent = new Date(), // Default to current date if not provided
  type = "simple"
) => {
  const P = Number(amount) || 0;
  const R = Number(rate) || 0;

  const start = new Date(startDate);
  // If no due date provided or it's invalid, use current date
  let end = new Date(dueDateOrCurrent);
  
  // If end date is invalid or same as start, use current date
  if (isNaN(end) || end <= start) {
    end = new Date(); // Use current date
  }

  if (isNaN(start)) {
    return {
      error: "Invalid start date",
      simple: 0,
      compound: 0,
      monthly: 0,
      yearly: 0,
      days: 0,
      months: 0,
      years: 0,
      totalWithSimple: P,
      totalWithCompound: P,
    };
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(0, Math.ceil((end - start) / msPerDay));
  
  // More accurate calculations
  const years = days / 365.25; // Account for leap years
  const months = days / 30.44; // Average days in month

  // Simple Interest: P * R * T / 100
  const simpleInterest = (P * R * years) / 100;
  
  // Compound Interest: P * (1 + R/100)^T - P
  const compoundInterest = P * Math.pow(1 + R / 100, years) - P;
  
  // Monthly Interest (if compounded monthly)
  const monthlyCompoundRate = R / 12 / 100;
  const monthlyCompoundInterest = P * Math.pow(1 + monthlyCompoundRate, months) - P;
  
  // Yearly Interest (for one year only)
  const yearlyInterest = (P * R) / 100;

  return {
    simple: Number(simpleInterest.toFixed(2)),
    compound: Number(compoundInterest.toFixed(2)),
    monthly: Number(monthlyCompoundInterest.toFixed(2)),
    yearly: Number(yearlyInterest.toFixed(2)),
    
    days: days,
    months: Number(months.toFixed(1)),
    years: Number(years.toFixed(2)),
    
    totalWithSimple: Number((P + simpleInterest).toFixed(2)),
    totalWithCompound: Number((P + compoundInterest).toFixed(2)),
    
    // Additional useful calculations
    dailyInterest: Number((simpleInterest / days).toFixed(2)),
    effectiveRate: Number(((compoundInterest / P) * 100).toFixed(2)),
  };
};

// Format currency (Indian format) - Already looks good
export const formatCurrency = (amount, currency = "₹") => {
  const num = Number(amount) || 0;
  
  return `${currency}${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Format date - Enhanced version
export const formatDate = (date) => {
  if (!date) return "N/A";
  
  const d = new Date(date);
  if (isNaN(d)) return "Invalid Date";
  
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Get number of days between dates - Enhanced
export const getDaysElapsed = (startDate, endDate = new Date()) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start) || isNaN(end)) return 0;
  
  const msPerDay = 1000 * 60 * 60 * 24;
  
  return Math.max(0, Math.ceil((end - start) / msPerDay));
};

// Additional helper function to calculate duration breakdown
export const getDurationBreakdown = (startDate, endDate = new Date()) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start) || isNaN(end) || end < start) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      formatted: "0 days"
    };
  }
  
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  
  if (days < 0) {
    months--;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.ceil((end - start) / msPerDay);
  
  // Format the duration string
  let formatted = "";
  if (years > 0) formatted += `${years} year${years > 1 ? 's' : ''} `;
  if (months > 0) formatted += `${months} month${months > 1 ? 's' : ''} `;
  if (days > 0 || formatted === "") formatted += `${days} day${days !== 1 ? 's' : ''}`;
  
  return {
    years,
    months, 
    days,
    totalDays,
    formatted: formatted.trim()
  };
};
