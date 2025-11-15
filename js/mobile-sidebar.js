// 移动端侧边栏完整修复 - 合并优化版（支持汉堡图标动画）
(function() {
    'use strict';
    
    // 防止重复初始化
    if (window.__mobileSidebarInitialized) {
        return;
    }
    window.__mobileSidebarInitialized = true;
    
    // 全局状态管理器
    const SidebarManager = {
        isOpen: false,
        isAnimating: false,
        scrollPosition: 0,
        initialized: false,
        
        // DOM元素缓存
        elements: {
            sidebar: null,
            mobileToggle: null,
            overlay: null,
            body: document.body
        },
        
        // 初始化
        init: function() {
            if (this.initialized) return;
            
            // 获取DOM元素
            this.elements.sidebar = document.querySelector('.sidebar');
            this.elements.mobileToggle = document.querySelector('.mobile-toggle');
            
            if (!this.elements.sidebar || !this.elements.mobileToggle) {
                // 稍后重试
                setTimeout(() => this.init(), 500);
                return;
            }
            
            // 清理旧的元素和事件
            this.cleanup();
            
            // 创建或获取遮罩层
            this.setupOverlay();
            
            // 绑定事件
            this.bindEvents();
            
            // 设置初始状态
            this.resetState();
            
            // 修复动态视口高度（针对移动浏览器地址栏）
            this.setupViewportHeight();
            this.initialized = true;
        },
        
        // 清理旧元素
        cleanup: function() {
            // 移除PC端侧边栏折叠按钮（移动端不需要）
            const pcToggle = document.querySelector('.sidebar-toggle');
            if (pcToggle && window.innerWidth <= 992) {
                pcToggle.style.display = 'none';
            }
            
            // 移除旧的遮罩层
            const oldOverlays = document.querySelectorAll('.sidebar-overlay:not(#sidebar-overlay)');
            oldOverlays.forEach(overlay => overlay.remove());
        },
        
        // 设置遮罩层
        setupOverlay: function() {
            let overlay = document.getElementById('sidebar-overlay');
            
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'sidebar-overlay';
                overlay.className = 'sidebar-overlay';
                document.body.appendChild(overlay);
            }
            this.elements.overlay = overlay;
        },
        
        // 设置动态视口高度
        setupViewportHeight: function() {
            // 计算真实的视口高度（100vh在移动端可能包含地址栏）
            const setVH = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            };
            
            setVH();
            window.addEventListener('resize', setVH);
            window.addEventListener('orientationchange', setVH);
        },
        
        // 打开侧边栏
        open: function() {
            if (this.isOpen || this.isAnimating) return;
            if (window.innerWidth > 992) return;
            this.isAnimating = true;
            this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop || 0;
            
            const { sidebar, overlay, mobileToggle, body } = this.elements;
            
            // 添加显示类
            overlay.classList.add('show');
            sidebar.classList.add('show');
            if (mobileToggle) mobileToggle.classList.add('active');
            body.classList.add('mobile-sidebar-open');
            
            // 汉堡图标动画 - 变成X
            const hamburgerIcon = mobileToggle ? mobileToggle.querySelector('.hamburger-icon') : null;
            if (hamburgerIcon) {
                hamburgerIcon.classList.add('open');
            }
            
            // 锁定背景滚动（改进的方式）
            body.style.cssText = `
                position: fixed;
                top: -${this.scrollPosition}px;
                left: 0;
                right: 0;
                width: 100%;
                overflow: hidden;
            `;
            
            // 重置侧边栏滚动位置
            sidebar.scrollTop = 0;
            
            // 更新状态
            setTimeout(() => {
                this.isOpen = true;
                this.isAnimating = false;
            }, 300);
        },
        
        // 关闭侧边栏
        close: function() {
            if (!this.isOpen || this.isAnimating) return;
            this.isAnimating = true;
            const { sidebar, overlay, mobileToggle, body } = this.elements;
            
            // 移除显示类
            overlay.classList.remove('show');
            sidebar.classList.remove('show');
            if (mobileToggle) mobileToggle.classList.remove('active');
            body.classList.remove('mobile-sidebar-open');
            
            // 汉堡图标动画 - 变回三条线
            const hamburgerIcon = mobileToggle ? mobileToggle.querySelector('.hamburger-icon') : null;
            if (hamburgerIcon) {
                hamburgerIcon.classList.remove('open');
            }
            
            // 恢复背景滚动
            body.style.cssText = '';
            window.scrollTo(0, this.scrollPosition);
            
            // 更新状态
            setTimeout(() => {
                this.isOpen = false;
                this.isAnimating = false;
            }, 300);
        },
        
        // 切换侧边栏
        toggle: function() {
            if (this.isAnimating) return;
            
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },
        
        // 绑定事件
        bindEvents: function() {
            const self = this;
            const { mobileToggle, overlay, sidebar } = this.elements;
            
            // 汉堡菜单点击事件
            if (mobileToggle) {
                // 移除旧的监听器
                const newToggle = mobileToggle.cloneNode(true);
                mobileToggle.parentNode.replaceChild(newToggle, mobileToggle);
                this.elements.mobileToggle = newToggle;
                
                newToggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (window.innerWidth <= 992) {
                        self.toggle();
                    }
                }, false);

            }
            
            // 遮罩层点击关闭
            if (overlay) {
                overlay.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.close();
                }, false);

            }
            
            // 侧边栏链接点击后自动关闭（仅移动端）
            if (sidebar) {
                // 使用事件委托
                sidebar.addEventListener('click', function(e) {
                    const link = e.target.closest('a[data-page], a[href]');
                    if (link && window.innerWidth <= 992 && self.isOpen) {
                        // 延迟关闭以确保链接点击生效
                        setTimeout(() => self.close(), 150);
                    }
                }, false);
                
                // 防止侧边栏滚动传递到背景
                sidebar.addEventListener('touchmove', function(e) {
                    if (!self.isOpen) return;
                    e.stopPropagation();
                }, { passive: true });
            }
            
            // 窗口大小改变事件
            let resizeTimer;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function() {
                    // PC端自动关闭侧边栏
                    if (window.innerWidth > 992 && self.isOpen) {
                        self.close();
                    }
                    
                    // 移动端时确保汉堡图标可见
                    if (window.innerWidth <= 992 && self.elements.mobileToggle) {
                        self.elements.mobileToggle.style.display = 'flex';
                    }
                    
                    // 更新视口高度
                    const vh = window.innerHeight * 0.01;
                    document.documentElement.style.setProperty('--vh', `${vh}px`);
                }, 250);
            });
            
            // ESC键关闭侧边栏
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && self.isOpen) {
                    self.close();
                }
            });
            
            // 页面切换时关闭侧边栏（针对SPA）
            if (typeof window.loadPage === 'function') {
                const originalLoadPage = window.loadPage;
                window.loadPage = function(...args) {
                    // 关闭侧边栏
                    if (self.isOpen && window.innerWidth <= 992) {
                        self.close();
                    }
                    return originalLoadPage.apply(this, args);
                };
            }
        },
        
        // 重置状态
        resetState: function() {
            const { sidebar, overlay, mobileToggle, body } = this.elements;
            
            if (window.innerWidth <= 992) {
                // 移动端：确保侧边栏关闭
                sidebar.classList.remove('show');
                overlay.classList.remove('show');
                if (mobileToggle) {
                    mobileToggle.classList.remove('active');
                    mobileToggle.style.display = 'flex';
                    
                    // 重置汉堡图标
                    const hamburgerIcon = mobileToggle.querySelector('.hamburger-icon');
                    if (hamburgerIcon) {
                        hamburgerIcon.classList.remove('open');

                    }
                }
                body.classList.remove('mobile-sidebar-open');
                body.style.cssText = '';
                
                this.isOpen = false;
            } else {
                // PC端：隐藏移动端控件
                if (mobileToggle) mobileToggle.style.display = 'none';
                overlay.classList.remove('show');
                
                // 确保侧边栏显示
                sidebar.classList.remove('show');
                sidebar.style.transform = '';
            }
        }
    };
    
    // 初始化函数
    function initialize() {
        // 确保DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(() => SidebarManager.init(), 100);
            });
        } else {
            // DOM已加载，稍后初始化
            setTimeout(() => SidebarManager.init(), 100);
        }
    }
    
    // 导出全局API
    window.MobileSidebar = {
        open: () => SidebarManager.open(),
        close: () => SidebarManager.close(),
        toggle: () => SidebarManager.toggle(),
        isOpen: () => SidebarManager.isOpen,
        reinit: () => {
            SidebarManager.initialized = false;
            SidebarManager.init();
        }
    };
    
    // 启动初始化
    initialize();
    
    // 监听页面可见性变化（处理浏览器后退等情况）
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && SidebarManager.initialized) {
            SidebarManager.resetState();
        }
    });
    
})();