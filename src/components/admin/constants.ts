export const ADMIN_USER = "admin";
export const ADMIN_PASS = "sses@2024";

export const CLASS_OPTIONS = [
  "Nursery",
  "L.K.G",
  "U.K.G",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10 (SSC)",
  "Intermediate — MPC",
  "Intermediate — BiPC",
  "Intermediate — CEC",
  "Intermediate — HEC",
  "Degree — B.A.",
  "Degree — B.Sc.",
  "Degree — B.Com.",
];

export const GROUP_OPTIONS = [
  "General",
  "MPC",
  "BiPC",
  "CEC",
  "HEC",
  "B.A.",
  "B.Sc.",
  "B.Com.",
];

export const SECTION_OPTIONS = ["A", "B", "C", "D"];

export const TERMS = ["Term 1", "Term 2", "Term 3"];

export const EXPENSE_CATEGORIES = [
  "Salaries & Honorarium",
  "Infrastructure & Maintenance",
  "Lab & Science Equipment",
  "Library Books & Subscriptions",
  "Electricity & Utilities",
  "Internet & Communications",
  "Student Activities & Sports",
  "Printing & Stationery",
  "Sanitation & Cleaning Supplies",
  "Exam & Affiliation Fees",
  "Transport & Vehicle Fuel",
  "General Operations & Miscellaneous",
];

export const PAYMENT_MODES = [
  "Cash",
  "UPI / QR Code",
  "Bank Transfer (NEFT/RTGS)",
  "Cheque / Demand Draft",
];

export const STAFF_ROLES = [
  "Principal",
  "Vice Principal",
  "Headmaster",
  "Senior Lecturer (PGT)",
  "Lecturer (Inter)",
  "Degree Faculty / Assistant Professor",
  "High School Teacher (TGT)",
  "Primary Teacher (PRT)",
  "Pre-Primary Teacher",
  "Physical Education Director (PET)",
  "Librarian",
  "Lab Assistant",
  "Office Superintendent",
  "Accountant",
  "Administrative Assistant",
  "Security Staff",
  "Maintenance & Support Staff",
];

export function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "long" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function getCurrentMonthKey(): string {
  const d = new Date();
  const month = d.toLocaleString("en-US", { month: "long" });
  return `${month} ${d.getFullYear()}`;
}
