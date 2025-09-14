// language.js - 优化后的多语言功能模块
const languageModule = (function() {
    // 缓存翻译数据，避免每次都创建
    const translationsCache = {
        'zh-cn': {
            // 导航栏
            'navbar-brand': 'EVIL LEAKER',
            'language-text': '语言',
            
            // 侧边栏
            'sidebar-home': '首页',
            'sidebar-data': '下载',
            'sidebar-settings': '设置',
            'sidebar-help': '帮助',
            'sidebar-game-download': '游戏下载',
            'sidebar-archive': '资源存档',
            'sidebar-tools': '实用工具',
            'sidebar-patcher': '补丁工具',
            'sidebar-fortune': '每日签到',
			//'sidebar-exchange': '兑换码',
            
            // 主内容-下载
            'download-heading': '下载',
            'game-heading': '游戏',
            'archive-heading': '资源存档',
            'other-heading': '其他资源',
            'warning-text': '重要提示：',
            'warning-detail': 'OneDrive下载渠道已下线',
            'latest-update-text': '最后更新',
            'latest-update-text-archive': '最后更新',
            'latest-update-text-other': '最后更新',
            'game-title': '游戏名称',
            'game-version': '版本',
            'game-files': '文件数',
            'archive-title': '游戏名称',
            'archive-filetype': '文件格式',
            'archive-version': '版本',
            'archive-files': '文件数',
            'other-title': '资源名称',
            'other-filetype': '文件格式',
            'other-files': '文件数',
            'download-all': '未使用',
            'download-info-text': '下载说明：',
            'download-info-detail': '目前本站全部资源仅提供「百度网盘」作为下载方式',
            'notice-text': '注意：',
            'notice-detail': '此页面暂为临时下载页面',
            
            // SPA新增翻译
            'back-to-home': '返回',
            'download-list-title': '下载列表',
            'last-update-label': '最后更新',
            'download-method': '下载方式',
            'file-count': '文件数',
            'access-code': '提取码/访问密码',
            'validity': '资源有效期',
            'unlimited': '无期限',
            'unlimited2': '无期限',
            'download-note': '本站全部资源仅提供',
            'resource-provider': '本站全部资源仅提供',
            'and': '与',
            'as-download': '作为下载方式',
            'temp-page-note': '此页面暂为临时下载页面',
            'temp-page-text': '此页面暂为临时下载页面',

            // 语言设置
            'option-title': '设置',
            'lang-option': '语言设置',
            'option-item': '记住语言偏好',
            'option-text': '下次访问时自动使用您选择的语言',
            'option-save': '保存',
            
            // 首页
            'top-page': '首页',
            'announcements-title': '最新公告',
            'click-detail': '查看详情',
            
            // 公告标签
            'badge-dgr': '重要',
            'badge-upd': '更新',
            'badge-notice': '通知'
        },

        'en-us': {
            // 导航栏
            'navbar-brand': 'EVIL LEAKER',
            'language-text': 'Language',

            // 侧边栏
            'sidebar-home': 'Top Page',
            'sidebar-data': 'Download',
            'sidebar-settings': 'Settings',
            'sidebar-help': 'Help',
            'sidebar-game-download': 'Game Downloads',
            'sidebar-archive': 'Archive',
            'sidebar-tools': 'Tools',
            'sidebar-patcher': 'Patcher',
            'sidebar-fortune': 'Daily Fortune',
			//'sidebar-exchange': 'Exchange',

            // 主内容-下载
            'download-heading': 'Download',
            'game-heading': 'Game Downloads',
            'archive-heading': 'Archive',
            'other-heading': 'Other',
            'warning-text': 'Important:',
            'warning-detail': 'The OneDrive download channel will be removed soon. Please download required resources as soon as possible.',
            'latest-update-text': 'Latest Update',
            'latest-update-text-archive': 'Latest Update',
            'latest-update-text-other': 'Latest Update',
            'game-title': 'Game Title',
            'game-version': 'Version',
            'game-files': 'Files',
            'archive-title': 'Game Title',
            'archive-filetype': 'File Type',
            'archive-version': 'Version',
            'archive-files': 'Files',
            'other-title': 'Resource Name',
            'other-filetype': 'File Type',
            'other-files': 'Files',
            'download-all': 'Download All Game Resources',
            'download-info-text': 'Download Info:',
            'download-info-detail': 'All resources on this site are only available via「Baidu Netdisk」</a>',
            'notice-text': 'Notice:',
            'notice-detail': 'This page is a temporary download page, the official page is under development',
            
            // SPA新增翻译
            'back-to-home': 'BACK',
            'download-list-title': 'Download List',
            'last-update-label': 'Last Update',
            'download-method': 'Download Method',
            'file-count': 'Files',
            'access-code': 'Access Code/Password',
            'validity': 'Validity',
            'unlimited': 'Unlimited',
            'unlimited2': 'Unlimited',
            'download-note': 'All resources are only available via',
            'resource-provider': 'All resources are only available via',
            'and': 'and',
            'as-download': 'as download methods',
            'temp-page-note': 'This is a temporary download page',
            'temp-page-text': 'This is a temporary download page',

            // 语言设置
            'option-title': 'Setting',
            'lang-option': 'Language Setting',
            'option-item': 'Remember language preference',
            'option-text': 'Use your selected language automatically next time',
            'option-save': 'SAVE',
            
            // 首页
            'top-page': 'Top Page',
            'announcements-title': 'Information',
            'click-detail': 'Details',
            
            // 公告标签
            'badge-dgr': 'IMPORTANT',
            'badge-upd': 'UPDATE',
            'badge-notice': 'NOTICE'
        },

        'ja-jp': {
            // 顶部导航栏
            'navbar-brand': 'EVIL LEAKER',
            'language-text': '言語',
            
            // 侧边栏
            'sidebar-home': 'トップページ',
            'sidebar-data': 'ダウンロード',
            'sidebar-settings': '設定',
            'sidebar-help': 'ヘルプ',
            'sidebar-game-download': 'ゲームダウンロード',
            'sidebar-archive': 'アーカイブ',
            'sidebar-tools': 'ツール',
            'sidebar-patcher': 'パッチツール',
            'sidebar-fortune': 'おみくじ',
			//'sidebar-exchange': '引き換えコード',
            
            // 下载页面
            'download-heading': 'ダウンロード',
            'game-heading': 'ゲーム',
            'archive-heading': 'アーカイブ',
            'other-heading': 'その他',
            'warning-text': '重要:',
            'warning-detail': 'OneDriveダウンロードは近日中に終了します。',
            'latest-update-text': '最終更新',
            'latest-update-text-archive': '最終更新',
            'latest-update-text-other': '最終更新',
            'game-title': 'ゲームタイトル',
            'game-version': 'バージョン',
            'game-files': 'ファイル数',
            'archive-title': 'ゲームタイトル',
            'archive-filetype': 'ファイル形式',
            'archive-version': 'バージョン',
            'archive-files': 'ファイル数',
            'other-title': 'リソース名',
            'other-filetype': 'ファイル形式',
            'other-files': 'ファイル数',
            'download-all': '未使用',
            'download-info-text': 'ダウンロード情報:',
            'download-info-detail': '当サイトのすべてのリソースは「百度网盘」でのみ提供されます',
            'notice-text': '注意:',
            'notice-detail': 'このページは一時的なダウンロードページです。公式ページは開発中です',
            
            // SPA新增翻译
            'back-to-home': '戻る',
            'download-list-title': 'ダウンロードリスト',
            'last-update-label': '最終更新',
            'download-method': 'ダウンロード方法',
            'file-count': 'ファイル数',
            'access-code': 'アクセスコード/パスワード',
            'validity': '有効期限',
            'unlimited': '無期限',
            'unlimited2': '無期限',
            'download-note': '当サイトのすべてのリソースは',
            'resource-provider': '当サイトのすべてのリソースは',
            'and': 'と',
            'as-download': 'でのみ提供されます',
            'temp-page-note': 'このページは一時的なダウンロードページです',
            'temp-page-text': 'このページは一時的なダウンロードページです',

            // 语言设置
            'option-title': 'システム設定',
            'lang-option': '言語設定',
            'option-item': '言語設定を記憶',
            'option-text': '次回から選択した言語を自動的に使用します',
            'option-save': 'セーブ',
            
            // 首页
            'top-page': 'トップページ',
            'announcements-title': 'ニュース',
            'click-detail': '詳しく',
            
            // 公告标签
            'badge-dgr': '重要なお知らせ',
            'badge-upd': 'アップデート',
            'badge-notice': 'お知らせ'
        }
    };

    // 缓存已经更新过的元素，避免重复查询DOM
    let elementCache = new Map();
    
    // 批量更新DOM的函数
    function batchUpdateDOM(updates) {
        // 使用 requestAnimationFrame 优化渲染
        requestAnimationFrame(() => {
            updates.forEach(({element, text, isHTML}) => {
                if (isHTML) {
                    element.innerHTML = text;
                } else {
                    element.textContent = text;
                }
            });
        });
    }

    // 设置页面语言
    function setLanguage(lang) {
        // 清空缓存
        elementCache.clear();
        
        // 获取语言数据
        const langData = translationsCache[lang] || translationsCache['zh-cn'];
        
        // 收集所有需要更新的元素
        const updates = [];
        
        // 更新所有文本元素
        for (const [id, text] of Object.entries(langData)) {
            // 使用缓存的元素引用，避免重复查询
            let element = elementCache.get(id);
            if (!element) {
                element = document.getElementById(id);
                if (element) {
                    elementCache.set(id, element);
                }
            }
            
            if (element) {
                const isHTML = text.includes('<a') || id === 'modal-content';
                updates.push({element, text, isHTML});
            }
        }
        
        // 批量更新DOM
        batchUpdateDOM(updates);
        
        // 处理类名为"click-detail"的元素
        const clickDetailElements = document.getElementsByClassName('click-detail');
        if (clickDetailElements.length > 0 && langData['click-detail']) {
            const clickDetailUpdates = [];
            for (let i = 0; i < clickDetailElements.length; i++) {
                clickDetailUpdates.push({
                    element: clickDetailElements[i],
                    text: langData['click-detail'],
                    isHTML: false
                });
            }
            batchUpdateDOM(clickDetailUpdates);
        }
        
        // 更新公告标签文本
        const badgeUpdates = [];
        document.querySelectorAll('.announcement-badge').forEach(badge => {
            const type = badge.getAttribute('data-type');
            if (langData[`badge-${type}`]) {
                badgeUpdates.push({
                    element: badge,
                    text: langData[`badge-${type}`],
                    isHTML: false
                });
            }
        });
        if (badgeUpdates.length > 0) {
            batchUpdateDOM(badgeUpdates);
        }
        
        // 更新URL中的lang参数，不重新加载页面
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        window.history.replaceState(null, '', url);
        
        // 保存语言设置到localStorage
        localStorage.setItem('language', lang);
        
        // 触发自定义事件，通知其他模块语言已更改
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }

    // 初始化语言
    function initLanguage() {
        // 获取URL中的语言参数
        const urlParams = new URLSearchParams(window.location.search);
        let lang = urlParams.get('lang');
        
        // 检查是否有记忆的语言设置
        const rememberLanguage = localStorage.getItem('rememberLanguage') === 'true';
        const savedLanguage = localStorage.getItem('savedLanguage');
        
        // 优先级：URL参数 > 记忆的语言 > 默认语言
        if (!lang && rememberLanguage && savedLanguage) {
            lang = savedLanguage;
        } else if (!lang) {
            lang = 'zh-cn'; // 默认语言
        }
        
        // 设置语言
        setLanguage(lang);
        
        // 保存当前语言（如果开启了记忆功能）
        if (rememberLanguage) {
            localStorage.setItem('savedLanguage', lang);
        }
    }

    // 公共API
    return {
        setLanguage,
        initLanguage
    };
})();

