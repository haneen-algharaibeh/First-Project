// API and DOM elements
const API_URL = 'http://localhost:3000/api/expenses';

const loadingSpinner = document.getElementById('loadingSpinner');
const alertContainer = document.getElementById('alertContainer');
const expensesTableBody = document.getElementById('expensesTableBody');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const categoryFilter = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');
const monthFilter = document.getElementById('monthFilter');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const saveEditBtn = document.getElementById('saveEditBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');

const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const themeText = document.getElementById('themeText');

const editModalElement = document.getElementById('editExpenseModal');
const editModal = editModalElement ? new bootstrap.Modal(editModalElement) : null;

let alertTimeout = null;
let allExpenses = [];
let currentSortColumn = null;
let currentSortDirection = 'asc';
let categoryChartInstance = null;


// Category styles and chart colors
const CATEGORY_COLORS = {
  'Food': 'bg-success-subtle text-success-emphasis border-success-subtle',
  'Transport': 'bg-primary-subtle text-primary-emphasis border-primary-subtle',
  'Shopping': 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
  'Bills': 'bg-info-subtle text-info-emphasis border-info-subtle',
  'Entertainment': 'bg-danger-subtle text-danger-emphasis border-danger-subtle',
  'Other': 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle'
};

const CHART_COLORS = {
  'Food': '#198754',
  'Transport': '#0d6efd',
  'Shopping': '#ffc107',
  'Bills': '#0dcaf0',
  'Entertainment': '#dc3545',
  'Other': '#6c757d'
};


// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-bs-theme', theme);
  localStorage.setItem('theme', theme);

  if (theme === 'dark') {
    if (themeIcon) themeIcon.className = 'bi bi-sun-fill text-warning';
    if (themeText) themeText.textContent = 'Light';
    if (themeToggleBtn) themeToggleBtn.className = 'btn btn-outline-light btn-sm d-flex align-items-center gap-2';
  } else {
    if (themeIcon) themeIcon.className = 'bi bi-moon-stars-fill text-dark';
    if (themeText) themeText.textContent = 'Dark';
    if (themeToggleBtn) themeToggleBtn.className = 'btn btn-outline-dark btn-sm d-flex align-items-center gap-2';
  }

  if (allExpenses.length > 0) {
    renderChart(allExpenses);
  }
}


// Loading and alert helpers
function showSpinner() {
  if (loadingSpinner) loadingSpinner.classList.remove('d-none');
}

function hideSpinner() {
  if (loadingSpinner) loadingSpinner.classList.add('d-none');
}

function showAlert(message, type = 'danger') {
  if (alertTimeout) clearTimeout(alertTimeout);

  if (alertContainer) {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
  }

  alertTimeout = setTimeout(() => clearAlert(), 3000);
}

function clearAlert() {
  if (alertContainer) alertContainer.innerHTML = '';
}


// API operations: Get, Add, Update, Delete
async function getExpenses() {
  showSpinner();
  clearAlert();

  try {
    const res = await fetch(API_URL);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(
        errData.message || `Failed to fetch expenses: ${res.status}`
      );
    }

    const responseData = await res.json();
    return responseData.data || [];
  } catch (err) {
    const errorMessage =
      err.message === 'Failed to fetch'
        ? 'Cannot connect to backend server. Please make sure the server is running'
        : err.message;

    showAlert(errorMessage, 'danger');
    return [];
  } finally {
    hideSpinner();
  }
}

async function addExpense(expenseData) {
  showSpinner();
  clearAlert();

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(expenseData)
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(
        result.error || result.message || 'Failed to add expense.'
      );
    }

    resetForm();
    await refresh();
    showAlert('Expense added successfully!', 'success');
  } catch (err) {
    showAlert(err.message);
  } finally {
    hideSpinner();
  }
}

async function updateExpense(id, expenseData) {
  showSpinner();
  clearAlert();

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(expenseData)
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(
        result.error || result.message || 'Failed to update expense.'
      );
    }

    if (editModal) editModal.hide();

    await refresh();
    showAlert('Expense updated successfully!', 'success');
  } catch (err) {
    showAlert(err.message);
  } finally {
    hideSpinner();
  }
}

async function deleteExpense(id) {
  if (!confirm('Are you sure you want to delete this expense?')) return;

  showSpinner();
  clearAlert();

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(
        result.error || result.message || 'Failed to delete expense.'
      );
    }

    showAlert('Expense deleted successfully!', 'success');
    await refresh();
  } catch (err) {
    showAlert(err.message);
  } finally {
    hideSpinner();
  }
}


