let tasks = [];
let editingTaskId = null;

// Load all tasks
async function loadTasks() {
    try {
        const response = await fetch('/tasks');
        tasks = await response.json();
        renderTasks();
        updateStats();
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

// Render tasks to DOM
function renderTasks() {
    const container = document.getElementById('tasks-container');
    container.innerHTML = '';
    
    // Sort: pending first, then completed
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });
    
    sortedTasks.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.className = `task-card ${task.completed ? 'completed' : ''}`;
        
        taskEl.innerHTML = `
            <div class="task-header">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''} 
                    onchange="toggleTask(${task.id}, this.checked)"
                />
                <div class="task-text">${escapeHtml(task.task)}</div>
            </div>
            <div class="task-footer">
                <div class="task-actions">
                    <button class="task-edit" onclick="openEditModal(${task.id}, '${escapeHtml(task.task).replace(/'/g, "\\'")}')">Edit</button>
                    <button class="task-delete" onclick="deleteTask(${task.id})">Delete</button>
                </div>
            </div>
        `;
        container.appendChild(taskEl);
    });
    
    // Show/hide buttons
    const clearBtn = document.getElementById('clear-btn');
    const deleteAllBtn = document.getElementById('delete-all-btn');
    const hasCompleted = tasks.some(t => t.completed);
    const hasTasks = tasks.length > 0;
    
    clearBtn.style.display = hasCompleted ? 'block' : 'none';
    deleteAllBtn.style.display = hasTasks ? 'block' : 'none';
}

// Update statistics
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    
    document.getElementById('total-tasks').textContent = total;
    document.getElementById('completed-tasks').textContent = completed;
    document.getElementById('pending-tasks').textContent = pending;
}

// Add new task
async function addTask() {
    const input = document.getElementById('task-input');
    const task = input.value.trim();
    
    if (!task) {
        input.focus();
        return;
    }
    
    try {
        const response = await fetch('/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task })
        });
        
        if (response.ok) {
            input.value = '';
            input.focus();
            await loadTasks();
        }
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Failed to add task. Please try again.');
    }
}

// Toggle task completion
async function toggleTask(id, completed) {
    try {
        await fetch(`/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed })
        });
        await loadTasks();
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

// Open edit modal
function openEditModal(id, taskText) {
    editingTaskId = id;
    document.getElementById('edit-input').value = taskText;
    document.getElementById('edit-modal').classList.add('active');
    document.getElementById('edit-input').focus();
}

// Close edit modal
function closeEditModal() {
    editingTaskId = null;
    document.getElementById('edit-modal').classList.remove('active');
    document.getElementById('edit-input').value = '';
}

// Save edited task
async function saveEdit() {
    const newTaskText = document.getElementById('edit-input').value.trim();
    
    if (!newTaskText) {
        alert('Task cannot be empty');
        return;
    }
    
    try {
        await fetch(`/tasks/${editingTaskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task: newTaskText })
        });
        closeEditModal();
        await loadTasks();
    } catch (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task. Please try again.');
    }
}

// Delete single task
async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    
    try {
        await fetch(`/tasks/${id}`, { method: 'DELETE' });
        await loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// Clear all completed tasks
async function clearCompleted() {
    const completedTasks = tasks.filter(t => t.completed);
    
    if (completedTasks.length === 0) return;
    
    if (!confirm(`Delete ${completedTasks.length} completed task(s)?`)) return;
    
    try {
        await Promise.all(
            completedTasks.map(task => 
                fetch(`/tasks/${task.id}`, { method: 'DELETE' })
            )
        );
        await loadTasks();
    } catch (error) {
        console.error('Error clearing completed tasks:', error);
    }
}

// Delete all tasks
async function deleteAllTasks() {
    if (!confirm(`Delete all ${tasks.length} task(s)? This cannot be undone!`)) return;
    
    try {
        await fetch('/tasks', { method: 'DELETE' });
        await loadTasks();
    } catch (error) {
        console.error('Error deleting all tasks:', error);
        alert('Failed to delete all tasks. Please try again.');
    }
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Allow Enter key to add task
document.getElementById('task-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

// Allow Enter key in edit modal
document.getElementById('edit-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveEdit();
});

// Close modal when clicking overlay
document.getElementById('edit-modal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeEditModal();
    }
});

// Initialize
loadTasks();