// 初始化多语言功能
document.addEventListener("DOMContentLoaded", function() {
    // 初始化语言
    languageModule.initLanguage();
    
    // 使用事件委托优化事件处理
    let isProcessing = false; // 防止重复处理
    
    document.addEventListener('click', function(e) {
        // 防止重复处理
        if (isProcessing) return;
        
        // 处理语言按钮点击
        const languageBtn = e.target.closest('.language-btn');
        if (languageBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            // 找到对应的下拉菜单
            const dropdown = languageBtn.nextElementSibling;
            if (dropdown && dropdown.classList.contains('language-dropdown')) {
                // 关闭其他所有下拉菜单
                document.querySelectorAll('.language-dropdown.show').forEach(d => {
                    if (d !== dropdown) {
                        d.classList.remove('show');
                    }
                });
                
                // 切换当前下拉菜单
                dropdown.classList.toggle('show');
            }
            return;
        }
        
        // 处理语言选项点击 - 重要：阻止页面刷新
        const languageItem = e.target.closest('.language-item');
        if (languageItem) {
            e.preventDefault();
            e.stopPropagation();
            
            isProcessing = true; // 设置处理标志
            
            const href = languageItem.getAttribute('href');
            if (href) {
                const lang = href.split('=')[1];
                
                // 显示加载提示（可选）
                const loadingEl = document.querySelector('.spa-loader');
                if (loadingEl) {
                    loadingEl.style.display = 'flex';
                }
                
                // 使用 setTimeout 确保UI更新
                setTimeout(() => {
                    // 保存语言选择
                    localStorage.setItem('language', lang);
                    const rememberLanguage = localStorage.getItem('rememberLanguage') === 'true';
                    if (rememberLanguage) {
                        localStorage.setItem('savedLanguage', lang);
                    }
                    
                    // 设置语言（不重新加载页面）
                    languageModule.setLanguage(lang);
                    
                    // 关闭所有下拉菜单
                    document.querySelectorAll('.language-dropdown.show').forEach(dropdown => {
                        dropdown.classList.remove('show');
                    });
                    
                    // 隐藏加载提示
                    if (loadingEl) {
                        loadingEl.style.display = 'none';
                    }
                    
                    isProcessing = false; // 重置处理标志
                }, 10);
            }
            return false; // 确保阻止默认行为
        }
        
        // 点击其他地方关闭所有语言下拉菜单
        if (!e.target.closest('.language-selector') && 
            !e.target.closest('.language-selector-mobile') && 
            !e.target.closest('.language-selector-pc') &&
            !e.target.closest('.language-dropdown')) {
            document.querySelectorAll('.language-dropdown.show').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    }, true); // 使用捕获阶段确保优先处理
    
    // 防止下拉菜单链接的默认行为
    document.querySelectorAll('.language-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            return false;
        }, true);
    });
});

// 监听设置页面的语言切换（如果需要）
window.addEventListener('languageChanged', function(e) {
    // 更新设置页面的语言选择器（如果存在）
    const languageSelect = document.getElementById('language-select');
    if (languageSelect && e.detail.language) {
        languageSelect.value = e.detail.language;
    }
});