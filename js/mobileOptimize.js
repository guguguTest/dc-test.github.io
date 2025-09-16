// mobileOptimizeFix.js - 修复移动端侧边栏问题的脚本
// 解决手机真机上侧边栏无法关闭和重复打开的问题
// 修复遮罩层不显示的问题

(function() {
    'use strict';
    
    // 防止重复初始化
    if (window.__mobileSidebarFixed) {
        console.log('[MobileFix] 已经初始化，跳过重复执行');
        return;
    }
    window.__mobileSidebarFixed = true;
    
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
            
            console.log('[SidebarManager] 开始初始化');
            
            // 获取DOM元素
            this.elements.sidebar = document.querySelector('.sidebar');
            this.elements.mobileToggle = document.querySelector('.mobile-toggle');
            
            if (!this.elements.sidebar || !this.elements.mobileToggle) {
                console.error('[SidebarManager] 必要元素未找到');
                return;
            }
            
            // 清理旧的元素和事件
            this.cleanup();
            
            // 创建遮罩层
            this.createOverlay();
            
            // 设置汉堡菜单
            this.setupHamburger();
            
            // 绑定事件
            this.bindEvents();
            
            // 设置初始状态
            this.resetState();
            
            this.initialized = true;
            console.log('[SidebarManager] 初始化完成');
        },
        
        // 清理旧元素
        cleanup: function() {
            // 移除PC端侧边栏折叠按钮
            const pcToggle = document.querySelector('.sidebar-toggle');
            if (pcToggle) {
                pcToggle.remove();
            }
            
            // 移除旧的遮罩层
            const oldOverlays = document.querySelectorAll('.sidebar-overlay');
            oldOverlays.forEach(overlay => overlay.remove());
            
            // 移除旧的事件监听器
            const oldMobileToggle = this.elements.mobileToggle;
            if (oldMobileToggle) {
                const newToggle = oldMobileToggle.cloneNode(true);
                oldMobileToggle.parentNode.replaceChild(newToggle, oldMobileToggle);
                this.elements.mobileToggle = newToggle;
            }
        },
        
        // 创建遮罩层
        createOverlay: function() {
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            // 移除内联样式，完全使用CSS类控制
            document.body.appendChild(overlay);
            this.elements.overlay = overlay;
            console.log('[SidebarManager] 遮罩层已创建');
        },
        
        // 设置汉堡菜单
        setupHamburger: function() {
            const toggle = this.elements.mobileToggle;
            if (!toggle) return;
            
            if (!toggle.querySelector('.hamburger')) {
                toggle.innerHTML = `
                    <div class="hamburger">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                `;
            }
            
            // 根据屏幕大小设置显示状态
            this.updateToggleVisibility();
        },
        
        // 更新汉堡菜单可见性
        updateToggleVisibility: function() {
            const toggle = this.elements.mobileToggle;
            if (!toggle) return;
            
            if (window.innerWidth > 992) {
                toggle.style.display = 'none';
            } else {
                toggle.style.display = 'flex';
            }
        },
        
        // 打开侧边栏
        open: function() {
            if (this.isOpen || this.isAnimating) return;
            if (window.innerWidth > 992) return;
            
            console.log('[SidebarManager] 打开侧边栏');
            
            this.isAnimating = true;
            this.scrollPosition = window.pageYOffset || 0;
            
            const { sidebar, overlay, mobileToggle, body } = this.elements;
            
            // 使用类名控制遮罩层显示
            overlay.classList.add('show');
            
            // 添加显示类
            sidebar.classList.add('show');
            mobileToggle.classList.add('active');
            body.classList.add('mobile-sidebar-open');
            
            // 锁定背景
            body.style.cssText = `
                position: fixed;
                top: -${this.scrollPosition}px;
                width: 100%;
                overflow: hidden;
            `;
            
            // 重置侧边栏滚动
            sidebar.scrollTop = 0;
            
            // 更新状态
            setTimeout(() => {
                this.isOpen = true;
                this.isAnimating = false;
                console.log('[SidebarManager] 侧边栏已打开');
            }, 300);
        },
        
        // 关闭侧边栏
        close: function() {
            if (!this.isOpen || this.isAnimating) return;
            
            console.log('[SidebarManager] 关闭侧边栏');
            
            this.isAnimating = true;
            
            const { sidebar, overlay, mobileToggle, body } = this.elements;
            
            // 使用类名控制遮罩层隐藏
            overlay.classList.remove('show');
            
            // 移除显示类
            sidebar.classList.remove('show');
            mobileToggle.classList.remove('active');
            body.classList.remove('mobile-sidebar-open');
            
            // 恢复背景滚动
            body.style.cssText = '';
            window.scrollTo(0, this.scrollPosition);
            
            // 更新状态
            setTimeout(() => {
                this.isOpen = false;
                this.isAnimating = false;
                console.log('[SidebarManager] 侧边栏已关闭');
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
                mobileToggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (window.innerWidth <= 992) {
                        self.toggle();
                    }
                }, false);
                console.log('[SidebarManager] 汉堡菜单事件已绑定');
            }
            
            // 遮罩层点击关闭
            if (overlay) {
                overlay.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.close();
                }, false);
                console.log('[SidebarManager] 遮罩层点击事件已绑定');
            }
            
            // 侧边栏链接点击关闭
            if (sidebar) {
                sidebar.addEventListener('click', function(e) {
                    const link = e.target.closest('a[data-page]');
                    if (link && window.innerWidth <= 992 && self.isOpen) {
                        setTimeout(() => self.close(), 150);
                    }
                }, false);
            }
            
            // 窗口大小改变事件
            let resizeTimer;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function() {
                    self.updateToggleVisibility();
                    
                    if (window.innerWidth > 992 && self.isOpen) {
                        self.close();
                    }
                }, 250);
            });
            
            // 防止滚动穿透
            if (sidebar) {
                sidebar.addEventListener('touchmove', function(e) {
                    if (!self.isOpen) return;
                    
                    const scrollTop = this.scrollTop;
                    const scrollHeight = this.scrollHeight;
                    const height = this.clientHeight;
                    const isScrollingUp = e.touches[0].clientY > (this._lastY || 0);
                    const isScrollingDown = !isScrollingUp;
                    
                    this._lastY = e.touches[0].clientY;
                    
                    if ((scrollTop <= 0 && isScrollingUp) || 
                        (scrollTop + height >= scrollHeight && isScrollingDown)) {
                        e.preventDefault();
                    }
                }, { passive: false });
                
                sidebar.addEventListener('touchstart', function(e) {
                    this._lastY = e.touches[0].clientY;
                }, { passive: true });
            }
            
            // 防止遮罩层下的内容被点击
            document.body.addEventListener('click', function(e) {
                if (self.isOpen && window.innerWidth <= 992) {
                    const isClickInSidebar = sidebar && sidebar.contains(e.target);
                    const isClickOnToggle = mobileToggle && mobileToggle.contains(e.target);
                    const isClickOnOverlay = overlay && overlay.contains(e.target);
                    
                    // 如果点击不在侧边栏、汉堡菜单或遮罩层上，阻止事件
                    if (!isClickInSidebar && !isClickOnToggle && !isClickOnOverlay) {
                        e.preventDefault();
                        e.stopPropagation();
                        // 关闭侧边栏
                        self.close();
                    }
                }
            }, true); // 使用捕获阶段
        },
        
        // 重置状态
        resetState: function() {
            const { sidebar, overlay, mobileToggle, body } = this.elements;
            
            if (window.innerWidth <= 992) {
                // 移动端：确保侧边栏关闭
                sidebar.classList.remove('show');
                overlay.classList.remove('show');
                mobileToggle.classList.remove('active');
                body.classList.remove('mobile-sidebar-open');
                body.style.cssText = '';
                
                this.isOpen = false;
            } else {
                // PC端：隐藏移动端控件
                mobileToggle.style.display = 'none';
                overlay.classList.remove('show');
            }
        }
    };
    
    // 初始化函数
    function initialize() {
        // 确保DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                SidebarManager.init();
            });
        } else {
            // DOM已加载，直接初始化
            setTimeout(() => SidebarManager.init(), 100);
        }
    }
    
    // 导出全局函数
    window.MobileSidebar = {
        open: () => SidebarManager.open(),
        close: () => SidebarManager.close(),
        toggle: () => SidebarManager.toggle(),
        isOpen: () => SidebarManager.isOpen
    };
    
    // 启动初始化
    initialize();
    
})();
