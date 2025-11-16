// forum-editor.js - 完整版富文本编辑器(包含所有功能)

class ForumEditor {
  constructor(container) {
    this.container = container;
    this.toolbar = container.querySelector('.editor-toolbar');
    this.content = container.querySelector('.editor-content');
    this.emojiPicker = null;
    this.imageUploader = null;
    this.uploadedImages = [];
    this.savedSelection = null;
    this.init();
  }

  init() {
    this.setupToolbar();
    this.setupContent();
    this.setupImageClickHandler();
  }

  setupToolbar() {
    // 清空工具栏，防止重复初始化时按钮累加
    this.toolbar.innerHTML = '';
    
    this.createFontSizeSelector();
    this.createHeadingSelector();
    
    const buttons = [
      { icon: 'bold', command: 'bold', title: '粗体' },
      { icon: 'italic', command: 'italic', title: '斜体' },
      { icon: 'underline', command: 'underline', title: '下划线' },
      { icon: 'strikethrough', command: 'strikethrough', title: '删除线' }
    ];

    buttons.forEach(btn => {
      const button = this.createButton(btn);
      this.toolbar.appendChild(button);
    });
    
    this.createColorPicker('foreColor', '文字颜色', 'palette');
    this.createColorPicker('backColor', '背景颜色', 'fill-drip');
    
    const alignButtons = [
      { icon: 'align-left', command: 'justifyLeft', title: '左对齐' },
      { icon: 'align-center', command: 'justifyCenter', title: '居中对齐' },
      { icon: 'align-right', command: 'justifyRight', title: '右对齐' }
    ];
    
    alignButtons.forEach(btn => {
      const button = this.createButton(btn);
      this.toolbar.appendChild(button);
    });
    
    const listButtons = [
      { icon: 'list-ul', command: 'insertUnorderedList', title: '无序列表' },
      { icon: 'list-ol', command: 'insertOrderedList', title: '有序列表' }
    ];
    
    listButtons.forEach(btn => {
      const button = this.createButton(btn);
      this.toolbar.appendChild(button);
    });
    
    const mediaButtons = [
      { icon: 'link', command: 'createLink', title: '插入链接' },
      { icon: 'image', command: 'uploadImage', title: '上传图片' },
      { icon: 'smile', command: 'emoji', title: '插入表情', regular: true },
      { icon: 'at', command: 'mention', title: '@用户' }
    ];
    
    mediaButtons.forEach(btn => {
      const button = this.createButton(btn);
      this.toolbar.appendChild(button);
    });
    
    const clearButton = this.createButton({ icon: 'eraser', command: 'removeFormat', title: '清除格式' });
    this.toolbar.appendChild(clearButton);
  }
  