// Refresh data and update the UI
async function refresh() {
  allExpenses = await getExpenses();
  renderChart(allExpenses);
  applyFilterAndRender();
}


// Filtering and sorting
function applyFilter() {
  const selectedCategory = categoryFilter ? categoryFilter.value : 'All';
  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const selectedMonth = monthFilter ? monthFilter.value : '';

  return allExpenses.filter((e) => {
    const matchesCategory =
      selectedCategory === 'All' || e.category === selectedCategory;

    const matchesSearch =
      !searchTerm || (e.title && e.title.toLowerCase().includes(searchTerm));

    const matchesMonth =
      !selectedMonth || (e.date && e.date.startsWith(selectedMonth));

    return matchesCategory && matchesSearch && matchesMonth;
  });
}

function handleSort(column) {
  if (currentSortColumn === column) {
    currentSortDirection =
      currentSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortColumn = column;
    currentSortDirection = 'asc';
  }

  updateSortIcons();
  applyFilterAndRender();
}

function sortExpenses(list) {
  if (!currentSortColumn) return list;

  return [...list].sort((a, b) => {
    let valA = a[currentSortColumn];
    let valB = b[currentSortColumn];

    if (currentSortColumn === 'amount') {
      valA = Number(valA || 0);
      valB = Number(valB || 0);
    } else {
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
    }

    if (valA < valB) {
      return currentSortDirection === 'asc' ? -1 : 1;
    }

    if (valA > valB) {
      return currentSortDirection === 'asc' ? 1 : -1;
    }

    return 0;
  });
}

function updateSortIcons() {
  const columns = ['amount', 'date'];

  columns.forEach((col) => {
    const icon = document.getElementById(`sortIcon-${col}`);

    if (!icon) return;

    if (col === currentSortColumn) {
      icon.className = `bi bi-arrow-${
        currentSortDirection === 'asc' ? 'up' : 'down'
      } text-primary small ms-1`;
    } else {
      icon.className = 'bi bi-arrow-down-up text-muted small ms-1';
    }
  });
}


// Category chart
function renderChart(list) {
  const canvas = document.getElementById('categoryChart');

  if (!canvas) return;

  const categoryTotals = {};

  list.forEach((item) => {
    const cat = item.category || 'Other';
    const amt = Number(item.amount || 0);

    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);
  const backgroundColors = labels.map(
    (cat) => CHART_COLORS[cat] || '#6c757d'
  );

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  const isDark =
    document.documentElement.getAttribute('data-bs-theme') === 'dark';

  const legendTextColor = isDark ? '#f8f9fa' : '#212529';

  categoryChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            color: legendTextColor,
            font: {
              size: 11
            }
          }
        }
      }
    }
  });
}


