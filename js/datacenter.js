// datacenter.js - 主功能模块
document.addEventListener("DOMContentLoaded", function() {
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
        } else {
            if (sidebarToggle) sidebarToggle.style.display = 'block';
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
            sidebar.classList.toggle('show');
            
            // 移动端展开时添加特殊标记
            if (window.innerWidth <= 992) {
                document.body.classList.toggle('mobile-sidebar-open', sidebar.classList.contains('show'));
                document.body.classList.toggle('mobile-sidebar-closed', !sidebar.classList.contains('show'));
                
                // 修复：每次打开侧边栏时滚动到顶部，确保用户信息可见
                if (sidebar.classList.contains('show')) {
                    sidebar.scrollTop = 0;
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
    
    // 点击遮罩层关闭侧边栏
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 992 && 
            document.body.classList.contains('mobile-sidebar-open') && 
            e.target === document.body.querySelector('::after')) {
            sidebar.classList.remove('show');
            document.body.classList.remove('mobile-sidebar-open');
            document.body.classList.add('mobile-sidebar-closed');
        }
    });
});