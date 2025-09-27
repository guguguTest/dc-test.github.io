// 公告系统功能
class AnnouncementSystem {
  constructor() {
    this._successNotifiedAt = 0;
    this._lastSaveAt = 0;
    this.currentPage = 1;
    this.totalPages = 1;
    this.announcements = [];
    this.pinnedAnnouncements = [];
    this.currentLanguage = 'zh-CN'; // 当前语言
    this.originalContent = {}; // 存储原始内容
  }

  // 初始化公告系统
  init() {
    this.loadAnnouncements();
    this.setupEventListeners();
  }

  // 设置事件监听器
  setupEventListeners() {
    // 使用事件委托来处理动态生成的公告项
    document.addEventListener('click', (e) => {
      // 检查点击的是否是公告项或其中的元素
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

      // 翻译按钮点击事件
      if (e.target.closest('.announcement-translate-btn')) {
        e.preventDefault();
        e.stopPropagation();
        this.toggleTranslation();
      }

      // 分页点击事件
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

  // 加载公告列表
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

  // 渲染公告列表
  renderAnnouncements() {
    const container = document.getElementById('announcements-container');
    if (!container) return;
    
    let html = '';
    
    // 渲染置顶公告
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
    
    // 渲染普通公告
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
    // 重置语言状态
    this.currentLanguage = 'zh-CN';
    
    // 存储原始内容
    this.originalContent = {
      title: announcement.title,
      content: announcement.content
    };
    
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
              <button class="announcement-translate-btn" title="翻译">
                <i class="fas fa-language"></i>
                <span class="translate-text">翻译</span>
              </button>
              <button class="announcement-modal-close">&times;</button>
            </div>
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
    }
    
    const titleElement = modal.querySelector('.announcement-modal-title');
    const contentElement = modal.querySelector('.announcement-modal-content.html-content');
    
    if (titleElement) titleElement.textContent = announcement.title;
    if (contentElement) contentElement.innerHTML = announcement.content;
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  // 切换翻译
  async toggleTranslation() {
    const modal = document.getElementById('announcement-modal');
    if (!modal) return;
    
    const titleElement = modal.querySelector('.announcement-modal-title');
    const contentElement = modal.querySelector('.announcement-modal-content.html-content');
    const translateBtn = modal.querySelector('.announcement-translate-btn');
    const translateText = translateBtn.querySelector('.translate-text');
    
    if (!titleElement || !contentElement) return;
    
    // 显示加载状态
    translateBtn.disabled = true;
    translateText.textContent = '翻译中...';
    
    try {
      if (this.currentLanguage === 'zh-CN') {
        // 获取用户的浏览器语言
        const userLang = navigator.language || navigator.userLanguage;
        let targetLang = 'en'; // 默认英语
        
        if (userLang.startsWith('ja')) {
          targetLang = 'ja';
        } else if (userLang.startsWith('ko')) {
          targetLang = 'ko';
        } else if (userLang.startsWith('zh')) {
          targetLang = 'en'; // 中文用户默认翻译成英文
        }
        
        // 翻译标题和内容
        const translatedTitle = await this.translateText(this.originalContent.title, targetLang);
        const translatedContent = await this.translateText(this.stripHtml(this.originalContent.content), targetLang);
        
        titleElement.textContent = translatedTitle;
        contentElement.innerHTML = `<div class="translated-content">${this.formatTranslatedContent(translatedContent)}</div>`;
        
        this.currentLanguage = targetLang;
        translateText.textContent = '原文';
      } else {
        // 恢复原文
        titleElement.textContent = this.originalContent.title;
        contentElement.innerHTML = this.originalContent.content;
        
        this.currentLanguage = 'zh-CN';
        translateText.textContent = '翻译';
      }
    } catch (error) {
      console.error('翻译失败:', error);
      alert('翻译失败，请稍后重试');
      translateText.textContent = '翻译';
    } finally {
      translateBtn.disabled = false;
    }
  }

  // 调用翻译API
  async translateText(text, targetLang) {
    // 使用Google翻译的Web API（需要注意：这是一个非官方的方法，可能会有限制）
    // 更可靠的方案是使用官方的Google Translate API或其他翻译服务
    
    try {
      // 这里使用一个简单的翻译API示例
      // 实际使用时，建议使用正规的翻译服务API
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data[0]) {
        return data[0].map(item => item[0]).join('');
      }
      
      throw new Error('翻译数据格式错误');
    } catch (error) {
      // 如果API调用失败，使用备用方案：打开Google翻译网页
      console.warn('API翻译失败，使用备用方案');
      window.open(`https://translate.google.com/?sl=zh-CN&tl=${targetLang}&text=${encodeURIComponent(text)}&op=translate`, '_blank');
      throw error;
    }
  }

  // 移除HTML标签
  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  // 格式化翻译后的内容
  formatTranslatedContent(text) {
    // 将纯文本转换为基本的HTML格式
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => `<p>${line}</p>`)
      .join('');
  }

  // 隐藏公告弹窗
  hideAnnouncementModal() {
    const modal = document.getElementById('announcement-modal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
      
      // 重置翻译状态
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

// 公告管理系统（管理员功能）
class AnnouncementAdminSystem {
  constructor() {
    this._successNotifiedAt = 0;
    this._lastSaveAt = 0;
    this.currentAnnouncement = null;
    this.isEditing = false;
    this.editorModal = null;
  }

  // 初始化公告管理系统
  init() {
    console.log('初始化公告管理系统');
    // 先清理可能存在的旧弹窗
    this.cleanupOldModals();
    // 创建新弹窗
    this.createEditorModal();
    this.loadAnnouncements();
    // 延迟设置事件监听器，确保DOM准备就绪
    setTimeout(() => {
      this.setupEventListeners();
      this.setupEditor();
    }, 100);
  }

  // 清理旧的弹窗
  cleanupOldModals() {
    const oldModals = document.querySelectorAll('#announcement-editor-modal');
    oldModals.forEach(modal => modal.remove());
  }

  // 创建编辑器弹窗
  createEditorModal() {
    // 确保没有重复的弹窗
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
              <div class="editor-toolbar">
                <button type="button" data-command="bold" title="粗体"><i class="fas fa-bold"></i></button>
                <button type="button" data-command="italic" title="斜体"><i class="fas fa-italic"></i></button>
                <button type="button" data-command="underline" title="下划线"><i class="fas fa-underline"></i></button>
                <button type="button" data-command="createLink" title="链接"><i class="fas fa-link"></i></button>
                <button type="button" data-command="insertUnorderedList" title="无序列表"><i class="fas fa-list-ul"></i></button>
                <button type="button" data-command="insertOrderedList" title="有序列表"><i class="fas fa-list-ol"></i></button>
                <button type="button" data-command="formatBlock" title="标题"><i class="fas fa-heading"></i></button>
                <button type="button" data-command="insertImage" title="图片"><i class="fas fa-image"></i></button>
              </div>
              <div id="announcement-editor-content" class="editor-content" contenteditable="true"></div>
            </div>
          </div>
          <div class="announcement-editor-footer">
            <button type="button" id="save-announcement-btn">保存公告</button>
          </div>
        </div>
      </div>
    `;
    
    // 直接插入到body末尾
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.editorModal = document.getElementById('announcement-editor-modal');
  }

  // 设置事件监听器 - 修复版本
  setupEventListeners() {
    const self = this;
    
    // 使用事件委托处理所有按钮点击 - 这是关键修复
    document.addEventListener('click', function(e) {
      // 新建公告按钮
      if (e.target && e.target.id === 'create-announcement-btn') {
        e.preventDefault();
        console.log('点击新建公告');
        self.showEditor(null);
        return;
      }
      
      // 【关键修复】保存公告按钮 - 使用事件委托确保可靠性
      if (e.target && e.target.id === 'save-announcement-btn') {
        e.preventDefault();
        e.stopPropagation();
        console.log('保存按钮被点击 - 通过事件委托');
        self.saveAnnouncement();
        return;
      }
      
      // 关闭编辑器按钮
      if (e.target && e.target.id === 'editor-close-btn') {
        e.preventDefault();
        console.log('关闭编辑器');
        self.hideEditor();
        return;
      }
      
      // 点击弹窗外部关闭
      if (e.target && e.target.id === 'announcement-editor-modal') {
        console.log('点击弹窗外部，关闭编辑器');
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
    });
  }

  // 设置编辑器
  setupEditor() {
    const editor = document.getElementById('announcement-editor-content');
    if (editor) {
      const toolbar = document.querySelector('.editor-toolbar');
      if (toolbar) {
        toolbar.querySelectorAll('button').forEach(button => {
          button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const command = button.dataset.command;
            
            if (command === 'createLink') {
              const url = prompt('请输入URL:');
              if (url) {
                document.execCommand(command, false, url);
              }
            } else if (command === 'insertImage') {
              const url = prompt('请输入图片URL:');
              if (url) {
                document.execCommand(command, false, url);
              }
            } else if (command === 'formatBlock') {
              document.execCommand(command, false, '<h3>');
            } else {
              document.execCommand(command, false, null);
            }
            
            editor.focus();
          });
        });
      }
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
    
    if (announcements.length === 0) {
      html = '<div class="no-announcements text-center py-4" style="grid-column: 1/-1;">暂无公告</div>';
    } else {
      announcements.forEach(announcement => {
        const date = new Date(announcement.created_at).toLocaleDateString('zh-CN');
        const typeClass = announcement.type || 'notice';
        const typeText = this.getTypeText(announcement.type);
        const pinnedIcon = announcement.is_pinned ? '<i class="fas fa-thumbtack admin-announcement-pinned"></i>' : '';
        
        html += `
          <div class="admin-announcement-item" data-id="${announcement.id}" data-type="${typeClass}">
            ${pinnedIcon}
            <div class="admin-announcement-header">
              <span class="admin-announcement-type ${typeClass}">${typeText}</span>
              <h4 class="admin-announcement-title">${announcement.title}</h4>
              <div class="admin-announcement-date">${date}</div>
            </div>
            <div class="admin-announcement-content">
              ${announcement.content.replace(/<[^>]*>/g, '').substring(0, 100)}${announcement.content.length > 100 ? '...' : ''}
            </div>
            <div class="admin-announcement-actions">
              <button class="btn-edit" data-id="${announcement.id}">
                <i class="fas fa-edit"></i> 编辑
              </button>
              <button class="btn-delete" data-id="${announcement.id}">
                <i class="fas fa-trash"></i> 删除
              </button>
            </div>
          </div>
        `;
      });
    }
    
    container.innerHTML = html;
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

  // 显示编辑器 - 移除不稳定的setTimeout事件绑定
  showEditor(announcement) {
    console.log('显示编辑器，公告数据:', announcement);
    
    // 强制重新获取元素，确保是最新的
    const titleInput = document.querySelector('#announcement-editor-modal #announcement-title');
    const typeSelect = document.querySelector('#announcement-editor-modal #announcement-type');
    const pinnedCheckbox = document.querySelector('#announcement-editor-modal #announcement-pinned');
    const contentEditor = document.querySelector('#announcement-editor-modal #announcement-editor-content');
    const editorTitle = document.querySelector('#announcement-editor-modal #editor-title');
    
    // 设置编辑状态
    this.isEditing = announcement !== null;
    this.currentAnnouncement = announcement;
    
    // 先清空所有字段
    if (titleInput) {
      titleInput.value = '';
    }
    if (typeSelect) {
      typeSelect.value = 'notice';
    }
    if (pinnedCheckbox) {
      pinnedCheckbox.checked = false;
    }
    if (contentEditor) {
      contentEditor.innerHTML = '';
    }
    
    // 更新标题
    if (editorTitle) {
      editorTitle.textContent = this.isEditing ? '编辑公告' : '新建公告';
    }
    
    // 如果是编辑模式，填充数据
    if (announcement) {
      if (titleInput) {
        titleInput.value = announcement.title || '';
      }
      if (typeSelect) {
        typeSelect.value = announcement.type || 'notice';
      }
      if (pinnedCheckbox) {
        pinnedCheckbox.checked = announcement.is_pinned === true || announcement.is_pinned === 1;
      }
      if (contentEditor) {
        contentEditor.innerHTML = announcement.content || '';
      }
    }
    
    // 显示弹窗
    if (this.editorModal) {
      this.editorModal.classList.add('show');
      document.body.style.overflow = 'hidden';
      
      // 强制重绘，确保更新显示
      this.editorModal.offsetHeight;
    }
    
    console.log('编辑器状态:', {
      isEditing: this.isEditing,
      title: titleInput?.value,
      content: contentEditor?.innerHTML?.substring(0, 50)
    });
  }

  // 隐藏编辑器
  hideEditor() {
    console.log('隐藏编辑器');
    
    if (this.editorModal) {
      this.editorModal.classList.remove('show');
      document.body.style.overflow = '';
    }
    
    // 清空表单
    const titleInput = document.querySelector('#announcement-editor-modal #announcement-title');
    const typeSelect = document.querySelector('#announcement-editor-modal #announcement-type');
    const pinnedCheckbox = document.querySelector('#announcement-editor-modal #announcement-pinned');
    const contentEditor = document.querySelector('#announcement-editor-modal #announcement-editor-content');
    
    if (titleInput) titleInput.value = '';
    if (typeSelect) typeSelect.value = 'notice';
    if (pinnedCheckbox) pinnedCheckbox.checked = false;
    if (contentEditor) contentEditor.innerHTML = '';
    
    this.currentAnnouncement = null;
    this.isEditing = false;
  }

  // 保存公告 - 修复版本，添加更详细的错误处理
  async saveAnnouncement() {
    console.log('执行保存...');
    
    try {
      // 重新获取元素
      const titleInput = document.querySelector('#announcement-editor-modal #announcement-title');
      const typeSelect = document.querySelector('#announcement-editor-modal #announcement-type');
      const pinnedCheckbox = document.querySelector('#announcement-editor-modal #announcement-pinned');
      const contentEditor = document.querySelector('#announcement-editor-modal #announcement-editor-content');
      
      if (!titleInput || !typeSelect || !pinnedCheckbox || !contentEditor) {
        console.error('无法找到表单元素');
        alert('表单元素未找到，请刷新页面重试');
        return;
      }
      
      const title = titleInput.value.trim();
      const type = typeSelect.value;
      const isPinned = pinnedCheckbox.checked;
      const content = contentEditor.innerHTML.trim();
      const textContent = contentEditor.innerText.trim();
      
      console.log('保存数据:', {
        title: title,
        type: type,
        isPinned: isPinned,
        contentLength: content.length,
        textContentLength: textContent.length
      });
      
      if (!title) {
        alert('请输入公告标题');
        titleInput.focus();
        return;
      }
      
      if (!textContent) {
        alert('请输入公告内容');
        contentEditor.focus();
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

  // 编辑公告
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
      
      // 延迟一下再显示，确保DOM更新
      setTimeout(() => {
        this.showEditor(announcement);
      }, 50);
      
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

// 全局保存函数 - 作为备用（保留兼容性）
window.saveAnnouncement = function() {
  console.log('全局保存函数被调用');
  if (window.announcementAdminSystem) {
    window.announcementAdminSystem.saveAnnouncement();
  } else {
    console.error('announcementAdminSystem 未初始化');
  }
};