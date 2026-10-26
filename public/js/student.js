// Student Dashboard Controller

async function initStudentDashboard() {
  if (!Auth.requireAuth()) return;

  const user = Auth.getUser();
  if (user) {
    document.getElementById('studentName').textContent = user.name || 'Student';
    document.getElementById('studentUsername').textContent = user.username || '--';
    document.getElementById('studentEmail').textContent = user.email || '--';
  }

  await loadStudentRecords();
}

async function loadStudentRecords() {
  const activeBody = document.getElementById('activeLoansBody');
  const historyBody = document.getElementById('historyLoansBody');

  try {
    // Both /borrow/my-records and /student/records supported
    const response = await API.get('/borrow/my-records').catch(() => API.get('/student/records'));
    const records = response.data || [];

    const activeRecords = records.filter(r => r.status === 'issued');
    const historyRecords = records.filter(r => r.status === 'returned');

    document.getElementById('activeLoansCount').textContent = activeRecords.length;
    document.getElementById('historyLoansCount').textContent = historyRecords.length;

    renderActiveLoans(activeRecords);
    renderHistoryLoans(historyRecords);
  } catch (err) {
    activeBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-danger">
          Failed to load borrow records: ${escapeHtml(err.message)}
        </td>
      </tr>
    `;
    historyBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-danger">
          Failed to load history.
        </td>
      </tr>
    `;
  }
}

function renderActiveLoans(records) {
  const tbody = document.getElementById('activeLoansBody');

  if (records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          <i class="bi bi-info-circle me-1"></i> You currently have no issued books. Browse the catalogue to find books to borrow!
        </td>
      </tr>
    `;
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  tbody.innerHTML = records.map((r, i) => {
    const dueDate = new Date(r.due_date);
    const isOverdue = dueDate < today;

    const formattedIssue = formatDate(r.issue_date);
    const formattedDue = formatDate(r.due_date);

    return `
      <tr>
        <td class="text-muted fw-semibold">${i + 1}</td>
        <td class="fw-bold text-dark">${escapeHtml(r.book_title)}</td>
        <td class="text-muted">${escapeHtml(r.book_author)}</td>
        <td><code>${escapeHtml(r.book_isbn)}</code></td>
        <td>${formattedIssue}</td>
        <td>
          <span class="${isOverdue ? 'text-danger fw-bold' : ''}">
            ${formattedDue}
            ${isOverdue ? ' <span class="badge bg-danger ms-1">Overdue</span>' : ''}
          </span>
        </td>
        <td class="text-center">
          <span class="badge badge-issued">Currently Issued</span>
        </td>
      </tr>
    `;
  }).join('');
}

function renderHistoryLoans(records) {
  const tbody = document.getElementById('historyLoansBody');

  if (records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          No past loan records found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = records.map((r, i) => {
    return `
      <tr>
        <td class="text-muted fw-semibold">${i + 1}</td>
        <td class="fw-bold text-dark">${escapeHtml(r.book_title)}</td>
        <td class="text-muted">${escapeHtml(r.book_author)}</td>
        <td><code>${escapeHtml(r.book_isbn)}</code></td>
        <td>${formatDate(r.issue_date)}</td>
        <td>${formatDate(r.return_date)}</td>
        <td class="text-center">
          <span class="badge badge-returned">Returned</span>
        </td>
      </tr>
    `;
  }).join('');
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

document.addEventListener('DOMContentLoaded', initStudentDashboard);