// Export filtered and sorted expenses to CSV
function exportToCSV() {
  const filteredData = applyFilter();
  const currentData = sortExpenses(filteredData);

  if (!currentData || currentData.length === 0) {
    showAlert('No expenses available to export.', 'warning');
    return;
  }

  const headers = ['ID', 'Title', 'Amount', 'Category', 'Date'];

  const rows = currentData.map((item) => [
    item.id,
    `"${(item.title || '').replace(/"/g, '""')}"`,
    Number(item.amount || 0).toFixed(2),
    `"${(item.category || '').replace(/"/g, '""')}"`,
    item.date || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((e) => e.join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `expenses_${new Date().toISOString().slice(0, 10)}.csv`
  );

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}


// Render table and summary
function applyFilterAndRender() {
  const filteredExpenses = applyFilter();
  const sortedExpenses = sortExpenses(filteredExpenses);

  renderTable(sortedExpenses);
  renderSummary(allExpenses);
}

function renderTable(list) {
  if (!expensesTableBody) return;

  if (!Array.isArray(list) || list.length === 0) {
    expensesTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-4">
          No expenses found.
        </td>
      </tr>
    `;
    return;
  }

  expensesTableBody.innerHTML = list
    .map((item) => {
      const id = item.id;
      const title = item.title || 'Untitled';
      const amount = Number(item.amount || 0).toFixed(2);
      const category = item.category || 'Other';
      const date = item.date || '';

      const badgeClass =
        CATEGORY_COLORS[category] ||
        CATEGORY_COLORS['Other'] ||
        'bg-secondary-subtle text-secondary border-secondary-subtle';

      return `
        <tr>
          <td class="align-middle fw-medium">${title}</td>

          <td class="align-middle">
            $${amount}
          </td>

          <td class="align-middle">
            <span class="badge ${badgeClass} border fs-6">
              ${category}
            </span>
          </td>

          <td class="align-middle text-nowrap">
            ${date}
          </td>

          <td class="align-middle text-end text-nowrap">
            <button
              class="btn btn-sm btn-outline-primary me-1"
              onclick="handleEdit(${id})">
              Edit
            </button>

            <button
              class="btn btn-sm btn-outline-danger"
              onclick="handleDelete(${id})">
              Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderSummary(list) {
  const totalAmountEl = document.getElementById('totalAmount');
  const totalCountEl = document.getElementById('totalCount');
  const highestExpenseEl = document.getElementById('highestExpense');

  if (!Array.isArray(list) || list.length === 0) {
    if (totalAmountEl) totalAmountEl.textContent = '0.00';
    if (totalCountEl) totalCountEl.textContent = '0';
    if (highestExpenseEl) highestExpenseEl.textContent = '0.00';
    return;
  }

  const total = list.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const count = list.length;

  const highest = Math.max(
    ...list.map((item) => Number(item.amount || 0))
  );

  if (totalAmountEl) totalAmountEl.textContent = total.toFixed(2);
  if (totalCountEl) totalCountEl.textContent = count;

  if (highestExpenseEl) {
    highestExpenseEl.textContent = highest.toFixed(2);
  }
}


// Form and edit modal helpers
function resetForm() {
  document.getElementById('title').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('category').selectedIndex = 0;
  document.getElementById('date').value = '';
}

function handleEdit(id) {
  const expense = allExpenses.find((e) => e.id === id);

  if (!expense) return;

  document.getElementById('editId').value = expense.id;
  document.getElementById('editTitle').value = expense.title;
  document.getElementById('editAmount').value = expense.amount;
  document.getElementById('editCategory').value = expense.category;
  document.getElementById('editDate').value = expense.date;

  if (editModal) editModal.show();
}

function handleDelete(id) {
  deleteExpense(id);
}


// Theme button
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme =
      document.documentElement.getAttribute('data-bs-theme');

    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    setTheme(newTheme);
  });
}


// Add expense validation and submission
if (addExpenseBtn) {
  addExpenseBtn.addEventListener('click', () => {
    const title = document.getElementById('title').value.trim();

    const amount = parseFloat(
      document.getElementById('amount').value
    );

    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    if (!title) {
      return showAlert('Please enter a title.');
    }

    if (isNaN(amount) || amount <= 0) {
      return showAlert('Please enter a valid positive amount.');
    }

    if (!category || category === 'Choose...') {
      return showAlert('Please select a category.');
    }

    if (!date) {
      return showAlert('Please select a date.');
    }

    addExpense({
      title,
      amount,
      category,
      date
    });
  });
}


// Edit expense validation and submission
if (saveEditBtn) {
  saveEditBtn.addEventListener('click', () => {
    const id = document.getElementById('editId').value;
    const title = document.getElementById('editTitle').value.trim();

    const amount = parseFloat(
      document.getElementById('editAmount').value
    );

    const category = document.getElementById('editCategory').value;
    const date = document.getElementById('editDate').value;

    if (!title) {
      return showAlert('Please enter a title.');
    }

    if (isNaN(amount) || amount <= 0) {
      return showAlert('Please enter a valid positive amount.');
    }

    if (!category) {
      return showAlert('Please select a category.');
    }

    if (!date) {
      return showAlert('Please select a date.');
    }

    updateExpense(id, {
      title,
      amount,
      category,
      date
    });
  });
}


// Filter, export, and reset events
if (exportCsvBtn) {
  exportCsvBtn.addEventListener('click', exportToCSV);
}

if (categoryFilter) {
  categoryFilter.addEventListener(
    'change',
    applyFilterAndRender
  );
}

if (searchInput) {
  searchInput.addEventListener(
    'input',
    applyFilterAndRender
  );
}

if (monthFilter) {
  monthFilter.addEventListener(
    'change',
    applyFilterAndRender
  );
}

if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (monthFilter) monthFilter.value = '';
    if (categoryFilter) categoryFilter.value = 'All';

    currentSortColumn = null;
    currentSortDirection = 'asc';

    updateSortIcons();
    applyFilterAndRender();
  });
}


// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  refresh();
});