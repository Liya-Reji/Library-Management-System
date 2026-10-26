// Book Catalogue Controller

let allBooks = [];

async function fetchBooks() {
  const tableBody = document.getElementById('booksTableBody');
  const statusEl = document.getElementById('catalogueStatus');

  try {
    const searchVal = document.getElementById('searchInput').value.trim();
    const categoryVal = document.getElementById('categorySelect').value;

    let queryParams = [];
    if (searchVal) queryParams.push(`search=${encodeURIComponent(searchVal)}`);
    if (categoryVal && categoryVal !== 'All') queryParams.push(`category=${encodeURIComponent(categoryVal)}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const response = await API.get(`/books${queryString}`);

    allBooks = response.data || [];
    renderBooks(allBooks);

    statusEl.textContent = `Showing ${allBooks.length} book title${allBooks.length === 1 ? '' : 's'}`;
  } catch (err) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-5 text-danger">
          <i class="bi bi-exclamation-triangle-fill fs-2 d-block mb-2"></i>
          Failed to load book catalogue: ${escapeHtml(err.message)}
        </td>
      </tr>
    `;
    statusEl.textContent = 'Error loading books';
  }
}

function renderBooks(books) {
  const tableBody = document.getElementById('booksTableBody');

  if (!books || books.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-5 text-muted">
          <i class="bi bi-journal-x fs-2 d-block mb-2 text-secondary"></i>
          No books found matching your criteria.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = books.map((book, idx) => {
    let badgeClass = 'badge-available';
    let badgeText = `${book.available_copies} / ${book.total_copies} available`;

    if (book.available_copies === 0) {
      badgeClass = 'badge-out';
      badgeText = 'Out of Stock (0)';
    } else if (book.available_copies === 1) {
      badgeClass = 'badge-low';
      badgeText = `1 / ${book.total_copies} available (Low)`;
    }

    return `
      <tr>
        <td class="text-muted fw-semibold">${idx + 1}</td>
        <td>
          <div class="fw-bold text-dark">${escapeHtml(book.title)}</div>
        </td>
        <td class="text-muted">${escapeHtml(book.author)}</td>
        <td><span class="badge bg-light text-secondary border">${escapeHtml(book.category)}</span></td>
        <td><code class="text-muted">${escapeHtml(book.isbn)}</code></td>
        <td class="text-center">
          <span class="badge ${badgeClass}">${badgeText}</span>
        </td>
      </tr>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  if (searchParam) {
    document.getElementById('searchInput').value = searchParam;
  }

  // Admin link if logged in as admin
  if (Auth.isAdmin()) {
    const adminContainer = document.getElementById('adminActionContainer');
    if (adminContainer) {
      adminContainer.innerHTML = `
        <a href="admin.html" class="btn btn-primary btn-sm">
          <i class="bi bi-gear-fill"></i> Manage Books in Admin Desk
        </a>
      `;
    }
  }

  document.getElementById('searchInput').addEventListener('input', debounce(fetchBooks, 300));
  document.getElementById('categorySelect').addEventListener('change', fetchBooks);
  document.getElementById('resetFiltersBtn').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('categorySelect').value = 'All';
    fetchBooks();
  });

  fetchBooks();
});

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
