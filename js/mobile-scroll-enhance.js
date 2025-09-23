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
  
  // 清理所有遮罩层
  function cleanupOverlays() {
    const overlays = document.querySelectorAll('#sidebar-overlay, .sidebar-overlay');
    overlays.forEach(overlay => overlay.remove());
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
      // 计算更合理的最小高度
      // 使用 visualViewport 获取更准确的视口高度（不包括浏览器UI）
      const viewportHeight = window.visualViewport ? 
        window.visualViewport.height : 
        window.innerHeight;
      
      // 添加额外的高度确保有滚动空间，但不要太多避免页面过长
      const minHeight = viewportHeight + 150;
      mainContent.style.minHeight = `${minHeight}px`;
      
      // 确保内容区域有适当的内边距
      if (isIOS()) {
        mainContent.style.paddingBottom = 'calc(20px + env(safe-area-inset-bottom, 0px))';
      } else {
        mainContent.style.paddingBottom = '20px';
      }
    }
    
    // 3. 先清理可能存在的旧遮罩
    cleanupOverlays();
    
    // 4. iOS特定修复
    if (isIOS()) {
      document.body.style.webkitOverflowScrolling = 'touch';
      
      function updateViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }
      
      updateViewportHeight();
      
      // 使用 visualViewport API 监听视口变化（iOS Safari支持）
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateViewportHeight);
      }
    }
    
    // 5. 只在首次加载时触发轻微滚动（不再强制回到顶部）
    // 检查是否是首次加载
    if (!window.__mobileScrollInitialized) {
      window.__mobileScrollInitialized = true;
      
      // 只有当页面在顶部时才触发滚动
      if (window.pageYOffset === 0) {
        setTimeout(() => {
          // 轻微向下滚动1像素来隐藏地址栏
          window.scrollTo(0, 1);
          // 不再自动滚回顶部，让用户决定滚动位置
        }, 500);
      }
    } else {
      // 非首次初始化时恢复滚动位置
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
  
  // 页面切换时重新初始化（优化版）
  if (typeof window.loadPage === 'function') {
    const originalLoadPage = window.loadPage;
    window.loadPage = function(...args) {
      // 保存当前滚动位置
      saveScrollPosition();
      
      cleanupOverlays(); // 页面切换时清理遮罩
      const result = originalLoadPage.apply(this, args);
      
      // 使用防抖避免频繁初始化
      setTimeout(() => {
        initMobileScrollOptimization();
      }, 200);
      
      return result;
    };
  }
  
  // 窗口大小改变时重新初始化（优化版）
  let resizeTimer;
  window.addEventListener('resize', () => {
    // 清除之前的定时器
    clearTimeout(resizeTimer);
    
    // 设置新的定时器，延迟执行
    resizeTimer = setTimeout(() => {
      cleanupOverlays();
      
      // 只在移动端重新初始化
      if (isMobile()) {
        initMobileScrollOptimization();
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
    // Android浏览器可能需要额外的处理
    document.addEventListener('touchmove', function(e) {
      // 确保触摸滚动正常工作
      if (e.touches.length === 1) {
        // 单指触摸，允许正常滚动
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
    
    // 清除之前的定时器
    clearTimeout(scrollEndTimer);
    
    // 检测是否滚动到底部
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      // 在底部时设置一个标记
      scrollEndTimer = setTimeout(() => {
        // 如果仍在底部，轻微向上滚动1像素防止某些浏览器的bug
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