// emoji.js - 表情功能JavaScript - 增强版（含音频功能）- 修复版
(function(global) {
  'use strict';

  // 确保API_BASE_URL存在
  if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
  }
  const API_BASE_URL = window.API_BASE_URL;

  let currentEmojiPack = null;
  let emojiPacks = [];
  let recentEmojis = [];
  let selectedChatInput = null;
  let uploadedFiles = [];
  let uploadedAudios = [];

  // 添加全局变量
  window.folderCreated = false;
  window.currentFolderName = '';
  window.coverImageUrl = null;
  window.isAudioPack = false;
  window.uploadedFiles = [];
  window.uploadedAudios = [];

  // 音频管理器
  const AudioManager = {
    currentAudio: null,
    preloadedAudios: new Map(),
    
    preloadAudio(url) {
      if (!this.preloadedAudios.has(url)) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.volume = 0.7;
        this.preloadedAudios.set(url, audio);
      }
    },
    
    playAudio(url) {
      try {
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        }
        
        let audio = this.preloadedAudios.get(url);
        if (!audio) {
          audio = new Audio(url);
          audio.volume = 0.7;
          this.preloadedAudios.set(url, audio);
        }
        
        const audioClone = audio.cloneNode();
        audioClone.volume = 0.7;
        this.currentAudio = audioClone;
        
        const playPromise = audioClone.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('音频自动播放被阻止:', error);
          });
        }
      } catch (error) {
        console.error('播放音频失败:', error);
      }
    },
    
    stopAll() {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
    }
  };

  // 暴露音频管理器到全局
  window.EmojiAudioManager = AudioManager;

  // 初始化表情系统
  function initEmojiSystem() {
    loadEmojiPacks();
    observeChatWindows();
    document.addEventListener('click', handleGlobalClick);
  }

  // 监听聊天窗口的创建
  function observeChatWindows() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
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
    
    inputArea.insertBefore(emojiBtn, sendBtn);
    
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
    
    const btnRect = btn.getBoundingClientRect();
    const pickerHeight = 400;
    const pickerWidth = 340;
    
    let top = btnRect.top - pickerHeight - 10;
    let left = btnRect.left - pickerWidth + btnRect.width;
    
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
    
    const recentTab = tabsContainer.querySelector('.recent-tab');
    tabsContainer.innerHTML = '';
    if (recentTab) {
      tabsContainer.appendChild(recentTab);
    }
    
    emojiPacks.forEach(pack => {
      const tab = document.createElement('button');
      tab.className = 'emoji-tab';
      tab.dataset.packId = pack.id;
      tab.title = pack.pack_name;
      
      if (pack.is_audio_pack) {
        tab.classList.add('audio-pack');
      }
      
      if (pack.cover_image) {
        tab.innerHTML = `
          <img src="${API_BASE_URL}${pack.cover_image}" alt="${pack.pack_name}">
          ${pack.is_audio_pack ? '<i class="fas fa-volume-up emoji-audio-indicator"></i>' : ''}
        `;
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
        
        // 预加载音频
        emojis.forEach(emoji => {
          if (emoji.audio_path) {
            AudioManager.preloadAudio(`${API_BASE_URL}${emoji.audio_path}`);
          }
        });
        
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
    // 兼容 sound_path 和 audio_path
    const audioPath = emoji.sound_path || emoji.audio_path;
    if (audioPath) {
      item.classList.add('has-audio');
    }
    
    item.innerHTML = `
      <img src="${API_BASE_URL}${emoji.file_path}" alt="${emoji.emoji_name || emoji.file_name}">
      ${audioPath ? '<i class="fas fa-volume-up emoji-audio-badge"></i>' : ''}
      <span class="emoji-item-name">${emoji.emoji_name || emoji.file_name}</span>
    `;
    
    item.addEventListener('click', () => {
      // 确保传递正确的音频路径
      const emojiToSend = {
        ...emoji,
        audio_path: audioPath  // 确保有 audio_path 字段用于兼容
      };
      sendEmoji(emojiToSend);
    });
    
    grid.appendChild(item);
  });
  
  gridContainer.innerHTML = '';
  gridContainer.appendChild(grid);
}

  // 发送表情（修复音频路径）
