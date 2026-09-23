const STORAGE_KEY = "sadia-expense-tracker";

const form = document.getElementById("expense-form");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const idInput = document.getElementById("expense-id");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit");
const totalAmountEl = document.getElementById("total-amount");
const expenseBody = document.getElementById("expense-body");
const emptyState = document.getElementById("empty-state");
const tableWrap = document.getElementById("table-wrap");
const expenseCount = document.getElementById("expense-count");
const deleteModal = document.getElementById("delete-modal");
const deleteMessage = document.getElementById("delete-message");
const confirmDeleteBtn = document.getElementById("confirm-delete");

const errors = {
  title: document.getElementById("title-error"),
  amount: document.getElementById("amount-error"),
  category: document.getElementById("category-error"),
};

let expenses = loadExpenses();
let pendingDeleteId = null;

function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function formatPKR(value) {
  const amount = new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `PKR ${amount}`;
}

function setError(field, message) {
  const input = { title: titleInput, amount: amountInput, category: categoryInput }[field];
  const errorEl = errors[field];
  if (message) {
    input.classList.add("invalid");
    errorEl.hidden = false;
    errorEl.textContent = message;
  } else {
    input.classList.remove("invalid");
    errorEl.hidden = true;
    errorEl.textContent = "";
  }
}

function clearErrors() {
  setError("title", "");
  setError("amount", "");
  setError("category", "");
}

function validate() {
  clearErrors();
  let valid = true;
  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;

  if (!title) {
    setError("title", "Expense title cannot be empty.");
    valid = false;
  }

  if (!amountInput.value || Number.isNaN(amount) || amount <= 0) {
    setError("amount", "Amount must be greater than 0.");
    valid = false;
  }

  if (!category) {
    setError("category", "Please select a category.");
    valid = false;
  }

  return valid;
}

function setEditing(expense) {
  const heading = document.getElementById("form-heading");
  if (expense) {
    idInput.value = expense.id;
    titleInput.value = expense.title;
    amountInput.value = expense.amount;
    categoryInput.value = expense.category;
    heading.textContent = "Edit expense";
    submitBtn.querySelector("span").textContent = "Save changes";
    cancelEditBtn.hidden = false;
  } else {
    idInput.value = "";
    form.reset();
    heading.textContent = "Add expense";
    submitBtn.querySelector("span").textContent = "Add Expense";
    cancelEditBtn.hidden = true;
    clearErrors();
  }
}

function render() {
  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  totalAmountEl.textContent = formatPKR(total);
  expenseCount.textContent = `${expenses.length} ${expenses.length === 1 ? "item" : "items"}`;

  if (expenses.length === 0) {
    emptyState.hidden = false;
    tableWrap.hidden = true;
    expenseBody.innerHTML = "";
    return;
  }

  emptyState.hidden = true;
  tableWrap.hidden = false;
  expenseBody.innerHTML = expenses
    .map(
      (item) => `
      <tr data-id="${item.id}">
        <td>${escapeHtml(item.title)}</td>
        <td class="amount-cell">${formatPKR(Number(item.amount))}</td>
        <td><span class="badge">${escapeHtml(item.category)}</span></td>
        <td>
          <div class="row-actions">
            <button class="btn icon" type="button" data-edit="${item.id}" aria-label="Edit ${escapeHtml(item.title)}">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 20h4l11.2-11.2a2.1 2.1 0 0 0-3-3L5 17v3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="btn icon danger" type="button" data-delete="${item.id}" aria-label="Delete ${escapeHtml(item.title)}">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 7h14M10 7V5h4v2M8 7l.8 12h6.4L16 7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function openDeleteModal(id) {
  const item = expenses.find((expense) => expense.id === id);
  if (!item) return;
  pendingDeleteId = id;
  deleteMessage.textContent = `“${item.title}” will be removed from your list. This cannot be undone.`;
  deleteModal.hidden = false;
}

function closeDeleteModal() {
  pendingDeleteId = null;
  deleteModal.hidden = true;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validate()) return;

  const payload = {
    id: idInput.value || crypto.randomUUID(),
    title: titleInput.value.trim(),
    amount: Number(amountInput.value),
    category: categoryInput.value,
  };

  if (idInput.value) {
    expenses = expenses.map((item) => (item.id === payload.id ? payload : item));
  } else {
    expenses = [payload, ...expenses];
  }

  saveExpenses();
  setEditing(null);
  render();
});

cancelEditBtn.addEventListener("click", () => setEditing(null));

expenseBody.addEventListener("click", (event) => {
  const editBtn = event.target.closest("[data-edit]");
  const deleteBtn = event.target.closest("[data-delete]");
  if (editBtn) {
    const item = expenses.find((expense) => expense.id === editBtn.dataset.edit);
    if (item) setEditing(item);
  }
  if (deleteBtn) {
    openDeleteModal(deleteBtn.dataset.delete);
  }
});

confirmDeleteBtn.addEventListener("click", () => {
  if (!pendingDeleteId) return;
  expenses = expenses.filter((item) => item.id !== pendingDeleteId);
  if (idInput.value === pendingDeleteId) setEditing(null);
  saveExpenses();
  closeDeleteModal();
  render();
});

deleteModal.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-modal]")) closeDeleteModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !deleteModal.hidden) closeDeleteModal();
});

render();
