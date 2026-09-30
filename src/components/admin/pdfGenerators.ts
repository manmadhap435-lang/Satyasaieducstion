import { FeeRecord, ExpenseRecord, SalaryRecord, AdmissionEnquiryRecord, StudentRecord } from "./types";
import { formatINR } from "./constants";

export function downloadMonthlyReportPDF(
  monthName: string,
  year: number,
  fees: FeeRecord[],
  expenses: ExpenseRecord[],
  salaries: SalaryRecord[],
  classBreakdown: { className: string; count: number; total: number; percentage: number }[],
  totalCollection: number,
  totalExpense: number,
  totalSalary: number,
  netRevenue: number,
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download or print the PDF report.");
    return;
  }

  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const activeClassesWithFees = classBreakdown.filter((c) => c.count > 0 || c.total > 0);

  const expensesByCategory: Record<string, { count: number; total: number }> = {};
  for (const exp of expenses) {
    const cat = exp.category || "General Operations & Miscellaneous";
    if (!expensesByCategory[cat]) {
      expensesByCategory[cat] = { count: 0, total: 0 };
    }
    expensesByCategory[cat].count += 1;
    expensesByCategory[cat].total += exp.amount || 0;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Monthly Financial Audit Statement - ${monthName} ${year} - Satya Sai Educational Society</title>
        <style>
          @page { size: A4; margin: 12mm 10mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 11.5px; line-height: 1.45; background: #fff; }
          .header { text-align: center; border-bottom: 3px double #064e3b; padding-bottom: 12px; margin-bottom: 16px; }
          .society-name { font-size: 22px; font-weight: 800; color: #064e3b; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .society-sub { font-size: 11.5px; color: #64748b; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
          .statement-title { font-size: 14px; font-weight: 700; color: #d97706; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-bar { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 11px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; }
          .kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
          .kpi-value { font-size: 16px; font-weight: 800; margin-top: 4px; }
          .kpi-green { color: #16a34a; }
          .kpi-rose { color: #e11d48; }
          .kpi-sky { color: #0284c7; }
          .kpi-amber { color: #d97706; }
          .section-title { font-size: 12px; font-weight: 800; color: #064e3b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #064e3b; padding-bottom: 4px; margin: 20px 0 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 14px; }
          th { background: #064e3b; color: #fff; padding: 6px 8px; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; text-align: left; }
          th.right, td.right { text-align: right; }
          th.center, td.center { text-align: center; }
          td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) td { background: #fcfdfd; }
          .totals-row td { font-weight: 800; background: #f1f5f9; border-top: 1.5px solid #064e3b; border-bottom: 1.5px solid #064e3b; }
          .audit-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; margin: 20px 0; }
          .audit-title { font-weight: 800; font-size: 12px; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; }
          .audit-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11.5px; }
          .audit-row.bold { font-weight: 800; font-size: 13px; border-top: 1.5px solid #cbd5e1; margin-top: 6px; padding-top: 8px; }
          .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; }
          .sign-box { text-align: center; width: 140px; }
          .sign-line { border-top: 1px dashed #94a3b8; margin-top: 36px; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="society-name">Satya Sai Educational Society</h1>
          <p class="society-sub">Plakonda · Vizianagaram Dist. · Andhra Pradesh</p>
          <div class="statement-title">Monthly Financial Audit Statement — ${monthName} ${year}</div>
        </div>

        <div class="meta-bar">
          <div><strong>Academic Audit Period:</strong> 01 ${monthName} ${year} to 31 ${monthName} ${year}</div>
          <div><strong>Generated on:</strong> ${generatedDate}</div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Total Fee Collections</div>
            <div class="kpi-value kpi-green">${formatINR(totalCollection)}</div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${fees.length} Total Receipts</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Operational Expenses</div>
            <div class="kpi-value kpi-rose">${formatINR(totalExpense)}</div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${expenses.length} Entries</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Staff Salaries Disbursed</div>
            <div class="kpi-value kpi-sky">${formatINR(totalSalary)}</div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${salaries.length} Staff Members</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Net Available Balance</div>
            <div class="kpi-value ${netRevenue >= 0 ? 'kpi-green' : 'kpi-rose'}">
              ${formatINR(netRevenue)}
            </div>
            <div style="font-size: 9.5px; font-weight: 700; color: ${netRevenue >= 0 ? '#16a34a' : '#e11d48'}; margin-top: 2px;">
              ${netRevenue >= 0 ? 'Monthly Surplus' : 'Monthly Deficit'}
            </div>
          </div>
        </div>

        <div class="section-title">1. Class-Wise Fee Collection Summary</div>
        <table>
          <thead>
            <tr>
              <th style="width: 32px;" class="center">#</th>
              <th>Class / Academic Stream</th>
              <th class="center" style="width: 130px;">Paying Enrolled Count</th>
              <th class="right" style="width: 150px;">Fee Collected (₹)</th>
              <th class="right" style="width: 100px;">Share (%)</th>
            </tr>
          </thead>
          <tbody>
            ${
              activeClassesWithFees.length > 0
                ? activeClassesWithFees
                    .map(
                      (c, idx) => `
                <tr>
                  <td class="center">${idx + 1}</td>
                  <td style="font-weight: 600;">${c.className}</td>
                  <td class="center">${c.count}</td>
                  <td class="right" style="font-weight: 600;">${formatINR(c.total)}</td>
                  <td class="right">${c.percentage.toFixed(1)}%</td>
                </tr>
              `
                    )
                    .join("")
                : `<tr><td colspan="5" class="center" style="color: #64748b; padding: 12px;">No fee collection records registered in ${monthName} ${year}.</td></tr>`
            }
          </tbody>
          <tfoot>
            <tr class="totals-row">
              <td colspan="2" style="text-align: right; text-transform: uppercase;">Total Collections</td>
              <td class="center">${fees.length} Receipts</td>
              <td class="right">${formatINR(totalCollection)}</td>
              <td class="right">100.0%</td>
            </tr>
          </tfoot>
        </table>

        <div class="section-title">2. Operational Expenses by Category</div>
        <table>
          <thead>
            <tr>
              <th style="width: 32px;" class="center">#</th>
              <th>Expenditure Category</th>
              <th class="center" style="width: 130px;">Voucher Transactions</th>
              <th class="right" style="width: 150px;">Total Expenditure (₹)</th>
              <th class="right" style="width: 100px;">Category Share</th>
            </tr>
          </thead>
          <tbody>
            ${
              Object.keys(expensesByCategory).length > 0
                ? Object.entries(expensesByCategory)
                    .map(([cat, val], idx) => {
                      const share = totalExpense > 0 ? (val.total / totalExpense) * 100 : 0;
                      return `
                  <tr>
                    <td class="center">${idx + 1}</td>
                    <td style="font-weight: 600;">${cat}</td>
                    <td class="center">${val.count}</td>
                    <td class="right" style="font-weight: 600;">${formatINR(val.total)}</td>
                    <td class="right">${share.toFixed(1)}%</td>
                  </tr>
                `;
                    })
                    .join("")
                : `<tr><td colspan="5" class="center" style="color: #64748b; padding: 12px;">No operational expenses registered in ${monthName} ${year}.</td></tr>`
            }
          </tbody>
          <tfoot>
            <tr class="totals-row">
              <td colspan="2" style="text-align: right; text-transform: uppercase;">Total Expenses</td>
              <td class="center">${expenses.length} Entries</td>
              <td class="right">${formatINR(totalExpense)}</td>
              <td class="right">100.0%</td>
            </tr>
          </tfoot>
        </table>

        <div class="section-title">3. Staff Salaries Register Summary</div>
        <table>
          <thead>
            <tr>
              <th style="width: 32px;" class="center">#</th>
              <th>Disbursement Category / Month</th>
              <th class="center" style="width: 130px;">Faculty / Staff Count</th>
              <th class="right" style="width: 150px;">Payroll Disbursed (₹)</th>
              <th class="right" style="width: 100px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              salaries.length > 0
                ? `
                <tr>
                  <td class="center">1</td>
                  <td style="font-weight: 600;">Teaching & Non-Teaching Staff Salaries (${monthName} ${year})</td>
                  <td class="center">${salaries.length} Employees</td>
                  <td class="right" style="font-weight: 600;">${formatINR(totalSalary)}</td>
                  <td class="right" style="color: #16a34a; font-weight: 700;">Disbursed</td>
                </tr>
              `
                : `<tr><td colspan="5" class="center" style="color: #64748b; padding: 12px;">No salary disbursements recorded for ${monthName} ${year}.</td></tr>`
            }
          </tbody>
          <tfoot>
            <tr class="totals-row">
              <td colspan="2" style="text-align: right; text-transform: uppercase;">Total Payroll</td>
              <td class="center">${salaries.length} Staff</td>
              <td class="right">${formatINR(totalSalary)}</td>
              <td class="right">—</td>
            </tr>
          </tfoot>
        </table>

        <div class="audit-box">
          <div class="audit-title">Monthly Audit Reconciliation & Available Balance</div>
          <div class="audit-row">
            <span>(+) Total Tuition & Student Fee Revenue</span>
            <span style="font-weight: 700; color: #16a34a;">${formatINR(totalCollection)}</span>
          </div>
          <div class="audit-row">
            <span>(−) Total Operational & Maintenance Expenditures</span>
            <span style="font-weight: 700; color: #e11d48;">${formatINR(totalExpense)}</span>
          </div>
          <div class="audit-row">
            <span>(−) Total Teaching & Non-Teaching Staff Payroll</span>
            <span style="font-weight: 700; color: #0284c7;">${formatINR(totalSalary)}</span>
          </div>
          <div class="audit-row bold">
            <span>Net Available Balance for Society Reserve (${monthName} ${year})</span>
            <span style="color: ${netRevenue >= 0 ? '#16a34a' : '#e11d48'};">
              ${formatINR(netRevenue)} ${netRevenue >= 0 ? '(Surplus)' : '(Deficit)'}
            </span>
          </div>
        </div>

        <div class="footer">
          <div>Report generated automatically by Satya Sai Educational Society Administration Portal.</div>
          <div style="display: flex; gap: 32px;">
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Accounts Officer</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Principal</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Correspondent / Secretary</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function downloadClassFeeReportPDF({
  className,
  monthName,
  year,
  fees,
}: {
  className: string;
  monthName: string;
  year: number;
  fees: FeeRecord[];
}) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download or print the PDF statement.");
    return;
  }

  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalClassFee = fees.reduce((sum, f) => sum + (f.fee_amount || 0), 0);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Fee Statement - ${className} - ${monthName} ${year}</title>
        <style>
          @page { size: A4; margin: 12mm 10mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 11.5px; line-height: 1.45; background: #fff; }
          .header { text-align: center; border-bottom: 3px double #064e3b; padding-bottom: 12px; margin-bottom: 16px; }
          .society-name { font-size: 22px; font-weight: 800; color: #064e3b; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .society-sub { font-size: 11.5px; color: #64748b; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
          .statement-title { font-size: 14px; font-weight: 700; color: #d97706; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-bar { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 11px; }
          .summary-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
          .summary-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #166534; letter-spacing: 0.5px; }
          .summary-val { font-size: 18px; font-weight: 800; color: #166534; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 14px; }
          th { background: #064e3b; color: #fff; padding: 7px 8px; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; text-align: left; }
          th.right, td.right { text-align: right; }
          th.center, td.center { text-align: center; }
          td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) td { background: #fcfdfd; }
          .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; }
          .sign-box { text-align: center; width: 140px; }
          .sign-line { border-top: 1px dashed #94a3b8; margin-top: 36px; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="society-name">Satya Sai Educational Society</h1>
          <p class="society-sub">Plakonda · Vizianagaram Dist. · Andhra Pradesh</p>
          <div class="statement-title">Class Fee Register — ${className} (${monthName} ${year})</div>
        </div>

        <div class="meta-bar">
          <div><strong>Class Stream:</strong> ${className}</div>
          <div><strong>Period:</strong> ${monthName} ${year}</div>
          <div><strong>Generated on:</strong> ${generatedDate}</div>
        </div>

        <div class="summary-card">
          <div>
            <div class="summary-label">Total Fee Collected for ${className}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Enrolled Students Paying: ${fees.length}</div>
          </div>
          <div class="summary-val">${formatINR(totalClassFee)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 32px;" class="center">#</th>
              <th>Roll / Receipt No</th>
              <th>Student Name</th>
              <th>Term</th>
              <th>Payment Date</th>
              <th>Mode</th>
              <th class="right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${
              fees.length > 0
                ? fees
                    .map(
                      (f, idx) => `
                <tr>
                  <td class="center">${idx + 1}</td>
                  <td style="font-family: monospace; font-size: 10.5px;">${f.hall_ticket_no || f.receipt_no || `REC-${f.id.slice(0, 6).toUpperCase()}`}</td>
                  <td style="font-weight: 600;">${f.student_name}</td>
                  <td><span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">${f.term || 'Term 1'}</span></td>
                  <td>${new Date(f.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td>${f.payment_mode || "Cash"}</td>
                  <td class="right" style="font-weight: 700; color: #166534;">${formatINR(f.fee_amount)}</td>
                </tr>
              `
                    )
                    .join("")
                : `<tr><td colspan="7" class="center" style="color: #64748b; padding: 16px;">No fee collection records found for ${className} in ${monthName} ${year}.</td></tr>`
            }
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: 800; border-top: 1.5px solid #064e3b; border-bottom: 1.5px solid #064e3b;">
              <td colspan="6" style="text-align: right; text-transform: uppercase;">Class Total Collection</td>
              <td class="right" style="color: #166534;">${formatINR(totalClassFee)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <div>Computer-generated fee statement — Satya Sai Educational Society.</div>
          <div style="display: flex; gap: 32px;">
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Class Incharge</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Accounts Officer</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Principal</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function downloadStudentFeeReceiptPDF(summary: {
  student: StudentRecord;
  totalFee: number;
  totalPaid: number;
  remainingDue: number;
  latestPayment?: FeeRecord;
  payments: FeeRecord[];
}) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download or print the student fee receipt.");
    return;
  }

  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const receiptNo = summary.latestPayment?.receipt_no || `REC-${Math.floor(100000 + Math.random() * 900000)}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Fee Receipt - ${summary.student.hall_ticket_no} - ${summary.student.student_name}</title>
        <style>
          @page { size: A4; margin: 12mm 10mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; font-size: 12px; line-height: 1.5; background: #fff; }
          .header { text-align: center; border-bottom: 3px double #064e3b; padding-bottom: 12px; margin-bottom: 16px; }
          .society-name { font-size: 22px; font-weight: 800; color: #064e3b; margin: 0; text-transform: uppercase; }
          .society-sub { font-size: 11.5px; color: #64748b; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
          .receipt-badge { font-size: 14px; font-weight: 700; color: #d97706; margin-top: 8px; text-transform: uppercase; }
          .student-card { background: #faf8f5; border: 1.5px solid #e5e0d4; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
          .label { font-size: 10.5px; color: #64748b; text-transform: uppercase; font-weight: 600; }
          .value { font-size: 12.5px; font-weight: 700; color: #0f172a; }
          .financial-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
          .f-box { border-radius: 6px; padding: 12px; text-align: center; }
          .f-box.total { background: #f8fafc; border: 1px solid #cbd5e1; }
          .f-box.paid { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
          .f-box.due { background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; }
          table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-top: 10px; }
          th { background: #064e3b; color: white; padding: 8px 10px; text-align: left; font-size: 10.5px; text-transform: uppercase; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10.5px; color: #64748b; }
          .sign-box { text-align: center; width: 150px; }
          .sign-line { border-top: 1px dashed #94a3b8; margin-top: 40px; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="society-name">Satya Sai Educational Society</h1>
          <p class="society-sub">Plakonda · Vizianagaram Dist. · Andhra Pradesh</p>
          <div class="receipt-badge">Official Student Fee Payment Receipt & Statement</div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 14px;">
          <div><strong>Receipt No:</strong> <span style="font-family: monospace; font-weight: 700;">${receiptNo}</span></div>
          <div><strong>Date:</strong> ${generatedDate}</div>
        </div>

        <div class="student-card">
          <div class="grid-2">
            <div>
              <div class="label">Hall Ticket / Roll No</div>
              <div class="value" style="font-family: monospace; color: #064e3b; font-size: 14px;">${summary.student.hall_ticket_no}</div>
            </div>
            <div>
              <div class="label">Student Name</div>
              <div class="value">${summary.student.student_name}</div>
            </div>
            <div>
              <div class="label">Class & Group</div>
              <div class="value">${summary.student.class} (${summary.student.group_name}) — Sec ${summary.student.section}</div>
            </div>
            <div>
              <div class="label">Contact / Phone</div>
              <div class="value">${summary.student.phone || "—"}</div>
            </div>
          </div>
        </div>

        <div class="financial-summary">
          <div class="f-box total">
            <div class="label">Total Annual Fee</div>
            <div style="font-size: 16px; font-weight: 800; margin-top: 4px;">${formatINR(summary.totalFee)}</div>
          </div>
          <div class="f-box paid">
            <div class="label" style="color: #166534;">Total Amount Paid</div>
            <div style="font-size: 16px; font-weight: 800; margin-top: 4px;">${formatINR(summary.totalPaid)}</div>
          </div>
          <div class="f-box due">
            <div class="label" style="color: #be123c;">Remaining Fee Due</div>
            <div style="font-size: 16px; font-weight: 800; margin-top: 4px;">${formatINR(summary.remainingDue)}</div>
          </div>
        </div>

        <div style="font-weight: 800; font-size: 12px; color: #064e3b; text-transform: uppercase; margin-bottom: 6px;">Payment History Across Terms</div>
        <table>
          <thead>
            <tr>
              <th style="width: 32px; text-align: center;">#</th>
              <th>Term</th>
              <th>Receipt No</th>
              <th>Date of Payment</th>
              <th>Payment Mode</th>
              <th style="text-align: right;">Amount Paid</th>
            </tr>
          </thead>
          <tbody>
            ${
              summary.payments.length > 0
                ? summary.payments
                    .map(
                      (p, idx) => `
                <tr>
                  <td style="text-align: center; color: #64748b;">${idx + 1}</td>
                  <td><span style="font-weight: 700; color: #92400e;">${p.term || "Term 1"}</span></td>
                  <td style="font-family: monospace;">${p.receipt_no || "REC-" + p.id.slice(0, 6).toUpperCase()}</td>
                  <td>${new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td>${p.payment_mode || "Cash"}</td>
                  <td style="text-align: right; font-weight: 700; color: #166534;">${formatINR(p.fee_amount)}</td>
                </tr>
              `
                    )
                    .join("")
                : `<tr><td colspan="6" style="text-align: center; padding: 14px; color: #64748b;">No prior payments recorded for this roll number.</td></tr>`
            }
          </tbody>
        </table>

        <div class="footer">
          <div>This is a computer-verified institutional fee receipt from Satya Sai Educational Society.</div>
          <div style="display: flex; gap: 40px;">
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Student / Parent</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Cashier / Accountant</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function downloadExpensesReportPDF({
  monthName,
  year,
  expenses,
}: {
  monthName: string;
  year: number;
  expenses: ExpenseRecord[];
}) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download or print the PDF statement.");
    return;
  }

  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Expenses Statement - ${monthName} ${year} - Satya Sai Educational Society</title>
        <style>
          @page { size: A4; margin: 12mm 10mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 11.5px; line-height: 1.45; background: #fff; }
          .header { text-align: center; border-bottom: 3px double #064e3b; padding-bottom: 12px; margin-bottom: 16px; }
          .society-name { font-size: 22px; font-weight: 800; color: #064e3b; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .society-sub { font-size: 11.5px; color: #64748b; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
          .statement-title { font-size: 14px; font-weight: 700; color: #d97706; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-bar { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 11px; }
          .summary-card { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
          .summary-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #be123c; letter-spacing: 0.5px; }
          .summary-val { font-size: 18px; font-weight: 800; color: #be123c; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 14px; }
          th { background: #064e3b; color: #fff; padding: 7px 8px; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; text-align: left; }
          th.right, td.right { text-align: right; }
          th.center, td.center { text-align: center; }
          td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) td { background: #fcfdfd; }
          .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; }
          .sign-box { text-align: center; width: 140px; }
          .sign-line { border-top: 1px dashed #94a3b8; margin-top: 36px; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="society-name">Satya Sai Educational Society</h1>
          <p class="society-sub">Plakonda · Vizianagaram Dist. · Andhra Pradesh</p>
          <div class="statement-title">Operational Expenses Statement — ${monthName} ${year}</div>
        </div>

        <div class="meta-bar">
          <div><strong>Statement:</strong> Monthly Expenditure Ledger</div>
          <div><strong>Period:</strong> ${monthName} ${year}</div>
          <div><strong>Generated on:</strong> ${generatedDate}</div>
        </div>

        <div class="summary-card">
          <div>
            <div class="summary-label">Total Operational Expenses Disbursed</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Voucher Transactions: ${expenses.length}</div>
          </div>
          <div class="summary-val">${formatINR(totalExpense)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 32px;" class="center">#</th>
              <th>Voucher No</th>
              <th>Category</th>
              <th>Particulars / Description</th>
              <th>Date</th>
              <th>Mode</th>
              <th class="right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${
              expenses.length > 0
                ? expenses
                    .map(
                      (e, idx) => `
                <tr>
                  <td class="center">${idx + 1}</td>
                  <td style="font-family: monospace; font-size: 10.5px;">${e.voucher_no || `VCH-${e.id.slice(0, 6).toUpperCase()}`}</td>
                  <td style="font-weight: 600;">${e.category || "General Operations"}</td>
                  <td>${e.reason}</td>
                  <td>${new Date(e.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td>${e.payment_mode || "Cash"}</td>
                  <td class="right" style="font-weight: 700; color: #be123c;">${formatINR(e.amount)}</td>
                </tr>
              `
                    )
                    .join("")
                : `<tr><td colspan="7" class="center" style="color: #64748b; padding: 16px;">No operational expenses registered in ${monthName} ${year}.</td></tr>`
            }
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: 800; border-top: 1.5px solid #064e3b; border-bottom: 1.5px solid #064e3b;">
              <td colspan="6" style="text-align: right; text-transform: uppercase;">Total Monthly Expenditures</td>
              <td class="right" style="color: #be123c;">${formatINR(totalExpense)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <div>Computer-generated expenditure ledger — Satya Sai Educational Society.</div>
          <div style="display: flex; gap: 32px;">
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Accountant</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Administrative Officer</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Correspondent / Secretary</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function downloadSalariesReportPDF({
  monthName,
  year,
  salaries,
}: {
  monthName: string;
  year: number;
  salaries: SalaryRecord[];
}) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download or print the PDF statement.");
    return;
  }

  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalSalary = salaries.reduce((sum, s) => sum + (s.salary_amount || 0), 0);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Salaries Statement - ${monthName} ${year} - Satya Sai Educational Society</title>
        <style>
          @page { size: A4; margin: 12mm 10mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 11.5px; line-height: 1.45; background: #fff; }
          .header { text-align: center; border-bottom: 3px double #064e3b; padding-bottom: 12px; margin-bottom: 16px; }
          .society-name { font-size: 22px; font-weight: 800; color: #064e3b; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .society-sub { font-size: 11.5px; color: #64748b; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
          .statement-title { font-size: 14px; font-weight: 700; color: #d97706; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-bar { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 11px; }
          .summary-card { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
          .summary-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0369a1; letter-spacing: 0.5px; }
          .summary-val { font-size: 18px; font-weight: 800; color: #0369a1; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 14px; }
          th { background: #064e3b; color: #fff; padding: 7px 8px; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; text-align: left; }
          th.right, td.right { text-align: right; }
          th.center, td.center { text-align: center; }
          td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) td { background: #fcfdfd; }
          .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; }
          .sign-box { text-align: center; width: 140px; }
          .sign-line { border-top: 1px dashed #94a3b8; margin-top: 36px; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="society-name">Satya Sai Educational Society</h1>
          <p class="society-sub">Plakonda · Vizianagaram Dist. · Andhra Pradesh</p>
          <div class="statement-title">Staff Salary Disbursement Register — ${monthName} ${year}</div>
        </div>

        <div class="meta-bar">
          <div><strong>Statement:</strong> Monthly Payroll Disbursement Register</div>
          <div><strong>Salary Month:</strong> ${monthName} ${year}</div>
          <div><strong>Generated on:</strong> ${generatedDate}</div>
        </div>

        <div class="summary-card">
          <div>
            <div class="summary-label">Total Payroll Disbursed</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Faculty & Staff Members: ${salaries.length}</div>
          </div>
          <div class="summary-val">${formatINR(totalSalary)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 32px;" class="center">#</th>
              <th>Voucher No</th>
              <th>Faculty / Staff Name</th>
              <th>Designation / Role</th>
              <th>Salary Month</th>
              <th>Disbursement Date</th>
              <th>Mode</th>
              <th class="right">Amount Paid (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${
              salaries.length > 0
                ? salaries
                    .map(
                      (s, idx) => `
                <tr>
                  <td class="center">${idx + 1}</td>
                  <td style="font-family: monospace; font-size: 10.5px;">SAL-${s.id.slice(0, 6).toUpperCase()}</td>
                  <td style="font-weight: 700; color: #0f172a;">${s.staff_name}</td>
                  <td style="color: #064e3b; font-weight: 600;">${s.designation}</td>
                  <td>${s.salary_month}</td>
                  <td>${new Date(s.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td>${s.payment_mode || "Bank Transfer"}</td>
                  <td class="right" style="font-weight: 700; color: #0369a1;">${formatINR(s.salary_amount)}</td>
                </tr>
              `
                    )
                    .join("")
                : `<tr><td colspan="8" class="center" style="color: #64748b; padding: 16px;">No salary disbursements recorded for ${monthName} ${year}.</td></tr>`
            }
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: 800; border-top: 1.5px solid #064e3b; border-bottom: 1.5px solid #064e3b;">
              <td colspan="7" style="text-align: right; text-transform: uppercase;">Total Payroll Disbursed</td>
              <td class="right" style="color: #0369a1;">${formatINR(totalSalary)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <div>Computer-generated salary register — Satya Sai Educational Society.</div>
          <div style="display: flex; gap: 32px;">
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Accountant</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Headmaster / Principal</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Correspondent / Secretary</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function downloadAdmissionEnquiriesPDF(enquiries: AdmissionEnquiryRecord[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download or print the enquiries register.");
    return;
  }

  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const rowsHtml = enquiries
    .map(
      (e, idx) => `
      <tr>
        <td style="text-align: center; color: #64748b; font-size: 11px;">${idx + 1}</td>
        <td style="font-weight: 700; color: #0f172a; font-size: 12px;">${e.student_name}</td>
        <td style="color: #064e3b; font-weight: 700; font-size: 11px;">${e.class_of_admission}</td>
        <td style="font-family: monospace; color: #334155; font-size: 11px;">${e.phone}</td>
        <td style="color: #475569; font-size: 11px;">${e.location}</td>
        <td style="text-align: right; color: #64748b; font-size: 11px;">${new Date(e.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
      </tr>
    `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Admission Enquiries Register - Satya Sai Educational Society</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 10mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 11.5px; line-height: 1.45; background: #fff; }
          .header { text-align: center; border-bottom: 3px double #064e3b; padding-bottom: 12px; margin-bottom: 16px; }
          .society-name { font-size: 22px; font-weight: 800; color: #064e3b; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .society-sub { font-size: 11.5px; color: #64748b; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
          .statement-title { font-size: 14px; font-weight: 700; color: #d97706; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-bar { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 11px; }
          .summary-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; }
          .summary-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #166534; letter-spacing: 0.5px; }
          .summary-val { font-size: 18px; font-weight: 800; color: #166534; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
          th { background: #064e3b; color: #fff; padding: 8px 10px; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) td { background: #fcfdfd; }
          .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; }
          .sign-box { text-align: center; width: 140px; }
          .sign-line { border-top: 1px dashed #94a3b8; margin-top: 36px; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="society-name">Satya Sai Educational Society</h1>
          <p class="society-sub">Plakonda · Vizianagaram Dist. · Andhra Pradesh</p>
          <div class="statement-title">Prospective Students Admission Enquiries Register</div>
        </div>

        <div class="meta-bar">
          <div><strong>Official Admissions Record:</strong> Confidential Office Document</div>
          <div><strong>Generated on:</strong> ${generatedDate}</div>
        </div>

        <div class="summary-card">
          <div class="summary-label">Total Admissions Inquiries</div>
          <div class="summary-val">${enquiries.length} Registered</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 32px; text-align: center;">#</th>
              <th style="text-align: left;">Student Name</th>
              <th style="text-align: left;">Class of Admission</th>
              <th style="text-align: left;">Contact Mobile</th>
              <th style="text-align: left;">Location / Village</th>
              <th style="text-align: right;">Enquiry Date</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #94a3b8; font-style: italic;">No admission enquiries recorded yet.</td></tr>`}
          </tbody>
        </table>

        <div class="footer">
          <div>Computer-generated admission enquiry register — SSES Administration Portal.</div>
          <div style="display: flex; gap: 32px;">
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Admissions Officer</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>Principal / Correspondent</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function downloadAdmissionEnquiriesCSV(enquiries: AdmissionEnquiryRecord[]) {
  const headers = ["Index", "Student Name", "Class of Admission", "Phone", "Location", "Received Date"];
  const rows = enquiries.map((e, idx) => [
    idx + 1,
    `"${(e.student_name || "").replace(/"/g, '""')}"`,
    `"${(e.class_of_admission || "").replace(/"/g, '""')}"`,
    `"${e.phone || ""}"`,
    `"${(e.location || "").replace(/"/g, '""')}"`,
    `"${new Date(e.created_at).toLocaleDateString("en-IN")}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `SSES_Admission_Enquiries_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
