// Format a Date object to YYYY-MM-DD (local date string)
const toDateStr = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Round to 2 decimal places
const round2 = (num) => Math.round(num * 100) / 100;

// Compute working hours (decimal) between two Date objects
const computeWorkingHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const ms = new Date(checkOut) - new Date(checkIn);
  if (ms <= 0) return 0;
  return round2(ms / (1000 * 60 * 60));
};

// Determine attendance status from working hours vs standard hours
const deriveStatus = (workingHours) => {
  const standard = Number(process.env.STANDARD_WORK_HOURS || 8);
  if (workingHours <= 0) return "Absent";
  if (workingHours < standard / 2) return "Half Day";
  if (workingHours < standard - 0.5) return "Late";
  return "Present";
};

// Count inclusive days between two YYYY-MM-DD date strings
const countDaysInclusive = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = (end - start) / (1000 * 60 * 60 * 24);
  return diff >= 0 ? diff + 1 : 0;
};

// Given approved leave days in a month and paid-leave allowance, compute
// unpaid days and the salary deduction amount.
const computeLeaveDeduction = (approvedDaysInMonth, monthlySalary) => {
  const paidAllowance = Number(process.env.PAID_LEAVES_PER_MONTH || 2);
  const unpaidDays = Math.max(0, approvedDaysInMonth - paidAllowance);
  const workingDaysPerMonth = 26; // standard assumption for per-day salary rate
  const perDayRate = monthlySalary / workingDaysPerMonth;
  const deduction = round2(unpaidDays * perDayRate);
  return { unpaidDays, perDayRate: round2(perDayRate), deduction };
};

module.exports = {
  toDateStr,
  round2,
  computeWorkingHours,
  deriveStatus,
  countDaysInclusive,
  computeLeaveDeduction,
};
