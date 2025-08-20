// 公告系统功能
class AnnouncementSystem {
  constructor() {
    this.currentPage = 1;
    this.totalPages = 1;
    this.announcements = [];
    this.pinnedAnnouncements = [];
  }

  // 初始化公告系统
  init() {
    this.loadAnnouncements();
    this.setupEventListeners();
  }

  // 设置事件监听器
setupEventListeners() {
  document.addEventListener('click', (e) => {
    const announcementItem = e.target.closest('.announcement-item, .announcement-card, .announcement-simple-item');
    if (announcementItem) {
      const id = announcementItem.dataset.id;
      if (id) {
        e.preventDefault();
        this.showAnnouncementDetail(id);
      }
    }

      // 关闭公告弹窗
      if (e.target.classList.contains('announcement-modal-close') || 
          e.target.classList.contains('announcement-modal-ok')) {
        this.hideAnnouncementModal();
      }

      // 点击弹窗外部关闭
      if (e.target.classList.contains('announcement-modal')) {
        this.hideAnnouncementModal();
      }

      // 分页点击事件
      if (e.target.classList.contains('page-link')) {
        e.preventDefault();
        const page = parseInt(e.target.dataset.page);
        if (page && page !== this.currentPage) {
          this.currentPage = page;
          this.loadAnnouncements();
        }
      }
    });
  }

  // 加载公告列表
	async loadAnnouncements() {
	  try {
		const container = document.getElementById('announcements-container');
		if (!container) {
		  console.error('公告容器不存在');
		  return;
		}
		
		// 显示加载状态
		container.innerHTML = '<div class="loading-announcements">加载公告中...</div>';
		
		const response = await fetch(`https://api.am-all.com.cn/api/announcements?page=${this.currentPage}&limit=10`);
		
		if (!response.ok) {
		  throw new Error(`HTTP错误: ${response.status}`);
		}
		
		const data = await response.json();
		
		if (data.error) {
		  console.error('加载公告失败:', data.error);
		  container.innerHTML = '<div class="no-announcements">加载公告失败</div>';
		  return;
		}
		
		this.pinnedAnnouncements = data.pinned || [];
		this.announcements = data.announcements || [];
		this.totalPages = data.pagination?.totalPages || 1;
		
		this.renderAnnouncements();
	  } catch (error) {
		console.error('加载公告失败:', error);
		const container = document.getElementById('announcements-container');
		if (container) {
		  container.innerHTML = '<div class="no-announcements">加载公告失败，请刷新重试</div>';
		}
	  }
	}

  // 渲染公告列表
  renderAnnouncements() {
    const container = document.getElementById('announcements-container');
    if (!container) return;
    
    let html = '';
    
    // 渲染置顶公告
    if (this.pinnedAnnouncements.length > 0) {
      html += '<div class="announcement-list">';
      this.pinnedAnnouncements.forEach(announcement => {
        html += this.renderAnnouncementItem(announcement);
      });
      html += '</div>';
      
      // 添加分隔线
      if (this.announcements.length > 0) {
        html += '<div class="announcement-divider"><span>最新公告</span></div>';
      }
    }
    
    // 渲染普通公告
    if (this.announcements.length > 0) {
      html += '<div class="announcement-list">';
      this.announcements.forEach(announcement => {
        html += this.renderAnnouncementItem(announcement);
      });
      html += '</div>';
    } else {
      html += '<div class="no-announcements">暂无公告</div>';
    }
    
    // 渲染分页
    if (this.totalPages > 1) {
      html += this.renderPagination();
    }
    
    container.innerHTML = html;
  }

  // 渲染单个公告项
  renderAnnouncementItem(announcement) {
    const date = new Date(announcement.created_at).toLocaleDateString('zh-CN');
    const typeClass = announcement.type || 'notice';
    const typeText = this.getTypeText(announcement.type);
    
    return `
      <div class="announcement-item" data-id="${announcement.id}">
        <div class="announcement-header">
          <span class="announcement-type ${typeClass}">${typeText}</span>
          <h3 class="announcement-title">${announcement.title}</h3>
          <span class="announcement-date">${date}</span>
        </div>
      </div>
    `;
  }

  // 获取类型文本
  getTypeText(type) {
    const typeMap = {
      'top': '置顶',
      'important': '重要',
      'notice': '通知',
      'update': '更新'
    };
    return typeMap[type] || '通知';
  }

