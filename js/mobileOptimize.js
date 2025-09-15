// mobileFinalFix.js - 最终移动端修复脚本
// 这个脚本会在页面加载完成后执行，确保覆盖所有其他脚本的设置

(function() {
    'use strict';
    
    // 等待DOM和其他脚本加载完成
    function initMobileFix() {
        // 1. 强制隐藏PC端侧边栏开关按钮
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.style.display = 'none';
            sidebarToggle.style.visibility = 'hidden';
            sidebarToggle.remove(); // 直接移除元素
        }
        
        // 2. 获取必要元素
        const sidebar = document.querySelector('.sidebar');
        const mobileToggle = document.querySelector('.mobile-toggle');
        const body = document.body;
        let scrollPosition = 0;
        
        // 2.5 PC端完全隐藏汉堡菜单
        function updateMobileToggleVisibility() {
            if (mobileToggle) {
                if (window.innerWidth > 992) {
                    // PC端完全隐藏
                    mobileToggle.style.display = 'none';
                    mobileToggle.style.visibility = 'hidden';
                } else {
                    // 移动端显示
                    mobileToggle.style.display = 'flex';
                    mobileToggle.style.visibility = 'visible';
                }
            }
        }
        
        // 3. 创建或获取遮罩层
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }
        
        // 4. 设置汉堡菜单图标（仅移动端）
        function setupHamburger() {
            if (mobileToggle && window.innerWidth <= 992) {
                // 检查是否已经有汉堡菜单结构
                if (!mobileToggle.querySelector('.hamburger')) {
                    mobileToggle.innerHTML = `
                        <div class="hamburger">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    `;
                }
                mobileToggle.style.display = 'flex';
                mobileToggle.style.visibility = 'visible';
            } else if (mobileToggle && window.innerWidth > 992) {
                // PC端完全隐藏
                mobileToggle.style.display = 'none';
                mobileToggle.style.visibility = 'hidden';
            }
        }
        
        // 5. 打开侧边栏函数
        function openSidebar() {
            if (!sidebar || window.innerWidth > 992) return;
            
            scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            
            sidebar.classList.add('show');
            overlay.classList.add('show');
            if (mobileToggle) mobileToggle.classList.add('active');
            body.classList.add('mobile-sidebar-open');
            body.classList.remove('mobile-sidebar-closed');
            body.style.position = 'fixed';
            body.style.top = `-${scrollPosition}px`;
            body.style.width = '100%';
            
            sidebar.scrollTop = 0;
        }
        
        // 6. 关闭侧边栏函数
        function closeSidebar() {
            if (!sidebar) return;
            
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
            if (mobileToggle) mobileToggle.classList.remove('active');
            body.classList.remove('mobile-sidebar-open');
            body.classList.add('mobile-sidebar-closed');
            
            body.style.position = '';
            body.style.top = '';
            body.style.width = '';
            
            if (scrollPosition) {
                window.scrollTo(0, scrollPosition);
            }
        }
        
        // 7. 移除所有旧的事件监听器并添加新的
        if (mobileToggle) {
            // 克隆节点以移除所有旧的事件监听器
            const newMobileToggle = mobileToggle.cloneNode(true);
            mobileToggle.parentNode.replaceChild(newMobileToggle, mobileToggle);
            
            // 添加新的事件监听器
            newMobileToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (window.innerWidth <= 992) {
                    if (sidebar.classList.contains('show')) {
                        closeSidebar();
                    } else {
                        openSidebar();
                    }
                }
            });
        }
        
        // 8. 遮罩层点击关闭
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.innerWidth <= 992) {
                closeSidebar();
            }
        });
        
        // 9. 点击外部关闭（备用）
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 992 && 
                sidebar && sidebar.classList.contains('show') &&
                !sidebar.contains(e.target) &&
                !e.target.closest('.mobile-toggle')) {
                closeSidebar();
            }
        });
        
        // 10. 侧边栏内链接点击后关闭
        if (sidebar) {
            sidebar.addEventListener('click', function(e) {
                const link = e.target.closest('a[data-page]');
                if (link && window.innerWidth <= 992) {
                    setTimeout(() => {
                        closeSidebar();
                    }, 100);
                }
            });
        }
        
        // 11. 窗口大小改变处理
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                setupHamburger();
                updateMobileToggleVisibility();
                
                if (window.innerWidth > 992) {
                    // PC端清理移动端状态
                    closeSidebar();
                    overlay.classList.remove('show');
                }
                
                // 始终确保PC端没有侧边栏开关
                const toggle = document.querySelector('.sidebar-toggle');
                if (toggle) {
                    toggle.style.display = 'none';
                    toggle.remove();
                }
            }, 250);
        });
        
        // 12. 防止滚动穿透
        if (sidebar) {
            sidebar.addEventListener('touchmove', function(e) {
                if (window.innerWidth <= 992 && sidebar.classList.contains('show')) {
                    const scrollTop = sidebar.scrollTop;
                    const scrollHeight = sidebar.scrollHeight;
                    const height = sidebar.clientHeight;
                    const deltaY = e.touches[0].clientY - (sidebar._touchStart || e.touches[0].clientY);
                    
                    if ((scrollTop <= 0 && deltaY > 0) || 
                        (scrollTop + height >= scrollHeight && deltaY < 0)) {
                        e.preventDefault();
                    }
                }
            }, { passive: false });
            
            sidebar.addEventListener('touchstart', function(e) {
                this._touchStart = e.touches[0].clientY;
            }, { passive: true });
        }
        
        // 13. 初始化
        setupHamburger();
        updateMobileToggleVisibility();
        
        // 14. 确保初始状态正确
        if (window.innerWidth <= 992) {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
            body.classList.remove('mobile-sidebar-open');
            body.classList.add('mobile-sidebar-closed');
        } else {
            // PC端确保汉堡菜单隐藏
            if (mobileToggle) {
                mobileToggle.style.display = 'none';
                mobileToggle.style.visibility = 'hidden';
            }
        }
        
        // 15. 导出全局函数供其他模块使用
        window.closeMobileSidebar = closeSidebar;
    }
    
    // 确保在所有脚本加载后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initMobileFix, 100);
        });
    } else {
        setTimeout(initMobileFix, 100);
    }
    
    // 再次确保执行
    window.addEventListener('load', function() {
        setTimeout(initMobileFix, 200);
    });
})();