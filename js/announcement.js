// 公告系统功能 - 更新版
class AnnouncementSystem {
  constructor() {
    this._successNotifiedAt = 0;
    this._lastSaveAt = 0;
    this.currentPage = 1;
    this.totalPages = 1;
    this.announcements = [];
    this.pinnedAnnouncements = [];
    this.currentLanguage = 'zh-CN';
    this.originalContent = {};
  }

  init() {
    this.loadAnnouncements();
    this.setupEventListeners();
  }

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

      if (e.target.classList.contains('announcement-modal-close') || 
          e.target.classList.contains('announcement-modal-ok')) {
        this.hideAnnouncementModal();
      }

      if (e.target.classList.contains('announcement-modal')) {
        this.hideAnnouncementModal();
      }

      if (e.target.closest('.announcement-translate-btn')) {
        e.preventDefault();
        e.stopPropagation();
        this.toggleTranslation();
      }

      if (e.target.classList.contains('page-link')) {
        e.preventDefault();
        e.stopPropagation();
        
        const page = parseInt(e.target.dataset.announcementPage);
        if (page && page !== this.currentPage) {
          this.currentPage = page;
          this.loadAnnouncements();
          
          const container = document.getElementById('announcements-container');
          if (container) {
            container.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
  }

  async loadAnnouncements() {
    try {
      const container = document.getElementById('announcements-container');
      if (!container) {
        console.error('公告容器不存在');
        return;
      }
      
      container.innerHTML = '<div class="loading-announcements">加载公告中...</div>';
      
      const response = await fetch(`https://api.am-all.com.cn/api/announcements?page=${this.currentPage}&limit=5`);
      
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
      
      if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages;
        await this.loadAnnouncements();
        return;
      }
      
      this.renderAnnouncements();
    } catch (error) {
      console.error('加载公告失败:', error);
      const container = document.getElementById('announcements-container');
      if (container) {
        container.innerHTML = '<div class="no-announcements">加载公告失败，请刷新重试</div>';
      }
    }
  }

  renderAnnouncements() {
    const container = document.getElementById('announcements-container');
    if (!container) return;
    
    let html = '';
    
    if (this.pinnedAnnouncements.length > 0) {
      html += `
        <div class="pinned-announcements-section">
          <div class="pinned-announcements-header">
            <i class="fas fa-thumbtack"></i>
            <h3>置顶公告</h3>
          </div>
          <div class="announcement-list">
      `;
      
      this.pinnedAnnouncements.forEach(announcement => {
        html += this.renderAnnouncementItem(announcement);
      });
      
      html += `
          </div>
        </div>
      `;
    }
    
    if (this.announcements.length > 0) {
      html += `
        <div class="normal-announcements-section">
          <div class="normal-announcements-header">
            <i class="fas fa-list"></i>
            <h3>最新公告</h3>
          </div>
          <div class="announcement-list">
      `;
      
      this.announcements.forEach(announcement => {
        html += this.renderAnnouncementItem(announcement);
      });
      
      html += `
          </div>
      `;
      
      if (this.totalPages > 1) {
        html += this.renderPagination();
      }
      
      html += `</div>`;
    } else if (this.pinnedAnnouncements.length === 0) {
      html += '<div class="no-announcements">暂无公告</div>';
    }
    
    container.innerHTML = html;
  }

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

  getTypeText(type) {
    const typeMap = {
      'top': '置顶',
      'important': '重要',
      'notice': '通知',
      'update': '更新'
    };
    return typeMap[type] || '通知';
  }

  renderPagination() {
    let html = '<div class="announcement-pagination"><ul class="pagination">';
    
    if (this.currentPage > 1) {
      html += `<li class="page-item"><a class="page-link" href="javascript:void(0);" data-announcement-page="${this.currentPage - 1}">上一页</a></li>`;
    }
    
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      html += `<li class="page-item ${i === this.currentPage ? 'active' : ''}">
        <a class="page-link" href="javascript:void(0);" data-announcement-page="${i}">${i}</a>
      </li>`;
    }
    
    if (this.currentPage < this.totalPages) {
      html += `<li class="page-item"><a class="page-link" href="javascript:void(0);" data-announcement-page="${this.currentPage + 1}">下一页</a></li>`;
    }
    
    html += '</ul></div>';
    return html;
  }

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

