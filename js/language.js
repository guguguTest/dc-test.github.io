// language.js - 多语言功能模块
const languageModule = (function() {
    // 设置页面语言
    function setLanguage(lang) {
        // 所有翻译文本
        const translations = {
            'zh-cn': {
                // 导航栏
                'navbar-brand': 'DATA CENTER',
                'nav-home-text': '返回EvilLeaker主页',
                'nav-download-text': 'N/A',
                'nav-about-text': '关于',
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
                
                // 弹窗文本
                'modal-title': '关于 EVIL LEAKER',
                'modal-content': '所有资源仅供学习交流使用，请勿用于商业用途。下载后请于24小时内删除。',
                'modal-ok': '确定',
                
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
                'navbar-brand': 'DATA CENTER',
                'nav-home-text': 'Home Page',
                'nav-download-text': 'Downloads',
                'nav-about-text': 'About',
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
                
                // 弹窗文本
                'modal-title': 'About EVIL LEAKER',
                'modal-content': 'All resources are for learning and exchange purposes only. Do not use for commercial purposes. Please delete within 24 hours after download.',
                'modal-ok': 'OK',
                
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
                'navbar-brand': 'DATA CENTER',
                'nav-home-text': 'ホームページ',
                'nav-download-text': 'N/A',
                'nav-about-text': 'について',
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
                
                // 弹窗文本
                'modal-title': 'EVIL LEAKER について',
                'modal-content': 'すべてのリソースは学習と交流目的のみで使用し、商用利用は禁止です。ダウンロード後24時間以内に削除してください。',
                'modal-ok': '確認',
                
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

        // 默认使用中文
        const langData = translations[lang] || translations['zh-cn'];
        
        // 更新所有文本元素
        for (const [id, text] of Object.entries(langData)) {
            const element = document.getElementById(id);
            if (element) {
                // 检查是否是HTML内容
                if (text.includes('<a') || id === 'modal-content') {
                    element.innerHTML = text;
                } else {
                    element.textContent = text;
                }
            }
        }
        
        // 处理类名为"click-detail"的元素
        const clickDetailElements = document.getElementsByClassName('click-detail');
        if (clickDetailElements.length > 0 && langData['click-detail']) {
            for (let i = 0; i < clickDetailElements.length; i++) {
                clickDetailElements[i].textContent = langData['click-detail'];
            }
        }
        
        // 更新公告标签文本
        document.querySelectorAll('.announcement-badge').forEach(badge => {
            const type = badge.getAttribute('data-type');
            if (langData[`badge-${type}`]) {
                badge.textContent = langData[`badge-${type}`];
            }
        });
        
        // 更新URL中的lang参数，不重新加载页面
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        window.history.replaceState(null, '', url);
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
    // 获取DOM元素
    const languageBtn = document.querySelector('.language-btn');
    const languageDropdown = document.querySelector('.language-dropdown');
    
    // 初始化语言
    languageModule.initLanguage();
    
    // 语言切换功能
    document.querySelectorAll('.language-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.getAttribute('href').split('=')[1];
            
            // 保存语言选择
            localStorage.setItem('language', lang);
            const rememberLanguage = localStorage.getItem('rememberLanguage') === 'true';
            if (rememberLanguage) {
                localStorage.setItem('savedLanguage', lang);
            }
            
            // 设置语言（不重新加载页面）
            languageModule.setLanguage(lang);
            
            // 关闭下拉菜单
            if (languageDropdown) {
                languageDropdown.classList.remove('show');
            }
        });
    });

    // 语言下拉菜单显示/隐藏功能
    if (languageBtn) {
        languageBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (languageDropdown) {
                languageDropdown.classList.toggle('show');
            }
        });
    }
    
    // 点击页面其他地方关闭下拉菜单
    document.addEventListener('click', function(e) {
        if (languageDropdown && languageDropdown.classList.contains('show')) {
            if (!e.target.closest('.language-selector')) {
                languageDropdown.classList.remove('show');
            }
        }
    });
});