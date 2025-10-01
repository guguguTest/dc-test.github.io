// 用户组映射
const USER_RANK_MAP = {
  0: { 'zh-cn': '普通用户', 'en-us': 'Normal User', 'ja-jp': '一般ユーザー' },
  1: { 'zh-cn': '初级用户', 'en-us': 'Junior User', 'ja-jp': 'ジュニアユーザー' },
  2: { 'zh-cn': '中级用户', 'en-us': 'Middle User', 'ja-jp': 'ミドルユーザー' },
  3: { 'zh-cn': '高级用户', 'en-us': 'Senior User', 'ja-jp': 'シニアユーザー' },
  4: { 'zh-cn': '贵宾用户', 'en-us': 'VIP User', 'ja-jp': 'VIPユーザー' },
  5: { 'zh-cn': '系统管理员', 'en-us': 'System Admin', 'ja-jp': 'システム管理者' }
};

const SPECIAL_RANK_MAP = {
  0: { 'zh-cn': '无', 'en-us': 'None', 'ja-jp': 'なし' },
  1: { 'zh-cn': 'maimoller', 'en-us': 'maimoller', 'ja-jp': 'maimoller' },
  2: { 'zh-cn': '合作管理员', 'en-us': 'Partner Admin', 'ja-jp': 'パートナー管理者' }
};

const AUTH_MAP = {
  0: { 'zh-cn': '无', 'en-us': 'None', 'ja-jp': 'なし' },
  1: { 'zh-cn': '个人认证', 'en-us': 'Personal', 'ja-jp': '個人認証' },
  2: { 'zh-cn': '官方认证', 'en-us': 'Official', 'ja-jp': '公式認証' }
};

// 更新PC端用户信息显示
function updateUserInfoDisplay(user) {
  if (!user) return;
  
  const currentLang = (languageModule && languageModule.getCurrentLanguage) 
    ? languageModule.getCurrentLanguage() 
    : 'zh-cn';
  
  // 更新用户组
  const rankElement = document.getElementById('dropdown-rank');
  if (rankElement) {
    const rankText = USER_RANK_MAP[user.user_rank]?.[currentLang] || USER_RANK_MAP[0][currentLang];
    rankElement.textContent = rankText;
  }
  
  // 更新特殊用户组
  const specialRankElement = document.getElementById('dropdown-special-rank');
  const specialRankContainer = document.querySelector('.dropdown-special-rank');
  if (specialRankElement && specialRankContainer) {
    const specialRank = user.rankSp || 0;
    if (specialRank === 0) {
      specialRankContainer.classList.add('hidden');
    } else {
      specialRankContainer.classList.remove('hidden');
      const specialRankText = SPECIAL_RANK_MAP[specialRank]?.[currentLang] || SPECIAL_RANK_MAP[0][currentLang];
      specialRankElement.textContent = specialRankText;
    }
  }
  
  // 更新用户认证
  const authElement = document.getElementById('dropdown-auth');
  const authContainer = document.querySelector('.dropdown-auth');
  if (authElement && authContainer) {
    const auth = user.account_auth || 0;
    if (auth === 0) {
      authContainer.classList.add('hidden');
    } else {
      authContainer.classList.remove('hidden');
      const authText = AUTH_MAP[auth]?.[currentLang] || AUTH_MAP[0][currentLang];
      authElement.textContent = authText;
    }
  }
  
  // 更新 UID
  const uidElement = document.getElementById('dropdown-uid');
  if (uidElement) {
    uidElement.textContent = user.uid || '';
  }
  
  // 更新积分
  const pointsElement = document.getElementById('dropdown-points-value');
  if (pointsElement) {
    pointsElement.textContent = user.points || 0;
  }
  
  // 更新 CREDIT
  const creditElement = document.getElementById('dropdown-credit-value');
  if (creditElement) {
    creditElement.textContent = user.credit || 0;
  }
}

// 监听语言切换事件，重新更新用户信息显示
window.addEventListener('languageChanged', function() {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo);
      updateUserInfoDisplay(user);
    } catch (e) {
      console.error('解析用户信息失败:', e);
    }
  }
});

// 导出函数供全局使用
window.updateUserInfoDisplay = updateUserInfoDisplay;