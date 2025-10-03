// forum-editor.js - 富文本编辑器模块(含表情和图片上传支持)

class ForumEditor {
  constructor(container) {
    this.container = container;
    this.toolbar = container.querySelector('.editor-toolbar');
    this.content = container.querySelector('.editor-content');
    this.emojiPicker = null;
    this.imageUploader = null;
    this.uploadedImages = []; // 存储已上传的图片信息
    this.init();
  }

  init() {
    this.setupToolbar();
    this.setupContent();
    this.setupImageClickHandler();
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
      { icon: 'image', command: 'uploadImage', title: '上传图片' },
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
        } else if (btn.command === 'uploadImage') {
          this.toggleImageUploader(button);
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

  // ============ 图片上传功能 ============
  
  toggleImageUploader(btn) {
    if (this.imageUploader) {
      const isVisible = this.imageUploader.style.display === 'flex';
      this.imageUploader.style.display = isVisible ? 'none' : 'flex';
      btn.classList.toggle('active', !isVisible);
      
      if (!isVisible) {
        // 更新位置
        const editorRect = this.container.getBoundingClientRect();
        this.imageUploader.style.bottom = `${window.innerHeight - editorRect.top + 10}px`;
        this.imageUploader.style.left = `${editorRect.left}px`;
        this.imageUploader.style.width = `${editorRect.width}px`;
      }
      return;
    }
    
    this.imageUploader = this.createImageUploader();
    // 附加到 body 而不是容器，避免被限制
    document.body.appendChild(this.imageUploader);
    btn.classList.add('active');
    
    // 点击外部关闭
    const closeOnClickOutside = (e) => {
      if (this.imageUploader && 
          !this.imageUploader.contains(e.target) && 
          !btn.contains(e.target)) {
        this.imageUploader.style.display = 'none';
        btn.classList.remove('active');
      }
    };
    
    // 延迟添加点击事件监听，避免立即触发
    setTimeout(() => {
      document.addEventListener('click', closeOnClickOutside);
    }, 100);
    
    // 保存清理函数
    this.imageUploader._closeHandler = closeOnClickOutside;
  }

  createImageUploader() {
    const uploader = document.createElement('div');
    uploader.className = 'forum-image-uploader';
    
    // 获取编辑器容器的位置信息
    const editorRect = this.container.getBoundingClientRect();
    
    // 使用 fixed 定位，避免被父容器限制
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
    
    // 监听窗口滚动和调整大小，更新图片上传器位置
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
    
    // 清理函数
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
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件!');
      return;
    }
    
    // 验证文件大小 (300KB = 300 * 1024 bytes)
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
          
          // 保存上传的图片信息
          const imageInfo = {
            filename: result.filename,
            path: result.path,
            url: `${API_BASE_URL}${result.path}`,
            originalName: file.name
          };
          
          this.uploadedImages.push(imageInfo);
          this.addImageToList(imageInfo, uploader);
          
          // 重置上传区域
          setTimeout(() => {
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
            progressPercent.textContent = '0%';
          }, 500);
          
          if (typeof showSuccessMessage === 'function') {
            showSuccessMessage('图片上传成功!');
          }
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
        
        // 如果没有图片了,隐藏列表
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
    
    if (typeof showSuccessMessage === 'function') {
      showSuccessMessage('图片已插入编辑器!');
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
        // 从列表中移除
        const index = this.uploadedImages.findIndex(img => img.path === imageInfo.path);
        if (index > -1) {
          this.uploadedImages.splice(index, 1);
        }
        
        // 从编辑器中移除所有使用此图片的元素
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
    
    // 移动端支持手势缩放
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

  getContent() {
    console.log('=== getContent Start ===');
    
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = this.content.innerHTML;
    
    console.log('Original HTML:', tempContainer.innerHTML);
    
    // 处理表情标记
    const emojiImages = tempContainer.querySelectorAll('img.editor-emoji-preview');
    const emojiPlaceholders = [];
    
    emojiImages.forEach((img, index) => {
      const emojiId = img.dataset.emojiId;
      const emojiPath = img.dataset.emojiPath;
      const audioPath = img.dataset.audioPath;
      
      let emojiMarkup;
      if (audioPath) {
        emojiMarkup = `[emoji:${emojiId}:${emojiPath}:${audioPath}]`;
      } else {
        emojiMarkup = `[emoji:${emojiId}:${emojiPath}]`;
      }
      
      console.log(`Emoji ${index}:`, emojiMarkup);
      
      const placeholder = `__EMOJI_PLACEHOLDER_${index}__`;
      emojiPlaceholders.push({ placeholder, markup: emojiMarkup });
      
      const textNode = document.createTextNode(placeholder);
      img.parentNode.replaceChild(textNode, img);
    });
    
    // 处理上传的图片
    const uploadedImages = tempContainer.querySelectorAll('img.editor-uploaded-image');
    const imagePlaceholders = [];
    
    uploadedImages.forEach((img, index) => {
      const imagePath = img.dataset.imagePath;
      const imageMarkup = `[image:${imagePath}]`;
      
      console.log(`Image ${index}:`, imageMarkup);
      
      const placeholder = `__IMAGE_PLACEHOLDER_${index}__`;
      imagePlaceholders.push({ placeholder, markup: imageMarkup });
      
      const textNode = document.createTextNode(placeholder);
      img.parentNode.replaceChild(textNode, img);
    });
    
    let content = tempContainer.innerHTML;
    console.log('After placeholder:', content);
    
    // 恢复表情标记
    emojiPlaceholders.forEach(({ placeholder, markup }) => {
      const regex = new RegExp(placeholder, 'g');
      content = content.replace(regex, markup);
    });
    
    // 恢复图片标记
    imagePlaceholders.forEach(({ placeholder, markup }) => {
      const regex = new RegExp(placeholder, 'g');
      content = content.replace(regex, markup);
    });
    
    console.log('After restoration:', content);
    
    content = content.replace(/&nbsp;/g, ' ');
    content = content.trim();
    
    console.log('Final content:', content);
    console.log('=== getContent End ===');
    
    return content;
  }

  setContent(html) {
    console.log('=== setContent ===');
    console.log('Input HTML:', html);
    
    let processedHtml = html;
    
    // 处理表情标记
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
    
    // 处理图片标记
    const imageRegex = /\[image:(\/[^\]]+?)\]/g;
    processedHtml = processedHtml.replace(imageRegex, (match, path) => {
      const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
      const fullPath = `${API_BASE_URL}${path}`;
      
      return `<img src="${fullPath}" 
                   class="editor-uploaded-image" 
                   data-image-path="${path}" 
                   data-original-src="${fullPath}"
                   style="max-width: 50%; height: auto; display: inline-block; margin: 4px; border-radius: 8px; cursor: pointer; vertical-align: middle;" 
                   alt="图片">`;
    });
    
    this.content.innerHTML = processedHtml;
    console.log('Content set');
  }

  clear() {
    this.content.innerHTML = '';
    this.uploadedImages = [];
  }

  isEmpty() {
    const hasText = this.content.textContent.trim().length > 0;
    const hasEmoji = this.content.querySelector('img.editor-emoji-preview') !== null;
    const hasImage = this.content.querySelector('img.editor-uploaded-image') !== null;
    return !hasText && !hasEmoji && !hasImage;
  }

  // ============ 表情选择器功能 ============
  
  toggleEmojiPicker(btn) {
    if (this.emojiPicker) {
      const isVisible = this.emojiPicker.style.display === 'flex';
      this.emojiPicker.style.display = isVisible ? 'none' : 'flex';
      btn.classList.toggle('active', !isVisible);
      
      if (!isVisible && window.emojiPacks && window.emojiPacks.length > 0) {
        this.loadEmojiPackContent(window.emojiPacks[0].id);
        // 更新位置
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
    // 附加到 body 而不是容器，避免被限制
    document.body.appendChild(this.emojiPicker);
    btn.classList.add('active');
    
    this.loadEmojiPacks();
    
    // 点击外部关闭
    const closeOnClickOutside = (e) => {
      if (this.emojiPicker && 
          !this.emojiPicker.contains(e.target) && 
          !btn.contains(e.target)) {
        this.emojiPicker.style.display = 'none';
        btn.classList.remove('active');
      }
    };
    
    // 延迟添加点击事件监听，避免立即触发
    setTimeout(() => {
      document.addEventListener('click', closeOnClickOutside);
    }, 100);
    
    // 保存清理函数
    this.emojiPicker._closeHandler = closeOnClickOutside;
  }

  createEmojiPicker() {
    const picker = document.createElement('div');
    picker.className = 'forum-emoji-picker';
    
    // 获取编辑器容器的位置信息
    const editorRect = this.container.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    
    // 使用 fixed 定位，避免被父容器限制
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
    
    // 保存对编辑器按钮的引用，用于定位更新
    this.emojiPickerButton = null;
    
    // 监听窗口滚动和调整大小，更新表情选择器位置
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
    
    // 清理函数
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
    // 移动端8列，PC端10列，增加密度减少占用空间
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
      // 减小表情图片尺寸
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
}

window.ForumEditor = ForumEditor;
