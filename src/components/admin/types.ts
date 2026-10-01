export interface StudentRecord {
  id: string;
  hall_ticket_no: string;
  student_name: string;
  class: string;
  group_name: string;
  section: string;
  phone: string;
  email?: string;
  parent_name?: string;
  admission_date: string;
  academic_year: string;
  term1_fee?: number;
  term2_fee?: number;
  term3_fee?: number;
  total_fee?: number;
  created_at?: string;
}

export interface ClassFeeStructure {
  id?: string;
  class: string;
  group_name: string;
  academic_year: string;
  total_fee: number;
  term1_fee: number;
  term2_fee: number;
  term3_fee: number;
  created_at?: string;
}

export interface FeeRecord {
  id: string;
  student_name: string;
  class: string;
  email: string;
  fee_amount: number;
  created_at: string;
  hall_ticket_no?: string;
  term?: string;
  payment_mode?: string;
  receipt_no?: string;
  academic_year?: string;
}

export interface ExpenseRecord {
  id: string;
  reason: string;
  amount: number;
  created_at: string;
  category?: string;
  payment_mode?: string;
  voucher_no?: string;
}

export interface SalaryRecord {
  id: string;
  staff_name: string;
  designation: string;
  email: string;
  salary_amount: number;
  salary_month: string;
  payment_mode: string;
  created_at: string;
}

export interface AdmissionEnquiryRecord {
  id: string;
  student_name: string;
  class_of_admission: string;
  phone: string;
  location: string;
  created_at: string;
}

export interface StudentFeeSummary {
  student: StudentRecord;
  feeStructure?: ClassFeeStructure;
  totalFee: number;
  totalPaid: number;
  remainingDue: number;
  paymentCount: number;
  payments: FeeRecord[];
  termBreakdown: {
    term: string;
    allocated: number;
    paid: number;
    due: number;
  }[];
}
