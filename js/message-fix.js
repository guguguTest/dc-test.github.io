// message-fix.js - 修复消息下拉窗口和缓存自动刷新问题（完整整合版）

(function(global) {
  'use strict';

  // ==================== 修复1：消息下拉窗口重新打开问题 ====================
  
  // 监听消息图标点击事件（使用事件委托，避免覆盖原有事件）
  document.addEventListener('click', function(e) {
    // 检查是否点击了消息图标
    const messageIcon = e.target.closest('.message-icon-wrapper, .message-icon-wrapper-mobile');
    if (!messageIcon) return;
    
    // 获取对应的下拉窗口
    const isMobile = messageIcon.classList.contains('message-icon-wrapper-mobile');
    const dropdownId = isMobile ? 'message-dropdown-mobile' : 'message-dropdown';
    const dropdown = document.getElementById(dropdownId);
    
    if (dropdown) {
      // 确保移除可能存在的 display: none
      if (dropdown.style.display === 'none') {
        dropdown.style.display = '';
      }
    }
  }, true); // 使用捕获阶段，确保在其他事件处理之前执行

  // 修复从消息中心返回后的状态
  const originalCloseMessageDropdown = window.closeMessageDropdown;
  
  window.closeMessageDropdown = function() {
    const dropdowns = document.querySelectorAll('.message-dropdown, .message-dropdown-mobile');
    dropdowns.forEach(d => {
      d.classList.remove('show');
      // 不设置 display: none
      if (d.style.display === 'none') {
        d.style.display = '';
      }
    });
  };

  // 监听页面切换，确保下拉窗口状态正确
  const checkDropdownState = function() {
    const dropdowns = document.querySelectorAll('.message-dropdown, .message-dropdown-mobile');
    dropdowns.forEach(dropdown => {
      if (dropdown.style.display === 'none' && !dropdown.classList.contains('show')) {
        dropdown.style.display = '';
      }
    });
  };

  // 定期检查并修复下拉窗口状态
  setInterval(checkDropdownState, 500);

  // ==================== 修复2：设置页面缓存自动刷新（无弹窗）====================
  
  // 静默刷新缓存统计
  async function refreshCacheStatsSilently() {
    try {
      // 检查 EmojiCache 是否存在
      if (!window.EmojiCache) {
        updateCacheDisplayDefault();
        return;
      }
      
      // 确保初始化
      if (window.EmojiCache.init) {
        await window.EmojiCache.init();
      }
      
      // 获取统计数据
      if (window.EmojiCache.getStats) {
        const stats = await window.EmojiCache.getStats();
        if (stats) {
          updateCacheDisplay(stats);
        } else {
          updateCacheDisplayDefault();
        }
      }
    } catch (error) {
      console.error('Failed to refresh cache stats silently:', error);
      updateCacheDisplayDefault();
    }
  }

  // 更新缓存显示
  function updateCacheDisplay(stats) {
    const emojiCountEl = document.getElementById('cache-emoji-count');
    const messageCountEl = document.getElementById('cache-message-count');
    const cacheSizeEl = document.getElementById('cache-size');
    const usageTextEl = document.getElementById('cache-usage-text');
    const progressFillEl = document.getElementById('cache-progress-fill');
    
    if (emojiCountEl) emojiCountEl.textContent = stats.emojiCount || 0;
    if (messageCountEl) messageCountEl.textContent = stats.messageCount || 0;
    if (cacheSizeEl) cacheSizeEl.textContent = (stats.totalSizeMB || '0.00') + ' MB';
    
    const totalMB = parseFloat(stats.totalSizeMB) || 0;
    const maxMB = parseFloat(stats.maxSizeMB) || 100;
    const percent = parseFloat(stats.usagePercent) || 0;
    
    if (usageTextEl) {
      usageTextEl.textContent = `${totalMB.toFixed(2)} MB / ${maxMB} MB`;
    }
    
    if (progressFillEl) {
      progressFillEl.style.width = Math.max(percent, 5) + '%';
      const progressText = progressFillEl.querySelector('.progress-text');
      if (progressText) {
        progressText.textContent = percent.toFixed(1) + '%';
      }
    }
  }

  // 显示默认值
  function updateCacheDisplayDefault() {
    const emojiCountEl = document.getElementById('cache-emoji-count');
    const messageCountEl = document.getElementById('cache-message-count');
    const cacheSizeEl = document.getElementById('cache-size');
    const usageTextEl = document.getElementById('cache-usage-text');
    const progressFillEl = document.getElementById('cache-progress-fill');
    
    if (emojiCountEl) emojiCountEl.textContent = '0';
    if (messageCountEl) messageCountEl.textContent = '0';
    if (cacheSizeEl) cacheSizeEl.textContent = '0.00 MB';
    if (usageTextEl) usageTextEl.textContent = '0.00 MB / 100 MB';
    
    if (progressFillEl) {
      progressFillEl.style.width = '5%';
      const progressText = progressFillEl.querySelector('.progress-text');
      if (progressText) {
        progressText.textContent = '0.0%';
      }
    }
  }

  // 监听页面切换事件
  function onSettingsPageLoad() {
    // 检查是否在设置页面
    const settingsContainer = document.querySelector('.settings-container');
    const cacheCard = document.getElementById('emoji-cache-card');
    
    if (settingsContainer && cacheCard) {
      
      // 静默刷新缓存统计（不显示任何提示）
      refreshCacheStatsSilently();
      
      // 同时确保开关状态正确加载
      const autoCleanSwitch = document.getElementById('auto-clean-cache');
      const preloadSwitch = document.getElementById('preload-emoji');
      
      if (autoCleanSwitch) {
        const autoClean = localStorage.getItem('autoCleanCache') !== 'false';
        autoCleanSwitch.checked = autoClean;
      }
      
      if (preloadSwitch) {
        const preload = localStorage.getItem('preloadEmoji') !== 'false';
        preloadSwitch.checked = preload;
      }
    }
  }

  // 监听 hash 变化
  window.addEventListener('hashchange', function() {
    if (window.location.hash === '#/settings') {
      setTimeout(onSettingsPageLoad, 200);
    }
  });

  // 监听 DOM 变化（用于 SPA 页面切换）
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.target.id === 'content-container') {
        // 检查是否加载了设置页面
        if (document.querySelector('.settings-container')) {
          setTimeout(onSettingsPageLoad, 200);
        }
      }
    });
  });

  // 开始观察
  const contentContainer = document.getElementById('content-container');
  if (contentContainer) {
    observer.observe(contentContainer, {
      childList: true,
      subtree: false
    });
  }

  // 页面加载完成后检查一次
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        if (window.location.hash === '#/settings') {
          onSettingsPageLoad();
        }
        // 初始检查下拉窗口状态
        checkDropdownState();
      }, 300);
    });
  } else {
    setTimeout(function() {
      if (window.location.hash === '#/settings') {
        onSettingsPageLoad();
      }
      // 初始检查下拉窗口状态
      checkDropdownState();
    }, 300);
  }

  // ==================== 修复3：聊天窗口高度和调整大小修复 ====================
  (function() {
    'use strict';
    
    // 监听聊天窗口创建
    const chatObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.id === 'chat-modal') {
            setTimeout(() => {
              fixChatWindow(node);
            }, 100);
          }
        });
      });
    });
    
    chatObserver.observe(document.body, {
      childList: true,
      subtree: false
    });
    
    // 修复聊天窗口
    function fixChatWindow(modal) {
      const container = modal.querySelector('.chat-container');
      if (!container) return;
      
      const isPCDraggable = modal.classList.contains('pc-draggable');
      const isMobile = modal.classList.contains('mobile-centered');
      
      if (isPCDraggable) {
        
        // 获取当前高度
        const currentHeight = parseInt(container.style.height);
        
        // 如果没有设置高度或高度异常，设置为默认值
        if (!currentHeight || currentHeight > 700 || currentHeight < 400 || !container.dataset.initialized) {
          container.style.width = '450px';
          container.style.height = '550px';  // 强制设置合理高度
          container.dataset.initialized = 'true';
        }
        
        // 设置尺寸限制
        container.style.minWidth = '380px';
        container.style.minHeight = '400px';
        container.style.maxWidth = 'min(800px, 90vw)';
        container.style.maxHeight = '700px';  // 固定最大高度为700px
        
        // 强制启用双向resize
        container.style.resize = 'both';
        container.style.overflow = 'auto';
        
        // 确保当前高度不超过最大值
        if (parseInt(container.style.height) > 700) {
          container.style.height = '550px';
        }
        
        // 确保位置正确
        container.style.position = 'fixed';
        if (!container.style.top || container.style.top === '100px') {
          container.style.top = '80px';
        }
        if (!container.style.left || container.style.left === '50%') {
          container.style.left = '50%';
          container.style.transform = 'translateX(-50%)';
        }
        
        // 添加手动resize功能作为后备
        addManualResize(container);
        
      } else if (isMobile) {
        
        const viewportHeight = window.innerHeight;
        const maxHeight = Math.min(600, viewportHeight - 100);
        
        container.style.height = maxHeight + 'px';
        container.style.maxHeight = maxHeight + 'px';
        container.style.minHeight = '400px';
        container.style.resize = 'none';
      }
      
      // 修复内部布局
      fixInternalLayout(container);
    }
    
    // 修复内部布局确保flex正常工作
    function fixInternalLayout(container) {
      // 确保容器是flex布局
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      
      // 修复各个部分的flex属性
      const header = container.querySelector('.chat-header');
      const searchArea = container.querySelector('.user-search-area');
      const messages = container.querySelector('.chat-messages');
      const inputArea = container.querySelector('.chat-input-area');
      
      if (header) {
        header.style.flexShrink = '0';
        header.style.height = '50px';
        header.style.minHeight = '50px';
        header.style.maxHeight = '50px';
      }
      
      if (searchArea) {
        searchArea.style.flexShrink = '0';
        searchArea.style.maxHeight = '150px';
        searchArea.style.overflowY = 'auto';
      }
      
      if (messages) {
        messages.style.flex = '1 1 auto';
        messages.style.minHeight = '200px';
        messages.style.overflowY = 'auto';
        messages.style.overflowX = 'hidden';
      }
      
      if (inputArea) {
        inputArea.style.flexShrink = '0';
        inputArea.style.height = '60px';
        inputArea.style.minHeight = '60px';
        inputArea.style.maxHeight = '60px';
      }
    }
    
    // 添加手动调整大小功能（备用）
    function addManualResize(container) {
      // 检查是否已经添加
      if (container.querySelector('.manual-resize-handle')) return;
   
      // 创建调整手柄
      const handle = document.createElement('div');
      handle.className = 'manual-resize-handle';
      handle.style.cssText = `
        position: absolute;
        bottom: 0;
        right: 0;
        width: 20px;
        height: 20px;
        cursor: nwse-resize;
        background: linear-gradient(135deg, transparent 0%, transparent 50%, rgba(150, 150, 150, 0.5) 50%, rgba(150, 150, 150, 0.5) 100%);
        border-radius: 0 0 12px 0;
        z-index: 1000;
        pointer-events: auto;
      `;
      container.appendChild(handle);
      
      let isResizing = false;
      let startX, startY, startWidth, startHeight;
      
      handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(window.getComputedStyle(container).width, 10);
        startHeight = parseInt(window.getComputedStyle(container).height, 10);
        
        container.classList.add('resizing');
        e.preventDefault();
        e.stopPropagation();
      });
      
      document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const newWidth = startWidth + e.clientX - startX;
        const newHeight = startHeight + e.clientY - startY;
        
        // 应用尺寸限制
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        const minWidth = 380;
        const maxWidth = Math.min(800, viewportWidth * 0.9);
        const minHeight = 400;
        const maxHeight = viewportHeight * 0.8;
        
        const finalWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
        const finalHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);
        
        container.style.width = finalWidth + 'px';
        container.style.height = finalHeight + 'px';
        
        // 防止选中文本
        e.preventDefault();
      });
      
      document.addEventListener('mouseup', () => {
        if (isResizing) {
          isResizing = false;
          container.classList.remove('resizing');
        }
      });
    }
    
    // 修复已存在的聊天窗口
    function fixExistingChatWindows() {
      const modal = document.getElementById('chat-modal');
      if (modal) {
        fixChatWindow(modal);
      }
    }
    
    // 页面加载完成后检查
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fixExistingChatWindows);
    } else {
      setTimeout(fixExistingChatWindows, 100);
    }
    
    // 定期检查（用于SPA页面）
    let checkInterval = setInterval(() => {
      fixExistingChatWindows();
    }, 1000);
    
    // 5秒后停止定期检查
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 5000);
  })();

  // ==================== 修复4：iframe高度自适应问题 ====================
  (function() {
    'use strict';
    
    // 强制修复所有iframe
    function forceFixAllIframes() {
      // 扩展选择器，包含所有可能的iframe
      const iframes = document.querySelectorAll('iframe, .icf-editor-iframe, .tool-iframe, .content-iframe');
      
      iframes.forEach(iframe => {
        // 强制设置高度
        iframe.style.cssText = `
          width: 100% !important;
          min-height: 600px !important;
          height: 600px !important;
          border: none !important;
          display: block !important;
        `;
        
        // 修复父容器
        const parent = iframe.parentElement;
        if (parent) {
          parent.style.minHeight = 'auto';
          parent.style.height = 'auto';
          parent.style.maxHeight = 'none';
          parent.style.overflow = 'visible';
          
          // 特别处理iframe-container
          if (parent.classList.contains('iframe-container')) {
            parent.style.cssText += `
              min-height: auto !important;
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
            `;
          }
        }
        
        // 监听加载事件
        iframe.addEventListener('load', function() {
          adjustIframeHeight(iframe);
        });
        
        // 立即尝试调整
        adjustIframeHeight(iframe);
      });
    }
    
    // 调整iframe高度
    function adjustIframeHeight(iframe) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (iframeDoc && iframeDoc.body) {
          // 获取内容实际高度
          const contentHeight = Math.max(
            iframeDoc.body.scrollHeight || 0,
            iframeDoc.body.offsetHeight || 0,
            iframeDoc.documentElement?.scrollHeight || 0,
            iframeDoc.documentElement?.offsetHeight || 0,
            600
          );
          
          // 设置高度，确保不会太小
          const finalHeight = Math.max(600, contentHeight + 50);
          iframe.style.height = finalHeight + 'px';
          iframe.style.minHeight = '600px';
        } else {
          // 无法访问内容，使用默认高度
          iframe.style.height = '650px';
          iframe.style.minHeight = '600px';
        }
      } catch (e) {
        // 跨域iframe，使用较大的默认高度
        iframe.style.height = '650px';
        iframe.style.minHeight = '600px';
      }
    }
    
    // 监听DOM变化
    const iframeObserver = new MutationObserver((mutations) => {
      let hasNewIframe = false;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.tagName === 'IFRAME' || (node.querySelector && node.querySelector('iframe'))) {
              hasNewIframe = true;
            }
          }
        });
      });
      
      if (hasNewIframe) {
        setTimeout(forceFixAllIframes, 100);
      }
    });
    
    // 开始观察
    const contentContainer = document.getElementById('content-container');
    if (contentContainer) {
      iframeObserver.observe(contentContainer, {
        childList: true,
        subtree: true
      });
    }
    
    // 添加全局样式覆盖
    function addIframeStyles() {
      if (document.getElementById('iframe-fix-styles')) {
        document.getElementById('iframe-fix-styles').remove();
      }
      
      const styleSheet = document.createElement('style');
      styleSheet.id = 'iframe-fix-styles';
      styleSheet.textContent = `
        /* 强制修复iframe高度 */
        iframe,
        .icf-editor-iframe,
        .tool-iframe,
        .content-iframe {
          min-height: 600px !important;
          width: 100% !important;
          border: none !important;
          display: block !important;
        }
        
        /* 修复iframe容器 */
        .iframe-container {
          min-height: auto !important;
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
        }
        
        /* 确保所有内容页面的iframe都有足够高度 */
        .download-section iframe,
        .game-detail iframe,
        .tool-section iframe,
        [class*="-container"] iframe {
          min-height: 600px !important;
        }
        
        /* 修复聊天窗口高度 - 强制限制 */
        .chat-modal.pc-draggable .chat-container {
          resize: both !important;
          overflow: auto !important;
          max-height: 700px !important;  /* 固定最大高度 */
          min-height: 400px !important;
          min-width: 380px !important;
          max-width: min(800px, 90vw) !important;
        }
        
        /* 初始聊天窗口高度 */
        .chat-modal.pc-draggable .chat-container:not([data-initialized]) {
          height: 550px !important;
          width: 450px !important;
        }
        
        /* 移动端聊天窗口 */
        .chat-modal.mobile-centered .chat-container {
          max-height: min(600px, calc(100vh - 100px)) !important;
          resize: none !important;
        }
        
        /* 手动resize手柄样式 */
        .manual-resize-handle {
          position: absolute !important;
          bottom: 0 !important;
          right: 0 !important;
          width: 20px !important;
          height: 20px !important;
          cursor: nwse-resize !important;
          z-index: 10000 !important;
        }
        
        /* 防止聊天窗口内容溢出 */
        .chat-modal .chat-messages {
          flex: 1 1 auto !important;
          min-height: 200px !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
        }
      `;
      
      document.head.appendChild(styleSheet);
    }
    
    // 初始化
    function initIframeFix() {
      addIframeStyles();
      forceFixAllIframes();
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initIframeFix, 100);
      });
    } else {
      setTimeout(initIframeFix, 100);
    }
    
    // 定期检查（前10秒）
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      checkCount++;
      forceFixAllIframes();
      
      if (checkCount > 10) {
        clearInterval(checkInterval);
      }
    }, 1000);
  })();

})(window);