  createButton(btn) {
    const button = document.createElement('button');
    button.className = 'editor-btn';
    button.type = 'button';
    button.title = btn.title;
    button.innerHTML = `<i class="${btn.regular ? 'far' : 'fas'} fa-${btn.icon}"></i>`;
    
    button.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      if (btn.command === 'emoji') {
        this.toggleEmojiPicker(button);
      } else if (btn.command === 'uploadImage') {
        this.toggleImageUploader(button);
      } else {
        this.executeCommand(btn.command, btn.value);
      }
    });
    
    return button;
  }
  
  createFontSizeSelector() {
    const container = document.createElement('div');
    container.className = 'editor-dropdown';
    container.style.position = 'relative';
    
    const button = document.createElement('button');
    button.className = 'editor-btn editor-dropdown-btn';
    button.type = 'button';
    button.title = '字号';
    button.innerHTML = '<i class="fas fa-text-height"></i> <i class="fas fa-caret-down" style="font-size: 10px; margin-left: 2px;"></i>';
    
    const dropdown = document.createElement('div');
    dropdown.className = 'editor-dropdown-menu';
    dropdown.style.display = 'none';
    
    const sizes = [
      { label: '小号 (12px)', value: '12px' },
      { label: '正常 (14px)', value: '14px' },
      { label: '中号 (16px)', value: '16px' },
      { label: '大号 (18px)', value: '18px' },
      { label: '特大 (22px)', value: '22px' },
      { label: '超大 (28px)', value: '28px' }
    ];
    
    sizes.forEach(size => {
      const item = document.createElement('div');
      item.className = 'editor-dropdown-item';
      item.textContent = size.label;
      item.style.fontSize = size.value;
      
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.applyFontSize(size.value);
        dropdown.style.display = 'none';
        button.classList.remove('active');
      });
      dropdown.appendChild(item);
    });
    
    button.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isVisible = dropdown.style.display === 'block';
      document.querySelectorAll('.editor-dropdown-menu').forEach(m => m.style.display = 'none');
      document.querySelectorAll('.editor-dropdown-btn').forEach(b => b.classList.remove('active'));
      
      dropdown.style.display = isVisible ? 'none' : 'block';
      button.classList.toggle('active', !isVisible);
    });
    
    container.appendChild(button);
    container.appendChild(dropdown);
    this.toolbar.appendChild(container);
    
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdown.style.display = 'none';
        button.classList.remove('active');
      }
    });
  }
  
  createHeadingSelector() {
    const container = document.createElement('div');
    container.className = 'editor-dropdown';
    container.style.position = 'relative';
    
    const button = document.createElement('button');
    button.className = 'editor-btn editor-dropdown-btn';
    button.type = 'button';
    button.title = '标题';
    button.innerHTML = '<i class="fas fa-heading"></i> <i class="fas fa-caret-down" style="font-size: 10px; margin-left: 2px;"></i>';
    
    const dropdown = document.createElement('div');
    dropdown.className = 'editor-dropdown-menu';
    dropdown.style.display = 'none';
    
    const headings = [
      { label: '正文', tag: 'p' },
      { label: '标题 1', tag: 'h1' },
      { label: '标题 2', tag: 'h2' },
      { label: '标题 3', tag: 'h3' },
      { label: '标题 4', tag: 'h4' },
      { label: '标题 5', tag: 'h5' },
      { label: '标题 6', tag: 'h6' }
    ];
    
    headings.forEach(heading => {
      const item = document.createElement('div');
      item.className = 'editor-dropdown-item';
      item.textContent = heading.label;
      item.style.fontWeight = heading.tag !== 'p' ? 'bold' : 'normal';
      item.style.fontSize = heading.tag === 'h1' ? '20px' : 
                            heading.tag === 'h2' ? '18px' :
                            heading.tag === 'h3' ? '16px' : '14px';
      
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.applyHeading(heading.tag);
        dropdown.style.display = 'none';
        button.classList.remove('active');
      });
      dropdown.appendChild(item);
    });
    
    button.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isVisible = dropdown.style.display === 'block';
      document.querySelectorAll('.editor-dropdown-menu').forEach(m => m.style.display = 'none');
      document.querySelectorAll('.editor-dropdown-btn').forEach(b => b.classList.remove('active'));
      
      dropdown.style.display = isVisible ? 'none' : 'block';
      button.classList.toggle('active', !isVisible);
    });
    
    container.appendChild(button);
    container.appendChild(dropdown);
    this.toolbar.appendChild(container);
    
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdown.style.display = 'none';
        button.classList.remove('active');
      }
    });
  }
  
  createColorPicker(command, title, icon) {
    const container = document.createElement('div');
    container.className = 'editor-dropdown';
    container.style.position = 'relative';
    
    const button = document.createElement('button');
    button.className = 'editor-btn editor-color-btn';
    button.type = 'button';
    button.title = title;
    button.innerHTML = `<i class="fas fa-${icon}"></i>`;
    
    const colorIndicator = document.createElement('div');
    colorIndicator.className = 'editor-color-indicator';
    colorIndicator.style.cssText = 'width: 20px; height: 3px; background: #000; margin-top: 2px; border-radius: 2px;';
    button.appendChild(colorIndicator);
    
    const dropdown = document.createElement('div');
    dropdown.className = 'editor-dropdown-menu editor-color-picker';
    dropdown.style.display = 'none';
    dropdown.style.width = '220px';
    dropdown.style.padding = '12px';
    
    const colors = [
      '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc',
      '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff',
      '#4a86e8', '#0000ff', '#9900ff', '#ff00ff', '#e06666', '#f6b26b',
      '#ffd966', '#93c47d', '#76a5af', '#6d9eeb'
    ];
    
    const colorGrid = document.createElement('div');
    colorGrid.style.cssText = 'display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 8px;';
    
    colors.forEach(color => {
      const colorBox = document.createElement('div');
      colorBox.style.cssText = `
        width: 28px;
        height: 28px;
        background: ${color};
        border: 1px solid #ddd;
        border-radius: 3px;
        cursor: pointer;
        transition: transform 0.2s;
      `;
      
      colorBox.addEventListener('mouseenter', () => {
        colorBox.style.transform = 'scale(1.2)';
      });
      
      colorBox.addEventListener('mouseleave', () => {
        colorBox.style.transform = 'scale(1)';
      });
      
      colorBox.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });
      
      colorBox.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (command === 'foreColor') {
          this.applyTextColor(color);
        } else {
          this.applyBackgroundColor(color);
        }
        
        colorIndicator.style.background = color;
        dropdown.style.display = 'none';
        button.classList.remove('active');
      });
      
      colorGrid.appendChild(colorBox);
    });
    
    dropdown.appendChild(colorGrid);
    
    const customColorContainer = document.createElement('div');
    customColorContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;';
    
    const customColorInput = document.createElement('input');
    customColorInput.type = 'color';
    customColorInput.style.cssText = 'width: 40px; height: 30px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;';
    
    const customColorLabel = document.createElement('span');
    customColorLabel.textContent = '自定义颜色';
    customColorLabel.style.cssText = 'font-size: 12px; color: #666;';
    
    customColorInput.addEventListener('change', (e) => {
      const color = e.target.value;
      if (command === 'foreColor') {
        this.applyTextColor(color);
      } else {
        this.applyBackgroundColor(color);
      }
      colorIndicator.style.background = color;
      dropdown.style.display = 'none';
      button.classList.remove('active');
    });
    
    customColorContainer.appendChild(customColorInput);
    customColorContainer.appendChild(customColorLabel);
    dropdown.appendChild(customColorContainer);
    
    button.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isVisible = dropdown.style.display === 'block';
      document.querySelectorAll('.editor-dropdown-menu').forEach(m => m.style.display = 'none');
      document.querySelectorAll('.editor-dropdown-btn, .editor-color-btn').forEach(b => b.classList.remove('active'));
      
      dropdown.style.display = isVisible ? 'none' : 'block';
      button.classList.toggle('active', !isVisible);
    });
    
    container.appendChild(button);
    container.appendChild(dropdown);
    this.toolbar.appendChild(container);
    
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdown.style.display = 'none';
        button.classList.remove('active');
      }
    });
  }

  // ========== DOM 操作方法 ==========
  
  applyFontSize(size) {
    this.content.focus();
    
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    if (!range.collapsed) {
      const span = document.createElement('span');
      span.style.fontSize = size;
      
      try {
        range.surroundContents(span);
      } catch (e) {
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }
      
      range.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      document.execCommand('fontSize', false, '7');
      const fontElements = this.content.querySelectorAll('font[size="7"]');
      fontElements.forEach(font => {
        const span = document.createElement('span');
        span.style.fontSize = size;
        span.innerHTML = font.innerHTML;
        font.parentNode.replaceChild(span, font);
      });
    }
    
    this.content.focus();
  }
  
  applyHeading(tag) {
    this.content.focus();
    
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    let block = range.commonAncestorContainer;
    while (block && block.nodeType !== 1) {
      block = block.parentNode;
    }
    
    while (block && block !== this.content && !this.isBlockElement(block)) {
      block = block.parentNode;
    }
    
    if (block && block !== this.content) {
      const newElement = document.createElement(tag);
      newElement.innerHTML = block.innerHTML;
      block.parentNode.replaceChild(newElement, block);
      
      range.selectNodeContents(newElement);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      document.execCommand('formatBlock', false, '<' + tag + '>');
    }
    
    this.content.focus();
  }
  
  applyTextColor(color) {
    this.content.focus();
    
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    if (!range.collapsed) {
      const span = document.createElement('span');
      span.style.color = color;
      
      try {
        range.surroundContents(span);
      } catch (e) {
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }
      
      range.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      document.execCommand('foreColor', false, color);
    }
    
    this.content.focus();
  }
  
  applyBackgroundColor(color) {
    this.content.focus();
    
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    if (!range.collapsed) {
      const span = document.createElement('span');
      span.style.backgroundColor = color;
      
      try {
        range.surroundContents(span);
      } catch (e) {
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }
      
      range.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      document.execCommand('backColor', false, color);
    }
    
    this.content.focus();
  }
  
  isBlockElement(element) {
    const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'LI'];
    return blockTags.includes(element.tagName);
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

  setupImageClickHandler() {
    this.content.addEventListener('click', (e) => {
      if (e.target.classList.contains('editor-uploaded-image')) {
        e.preventDefault();
        this.showImagePreview(e.target.src, e.target.dataset.originalSrc);
      }
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

    this.content.focus();
    
    try {
      document.execCommand(command, false, value);
    } catch (error) {
      console.error(`执行命令 ${command} 时出错:`, error);
    }
    
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

  // ============ 图片上传功能 ============
  
  toggleImageUploader(btn) {
    if (this.imageUploader) {
      const isVisible = this.imageUploader.style.display === 'flex';
      this.imageUploader.style.display = isVisible ? 'none' : 'flex';
      btn.classList.toggle('active', !isVisible);
      
      if (!isVisible) {
        const editorRect = this.container.getBoundingClientRect();
        this.imageUploader.style.bottom = `${window.innerHeight - editorRect.top + 10}px`;
        this.imageUploader.style.left = `${editorRect.left}px`;
        this.imageUploader.style.width = `${editorRect.width}px`;
      }
      return;
    }
    
    this.imageUploader = this.createImageUploader();
    document.body.appendChild(this.imageUploader);
    btn.classList.add('active');
    
    const closeOnClickOutside = (e) => {
      if (this.imageUploader && 
          !this.imageUploader.contains(e.target) && 
          !btn.contains(e.target)) {
        this.imageUploader.style.display = 'none';
        btn.classList.remove('active');
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeOnClickOutside);
    }, 100);
    
    this.imageUploader._closeHandler = closeOnClickOutside;
  }

  createImageUploader() {
    const uploader = document.createElement('div');
    uploader.className = 'forum-image-uploader';
    
    const editorRect = this.container.getBoundingClientRect();
    
    uploader.style.cssText = `
      display: flex;
      flex-direction: column;
      position: fixed;
      bottom: ${window.innerHeight - editorRect.top + 10}px;
      left: ${editorRect.left}px;
      width: ${editorRect.width}px;
      max-width: 500px;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      z-index: 10001;
      overflow: hidden;
      max-height: 450px;
    `;
    
    uploader.innerHTML = `
      <div class="uploader-header" style="padding: 12px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 600; color: #374151;"><i class="fas fa-image"></i> 上传图片</span>
        <button class="uploader-close" style="background: none; border: none; color: #6b7280; cursor: pointer; font-size: 18px;">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="uploader-body" style="padding: 16px; flex: 1; overflow-y: auto;">
        <div class="upload-area" style="border: 2px dashed #d1d5db; border-radius: 8px; padding: 32px; text-align: center; cursor: pointer; transition: all 0.3s;">
          <input type="file" id="image-file-input" accept="image/*" style="display: none;">
          <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #9ca3af; margin-bottom: 12px;"></i>
          <p style="color: #6b7280; margin: 0 0 8px 0;">点击或拖拽上传图片</p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">最大300KB,支持JPG/PNG/GIF等格式</p>
        </div>
        
        <div class="upload-progress" style="display: none; margin-top: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span class="progress-filename" style="color: #374151; font-size: 14px;"></span>
            <span class="progress-percent" style="color: #667eea; font-weight: 600;">0%</span>
          </div>
          <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
            <div class="progress-bar" style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: 0%; transition: width 0.3s;"></div>
          </div>
        </div>
        
        <div class="uploaded-images-list" style="margin-top: 16px; display: none;">
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">已上传的图片:</div>
          <div class="images-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px;"></div>
        </div>
      </div>
    `;
    
    const closeBtn = uploader.querySelector('.uploader-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      uploader.style.display = 'none';
      const imgBtn = this.toolbar.querySelector('[title="上传图片"]');
      if (imgBtn) imgBtn.classList.remove('active');
    });
    
    const uploadArea = uploader.querySelector('.upload-area');
    const fileInput = uploader.querySelector('#image-file-input');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#667eea';
      uploadArea.style.background = '#f0f4ff';
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '#d1d5db';
      uploadArea.style.background = 'transparent';
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#d1d5db';
      uploadArea.style.background = 'transparent';
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleImageUpload(files[0], uploader);
      }
    });
    
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleImageUpload(e.target.files[0], uploader);
      }
    });
    
    const updateUploaderPosition = () => {
      if (uploader && uploader.style.display === 'flex') {
        const editorRect = this.container.getBoundingClientRect();
        uploader.style.bottom = `${window.innerHeight - editorRect.top + 10}px`;
        uploader.style.left = `${editorRect.left}px`;
        uploader.style.width = `${editorRect.width}px`;
      }
    };
    
    window.addEventListener('scroll', updateUploaderPosition);
    window.addEventListener('resize', updateUploaderPosition);
    
    const originalRemove = uploader.remove.bind(uploader);
    uploader.remove = function() {
      window.removeEventListener('scroll', updateUploaderPosition);
      window.removeEventListener('resize', updateUploaderPosition);
      if (uploader._closeHandler) {
        document.removeEventListener('click', uploader._closeHandler);
      }
      originalRemove();
    };
    
    return uploader;
  }

  async handleImageUpload(file, uploader) {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件!');
      return;
    }
    
    if (file.size > 300 * 1024) {
      alert('图片大小不能超过300KB!');
      return;
    }
    
    const progressContainer = uploader.querySelector('.upload-progress');
    const progressBar = uploader.querySelector('.progress-bar');
    const progressPercent = uploader.querySelector('.progress-percent');
    const progressFilename = uploader.querySelector('.progress-filename');
    
    progressContainer.style.display = 'block';
    progressFilename.textContent = file.name;
    
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('token');
    const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
    
    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          progressBar.style.width = percent + '%';
          progressPercent.textContent = percent + '%';
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          
          const imageInfo = {
            filename: result.filename,
            path: result.path,
            url: `${API_BASE_URL}${result.path}`,
            originalName: file.name
          };
          
          this.uploadedImages.push(imageInfo);
          this.addImageToList(imageInfo, uploader);
          
          setTimeout(() => {
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
            progressPercent.textContent = '0%';
            
            // 在上传区域显示成功提示
            const uploadArea = uploader.querySelector('.upload-area');
            const successMsg = document.createElement('div');
            successMsg.style.cssText = 'color: #10b981; font-size: 14px; margin-top: 8px; text-align: center;';
            successMsg.innerHTML = '<i class="fas fa-check-circle"></i> 上传成功！点击下方"插入"按钮将图片插入到编辑器';
            uploadArea.appendChild(successMsg);
            
            setTimeout(() => successMsg.remove(), 3000);
          }, 500);
        } else {
          throw new Error('上传失败');
        }
      });
      
      xhr.addEventListener('error', () => {
        throw new Error('网络错误');
      });
      
      xhr.open('POST', `${API_BASE_URL}/api/forum/upload-image`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
      
    } catch (error) {
      console.error('上传图片失败:', error);
      progressContainer.style.display = 'none';
      alert('上传失败: ' + error.message);
    }
  }

  addImageToList(imageInfo, uploader) {
    const listContainer = uploader.querySelector('.uploaded-images-list');
    const grid = uploader.querySelector('.images-grid');
    
    listContainer.style.display = 'block';
    
    const item = document.createElement('div');
    item.className = 'uploaded-image-item';
    item.style.cssText = `
      position: relative;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      background: #f9fafb;
    `;
    
    item.innerHTML = `
      <img src="${imageInfo.url}" style="width: 100%; height: 100px; object-fit: cover; display: block;">
      <div class="image-item-actions" style="padding: 8px; display: flex; gap: 4px;">
        <button class="btn-insert-image" style="flex: 1; padding: 4px 8px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          <i class="fas fa-plus"></i> 插入
        </button>
        <button class="btn-delete-image" style="flex: 1; padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          <i class="fas fa-trash"></i> 删除
        </button>
      </div>
    `;
    
    const insertBtn = item.querySelector('.btn-insert-image');
    insertBtn.addEventListener('click', () => {
      this.insertImageToEditor(imageInfo);
    });
    
    const deleteBtn = item.querySelector('.btn-delete-image');
    deleteBtn.addEventListener('click', async () => {
      if (confirm('确定删除此图片吗?')) {
        await this.deleteUploadedImage(imageInfo);
        item.remove();
        
        if (grid.children.length === 0) {
          listContainer.style.display = 'none';
        }
      }
    });
    
    grid.appendChild(item);
  }

  insertImageToEditor(imageInfo) {
    const img = document.createElement('img');
    img.src = imageInfo.url;
    img.alt = imageInfo.originalName;
    img.className = 'editor-uploaded-image';
    img.dataset.imagePath = imageInfo.path;
    img.dataset.originalSrc = imageInfo.url;
    img.style.cssText = 'max-width: 50%; height: auto; display: inline-block; margin: 4px; border-radius: 8px; cursor: pointer; vertical-align: middle;';
    
    this.content.focus();
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      
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
    }
    
    this.content.dispatchEvent(new Event('input', { bubbles: true }));
    
    // 在上传窗口显示插入成功提示
    if (this.imageUploader && this.imageUploader.style.display === 'flex') {
      const uploadArea = this.imageUploader.querySelector('.upload-area');
      if (uploadArea) {
        const successMsg = document.createElement('div');
        successMsg.style.cssText = 'color: #10b981; font-size: 14px; margin-top: 8px; text-align: center; font-weight: 600;';
        successMsg.innerHTML = '<i class="fas fa-check-circle"></i> 图片已插入编辑器！';
        uploadArea.appendChild(successMsg);
        
        setTimeout(() => successMsg.remove(), 2000);
      }
    }
  }

  async deleteUploadedImage(imageInfo) {
    const token = localStorage.getItem('token');
    const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/forum/delete-image`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: imageInfo.path })
      });
      
      if (response.ok) {
        const index = this.uploadedImages.findIndex(img => img.path === imageInfo.path);
        if (index > -1) {
          this.uploadedImages.splice(index, 1);
        }
        
        const images = this.content.querySelectorAll(`img[data-image-path="${imageInfo.path}"]`);
        images.forEach(img => img.remove());
        
        if (typeof showSuccessMessage === 'function') {
          showSuccessMessage('图片已删除!');
        }
      } else {
        throw new Error('删除失败');
      }
    } catch (error) {
      console.error('删除图片失败:', error);
      alert('删除失败: ' + error.message);
    }
  }

  showImagePreview(thumbnailSrc, originalSrc) {
    const modal = document.createElement('div');
    modal.className = 'image-preview-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s;
    `;
    
    const isMobile = window.innerWidth <= 768;
    
    modal.innerHTML = `
      <div class="preview-container" style="position: relative; max-width: 90%; max-height: 90%; ${isMobile ? 'touch-action: pan-x pan-y pinch-zoom;' : ''}">
        <img src="${originalSrc}" style="max-width: 100%; max-height: 90vh; object-fit: contain; display: block; border-radius: 8px;">
        <button class="preview-close" style="position: absolute; top: -40px; right: 0; background: rgba(255,255,255,0.2); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 20px;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    const closeBtn = modal.querySelector('.preview-close');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    if (isMobile) {
      const img = modal.querySelector('img');
      let scale = 1;
      let lastDistance = 0;
      
      img.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          lastDistance = Math.hypot(
            e.touches[0].pageX - e.touches[1].pageX,
            e.touches[0].pageY - e.touches[1].pageY
          );
        }
      });
      
      img.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
          e.preventDefault();
          const distance = Math.hypot(
            e.touches[0].pageX - e.touches[1].pageX,
            e.touches[0].pageY - e.touches[1].pageY
          );
          
          const delta = distance - lastDistance;
          scale += delta * 0.01;
          scale = Math.max(0.5, Math.min(scale, 3));
          
          img.style.transform = `scale(${scale})`;
          lastDistance = distance;
        }
      });
    }
    
    document.body.appendChild(modal);
  }

  // ============ 表情选择器功能 ============
  
  toggleEmojiPicker(btn) {
    if (this.emojiPicker) {
      const isVisible = this.emojiPicker.style.display === 'flex';
      this.emojiPicker.style.display = isVisible ? 'none' : 'flex';
      btn.classList.toggle('active', !isVisible);
      
      if (!isVisible && window.emojiPacks && window.emojiPacks.length > 0) {
        this.loadEmojiPackContent(window.emojiPacks[0].id);
        const editorRect = this.container.getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;
        this.emojiPicker.style.bottom = `${window.innerHeight - editorRect.top + 10}px`;
        this.emojiPicker.style.left = `${editorRect.left}px`;
        this.emojiPicker.style.width = `${editorRect.width}px`;
        this.emojiPicker.style.height = `${isMobile ? '280px' : '360px'}`;
      }
      return;
    }
    
    this.emojiPicker = this.createEmojiPicker();
    this.emojiPickerButton = btn;
    document.body.appendChild(this.emojiPicker);
    btn.classList.add('active');
    
    this.loadEmojiPacks();
    
    const closeOnClickOutside = (e) => {
      if (this.emojiPicker && 
          !this.emojiPicker.contains(e.target) && 
          !btn.contains(e.target)) {
        this.emojiPicker.style.display = 'none';
        btn.classList.remove('active');
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeOnClickOutside);
    }, 100);
    
    this.emojiPicker._closeHandler = closeOnClickOutside;
  }

  createEmojiPicker() {
    const picker = document.createElement('div');
    picker.className = 'forum-emoji-picker';
    
    const editorRect = this.container.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    
    picker.style.cssText = `
      display: flex;
      flex-direction: column;
      position: fixed;
      bottom: ${window.innerHeight - editorRect.top + 10}px;
      left: ${editorRect.left}px;
      width: ${editorRect.width}px;
      max-width: 500px;
      height: ${isMobile ? '280px' : '360px'};
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      z-index: 10001;
      overflow: hidden;
    `;
    
    picker.innerHTML = `
      <div class="emoji-grid-container" style="flex: 1; overflow-y: auto; padding: 12px;">
        <div class="emoji-loading" style="display: flex; justify-content: center; align-items: center; height: 100%;">
          <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i>
        </div>
      </div>
      <div class="emoji-tabs" style="display: flex; gap: 6px; padding: 10px; border-top: 1px solid #e5e7eb; background: #f9fafb; overflow-x: auto;">
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
    
    this.emojiPickerButton = null;
    
    const updatePickerPosition = () => {
      if (picker && picker.style.display === 'flex') {
        const editorRect = this.container.getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;
        picker.style.bottom = `${window.innerHeight - editorRect.top + 10}px`;
        picker.style.left = `${editorRect.left}px`;
        picker.style.width = `${editorRect.width}px`;
        picker.style.height = `${isMobile ? '280px' : '360px'}`;
      }
    };
    
    window.addEventListener('scroll', updatePickerPosition);
    window.addEventListener('resize', updatePickerPosition);
    
    const originalRemove = picker.remove.bind(picker);
    picker.remove = function() {
      window.removeEventListener('scroll', updatePickerPosition);
      window.removeEventListener('resize', updatePickerPosition);
      if (picker._closeHandler) {
        document.removeEventListener('click', picker._closeHandler);
      }
      originalRemove();
    };
    
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
      tab.style.cssText = 'flex-shrink: 0; width: 32px; height: 32px; border: none; background: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; position: relative;';
      
      if (pack.is_audio_pack) {
        tab.classList.add('audio-pack');
      }
      
      const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
      if (pack.cover_image) {
        tab.innerHTML = `
          <img src="${API_BASE_URL}${pack.cover_image}" alt="${pack.pack_name}" style="width: 24px; height: 24px; object-fit: contain;">
          ${pack.is_audio_pack ? '<i class="fas fa-volume-up" style="position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #667eea;"></i>' : ''}
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
    const isMobile = window.innerWidth <= 768;
    const columns = isMobile ? 8 : 10;
    grid.style.cssText = `display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 4px;`;
    
    const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
    
    emojis.forEach(emoji => {
      const item = document.createElement('div');
      item.className = 'emoji-item';
      item.style.cssText = `
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        transition: all 0.2s;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        aspect-ratio: 1;
      `;
      
      const audioPath = emoji.sound_path || emoji.audio_path;
      
      const img = document.createElement('img');
      img.src = `${API_BASE_URL}${emoji.file_path}`;
      img.alt = emoji.emoji_name || emoji.file_name;
      img.style.cssText = 'width: 100%; height: 100%; max-width: 32px; max-height: 32px; object-fit: contain;';
      
      item.appendChild(img);
      
      if (audioPath) {
        const audioIcon = document.createElement('i');
        audioIcon.className = 'fas fa-volume-up';
        audioIcon.style.cssText = 'position: absolute; bottom: 2px; right: 2px; font-size: 8px; color: #667eea; background: white; border-radius: 50%; padding: 1px;';
        item.appendChild(audioIcon);
      }
      
      item.addEventListener('mouseenter', () => {
        item.style.background = '#f0f2f5';
        item.style.transform = 'scale(1.15)';
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

  // ============ 内容获取和设置 ============
  
  getContent() {
    let html = this.content.innerHTML;
    
    html = html.replace(/<img[^>]*class="editor-emoji-preview"[^>]*>/gi, (match) => {
      const idMatch = match.match(/data-emoji-id="(\d+)"/);
      const pathMatch = match.match(/data-emoji-path="([^"]+)"/);
      const audioMatch = match.match(/data-audio-path="([^"]+)"/);
      
      if (idMatch && pathMatch) {
        const id = idMatch[1];
        const path = pathMatch[1];
        const audioPath = audioMatch ? audioMatch[1] : '';
        
        if (audioPath) {
          return `[emoji:${id}:${path}:${audioPath}]`;
        }
        return `[emoji:${id}:${path}]`;
      }
      return match;
    });
    
    html = html.replace(/<img[^>]*class="editor-uploaded-image"[^>]*>/gi, (match) => {
      const pathMatch = match.match(/data-image-path="([^"]+)"/);
      if (pathMatch) {
        return `[image:${pathMatch[1]}]`;
      }
      return match;
    });
    
    return html.trim();
  }
  
  setContent(content) {
    this.content.innerHTML = content;
  }
  
  clear() {
    this.content.innerHTML = '';
    this.uploadedImages = [];
  }
  
  isEmpty() {
    const text = this.content.innerText.trim();
    const images = this.content.querySelectorAll('img');
    return text === '' && images.length === 0;
  }
  
  getUploadedImages() {
    return this.uploadedImages;
  }
}

window.ForumEditor = ForumEditor;