function sendEmoji(emoji) {
  if (!selectedChatInput) return;
  
  recordEmojiUsage(emoji.id);
  
  // 创建表情消息数据
  let emojiData = {
    id: emoji.id,
    path: emoji.file_path,
    name: emoji.emoji_name || emoji.file_name
  };
  
  // 兼容 sound_path 和 audio_path
  const audioPath = emoji.sound_path || emoji.audio_path;
  if (audioPath) {
    emojiData.audio = audioPath;
    // 播放音频
    AudioManager.playAudio(`${API_BASE_URL}${audioPath}`);
  }
  
  // 使用JSON格式传递数据
  const emojiMessage = `[emoji:${JSON.stringify(emojiData)}]`;
  
  selectedChatInput.value = emojiMessage;
  
  const sendBtn = selectedChatInput.parentElement.querySelector('.chat-send-btn');
  if (sendBtn) {
    sendBtn.click();
  }
  
  const picker = document.querySelector('.emoji-picker');
  if (picker) {
    picker.classList.remove('show');
  }
  
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

  // 渲染表情管理页面
  window.renderEmojiManagement = async function() {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="emoji-management">
        <div class="emoji-management-header">
          <h1 class="emoji-management-title">
            <i class="far fa-smile"></i> 表情管理
          </h1>
          <div class="emoji-management-actions">
            <button class="btn-add-emoji-pack" onclick="openAddEmojiPackModal()">
              <i class="fas fa-plus"></i> 添加表情包
            </button>
            <button class="btn-back" onclick="renderSiteAdminHome()">
              <i class="fas fa-arrow-left"></i> 返回
            </button>
          </div>
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
      if (pack.is_audio_pack) {
        card.classList.add('audio-pack');
      }
      
      card.innerHTML = `
        <div class="emoji-pack-cover">
          ${pack.cover_image ? 
            `<img src="${API_BASE_URL}${pack.cover_image}" alt="${pack.pack_name}">` :
            '<i class="far fa-smile" style="font-size: 48px; color: #65676b;"></i>'
          }
          ${pack.is_audio_pack ? '<div class="audio-pack-badge"><i class="fas fa-volume-up"></i> 音频表情</div>' : ''}
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

  // 创建表情包编辑弹窗（增强版）
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
          
          <!-- 音频表情包选项 -->
          <div class="emoji-form-group" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <label class="emoji-form-label" style="display: flex; align-items: center; margin-bottom: 10px; cursor: pointer;">
              <input type="checkbox" id="is-audio-pack" onchange="toggleAudioPackOption()" style="margin-right: 10px; width: 20px; height: 20px;">
              <span style="font-size: 18px; color: white; font-weight: bold;">
                <i class="fas fa-music" style="margin-right: 8px;"></i>
                启用音频表情包功能
              </span>
            </label>
            <small class="emoji-form-hint" style="color: #fff; opacity: 0.9; font-size: 13px;">
              <i class="fas fa-info-circle"></i> 
              勾选后可为每个表情添加对应的音效文件（支持 m4a、mp3、wav 格式）
            </small>
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
            <div class="emoji-upload-area disabled" id="cover-upload-area" onclick="handleCoverClick()">
              <div class="emoji-upload-icon"><i class="fas fa-image"></i></div>
              <div class="emoji-upload-text">请先创建文件夹</div>
              <div class="emoji-upload-hint">创建文件夹后才能上传</div>
            </div>
            <input type="file" id="emoji-pack-cover" accept="image/*" style="display: none;">
          </div>
          
          <div class="emoji-form-group">
            <label class="emoji-form-label">上传表情图片</label>
            <div class="emoji-upload-area disabled" id="images-upload-area" onclick="handleImagesClick()">
              <div class="emoji-upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
              <div class="emoji-upload-text">请先创建文件夹</div>
              <div class="emoji-upload-hint">创建文件夹后才能上传</div>
            </div>
            <input type="file" id="emoji-pack-images" accept="image/*" multiple style="display: none;">
          </div>
          
          <!-- 音频上传区域 -->
          <div class="emoji-form-group" id="audio-upload-section" style="display: none;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <label class="emoji-form-label" style="color: white; font-size: 16px; font-weight: bold;">
                <i class="fas fa-headphones"></i> 上传音频文件
              </label>
              <div class="audio-mapping-hint" style="background: rgba(255,255,255,0.95); border: none; color: #333; margin-top: 10px; padding: 12px;">
                <i class="fas fa-info-circle" style="color: #f5576c;"></i> 
                <div>
                  <strong>重要说明：</strong><br>
                  • 音频文件将按上传顺序与表情图片一一对应<br>
                  • 第1个音频对应第1个表情，第2个音频对应第2个表情，以此类推<br>
                  • 请确保音频数量与图片数量一致，或少于图片数量<br>
                  • 支持格式：.m4a .mp3 .wav
                </div>
              </div>
            </div>
            <div class="emoji-upload-area disabled" id="audio-upload-area" style="background: #fff5f5; border: 2px dashed #f5576c;" onclick="handleAudiosClick()">
              <div class="emoji-upload-icon" style="color: #f5576c;"><i class="fas fa-file-audio"></i></div>
              <div class="emoji-upload-text" style="color: #f5576c;">请先创建文件夹并上传图片</div>
              <div class="emoji-upload-hint" style="color: #f093fb;">支持批量上传音频文件</div>
            </div>
            <input type="file" id="emoji-pack-audios" accept="audio/*,.m4a,.mp3,.wav" multiple style="display: none;">
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

  // 切换音频表情包选项
  window.toggleAudioPackOption = function() {
    const checkbox = document.getElementById('is-audio-pack');
    if (!checkbox) return;
    
    window.isAudioPack = checkbox.checked;
    
    const audioUploadSection = document.getElementById('audio-upload-section');
    if (audioUploadSection) {
      if (window.isAudioPack) {
        audioUploadSection.style.display = 'block';
        audioUploadSection.style.opacity = '0';
        setTimeout(() => {
          audioUploadSection.style.opacity = '1';
          audioUploadSection.style.transition = 'opacity 0.3s';
        }, 10);
        
        if (window.folderCreated && window.uploadedFiles.length > 0) {
          enableAudioUploadArea();
        }
      } else {
        audioUploadSection.style.opacity = '0';
        setTimeout(() => {
          audioUploadSection.style.display = 'none';
        }, 300);
      }
    }
  };

  // 打开添加表情包弹窗
  window.openAddEmojiPackModal = function() {
    // 重置所有状态
    window.currentEmojiPack = null;
    window.uploadedFiles = [];
    window.uploadedAudios = [];
    window.folderCreated = false;
    window.currentFolderName = '';
    window.coverImageUrl = null;
    window.isAudioPack = false;
    
    let oldModal = document.getElementById('emoji-pack-modal');
    if (oldModal) {
      oldModal.remove();
    }
    
    let modal = createEmojiPackModal();
    document.body.appendChild(modal);
    
    setTimeout(() => {
      const packNameInput = document.getElementById('emoji-pack-name');
      const folderNameInput = document.getElementById('emoji-folder-name');
      const audioCheckbox = document.getElementById('is-audio-pack');
      
      if (packNameInput) packNameInput.value = '';
      if (folderNameInput) {
        folderNameInput.value = '';
        folderNameInput.disabled = false;
      }
      if (audioCheckbox) {
        audioCheckbox.checked = false;
      }
      
      const createBtn = document.getElementById('create-folder-btn');
      if (createBtn) {
        createBtn.disabled = false;
        createBtn.textContent = '创建文件夹';
      }
      
      modal.querySelector('.emoji-pack-modal-title').textContent = '添加表情包';
      modal.classList.add('show');
    }, 100);
  }

  // 处理点击事件
  window.handleCoverClick = function() {
    if (window.folderCreated) {
      document.getElementById('emoji-pack-cover').click();
    }
  }

  window.handleImagesClick = function() {
    if (window.folderCreated) {
      document.getElementById('emoji-pack-images').click();
    }
  }

  window.handleAudiosClick = function() {
    if (window.folderCreated && window.uploadedFiles.length > 0) {
      document.getElementById('emoji-pack-audios').click();
    }
  }

  // 创建文件夹
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
        body: JSON.stringify({ 
          folder_name: folderName,
          create_sounds_folder: window.isAudioPack
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        window.folderCreated = true;
        window.currentFolderName = folderName;
        
        folderNameInput.disabled = true;
        createBtn.disabled = true;
        createBtn.textContent = '已创建';
        
        const statusDiv = document.getElementById('folder-status');
        statusDiv.innerHTML = `✔ 文件夹 "${folderName}" 已创建${window.isAudioPack ? '（含音频文件夹）' : ''}`;
        statusDiv.style.display = 'block';
        statusDiv.style.color = '#28a745';
        
        enableUploadAreas();
        alert('文件夹创建成功，现在可以上传图片了');
        
        // 绑定文件输入事件
        document.getElementById('emoji-pack-cover').onchange = function() { 
          handleCoverUpload(this); 
        };
        document.getElementById('emoji-pack-images').onchange = function() { 
          handleImagesUpload(this); 
        };
        document.getElementById('emoji-pack-audios').onchange = function() { 
          handleAudiosUpload(this); 
        };
      } else {
        throw new Error(result.error || '创建文件夹失败');
      }
    } catch (error) {
      createBtn.disabled = false;
      createBtn.textContent = '创建文件夹';
      alert(error.message || '创建文件夹失败');
    }
  }

  // 启用上传区域
  function enableUploadAreas() {
    const coverArea = document.getElementById('cover-upload-area');
    const imagesArea = document.getElementById('images-upload-area');
    
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
    
    // 启用表情上传
    imagesArea.classList.remove('disabled');
    imagesArea.innerHTML = `
      <div class="emoji-upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
      <div class="emoji-upload-text">点击或拖拽上传表情图片</div>
      <div class="emoji-upload-hint" style="color: #28a745;">将上传到: ${window.currentFolderName}/</div>
    `;
    
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
        const imagesInput = document.getElementById('emoji-pack-images');
        imagesInput.files = files;
        handleImagesUpload(imagesInput);
      }
    };
    imagesArea.ondragleave = () => {
      imagesArea.classList.remove('dragover');
    };
  }

  // 启用音频上传区域
  function enableAudioUploadArea() {
    if (!window.isAudioPack) return;
    
    const audioArea = document.getElementById('audio-upload-area');
    
    if (!audioArea) return;
    
    audioArea.classList.remove('disabled');
    audioArea.innerHTML = `
      <div class="emoji-upload-icon"><i class="fas fa-music"></i></div>
      <div class="emoji-upload-text">点击上传音频文件</div>
      <div class="emoji-upload-hint" style="color: #28a745;">将上传到: ${window.currentFolderName}/sounds/</div>
      <div style="margin-top: 5px; font-size: 12px; color: #666;">已上传 ${window.uploadedFiles.length} 个表情，请上传对应数量的音频</div>
    `;
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
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('image', file);
      
      try {
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
          window.uploadedFiles.push({
            index: i,
            file_name: result.file_name || file.name,
            file_path: result.url,
            emoji_name: file.name.replace(/\.[^/.]+$/, ''),
            sort_order: window.uploadedFiles.length
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
    alert(`成功上传 ${window.uploadedFiles.length} 个表情`);
    
    if (window.isAudioPack) {
      enableAudioUploadArea();
    }
    
    setTimeout(() => {
      progressDiv.style.display = 'none';
      progressFill.style.width = '0%';
    }, 2000);
    
    input.value = '';
  }

  // 处理音频文件上传
async function handleAudiosUpload(input) {
  const files = Array.from(input.files);
  if (files.length === 0) return;
  
  if (!window.folderCreated || !window.currentFolderName) {
    alert('请先创建文件夹');
    input.value = '';
    return;
  }
  
  if (files.length !== window.uploadedFiles.length) {
    if (!confirm(`音频文件数量(${files.length})与图片数量(${window.uploadedFiles.length})不一致。是否继续？`)) {
      input.value = '';
      return;
    }
  }
  
  const token = localStorage.getItem('token');
  if (!token) return;
  
  const progressDiv = document.getElementById('emoji-upload-progress');
  const progressFill = document.getElementById('emoji-progress-fill');
  const progressText = document.getElementById('emoji-progress-text');
  progressDiv.style.display = 'block';
  
  let uploaded = 0;
  const total = files.length;
  
  window.uploadedAudios = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const formData = new FormData();
    formData.append('audio', file);
    
    try {
      const url = `${API_BASE_URL}/api/admin/emoji/upload-audio?folder_name=${encodeURIComponent(window.currentFolderName)}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        window.uploadedAudios.push({
          index: i,
          file_name: result.file_name || file.name,
          file_path: result.url
        });
        
        // 更新对应的表情数据 - 使用 sound_path 而不是 audio_path
        if (window.uploadedFiles[i]) {
          window.uploadedFiles[i].sound_path = result.url;  // 改为 sound_path
          // 为了兼容性，也保留 audio_path
          window.uploadedFiles[i].audio_path = result.url;
        }
      } else {
        alert(`上传音频 ${file.name} 失败: ${result.error}`);
      }
    } catch (error) {
      alert(`上传音频 ${file.name} 失败`);
    }
    
    uploaded++;
    const progress = Math.round((uploaded / total) * 100);
    progressFill.style.width = progress + '%';
    progressText.textContent = `上传音频中 ${progress}% (${uploaded}/${total})`;
  }
  
  renderUploadedEmojis();
  alert(`成功上传 ${window.uploadedAudios.length} 个音频文件`);
  
  setTimeout(() => {
    progressDiv.style.display = 'none';
    progressFill.style.width = '0%';
  }, 2000);
  
  input.value = '';
}

  // 播放表情音频预览
  window.playEmojiAudio = function(audioPath) {
    AudioManager.playAudio(`${API_BASE_URL}${audioPath}`);
  };

  // 渲染已上传的表情
	function renderUploadedEmojis() {
	  const grid = document.getElementById('emoji-preview-grid');
	  grid.innerHTML = '';
	  
	  window.uploadedFiles.forEach((file, index) => {
		const item = document.createElement('div');
		item.className = 'emoji-preview-item';
		// 检查 sound_path 或 audio_path
		const audioPath = file.sound_path || file.audio_path;
		if (audioPath) {
		  item.classList.add('has-audio');
		}
		
		item.innerHTML = `
		  <img src="${API_BASE_URL}${file.file_path}" class="emoji-preview-image">
		  ${audioPath ? '<i class="fas fa-volume-up audio-indicator"></i>' : ''}
		  <input type="text" class="emoji-name-input" placeholder="表情名称" 
				 value="${file.emoji_name}" 
				 onchange="updateEmojiName(${index}, this.value)">
		  <button class="emoji-preview-remove" onclick="removeUploadedEmoji(${index})">删除</button>
		  ${audioPath ? `
			<button class="emoji-preview-play" onclick="playEmojiAudio('${audioPath}')">
			  <i class="fas fa-play"></i> 试听
			</button>
		  ` : ''}
		`;
		grid.appendChild(item);
	  });
	}

  // 更新表情名称
  window.updateEmojiName = function(index, name) {
    if (window.uploadedFiles[index]) {
      window.uploadedFiles[index].emoji_name = name;
    }
  }

  // 删除已上传的表情
  window.removeUploadedEmoji = function(index) {
    window.uploadedFiles.splice(index, 1);
    if (window.uploadedAudios[index]) {
      window.uploadedAudios.splice(index, 1);
    }
    renderUploadedEmojis();
  }

  // 保存表情包
