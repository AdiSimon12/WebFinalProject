// *****************************
// 1. DOM ELEMENTS
// *****************************
const taskListEl = document.getElementById('task-list');
const noTasksMsgEl = document.getElementById('no-tasks-message');

const formTitleEl = document.getElementById('form-title');
const taskForm = document.getElementById('task-form');
const taskIdInput = document.getElementById('task-id');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const statusSelect = document.getElementById('status');
const submitButton = document.getElementById('submit-button');
const cancelEditBtn = document.getElementById('cancel-edit');

// Assuming server serves at same origin under /tasks
const API_BASE = 'http://localhost:3000/tasks';

// *****************************
// 2. INITIALIZATIONS
// *****************************
document.addEventListener('DOMContentLoaded', () => {
  fetchAndRenderTasks();
});

// *****************************
// 3. FETCH & RENDER
// *****************************
async function fetchAndRenderTasks() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch tasks.');
    const tasks = await res.json();
    renderTaskList(tasks);
  } catch (err) {
    console.error(err);
    taskListEl.innerHTML = '';
    noTasksMsgEl.textContent = 'Error loading tasks.';
    noTasksMsgEl.classList.remove('hidden');
  }
}

function renderTaskList(tasks) {
  taskListEl.innerHTML = '';

  if (!tasks || tasks.length === 0) {
    noTasksMsgEl.textContent = 'No tasks found.';
    noTasksMsgEl.classList.remove('hidden');
    return;
  }
  noTasksMsgEl.classList.add('hidden');

  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task-item';

    // DETAILS DIV
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'task-details';

    const h3 = document.createElement('h3');
    h3.textContent = task.title;

    const pDesc = document.createElement('p');
    pDesc.textContent = task.description || '(no description)';

    const pStatus = document.createElement('p');
    pStatus.innerHTML = `<span class="status">${task.status}</span> | Created: ${new Date(task.createdAt).toLocaleString()}`;

    detailsDiv.appendChild(h3);
    detailsDiv.appendChild(pDesc);
    detailsDiv.appendChild(pStatus);

    // ACTIONS DIV
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEditTask(task));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    li.appendChild(detailsDiv);
    li.appendChild(actionsDiv);
    taskListEl.appendChild(li);
  });
}

// *****************************
// 4. CREATE / UPDATE FORM HANDLER
// *****************************
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = taskIdInput.value.trim();
  const payload = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    status: statusSelect.value,
  };

  try {
    if (id) {
      // Update
      await updateTask(id, payload);
    } else {
      // Create
      await createTask(payload);
    }
    resetForm();
    await fetchAndRenderTasks();
  } catch (err) {
    console.error(err);
    alert(err.message || 'Something went wrong.');
  }
});

cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

function resetForm() {
  taskIdInput.value = '';
  titleInput.value = '';
  descriptionInput.value = '';
  statusSelect.value = 'pending';

  formTitleEl.textContent = 'Create New Task';
  submitButton.textContent = 'Add Task';
  cancelEditBtn.classList.add('hidden');
}

function startEditTask(task) {
  taskIdInput.value = task.id;
  titleInput.value = task.title;
  descriptionInput.value = task.description;
  statusSelect.value = task.status;

  formTitleEl.textContent = 'Edit Task';
  submitButton.textContent = 'Update Task';
  cancelEditBtn.classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// *****************************
// 5. CRUD FUNCTIONS (API CALLS)
// *****************************
async function createTask(data) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create task.');
  }
  return await res.json();
}

async function updateTask(id, data) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update task.');
  }
  return await res.json();
}

async function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    alert(err.error || 'Failed to delete.');
    return;
  }
  await fetchAndRenderTasks();
}
