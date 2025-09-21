// datacenter.js - 主功能模块
document.addEventListener("DOMContentLoaded", function() {
    // 清理遮罩层函数
    function cleanupSidebarOverlays() {
        const overlays = document.querySelectorAll('#sidebar-overlay, .sidebar-overlay');
        overlays.forEach(overlay => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
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
            // 窗口大小改变时也清理可能残留的遮罩
            cleanupSidebarOverlays();
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
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            // 切换侧边栏显示状态
            sidebar.classList.toggle('show');
            
            // 移动端展开时添加特殊标记
            if (window.innerWidth <= 992) {
                if (sidebar.classList.contains('show')) {
                    // 打开侧边栏前先清理可能存在的旧遮罩
                    cleanupSidebarOverlays();
                    
                    document.body.classList.add('mobile-sidebar-open');
                    document.body.classList.remove('mobile-sidebar-closed');
                    
                    // 创建新的遮罩层
                    const overlay = document.createElement('div');
                    overlay.id = 'sidebar-overlay';
                    overlay.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        z-index: 940;
                        pointer-events: auto;
                    `;
                    document.body.appendChild(overlay);
                    
                    // 点击遮罩层关闭侧边栏
                    overlay.addEventListener('click', function() {
                        sidebar.classList.remove('show');
                        document.body.classList.remove('mobile-sidebar-open');
                        document.body.classList.add('mobile-sidebar-closed');
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
                e.target.id !== 'sidebar-overlay') {
                
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
            if (window.innerWidth <= 992 && sidebar.classList.contains('show')) {
                sidebar.classList.remove('show');
                document.body.classList.remove('mobile-sidebar-open');
                document.body.classList.add('mobile-sidebar-closed');
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