window.saveEmojiPack = async function() {
  const packName = document.getElementById('emoji-pack-name').value;
  const folderName = window.currentFolderName || document.getElementById('emoji-folder-name').value;
  const coverUrl = window.coverImageUrl;
  const isAudioPack = document.getElementById('is-audio-pack').checked;
  
  if (!packName || !folderName) {
    alert('请填写表情包名称和文件夹名称');
    return;
  }
  
  if (window.uploadedFiles.length === 0) {
    alert('请上传至少一个表情图片');
    return;
  }
  
  const token = localStorage.getItem('token');
  if (!token) return;
  
  // 确保所有表情数据都有正确的字段
  const processedEmojis = window.uploadedFiles.map(emoji => {
    // 统一使用 sound_path
    const soundPath = emoji.sound_path || emoji.audio_path || null;
    return {
      emoji_name: emoji.emoji_name || '',
      file_name: emoji.file_name || '',
      file_path: emoji.file_path || '',
      sound_path: soundPath,  // 使用 sound_path 作为主要字段
      sort_order: emoji.sort_order || 0
    };
  });
  
  const data = {
    pack_name: packName,
    folder_name: folderName,
    cover_image: coverUrl,
    is_audio_pack: isAudioPack,
    emojis: processedEmojis
  };
  
  try {
    const url = window.currentEmojiPack 
      ? `${API_BASE_URL}/api/admin/emoji/packs/${window.currentEmojiPack.id}`
      : `${API_BASE_URL}/api/admin/emoji/packs`;
    
    const response = await fetch(url, {
      method: window.currentEmojiPack ? 'PUT' : 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      closeEmojiPackModal();
      loadEmojiPacksList();
      alert(window.currentEmojiPack ? '表情包更新成功' : '表情包添加成功');
    } else {
      const error = await response.json();
      console.error('保存失败详情:', error);
      alert(error.error || '操作失败');
    }
  } catch (error) {
    console.error('保存表情包失败:', error);
    alert('保存失败: ' + error.message);
  }
}

  // 编辑表情包
  window.editEmojiPack = async function(packId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/emoji/packs/${packId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        window.currentEmojiPack = await response.json();
        openEditEmojiPackModal();
      }
    } catch (error) {
      console.error('获取表情包详情失败:', error);
    }
  }

  // 打开编辑表情包弹窗
  function openEditEmojiPackModal() {
    if (!window.currentEmojiPack) return;
    
    let modal = document.getElementById('emoji-pack-modal');
    if (!modal) {
      modal = createEmojiPackModal();
      document.body.appendChild(modal);
    }
    
    // 填充数据
    document.getElementById('emoji-pack-name').value = window.currentEmojiPack.pack_name;
    document.getElementById('emoji-folder-name').value = window.currentEmojiPack.folder_name;
    document.getElementById('emoji-folder-name').disabled = true;
    document.getElementById('is-audio-pack').checked = window.currentEmojiPack.is_audio_pack || false;
    
    // 设置文件夹状态
    window.folderCreated = true;
    window.currentFolderName = window.currentEmojiPack.folder_name;
    window.isAudioPack = window.currentEmojiPack.is_audio_pack || false;
    
    const createBtn = document.getElementById('create-folder-btn');
    if (createBtn) {
      createBtn.disabled = true;
      createBtn.textContent = '已存在';
    }
    
    const statusDiv = document.getElementById('folder-status');
    statusDiv.innerHTML = `文件夹 "${window.currentEmojiPack.folder_name}" 已存在`;
    statusDiv.style.display = 'block';
    statusDiv.style.color = '#28a745';
    
    // 显示音频上传区域（如果需要）
    if (window.isAudioPack) {
      const audioSection = document.getElementById('audio-upload-section');
      if (audioSection) {
        audioSection.style.display = 'block';
      }
      enableAudioUploadArea();
    }
    
    // 启用上传区域
    enableUploadAreas();
    
    if (window.currentEmojiPack.cover_image) {
      window.coverImageUrl = window.currentEmojiPack.cover_image;
      const coverArea = document.getElementById('cover-upload-area');
      coverArea.innerHTML = `
        <img src="${API_BASE_URL}${window.currentEmojiPack.cover_image}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
        <div style="margin-top: 5px; color: #28a745; font-size: 12px;">当前封面</div>
      `;
    }
    
    // 绑定文件输入事件
    document.getElementById('emoji-pack-cover').onchange = function() { 
      handleCoverUpload(this); 
    };
    document.getElementById('emoji-pack-images').onchange = function() { 
      handleImagesUpload(this); 
    };
    document.getElementById('emoji-pack-audios').onchange = function() { 
      handleAudiosUpload(this); 
    };
    
    window.uploadedFiles = window.currentEmojiPack.emojis || [];
    renderUploadedEmojis();
    
    modal.querySelector('.emoji-pack-modal-title').textContent = '编辑表情包';
    modal.classList.add('show');
  }

  // 删除表情包
  window.deleteEmojiPack = async function(packId) {
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
        alert('表情包已删除');
      }
    } catch (error) {
      console.error('删除表情包失败:', error);
      alert('删除失败');
    }
  }

  // 关闭表情包弹窗
  window.closeEmojiPackModal = function() {
    const modal = document.getElementById('emoji-pack-modal');
    if (modal) {
      modal.classList.remove('show');
    }
    window.currentEmojiPack = null;
    window.uploadedFiles = [];
    window.uploadedAudios = [];
    window.folderCreated = false;
    window.currentFolderName = '';
    window.coverImageUrl = null;
    window.isAudioPack = false;
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

  // 工具函数
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 解析表情消息（用于聊天窗口）
  global.parseEmojiMessage = function(content) {
    if (typeof content === 'string' && content.startsWith('[emoji:') && content.endsWith(']')) {
      const jsonStr = content.slice(7, -1);
      try {
        return JSON.parse(jsonStr);
      } catch (e) {
        // 兼容旧格式
        const parts = content.slice(7, -1).split(':');
        return {
          id: parts[0],
          path: parts[1],
          audio: parts[2] || null
        };
      }
    }
    return null;
  };

  // 点击已发送的表情播放音频
  global.handleEmojiClick = function(emojiData) {
    if (emojiData && emojiData.audio) {
      AudioManager.playAudio(`${API_BASE_URL}${emojiData.audio}`);
    }
  };

  // 暴露给全局
  global.initEmojiSystem = initEmojiSystem;
  global.sendEmoji = sendEmoji;
  global.loadEmojiPackContent = loadEmojiPackContent;

  // 监听消息中的表情点击事件
  document.addEventListener('click', function(e) {
    const emojiMsg = e.target.closest('.emoji-message-img');
    if (emojiMsg) {
      const audioPath = emojiMsg.dataset.audioPath;
      if (audioPath) {
        AudioManager.playAudio(audioPath);
      }
    }
  });

  // 在DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiSystem);
  } else {
    setTimeout(initEmojiSystem, 100);
  }

})(window);