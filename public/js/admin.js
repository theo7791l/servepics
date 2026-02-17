let currentAdmin = null;

// Check admin authentication
async function checkAdminAuth() {
  try {
    const response = await fetch('/api/auth/check');
    const data = await response.json();
    
    if (!data.authenticated || !data.user.isAdmin) {
      window.location.href = '/login';
      return false;
    }
    
    currentAdmin = data.user;
    return true;
  } catch (error) {
    window.location.href = '/login';
    return false;
  }
}

// Load statistics
async function loadStats() {
  try {
    const response = await fetch('/api/admin/stats');
    const data = await response.json();
    
    document.getElementById('totalUsers').textContent = data.totalUsers;
    document.getElementById('proUsers').textContent = data.proUsers;
    document.getElementById('totalFiles').textContent = data.totalFiles;
    document.getElementById('totalStorage').textContent = formatBytes(data.totalStorageUsed);
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Load users
async function loadUsers() {
  try {
    const response = await fetch('/api/admin/users');
    const data = await response.json();
    
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = data.users.map(user => createUserRow(user)).join('');
    
    // Add event listeners
    document.querySelectorAll('.btn-toggle-pro').forEach(btn => {
      btn.addEventListener('click', () => togglePro(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.addEventListener('click', () => confirmDeleteUser(btn.dataset.id, btn.dataset.email));
    });
  } catch (error) {
    console.error('Failed to load users:', error);
  }
}

// Create user row HTML
function createUserRow(user) {
  const date = new Date(user.createdAt).toLocaleDateString('fr-FR');
  const userType = user.isAdmin ? 
    '<span class="badge-admin">⚡ Admin</span>' : 
    '<span class="badge-user">👤 User</span>';
  
  const proStatus = user.isPro ?
    '<span class="badge-pro">🌟 Pro</span>' :
    '<span class="badge-free">Gratuit</span>';
  
  const storageInfo = `${formatBytes(user.storageUsed)} / ${formatBytes(user.storageLimit)}`;
  const storagePercent = ((user.storageUsed / user.storageLimit) * 100).toFixed(1);
  
  return `
    <tr>
      <td>${user.id}</td>
      <td>
        <div>${user.username}</div>
        <div class="user-email">${user.email}</div>
      </td>
      <td>${user.email}</td>
      <td>${userType}</td>
      <td>${proStatus}</td>
      <td>
        <div>${storageInfo}</div>
        <div style="font-size: 0.75rem; color: var(--gray);">${storagePercent}%</div>
      </td>
      <td>${date}</td>
      <td>
        <div class="table-actions">
          ${!user.isAdmin ? `
            <button class="btn-table btn-success btn-toggle-pro" data-id="${user.id}">
              ${user.isPro ? 'Retirer Pro' : 'Activer Pro'}
            </button>
            <button class="btn-table btn-danger btn-delete-user" data-id="${user.id}" data-email="${user.email}">
              Supprimer
            </button>
          ` : '<span style="color: var(--gray);">Admin</span>'}
        </div>
      </td>
    </tr>
  `;
}

// Toggle Pro subscription
async function togglePro(userId) {
  try {
    const response = await fetch(`/api/admin/toggle-pro/${userId}`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showNotification(data.message, 'success');
      await loadUsers();
      await loadStats();
    } else {
      showNotification(data.error || 'Erreur', 'error');
    }
  } catch (error) {
    showNotification('Erreur: ' + error.message, 'error');
  }
}

// Confirm delete user
function confirmDeleteUser(userId, email) {
  const modal = document.getElementById('confirmModal');
  const message = document.getElementById('confirmMessage');
  const confirmBtn = document.getElementById('confirmDelete');
  const cancelBtn = document.getElementById('cancelDelete');
  
  message.textContent = `Êtes-vous sûr de vouloir supprimer l'utilisateur ${email} ? Tous ses fichiers seront supprimés.`;
  modal.style.display = 'flex';
  
  confirmBtn.onclick = async () => {
    modal.style.display = 'none';
    await deleteUser(userId);
  };
  
  cancelBtn.onclick = () => {
    modal.style.display = 'none';
  };
}

// Delete user
async function deleteUser(userId) {
  try {
    const response = await fetch(`/api/admin/delete-user/${userId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showNotification(data.message, 'success');
      await loadUsers();
      await loadStats();
    } else {
      showNotification(data.error || 'Erreur', 'error');
    }
  } catch (error) {
    showNotification('Erreur: ' + error.message, 'error');
  }
}

// Create admin modal
document.getElementById('createAdminBtn').addEventListener('click', () => {
  const modal = document.getElementById('createAdminModal');
  modal.style.display = 'flex';
  document.getElementById('createAdminForm').reset();
  document.getElementById('adminError').style.display = 'none';
});

document.querySelectorAll('.modal-close').forEach(closeBtn => {
  closeBtn.addEventListener('click', (e) => {
    e.target.closest('.modal').style.display = 'none';
  });
});

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});

// Create admin form
document.getElementById('createAdminForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const errorDiv = document.getElementById('adminError');
  errorDiv.style.display = 'none';
  
  const formData = {
    username: document.getElementById('adminUsername').value,
    email: document.getElementById('adminEmail').value,
    password: document.getElementById('adminPassword').value
  };
  
  try {
    const response = await fetch('/api/admin/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      document.getElementById('createAdminModal').style.display = 'none';
      showNotification(data.message, 'success');
      await loadUsers();
      await loadStats();
    } else {
      errorDiv.textContent = data.error || 'Erreur lors de la création';
      errorDiv.style.display = 'block';
    }
  } catch (error) {
    errorDiv.textContent = 'Erreur: ' + error.message;
    errorDiv.style.display = 'block';
  }
});

// Refresh stats
document.getElementById('refreshStatsBtn').addEventListener('click', () => {
  loadStats();
  loadUsers();
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/';
});

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    color: white;
    font-weight: 600;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    box-shadow: var(--shadow-lg);
  `;
  
  if (type === 'success') {
    notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  } else if (type === 'error') {
    notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  } else {
    notification.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
  }
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Add animations to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize
if (checkAdminAuth()) {
  loadStats();
  loadUsers();
}
