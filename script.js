// --- 1. DOM ELEMENT SELECTION ---
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const deadlineInput = document.getElementById('deadlineInput');
const taskList = document.getElementById('taskList');
const progressBarFill = document.getElementById('progressBarFill');
const progressText = document.getElementById('progressText');

// --- 2. APPLICATION STATE ---
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// --- 3. CORE FUNCTIONS ---

const saveTasks = () => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
};

const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time part for accurate date comparison
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
        return `Today - ${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    }
    if (date.getTime() === yesterday.getTime()) {
        return `Yesterday - ${yesterday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    }
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const renderTasks = () => {
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<p style="text-align:center; color:#888;">No tasks yet. Add one above!</p>';
        updateProgress();
        return;
    }

    // Group tasks by creation date
    const groupedTasks = tasks.reduce((acc, task) => {
        const date = task.createdAt;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(task);
        return acc;
    }, {});

    // Sort dates from newest to oldest
    const sortedDates = Object.keys(groupedTasks).sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(date => {
        const header = document.createElement('h3');
        header.className = 'task-date-header';
        header.textContent = formatDateHeader(date);
        taskList.appendChild(header);

        // Sort tasks within each date group, incomplete first
        const sortedTasks = groupedTasks[date].sort((a, b) => a.completed - b.completed);

        sortedTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            if (task.completed) li.classList.add('completed');
            
            const taskDetails = document.createElement('div');
            taskDetails.className = 'task-details';
            taskDetails.addEventListener('click', () => toggleTask(task.id));

            const taskText = document.createElement('span');
            taskText.className = 'task-text';
            taskText.textContent = task.text;
            
            const taskDeadline = document.createElement('span');
            taskDeadline.className = 'task-deadline';
            
            const today = new Date();
            today.setHours(0,0,0,0);
            if (task.deadline) {
                const deadlineDate = new Date(task.deadline);
                taskDeadline.textContent = `Deadline: ${deadlineDate.toLocaleDateString('en-US')}`;
                if (deadlineDate < today && !task.completed) {
                    taskDeadline.classList.add('overdue');
                }
            } else {
                taskDeadline.textContent = 'No deadline';
            }
            
            taskDetails.appendChild(taskText);
            taskDetails.appendChild(taskDeadline);
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'actions';

            const completeBtn = document.createElement('button');
            completeBtn.className = 'complete-btn';
            completeBtn.textContent = task.completed ? 'Undo' : 'Complete';
            completeBtn.addEventListener('click', () => toggleTask(task.id));

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => enterEditMode(task, li));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            
            actionsDiv.appendChild(completeBtn);
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            
            li.appendChild(taskDetails);
            li.appendChild(actionsDiv);
            taskList.appendChild(li);
        });
    });
    updateProgress();
};

const enterEditMode = (task, li) => {
    const { id, text, deadline } = task;

    li.innerHTML = ''; // Clear the list item content

    const editGroup = document.createElement('div');
    editGroup.className = 'edit-input-group';

    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.value = text;
    
    const editDeadlineInput = document.createElement('input');
    editDeadlineInput.type = 'date';
    editDeadlineInput.value = deadline || '';

    editGroup.appendChild(editInput);
    editGroup.appendChild(editDeadlineInput);

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'save-btn';
    saveBtn.addEventListener('click', () => {
        updateTask(id, editInput.value, editDeadlineInput.value);
    });

    li.appendChild(editGroup);
    li.appendChild(saveBtn);
    editInput.focus();
};

// --- 4. CRUD OPERATIONS ---

const addTask = (text, deadline) => {
    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        deadline: deadline || null,
    };
    tasks.push(newTask);
    saveTasks();
    renderTasks();
};

const updateTask = (id, newText, newDeadline) => {
    tasks = tasks.map(task => 
        task.id === id ? { ...task, text: newText, deadline: newDeadline || null } : task
    );
    saveTasks();
    renderTasks();
};

const toggleTask = (id) => {
    tasks = tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks();
    renderTasks();
};

const deleteTask = (id) => {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
};

// --- 5. PROGRESS TRACKER LOGIC ---

const updateProgress = () => {
    const completedTasks = tasks.filter(task => task.completed).length;
    const totalTasks = tasks.length;
    const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    progressBarFill.style.width = `${progressPercent}%`;
    progressText.textContent = `${completedTasks}/${totalTasks}`;
};

// --- 6. EVENT LISTENERS ---

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    const deadline = deadlineInput.value;
    if (text !== '') {
        addTask(text, deadline);
        taskInput.value = '';
        deadlineInput.value = '';
        taskInput.focus();
    }
});

// --- 7. INITIAL RENDER ---
document.addEventListener('DOMContentLoaded', renderTasks);