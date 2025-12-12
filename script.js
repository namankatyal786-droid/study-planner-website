// Study Planner Pro - Main Application Script

// Storage key and initial data
const STORAGE_KEY = "study_planner_pro";
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// DOM Elements
const addTaskBtn = document.getElementById('addTaskBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const exportBtn = document.getElementById('exportBtn');
const taskModal = document.getElementById('taskModal');
const closeModal = document.getElementById('closeModal');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const taskForm = {
    title: document.getElementById('taskTitle'),
    subject: document.getElementById('taskSubject'),
    priority: document.getElementById('taskPriority'),
    dueDate: document.getElementById('taskDueDate'),
    description: document.getElementById('taskDescription')
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Set minimum date for due date to today
    const today = new Date().toISOString().split('T')[0];
    taskForm.dueDate.min = today;
    
    // Load tasks from storage
    renderTasks();
    updateStats();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for overdue tasks
    checkOverdueTasks();
});

// Set up event listeners
function setupEventListeners() {
    // Modal controls
    addTaskBtn.addEventListener('click', openModal);
    closeModal.addEventListener('click', closeModalFunc);
    cancelTaskBtn.addEventListener('click', closeModalFunc);
    
    // Save task
    saveTaskBtn.addEventListener('click', saveTask);
    
    // Clear all tasks
    clearAllBtn.addEventListener('click', clearAllTasks);
    
    // Export tasks
    exportBtn.addEventListener('click', exportTasks);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeModalFunc();
        }
    });
    
    // Drag and drop functionality
    setupDragAndDrop();
}

// Open modal for adding/editing task
function openModal() {
    // Reset form
    taskForm.title.value = '';
    taskForm.subject.value = '';
    taskForm.priority.value = 'Medium';
    taskForm.dueDate.value = '';
    taskForm.description.value = '';
    
    // Show modal
    taskModal.style.display = 'flex';
    taskForm.title.focus();
}

// Close modal
function closeModalFunc() {
    taskModal.style.display = 'none';
}

// Save task to storage
function saveTask() {
    // Validate form
    if (!taskForm.title.value.trim() || !taskForm.subject.value.trim()) {
        alert('Please fill in all required fields (Title and Subject)');
        return;
    }
    
    // Create task object
    const task = {
        id: 'task_' + Date.now(),
        title: taskForm.title.value.trim(),
        subject: taskForm.subject.value.trim(),
        priority: taskForm.priority.value,
        dueDate: taskForm.dueDate.value,
        description: taskForm.description.value.trim(),
        column: 'backlog',
        createdAt: new Date().toISOString()
    };
    
    // Add to tasks array
    tasks.push(task);
    
    // Save to localStorage
    saveToStorage();
    
    // Update UI
    renderTasks();
    updateStats();
    
    // Close modal
    closeModalFunc();
    
    // Show confirmation
    showNotification('Task added successfully!', 'success');
}

// Save tasks to localStorage
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Render all tasks to the UI
function renderTasks() {
    // Clear all columns
    const columns = ['backlog', 'todo', 'inprogress', 'done'];
    columns.forEach(column => {
        const columnElement = document.getElementById(`${column}-column`);
        columnElement.innerHTML = '';
        
        // Add empty state if no tasks
        const columnTasks = tasks.filter(task => task.column === column);
        if (columnTasks.length === 0) {
            columnElement.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <p>No tasks yet</p>
                </div>
            `;
        }
    });
    
    // Render each task
    tasks.forEach(task => {
        createTaskCard(task);
    });
    
    // Update task counts
    updateTaskCounts();
}

// Create a task card element
function createTaskCard(task) {
    // Get the column element
    const columnElement = document.getElementById(`${task.column}-column`);
    
    // Remove empty state if present
    if (columnElement.querySelector('.empty-state')) {
        columnElement.innerHTML = '';
    }
    
    // Format date if exists
    let dueDateDisplay = 'No due date';
    let dueClass = '';
    
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        // Set time to 00:00:00 for accurate comparison
        today.setHours(0, 0, 0, 0);
        
        // Format the date for display
        const formattedDate = dueDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        dueDateDisplay = formattedDate;
        
        // Check if overdue (only for tasks not in "done" column)
        if (task.column !== 'done' && dueDate < today) {
            dueClass = 'overdue';
            dueDateDisplay += ' (Overdue)';
        }
        
        // Check if due today
        if (dueDate.toDateString() === today.toDateString()) {
            dueClass = 'due-today';
            dueDateDisplay += ' (Today)';
        }
    }
    
    // Create task card HTML
    const taskCard = document.createElement('div');
    taskCard.className = `task-card priority-${task.priority.toLowerCase()}`;
    taskCard.setAttribute('data-id', task.id);
    taskCard.setAttribute('draggable', 'true');
    
    taskCard.innerHTML = `
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-subject">${escapeHtml(task.subject)}</div>
        <div class="task-description">${escapeHtml(task.description) || 'No description'}</div>
        <div class="task-meta">
            <span class="task-priority task-priority-${task.priority.toLowerCase()}">
                ${task.priority}
            </span>
            <span class="task-due ${dueClass}">
                <i class="far fa-calendar-alt"></i> ${dueDateDisplay}
            </span>
        </div>
        <div class="task-actions">
            <button class="task-btn task-move-btn" onclick="moveTask('${task.id}', 'backlog')">
                <i class="fas fa-inbox"></i>
            </button>
            <button class="task-btn task-move-btn" onclick="moveTask('${task.id}', 'todo')">
                <i class="fas fa-clipboard-list"></i>
            </button>
            <button class="task-btn task-move-btn" onclick="moveTask('${task.id}', 'inprogress')">
                <i class="fas fa-spinner"></i>
            </button>
            <button class="task-btn task-move-btn" onclick="moveTask('${task.id}', 'done')">
                <i class="fas fa-check-circle"></i>
            </button>
            <button class="task-btn task-delete-btn" onclick="deleteTask('${task.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add drag event listeners
    taskCard.addEventListener('dragstart', handleDragStart);
    taskCard.addEventListener('dragend', handleDragEnd);
    
    // Append to column
    columnElement.appendChild(taskCard);
}

// Move task to different column
function moveTask(taskId, targetColumn) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].column = targetColumn;
        saveToStorage();
        renderTasks();
        updateStats();
        showNotification(`Task moved to ${targetColumn.replace('inprogress', 'In Progress')}`, 'info');
    }
}

