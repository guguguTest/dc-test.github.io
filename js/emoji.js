// 表情功能JavaScript
(function(global) {
  'use strict';

  let currentEmojiPack = null;
  let emojiPacks = [];
  let recentEmojis = [];
  let selectedChatInput = null;
  let uploadedFiles = [];

  // 初始化表情系统
  function initEmojiSystem() {
    // 加载表情包数据
    loadEmojiPacks();
    
    // 监听所有聊天窗口
    observeChatWindows();
    
    // 绑定全局点击事件
    document.addEventListener('click', handleGlobalClick);
  }

  // 监听聊天窗口的创建
  function observeChatWindows() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              // 查找聊天输入区域
              const inputArea = node.querySelector('.chat-input-area');
              if (inputArea && !inputArea.querySelector('.emoji-btn')) {
                addEmojiButton(inputArea);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 初始化现有的聊天窗口
    document.querySelectorAll('.chat-input-area').forEach(inputArea => {
      if (!inputArea.querySelector('.emoji-btn')) {
        addEmojiButton(inputArea);
      }
    });
  }

  // 添加表情按钮到聊天输入区域
  function addEmojiButton(inputArea) {
    const chatInput = inputArea.querySelector('.chat-input');
    const sendBtn = inputArea.querySelector('.chat-send-btn');
    
    if (!chatInput || !sendBtn) return;

    const emojiBtn = document.createElement('button');
    emojiBtn.className = 'emoji-btn';
    emojiBtn.innerHTML = '<i class="far fa-smile"></i>';
    emojiBtn.title = '选择表情';
    
    // 插入到发送按钮前面
    inputArea.insertBefore(emojiBtn, sendBtn);
    
    // 绑定点击事件
    emojiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedChatInput = chatInput;
      toggleEmojiPicker(emojiBtn);
    });
  }

  // 切换表情选择器
  function toggleEmojiPicker(btn) {
    let picker = document.querySelector('.emoji-picker');
    
    if (picker && picker.classList.contains('show')) {
      picker.classList.remove('show');
      btn.classList.remove('active');
      return;
    }
    
    if (!picker) {
      picker = createEmojiPicker();
      document.body.appendChild(picker);
    }
    
    // 定位到按钮附近
    const btnRect = btn.getBoundingClientRect();
    const pickerHeight = 400;
    const pickerWidth = 340;
    
    // 计算位置
    let top = btnRect.top - pickerHeight - 10;
    let left = btnRect.left - pickerWidth + btnRect.width;
    
    // 检查是否超出视口
    if (top < 10) {
      top = btnRect.bottom + 10;
    }
    if (left < 10) {
      left = 10;
    }
    if (left + pickerWidth > window.innerWidth - 10) {
      left = window.innerWidth - pickerWidth - 10;
    }
    
    picker.style.position = 'fixed';
    picker.style.top = top + 'px';
    picker.style.left = left + 'px';
    
    picker.classList.add('show');
    btn.classList.add('active');
    
    // 加载第一个表情包
    if (emojiPacks.length > 0) {
      loadEmojiPackContent(emojiPacks[0].id);
    }
  }

  // 创建表情选择器
  function createEmojiPicker() {
    const picker = document.createElement('div');
    picker.className = 'emoji-picker';
    picker.innerHTML = `
      <div class="emoji-grid-container">
        <div class="emoji-loading">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
      </div>
      <div class="emoji-tabs">
        <button class="emoji-tab recent-tab" data-tab="recent" title="最近使用">
          <i class="far fa-clock"></i>
        </button>
      </div>
    `;
    
    return picker;
  }

  // 加载表情包
  async function loadEmojiPacks() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/emoji/packs`);
      if (response.ok) {
        emojiPacks = await response.json();
        updateEmojiTabs();
      }
    } catch (error) {
      console.error('加载表情包失败:', error);
    }
  }

  // 更新表情分组标签
  function updateEmojiTabs() {
    const tabsContainer = document.querySelector('.emoji-tabs');
    if (!tabsContainer) return;
    
    // 清空现有标签（保留最近使用）
    const recentTab = tabsContainer.querySelector('.recent-tab');
    tabsContainer.innerHTML = '';
    if (recentTab) {
      tabsContainer.appendChild(recentTab);
    }
    
    // 添加表情包标签
    emojiPacks.forEach(pack => {
      const tab = document.createElement('button');
      tab.className = 'emoji-tab';
      tab.dataset.packId = pack.id;
      tab.title = pack.pack_name;
      
      if (pack.cover_image) {
        tab.innerHTML = `<img src="${API_BASE_URL}${pack.cover_image}" alt="${pack.pack_name}">`;
      } else {
        tab.innerHTML = '<i class="far fa-smile"></i>';
      }
      
      tab.addEventListener('click', () => {
        selectEmojiTab(tab, pack.id);
      });
      
      tabsContainer.appendChild(tab);
    });
  }

  // 选择表情标签
  function selectEmojiTab(tab, packId) {
    // 移除所有激活状态
    document.querySelectorAll('.emoji-tab').forEach(t => {
      t.classList.remove('active');
    });
    
    tab.classList.add('active');
    
    if (packId === 'recent') {
      loadRecentEmojis();
    } else {
      loadEmojiPackContent(packId);
    }
  }

  // 加载表情包内容
  async function loadEmojiPackContent(packId) {
    const gridContainer = document.querySelector('.emoji-grid-container');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '<div class="emoji-loading"><i class="fas fa-spinner fa-spin"></i></div>';
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/emoji/pack/${packId}/items`);
      if (response.ok) {
        const emojis = await response.json();
        renderEmojiGrid(emojis);
        
        // 激活对应的标签
        document.querySelectorAll('.emoji-tab').forEach(t => {
          t.classList.remove('active');
          if (t.dataset.packId == packId) {
            t.classList.add('active');
          }
        });
      }
    } catch (error) {
      console.error('加载表情失败:', error);
      gridContainer.innerHTML = '<div class="emoji-empty">加载失败</div>';
    }
  }

  // 渲染表情网格
  function renderEmojiGrid(emojis) {
    const gridContainer = document.querySelector('.emoji-grid-container');
    if (!gridContainer) return;
    
    if (emojis.length === 0) {
      gridContainer.innerHTML = `
        <div class="emoji-empty">
          <div class="emoji-empty-icon"><i class="far fa-meh"></i></div>
          <div class="emoji-empty-text">暂无表情</div>
        </div>
      `;
      return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'emoji-grid';
    
    emojis.forEach(emoji => {
      const item = document.createElement('div');
      item.className = 'emoji-item';
      item.innerHTML = `
        <img src="${API_BASE_URL}${emoji.file_path}" alt="${emoji.emoji_name || emoji.file_name}">
        <span class="emoji-item-name">${emoji.emoji_name || emoji.file_name}</span>
      `;
      
      item.addEventListener('click', () => {
        sendEmoji(emoji);
      });
      
      grid.appendChild(item);
    });
    
    gridContainer.innerHTML = '';
    gridContainer.appendChild(grid);
  }

  // 发送表情
  function sendEmoji(emoji) {
    if (!selectedChatInput) return;
    
    // 记录使用
    recordEmojiUsage(emoji.id);
    
    // 创建表情消息
    const emojiMessage = `[emoji:${emoji.id}:${emoji.file_path}]`;
    
    // 插入到输入框（实际发送时需要处理）
    selectedChatInput.value = emojiMessage;
    
    // 触发发送
    const sendBtn = selectedChatInput.parentElement.querySelector('.chat-send-btn');
    if (sendBtn) {
      sendBtn.click();
    }
    
    // 关闭选择器
    const picker = document.querySelector('.emoji-picker');
    if (picker) {
      picker.classList.remove('show');
    }
    
    // 移除激活状态
    document.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.classList.remove('active');
    });
  }

  // 记录表情使用
  async function recordEmojiUsage(emojiId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/emoji/usage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emoji_id: emojiId })
      });
    } catch (error) {
      console.error('记录表情使用失败:', error);
    }
  }

  // 加载最近使用的表情
  async function loadRecentEmojis() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const gridContainer = document.querySelector('.emoji-grid-container');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '<div class="emoji-loading"><i class="fas fa-spinner fa-spin"></i></div>';
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/emoji/recent`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const emojis = await response.json();
        renderEmojiGrid(emojis);
      }
    } catch (error) {
      console.error('加载最近使用表情失败:', error);
      gridContainer.innerHTML = '<div class="emoji-empty">暂无最近使用</div>';
    }
  }

  // 全局点击处理
  function handleGlobalClick(e) {
    const picker = document.querySelector('.emoji-picker');
    if (!picker) return;
    
    const isEmojiBtn = e.target.closest('.emoji-btn');
    const isPicker = e.target.closest('.emoji-picker');
    
    if (!isEmojiBtn && !isPicker && picker.classList.contains('show')) {
      picker.classList.remove('show');
      document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.classList.remove('active');
      });
    }
  }

  // 渲染表情管理页面
  async function renderEmojiManagement() {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="emoji-management">
        <div class="emoji-management-header">
          <h1 class="emoji-management-title">
            <i class="far fa-smile"></i> 表情管理
          </h1>
          <button class="btn-add-emoji-pack" onclick="openAddEmojiPackModal()">
            <i class="fas fa-plus"></i> 添加表情包
          </button>
        </div>
        <div id="emoji-packs-container">
          <div class="emoji-loading">
            <i class="fas fa-spinner fa-spin"></i> 加载中...
          </div>
        </div>
      </div>
    `;
    
    loadEmojiPacksList();
  }

  // 加载表情包列表
  async function loadEmojiPacksList() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/emoji/packs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const packs = await response.json();
        renderEmojiPacksGrid(packs);
      }
    } catch (error) {
      console.error('加载表情包列表失败:', error);
    }
  }

  // 渲染表情包网格
  function renderEmojiPacksGrid(packs) {
    const container = document.getElementById('emoji-packs-container');
    if (!container) return;
    
    if (packs.length === 0) {
      container.innerHTML = `
        <div class="emoji-empty">
          <div class="emoji-empty-icon"><i class="far fa-folder-open"></i></div>
          <div class="emoji-empty-text">暂无表情包</div>
        </div>
      `;
      return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'emoji-packs-grid';
    
    packs.forEach(pack => {
      const card = document.createElement('div');
      card.className = 'emoji-pack-card';
      card.innerHTML = `
        <div class="emoji-pack-cover">
          ${pack.cover_image ? 
            `<img src="${API_BASE_URL}${pack.cover_image}" alt="${pack.pack_name}">` :
            '<i class="far fa-smile" style="font-size: 48px; color: #65676b;"></i>'
          }
        </div>
        <div class="emoji-pack-info">
          <div class="emoji-pack-name">${escapeHtml(pack.pack_name)}</div>
          <div class="emoji-pack-actions">
            <button class="emoji-pack-btn edit" onclick="editEmojiPack(${pack.id})">
              <i class="fas fa-edit"></i>
              <span>编辑</span>
            </button>
            <button class="emoji-pack-btn delete" onclick="deleteEmojiPack(${pack.id})">
              <i class="fas fa-trash"></i>
              <span>删除</span>
            </button>
          </div>
        </div>
      `;
      
      grid.appendChild(card);
    });
    
    container.innerHTML = '';
    container.appendChild(grid);
  }

  // 打开添加表情包弹窗
  function openAddEmojiPackModal() {
    currentEmojiPack = null;
    uploadedFiles = [];
    
    let modal = document.getElementById('emoji-pack-modal');
    if (!modal) {
      modal = createEmojiPackModal();
      document.body.appendChild(modal);
    }
    
    // 重置表单
    document.getElementById('emoji-pack-name').value = '';
    document.getElementById('emoji-folder-name').value = '';
    document.getElementById('emoji-pack-cover').value = '';
    document.getElementById('emoji-pack-images').value = '';
    document.getElementById('emoji-preview-grid').innerHTML = '';
    document.getElementById('emoji-upload-progress').classList.remove('show');
    
    modal.querySelector('.emoji-pack-modal-title').textContent = '添加表情包';
    modal.classList.add('show');
  }

  // 创建表情包编辑弹窗
  function createEmojiPackModal() {
    const modal = document.createElement('div');
    modal.id = 'emoji-pack-modal';
    modal.className = 'emoji-pack-modal';
    modal.innerHTML = `
      <div class="emoji-pack-modal-content">
        <div class="emoji-pack-modal-header">
          <h3 class="emoji-pack-modal-title">添加表情包</h3>
          <button class="emoji-pack-modal-close" onclick="closeEmojiPackModal()">&times;</button>
        </div>
        <div class="emoji-pack-modal-body">
          <div class="emoji-form-group">
            <label class="emoji-form-label">表情包名称</label>
            <input type="text" id="emoji-pack-name" class="emoji-form-input" placeholder="输入表情包名称">
          </div>
          
          <div class="emoji-form-group">
            <label class="emoji-form-label">文件夹名称</label>
            <input type="text" id="emoji-folder-name" class="emoji-form-input" placeholder="英文或数字，用于服务器存储">
          </div>
          
          <div class="emoji-form-group">
            <label class="emoji-form-label">表情包封面</label>
            <div class="emoji-upload-area" onclick="document.getElementById('emoji-pack-cover').click()">
              <div class="emoji-upload-icon"><i class="fas fa-image"></i></div>
              <div class="emoji-upload-text">点击上传封面图片</div>
              <div class="emoji-upload-hint">建议尺寸 200x200，仅支持图片格式</div>
            </div>
            <input type="file" id="emoji-pack-cover" accept="image/*" style="display: none;" onchange="handleCoverUpload(this)">
          </div>
          
          <div class="emoji-form-group">
            <label class="emoji-form-label">上传表情图片</label>
            <div class="emoji-upload-area" onclick="document.getElementById('emoji-pack-images').click()" 
                 ondragover="handleDragOver(event)" 
                 ondrop="handleDrop(event)">
              <div class="emoji-upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
              <div class="emoji-upload-text">点击或拖拽上传表情图片</div>
              <div class="emoji-upload-hint">支持批量上传，支持 JPG、PNG、GIF 格式</div>
            </div>
            <input type="file" id="emoji-pack-images" accept="image/*" multiple style="display: none;" onchange="handleImagesUpload(this)">
          </div>
          
          <div id="emoji-upload-progress" class="emoji-upload-progress">
            <div class="emoji-progress-bar">
              <div id="emoji-progress-fill" class="emoji-progress-fill" style="width: 0;"></div>
            </div>
            <div id="emoji-progress-text" class="emoji-progress-text">上传中 0%</div>
          </div>
          
          <div id="emoji-preview-grid" class="emoji-preview-grid"></div>
        </div>
        <div class="emoji-pack-modal-footer">
          <button class="emoji-modal-btn cancel" onclick="closeEmojiPackModal()">取消</button>
          <button class="emoji-modal-btn save" onclick="saveEmojiPack()">保存</button>
        </div>
      </div>
    `;
    
    return modal;
  }

  // 处理封面上传
  async function handleCoverUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const formData = new FormData();
    formData.append('cover', file);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/emoji/upload-cover`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        // 显示预览
        const uploadArea = input.parentElement.querySelector('.emoji-upload-area');
        uploadArea.innerHTML = `<img src="${API_BASE_URL}${result.url}" style="max-width: 100%; max-height: 200px;">`;
        uploadArea.dataset.coverUrl = result.url;
      }
    } catch (error) {
      console.error('上传封面失败:', error);
      alert('上传封面失败');
    }
  }

  // 处理表情图片上传
  async function handleImagesUpload(input) {
    const files = Array.from(input.files);
    if (files.length === 0) return;
    
    const folderName = document.getElementById('emoji-folder-name').value;
    if (!folderName) {
      alert('请先输入文件夹名称');
      input.value = '';
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // 显示进度条
    const progressDiv = document.getElementById('emoji-upload-progress');
    const progressFill = document.getElementById('emoji-progress-fill');
    const progressText = document.getElementById('emoji-progress-text');
    progressDiv.classList.add('show');
    
    let uploaded = 0;
    const total = files.length;
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder_name', folderName);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/emoji/upload-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          uploadedFiles.push({
            file_name: file.name,
            file_path: result.url,
            emoji_name: file.name.replace(/\.[^/.]+$/, '')
          });
        }
      } catch (error) {
        console.error('上传表情失败:', error);
      }
      
      uploaded++;
      const progress = Math.round((uploaded / total) * 100);
      progressFill.style.width = progress + '%';
      progressText.textContent = `上传中 ${progress}%`;
    }
    
    // 显示预览
    renderUploadedEmojis();
    
    // 隐藏进度条
    setTimeout(() => {
      progressDiv.classList.remove('show');
    }, 1000);
  }

  // 渲染已上传的表情
  function renderUploadedEmojis() {
    const grid = document.getElementById('emoji-preview-grid');
    grid.innerHTML = '';
    
    uploadedFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'emoji-preview-item';
      item.innerHTML = `
        <img src="${API_BASE_URL}${file.file_path}" class="emoji-preview-image">
        <input type="text" class="emoji-name-input" placeholder="表情名称" 
               value="${file.emoji_name}" 
               onchange="updateEmojiName(${index}, this.value)">
        <button class="emoji-preview-remove" onclick="removeUploadedEmoji(${index})">删除</button>
      `;
      grid.appendChild(item);
    });
  }

  // 更新表情名称
  function updateEmojiName(index, name) {
    if (uploadedFiles[index]) {
      uploadedFiles[index].emoji_name = name;
    }
  }

  // 删除已上传的表情
  function removeUploadedEmoji(index) {
    uploadedFiles.splice(index, 1);
    renderUploadedEmojis();
  }

  // 保存表情包
  async function saveEmojiPack() {
    const packName = document.getElementById('emoji-pack-name').value;
    const folderName = document.getElementById('emoji-folder-name').value;
    const coverArea = document.querySelector('.emoji-upload-area');
    const coverUrl = coverArea.dataset.coverUrl;
    
    if (!packName || !folderName) {
      alert('请填写表情包名称和文件夹名称');
      return;
    }
    
    if (uploadedFiles.length === 0) {
      alert('请上传至少一个表情图片');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const data = {
      pack_name: packName,
      folder_name: folderName,
      cover_image: coverUrl,
      emojis: uploadedFiles
    };
    
    try {
      const url = currentEmojiPack 
        ? `${API_BASE_URL}/api/admin/emoji/packs/${currentEmojiPack.id}`
        : `${API_BASE_URL}/api/admin/emoji/packs`;
      
      const response = await fetch(url, {
        method: currentEmojiPack ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        closeEmojiPackModal();
        loadEmojiPacksList();
        showSuccessMessage(currentEmojiPack ? '表情包更新成功' : '表情包添加成功');
      } else {
        const error = await response.json();
        alert(error.error || '操作失败');
      }
    } catch (error) {
      console.error('保存表情包失败:', error);
      alert('保存失败');
    }
  }

  // 编辑表情包
  async function editEmojiPack(packId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/emoji/packs/${packId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        currentEmojiPack = await response.json();
        openEditEmojiPackModal();
      }
    } catch (error) {
      console.error('获取表情包详情失败:', error);
    }
  }

  // 打开编辑表情包弹窗
  function openEditEmojiPackModal() {
    if (!currentEmojiPack) return;
    
    let modal = document.getElementById('emoji-pack-modal');
    if (!modal) {
      modal = createEmojiPackModal();
      document.body.appendChild(modal);
    }
    
    // 填充数据
    document.getElementById('emoji-pack-name').value = currentEmojiPack.pack_name;
    document.getElementById('emoji-folder-name').value = currentEmojiPack.folder_name;
    
    if (currentEmojiPack.cover_image) {
      const uploadArea = modal.querySelector('.emoji-upload-area');
      uploadArea.innerHTML = `<img src="${API_BASE_URL}${currentEmojiPack.cover_image}" style="max-width: 100%; max-height: 200px;">`;
      uploadArea.dataset.coverUrl = currentEmojiPack.cover_image;
    }
    
    uploadedFiles = currentEmojiPack.emojis || [];
    renderUploadedEmojis();
    
    modal.querySelector('.emoji-pack-modal-title').textContent = '编辑表情包';
    modal.classList.add('show');
  }

  // 删除表情包
  async function deleteEmojiPack(packId) {
    if (!confirm('确定要删除这个表情包吗？')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/emoji/packs/${packId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        loadEmojiPacksList();
        showSuccessMessage('表情包已删除');
      }
    } catch (error) {
      console.error('删除表情包失败:', error);
      alert('删除失败');
    }
  }

  // 关闭表情包弹窗
  function closeEmojiPackModal() {
    const modal = document.getElementById('emoji-pack-modal');
    if (modal) {
      modal.classList.remove('show');
    }
    currentEmojiPack = null;
    uploadedFiles = [];
  }

  // 拖拽处理
  function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
  }

  function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const input = document.getElementById('emoji-pack-images');
      input.files = files;
      handleImagesUpload(input);
    }
  }

  // 工具函数
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showSuccessMessage(message) {
    if (typeof window.showSuccessMessage === 'function') {
      window.showSuccessMessage(message);
    } else {
      alert(message);
    }
  }

  // 暴露给全局
  global.initEmojiSystem = initEmojiSystem;
  global.renderEmojiManagement = renderEmojiManagement;
  global.openAddEmojiPackModal = openAddEmojiPackModal;
  global.editEmojiPack = editEmojiPack;
  global.deleteEmojiPack = deleteEmojiPack;
  global.closeEmojiPackModal = closeEmojiPackModal;
  global.handleCoverUpload = handleCoverUpload;
  global.handleImagesUpload = handleImagesUpload;
  global.handleDragOver = handleDragOver;
  global.handleDrop = handleDrop;
  global.updateEmojiName = updateEmojiName;
  global.removeUploadedEmoji = removeUploadedEmoji;
  global.saveEmojiPack = saveEmojiPack;

  // 在DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiSystem);
  } else {
    setTimeout(initEmojiSystem, 100);
  }

})(window);