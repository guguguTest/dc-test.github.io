// 移动端滚动增强 - 支持地址栏自动隐藏
(function() {
  'use strict';
  
  // 检测是否为移动设备
  const isMobile = () => window.innerWidth <= 992;
  
  // 检测是否为iOS设备
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  // 清理所有遮罩层
  function cleanupOverlays() {
    const overlays = document.querySelectorAll('#sidebar-overlay, .sidebar-overlay');
    overlays.forEach(overlay => overlay.remove());
  }
  
  // 初始化移动端滚动优化
  function initMobileScrollOptimization() {
    if (!isMobile()) return;
    
    // 1. 确保页面可以滚动
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    
    // 2. 设置最小内容高度以触发滚动
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      const minHeight = window.innerHeight + 100;
      mainContent.style.minHeight = `${minHeight}px`;
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
      window.addEventListener('resize', updateViewportHeight);
    }
    
    // 5. 强制触发一次滚动以激活浏览器的自动隐藏
    setTimeout(() => {
      window.scrollTo(0, 1);
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    }, 300);
  }
  
  // 节流函数
  function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
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
      cleanupOverlays(); // 页面切换时清理遮罩
      const result = originalLoadPage.apply(this, args);
      setTimeout(initMobileScrollOptimization, 100);
      return result;
    };
  }
  
  // 窗口大小改变时重新初始化
  window.addEventListener('resize', throttle(() => {
    cleanupOverlays(); // 窗口改变时清理遮罩
    initMobileScrollOptimization();
  }, 250));
})();