// Delete a task
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveToStorage();
        renderTasks();
        updateStats();
        showNotification('Task deleted successfully', 'danger');
    }
}

// Clear all tasks
function clearAllTasks() {
    if (tasks.length === 0) {
        showNotification('No tasks to clear', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to delete ALL tasks? This action cannot be undone.')) {
        tasks = [];
        saveToStorage();
        renderTasks();
        updateStats();
        showNotification('All tasks cleared', 'danger');
    }
}

// Export tasks
function exportTasks() {
    if (tasks.length === 0) {
        showNotification('No tasks to export', 'info');
        return;
    }
    
    // Create export data
    const exportData = {
        exportedAt: new Date().toISOString(),
        totalTasks: tasks.length,
        tasks: tasks
    };
    
    // Convert to JSON string
    const dataStr = JSON.stringify(exportData, null, 2);
    
    // Create download link
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `study_planner_export_${new Date().toISOString().split('T')[0]}.json`;
    
    // Trigger download
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Tasks exported successfully', 'success');
}

// Update task counts in headers
function updateTaskCounts() {
    const columns = ['backlog', 'todo', 'inprogress', 'done'];
    
    columns.forEach(column => {
        const count = tasks.filter(task => task.column === column).length;
        const countElement = document.getElementById(`${column}-count`);
        if (countElement) {
            countElement.textContent = count;
        }
    });
}

// Update statistics
function updateStats() {
    // Total tasks
    document.getElementById('total-tasks').textContent = tasks.length;
    
    // Completed tasks
    const completedTasks = tasks.filter(task => task.column === 'done').length;
    document.getElementById('completed-tasks').textContent = completedTasks;
    
    // High priority tasks
    const highPriorityTasks = tasks.filter(task => task.priority === 'High').length;
    document.getElementById('high-priority-tasks').textContent = highPriorityTasks;
    
    // Due soon tasks (due within 3 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    
    const dueSoonTasks = tasks.filter(task => {
        if (!task.dueDate || task.column === 'done') return false;
        
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate <= threeDaysLater;
    }).length;
    
    document.getElementById('due-soon-tasks').textContent = dueSoonTasks;
}

// Check for overdue tasks
function checkOverdueTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueTasks = tasks.filter(task => {
        if (!task.dueDate || task.column === 'done') return false;
        
        const dueDate = new Date(task.dueDate);
        return dueDate < today;
    });
    
    if (overdueTasks.length > 0) {
        showNotification(`You have ${overdueTasks.length} overdue task(s)`, 'warning');
    }
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const columns = document.querySelectorAll('.board-content');
    
    columns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('dragenter', handleDragEnter);
        column.addEventListener('dragleave', handleDragLeave);
        column.addEventListener('drop', handleDrop);
    });
}

// Drag and drop handlers
let draggedTask = null;

function handleDragStart(e) {
    draggedTask = this;
    this.classList.add('dragging');
    
    // Set drag data
    e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedTask = null;
    
    // Remove drop zone styling from all columns
    document.querySelectorAll('.board-content').forEach(col => {
        col.classList.remove('drop-zone');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('drop-zone');
}

function handleDragLeave() {
    this.classList.remove('drop-zone');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drop-zone');
    
    // Get task ID from drag data
    const taskId = e.dataTransfer.getData('text/plain');
    
    // Find the target column
    const columnElement = this.closest('.board');
    const targetColumn = columnElement.getAttribute('data-column');
    
    // Move the task
    if (taskId && targetColumn) {
        moveTask(taskId, targetColumn);
    }
}

// Show notification
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add styles for notification
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 400px;
                z-index: 10000;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                animation: slideIn 0.3s ease;
            }
            
            .notification-success { background-color: #28a745; }
            .notification-danger { background-color: #dc3545; }
            .notification-warning { background-color: #ffc107; color: #333; }
            .notification-info { background-color: #17a2b8; }
            
            .notification button {
                background: none;
                border: none;
                color: inherit;
                font-size: 1.5rem;
                cursor: pointer;
                margin-left: 15px;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    

    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}