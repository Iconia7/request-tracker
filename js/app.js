/**
 * REQUEST TRACKER — App Logic
 *
 * Handles:
 *  - Form submission & validation
 *  - localStorage persistence
 *  - Rendering request cards
 *  - Filtering (status, type, priority) & search
 *  - Status updates & deletion
 *  - Toast notifications & confirm dialog
 *  - Live stats bar
 */

/* ============================================================
   DATA LAYER — localStorage wrapper
   ============================================================ */

const STORAGE_KEY = 'rt_requests_v1';

function loadRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRequests(requests) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      showToast('error', '!', 'Storage full. Some data may not be saved.');
    }
  }
}

function generateId() {
  // Simple UUID-like generator (no crypto dependency needed here)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/* ============================================================
   STATE
   ============================================================ */

let requests = loadRequests();

let filters = {
  search:   '',
  status:   '',
  type:     '',
  priority: '',
  sort:     'newest',
};

/* ============================================================
   DOM REFERENCES
   ============================================================ */

const form            = document.getElementById('request-form');
const submitBtn       = document.getElementById('btn-submit');
const requestsList    = document.getElementById('requests-list');
const emptyState      = document.getElementById('empty-state');
const resultCount     = document.getElementById('result-count');
const searchInput     = document.getElementById('search-input');
const filterStatus    = document.getElementById('filter-status');
const filterType      = document.getElementById('filter-type');
const filterPriority  = document.getElementById('filter-priority');
const sortSelect      = document.getElementById('sort-select');
const btnClearFilters = document.getElementById('btn-clear-filters');
const toastContainer  = document.getElementById('toast-container');
const dialogBackdrop  = document.getElementById('dialog-backdrop');
const btnDialogCancel = document.getElementById('dialog-cancel');
const btnDialogDelete = document.getElementById('dialog-delete');

// Stats elements
const statNew      = document.getElementById('stat-new');
const statReview   = document.getElementById('stat-review');
const statResolved = document.getElementById('stat-resolved');
const statRejected = document.getElementById('stat-rejected');

/* ============================================================
   FORM VALIDATION
   ============================================================ */

const validationRules = {
  name:    { required: true, minLength: 2, label: 'Name' },
  email:   { required: true, email: true,  label: 'Email' },
  product: { required: true,               label: 'Product / Company' },
  type:    { required: true,               label: 'Request type' },
  priority:{ required: true,               label: 'Priority' },
  message: { required: true, minLength: 10, label: 'Message' },
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validateField(name, value) {
  const rule = validationRules[name];
  if (!rule) return null;
  if (rule.required && !value.trim()) return `${rule.label} is required.`;
  if (rule.minLength && value.trim().length < rule.minLength) {
    return `${rule.label} must be at least ${rule.minLength} characters.`;
  }
  if (rule.email && !isValidEmail(value)) return 'Please enter a valid email address.';
  return null;
}

function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errEl = document.getElementById(`${fieldId}-error`);
  if (!input || !errEl) return;
  input.classList.add('error');
  errEl.textContent = message;
  errEl.classList.add('visible');
}

function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const errEl = document.getElementById(`${fieldId}-error`);
  if (!input || !errEl) return;
  input.classList.remove('error');
  errEl.classList.remove('visible');
}

function validateForm(data) {
  let valid = true;
  Object.entries(data).forEach(([key, value]) => {
    clearFieldError(key);
    const error = validateField(key, value);
    if (error) {
      showFieldError(key, error);
      valid = false;
    }
  });
  return valid;
}

// Live validation: clear error when user types in a field
['name', 'email', 'product', 'type', 'priority', 'message'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', () => clearFieldError(id));
    el.addEventListener('change', () => clearFieldError(id));
  }
});

/* ============================================================
   FORM SUBMISSION
   ============================================================ */

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    name:     document.getElementById('name').value,
    email:    document.getElementById('email').value,
    product:  document.getElementById('product').value,
    type:     document.getElementById('type').value,
    priority: document.getElementById('priority').value,
    message:  document.getElementById('message').value,
  };

  if (!validateForm(formData)) return;

  // Simulate a tiny async "submit" for better UX
  submitBtn.classList.add('loading');
  submitBtn.innerHTML = '<span class="spinner"></span> Submitting…';

  await delay(600);

  const newRequest = {
    id:        generateId(),
    ...formData,
    name:     formData.name.trim(),
    email:    formData.email.trim(),
    message:  formData.message.trim(),
    status:   'New',
    createdAt: new Date().toISOString(),
  };

  requests.unshift(newRequest);
  saveRequests(requests);
  renderAll();

  form.reset();
  submitBtn.classList.remove('loading');
  submitBtn.innerHTML = '<span>✦</span> Submit Request';

  showToast('success', '✓', 'Request submitted successfully!');
});