  // 渲染分页
  renderPagination() {
    let html = '<div class="announcement-pagination"><ul class="pagination">';
    
    // 上一页
    if (this.currentPage > 1) {
      html += `<li class="page-item"><a class="page-link" href="#" data-page="${this.currentPage - 1}">上一页</a></li>`;
    }
    
    // 页码
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      html += `<li class="page-item ${i === this.currentPage ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>`;
    }
    
    // 下一页
    if (this.currentPage < this.totalPages) {
      html += `<li class="page-item"><a class="page-link" href="#" data-page="${this.currentPage + 1}">下一页</a></li>`;
    }
    
    html += '</ul></div>';
    return html;
  }

  // 显示公告详情
  async showAnnouncementDetail(id) {
    try {
      const response = await fetch(`https://api.am-all.com.cn/api/announcements/${id}`);
      const announcement = await response.json();
      
      if (announcement.error) {
        console.error('加载公告详情失败:', announcement.error);
        return;
      }
      
      this.showAnnouncementModal(announcement);
    } catch (error) {
      console.error('加载公告详情失败:', error);
    }
  }

// 显示公告弹窗
showAnnouncementModal(announcement) {
  // 创建或获取弹窗
  let modal = document.getElementById('announcement-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'announcement-modal';
    modal.className = 'announcement-modal';
    modal.innerHTML = `
      <div class="announcement-modal-content">
        <div class="announcement-modal-header">
          <h3 class="announcement-modal-title"></h3>
          <button class="announcement-modal-close">&times;</button>
        </div>
        <div class="announcement-modal-body">
          <div class="announcement-modal-content html-content"></div>
        </div>
        <div class="announcement-modal-footer">
          <button class="announcement-modal-ok">关闭</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // 添加关闭事件监听
    modal.querySelector('.announcement-modal-close').addEventListener('click', () => {
      this.hideAnnouncementModal();
    });
    
    modal.querySelector('.announcement-modal-ok').addEventListener('click', () => {
      this.hideAnnouncementModal();
    });
    
    // 点击外部关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideAnnouncementModal();
      }
    });
  }
  
  // 填充内容
  const titleElement = modal.querySelector('.announcement-modal-title');
  const contentElement = modal.querySelector('.announcement-modal-content.html-content');
  
  if (titleElement) titleElement.textContent = announcement.title;
  if (contentElement) contentElement.innerHTML = announcement.content;
  
  // 显示弹窗
  modal.classList.add('show');
  document.body.style.overflow = 'hidden'; // 防止背景滚动
}

	// 隐藏公告弹窗
	hideAnnouncementModal() {
	  const modal = document.getElementById('announcement-modal');
	  if (modal) {
		modal.classList.remove('show');
		document.body.style.overflow = ''; // 恢复背景滚动
	  }
	}

// 公告管理系统（管理员功能）
class AnnouncementAdminSystem {
  constructor() {
    this.currentAnnouncement = null;
    this.isEditing = false;
  }

  // 初始化公告管理系统
  init() {
    this.loadAnnouncements();
    this.setupEventListeners();
    this.setupEditor();
  }

  // 设置事件监听器
  setupEventListeners() {
    // 新建公告按钮
    const createBtn = document.getElementById('create-announcement-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        this.showEditor();
      });
    }

    // 保存公告按钮
    const saveBtn = document.getElementById('save-announcement-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveAnnouncement();
      });
    }

    // 取消编辑按钮
    const cancelBtn = document.getElementById('cancel-announcement-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hideEditor();
      });
    }
  }

  // 设置编辑器
  setupEditor() {
    // 这里可以集成一个富文本编辑器，如TinyMCE或Quill
    // 由于时间限制，这里使用简单的内容可编辑div
    const editor = document.getElementById('announcement-editor-content');
    if (editor) {
      // 设置为可编辑
      editor.contentEditable = true;
    }
  }

  // 加载公告列表
  async loadAnnouncements() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://api.am-all.com.cn/api/announcements?page=1&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.error) {
        console.error('加载公告失败:', data.error);
        return;
      }
      
      this.renderAnnouncements(data.pinned.concat(data.announcements));
    } catch (error) {
      console.error('加载公告失败:', error);
    }
  }

  // 渲染公告列表
  renderAnnouncements(announcements) {
    const container = document.getElementById('admin-announcements-list');
    if (!container) return;
    
    let html = '';
    
    announcements.forEach(announcement => {
      const date = new Date(announcement.created_at).toLocaleDateString('zh-CN');
      const typeClass = announcement.type || 'notice';
      const typeText = this.getTypeText(announcement.type);
      const pinnedIcon = announcement.is_pinned ? '<i class="fas fa-thumbtack"></i> ' : '';
      
      html += `
        <div class="admin-announcement-item" data-id="${announcement.id}">
          <div class="admin-announcement-header">
            <span class="announcement-type ${typeClass}">${pinnedIcon}${typeText}</span>
            <h4 class="admin-announcement-title">${announcement.title}</h4>
            <span class="admin-announcement-date">${date}</span>
          </div>
          <div class="admin-announcement-actions">
            <button class="btn-edit" data-id="${announcement.id}">编辑</button>
            <button class="btn-delete" data-id="${announcement.id}">删除</button>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    
    // 添加编辑和删除事件
    container.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.editAnnouncement(id);
      });
    });
    
    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.deleteAnnouncement(id);
      });
    });
  }

  // 获取类型文本
  getTypeText(type) {
    const typeMap = {
      'top': '置顶',
      'important': '重要',
      'notice': '通知',
      'update': '更新'
    };
    return typeMap[type] || '通知';
  }

  // 显示编辑器
  showEditor(announcement = null) {
    const editor = document.getElementById('announcement-editor');
    if (editor) {
      editor.style.display = 'block';
    }
    
    this.isEditing = announcement !== null;
    this.currentAnnouncement = announcement;
    
    // 填充数据
    if (announcement) {
      document.getElementById('announcement-title').value = announcement.title;
      document.getElementById('announcement-type').value = announcement.type;
      document.getElementById('announcement-pinned').checked = announcement.is_pinned;
      document.getElementById('announcement-editor-content').innerHTML = announcement.content;
    } else {
      document.getElementById('announcement-title').value = '';
      document.getElementById('announcement-type').value = 'notice';
      document.getElementById('announcement-pinned').checked = false;
      document.getElementById('announcement-editor-content').innerHTML = '';
    }
  }

  // 隐藏编辑器
  hideEditor() {
    const editor = document.getElementById('announcement-editor');
    if (editor) {
      editor.style.display = 'none';
    }
    this.currentAnnouncement = null;
    this.isEditing = false;
  }

  // 保存公告
  async saveAnnouncement() {
    const title = document.getElementById('announcement-title').value;
    const type = document.getElementById('announcement-type').value;
    const isPinned = document.getElementById('announcement-pinned').checked;
    const content = document.getElementById('announcement-editor-content').innerHTML;
    
    if (!title || !content) {
      alert('标题和内容不能为空');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const url = this.isEditing ? 
        `https://api.am-all.com.cn/api/announcements/${this.currentAnnouncement.id}` : 
        'https://api.am-all.com.cn/api/announcements';
      
      const method = this.isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          type,
          is_pinned: isPinned
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        alert('保存失败: ' + result.error);
        return;
      }
      
      alert('保存成功');
      this.hideEditor();
      this.loadAnnouncements();
    } catch (error) {
      console.error('保存公告失败:', error);
      alert('保存失败');
    }
  }

  // 编辑公告
  async editAnnouncement(id) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://api.am-all.com.cn/api/announcements/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const announcement = await response.json();
      
      if (announcement.error) {
        alert('加载公告失败: ' + announcement.error);
        return;
      }
      
      this.showEditor(announcement);
    } catch (error) {
      console.error('加载公告失败:', error);
      alert('加载公告失败');
    }
  }

  // 删除公告
  async deleteAnnouncement(id) {
    if (!confirm('确定要删除这个公告吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://api.am-all.com.cn/api/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (result.error) {
        alert('删除失败: ' + result.error);
        return;
      }
      
      alert('删除成功');
      this.loadAnnouncements();
    } catch (error) {
      console.error('删除公告失败:', error);
      alert('删除失败');
    }
  }
}

// 初始化公告系统
let announcementSystem = null;
let announcementAdminSystem = null;

window.initAnnouncementSystem = function() {
  announcementSystem = new AnnouncementSystem();
  announcementSystem.init();
}

window.initAnnouncementAdminSystem = function() {
  announcementAdminSystem = new AnnouncementAdminSystem();
  announcementAdminSystem.init();
}