  showAnnouncementModal(announcement) {
    this.currentLanguage = 'zh-CN';
    
    // 处理内容中的表情和图片标记
    let processedContent = announcement.content;
    
    // 处理表情标记 [emoji:id:path] 或 [emoji:id:path:audioPath]
    const emojiRegex = /\[emoji:(\d+):((?:https?:)?\/[^\]]+?)(?::([^\]]+?))?\]/g;
    processedContent = processedContent.replace(emojiRegex, (match, id, path, audioPath) => {
      const API_BASE_URL = 'https://api.am-all.com.cn';
      const fullPath = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
      return `<img src="${fullPath}" class="announcement-emoji" style="max-width: 60px; max-height: 60px; vertical-align: middle; margin: 0 4px;" alt="表情">`;
    });
    
    // 处理图片标记 [image:/path/to/image]
    const imageRegex = /\[image:(\/[^\]]+?)\]/g;
    processedContent = processedContent.replace(imageRegex, (match, path) => {
      const API_BASE_URL = 'https://api.am-all.com.cn';
      const fullPath = `${API_BASE_URL}${path}`;
      return `<img src="${fullPath}" class="announcement-image" style="max-width: 100%; height: auto; display: block; margin: 10px 0; border-radius: 8px;" alt="图片">`;
    });
    
    this.originalContent = {
      title: announcement.title,
      content: processedContent
    };
    
    const siteLanguage = typeof languageModule !== 'undefined' ? 
      languageModule.getCurrentLanguage() : 
      (localStorage.getItem('language') || 'zh-cn');
    
    let modal = document.getElementById('announcement-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'announcement-modal';
      modal.className = 'announcement-modal';
      modal.innerHTML = `
        <div class="announcement-modal-content">
          <div class="announcement-modal-header">
            <h3 class="announcement-modal-title"></h3>
            <div class="announcement-modal-actions">
              <button class="announcement-translate-btn" title="翻译" style="display: none;">
                <i class="fas fa-language"></i>
                <span class="translate-text">翻译</span>
              </button>
              <button class="announcement-modal-close">&times;</button>
            </div>
          </div>
          <div class="announcement-modal-body">
            <div class="html-content"></div>
          </div>
          <div class="announcement-modal-footer">
            <button class="announcement-modal-ok">关闭</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    
    const titleElement = modal.querySelector('.announcement-modal-title');
    const contentElement = modal.querySelector('.html-content');
    const translateBtn = modal.querySelector('.announcement-translate-btn');
    const translateText = translateBtn ? translateBtn.querySelector('.translate-text') : null;
    
    if (titleElement) titleElement.textContent = announcement.title;
    if (contentElement) contentElement.innerHTML = processedContent;
    
    if (siteLanguage !== 'zh-cn' && translateBtn) {
      translateBtn.style.display = 'flex';
      
      const buttonTexts = {
        'en-us': { translate: 'Translate', original: 'Original' },
        'ja-jp': { translate: '翻訳', original: '原文' }
      };
      
      if (buttonTexts[siteLanguage] && translateText) {
        translateText.textContent = buttonTexts[siteLanguage].translate;
        translateText.setAttribute('data-translate-text', buttonTexts[siteLanguage].translate);
        translateText.setAttribute('data-original-text', buttonTexts[siteLanguage].original);
      }
    } else if (translateBtn) {
      translateBtn.style.display = 'none';
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  async toggleTranslation() {
    const modal = document.getElementById('announcement-modal');
    if (!modal) return;
    
    const titleElement = modal.querySelector('.announcement-modal-title');
    const contentElement = modal.querySelector('.html-content');
    const translateBtn = modal.querySelector('.announcement-translate-btn');
    const translateText = translateBtn.querySelector('.translate-text');
    
    if (!titleElement || !contentElement) return;
    
    const siteLanguage = typeof languageModule !== 'undefined' ? 
      languageModule.getCurrentLanguage() : 
      (localStorage.getItem('language') || 'zh-cn');
    
    let targetLang = 'en';
    let loadingText = 'Translating...';
    let originalBtnText = translateText.getAttribute('data-original-text') || 'Original';
    let translateBtnText = translateText.getAttribute('data-translate-text') || 'Translate';
    
    if (siteLanguage === 'en-us') {
      targetLang = 'en';
      loadingText = 'Translating...';
    } else if (siteLanguage === 'ja-jp') {
      targetLang = 'ja';
      loadingText = '翻訳中...';
    }
    
    translateBtn.disabled = true;
    translateText.textContent = loadingText;
    
    try {
      if (this.currentLanguage === 'zh-CN') {
        const translatedTitle = await this.translateText(this.originalContent.title, targetLang);
        const translatedContent = await this.translateText(this.stripHtml(this.originalContent.content), targetLang);
        
        titleElement.textContent = translatedTitle;
        contentElement.innerHTML = `<div class="translated-content">${this.formatTranslatedContent(translatedContent)}</div>`;
        
        this.currentLanguage = targetLang;
        translateText.textContent = originalBtnText;
      } else {
        titleElement.textContent = this.originalContent.title;
        contentElement.innerHTML = this.originalContent.content;
        
        this.currentLanguage = 'zh-CN';
        translateText.textContent = translateBtnText;
      }
    } catch (error) {
      console.error('翻译失败:', error);
      alert('翻译失败，请稍后重试');
      translateText.textContent = translateBtnText;
    } finally {
      translateBtn.disabled = false;
    }
  }

  async translateText(text, targetLang) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data[0]) {
        return data[0].map(item => item[0]).join('');
      }
      
      throw new Error('翻译数据格式错误');
    } catch (error) {
      console.warn('API翻译失败，使用备用方案');
      window.open(`https://translate.google.com/?sl=zh-CN&tl=${targetLang}&text=${encodeURIComponent(text)}&op=translate`, '_blank');
      throw error;
    }
  }

  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  formatTranslatedContent(text) {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => `<p>${line}</p>`)
      .join('');
  }

  hideAnnouncementModal() {
    const modal = document.getElementById('announcement-modal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
      
      this.currentLanguage = 'zh-CN';
      const translateBtn = modal.querySelector('.announcement-translate-btn');
      if (translateBtn) {
        const translateText = translateBtn.querySelector('.translate-text');
        if (translateText) {
          translateText.textContent = '翻译';
        }
      }
    }
  }
}