/* ============================================================
   RENDERING
   ============================================================ */

function getFilteredRequests() {
  let list = [...requests];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.message.toLowerCase().includes(q) ||
      r.product.toLowerCase().includes(q)
    );
  }

  if (filters.status)   list = list.filter(r => r.status === filters.status);
  if (filters.type)     list = list.filter(r => r.type === filters.type);
  if (filters.priority) list = list.filter(r => r.priority === filters.priority);

  list.sort((a, b) => {
    const da = new Date(a.createdAt), db = new Date(b.createdAt);
    return filters.sort === 'oldest' ? da - db : db - da;
  });

  return list;
}

function renderAll() {
  renderStats();
  renderRequests();
}

function renderStats() {
  const counts = { New: 0, 'In Review': 0, Resolved: 0, Rejected: 0 };
  requests.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
  statNew.textContent      = counts['New'];
  statReview.textContent   = counts['In Review'];
  statResolved.textContent = counts['Resolved'];
  statRejected.textContent = counts['Rejected'];
}

function renderRequests() {
  const filtered = getFilteredRequests();

  resultCount.innerHTML = `Showing <strong>${filtered.length}</strong> of ${requests.length} request${requests.length !== 1 ? 's' : ''}`;

  requestsList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
    requestsList.style.display = 'none';
    emptyState.querySelector('.empty-title').textContent =
      requests.length === 0 ? 'No requests yet' : 'No results match your filters';
    emptyState.querySelector('.empty-desc').textContent =
      requests.length === 0
        ? 'Fill in the form to submit your first request.'
        : 'Try adjusting or clearing the active filters.';
    return;
  }

  emptyState.style.display = 'none';
  requestsList.style.display = 'flex';

  filtered.forEach(req => {
    requestsList.appendChild(createCard(req));
  });
}

