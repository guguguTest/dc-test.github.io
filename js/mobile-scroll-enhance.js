// 移动端侧边栏完整修复
(function() {
    'use strict';
    
    let bodyScrollPosition = 0;
    let isInitialized = false;
    
    // 初始化侧边栏系统
    function initMobileSidebar() {
        if (isInitialized) return;
        isInitialized = true;
        
        const sidebar = document.querySelector('.sidebar');
        const mobileToggle = document.querySelector('.mobile-toggle');
        let overlay = document.getElementById('sidebar-overlay');
        
        if (!sidebar || !mobileToggle) return;
        
        // 确保遮罩层存在
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sidebar-overlay';
            overlay.className = 'sidebar-overlay';
            overlay.style.display = 'none';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.right = '0';
            overlay.style.bottom = '0';
            overlay.style.background = 'rgba(0, 0, 0, 0.5)';
            overlay.style.zIndex = '899';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            document.body.appendChild(overlay);
        }
        
        // 确保侧边栏可以滚动
        sidebar.style.overflowY = 'auto';
        sidebar.style.webkitOverflowScrolling = 'touch';
        
        // 移除所有旧的事件监听器
        const newMobileToggle = mobileToggle.cloneNode(true);
        mobileToggle.parentNode.replaceChild(newMobileToggle, mobileToggle);
        
        const newOverlay = overlay.cloneNode(true);
        overlay.parentNode.replaceChild(newOverlay, overlay);
        overlay = newOverlay;
        
        // 打开侧边栏函数
        function openSidebar() {
            // 保存滚动位置
            bodyScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            
            // 显示侧边栏
            sidebar.classList.add('show');
            
            // 显示遮罩层
            overlay.style.display = 'block';
            // 强制重排
            overlay.offsetHeight;
            overlay.style.opacity = '1';
            
            // 锁定背景滚动
            document.body.style.position = 'fixed';
            document.body.style.top = `-${bodyScrollPosition}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
        }
        
        // 关闭侧边栏函数
        function closeSidebar() {
            // 隐藏侧边栏
            sidebar.classList.remove('show');
            
            // 隐藏遮罩层
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
            
            // 恢复背景滚动
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            
            // 恢复滚动位置
            window.scrollTo(0, bodyScrollPosition);
        }
        
        // 菜单按钮点击事件
        newMobileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (sidebar.classList.contains('show')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
        
        // 遮罩层点击关闭
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeSidebar();
        });
        
        // 侧边栏内部链接点击后关闭（移动端）
        const sidebarLinks = sidebar.querySelectorAll('a[data-page], a[href]');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 992) {
                    setTimeout(() => {
                        closeSidebar();
                    }, 100);
                }
            });
        });
        
        // 防止侧边栏滚动影响背景
        sidebar.addEventListener('touchmove', function(e) {
            e.stopPropagation();
        }, { passive: true });
        
        // 监听窗口大小变化
        window.addEventListener('resize', function() {
            if (window.innerWidth > 992 && sidebar.classList.contains('show')) {
                closeSidebar();
            }
        });
    }
    
    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileSidebar);
    } else {
        setTimeout(initMobileSidebar, 100);
    }
    
    // 页面切换时重新初始化
    if (typeof window.loadPage === 'function') {
        const originalLoadPage = window.loadPage;
        window.loadPage = function(...args) {
            const result = originalLoadPage.apply(this, args);
            
            // 关闭侧边栏
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && sidebar.classList.contains('show')) {
                const overlay = document.getElementById('sidebar-overlay');
                
                sidebar.classList.remove('show');
                
                if (overlay) {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.style.display = 'none';
                    }, 300);
                }
                
                // 恢复滚动
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                window.scrollTo(0, bodyScrollPosition);
            }
            
            return result;
        };
    }
})();