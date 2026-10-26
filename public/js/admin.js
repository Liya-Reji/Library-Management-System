// Admin Desk Controller

let booksCache = [];
let studentsCache = [];

function showAdminAlert(message, type = 'success') {
  const alertEl = document.getElementById('adminAlert');
  const alertText = document.getElementById('adminAlertText');
  alertEl.className = `alert alert-${type} alert-dismissible fade show`;
  alertText.textContent = message;
  alertEl.classList.remove('d-none');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function initAdminDashboard() {
  if (!Auth.requireAuth('admin')) return;

  await loadAdminStats();
  await loadAdminBooks();

  document.getElementById('adminBookSearch').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = booksCache.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
    renderAdminBooks(filtered);
  });
}

async function loadAdminStats() {
  try {
    const res = await API.get('/stats');
    if (res.data) {
      document.getElementById('adminTotalTitles').textContent = res.data.total_titles || 0;
      document.getElementById('adminAvailableCopies').textContent = res.data.available_copies || 0;
      document.getElementById('adminTotalCopies').textContent = res.data.total_copies || 0;
      document.getElementById('adminActiveLoans').textContent = res.data.active_loans || 0;
    }
  } catch (err) {
    console.error('Stats load failed:', err.message);
  }
}

async function loadAdminBooks() {
  const tbody = document.getElementById('adminBooksTableBody');
  try {
    const res = await API.get('/books');
    booksCache = res.data || [];
    renderAdminBooks(booksCache);
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-danger">
          Error loading books: ${escapeHtml(err.message)}
        </td>
      </tr>
    `;
  }
}

function renderAdminBooks(books) {
  const tbody = document.getElementById('adminBooksTableBody');
  if (books.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-muted">
          No books found in the library database.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = books.map((b, i) => `
    <tr>
      <td class="text-muted fw-semibold">${i + 1}</td>
      <td class="fw-bold">${escapeHtml(b.title)}</td>
      <td class="text-muted">${escapeHtml(b.author)}</td>
      <td><span class="badge bg-light text-secondary border">${escapeHtml(b.category)}</span></td>
      <td><code>${escapeHtml(b.isbn)}</code></td>
      <td class="text-center fw-semibold">${b.total_copies}</td>
      <td class="text-center">
        <span class="badge ${b.available_copies > 0 ? 'bg-success' : 'bg-danger'}">
          ${b.available_copies}
        </span>
      </td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditBook(${b.id})" title="Edit Book">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="confirmDeleteBook(${b.id}, '${escapeHtml(b.title)}')" title="Delete Book">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function submitAddBook() {
  const title = document.getElementById('addTitle').value.trim();
  const author = document.getElementById('addAuthor').value.trim();
  const category = document.getElementById('addCategory').value.trim();
  const isbn = document.getElementById('addIsbn').value.trim();
  const total_copies = document.getElementById('addCopies').value;

  try {
    const res = await API.post('/books', { title, author, category, isbn, total_copies });
    showAdminAlert(`Book "${res.data.title}" added successfully!`, 'success');

    // Close modal
    const modalEl = document.getElementById('addBookModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    // Reset form
    document.getElementById('addTitle').value = '';
    document.getElementById('addAuthor').value = '';
    document.getElementById('addCategory').value = '';
    document.getElementById('addIsbn').value = '';
    document.getElementById('addCopies').value = '5';

    await loadAdminBooks();
    await loadAdminStats();
  } catch (err) {
    showAdminAlert(err.message, 'danger');
  }
}

function openEditBook(bookId) {
  const book = booksCache.find(b => b.id === bookId);
  if (!book) return;

  document.getElementById('editBookId').value = book.id;
  document.getElementById('editTitle').value = book.title;
  document.getElementById('editAuthor').value = book.author;
  document.getElementById('editCategory').value = book.category;
  document.getElementById('editIsbn').value = book.isbn;
  document.getElementById('editCopies').value = book.total_copies;

  const modal = new bootstrap.Modal(document.getElementById('editBookModal'));
  modal.show();
}

async function submitEditBook() {
  const id = document.getElementById('editBookId').value;
  const title = document.getElementById('editTitle').value.trim();
  const author = document.getElementById('editAuthor').value.trim();
  const category = document.getElementById('editCategory').value.trim();
  const isbn = document.getElementById('editIsbn').value.trim();
  const total_copies = document.getElementById('editCopies').value;

  try {
    const res = await API.put(`/books/${id}`, { title, author, category, isbn, total_copies });
    showAdminAlert(`Book "${res.data.title}" updated successfully!`, 'success');

    const modalEl = document.getElementById('editBookModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    await loadAdminBooks();
    await loadAdminStats();
  } catch (err) {
    showAdminAlert(err.message, 'danger');
  }
}

async function confirmDeleteBook(id, title) {
  if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
    return;
  }

  try {
    await API.delete(`/books/${id}`);
    showAdminAlert(`Book deleted successfully.`, 'success');
    await loadAdminBooks();
    await loadAdminStats();
  } catch (err) {
    showAdminAlert(`Cannot delete book: ${err.message}`, 'danger');
  }
}

async function loadAdminLoans() {
  const tbody = document.getElementById('adminLoansTableBody');
  const badge = document.getElementById('activeLoansBadge');

  try {
    const res = await API.get('/borrow/records?status=issued').catch(() =>
      API.get('/student/records?all=true&status=issued')
    );
    const loans = res.data || [];
    badge.textContent = `${loans.length} Active`;

    if (loans.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4 text-muted">
            There are currently no active book loans.
          </td>
        </tr>
      `;
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tbody.innerHTML = loans.map((l, i) => {
      const isOverdue = new Date(l.due_date) < today;
      return `
        <tr>
          <td class="text-muted fw-semibold">${i + 1}</td>
          <td>
            <strong>${escapeHtml(l.user_name || l.username)}</strong>
            <div class="small text-muted">${escapeHtml(l.user_email || '')}</div>
          </td>
          <td class="fw-bold">${escapeHtml(l.book_title)}</td>
          <td><code>${escapeHtml(l.book_isbn)}</code></td>
          <td>${formatDate(l.issue_date)}</td>
          <td>
            <span class="${isOverdue ? 'text-danger fw-bold' : ''}">
              ${formatDate(l.due_date)}
              ${isOverdue ? '<span class="badge bg-danger ms-1">Overdue</span>' : ''}
            </span>
          </td>
          <td><span class="badge badge-issued">Issued</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-success" onclick="recordReturn(${l.id})">
              <i class="bi bi-arrow-return-left me-1"></i> Return
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-danger">
          Error loading loans: ${escapeHtml(err.message)}
        </td>
      </tr>
    `;
  }
}

async function recordReturn(recordId) {
  if (!confirm('Confirm return of this book? Available copies count will be incremented.')) {
    return;
  }

  try {
    await API.post('/borrow/return', { record_id: recordId });
    showAdminAlert('Book return recorded successfully!', 'success');
    await loadAdminLoans();
    await loadAdminBooks();
    await loadAdminStats();
  } catch (err) {
    showAdminAlert(`Return failed: ${err.message}`, 'danger');
  }
}

async function loadAdminStudents() {
  const tbody = document.getElementById('adminStudentsTableBody');
  try {
    const res = await API.get('/borrow/students').catch(() =>
      API.get('/admin/students')
    );
    studentsCache = res.data || [];

    if (studentsCache.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            No registered students found.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = studentsCache.map((s, i) => `
      <tr>
        <td class="text-muted fw-semibold">${i + 1}</td>
        <td class="fw-bold">${escapeHtml(s.name)}</td>
        <td><code>@${escapeHtml(s.username)}</code></td>
        <td class="text-muted">${escapeHtml(s.email)}</td>
        <td>${formatDate(s.created_at)}</td>
        <td class="text-center">
          <span class="badge ${s.active_borrows > 0 ? 'bg-primary' : 'bg-light text-secondary border'}">
            ${s.active_borrows} active
          </span>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-danger">
          Error loading students: ${escapeHtml(err.message)}
        </td>
      </tr>
    `;
  }
}

async function prepareIssueModal() {
  const studentSelect = document.getElementById('issueStudentSelect');
  const bookSelect = document.getElementById('issueBookSelect');
  const dueDateInput = document.getElementById('issueDueDate');

  // Set default due date: today + 14 days
  const d = new Date();
  d.setDate(d.getDate() + 14);
  dueDateInput.value = d.toISOString().split('T')[0];

  // Load students
  try {
    const sRes = await API.get('/borrow/students').catch(() => API.get('/admin/students'));
    const students = sRes.data || [];
    studentSelect.innerHTML = '<option value="">Choose registered student...</option>' +
      students.map(s => `<option value="${s.id}">${escapeHtml(s.name)} (@${escapeHtml(s.username)})</option>`).join('');
  } catch (err) {
    studentSelect.innerHTML = '<option value="">Failed to load students</option>';
  }

  // Load books
  try {
    const bRes = await API.get('/books');
    const books = bRes.data || [];
    bookSelect.innerHTML = '<option value="">Choose book to issue...</option>' +
      books.map(b => {
        const disabled = b.available_copies <= 0 ? 'disabled' : '';
        const availText = b.available_copies <= 0 ? '(Out of stock)' : `(${b.available_copies} available)`;
        return `<option value="${b.id}" ${disabled}>${escapeHtml(b.title)} ${availText}</option>`;
      }).join('');
  } catch (err) {
    bookSelect.innerHTML = '<option value="">Failed to load books</option>';
  }
}

async function submitIssueBook() {
  const user_id = document.getElementById('issueStudentSelect').value;
  const book_id = document.getElementById('issueBookSelect').value;
  const due_date = document.getElementById('issueDueDate').value;

  if (!user_id || !book_id || !due_date) {
    alert('Please select student, book, and due date.');
    return;
  }

  try {
    await API.post('/borrow/issue', { user_id, book_id, due_date });
    showAdminAlert('Book issued to student successfully!', 'success');

    const modalEl = document.getElementById('issueBookModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    await loadAdminBooks();
    await loadAdminStats();
    if (document.getElementById('loans-tab').classList.contains('active')) {
      await loadAdminLoans();
    }
  } catch (err) {
    showAdminAlert(`Issue failed: ${err.message}`, 'danger');
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

document.addEventListener('DOMContentLoaded', initAdminDashboard);