function createCard(req) {
  const card = document.createElement('article');
  card.className = 'request-card';
  card.dataset.id = req.id;

  const priorityClass = req.priority.toLowerCase();
  const hue = req.name.charCodeAt(0) % 5;
  const statusClass   = req.status.toLowerCase().replace(' ', '-');

  card.innerHTML = `
    <div class="card-accent-bar ${priorityClass}"></div>

    <div class="card-header">
      <div class="card-requester">
        <div class="avatar" data-hue="${hue}">${getInitials(req.name)}</div>
        <div class="requester-info">
          <div class="requester-name">${escHtml(req.name)}</div>
          <div class="requester-email">${escHtml(req.email)}</div>
        </div>
      </div>
      <div class="card-badges">
        <span class="badge prio-${priorityClass}" title="Priority: ${req.priority}">
          ${priorityDot(req.priority)} ${req.priority}
        </span>
        <span class="badge status-${statusClass}">${req.status}</span>
      </div>
    </div>

    <div class="card-body">
      <div class="card-meta-row">
        <span class="card-product">◈ ${escHtml(req.product)}</span>
        <span class="meta-sep" aria-hidden="true"></span>
        <span class="badge type-tag">${escHtml(req.type)}</span>
        <span class="card-date">${formatDate(req.createdAt)}</span>
      </div>
      <p class="card-message">${escHtml(req.message)}</p>
    </div>

    <div class="card-footer">
      <div class="status-control">
        <span class="status-label">Status:</span>
        <select class="status-select" data-id="${req.id}" aria-label="Change status">
          ${['New','In Review','Resolved','Rejected'].map(s =>
            `<option value="${s}"${s === req.status ? ' selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>
      <div class="card-actions">
        <button class="btn-icon btn-delete" data-id="${req.id}" title="Delete request" aria-label="Delete this request">
          🗑
        </button>
      </div>
    </div>
  `;

  // Status change
  card.querySelector('.status-select').addEventListener('change', (e) => {
    updateStatus(req.id, e.target.value);
  });

  // Delete
  card.querySelector('.btn-delete').addEventListener('click', () => {
    openConfirmDialog(req.id);
  });

  return card;
}

/* ============================================================
   HELPERS
   ============================================================ */

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function getInitials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function priorityDot(priority) {
  const dots = { Low: '●', Medium: '●', High: '●' };
  return dots[priority] || '●';
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/* ============================================================
   STATUS UPDATE
   ============================================================ */

function updateStatus(id, newStatus) {
  const idx = requests.findIndex(r => r.id === id);
  if (idx === -1) return;
  requests[idx].status = newStatus;
  saveRequests(requests);
  renderAll();
  showToast('info', '↻', `Status updated to "${newStatus}"`);
}

/* ============================================================
   DELETE + CONFIRM DIALOG
   ============================================================ */

let pendingDeleteId = null;

function openConfirmDialog(id) {
  pendingDeleteId = id;
  dialogBackdrop.classList.add('visible');
}

function closeConfirmDialog() {
  pendingDeleteId = null;
  dialogBackdrop.classList.remove('visible');
}

btnDialogCancel.addEventListener('click', closeConfirmDialog);
dialogBackdrop.addEventListener('click', (e) => {
  if (e.target === dialogBackdrop) closeConfirmDialog();
});

// Escape key closes dialog
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && dialogBackdrop.classList.contains('visible')) {
    closeConfirmDialog();
  }
});

btnDialogDelete.addEventListener('click', () => {
  if (!pendingDeleteId) return;
  requests = requests.filter(r => r.id !== pendingDeleteId);
  saveRequests(requests);
  renderAll();
  closeConfirmDialog();
  showToast('error', '🗑', 'Request deleted.');
});

/* ============================================================
   FILTERS & SEARCH
   ============================================================ */

searchInput.addEventListener('input',   () => { filters.search   = searchInput.value;   renderRequests(); });
filterStatus.addEventListener('change', () => { filters.status   = filterStatus.value;   renderRequests(); });
filterType.addEventListener('change',   () => { filters.type     = filterType.value;     renderRequests(); });
filterPriority.addEventListener('change',() =>{ filters.priority = filterPriority.value; renderRequests(); });
sortSelect.addEventListener('change',   () => { filters.sort     = sortSelect.value;     renderRequests(); });

btnClearFilters.addEventListener('click', () => {
  filters = { search: '', status: '', type: '', priority: '', sort: 'newest' };
  searchInput.value      = '';
  filterStatus.value     = '';
  filterType.value       = '';
  filterPriority.value   = '';
  sortSelect.value       = 'newest';
  renderRequests();
  showToast('info', '✕', 'Filters cleared.');
});

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */

function showToast(type, icon, message) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3000);
}

/* ============================================================
   SEED DATA (for initial demo experience)
   ============================================================ */

function seedDemoData() {
  if (requests.length > 0) return; // don't overwrite real data

  const demo = [
    {
      id: generateId(), name: 'Alice Mwangi', email: 'alice@clinic.co.ke',
      product: 'Photomed', type: 'Bug', priority: 'High',
      message: 'The patient appointment booking form crashes when selecting a time slot after 5 PM. This is affecting our evening clinic operations.',
      status: 'In Review', createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: generateId(), name: 'James Otieno', email: 'jotieno@hospital.org',
      product: 'Photomed', type: 'Feature Request', priority: 'Medium',
      message: 'It would be very helpful to have an automated SMS reminder sent to patients 24 hours before their appointment.',
      status: 'New', createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: generateId(), name: 'Priya Nair', email: 'priya@healthtech.io',
      product: 'General', type: 'Partnership', priority: 'Low',
      message: 'We are a health-tech startup in Nairobi. We would love to explore a partnership to integrate our diagnostic tools with your platform.',
      status: 'New', createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: generateId(), name: 'Samuel Korir', email: 'samkorir@gmail.com',
      product: 'Photomed', type: 'General Feedback', priority: 'Low',
      message: 'The new dashboard design is much cleaner and easier to navigate. The loading time has also improved noticeably. Great work!',
      status: 'Resolved', createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ];

  requests = demo;
  saveRequests(requests);
}

/* ============================================================
   INIT
   ============================================================ */

seedDemoData();
renderAll();
