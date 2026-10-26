// Authentication state and UI helpers

const Auth = {
  getUser() {
    const raw = localStorage.getItem('lms_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('lms_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('lms_user');
    }
  },

  isLoggedIn() {
    return !!API.getToken() && !!this.getUser();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  isStudent() {
    const user = this.getUser();
    return user && user.role === 'student';
  },

  logout() {
    API.setToken(null);
    this.setUser(null);
    window.location.href = 'login.html';
  },

  requireAuth(requiredRole = null) {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }

    if (requiredRole) {
      const user = this.getUser();
      if (!user || user.role !== requiredRole) {
        alert(`Access restricted to ${requiredRole}s only.`);
        window.location.href = user && user.role === 'admin' ? 'admin.html' : 'student.html';
        return false;
      }
    }
    return true;
  },

  updateNavbar() {
    const navLinksContainer = document.getElementById('navbarLinks');
    if (!navLinksContainer) return;

    const user = this.getUser();
    const currentPath = window.location.pathname;

    let linksHtml = `
      <li class="nav-item">
        <a class="nav-link ${currentPath.endsWith('index.html') || currentPath.endsWith('/') ? 'active' : ''}" href="index.html">
          <i class="bi bi-house-door"></i> Home
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link ${currentPath.endsWith('books.html') ? 'active' : ''}" href="books.html">
          <i class="bi bi-book"></i> Book Catalogue
        </a>
      </li>
    `;

    if (user) {
      if (user.role === 'admin') {
        linksHtml += `
          <li class="nav-item">
            <a class="nav-link ${currentPath.endsWith('admin.html') ? 'active' : ''}" href="admin.html">
              <i class="bi bi-speedometer2"></i> Admin Dashboard
            </a>
          </li>
        `;
      } else {
        linksHtml += `
          <li class="nav-item">
            <a class="nav-link ${currentPath.endsWith('student.html') ? 'active' : ''}" href="student.html">
              <i class="bi bi-person-badge"></i> My Loans
            </a>
          </li>
        `;
      }

      linksHtml += `
        <li class="nav-item dropdown ms-lg-2">
          <a class="nav-link dropdown-toggle btn btn-sm btn-outline-light text-start text-lg-center px-3" href="#" role="button" data-bs-toggle="dropdown">
            <i class="bi bi-person-circle"></i> ${escapeHtml(user.name)} (${user.role})
          </a>
          <ul class="dropdown-menu dropdown-menu-end shadow">
            <li><h6 class="dropdown-header">Signed in as <strong>@${escapeHtml(user.username)}</strong></h6></li>
            <li><hr class="dropdown-divider"></li>
            <li>
              <a class="dropdown-item text-danger" href="javascript:void(0);" onclick="Auth.logout()">
                <i class="bi bi-box-arrow-right"></i> Log Out
              </a>
            </li>
          </ul>
        </li>
      `;
    } else {
      linksHtml += `
        <li class="nav-item ms-lg-2">
          <a class="nav-link ${currentPath.endsWith('login.html') ? 'active' : ''}" href="login.html">
            <i class="bi bi-box-arrow-in-right"></i> Login
          </a>
        </li>
        <li class="nav-item">
          <a class="btn btn-primary btn-sm ms-lg-2 mt-2 mt-lg-0 px-3" href="register.html">
            <i class="bi bi-person-plus"></i> Register
          </a>
        </li>
      `;
    }

    navLinksContainer.innerHTML = linksHtml;
  }
};

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  Auth.updateNavbar();
});
