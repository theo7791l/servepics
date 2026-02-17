let currentUser = null;

// Check authentication
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/check');
    const data = await response.json();
    
    if (!data.authenticated) {
      window.location.href = '/login';
      return false;
    }
    
    currentUser = data.user;
    displayUserInfo();
    return true;
  } catch (error) {
    window.location.href = '/login';
    return false;
  }
}

// Display user info
function displayUserInfo() {
  document.getElementById('username').textContent = currentUser.username;
  
  const badge = document.getElementById('userBadge');
  if (currentUser.isPro) {
    badge.textContent = '🌟 Pro';
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
  
  // Show admin link if admin
  if (currentUser.isAdmin) {
    document.getElementById('adminLink').style.display = 'block';
  }
  
  loadStorage();
  loadFiles();
}

// Load storage info
async function loadStorage() {
  try {
    const response = await fetch('/api/user/storage');
    const data = await response.json();
    
    const percentage = data.percentage;
    document.getElementById('storageProgress').style.width = percentage + '%';
    document.getElementById('storageUsed').textContent = formatBytes(data.used);
    document.getElementById('storageLimit').textContent = formatBytes(data.limit);
    document.getElementById('storagePercentage').textContent = percentage.toFixed(1) + '%';
    
    // Change color based on usage
    const progressBar = document.getElementById('storageProgress');
    if (percentage > 90) {
      progressBar.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else if (percentage > 70) {
      progressBar.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    }
  } catch (error) {
    console.error('Failed to load storage info:', error);
  }
}

// Load files
async function loadFiles() {
  try {
    const response = await fetch('/api/files/list');
    const data = await response.json();
    
    const filesList = document.getElementById('filesList');
    const emptyState = document.getElementById('emptyState');
    
    if (data.files.length === 0) {
      filesList.innerHTML = '';
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      filesList.innerHTML = data.files.map(file => createFileCard(file)).join('');
      
      // Add event listeners
      document.querySelectorAll('.btn-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          downloadFile(btn.dataset.id);
        });
      });
      
      document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteFile(btn.dataset.id);
        });
      });
    }
  } catch (error) {
    console.error('Failed to load files:', error);
  }
}

// Create file card HTML
function createFileCard(file) {
  const icon = getFileIcon(file.mimetype);
  const date = new Date(file.uploaded_at).toLocaleDateString('fr-FR');
  
  return `
    <div class="file-card">
      <div class="file-icon-large">${icon}</div>
      <div class="file-info">
        <h4 title="${file.original_name}">${truncateText(file.original_name, 20)}</h4>
        <div class="file-size">${formatBytes(file.size)} • ${date}</div>
      </div>
      <div class="file-actions">
        <button class="btn-icon btn-download" data-id="${file.id}" title="Télécharger">⬇️</button>
        <button class="btn-icon btn-delete" data-id="${file.id}" title="Supprimer">🗑️</button>
      </div>
    </div>
  `;
}

// Get file icon based on mimetype
function getFileIcon(mimetype) {
  if (!mimetype) return '📄';
  
  if (mimetype.startsWith('image/')) return '🖼️';
  if (mimetype.startsWith('video/')) return '🎥';
  if (mimetype.startsWith('audio/')) return '🎵';
  if (mimetype.includes('pdf')) return '📄';
  if (mimetype.includes('zip') || mimetype.includes('rar')) return '📦';
  if (mimetype.includes('word')) return '📃';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📈';
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return '📊';
  
  return '📄';
}

// Format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Truncate text
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Upload file
document.getElementById('uploadBtn').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', async (e) => {
  const files = e.target.files;
  if (files.length === 0) return;
  
  const uploadProgress = document.getElementById('uploadProgress');
  uploadProgress.style.display = 'block';
  
  for (let file of files) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        await loadStorage();
        await loadFiles();
      } else {
        const data = await response.json();
        alert('Erreur: ' + (data.error || 'Upload échoué'));
      }
    } catch (error) {
      alert('Erreur lors de l\'upload: ' + error.message);
    }
  }
  
  uploadProgress.style.display = 'none';
  e.target.value = '';
});

// Download file
function downloadFile(fileId) {
  window.location.href = `/api/files/download/${fileId}`;
}

// Delete file
async function deleteFile(fileId) {
  if (!confirm('Voulez-vous vraiment supprimer ce fichier ?')) return;
  
  try {
    const response = await fetch(`/api/files/delete/${fileId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      await loadStorage();
      await loadFiles();
    } else {
      alert('Erreur lors de la suppression');
    }
  } catch (error) {
    alert('Erreur: ' + error.message);
  }
}

// Refresh files
document.getElementById('refreshBtn').addEventListener('click', () => {
  loadFiles();
  loadStorage();
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/';
});

// Initialize
checkAuth();
