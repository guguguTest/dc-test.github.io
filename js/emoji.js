// 表情功能JavaScript
(function(global) {
  'use strict';

  let currentEmojiPack = null;
  let emojiPacks = [];
  let recentEmojis = [];
  let selectedChatInput = null;
  let uploadedFiles = [];

  // 添加全局变量
  window.folderCreated = false;
  window.currentFolderName = '';
  window.coverImageUrl = null;

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
    // 重置所有状态
    currentEmojiPack = null;
    uploadedFiles = [];
    window.folderCreated = false;
    window.currentFolderName = '';
    window.coverImageUrl = null;
    
    let modal = document.getElementById('emoji-pack-modal');
    if (!modal) {
      modal = createEmojiPackModal();
      document.body.appendChild(modal);
    }
    
    // 重置表单
    document.getElementById('emoji-pack-name').value = '';
    document.getElementById('emoji-folder-name').value = '';
    document.getElementById('emoji-folder-name').disabled = false;
    
    const createBtn = document.getElementById('create-folder-btn');
    if (createBtn) {
      createBtn.disabled = false;
      createBtn.textContent = '创建文件夹';
    }
    
    document.getElementById('folder-status').style.display = 'none';
    document.getElementById('emoji-preview-grid').innerHTML = '';
    
    // 禁用上传区域
    const coverArea = document.getElementById('cover-upload-area');
    const imagesArea = document.getElementById('images-upload-area');
    
    coverArea.className = 'emoji-upload-area disabled';
    imagesArea.className = 'emoji-upload-area disabled';
    
    coverArea.innerHTML = `
      <div class="emoji-upload-icon"><i class="fas fa-image"></i></div>
      <div class="emoji-upload-text">请先创建文件夹</div>
      <div class="emoji-upload-hint">创建文件夹后才能上传</div>
    `;
    
    imagesArea.innerHTML = `
      <div class="emoji-upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
      <div class="emoji-upload-text">请先创建文件夹</div>
      <div class="emoji-upload-hint">创建文件夹后才能上传</div>
    `;
    
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
            <label class="emoji-form-label">文件夹名称（英文或数字）</label>
            <div class="emoji-folder-input-group">
              <input type="text" id="emoji-folder-name" class="emoji-form-input" placeholder="例如: emoji_01">
              <button type="button" id="create-folder-btn" class="emoji-form-btn" onclick="createEmojiFolder()">创建文件夹</button>
            </div>
            <small class="emoji-form-hint">请先创建文件夹后再上传图片</small>
            <div id="folder-status" style="margin-top: 5px; display: none;"></div>
          </div>
          
          <div class="emoji-form-group">
            <label class="emoji-form-label">表情包封面</label>
            <div class="emoji-upload-area disabled" id="cover-upload-area">
              <div class="emoji-upload-icon"><i class="fas fa-image"></i></div>
              <div class="emoji-upload-text">请先创建文件夹</div>
              <div class="emoji-upload-hint">创建文件夹后才能上传</div>
            </div>
            <input type="file" id="emoji-pack-cover" accept="image/*" style="display: none;">
          </div>
          
          <div class="emoji-form-group">
            <label class="emoji-form-label">上传表情图片</label>
            <div class="emoji-upload-area disabled" id="images-upload-area">
              <div class="emoji-upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
              <div class="emoji-upload-text">请先创建文件夹</div>
              <div class="emoji-upload-hint">创建文件夹后才能上传</div>
            </div>
            <input type="file" id="emoji-pack-images" accept="image/*" multiple style="display: none;">
          </div>
          
          <div id="emoji-upload-progress" class="emoji-upload-progress" style="display: none;">
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

  // 创建文件夹函数
  window.createEmojiFolder = async function() {
    const folderNameInput = document.getElementById('emoji-folder-name');
    const folderName = folderNameInput.value.trim();
    
    if (!folderName) {
      alert('请输入文件夹名称');
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(folderName)) {
      alert('文件夹名称只能包含英文、数字、下划线和横线');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }
    
    const createBtn = document.getElementById('create-folder-btn');
    createBtn.disabled = true;
    createBtn.textContent = '创建中...';
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/emoji/create-folder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folder_name: folderName })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        window.folderCreated = true;
        window.currentFolderName = folderName;
        
        folderNameInput.disabled = true;
        createBtn.disabled = true;
        createBtn.textContent = '已创建';
        
        const statusDiv = document.getElementById('folder-status');
        statusDiv.innerHTML = `✔ 文件夹 "${folderName}" 已创建`;
        statusDiv.style.display = 'block';
        statusDiv.style.color = '#28a745';
        
        // 启用上传区域
        enableUploadAreas();
        
        alert('文件夹创建成功，现在可以上传图片了');
      } else {
        throw new Error(result.error || '创建文件夹失败');
      }
    } catch (error) {
      createBtn.disabled = false;
      createBtn.textContent = '创建文件夹';
      alert(error.message || '创建文件夹失败');
    }
  }

  // 启用上传区域函数
  function enableUploadAreas() {
    const coverArea = document.getElementById('cover-upload-area');
    const imagesArea = document.getElementById('images-upload-area');
    const coverInput = document.getElementById('emoji-pack-cover');
    const imagesInput = document.getElementById('emoji-pack-images');
    
    if (!window.currentFolderName || !window.folderCreated) {
      return;
    }
    
    // 启用封面上传
    coverArea.classList.remove('disabled');
    coverArea.innerHTML = `
      <div class="emoji-upload-icon"><i class="fas fa-image"></i></div>
      <div class="emoji-upload-text">点击上传封面图片</div>
      <div class="emoji-upload-hint" style="color: #28a745;">将上传到: ${window.currentFolderName}/jacket/</div>
    `;
    coverArea.onclick = () => coverInput.click();
    coverInput.onchange = function() { handleCoverUpload(this); };
    
    // 启用表情上传
    imagesArea.classList.remove('disabled');
    imagesArea.innerHTML = `
      <div class="emoji-upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
      <div class="emoji-upload-text">点击或拖拽上传表情图片</div>
      <div class="emoji-upload-hint" style="color: #28a745;">将上传到: ${window.currentFolderName}/</div>
    `;
    imagesArea.onclick = () => imagesInput.click();
    imagesInput.onchange = function() { handleImagesUpload(this); };
    
    // 设置拖拽
    imagesArea.ondragover = (e) => {
      e.preventDefault();
      imagesArea.classList.add('dragover');
    };
    imagesArea.ondrop = (e) => {
      e.preventDefault();
      imagesArea.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        imagesInput.files = files;
        handleImagesUpload(imagesInput);
      }
    };
    imagesArea.ondragleave = () => {
      imagesArea.classList.remove('dragover');
    };
  }

  // 处理封面上传
  async function handleCoverUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (!window.folderCreated || !window.currentFolderName) {
      alert('请先创建文件夹');
      input.value = '';
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const formData = new FormData();
    formData.append('cover', file);
    
    // 关键修复：正确传递folder_name参数
    const url = `${API_BASE_URL}/api/admin/emoji/upload-cover?folder_name=${encodeURIComponent(window.currentFolderName)}&type=cover`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        window.coverImageUrl = result.url;
        const coverArea = document.getElementById('cover-upload-area');
        coverArea.innerHTML = `
          <img src="${API_BASE_URL}${result.url}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
          <div style="margin-top: 5px; color: #28a745; font-size: 12px;">封面已上传</div>
        `;
        alert('封面上传成功');
      } else {
        throw new Error(result.error || '上传失败');
      }
    } catch (error) {
      alert(error.message || '上传封面失败');
    }
    
    input.value = '';
  }

  // 处理表情图片上传
  async function handleImagesUpload(input) {
    const files = Array.from(input.files);
    if (files.length === 0) return;
    
    if (!window.folderCreated || !window.currentFolderName) {
      alert('请先创建文件夹');
      input.value = '';
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const progressDiv = document.getElementById('emoji-upload-progress');
    const progressFill = document.getElementById('emoji-progress-fill');
    const progressText = document.getElementById('emoji-progress-text');
    progressDiv.style.display = 'block';
    
    let uploaded = 0;
    const total = files.length;
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        // 关键修复：正确传递folder_name参数
        const url = `${API_BASE_URL}/api/admin/emoji/upload-image?folder_name=${encodeURIComponent(window.currentFolderName)}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          uploadedFiles.push({
            file_name: result.file_name || file.name,
            file_path: result.url,
            emoji_name: file.name.replace(/\.[^/.]+$/, ''),
            sort_order: uploadedFiles.length
          });
        } else {
          alert(`上传 ${file.name} 失败: ${result.error}`);
        }
      } catch (error) {
        alert(`上传 ${file.name} 失败`);
      }
      
      uploaded++;
      const progress = Math.round((uploaded / total) * 100);
      progressFill.style.width = progress + '%';
      progressText.textContent = `上传中 ${progress}% (${uploaded}/${total})`;
    }
    
    renderUploadedEmojis();
    alert(`成功上传 ${uploadedFiles.length} 个表情`);
    
    setTimeout(() => {
      progressDiv.style.display = 'none';
      progressFill.style.width = '0%';
    }, 2000);
    
    input.value = '';
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
    const folderName = window.currentFolderName || document.getElementById('emoji-folder-name').value;
    const coverUrl = window.coverImageUrl;
    
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
    document.getElementById('emoji-folder-name').disabled = true;
    
    // 设置文件夹状态
    window.folderCreated = true;
    window.currentFolderName = currentEmojiPack.folder_name;
    
    const createBtn = document.getElementById('create-folder-btn');
    if (createBtn) {
      createBtn.disabled = true;
      createBtn.textContent = '已存在';
    }
    
    const statusDiv = document.getElementById('folder-status');
    statusDiv.innerHTML = `文件夹 "${currentEmojiPack.folder_name}" 已存在`;
    statusDiv.style.display = 'block';
    statusDiv.style.color = '#28a745';
    
    // 启用上传区域
    enableUploadAreas();
    
    if (currentEmojiPack.cover_image) {
      window.coverImageUrl = currentEmojiPack.cover_image;
      const coverArea = document.getElementById('cover-upload-area');
      coverArea.innerHTML = `
        <img src="${API_BASE_URL}${currentEmojiPack.cover_image}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
        <div style="margin-top: 5px; color: #28a745; font-size: 12px;">当前封面</div>
      `;
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
    window.folderCreated = false;
    window.currentFolderName = '';
    window.coverImageUrl = null;
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
  global.createEmojiFolder = window.createEmojiFolder;

  // 在DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiSystem);
  } else {
    setTimeout(initEmojiSystem, 100);
  }

})(window);