// forum-editor.js - 富文本编辑器模块

class ForumEditor {
  constructor(container) {
    this.container = container;
    this.toolbar = container.querySelector('.editor-toolbar');
    this.content = container.querySelector('.editor-content');
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
      { icon: 'at', command: 'mention', title: '@用户' },
      { icon: 'code', command: 'formatBlock', value: 'pre', title: '代码块' }
    ];

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = 'editor-btn';
      button.type = 'button';
      button.title = btn.title;
      button.innerHTML = `<i class="fas fa-${btn.icon}"></i>`;
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.executeCommand(btn.command, btn.value);
      });
      
      this.toolbar.appendChild(button);
    });
  }

  setupContent() {
    this.content.contentEditable = true;
    
    // 监听输入事件
    this.content.addEventListener('input', () => {
      this.updateToolbarState();
    });

    // 监听选择变化
    this.content.addEventListener('mouseup', () => {
      this.updateToolbarState();
    });

    this.content.addEventListener('keyup', () => {
      this.updateToolbarState();
    });

    // 处理粘贴事件
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
    return this.content.innerHTML;
  }

  setContent(html) {
    this.content.innerHTML = html;
  }

  clear() {
    this.content.innerHTML = '';
  }

  isEmpty() {
    return this.content.textContent.trim().length === 0;
  }
}

// 导出编辑器类
window.ForumEditor = ForumEditor;