// 公告管理系统（管理员功能）- 使用论坛编辑器 + 列表布局
class AnnouncementAdminSystem {
  constructor() {
    this._successNotifiedAt = 0;
    this._lastSaveAt = 0;
    this.currentAnnouncement = null;
    this.isEditing = false;
    this.editorModal = null;
    this.forumEditor = null;
    this.selectedIds = new Set();
  }

  init() {
    console.log('初始化公告管理系统');
    this.cleanupOldModals();
    this.createEditorModal();
    this.loadAnnouncements();
    setTimeout(() => {
      this.setupEventListeners();
    }, 100);
  }

  cleanupOldModals() {
    const oldModals = document.querySelectorAll('#announcement-editor-modal');
    oldModals.forEach(modal => modal.remove());
  }

  createEditorModal() {
    this.cleanupOldModals();
    
    const modalHtml = `
      <div id="announcement-editor-modal" class="announcement-editor-modal">
        <div class="announcement-editor" id="announcement-editor">
          <div class="announcement-editor-header">
            <h3 id="editor-title">新建公告</h3>
            <button type="button" class="announcement-editor-close" id="editor-close-btn">&times;</button>
          </div>
          <div class="announcement-editor-body">
            <div class="form-group">
              <label for="announcement-title">公告标题</label>
              <input type="text" id="announcement-title" placeholder="请输入公告标题" />
            </div>
            
            <div class="form-group">
              <label for="announcement-type">公告类型</label>
              <select id="announcement-type">
                <option value="notice">通知</option>
                <option value="update">更新</option>
                <option value="important">重要</option>
                <option value="top">置顶</option>
              </select>
            </div>
            
            <div class="form-group form-group-checkbox">
              <input type="checkbox" id="announcement-pinned" />
              <label for="announcement-pinned">置顶公告</label>
            </div>
            
            <div class="form-group">
              <label for="announcement-editor-content">公告内容</label>
              <div class="forum-editor-container">
                <div class="editor-toolbar"></div>
                <div class="editor-content" contenteditable="true"></div>
              </div>
            </div>
          </div>
          <div class="announcement-editor-footer">
            <button type="button" id="save-announcement-btn">保存公告</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.editorModal = document.getElementById('announcement-editor-modal');
  }

setupEventListeners() {
  const self = this;
  
  document.addEventListener('click', function(e) {
    // 新建公告按钮 - 使用closest查找按钮
    const createBtn = e.target.closest('#create-announcement-btn');
    if (createBtn) {
      e.preventDefault();
      console.log('点击新建公告');
      self.showEditor(null);
      return;
    }
    
    // 保存公告按钮
    const saveBtn = e.target.closest('#save-announcement-btn');
    if (saveBtn) {
      e.preventDefault();
      e.stopPropagation();
      console.log('保存按钮被点击');
      self.saveAnnouncement();
      return;
    }
    
    // 关闭编辑器按钮
    const closeBtn = e.target.closest('#editor-close-btn');
    if (closeBtn) {
      e.preventDefault();
      console.log('关闭编辑器');
      self.hideEditor();
      return;
    }
    
    // 点击弹窗外部关闭
    if (e.target && e.target.id === 'announcement-editor-modal') {
      console.log('点击弹窗外部,关闭编辑器');
      self.hideEditor();
      return;
    }
    
    // 编辑按钮
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      e.preventDefault();
      e.stopPropagation();
      const id = editBtn.dataset.id;
      console.log('编辑公告:', id);
      self.editAnnouncement(id);
      return;
    }
    
    // 删除按钮
    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      const id = deleteBtn.dataset.id;
      console.log('删除公告:', id);
      self.deleteAnnouncement(id);
      return;
    }
    
    // 全选按钮 - 使用closest
    const selectAllBtn = e.target.closest('#select-all-btn');
    if (selectAllBtn) {
      e.preventDefault();
      console.log('点击全选');
      self.selectAll();
      return;
    }
    
    // 取消全选按钮 - 使用closest
    const deselectAllBtn = e.target.closest('#deselect-all-btn');
    if (deselectAllBtn) {
      e.preventDefault();
      console.log('点击取消全选');
      self.deselectAll();
      return;
    }
    
    // 批量删除按钮 - 使用closest
    const batchDeleteBtn = e.target.closest('#batch-delete-btn');
    if (batchDeleteBtn) {
      e.preventDefault();
      console.log('点击批量删除');
      self.batchDelete();
      return;
    }
    
    // 复选框
    const checkbox = e.target.closest('.announcement-checkbox');
    if (checkbox) {
      const id = checkbox.dataset.id;
      if (checkbox.checked) {
        self.selectedIds.add(id);
      } else {
        self.selectedIds.delete(id);
      }
      self.updateBatchButtons();
      return;
    }
  });
}

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

renderAnnouncements(announcements) {
  const container = document.getElementById('admin-announcements-list');
  if (!container) return;
  
  this.selectedIds.clear();
  
  let html = `
    <div class="announcement-table-wrapper">
      <div class="announcement-list-header">
        <div class="header-checkbox">
          <input type="checkbox" id="header-select-all" class="announcement-checkbox-header">
        </div>
        <div class="header-type">类型</div>
        <div class="header-title">标题</div>
        <div class="header-date">创建时间</div>
        <div class="header-pinned">置顶</div>
        <div class="header-actions">操作</div>
      </div>
  `;
  
  if (announcements.length === 0) {
    html += '<div class="no-announcements">暂无公告</div>';
  } else {
    announcements.forEach(announcement => {
      const date = new Date(announcement.created_at).toLocaleString('zh-CN');
      const typeClass = announcement.type || 'notice';
      const typeText = this.getTypeText(announcement.type);
      const isPinned = announcement.is_pinned ? '是' : '否';
      
      html += `
        <div class="announcement-list-item">
          <div class="item-checkbox">
            <input type="checkbox" class="announcement-checkbox" data-id="${announcement.id}">
          </div>
          <div class="item-type">
            <span class="announcement-type-badge ${typeClass}">${typeText}</span>
          </div>
          <div class="item-title">${announcement.title}</div>
          <div class="item-date">${date}</div>
          <div class="item-pinned">
            ${announcement.is_pinned ? '<i class="fas fa-thumbtack" style="color: #fbbf24;"></i>' : '-'}
          </div>
          <div class="item-actions">
            <button class="btn-edit btn-sm" data-id="${announcement.id}">
              <i class="fas fa-edit"></i> 编辑
            </button>
            <button class="btn-delete btn-sm" data-id="${announcement.id}">
              <i class="fas fa-trash"></i> 删除
            </button>
          </div>
        </div>
      `;
    });
  }
  
  html += `</div>`; // 关闭 announcement-table-wrapper
  
  container.innerHTML = html;
  
  // 设置表头全选复选框事件
  const headerCheckbox = document.getElementById('header-select-all');
  if (headerCheckbox) {
    headerCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        this.selectAll();
      } else {
        this.deselectAll();
      }
    });
  }
  
  this.updateBatchButtons();
}

  getTypeText(type) {
    const typeMap = {
      'top': '置顶',
      'important': '重要',
      'notice': '通知',
      'update': '更新'
    };
    return typeMap[type] || '通知';
  }

  selectAll() {
    const checkboxes = document.querySelectorAll('.announcement-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = true;
      this.selectedIds.add(cb.dataset.id);
    });
    const headerCheckbox = document.getElementById('header-select-all');
    if (headerCheckbox) headerCheckbox.checked = true;
    this.updateBatchButtons();
  }

  deselectAll() {
    const checkboxes = document.querySelectorAll('.announcement-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = false;
    });
    const headerCheckbox = document.getElementById('header-select-all');
    if (headerCheckbox) headerCheckbox.checked = false;
    this.selectedIds.clear();
    this.updateBatchButtons();
  }

	updateBatchButtons() {
	  const batchDeleteBtn = document.getElementById('batch-delete-btn');
	  if (batchDeleteBtn) {
		if (this.selectedIds.size > 0) {
		  batchDeleteBtn.disabled = false;
		  // 获取翻译文本
		  const deleteText = typeof languageModule !== 'undefined' ? 
			languageModule.t('announcementAdmin.batchDelete') : '删除选中';
		  batchDeleteBtn.innerHTML = `<i class="fas fa-trash me-2"></i><span>${deleteText} (${this.selectedIds.size})</span>`;
		} else {
		  batchDeleteBtn.disabled = true;
		  const deleteText = typeof languageModule !== 'undefined' ? 
			languageModule.t('announcementAdmin.batchDelete') : '删除选中';
		  batchDeleteBtn.innerHTML = `<i class="fas fa-trash me-2"></i><span>${deleteText}</span>`;
		}
	  }
	}

  async batchDelete() {
    if (this.selectedIds.size === 0) {
      alert('请先选择要删除的公告');
      return;
    }
    
    if (!confirm(`确定要删除选中的 ${this.selectedIds.size} 条公告吗？此操作不可撤销。`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://api.am-all.com.cn/api/announcements/batch-delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: Array.from(this.selectedIds) })
      });
      
      const result = await response.json();
      
      if (result.error) {
        alert('批量删除失败: ' + result.error);
        return;
      }
      
      alert(result.message || '批量删除成功');
      this.selectedIds.clear();
      this.loadAnnouncements();
    } catch (error) {
      console.error('批量删除公告失败:', error);
      alert('批量删除失败');
    }
  }

  showEditor(announcement) {
    console.log('显示编辑器，公告数据:', announcement);
    
    const titleInput = document.querySelector('#announcement-editor-modal #announcement-title');
    const typeSelect = document.querySelector('#announcement-editor-modal #announcement-type');
    const pinnedCheckbox = document.querySelector('#announcement-editor-modal #announcement-pinned');
    const editorContainer = document.querySelector('#announcement-editor-modal .forum-editor-container');
    const editorTitle = document.querySelector('#announcement-editor-modal #editor-title');
    
    this.isEditing = announcement !== null;
    this.currentAnnouncement = announcement;
    
    if (titleInput) titleInput.value = '';
    if (typeSelect) typeSelect.value = 'notice';
    if (pinnedCheckbox) pinnedCheckbox.checked = false;
    
    if (editorTitle) {
      editorTitle.textContent = this.isEditing ? '编辑公告' : '新建公告';
    }
    
    // 初始化论坛编辑器
    if (!this.forumEditor && editorContainer) {
      this.forumEditor = new ForumEditor(editorContainer);
    }
    
    // 清空编辑器内容
    if (this.forumEditor) {
      this.forumEditor.clear();
    }
    
    if (announcement) {
      if (titleInput) titleInput.value = announcement.title || '';
      if (typeSelect) typeSelect.value = announcement.type || 'notice';
      if (pinnedCheckbox) pinnedCheckbox.checked = announcement.is_pinned === true || announcement.is_pinned === 1;
      
      // 设置编辑器内容
      if (this.forumEditor && announcement.content) {
        this.forumEditor.setContent(announcement.content);
      }
    }
    
    if (this.editorModal) {
      this.editorModal.classList.add('show');
      document.body.style.overflow = 'hidden';
      this.editorModal.offsetHeight;
    }
    
    console.log('编辑器状态:', {
      isEditing: this.isEditing,
      title: titleInput?.value
    });
  }

  hideEditor() {
    console.log('隐藏编辑器');
    
    if (this.editorModal) {
      this.editorModal.classList.remove('show');
      document.body.style.overflow = '';
    }
    
    const titleInput = document.querySelector('#announcement-editor-modal #announcement-title');
    const typeSelect = document.querySelector('#announcement-editor-modal #announcement-type');
    const pinnedCheckbox = document.querySelector('#announcement-editor-modal #announcement-pinned');
    
    if (titleInput) titleInput.value = '';
    if (typeSelect) typeSelect.value = 'notice';
    if (pinnedCheckbox) pinnedCheckbox.checked = false;
    
    if (this.forumEditor) {
      this.forumEditor.clear();
    }
    
    this.currentAnnouncement = null;
    this.isEditing = false;
  }

  async saveAnnouncement() {
    console.log('执行保存...');
    
    try {
      const titleInput = document.querySelector('#announcement-editor-modal #announcement-title');
      const typeSelect = document.querySelector('#announcement-editor-modal #announcement-type');
      const pinnedCheckbox = document.querySelector('#announcement-editor-modal #announcement-pinned');
      
      if (!titleInput || !typeSelect || !pinnedCheckbox || !this.forumEditor) {
        console.error('无法找到表单元素');
        alert('表单元素未找到，请刷新页面重试');
        return;
      }
      
      const title = titleInput.value.trim();
      const type = typeSelect.value;
      const isPinned = pinnedCheckbox.checked;
      const content = this.forumEditor.getContent();
      
      console.log('保存数据:', {
        title: title,
        type: type,
        isPinned: isPinned,
        contentLength: content.length
      });
      
      if (!title) {
        alert('请输入公告标题');
        titleInput.focus();
        return;
      }
      
      if (this.forumEditor.isEmpty()) {
        alert('请输入公告内容');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        return;
      }
      
      const url = this.isEditing ? 
        `https://api.am-all.com.cn/api/announcements/${this.currentAnnouncement.id}` : 
        'https://api.am-all.com.cn/api/announcements';
      
      const method = this.isEditing ? 'PUT' : 'POST';
      
      console.log('发送请求:', { url, method, title, type, isPinned });
      
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
      
      console.log('保存响应:', result);
      
      if (!response.ok || result.error) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      alert(this.isEditing ? '更新成功' : '创建成功');
      this.hideEditor();
      this.loadAnnouncements();
      
    } catch (error) {
      console.error('保存公告失败:', error);
      alert('保存失败: ' + error.message);
    }
  }

  async editAnnouncement(id) {
    console.log('开始编辑公告:', id);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://api.am-all.com.cn/api/announcements/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const announcement = await response.json();
      console.log('获取到的公告数据:', announcement);
      
      if (announcement.error) {
        alert('加载公告失败: ' + announcement.error);
        return;
      }
      
      setTimeout(() => {
        this.showEditor(announcement);
      }, 50);
      
    } catch (error) {
      console.error('加载公告失败:', error);
      alert('加载公告失败');
    }
  }

  async deleteAnnouncement(id) {
    if (!confirm('确定要删除这个公告吗?此操作不可撤销。')) {
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
window.initAnnouncementSystem = function(){
  try{
    if (!window.announcementSystem) window.announcementSystem = new AnnouncementSystem();
    window.announcementSystem.init();
  }catch(e){ console.error('initAnnouncementSystem error:', e);} 
};

window.initAnnouncementAdminSystem = function(){
  try{
    if (!window.announcementAdminSystem) window.announcementAdminSystem = new AnnouncementAdminSystem();
    window.announcementAdminSystem.init();
  }catch(e){ console.error('initAnnouncementAdminSystem error:', e);} 
};

// 全局保存函数 - 作为备用(保留兼容性)
window.saveAnnouncement = function() {
  console.log('全局保存函数被调用');
  if (window.announcementAdminSystem) {
    window.announcementAdminSystem.saveAnnouncement();
  } else {
    console.error('announcementAdminSystem 未初始化');
  }
};

// 监听语言变化事件
window.addEventListener('languageChanged', function(e) {
  const modal = document.getElementById('announcement-modal');
  if (modal && modal.classList.contains('show')) {
    const translateBtn = modal.querySelector('.announcement-translate-btn');
    const translateText = translateBtn ? translateBtn.querySelector('.translate-text') : null;
    const siteLanguage = e.detail.language;
    
    if (siteLanguage !== 'zh-cn' && translateBtn) {
      translateBtn.style.display = 'flex';
      
      const buttonTexts = {
        'en-us': { translate: 'Translate', original: 'Original' },
        'ja-jp': { translate: '翻訳', original: '原文' }
      };
      
      if (buttonTexts[siteLanguage] && translateText) {
        if (window.announcementSystem && window.announcementSystem.currentLanguage === 'zh-CN') {
          translateText.textContent = buttonTexts[siteLanguage].translate;
        } else {
          translateText.textContent = buttonTexts[siteLanguage].original;
        }
        translateText.setAttribute('data-translate-text', buttonTexts[siteLanguage].translate);
        translateText.setAttribute('data-original-text', buttonTexts[siteLanguage].original);
      }
    } else if (translateBtn) {
      translateBtn.style.display = 'none';
      if (window.announcementSystem && window.announcementSystem.currentLanguage !== 'zh-CN') {
        const titleElement = modal.querySelector('.announcement-modal-title');
        const contentElement = modal.querySelector('.html-content');
        if (titleElement && window.announcementSystem.originalContent.title) {
          titleElement.textContent = window.announcementSystem.originalContent.title;
        }
        if (contentElement && window.announcementSystem.originalContent.content) {
          contentElement.innerHTML = window.announcementSystem.originalContent.content;
        }
        window.announcementSystem.currentLanguage = 'zh-CN';
      }
    }
  }
});
