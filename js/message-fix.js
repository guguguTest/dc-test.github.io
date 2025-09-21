// message-fix.js - 修复消息下拉窗口和缓存自动刷新问题（改进版）

(function(global) {
  'use strict';

  console.log('Loading message fix patch...');

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
        console.log('Removed display:none from dropdown');
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
        console.log('EmojiCache not loaded, using default values');
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
        console.log('Cache stats loaded:', stats);
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
      console.log('Settings page detected, auto-refreshing cache stats...');
      
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

  console.log('Message fix patch loaded successfully');

})(window);