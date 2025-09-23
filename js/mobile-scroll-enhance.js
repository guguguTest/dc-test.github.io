// 移动端滚动增强 - 支持地址栏自动隐藏（完整修复版）
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
  let bodyScrollPosition = 0;
  let isInitializing = false;
  let sidebarOverlay = null;
  
  // 创建或获取遮罩层
  function createOrGetOverlay() {
    sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (!sidebarOverlay) {
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
      overlay.style.display = 'block';
      setTimeout(() => {
        overlay.classList.add('show');
      }, 10);
    }
  }
  
  // 隐藏遮罩层
  function hideOverlay() {
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300);
    }
  }
  
  // 锁定背景滚动
  function lockBodyScroll() {
    bodyScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // 保存当前位置并固定body
    document.body.style.position = 'fixed';
    document.body.style.top = `-${bodyScrollPosition}px`;
    document.body.style.width = '100%';
    document.body.style.overflowY = 'hidden';
  }
  
  // 解锁背景滚动
  function unlockBodyScroll() {
    // 恢复body样式
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflowY = '';
    
    // 恢复滚动位置
    window.scrollTo(0, bodyScrollPosition);
  }
  
  // 初始化侧边栏控制
  function initSidebarControl() {
    const sidebar = document.querySelector('.sidebar');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const overlay = createOrGetOverlay();
    
    if (!sidebar || !mobileToggle) return;
    
    // 确保侧边栏本身可以滚动
    sidebar.style.overflowY = 'auto';
    sidebar.style.webkitOverflowScrolling = 'touch';
    sidebar.style.touchAction = 'pan-y';
    
    // 移动端菜单按钮点击事件
    mobileToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    });
    
    // 遮罩层点击关闭侧边栏
    overlay.addEventListener('click', function(e) {
      e.preventDefault();
      closeSidebar();
    });
    
    // 监听侧边栏的touchmove事件，防止传递到body
    sidebar.addEventListener('touchmove', function(e) {
      // 允许侧边栏内部滚动
      const target = e.target;
      const scrollable = sidebar;
      
      if (scrollable.scrollHeight > scrollable.clientHeight) {
        // 如果内容可滚动，阻止事件冒泡但允许默认行为
        e.stopPropagation();
      }
    }, { passive: true });
    
    // 防止侧边栏内部滚动时影响背景
    sidebar.addEventListener('touchstart', function(e) {
      const touch = e.touches[0];
      sidebar.dataset.startY = touch.clientY;
      sidebar.dataset.startScroll = sidebar.scrollTop;
    }, { passive: true });
    
    sidebar.addEventListener('touchmove', function(e) {
      if (!sidebar.dataset.startY) return;
      
      const touch = e.touches[0];
      const deltaY = touch.clientY - parseFloat(sidebar.dataset.startY);
      const scrollTop = parseFloat(sidebar.dataset.startScroll) - deltaY;
      
      // 防止过度滚动
      if (scrollTop < 0) {
        sidebar.scrollTop = 0;
      } else if (scrollTop > sidebar.scrollHeight - sidebar.clientHeight) {
        sidebar.scrollTop = sidebar.scrollHeight - sidebar.clientHeight;
      } else {
        sidebar.scrollTop = scrollTop;
      }
      
      e.stopPropagation();
    }, { passive: true });
  }
  
  // 切换侧边栏
  function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    if (sidebar.classList.contains('show')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }
  
  // 打开侧边栏
  function openSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    sidebar.classList.add('show');
    showOverlay();
    lockBodyScroll();
  }
  
  // 关闭侧边栏
  function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    sidebar.classList.remove('show');
    hideOverlay();
    unlockBodyScroll();
  }
  
  // 保存滚动位置
  function saveScrollPosition() {
    if (!isInitializing && !document.body.style.position) {
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
    
    if (isInitializing) return;
    isInitializing = true;
    
    saveScrollPosition();
    
    // 1. 设置基本滚动属性
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    
    // 2. 设置最小内容高度
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
    
    // 3. 初始化侧边栏控制
    initSidebarControl();
    
    // 4. iOS特定优化
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
    
    // 5. 设置输入框监听器
    setupInputListeners();
    
    // 6. 首次加载时的处理
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
    
    setTimeout(() => {
      isInitializing = false;
    }, 150);
  }
  
  // 设置输入框监听器
  function setupInputListeners() {
    if (!isMobile()) return;
    
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      input.removeEventListener('focus', handleInputFocus);
      input.removeEventListener('blur', handleInputBlur);
      
      input.addEventListener('focus', handleInputFocus);
      input.addEventListener('blur', handleInputBlur);
    });
  }
  
  // 输入框聚焦处理
  function handleInputFocus(e) {
    // 保持viewport设置不变，防止缩放
  }
  
  // 输入框失焦处理  
  function handleInputBlur(e) {
    if (isIOS()) {
      setTimeout(() => {
        window.scrollTo(0, window.pageYOffset);
      }, 100);
    }
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
  
  // 监听滚动事件
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
      }, 200);
      
      return result;
    };
  }
  
  // 窗口大小改变时重新初始化
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    
    resizeTimer = setTimeout(() => {
      if (isMobile()) {
        initMobileScrollOptimization();
      }
    }, 300);
  });
  
  // 监听 popstate 事件
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
  
  // 防止滚动到底部时的回弹
  let lastScrollTop = 0;
  let scrollEndTimer;
  
  window.addEventListener('scroll', function() {
    // 如果body被固定（侧边栏打开），不处理滚动
    if (document.body.style.position === 'fixed') return;
    
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
})();