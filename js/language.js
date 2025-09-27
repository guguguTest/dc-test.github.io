// language.js - 优化后的多语言功能模块（使用data-i18n属性）
const languageModule = (function() {
    // 翻译数据
    const translations = {
        'zh-cn': {
            // 导航栏
            'navbar.brand': 'EVIL LEAKER',
            'navbar.language': '语言',
            
            // 侧边栏
            'sidebar.home': '首页',
            'sidebar.download': '下载',
            'sidebar.settings': '设置',
            'sidebar.help': '帮助',
            'sidebar.tools': '实用工具',
            'sidebar.patcher': '补丁工具',
            'sidebar.fortune': '每日签到',
            'sidebar.ccb': '游戏查分',
            'sidebar.exchange': '兑换码',
            'sidebar.pointShop': '积分商店',
            'sidebar.functions': '功能',
            'sidebar.admin': '管理',
            'sidebar.userManager': '用户管理',
            'sidebar.announcementAdmin': '公告管理',
            'sidebar.siteAdmin': '网站管理',
            'sidebar.downloadAdmin': '下载管理',
            'sidebar.pointsShopAdmin': '积分商品管理',
            'sidebar.point2ShopAdmin': '鸽屋积分商品管理',
            'sidebar.creditShopAdmin': 'CREDIT点数商品管理',
            'sidebar.orderEntry': '订单录入',
            
            // 用户区域
            'user.login': '登录',
            'user.register': '注册',
            'user.logout': '退出登录',
            'user.settings': '用户设置',
            'user.normalUser': '普通用户',
            'user.points': '积分',
            'user.credit': 'CREDIT',
            
            // 首页
            'home.title': '首页',
            'home.welcome': 'MAY THE LEAKER BE WITH YOU!',
            'home.selectFunction': '请从左侧菜单选择功能',
            'home.announcementsLoading': '公告加载中...',
            
            // 用户管理
            'userManager.title': '用户管理',
            'userManager.search': '搜索',
            'userManager.searchPlaceholder': '搜索用户ID、用户名或邮箱...',
            'userManager.allGroups': '所有用户组',
            'userManager.normalUser': '普通用户',
            'userManager.juniorUser': '初级用户',
            'userManager.middleUser': '中级用户',
            'userManager.seniorUser': '高级用户',
            'userManager.vipUser': '贵宾用户',
            'userManager.admin': '系统管理员',
            'userManager.allStatus': '所有状态',
            'userManager.normal': '正常',
            'userManager.restricted': '受限',
            'userManager.banned': '封禁',
            'userManager.avatar': '头像',
            'userManager.uid': 'UID',
            'userManager.username': '用户名',
            'userManager.email': '邮箱',
            'userManager.userGroup': '用户组',
            'userManager.specialGroup': '特殊用户组',
            'userManager.points': '积分',
            'userManager.point2': '鸽屋积分',
            'userManager.gameServer': '游戏服务器',
            'userManager.status': '状态',
            'userManager.actions': '操作',
            
            // 下载中心
            'download.title': '下载中心',
            'download.gameDownload': '游戏下载',
            'download.archiveDownload': '存档下载',
            'download.otherResources': '其他资源',
            'download.warning': '重要提示：',
            'download.warningDetail': 'OneDrive下载渠道已下线',
            'download.lastUpdate': '最后更新',
            'download.downloadInfo': '下载说明：',
            'download.downloadInfoDetail': '目前本站全部资源仅提供「百度网盘」作为下载方式',
            'download.backToDownload': '返回下载中心',
            'download.downloadList': '下载列表',
            'download.downloadMethod': '下载方式',
            'download.fileCount': '文件数',
            'download.accessCode': '提取码/访问密码',
            'download.validity': '资源有效期',
            'download.unlimited': '无期限',
            
            // 下载管理
            'downloadAdmin.title': '下载管理',
            'downloadAdmin.create': '新建下载项目',
            'downloadAdmin.serialNumber': '序号',
            'downloadAdmin.title2': '标题',
            'downloadAdmin.category': '分类',
            'downloadAdmin.pageId': '页面ID',
            'downloadAdmin.version': '版本',
            'downloadAdmin.fileCount': '文件数',
            'downloadAdmin.lastUpdate': '最后更新',
            'downloadAdmin.status': '状态',
            'downloadAdmin.actions': '操作',
            'downloadAdmin.modalTitle': '新建下载项目',
            'downloadAdmin.basicInfo': '基本信息',
            'downloadAdmin.required': '*',
            'downloadAdmin.categoryGame': '游戏下载',
            'downloadAdmin.categoryArchive': '存档下载',
            'downloadAdmin.categoryOther': '其他资源',
            'downloadAdmin.pageIdHint': '唯一标识符，用于URL访问',
            'downloadAdmin.downloadLinks': '下载链接',
            'downloadAdmin.addLink': '添加链接',
            'downloadAdmin.permissions': '权限设置',
            'downloadAdmin.accessLevel': '访问权限',
            'downloadAdmin.unlimited': '不限',
            'downloadAdmin.specialGroupHint': '留空表示无限制',
            'downloadAdmin.requiredPoints': '所需积分',
            'downloadAdmin.otherInfo': '其他信息',
            'downloadAdmin.active': '激活',
            'downloadAdmin.disabled': '禁用',
            'downloadAdmin.imageUrl': '图片URL',
            'downloadAdmin.description': '描述',
            'downloadAdmin.cancel': '取消',
            'downloadAdmin.save': '保存',
            
            // 公告管理
            'announcementAdmin.title': '公告管理',
            'announcementAdmin.create': '新建公告',
            'announcementAdmin.editorTitle': '新建公告',
            'announcementAdmin.announcementTitle': '标题',
            'announcementAdmin.type': '类型',
            'announcementAdmin.typeNotice': '通知',
            'announcementAdmin.typeImportant': '重要',
            'announcementAdmin.typeUpdate': '更新',
            'announcementAdmin.typeTop': '置顶',
            'announcementAdmin.pinned': '置顶公告',
            'announcementAdmin.content': '内容',
            'announcementAdmin.save': '保存',
            'announcementAdmin.cancel': '取消',
            'announcementAdmin.loading': '公告加载中...',
            
            // 订单录入
            'orderEntry.title': '订单录入管理',
            'orderEntry.back': '返回首页',
            'orderEntry.searchPlaceholder': '输入淘宝ID、商品名称或订单号搜索...',
            'orderEntry.search': '搜索',
            'orderEntry.add': '添加订单',
            'orderEntry.serialNumber': '序号',
            'orderEntry.taobaoId': '淘宝ID',
            'orderEntry.productName': '商品名称',
            'orderEntry.orderNumber': '订单号',
            'orderEntry.price': '价格(元)',
            'orderEntry.status': '兑换状态',
            'orderEntry.actions': '操作',
            'orderEntry.modalAdd': '添加订单',
            'orderEntry.modalEdit': '编辑订单',
            'orderEntry.taobaoIdPlaceholder': '请输入淘宝用户ID',
            'orderEntry.productNamePlaceholder': '请输入商品名称',
            'orderEntry.orderNumberPlaceholder': '请输入订单号（唯一）',
            'orderEntry.unredeemed': '未兑换',
            'orderEntry.redeemed': '已兑换',
            'orderEntry.saveOrder': '保存订单',
            
            // 兑换页面
            'exchange.title': '兑换码',
            'exchange.back': '返回',
            'exchange.code': '兑换码',
            'exchange.codeDescription': '请输入兑换码进行兑换',
            'exchange.codePlaceholder': '请输入兑换码',
            'exchange.redeem': '兑换',
            'exchange.redemptionHistory': '兑换记录',
            'exchange.or': '或',
            'exchange.points': '鸽屋积分兑换',
            'exchange.pointsDescription': '请输入淘宝订单号兑换积分',
            'exchange.orderPlaceholder': '请输入淘宝订单号',
            
            // 登录注册
            'auth.login': '登录',
            'auth.register': '注册',
            'auth.back': '返回',
            'auth.usernameOrEmail': '用户名或邮箱',
            'auth.password': '密码',
            'auth.confirmPassword': '确认密码',
            'auth.username': '用户名',
            'auth.email': '邮箱',
            'auth.nickname': '昵称',
            'auth.verificationCode': '验证码',
            'auth.getVerificationCode': '获取验证码',
            'auth.loginNow': '立即登录',
            'auth.registerNow': '立即注册',
            'auth.noAccount': '没有账号？',
            'auth.hasAccount': '已有账号？',
            'auth.forgotPassword': '忘记密码？',
            'auth.resetPassword': '找回密码',
            'auth.newPassword': '新密码',
            'auth.verify': '验证',
            
            // 用户设置
            'userSettings.title': '用户设置',
            'userSettings.profile': '个人信息',
            'userSettings.pointsInfo': '积分信息',
            'userSettings.security': '安全设置',
            'userSettings.binding': '绑定管理',
            'userSettings.privacy': '隐私设置',
            'userSettings.basicInfo': '基本信息',
            'userSettings.username': '用户名',
            'userSettings.email': '邮箱',
            'userSettings.setNickname': '设置昵称',
            'userSettings.nicknamePlaceholder': '设置您的昵称',
            'userSettings.saveProfile': '保存个人信息',
            'userSettings.pointsStats': '积分统计',
            'userSettings.totalPoints': '总积分',
            'userSettings.normalPoints': '普通积分',
            'userSettings.point2': '鸽屋积分',
            'userSettings.creditPoints': 'CREDIT点数',
            'userSettings.changePassword': '修改密码',
            'userSettings.currentPassword': '当前密码',
            'userSettings.newPassword': '新密码',
            'userSettings.confirmNewPassword': '确认新密码',
            'userSettings.updatePassword': '更新密码',
            'userSettings.ccbBinding': '查分绑定信息',
            'userSettings.server': '服务器',
            'userSettings.cardNumber': '游戏卡号',
            'userSettings.unbindCcb': '解绑查分信息',
            'userSettings.noCcbBinding': '暂无查分绑定',
            'userSettings.goToBind': '前往绑定',
            'userSettings.shippingInfo': '收货绑定信息',
            'userSettings.recipient': '收件人',
            'userSettings.phone': '联系电话',
            'userSettings.address': '收货地址',
            'userSettings.unbindShipping': '解绑收货信息',
            'userSettings.noShippingBinding': '暂无收货绑定',
            'userSettings.needBindingForShop': '需要先绑定收货信息才能使用积分商城',
            'userSettings.privacySettings': '隐私设置',
            'userSettings.searchBy': '允许通过以下方式被搜索',
            'userSettings.messageReceive': '消息接收设置',
            'userSettings.receiveAll': '接收所有人的消息',
            'userSettings.receiveFriendsOnly': '仅接收好友的消息',
            'userSettings.receiveNone': '不接收任何消息',
            'userSettings.savePrivacy': '保存隐私设置',
            
            // 每日签到
            'fortune.title': '每日签到',
            'fortune.backHome': '返回主页',
            'fortune.todayFortune': '今日运势',
            'fortune.suitable': '宜：',
            'fortune.unsuitable': '不宜：',
            'fortune.signin': '签到',
            
            // 帮助中心
            'help.title': '帮助中心',
            'help.back': '返回',
            'help.downloadGuide': '下载指南',
            'help.toolsGuide': '实用工具指南',
            'help.patchGuide': '补丁工具指南',
            'help.faq': '常见问题',
            'help.settingsGuide': '设置说明',
            'help.dataManagement': '数据管理',
            
            // 设置页面
            'settings.title': '设置',
            'settings.back': '返回',
            'settings.language': '语言设置',
            'settings.interfaceLanguage': '界面语言',
            'settings.rememberLanguage': '记住语言偏好',
            'settings.rememberLanguageDesc': '下次访问时自动使用您选择的语言',
            'settings.emojiCache': '表情缓存管理',
            'settings.cachedEmoji': '已缓存表情',
            'settings.cachedAudio': '已缓存音频',
            'settings.messageImages': '消息图片',
            'settings.cacheSize': '缓存大小',
            'settings.used': '已使用',
            'settings.refreshStats': '刷新统计',
            'settings.cleanOldCache': '清理旧缓存',
            'settings.clearAllCache': '清空所有缓存',
            'settings.autoCleanCache': '自动清理过期缓存',
            'settings.preloadEmoji': '预加载常用表情和音频',
            'settings.cursorStyle': '鼠标样式',
            'settings.cursorHint': '鼠标样式设置仅在桌面设备上生效',
            'settings.cursorDesc': '选择您喜欢的鼠标指针样式，让浏览体验更加个性化',
            'settings.cursorLoadingHint': '提示：自定义鼠标样式需要加载额外资源，首次使用可能需要几秒钟加载',
            'settings.saveSettings': '保存设置',
            'settings.cursorDefault': '默认',
            'settings.cursorDefaultDesc': '系统默认鼠标',
            'settings.cursorCustom1': '井盖',
            'settings.cursorCustom1Desc': '个性化鼠标样式',
            'settings.cursorCustom2': 'まひろ',
            'settings.cursorCustom2Desc': '可爱风格鼠标',
            
            // 通用按钮和操作
            'common.back': '返回',
            'common.save': '保存',
            'common.cancel': '取消',
            'common.edit': '编辑',
            'common.delete': '删除',
            'common.confirm': '确认',
            'common.search': '搜索',
            'common.loading': '加载中...',
            'common.noData': '暂无数据',
            'common.success': '操作成功',
            'common.failed': '操作失败',
            'common.error': '发生错误',
            
            // Footer
            'footer.text1': 'SEGAY FEIWU',
            'footer.text2': '1145141919810'
        },
        
        'en-us': {
            // 导航栏
            'navbar.brand': 'EVIL LEAKER',
            'navbar.language': 'Language',
            
            // 侧边栏
            'sidebar.home': 'Home',
            'sidebar.download': 'Download',
            'sidebar.settings': 'Settings',
            'sidebar.help': 'Help',
            'sidebar.tools': 'Tools',
            'sidebar.patcher': 'Patcher',
            'sidebar.fortune': 'Daily Fortune',
            'sidebar.ccb': 'Game Score',
            'sidebar.exchange': 'Exchange',
            'sidebar.pointShop': 'Point Shop',
            'sidebar.functions': 'Functions',
            'sidebar.admin': 'Admin',
            'sidebar.userManager': 'User Manager',
            'sidebar.announcementAdmin': 'Announcement Admin',
            'sidebar.siteAdmin': 'Site Admin',
            'sidebar.downloadAdmin': 'Download Admin',
            'sidebar.pointsShopAdmin': 'Points Shop Admin',
            'sidebar.point2ShopAdmin': 'Point2 Shop Admin',
            'sidebar.creditShopAdmin': 'Credit Shop Admin',
            'sidebar.orderEntry': 'Order Entry',
            
            // 用户区域
            'user.login': 'Login',
            'user.register': 'Register',
            'user.logout': 'Logout',
            'user.settings': 'User Settings',
            'user.normalUser': 'Normal User',
            'user.points': 'Points',
            'user.credit': 'CREDIT',
            
            // 首页
            'home.title': 'Home',
            'home.welcome': 'MAY THE LEAKER BE WITH YOU!',
            'home.selectFunction': 'Please select a function from the left menu',
            'home.announcementsLoading': 'Loading announcements...',
            
            // 用户管理
            'userManager.title': 'User Manager',
            'userManager.search': 'Search',
            'userManager.searchPlaceholder': 'Search user ID, username or email...',
            'userManager.allGroups': 'All Groups',
            'userManager.normalUser': 'Normal User',
            'userManager.juniorUser': 'Junior User',
            'userManager.middleUser': 'Middle User',
            'userManager.seniorUser': 'Senior User',
            'userManager.vipUser': 'VIP User',
            'userManager.admin': 'System Admin',
            'userManager.allStatus': 'All Status',
            'userManager.normal': 'Normal',
            'userManager.restricted': 'Restricted',
            'userManager.banned': 'Banned',
            'userManager.avatar': 'Avatar',
            'userManager.uid': 'UID',
            'userManager.username': 'Username',
            'userManager.email': 'Email',
            'userManager.userGroup': 'User Group',
            'userManager.specialGroup': 'Special Group',
            'userManager.points': 'Points',
            'userManager.point2': 'Point2',
            'userManager.gameServer': 'Game Server',
            'userManager.status': 'Status',
            'userManager.actions': 'Actions',
            
            // 下载中心
            'download.title': 'Download Center',
            'download.gameDownload': 'Game Download',
            'download.archiveDownload': 'Archive Download',
            'download.otherResources': 'Other Resources',
            'download.warning': 'Important:',
            'download.warningDetail': 'OneDrive download channel has been offline',
            'download.lastUpdate': 'Last Update',
            'download.downloadInfo': 'Download Info:',
            'download.downloadInfoDetail': 'All resources are only available via Baidu Netdisk',
            'download.backToDownload': 'Back to Download',
            'download.downloadList': 'Download List',
            'download.downloadMethod': 'Download Method',
            'download.fileCount': 'File Count',
            'download.accessCode': 'Access Code',
            'download.validity': 'Validity',
            'download.unlimited': 'Unlimited',
            
            // 下载管理
            'downloadAdmin.title': 'Download Admin',
            'downloadAdmin.create': 'Create Download',
            'downloadAdmin.serialNumber': 'No.',
            'downloadAdmin.title2': 'Title',
            'downloadAdmin.category': 'Category',
            'downloadAdmin.pageId': 'Page ID',
            'downloadAdmin.version': 'Version',
            'downloadAdmin.fileCount': 'Files',
            'downloadAdmin.lastUpdate': 'Last Update',
            'downloadAdmin.status': 'Status',
            'downloadAdmin.actions': 'Actions',
            'downloadAdmin.modalTitle': 'New Download',
            'downloadAdmin.basicInfo': 'Basic Info',
            'downloadAdmin.required': '*',
            'downloadAdmin.categoryGame': 'Game Download',
            'downloadAdmin.categoryArchive': 'Archive',
            'downloadAdmin.categoryOther': 'Other',
            'downloadAdmin.pageIdHint': 'Unique identifier for URL access',
            'downloadAdmin.downloadLinks': 'Download Links',
            'downloadAdmin.addLink': 'Add Link',
            'downloadAdmin.permissions': 'Permissions',
            'downloadAdmin.accessLevel': 'Access Level',
            'downloadAdmin.unlimited': 'Unlimited',
            'downloadAdmin.specialGroupHint': 'Leave empty for no restriction',
            'downloadAdmin.requiredPoints': 'Required Points',
            'downloadAdmin.otherInfo': 'Other Info',
            'downloadAdmin.active': 'Active',
            'downloadAdmin.disabled': 'Disabled',
            'downloadAdmin.imageUrl': 'Image URL',
            'downloadAdmin.description': 'Description',
            'downloadAdmin.cancel': 'Cancel',
            'downloadAdmin.save': 'Save',
            
            // 公告管理
            'announcementAdmin.title': 'Announcement Admin',
            'announcementAdmin.create': 'Create Announcement',
            'announcementAdmin.editorTitle': 'New Announcement',
            'announcementAdmin.announcementTitle': 'Title',
            'announcementAdmin.type': 'Type',
            'announcementAdmin.typeNotice': 'Notice',
            'announcementAdmin.typeImportant': 'Important',
            'announcementAdmin.typeUpdate': 'Update',
            'announcementAdmin.typeTop': 'Pinned',
            'announcementAdmin.pinned': 'Pin Announcement',
            'announcementAdmin.content': 'Content',
            'announcementAdmin.save': 'Save',
            'announcementAdmin.cancel': 'Cancel',
            'announcementAdmin.loading': 'Loading announcements...',
            
            // 订单录入
            'orderEntry.title': 'Order Entry Manager',
            'orderEntry.back': 'Back to Home',
            'orderEntry.searchPlaceholder': 'Search by Taobao ID, product name or order number...',
            'orderEntry.search': 'Search',
            'orderEntry.add': 'Add Order',
            'orderEntry.serialNumber': 'No.',
            'orderEntry.taobaoId': 'Taobao ID',
            'orderEntry.productName': 'Product Name',
            'orderEntry.orderNumber': 'Order Number',
            'orderEntry.price': 'Price(¥)',
            'orderEntry.status': 'Redeem Status',
            'orderEntry.actions': 'Actions',
            'orderEntry.modalAdd': 'Add Order',
            'orderEntry.modalEdit': 'Edit Order',
            'orderEntry.taobaoIdPlaceholder': 'Enter Taobao User ID',
            'orderEntry.productNamePlaceholder': 'Enter Product Name',
            'orderEntry.orderNumberPlaceholder': 'Enter Order Number (Unique)',
            'orderEntry.unredeemed': 'Unredeemed',
            'orderEntry.redeemed': 'Redeemed',
            'orderEntry.saveOrder': 'Save Order',
            
            // 兑换页面
            'exchange.title': 'Exchange',
            'exchange.back': 'Back',
            'exchange.code': 'Exchange Code',
            'exchange.codeDescription': 'Please enter exchange code',
            'exchange.codePlaceholder': 'Enter exchange code',
            'exchange.redeem': 'Redeem',
            'exchange.redemptionHistory': 'Redemption History',
            'exchange.or': 'OR',
            'exchange.points': 'Points Exchange',
            'exchange.pointsDescription': 'Enter Taobao order number to exchange points',
            'exchange.orderPlaceholder': 'Enter Taobao order number',
            
            // 登录注册
            'auth.login': 'Login',
            'auth.register': 'Register',
            'auth.back': 'Back',
            'auth.usernameOrEmail': 'Username or Email',
            'auth.password': 'Password',
            'auth.confirmPassword': 'Confirm Password',
            'auth.username': 'Username',
            'auth.email': 'Email',
            'auth.nickname': 'Nickname',
            'auth.verificationCode': 'Verification Code',
            'auth.getVerificationCode': 'Get Code',
            'auth.loginNow': 'Login Now',
            'auth.registerNow': 'Register Now',
            'auth.noAccount': "Don't have account?",
            'auth.hasAccount': 'Already have account?',
            'auth.forgotPassword': 'Forgot password?',
            'auth.resetPassword': 'Reset Password',
            'auth.newPassword': 'New Password',
            'auth.verify': 'Verify',
            
            // 用户设置
            'userSettings.title': 'User Settings',
            'userSettings.profile': 'Profile',
            'userSettings.pointsInfo': 'Points Info',
            'userSettings.security': 'Security',
            'userSettings.binding': 'Binding',
            'userSettings.privacy': 'Privacy',
            'userSettings.basicInfo': 'Basic Info',
            'userSettings.username': 'Username',
            'userSettings.email': 'Email',
            'userSettings.setNickname': 'Set Nickname',
            'userSettings.nicknamePlaceholder': 'Set your nickname',
            'userSettings.saveProfile': 'Save Profile',
            'userSettings.pointsStats': 'Points Stats',
            'userSettings.totalPoints': 'Total Points',
            'userSettings.normalPoints': 'Normal Points',
            'userSettings.point2': 'Point2',
            'userSettings.creditPoints': 'CREDIT Points',
            'userSettings.changePassword': 'Change Password',
            'userSettings.currentPassword': 'Current Password',
            'userSettings.newPassword': 'New Password',
            'userSettings.confirmNewPassword': 'Confirm New Password',
            'userSettings.updatePassword': 'Update Password',
            'userSettings.ccbBinding': 'CCB Binding Info',
            'userSettings.server': 'Server',
            'userSettings.cardNumber': 'Card Number',
            'userSettings.unbindCcb': 'Unbind CCB',
            'userSettings.noCcbBinding': 'No CCB Binding',
            'userSettings.goToBind': 'Go to Bind',
            'userSettings.shippingInfo': 'Shipping Info',
            'userSettings.recipient': 'Recipient',
            'userSettings.phone': 'Phone',
            'userSettings.address': 'Address',
            'userSettings.unbindShipping': 'Unbind Shipping',
            'userSettings.noShippingBinding': 'No Shipping Binding',
            'userSettings.needBindingForShop': 'Need to bind shipping info before using point shop',
            'userSettings.privacySettings': 'Privacy Settings',
            'userSettings.searchBy': 'Allow to be searched by',
            'userSettings.messageReceive': 'Message Receive Settings',
            'userSettings.receiveAll': 'Receive messages from everyone',
            'userSettings.receiveFriendsOnly': 'Receive messages from friends only',
            'userSettings.receiveNone': 'Do not receive any messages',
            'userSettings.savePrivacy': 'Save Privacy',
            
            // 每日签到
            'fortune.title': 'Daily Sign-in',
            'fortune.backHome': 'Back to Home',
            'fortune.todayFortune': "Today's Fortune",
            'fortune.suitable': 'Suitable:',
            'fortune.unsuitable': 'Unsuitable:',
            'fortune.signin': 'Sign in',
            
            // 帮助中心
            'help.title': 'Help Center',
            'help.back': 'Back',
            'help.downloadGuide': 'Download Guide',
            'help.toolsGuide': 'Tools Guide',
            'help.patchGuide': 'Patch Guide',
            'help.faq': 'FAQ',
            'help.settingsGuide': 'Settings Guide',
            'help.dataManagement': 'Data Management',
            
            // 设置页面
            'settings.title': 'Settings',
            'settings.back': 'Back',
            'settings.language': 'Language Settings',
            'settings.interfaceLanguage': 'Interface Language',
            'settings.rememberLanguage': 'Remember language preference',
            'settings.rememberLanguageDesc': 'Use your selected language automatically next time',
            'settings.emojiCache': 'Emoji Cache Management',
            'settings.cachedEmoji': 'Cached Emoji',
            'settings.cachedAudio': 'Cached Audio',
            'settings.messageImages': 'Message Images',
            'settings.cacheSize': 'Cache Size',
            'settings.used': 'Used',
            'settings.refreshStats': 'Refresh Stats',
            'settings.cleanOldCache': 'Clean Old Cache',
            'settings.clearAllCache': 'Clear All Cache',
            'settings.autoCleanCache': 'Auto clean expired cache',
            'settings.preloadEmoji': 'Preload common emoji and audio',
            'settings.cursorStyle': 'Cursor Style',
            'settings.cursorHint': 'Cursor style settings only work on desktop devices',
            'settings.cursorDesc': 'Choose your favorite cursor style for a personalized browsing experience',
            'settings.cursorLoadingHint': 'Note: Custom cursor styles require loading additional resources, first use may take a few seconds',
            'settings.saveSettings': 'Save Settings',
            'settings.cursorDefault': 'Default',
            'settings.cursorDefaultDesc': 'System default cursor',
            'settings.cursorCustom1': 'Manhole',
            'settings.cursorCustom1Desc': 'Personalized cursor style',
            'settings.cursorCustom2': 'Mahiro',
            'settings.cursorCustom2Desc': 'Cute cursor style',
            
            // 通用按钮和操作
            'common.back': 'Back',
            'common.save': 'Save',
            'common.cancel': 'Cancel',
            'common.edit': 'Edit',
            'common.delete': 'Delete',
            'common.confirm': 'Confirm',
            'common.search': 'Search',
            'common.loading': 'Loading...',
            'common.noData': 'No Data',
            'common.success': 'Success',
            'common.failed': 'Failed',
            'common.error': 'Error',
            
            // Footer
            'footer.text1': 'SEGAY FEIWU',
            'footer.text2': '1145141919810'
        },
        
        'ja-jp': {
            // 导航栏
            'navbar.brand': 'EVIL LEAKER',
            'navbar.language': '言語',
            
            // 侧边栏
            'sidebar.home': 'ホーム',
            'sidebar.download': 'ダウンロード',
            'sidebar.settings': '設定',
            'sidebar.help': 'ヘルプ',
            'sidebar.tools': 'ツール',
            'sidebar.patcher': 'パッチツール',
            'sidebar.fortune': 'おみくじ',
            'sidebar.ccb': 'ゲームスコア',
            'sidebar.exchange': '交換コード',
            'sidebar.pointShop': 'ポイントショップ',
            'sidebar.functions': '機能',
            'sidebar.admin': '管理',
            'sidebar.userManager': 'ユーザー管理',
            'sidebar.announcementAdmin': 'お知らせ管理',
            'sidebar.siteAdmin': 'サイト管理',
            'sidebar.downloadAdmin': 'ダウンロード管理',
            'sidebar.pointsShopAdmin': 'ポイントショップ管理',
            'sidebar.point2ShopAdmin': 'ポイント2ショップ管理',
            'sidebar.creditShopAdmin': 'クレジットショップ管理',
            'sidebar.orderEntry': '注文入力',
            
            // 用户区域
            'user.login': 'ログイン',
            'user.register': '登録',
            'user.logout': 'ログアウト',
            'user.settings': 'ユーザー設定',
            'user.normalUser': '一般ユーザー',
            'user.points': 'ポイント',
            'user.credit': 'クレジット',
            
            // 首页
            'home.title': 'ホーム',
            'home.welcome': 'MAY THE LEAKER BE WITH YOU!',
            'home.selectFunction': '左のメニューから機能を選択してください',
            'home.announcementsLoading': 'お知らせを読み込み中...',
            
            // 用户管理
            'userManager.title': 'ユーザー管理',
            'userManager.search': '検索',
            'userManager.searchPlaceholder': 'ユーザーID、ユーザー名またはメールで検索...',
            'userManager.allGroups': 'すべてのグループ',
            'userManager.normalUser': '一般ユーザー',
            'userManager.juniorUser': 'ジュニアユーザー',
            'userManager.middleUser': 'ミドルユーザー',
            'userManager.seniorUser': 'シニアユーザー',
            'userManager.vipUser': 'VIPユーザー',
            'userManager.admin': 'システム管理者',
            'userManager.allStatus': 'すべてのステータス',
            'userManager.normal': '正常',
            'userManager.restricted': '制限',
            'userManager.banned': 'バン',
            'userManager.avatar': 'アバター',
            'userManager.uid': 'UID',
            'userManager.username': 'ユーザー名',
            'userManager.email': 'メール',
            'userManager.userGroup': 'ユーザーグループ',
            'userManager.specialGroup': '特別グループ',
            'userManager.points': 'ポイント',
            'userManager.point2': 'ポイント2',
            'userManager.gameServer': 'ゲームサーバー',
            'userManager.status': 'ステータス',
            'userManager.actions': 'アクション',
            
            // 下载中心
            'download.title': 'ダウンロードセンター',
            'download.gameDownload': 'ゲームダウンロード',
            'download.archiveDownload': 'アーカイブダウンロード',
            'download.otherResources': 'その他のリソース',
            'download.warning': '重要：',
            'download.warningDetail': 'OneDriveダウンロードチャンネルはオフラインです',
            'download.lastUpdate': '最終更新',
            'download.downloadInfo': 'ダウンロード情報：',
            'download.downloadInfoDetail': 'すべてのリソースは百度网盘でのみ利用可能です',
            'download.backToDownload': 'ダウンロードに戻る',
            'download.downloadList': 'ダウンロードリスト',
            'download.downloadMethod': 'ダウンロード方法',
            'download.fileCount': 'ファイル数',
            'download.accessCode': 'アクセスコード',
            'download.validity': '有効期限',
            'download.unlimited': '無制限',
            
            // 通用按钮和操作
            'common.back': '戻る',
            'common.save': '保存',
            'common.cancel': 'キャンセル',
            'common.edit': '編集',
            'common.delete': '削除',
            'common.confirm': '確認',
            'common.search': '検索',
            'common.loading': '読み込み中...',
            'common.noData': 'データなし',
            'common.success': '成功',
            'common.failed': '失敗',
            'common.error': 'エラー',
            
            // Footer
            'footer.text1': 'SEGAY FEIWU',
            'footer.text2': '1145141919810'
        }
    };
    
    let currentLanguage = 'zh-cn';
    
    // 获取翻译文本
    function t(key) {
        return translations[currentLanguage]?.[key] || translations['zh-cn'][key] || key;
    }
    
    // 更新页面上的所有翻译
    function updateTranslations() {
        // 更新所有带有 data-i18n 属性的元素
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = t(key);
            
            // 检查是否是输入框的 placeholder
            if (element.hasAttribute('placeholder')) {
                element.setAttribute('placeholder', translation);
            } else {
                // 普通文本元素
                element.textContent = translation;
            }
        });
        
        // 更新带有 data-i18n-title 的元素的 title 属性
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.setAttribute('title', t(key));
        });
    }
    
    // 设置语言
    function setLanguage(lang) {
        currentLanguage = lang;
        localStorage.setItem('language', lang);
        
        // 更新URL参数
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        window.history.replaceState(null, '', url);
        
        // 更新所有翻译
        updateTranslations();
        
        // 触发语言更改事件
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lang } 
        }));
    }
    
    // 初始化语言
    function initLanguage() {
        // 获取URL中的语言参数
        const urlParams = new URLSearchParams(window.location.search);
        let lang = urlParams.get('lang');
        
        // 检查记忆的语言设置
        const rememberLanguage = localStorage.getItem('rememberLanguage') === 'true';
        const savedLanguage = localStorage.getItem('savedLanguage');
        
        // 优先级：URL参数 > 记忆的语言 > 默认语言
        if (!lang && rememberLanguage && savedLanguage) {
            lang = savedLanguage;
        } else if (!lang) {
            lang = 'zh-cn';
        }
        
        currentLanguage = lang;
        localStorage.setItem('language', lang);
        
        // 初始更新
        updateTranslations();
        
        // 保存语言（如果开启了记忆功能）
        if (rememberLanguage) {
            localStorage.setItem('savedLanguage', lang);
        }
    }
    
    // 获取当前语言
    function getCurrentLanguage() {
        return currentLanguage;
    }
    
    // 公共API
    return {
        setLanguage,
        initLanguage,
        getCurrentLanguage,
        updateTranslations,
        t // 暴露翻译函数供外部使用
    };
})();

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化语言
    languageModule.initLanguage();
    
    // 事件委托处理
    let isProcessing = false;
    
    document.addEventListener('click', function(e) {
        if (isProcessing) return;
        
        // 语言按钮点击
        const languageBtn = e.target.closest('.language-btn');
        if (languageBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const dropdown = languageBtn.nextElementSibling;
            if (dropdown && dropdown.classList.contains('language-dropdown')) {
                document.querySelectorAll('.language-dropdown.show').forEach(d => {
                    if (d !== dropdown) {
                        d.classList.remove('show');
                    }
                });
                dropdown.classList.toggle('show');
            }
            return;
        }
        
        // 语言选项点击
        const languageItem = e.target.closest('.language-item');
        if (languageItem) {
            e.preventDefault();
            e.stopPropagation();
            
            isProcessing = true;
            
            const href = languageItem.getAttribute('href');
            if (href) {
                const lang = href.split('=')[1];
                
                setTimeout(() => {
                    localStorage.setItem('language', lang);
                    const rememberLanguage = localStorage.getItem('rememberLanguage') === 'true';
                    if (rememberLanguage) {
                        localStorage.setItem('savedLanguage', lang);
                    }
                    
                    languageModule.setLanguage(lang);
                    
                    document.querySelectorAll('.language-dropdown.show').forEach(dropdown => {
                        dropdown.classList.remove('show');
                    });
                    
                    isProcessing = false;
                }, 10);
            }
            return false;
        }
        
        // 点击其他地方关闭下拉菜单
        if (!e.target.closest('.language-selector') && 
            !e.target.closest('.language-selector-mobile') && 
            !e.target.closest('.language-selector-pc') &&
            !e.target.closest('.language-dropdown')) {
            document.querySelectorAll('.language-dropdown.show').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    }, true);
});

// 监听页面内容更新，自动应用翻译
window.addEventListener('contentUpdated', function() {
    languageModule.updateTranslations();
});

// 监听设置页面的语言切换
window.addEventListener('languageChanged', function(e) {
    const languageSelect = document.getElementById('language-select');
    if (languageSelect && e.detail.language) {
        languageSelect.value = e.detail.language;
    }
});