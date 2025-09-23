// 移动端滚动增强 - 支持地址栏自动隐藏（修复版）
(function() {
  'use strict';
  
  // 检测是否为移动设备
  const isMobile = () => window.innerWidth <= 992;
  
  // 检测是否为iOS设备
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  // 检测是否为Android设备
  const isAndroid = () => /Android/.test(navigator.userAgent);
  
  // 保存当前滚动位置
  let savedScrollPosition = 0;
  let isInitializing = false;
  let sidebarOverlay = null;
  
  // 创建或获取遮罩层
  function createOrGetOverlay() {
    // 先尝试获取已存在的遮罩层
    sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (!sidebarOverlay) {
      // 如果不存在，创建新的遮罩层
      sidebarOverlay = document.createElement('div');
      sidebarOverlay.id = 'sidebar-overlay';
      sidebarOverlay.className = 'sidebar-overlay';
      document.body.appendChild(sidebarOverlay);
    }
    
    return sidebarOverlay;
  }
  
  // 显示遮罩层
  function showOverlay() {
    const overlay = createOrGetOverlay();
    if (overlay) {
      overlay.classList.add('show');
      overlay.style.display = 'block';
    }
  }
  
  // 隐藏遮罩层
  function hideOverlay() {
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.classList.remove('show');
      overlay.style.display = 'none';
    }
  }
  
  // 监听侧边栏显示/隐藏
  function setupSidebarObserver() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    // 创建 MutationObserver 来监听类名变化
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (sidebar.classList.contains('show')) {
            showOverlay();
            document.body.classList.add('mobile-sidebar-open');
          } else {
            hideOverlay();
            document.body.classList.remove('mobile-sidebar-open');
          }
        }
      });
    });
    
    observer.observe(sidebar, { attributes: true });
    
    // 为遮罩层添加点击事件来关闭侧边栏
    const overlay = createOrGetOverlay();
    if (overlay) {
      overlay.addEventListener('click', function() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.classList.remove('show');
          hideOverlay();
          document.body.classList.remove('mobile-sidebar-open');
        }
      });
    }
  }
  
  // 保存滚动位置
  function saveScrollPosition() {
    if (!isInitializing) {
      savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    }
  }
  
  // 恢复滚动位置
  function restoreScrollPosition() {
    if (savedScrollPosition > 0 && !isInitializing) {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedScrollPosition,
          behavior: 'instant'
        });
      });
    }
  }
  
  // 初始化移动端滚动优化
  function initMobileScrollOptimization() {
    if (!isMobile()) return;
    
    // 防止重复初始化
    if (isInitializing) return;
    isInitializing = true;
    
    // 保存当前滚动位置
    saveScrollPosition();
    
    // 1. 确保页面可以滚动
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    
    // 2. 设置最小内容高度以触发滚动
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      const viewportHeight = window.visualViewport ? 
        window.visualViewport.height : 
        window.innerHeight;
      
      const minHeight = viewportHeight + 150;
      mainContent.style.minHeight = `${minHeight}px`;
      
      if (isIOS()) {
        mainContent.style.paddingBottom = 'calc(20px + env(safe-area-inset-bottom, 0px))';
      } else {
        mainContent.style.paddingBottom = '20px';
      }
    }
    
    // 3. 设置侧边栏监听器
    setupSidebarObserver();
    
    // 4. iOS特定修复
    if (isIOS()) {
      document.body.style.webkitOverflowScrolling = 'touch';
      
      function updateViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }
      
      updateViewportHeight();
      
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateViewportHeight);
      }
    }
    
    // 5. 处理输入框聚焦问题
    if (isMobile()) {
      // 监听所有输入框的聚焦和失焦事件
      const inputs = document.querySelectorAll('input, textarea, select');
      
      inputs.forEach(input => {
        // 聚焦时的处理
        input.addEventListener('focus', function(e) {
          // iOS特殊处理
          if (isIOS()) {
            // 暂时允许缩放以便用户看清输入
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
              viewport.setAttribute('content', 
                'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
            }
          }
        });
        
        // 失焦时的处理
        input.addEventListener('blur', function(e) {
          // 恢复视口设置
          if (isIOS()) {
            setTimeout(() => {
              const viewport = document.querySelector('meta[name="viewport"]');
              if (viewport) {
                viewport.setAttribute('content', 
                  'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
              }
              // 重置缩放
              window.scrollTo(0, window.pageYOffset);
            }, 300);
          }
        });
      });
    }
    
    // 6. 只在首次加载时触发轻微滚动
    if (!window.__mobileScrollInitialized) {
      window.__mobileScrollInitialized = true;
      
      if (window.pageYOffset === 0) {
        setTimeout(() => {
          window.scrollTo(0, 1);
        }, 500);
      }
    } else {
      setTimeout(() => {
        restoreScrollPosition();
        isInitializing = false;
      }, 100);
    }
    
    // 标记初始化完成
    setTimeout(() => {
      isInitializing = false;
    }, 150);
  }
  
  // 节流函数
  function throttle(func, wait) {
    let timeout;
    let lastTime = 0;
    return function executedFunction(...args) {
      const now = Date.now();
      if (now - lastTime >= wait) {
        lastTime = now;
        func(...args);
      } else {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          lastTime = Date.now();
          func(...args);
        }, wait - (now - lastTime));
      }
    };
  }
  
  // 防抖函数
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
  
  // 监听滚动事件，保存滚动位置
  window.addEventListener('scroll', throttle(saveScrollPosition, 100));
  
  // DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileScrollOptimization);
  } else {
    initMobileScrollOptimization();
  }
  
  // 页面切换时重新初始化
  if (typeof window.loadPage === 'function') {
    const originalLoadPage = window.loadPage;
    window.loadPage = function(...args) {
      saveScrollPosition();
      
      const result = originalLoadPage.apply(this, args);
      
      setTimeout(() => {
        initMobileScrollOptimization();
        // 重新设置输入框监听
        setupInputListeners();
      }, 200);
      
      return result;
    };
  }
  
  // 设置输入框监听器
  function setupInputListeners() {
    if (!isMobile()) return;
    
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      // 移除旧的监听器（如果有的话）
      input.removeEventListener('focus', handleInputFocus);
      input.removeEventListener('blur', handleInputBlur);
      
      // 添加新的监听器
      input.addEventListener('focus', handleInputFocus);
      input.addEventListener('blur', handleInputBlur);
    });
  }
  
  // 输入框聚焦处理
  function handleInputFocus(e) {
    if (isIOS()) {
      // 不改变viewport，保持禁用缩放
    }
  }
  
  // 输入框失焦处理
  function handleInputBlur(e) {
    if (isIOS()) {
      setTimeout(() => {
        // 重置页面缩放
        window.scrollTo(0, window.pageYOffset);
      }, 100);
    }
  }
  
  // 窗口大小改变时重新初始化
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    
    resizeTimer = setTimeout(() => {
      if (isMobile()) {
        initMobileScrollOptimization();
        setupInputListeners();
      }
    }, 300);
  });
  
  // 监听 popstate 事件（浏览器后退/前进）
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      restoreScrollPosition();
    }, 100);
  });
  
  // Android特定修复
  if (isAndroid()) {
    document.addEventListener('touchmove', function(e) {
      if (e.touches.length === 1) {
        return true;
      }
    }, { passive: true });
  }
  
  // 防止滚动到底部时的回弹问题
  let lastScrollTop = 0;
  let scrollEndTimer;
  
  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    clearTimeout(scrollEndTimer);
    
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      scrollEndTimer = setTimeout(() => {
        if (window.pageYOffset + window.innerHeight >= document.documentElement.scrollHeight - 5) {
          window.scrollTo({
            top: document.documentElement.scrollHeight - window.innerHeight - 1,
            behavior: 'instant'
          });
        }
      }, 100);
    }
    
    lastScrollTop = scrollTop;
  }, { passive: true });
  
  // 初始设置输入框监听器
  setupInputListeners();
})();