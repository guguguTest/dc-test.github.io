// datacenter.js - 主功能模块（修复版）
document.addEventListener("DOMContentLoaded", function() {
    // 清理遮罩层函数 - 修改为只清理动态创建的遮罩
    function cleanupSidebarOverlays() {
        const overlays = document.querySelectorAll('.sidebar-overlay.dynamic-overlay');
        overlays.forEach(overlay => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
    }
    
    // 初始化时移除HTML中的静态遮罩层
    const staticOverlay = document.getElementById('sidebar-overlay');
    if (staticOverlay) {
        staticOverlay.remove();
    }
    
    // 获取DOM元素
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const mobileToggle = document.querySelector('.mobile-toggle');
    
    // 弹窗相关元素
    const modal = document.getElementById('about-modal');
    const modalClose = document.querySelector('.modal-close');
    const modalOk = document.getElementById('modal-ok');
    
    // 移动端隐藏PC折叠按钮
    if (window.innerWidth <= 992 && sidebarToggle) {
        sidebarToggle.style.display = 'none';
    }
    
    // 窗口大小改变时调整按钮显示
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 992) {
            if (sidebarToggle) sidebarToggle.style.display = 'none';
            // 窗口大小改变时清理动态遮罩
            cleanupSidebarOverlays();
            // 重置汉堡图标状态
            const hamburgerIcon = mobileToggle?.querySelector('.hamburger-icon');
            if (hamburgerIcon && !sidebar.classList.contains('show')) {
                hamburgerIcon.classList.remove('open');
            }
        } else {
            if (sidebarToggle) sidebarToggle.style.display = 'block';
            // PC模式下确保没有遮罩层
            cleanupSidebarOverlays();
        }
    });
    
    // 侧边栏折叠功能 - 只处理侧边栏和主内容区
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            // 移动端不处理折叠按钮点击
            if (window.innerWidth <= 992) return;
            
            sidebar.classList.toggle('collapsed');
            if (mainContent) {
                mainContent.classList.toggle('collapsed');
            }
            
            // 保存折叠状态
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }

// 移动端菜单切换功能
if (mobileToggle) {
    mobileToggle.addEventListener('click', function() {
        console.log('Mobile toggle clicked'); // 调试日志
        
        // 每次点击时重新获取汉堡图标元素（确保获取到最新的元素）
        let hamburgerIcon = mobileToggle.querySelector('.hamburger-icon');
        
        // 调试：检查是否找到汉堡图标
        console.log('Hamburger icon element:', hamburgerIcon);
        
        // 如果没有找到汉堡图标，创建一个
        if (!hamburgerIcon) {
            console.log('Creating hamburger icon...');
            
            // 检查是否有旧的Font Awesome图标
            const oldIcon = mobileToggle.querySelector('i');
            if (oldIcon) {
                console.log('Removing old Font Awesome icon');
                oldIcon.remove();
            }
            
            // 创建新的汉堡图标结构
            hamburgerIcon = document.createElement('span');
            hamburgerIcon.className = 'hamburger-icon';
            hamburgerIcon.innerHTML = '<span></span><span></span><span></span>';
            mobileToggle.appendChild(hamburgerIcon);
            
            console.log('Hamburger icon created');
        }
        
        // 切换侧边栏显示状态
        const wasOpen = sidebar.classList.contains('show');
        sidebar.classList.toggle('show');
        const isOpen = sidebar.classList.contains('show');
        
        console.log('Sidebar state - Was:', wasOpen, 'Now:', isOpen); // 调试日志
        
        // 切换汉堡图标动画 - 确保在正确的时机添加/移除类
        if (hamburgerIcon) {
            if (isOpen) {
                console.log('Adding open class to hamburger icon');
                hamburgerIcon.classList.add('open');
                // 强制重绘以确保动画生效
                void hamburgerIcon.offsetWidth;
            } else {
                console.log('Removing open class from hamburger icon');
                hamburgerIcon.classList.remove('open');
            }
            
            // 验证类是否正确添加
            console.log('Hamburger icon classes:', hamburgerIcon.className);
            console.log('Has open class?', hamburgerIcon.classList.contains('open'));
        }
        
        // 移动端展开时添加特殊标记
        if (window.innerWidth <= 992) {
            if (isOpen) {
                // 打开侧边栏前先清理可能存在的旧遮罩
                cleanupSidebarOverlays();
                
                document.body.classList.add('mobile-sidebar-open');
                document.body.classList.remove('mobile-sidebar-closed');
                
                // 创建新的遮罩层 - 添加动态标记
                const overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay dynamic-overlay show';
                overlay.style.cssText = `
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    background: rgba(0, 0, 0, 0.5) !important;
                    z-index: 899 !important;
                    display: block !important;
                    opacity: 1 !important;
                    pointer-events: auto !important;
                `;
                document.body.appendChild(overlay);
                
                // 强制重绘以确保动画效果
                overlay.offsetHeight;
                
                // 点击遮罩层关闭侧边栏
                overlay.addEventListener('click', function() {
                    console.log('Overlay clicked, closing sidebar');
                    
                    sidebar.classList.remove('show');
                    document.body.classList.remove('mobile-sidebar-open');
                    document.body.classList.add('mobile-sidebar-closed');
                    
                    // 恢复汉堡菜单图标 - 重新获取元素
                    const currentHamburgerIcon = mobileToggle.querySelector('.hamburger-icon');
                    if (currentHamburgerIcon) {
                        console.log('Removing open class from hamburger (overlay click)');
                        currentHamburgerIcon.classList.remove('open');
                    }
                    
                    cleanupSidebarOverlays();
                });
                
                // 修复：每次打开侧边栏时滚动到顶部，确保用户信息可见
                sidebar.scrollTop = 0;
            } else {
                // 关闭侧边栏时清理遮罩
                cleanupSidebarOverlays();
                document.body.classList.remove('mobile-sidebar-open');
                document.body.classList.add('mobile-sidebar-closed');
            }
        }
    });
}
    
    // 初始化折叠状态 - 只处理侧边栏和主内容区
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed && sidebar && window.innerWidth > 992) {
        sidebar.classList.add('collapsed');
        if (mainContent) {
            mainContent.classList.add('collapsed');
        }
    }
    
    // 弹窗功能
    // 显示弹窗
    document.addEventListener('click', function(e) {
        if (e.target.closest('#nav-about')) {
            e.preventDefault();
            if (modal) {
                modal.classList.add('show');
                
                // 确保弹窗内容使用当前语言
                if (typeof languageModule !== 'undefined') {
                    languageModule.initLanguage();
                }
            }
        }
    });

    // 关闭弹窗
    function closeModal() {
        if (modal) {
            modal.classList.remove('show');
        }
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    if (modalOk) {
        modalOk.addEventListener('click', closeModal);
    }

    // 点击外部关闭弹窗
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // 点击页面其他地方关闭侧边栏（移动端）
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 992 && 
            document.body.classList.contains('mobile-sidebar-open')) {
            
            // 检查点击是否在侧边栏或切换按钮外
            if (!sidebar.contains(e.target) && 
                !mobileToggle.contains(e.target) && 
                !e.target.classList.contains('sidebar-overlay')) {
                
                // 如果点击在外部，什么都不做（让遮罩层处理）
                return;
            }
        }
    });
    
    // 页面切换时清理遮罩
    if (typeof window.loadPage === 'function') {
        const originalLoadPage = window.loadPage;
        window.loadPage = function(...args) {
            // 页面切换时关闭侧边栏并清理遮罩
            if (window.innerWidth <= 992 && sidebar && sidebar.classList.contains('show')) {
                sidebar.classList.remove('show');
                document.body.classList.remove('mobile-sidebar-open');
                document.body.classList.add('mobile-sidebar-closed');
                // 恢复汉堡菜单图标
                const hamburgerIcon = mobileToggle?.querySelector('.hamburger-icon');
                if (hamburgerIcon) {
                    hamburgerIcon.classList.remove('open');
                }
                cleanupSidebarOverlays();
            }
            return originalLoadPage.apply(this, args);
        };
    }
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', function() {
        cleanupSidebarOverlays();
    });
});