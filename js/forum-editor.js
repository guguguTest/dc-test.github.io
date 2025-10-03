// forum-editor.js - 富文本编辑器模块(含表情支持)

class ForumEditor {
  constructor(container) {
    this.container = container;
    this.toolbar = container.querySelector('.editor-toolbar');
    this.content = container.querySelector('.editor-content');
    this.emojiPicker = null;
    this.init();
  }

  init() {
    this.setupToolbar();
    this.setupContent();
  }

  setupToolbar() {
    const buttons = [
      { icon: 'bold', command: 'bold', title: '粗体' },
      { icon: 'italic', command: 'italic', title: '斜体' },
      { icon: 'underline', command: 'underline', title: '下划线' },
      { icon: 'strikethrough', command: 'strikethrough', title: '删除线' },
      { icon: 'heading', command: 'formatBlock', value: 'h3', title: '标题' },
      { icon: 'list-ul', command: 'insertUnorderedList', title: '无序列表' },
      { icon: 'list-ol', command: 'insertOrderedList', title: '有序列表' },
      { icon: 'quote-left', command: 'formatBlock', value: 'blockquote', title: '引用' },
      { icon: 'link', command: 'createLink', title: '插入链接' },
      { icon: 'image', command: 'insertImage', title: '插入图片' },
      { icon: 'smile', command: 'emoji', title: '插入表情', regular: true },
      { icon: 'at', command: 'mention', title: '@用户' },
      { icon: 'code', command: 'formatBlock', value: 'pre', title: '代码块' }
    ];

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = 'editor-btn';
      button.type = 'button';
      button.title = btn.title;
      button.innerHTML = `<i class="${btn.regular ? 'far' : 'fas'} fa-${btn.icon}"></i>`;
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        if (btn.command === 'emoji') {
          this.toggleEmojiPicker(button);
        } else {
          this.executeCommand(btn.command, btn.value);
        }
      });
      
      this.toolbar.appendChild(button);
    });
  }

  setupContent() {
    this.content.contentEditable = true;
    
    this.content.addEventListener('input', () => {
      this.updateToolbarState();
    });

    this.content.addEventListener('mouseup', () => {
      this.updateToolbarState();
    });

    this.content.addEventListener('keyup', () => {
      this.updateToolbarState();
    });

    this.content.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    });
  }

  executeCommand(command, value = null) {
    if (command === 'mention') {
      this.insertMention();
      return;
    }

    if (command === 'createLink') {
      const url = prompt('请输入链接地址:');
      if (url) {
        document.execCommand(command, false, url);
      }
      return;
    }

    if (command === 'insertImage') {
      const url = prompt('请输入图片地址:');
      if (url) {
        document.execCommand(command, false, url);
      }
      return;
    }

    document.execCommand(command, false, value);
    this.content.focus();
  }

  insertMention() {
    const username = prompt('请输入要@的用户名或昵称:');
    if (username) {
      const mention = `@${username} `;
      document.execCommand('insertHTML', false, `<span class="mention" contenteditable="false">${mention}</span>&nbsp;`);
    }
  }

  updateToolbarState() {
    const buttons = this.toolbar.querySelectorAll('.editor-btn');
    buttons.forEach(btn => {
      const icon = btn.querySelector('i').className;
      let command = '';
      
      if (icon.includes('fa-bold')) command = 'bold';
      else if (icon.includes('fa-italic')) command = 'italic';
      else if (icon.includes('fa-underline')) command = 'underline';
      else if (icon.includes('fa-strikethrough')) command = 'strikethrough';
      
      if (command && document.queryCommandState(command)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  getContent() {
    console.log('=== getContent Start ===');
    
    // 创建临时容器
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = this.content.innerHTML;
    
    console.log('Original HTML:', tempContainer.innerHTML);
    
    // 找到所有表情图片并替换为唯一占位符
    const emojiImages = tempContainer.querySelectorAll('img.editor-emoji-preview');
    const emojiPlaceholders = [];
    
    emojiImages.forEach((img, index) => {
      const emojiId = img.dataset.emojiId;
      const emojiPath = img.dataset.emojiPath;
      const audioPath = img.dataset.audioPath;
      
      // 构建表情标记
      let emojiMarkup;
      if (audioPath) {
        emojiMarkup = `[emoji:${emojiId}:${emojiPath}:${audioPath}]`;
      } else {
        emojiMarkup = `[emoji:${emojiId}:${emojiPath}]`;
      }
      
      console.log(`Emoji ${index}:`, emojiMarkup);
      
      // 使用不会被HTML编码的占位符
      const placeholder = `__EMOJI_PLACEHOLDER_${index}__`;
      emojiPlaceholders.push({ placeholder, markup: emojiMarkup });
      
      // 创建文本节点替换图片
      const textNode = document.createTextNode(placeholder);
      img.parentNode.replaceChild(textNode, img);
    });
    
    // 获取HTML内容
    let content = tempContainer.innerHTML;
    console.log('After placeholder:', content);
    
    // 将占位符精确替换回表情标记
    emojiPlaceholders.forEach(({ placeholder, markup }) => {
      // 使用全局替换，包括可能被HTML编码的版本
      const regex = new RegExp(placeholder, 'g');
      content = content.replace(regex, markup);
    });
    
    console.log('After emoji restoration:', content);
    
    // 清理HTML实体
    content = content.replace(/&nbsp;/g, ' ');
    
    // 移除表情标记后面紧跟的单个空格
    content = content.replace(/(\[emoji:[^\]]+\])\s(?=\S)/g, '$1');
    
    // 清理首尾空白
    content = content.trim();
    
    console.log('Final content:', content);
    console.log('=== getContent End ===');
    
    return content;
  }

  setContent(html) {
    console.log('=== setContent ===');
    console.log('Input HTML:', html);
    
    // 先解析表情标记为图片(用于编辑模式)
    let processedHtml = html;
    
    // 匹配表情标记并替换为图片
    const emojiRegex = /\[emoji:(\d+):((?:https?:)?\/[^\]]+?)(?::([^\]]+?))?\]/g;
    processedHtml = processedHtml.replace(emojiRegex, (match, id, path, audioPath) => {
      const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
      const fullPath = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
      
      let audioAttr = audioPath ? `data-audio-path="${audioPath.trim()}"` : '';
      
      return `<img src="${fullPath}" 
                   class="editor-emoji-preview" 
                   data-emoji-id="${id}" 
                   data-emoji-path="${path.trim()}" 
                   ${audioAttr}
                   style="max-width: 80px; max-height: 80px; vertical-align: middle; margin: 0 4px; border-radius: 6px; cursor: pointer;" 
                   alt="表情">`;
    });
    
    this.content.innerHTML = processedHtml;
    console.log('Content set');
  }

  clear() {
    this.content.innerHTML = '';
  }

  isEmpty() {
    const hasText = this.content.textContent.trim().length > 0;
    const hasEmoji = this.content.querySelector('img.editor-emoji-preview') !== null;
    return !hasText && !hasEmoji;
  }

  // ============ 表情选择器功能 ============
  
  toggleEmojiPicker(btn) {
    if (this.emojiPicker) {
      const isVisible = this.emojiPicker.style.display === 'flex';
      this.emojiPicker.style.display = isVisible ? 'none' : 'flex';
      btn.classList.toggle('active', !isVisible);
      
      if (!isVisible && window.emojiPacks && window.emojiPacks.length > 0) {
        this.loadEmojiPackContent(window.emojiPacks[0].id);
      }
      return;
    }
    
    this.emojiPicker = this.createEmojiPicker();
    this.container.style.position = 'relative';
    this.container.appendChild(this.emojiPicker);
    btn.classList.add('active');
    
    this.loadEmojiPacks();
  }

  createEmojiPicker() {
    const picker = document.createElement('div');
    picker.className = 'forum-emoji-picker';
    picker.style.cssText = `
      display: flex;
      flex-direction: column;
      position: absolute;
      bottom: 50px;
      left: 0;
      right: 0;
      height: 320px;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 1000;
      overflow: hidden;
    `;
    
    picker.innerHTML = `
      <div class="emoji-grid-container" style="flex: 1; overflow-y: auto; padding: 12px;">
        <div class="emoji-loading" style="display: flex; justify-content: center; align-items: center; height: 100%;">
          <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
        </div>
      </div>
      <div class="emoji-tabs" style="display: flex; gap: 8px; padding: 12px; border-top: 1px solid #e5e7eb; background: #f9fafb; overflow-x: auto;">
        <button class="emoji-tab recent-tab" data-tab="recent" title="最近使用" style="flex-shrink: 0;">
          <i class="far fa-clock"></i>
        </button>
      </div>
    `;
    
    picker.addEventListener('click', (e) => {
      const tab = e.target.closest('.emoji-tab');
      if (tab) {
        e.stopPropagation();
        const packId = tab.dataset.packId || tab.dataset.tab;
        this.selectEmojiTab(tab, packId);
      }
    });
    
    picker.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    return picker;
  }

  async loadEmojiPacks() {
    try {
      const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
      
      if (window.emojiPacks) {
        this.updateEmojiTabs(window.emojiPacks);
        if (window.emojiPacks.length > 0) {
          this.loadEmojiPackContent(window.emojiPacks[0].id);
        }
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/emoji/packs`);
      if (response.ok) {
        window.emojiPacks = await response.json();
        this.updateEmojiTabs(window.emojiPacks);
        
        if (window.emojiPacks.length > 0) {
          this.loadEmojiPackContent(window.emojiPacks[0].id);
        }
      }
    } catch (error) {
      console.error('加载表情包失败:', error);
      const gridContainer = this.emojiPicker.querySelector('.emoji-grid-container');
      if (gridContainer) {
        gridContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">加载失败</div>';
      }
    }
  }

  updateEmojiTabs(packs) {
    const tabsContainer = this.emojiPicker.querySelector('.emoji-tabs');
    if (!tabsContainer) return;
    
    const recentTab = tabsContainer.querySelector('.recent-tab');
    tabsContainer.innerHTML = '';
    if (recentTab) {
      tabsContainer.appendChild(recentTab);
    }
    
    packs.forEach(pack => {
      const tab = document.createElement('button');
      tab.className = 'emoji-tab';
      tab.dataset.packId = pack.id;
      tab.title = pack.pack_name;
      tab.style.cssText = 'flex-shrink: 0; width: 36px; height: 36px; border: none; background: white; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;';
      
      if (pack.is_audio_pack) {
        tab.classList.add('audio-pack');
      }
      
      const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
      if (pack.cover_image) {
        tab.innerHTML = `
          <img src="${API_BASE_URL}${pack.cover_image}" alt="${pack.pack_name}" style="width: 28px; height: 28px; object-fit: contain;">
          ${pack.is_audio_pack ? '<i class="fas fa-volume-up" style="position: absolute; bottom: 2px; right: 2px; font-size: 10px; color: #667eea;"></i>' : ''}
        `;
      } else {
        tab.innerHTML = '<i class="far fa-smile"></i>';
      }
      
      tabsContainer.appendChild(tab);
    });
  }

  selectEmojiTab(tab, packId) {
    const allTabs = this.emojiPicker.querySelectorAll('.emoji-tab');
    allTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    if (packId === 'recent') {
      this.loadRecentEmojis();
    } else {
      this.loadEmojiPackContent(packId);
    }
  }

  async loadEmojiPackContent(packId) {
    const gridContainer = this.emojiPicker.querySelector('.emoji-grid-container');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '<div class="emoji-loading" style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i></div>';
    
    try {
      const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
      const response = await fetch(`${API_BASE_URL}/api/emoji/pack/${packId}/items`);
      
      if (response.ok) {
        const emojis = await response.json();
        this.renderEmojiGrid(emojis);
        
        const allTabs = this.emojiPicker.querySelectorAll('.emoji-tab');
        allTabs.forEach(t => {
          t.classList.remove('active');
          if (t.dataset.packId == packId) {
            t.classList.add('active');
          }
        });
      }
    } catch (error) {
      console.error('加载表情失败:', error);
      gridContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">加载失败</div>';
    }
  }

  renderEmojiGrid(emojis) {
    const gridContainer = this.emojiPicker.querySelector('.emoji-grid-container');
    if (!gridContainer) return;
    
    if (emojis.length === 0) {
      gridContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无表情</div>';
      return;
    }
    
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;';
    
    const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
    
    emojis.forEach(emoji => {
      const item = document.createElement('div');
      item.className = 'emoji-item';
      item.style.cssText = `
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.2s;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      const audioPath = emoji.sound_path || emoji.audio_path;
      
      const img = document.createElement('img');
      img.src = `${API_BASE_URL}${emoji.file_path}`;
      img.alt = emoji.emoji_name || emoji.file_name;
      img.style.cssText = 'width: 36px; height: 36px; object-fit: contain;';
      
      item.appendChild(img);
      
      if (audioPath) {
        const audioIcon = document.createElement('i');
        audioIcon.className = 'fas fa-volume-up';
        audioIcon.style.cssText = 'position: absolute; bottom: 4px; right: 4px; font-size: 10px; color: #667eea;';
        item.appendChild(audioIcon);
      }
      
      item.addEventListener('mouseenter', () => {
        item.style.background = '#f0f2f5';
        item.style.transform = 'scale(1.1)';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
        item.style.transform = 'scale(1)';
      });
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.insertEmoji(emoji);
      });
      
      grid.appendChild(item);
    });
    
    gridContainer.innerHTML = '';
    gridContainer.appendChild(grid);
  }

  async loadRecentEmojis() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const gridContainer = this.emojiPicker.querySelector('.emoji-grid-container');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '<div class="emoji-loading" style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i></div>';
    
    try {
      const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
      const response = await fetch(`${API_BASE_URL}/api/emoji/recent`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const emojis = await response.json();
        this.renderEmojiGrid(emojis);
      }
    } catch (error) {
      console.error('加载最近使用表情失败:', error);
      gridContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无最近使用</div>';
    }
  }

  insertEmoji(emoji) {
    const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
    const audioPath = emoji.sound_path || emoji.audio_path;
    
    if (audioPath) {
      if (window.EmojiAudioManager) {
        window.EmojiAudioManager.playAudio(`${API_BASE_URL}${audioPath}`);
      } else if (window.playEmojiAudio) {
        window.playEmojiAudio(`${API_BASE_URL}${audioPath}`);
      }
    }
    
    const img = document.createElement('img');
    img.src = `${API_BASE_URL}${emoji.file_path}`;
    img.alt = emoji.emoji_name || 'emoji';
    img.className = 'editor-emoji-preview';
    img.style.cssText = 'max-width: 80px; max-height: 80px; vertical-align: middle; margin: 0 4px; border-radius: 6px; cursor: pointer;';
    
    img.dataset.emojiId = emoji.id.toString();
    img.dataset.emojiPath = emoji.file_path.trim();
    if (audioPath) {
      img.dataset.audioPath = audioPath.trim();
    }
    
    this.content.focus();
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      range.insertNode(img);
      
      // 使用普通空格
      const spaceNode = document.createTextNode(' ');
      range.setStartAfter(img);
      range.collapse(true);
      range.insertNode(spaceNode);
      
      range.setStartAfter(spaceNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      this.content.appendChild(img);
      this.content.appendChild(document.createTextNode(' '));
      
      const range = document.createRange();
      range.selectNodeContents(this.content);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    this.recordEmojiUsage(emoji.id);
    
    if (this.emojiPicker) {
      this.emojiPicker.style.display = 'none';
    }
    
    const emojiBtn = this.toolbar.querySelector('[title="插入表情"]');
    if (emojiBtn) {
      emojiBtn.classList.remove('active');
    }
    
    this.content.dispatchEvent(new Event('input', { bubbles: true }));
  }

  async recordEmojiUsage(emojiId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
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
}

window.ForumEditor = ForumEditor;