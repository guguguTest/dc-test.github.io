// spa.js - 单页面应用主模块
// 用户状态管理
let currentUser = null;
let cropper = null;

// 新增变量
let currentOrders = [];
let selectedOrderIds = [];
let currentPage = 1;
const ordersPerPage = 50;

// 受保护的页面
const PROTECTED_PAGES = [
  'download','tools','dllpatcher','fortune','user-settings',
  'ccb','exchange','announcement-admin','site-admin','download-admin','order-entry','user-manager'
];

// 数据源
const MUSIC_DATA_URLS = [
  'https://oss.am-all.com.cn/asset/img/main/data/music.json',
];

// 公告数据（示例）
let announcementsData = [];

// 保存和恢复侧边栏滚动位置
function saveSidebarScroll() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sessionStorage.setItem('sidebarScroll', sidebar.scrollTop);
  }
}

function restoreSidebarScroll() {
  const sidebar = document.querySelector('.sidebar');
  const savedScroll = sessionStorage.getItem('sidebarScroll');
  if (sidebar && savedScroll) {
    sidebar.scrollTop = parseInt(savedScroll);
  }
}

window.handleExternalLink = function(e) {
  e.stopPropagation();
  // 允许默认行为（打开链接）
};

// 在DOM加载完成后添加滚动事件监听器
document.addEventListener("DOMContentLoaded", function() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.addEventListener('scroll', saveSidebarScroll);
  }
});

// 防止侧边栏滑动时主页面滚动
document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.querySelector('.sidebar');
  
  if (sidebar) {
    sidebar.addEventListener('touchstart', function(e) {
      // 只有当侧边栏可见时才阻止事件传播
      if (window.innerWidth <= 992 && sidebar.classList.contains('show')) {
        e.stopPropagation();
      }
    });
    
    sidebar.addEventListener('touchmove', function(e) {
      // 只有当侧边栏可见时才阻止事件传播
      if (window.innerWidth <= 992 && sidebar.classList.contains('show')) {
        e.stopPropagation();
      }
    });
  }
});

// 在用户设置页面显示查分绑定信息
function displayCCBBindingInfo() {
    const bindingSection = document.getElementById('ccb-binding-section');
    if (!bindingSection) return;
    
    if (currentUser && currentUser.game_server && currentUser.keychip && currentUser.guid) {
        bindingSection.style.display = 'block';
        document.getElementById('ccb-server-info').textContent = currentUser.game_server;
        document.getElementById('ccb-keychip-info').textContent = currentUser.keychip;
        document.getElementById('ccb-guid-info').textContent = currentUser.guid;
        
        // 添加解绑事件
        const unbindBtn = document.getElementById('ccb-unbind-settings-btn');
        if (unbindBtn) {
            // 先移除旧的监听器，再添加新的
            unbindBtn.replaceWith(unbindBtn.cloneNode(true));
            document.getElementById('ccb-unbind-settings-btn').addEventListener('click', handleUnbindFromSettings);
        }
    } else {
        bindingSection.style.display = 'none';
    }
}

// 从设置页面解绑
function handleUnbindFromSettings() {
    if (!confirm('确定要解绑查分信息吗？解绑后需要重新绑定才能使用查分功能。')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    secureFetch('https://api.am-all.com.cn/api/ccb/unbind', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(result => {
        if (result.success) {
            showSuccessMessage('解绑成功');
            // 更新当前用户信息
            currentUser.game_server = null;
            currentUser.keychip = null;
            currentUser.guid = null;
            
            // 保存更新后的用户信息到本地存储
            localStorage.setItem('userInfo', JSON.stringify(currentUser));
            
            // 隐藏绑定信息卡片
            document.getElementById('ccb-binding-section').style.display = 'none';
        } else {
            showErrorMessage(result.error || '解绑失败');
        }
    })
    .catch(error => {
        console.error('解绑失败:', error);
        showErrorMessage('解绑失败: ' + (error.error || '服务器错误'));
    });
}

// 获取随机推荐行动（修复重复问题）
function getRandomRecommendations() {
  const actions = ['出勤', '家勤', '越级', '下埋', '理论'];
  
  // 打乱数组
  const shuffled = [...actions].sort(() => Math.random() - 0.5);
  
  return {
    lucky: shuffled[0],
    unlucky: shuffled[1]
  };
}

// 添加一个函数来强制重新渲染用户信息
function refreshUserInfoDisplay() {
  const userInfoMobile = document.getElementById('user-info-mobile');
  if (userInfoMobile && userInfoMobile.offsetParent === null) {
    // 如果用户信息不在可视区域内，暂时显示然后隐藏以触发渲染
    const originalDisplay = userInfoMobile.style.display;
    userInfoMobile.style.display = 'block';
    
    // 强制重绘
    void userInfoMobile.offsetWidth;
    
    setTimeout(() => {
      userInfoMobile.style.display = originalDisplay;
    }, 50);
  }
}

// 更新侧边栏显示函数

async function updateSidebarVisibility(user) {
  const token = localStorage.getItem('token');
  const guestVisible = ['home', 'settings', 'help'];

  const setDisplay = (el, show) => { if (el) el.style.display = show ? '' : 'none'; };

  const nav = document.querySelector('.sidebar-nav');
  if (nav) {
    const links = nav.querySelectorAll('a[data-page]');
    if (!token) {
      for (const a of links) {
        const pid = a.getAttribute('data-page');
        setDisplay(a.parentElement, guestVisible.includes(pid));
      }
    } else {
      const headers = { 'Authorization': `Bearer ${token}` };
      for (const a of links) {
        const pid = a.getAttribute('data-page');
        try {
          const resp = await fetch(`https://api.am-all.com.cn/api/page-visibility/${encodeURIComponent(pid)}`, { headers });
          const data = await resp.json();
          setDisplay(a.parentElement, !!(data && data.visible));
        } catch (e) {
          console.warn('可见性检查失败:', pid, e);
          setDisplay(a.parentElement, false);
        }
      }
    }
  }

  const legacyMap = [
    ['sidebar-ccb','ccb'],
    ['sidebar-exchange','exchange'],
    ['sidebar-announcement-admin','announcement-admin'],
    ['sidebar-site-admin','site-admin'],
    ['sidebar-download-admin','download-admin'],
    ['sidebar-user-manager','user-manager'],
    ['sidebar-order-entry','order-entry'],
    ['sidebar-home','home'],
    ['sidebar-download','download'],
    ['sidebar-tools','tools'],
    ['sidebar-dllpatcher','dllpatcher'],
    ['sidebar-settings','settings'],
    ['sidebar-help','help'],
    ['sidebar-fortune','fortune'],
    ['sidebar-user-settings','user-settings'],
  ];
  
  for (const [id, pid] of legacyMap) {
    const el = document.getElementById(id);
    if (!el) continue;

    const a = el.querySelector ? el.querySelector('a') : null;
    const clickTarget = a || el;

    try {
      clickTarget.setAttribute('data-page', pid);
      if (a) {
        if (!a.getAttribute('href')) a.setAttribute('href', `#/${pid}`);
        a.setAttribute('role', 'button');
      }
    } catch {}

    if (!token) {
      const vis = guestVisible.includes(pid);
      if (a && a.parentElement) a.parentElement.style.display = vis ? '' : 'none';
      else el.style.display = vis ? '' : 'none';
    } else {
      try {
        const _pvUrl = `https://api.am-all.com.cn/api/page-visibility/${encodeURIComponent(pid)}`;
const _pvBust = _pvUrl + (_pvUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
const resp = await fetch(_pvBust, {
  headers: { 'Authorization': `Bearer ${token}`,  },
  cache: 'no-store'
});
let data = null; try { data = await resp.json(); } catch(e) { data = null; }
const vis = !!(data && data.visible);
        if (a && a.parentElement) a.parentElement.style.display = vis ? '' : 'none';
        else el.style.display = vis ? '' : 'none';
      } catch (e) {
        console.warn('可见性检查失败:', pid, e);
        if (a && a.parentElement) a.parentElement.style.display = 'none';
        else el.style.display = 'none';
      }
    }

    if (!clickTarget.dataset.boundClick) {
      clickTarget.addEventListener('click', (ev) => {
        if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
        try {
          console.debug('nav from legacy item →', pid);
          if (typeof loadPage === 'function') loadPage(pid);
          else window.location.hash = `#/${pid}`;
        } catch (e) {
          console.error('跳转失败', pid, e);
          window.location.hash = `#/${pid}`;
        }
      }, { passive: false });
      clickTarget.dataset.boundClick = '1';
      clickTarget.style.cursor = 'pointer';
    }
  }



  // ---- Auto hide empty admin group (no visible children) ----
  try {
    (function hideEmptyGroups() {
      var adminNav = document.getElementById('admin-section-nav');
      var adminTitle = document.getElementById('admin-section-title');
      if (!adminNav || !adminTitle) return;
      var items = adminNav.querySelectorAll('li, a[data-page]');
      var anyVisible = false;
      items.forEach ? items.forEach(function(el){
        var node = el.tagName === 'A' ? (el.parentElement || el) : el;
        if (!node) return;
        var style = window.getComputedStyle(node);
        if (style.display !== 'none' && style.visibility !== 'hidden' && node.offsetParent !== null) {
          anyVisible = true;
        }
      }) : (function(){
        for (var i=0;i<items.length;i++){
          var el = items[i];
          var node = el.tagName === 'A' ? (el.parentElement || el) : el;
          if (!node) continue;
          var style = window.getComputedStyle(node);
          if (style.display !== 'none' && style.visibility !== 'hidden' && node.offsetParent !== null) {
            anyVisible = true;
            break;
          }
        }
      })();
      adminNav.style.display = anyVisible ? '' : 'none';
      adminTitle.style.display = anyVisible ? '' : 'none';
    })();
  } catch(e) { console.warn('hideEmptyGroups failed', e); }
}


// 在侧边栏显示/隐藏时调用这个函数
document.addEventListener("DOMContentLoaded", function() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'class') {
          if (sidebar.classList.contains('show')) {
            setTimeout(refreshUserInfoDisplay, 300);
          }
        }
      });
    });
    
    observer.observe(sidebar, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
});

// 更新显示函数 (已移到全局作用域)
function updateDisplay(song, luck, recommendations) {
  // 通过ID直接获取元素
  const difficultiesContainer = document.querySelector('.difficulties');
  const coverImg = document.getElementById('cover-img');
  const songIdEl = document.getElementById('song-id');
  const songTitleEl = document.getElementById('song-title');
  const songArtistEl = document.getElementById('song-artist');
  const songCategoryEl = document.getElementById('song-category');
  const fortuneLuckEl = document.getElementById('fortune-luck');
  const luckyActionEl = document.getElementById('lucky-action');
  const unluckyActionEl = document.getElementById('unlucky-action');
  
  if (!song) return;
  
  // 更新吉凶显示
  if (fortuneLuckEl && luck) {
    fortuneLuckEl.textContent = luck;
  }
  
  // 更新宜不宜显示
  if (luckyActionEl && recommendations?.lucky) {
    luckyActionEl.textContent = recommendations.lucky;
  }
  
  if (unluckyActionEl && recommendations?.unlucky) {
    unluckyActionEl.textContent = recommendations.unlucky;
  }
  
  if (difficultiesContainer) {
    difficultiesContainer.innerHTML = '';
  }
  
  if (coverImg) {
    coverImg.src = song.image ? 
      `https://oss.am-all.com.cn/asset/img/main/music/${song.image}` : 
      'https://oss.am-all.com.cn/asset/img/main/music/dummy.jpg';
  }
  if (songIdEl) songIdEl.textContent = song.id || '???';
  if (songTitleEl) songTitleEl.textContent = song.title || '???';
  if (songArtistEl) songArtistEl.textContent = song.artist || '???';
  if (fortuneLuckEl) fortuneLuckEl.textContent = luck || '???';
  
  if (luckyActionEl && unluckyActionEl) {
    luckyActionEl.textContent = recommendations?.lucky || '?';
    unluckyActionEl.textContent = recommendations?.unlucky || '?';
  }
  
  const isDummy = song.id === '???';
  
  if (songCategoryEl) {
    if (isDummy) {
      songCategoryEl.textContent = '???';
      songCategoryEl.className = 'song-category cat-dummy';
    } else if (song.catname) {
      songCategoryEl.textContent = song.catname;
      songCategoryEl.className = 'song-category ' + getCategoryClass(song.catname);
    } else {
      songCategoryEl.textContent = '???';
      songCategoryEl.className = 'song-category';
    }
  }
  
  const isWorldsEndSong = song.we_kanji || song.we_star;
  
  if (isWorldsEndSong && !isDummy) {
    if (song.we_kanji || song.we_star) {
      const weDiv = document.createElement('div');
      weDiv.className = 'difficulty-tag lev-we';
      weDiv.textContent = 'World\'s End: ';
      
      if (song.we_kanji) {
        weDiv.textContent += song.we_kanji;
      }
      
      if (song.we_star) {
        const starsContainer = document.createElement('span');
        starsContainer.className = 'we-stars';
        
        const starCount = parseInt(song.we_star);
        const starDisplayCount = Math.ceil(starCount / 2);
        
        for (let i = 0; i < starDisplayCount; i++) {
          const star = document.createElement('i');
          star.className = 'fas fa-star star';
          starsContainer.appendChild(star);
        }
        
        weDiv.appendChild(starsContainer);
      }
      
      if (difficultiesContainer) {
        difficultiesContainer.appendChild(weDiv);
      }
    }
  } else {
    if (song.lev_bas || isDummy) {
      const basDiv = document.createElement('div');
      basDiv.className = 'difficulty-tag lev-bas';
      basDiv.setAttribute('data-level', 'BASIC');
      const basSpan = document.createElement('span');
      basSpan.textContent = isDummy ? '?' : song.lev_bas;
      basDiv.appendChild(basSpan);
      if (difficultiesContainer) difficultiesContainer.appendChild(basDiv);
    }
    
    if (song.lev_adv || isDummy) {
      const advDiv = document.createElement('div');
      advDiv.className = 'difficulty-tag lev-adv';
      advDiv.setAttribute('data-level', 'ADVANCE');
      const advSpan = document.createElement('span');
      advSpan.textContent = isDummy ? '?' : song.lev_adv;
      advDiv.appendChild(advSpan);
      if (difficultiesContainer) difficultiesContainer.appendChild(advDiv);
    }
    
    if (song.lev_exp || isDummy) {
      const expDiv = document.createElement('div');
      expDiv.className = 'difficulty-tag lev-exp';
      expDiv.setAttribute('data-level', 'EXPERT');
      const expSpan = document.createElement('span');
      expSpan.textContent = isDummy ? '?' : song.lev_exp;
      expDiv.appendChild(expSpan);
      if (difficultiesContainer) difficultiesContainer.appendChild(expDiv);
    }
    
    if (song.lev_mas || isDummy) {
      const masDiv = document.createElement('div');
      masDiv.className = 'difficulty-tag lev-mas';
      masDiv.setAttribute('data-level', 'MASTER');
      const masSpan = document.createElement('span');
      masSpan.textContent = isDummy ? '?' : song.lev_mas;
      masDiv.appendChild(masSpan);
      if (difficultiesContainer) difficultiesContainer.appendChild(masDiv);
    }
    
    if (song.lev_ult || isDummy) {
      const ultDiv = document.createElement('div');
      ultDiv.className = 'difficulty-tag lev-ult';
      ultDiv.setAttribute('data-level', 'ULTIMA');
      const ultSpan = document.createElement('span');
      ultSpan.textContent = isDummy ? '?' : song.lev_ult;
      ultDiv.appendChild(ultSpan);
      if (difficultiesContainer) difficultiesContainer.appendChild(ultDiv);
    }
  }
}

// 获取分类样式 (已移到全局作用域)
function getCategoryClass(catname) {
    switch (catname) {
        case 'POPS & ANIME': return 'cat-pops';
        case 'niconico': return 'cat-nico';
        case '東方Project': return 'cat-touhou';
        case 'VARIETY': return 'cat-variety';
        case 'イロドリミドリ': return 'cat-irodori';
        case 'ゲキマイ': return 'cat-gekimai';
        case 'ORIGINAL': return 'cat-original';
        default: return '';
    }
}

// 显示临时错误消息
function showTempErrorMessage(element, message, duration = 3000) {
  if (!element) {
    // 如果元素不存在，使用模态弹窗显示错误
    showErrorMessage(message);
    return;
  }
  
  element.textContent = message;
  element.style.display = 'block';
  
  if (element._errorTimer) {
    clearTimeout(element._errorTimer);
  }
  
  element._errorTimer = setTimeout(() => {
    element.style.display = 'none';
    element.textContent = '';
  }, duration);
}

// 检查登录状态
function checkLoginStatus() {
  const token = localStorage.getItem('token');
  if (token) {
    // 添加加载状态
    document.body.classList.add('spa-loading');
    
    fetchUserInfo(token)
      .catch(error => {
        console.error('检查登录状态失败:', error);
        showAuthLinks();
      })
      .finally(() => {
        restoreSidebarScroll();
        document.body.classList.remove('spa-loading');
      });
  } else {
    showAuthLinks();
  }
}

// 获取用户组信息
function getUserRankInfo(userRank) {
  const rankInfo = {
    background: "",
    icon: "",
    text: ""
  };
  
  switch(userRank) {
    case 0:
      rankInfo.background = 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_normal.png';
      rankInfo.icon = 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_1.png';
      rankInfo.text = '普通用户';
      break;
    case 1:
      rankInfo.background = 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_bronze.png';
      rankInfo.icon = 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_2.png';
      rankInfo.text = '初级用户';
      break;
    case 2:
      rankInfo.background = 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_silver.png';
      rankInfo.icon = 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_3.png';
      rankInfo.text = '中级用户';
      break;
    case 3:
      rankInfo.background = 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_gold.png';
      rankInfo.icon = 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_4.png';
      rankInfo.text = '高级用户';
      break;
    case 4:
      rankInfo.background = 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_platinum.png';
      rankInfo.icon = 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_5.png';
      rankInfo.text = '贵宾用户';
      break;
    case 5:
      rankInfo.background = 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_rainbow.png';
      rankInfo.icon = 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_6.png';
      rankInfo.text = '管理员';
      break;
    default:
      rankInfo.background = 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_normal.png';
      rankInfo.icon = 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_1.png';
      rankInfo.text = '普通用户';
  }
  
  return rankInfo;
}

// 在获取用户信息后更新侧边栏
function fetchUserInfo(token) {
  return secureFetch('https://api.am-all.com.cn/api/user', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(user => {
    if (!user || user.error) {
      throw new Error(user?.error || '获取用户信息失败');
    }
    
    currentUser = user;
    updateUserInfo(user);
    showUserInfo();
    setupUserDropdown();
    
    // 保存用户信息到本地存储
    localStorage.setItem('userInfo', JSON.stringify(user));
    
    // 获取并缓存用户权限
    return fetchUserPermissions(token);
  })
  .then(permissions => {
    // 保存权限到本地存储
    localStorage.setItem('userPermissions', JSON.stringify(permissions));
    
    // 更新侧边栏显示
    updateSidebarVisibility(currentUser);
    
    return currentUser;
  })
  .catch(error => {
    console.error('获取用户信息错误:', error);
    // 错误处理代码...
  });
}

// 获取用户权限
function fetchUserPermissions(token) {
  return secureFetch('https://api.am-all.com.cn/api/admin/users/permissions/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(permissions => {
    return permissions;
  })
  .catch(error => {
    console.error('获取用户权限失败:', error);
    return {};
  });
}

// 更新用户信息显示
function updateUserInfo(user) {
  const defaultAvatarUrl = 'https://api.am-all.com.cn/avatars/default_avatar.png';
  const rankInfo = getUserRankInfo(user.user_rank || 0);
  
  // 使用用户自定义头像或默认头像
  let avatarUrl = defaultAvatarUrl;
	if (user.avatar) {
	  // 检查是否已经是完整URL
	  if (user.avatar.startsWith('http')) {
		avatarUrl = user.avatar;
	  } else {
		avatarUrl = `https://api.am-all.com.cn/avatars/${user.avatar}`;
	  }
	}
  
  // 获取所有元素引用
  const userAvatarPc = document.getElementById('user-avatar-pc');
  const userNicknamePc = document.getElementById('user-nickname-pc');
  const userUidPc = document.getElementById('user-uid-pc');
  const userInfoPc = document.getElementById('user-info-pc');
  const dropdownUid = document.getElementById('dropdown-uid');
  const dropdownRank = document.getElementById('dropdown-rank');
  const dropdownPoints = document.getElementById('dropdown-points');
  const userAvatarMobile = document.getElementById('user-avatar-mobile');
  const userNicknameMobile = document.getElementById('user-nickname-mobile');
  const userEmailMobile = document.getElementById('user-email-mobile');
  const userUidMobile = document.getElementById('user-uid-mobile');
  const userPointsMobile = document.getElementById('user-points-mobile');
  const settingsAvatar = document.getElementById('settings-avatar');
  const settingsUsername = document.getElementById('settings-username');
  const settingsEmail = document.getElementById('settings-email');
  const settingsUid = document.getElementById('settings-uid');
  const settingsPoints = document.getElementById('settings-points');
  const settingsPoint2 = document.getElementById('settings-point2');
  const settingsTotalPoints = document.getElementById('settings-total-points');
  const nicknameInput = document.getElementById('settings-nickname');
  const sidebarUserArea = document.querySelector('.sidebar-user-area');
  
  // PC视图
  if (userInfoPc) {
    userInfoPc.style.setProperty('--user-rank-bg', `url(${rankInfo.background})`);
    
    let rankIcon = document.getElementById('user-rank-icon-pc');
    if (!rankIcon) {
      rankIcon = document.createElement('img');
      rankIcon.id = 'user-rank-icon-pc';
      rankIcon.className = 'user-rank-icon';
      userInfoPc.appendChild(rankIcon);
    }
    rankIcon.src = rankInfo.icon;
  }
  
  if (userAvatarPc) {
    userAvatarPc.src = avatarUrl;
    // 确保特效元素存在
    let effect = userAvatarPc.parentElement.querySelector('.avatar-effect-rainbow');
    if (!effect) {
      effect = document.createElement('div');
      effect.className = 'avatar-effect-rainbow';
      userAvatarPc.parentElement.appendChild(effect);
    }
    effect.style.display = (user.rankSp === 1) ? 'block' : 'none';
  }
    
  if (userNicknamePc) {
    userNicknamePc.textContent = user.nickname || user.username;
  }
  if (userUidPc) {
    userUidPc.textContent = user.email || '未设置邮箱';
  }
  
  if (dropdownUid) {
    dropdownUid.textContent = `UID: ${user.uid}`;
  }
  
  if (dropdownRank) {
    dropdownRank.innerHTML = `<i class="fas fa-crown me-2"></i>用户组: ${rankInfo.text}`;
  }
  
  // 修改积分显示为总积分
  if (dropdownPoints) {
    const totalPoints = (user.points || 0) + (user.point2 || 0);
    dropdownPoints.innerHTML = `<i class="fas fa-coins me-2"></i>积分: ${totalPoints}`;
  }
  
  // 移动视图
  if (userAvatarMobile) {
    userAvatarMobile.src = avatarUrl;
    // 确保特效元素存在
    let effect = userAvatarMobile.parentElement.querySelector('.avatar-effect-rainbow');
    if (!effect) {
      effect = document.createElement('div');
      effect.className = 'avatar-effect-rainbow';
      userAvatarMobile.parentElement.appendChild(effect);
    }
    effect.style.display = (user.rankSp === 1) ? 'block' : 'none';
  }
  
  if (userNicknameMobile) {
    userNicknameMobile.textContent = user.nickname || user.username;
  }
  if (userUidMobile) {
    userUidMobile.textContent = `UID: ${user.uid}`;
  }
  if (userPointsMobile) {
    const totalPoints = (user.points || 0) + (user.point2 || 0);
    userPointsMobile.textContent = `积分: ${totalPoints}`;
  }
  if (userEmailMobile) {
    userEmailMobile.textContent = user.email || '未设置邮箱';
  }
  
  // 用户设置页面
  if (settingsAvatar) {
    settingsAvatar.src = avatarUrl;
  }
  
  if (settingsUsername) {
    settingsUsername.textContent = user.username;
  }
  if (settingsEmail) {
    settingsEmail.textContent = user.email || '未设置';
  }
  if (settingsUid) {
    settingsUid.textContent = user.uid;
  }
  if (settingsPoints) {
    settingsPoints.textContent = user.points || 0;
  }
  if (settingsPoint2) {
    settingsPoint2.textContent = user.point2 || 0;
  }
  if (settingsTotalPoints) {
    const totalPoints = (user.points || 0) + (user.point2 || 0);
    settingsTotalPoints.textContent = totalPoints;
  }
  
  if (nicknameInput) {
    nicknameInput.value = user.nickname || '';
    document.getElementById('settings-nickname-counter').textContent = (user.nickname || '').length;
  }
  
  // 为移动端添加用户组背景和等级图标
  if (sidebarUserArea) {
    sidebarUserArea.style.setProperty('--user-rank-bg', `url(${rankInfo.background})`);
    
    let rankIconMobile = document.getElementById('user-rank-icon-mobile');
    if (!rankIconMobile) {
      rankIconMobile = document.createElement('img');
      rankIconMobile.id = 'user-rank-icon-mobile';
      rankIconMobile.className = 'user-rank-icon-mobile';
      sidebarUserArea.appendChild(rankIconMobile);
    }
    rankIconMobile.src = rankInfo.icon;
  }
}

// 设置用户下拉菜单事件
function setupUserDropdown() {
  const userInfoPc = document.getElementById('user-info-pc');
  const userDropdown = userInfoPc ? userInfoPc.querySelector('.user-dropdown') : null;

  if (userInfoPc && userDropdown) {
    let dropdownTimeout;
    
    userInfoPc.addEventListener('mouseenter', () => {
      clearTimeout(dropdownTimeout);
      userDropdown.style.display = 'block';
      setTimeout(() => {
        userDropdown.style.opacity = '1';
        userDropdown.style.transform = 'translateY(0)';
      }, 10);
    });

    userInfoPc.addEventListener('mouseleave', () => {
      dropdownTimeout = setTimeout(() => {
        userDropdown.style.opacity = '0';
        userDropdown.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          userDropdown.style.display = 'none';
        }, 200);
      }, 300);
    });

    userDropdown.addEventListener('mouseenter', () => {
      clearTimeout(dropdownTimeout);
    });

    userDropdown.addEventListener('mouseleave', () => {
      userDropdown.style.opacity = '0';
      userDropdown.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        userDropdown.style.display = 'none';
      }, 200);
    });
  }
}

// 显示用户信息区域
function showUserInfo() {
  // PC视图
  const authLinksPc = document.getElementById('auth-links-pc');
  const userInfoPc = document.getElementById('user-info-pc');
  
  if (authLinksPc) authLinksPc.style.display = 'none';
  if (userInfoPc) userInfoPc.style.display = 'flex';
  
  // 移动视图
  const authLinksMobile = document.getElementById('auth-links-mobile');
  const userInfoMobile = document.getElementById('user-info-mobile');
  
  if (authLinksMobile) authLinksMobile.style.display = 'none';
  if (userInfoMobile) userInfoMobile.style.display = 'block';
  
  // 显示游戏查分菜单（用户组级别>0）
  if (currentUser && currentUser.user_rank > 0) {
    document.getElementById('sidebar-ccb').style.display = 'block';
  } else {
    document.getElementById('sidebar-ccb').style.display = 'none';
  }
  
  // 显示积分兑换菜单（用户组级别>=1）
  if (currentUser && currentUser.user_rank >= 1) {
    document.getElementById('sidebar-exchange').style.display = 'block';
  } else {
    document.getElementById('sidebar-exchange').style.display = 'none';
  }
  
  // 显示管理分类和菜单（用户组级别>=4）
  if (currentUser && currentUser.user_rank >= 4) {
    document.getElementById('admin-section-title').style.display = 'block';
    document.getElementById('admin-section-nav').style.display = 'block';
    
    // 显示公告管理菜单（用户组级别>=5）
    if (currentUser.user_rank >= 5) {
      document.getElementById('sidebar-announcement-admin').style.display = 'block';
    } else {
      document.getElementById('sidebar-announcement-admin').style.display = 'none';
    }
    
    // 显示网站管理菜单（用户组级别>=5）
    if (currentUser.user_rank >= 5) {
      document.getElementById('sidebar-site-admin').style.display = 'block';
    } else {
      document.getElementById('sidebar-site-admin').style.display = 'none';
    }
    
    // 显示下载管理菜单（用户组级别>=5）
    if (currentUser.user_rank >= 5) {
      document.getElementById('sidebar-download-admin').style.display = 'block';
    } else {
      document.getElementById('sidebar-download-admin').style.display = 'none';
    }
    
	// 显示用户管理菜单（用户组级别>=5）
	if (currentUser.user_rank >= 5) {
	  document.getElementById('sidebar-user-manager').style.display = 'block';
	} else {
	  document.getElementById('sidebar-user-manager').style.display = 'none';
	}
	
    // 显示订单录入菜单（用户组级别>=4）
    document.getElementById('sidebar-order-entry').style.display = 'block';
  } else {
    document.getElementById('admin-section-title').style.display = 'none';
    document.getElementById('admin-section-nav').style.display = 'none';
  }
  
    // 显示下载菜单（用户组级别>0）
  if (currentUser && currentUser.user_rank > 0) {
    document.querySelector('a[data-page="download"]').parentElement.style.display = 'block';
  } else {
    // 改为始终显示，但添加特殊样式表示权限不足
    const downloadMenuItem = document.querySelector('a[data-page="download"]').parentElement;
    downloadMenuItem.style.display = 'block';
  }

  // 显示管理分组容器；具体入口显隐由 updateSidebarVisibility 决定
  try {
    if (typeof updateSidebarVisibility === 'function') {
      updateSidebarVisibility(window.currentUser || null);
    }
  } catch (e) {
    console.warn('updateSidebarVisibility 失败', e);
  }
}

// 显示登录/注册链接
function showAuthLinks() {
  // PC视图
  const authLinksPc = document.getElementById('auth-links-pc');
  const userInfoPc = document.getElementById('user-info-pc');
  
  if (authLinksPc) authLinksPc.style.display = 'flex';
  if (userInfoPc) userInfoPc.style.display = 'none';
  
  // 移动视图
  const authLinksMobile = document.getElementById('auth-links-mobile');
  const userInfoMobile = document.getElementById('user-info-mobile');
  
  if (authLinksMobile) authLinksMobile.style.display = 'block';
  if (userInfoMobile) userInfoMobile.style.display = 'none';
  
  // 移除移动端用户组背景和等级图标
  const sidebarUserArea = document.querySelector('.sidebar-user-area');
  if (sidebarUserArea) {
    sidebarUserArea.style.removeProperty('--user-rank-bg');
    const rankIconMobile = document.getElementById('user-rank-icon-mobile');
    if (rankIconMobile) {
      rankIconMobile.remove();
    }
  }
  
  // 隐藏所有需要登录才能访问的菜单项
  document.getElementById('sidebar-ccb').style.display = 'none';
  document.getElementById('sidebar-exchange').style.display = 'none';
  document.getElementById('admin-section-title').style.display = 'none';
  document.getElementById('admin-section-nav').style.display = 'none';
}

// 发送验证码
function sendVerificationCode(email, type) {
  console.log(`发送验证码: ${email} (${type})`);
  
  const sendBtn = document.getElementById(type === 'register' ? 'send-verification-code' : 'send-reset-code');
  const originalText = sendBtn.innerHTML;
  
  if (sendBtn) {
    sendBtn.disabled = true;
    let seconds = 60;
    
    // 添加加载动画
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>发送中...';
    
    const timer = setInterval(() => {
      sendBtn.innerHTML = `<i class="fas fa-clock me-2"></i>${seconds}秒后重试`;
      seconds--;
      if (seconds < 0) {
        clearInterval(timer);
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
      }
    }, 1000);
  }
  
  return fetch('https://api.am-all.com.cn/api/send-verification-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, type })
  })
  .then(response => {
    console.log(`验证码响应: ${response.status}`);
    
    if (!response.ok) {
      return response.json().then(err => { 
        throw new Error(err.error || '发送验证码失败');
      }).catch(() => {
        throw new Error(`发送验证码失败: ${response.status}`);
      });
    }
    return response.json();
  })
  .then(data => {
    // 添加成功动画效果
    const sendBtn = document.getElementById(type === 'register' ? 'send-verification-code' : 'send-reset-code');
    if (sendBtn) {
      sendBtn.innerHTML = '<i class="fas fa-check me-2"></i>已发送';
      sendBtn.classList.add('btn-success');
      
      // 3秒后恢复原状
      setTimeout(() => {
        if (sendBtn._timer) {
          clearInterval(sendBtn._timer);
        }
        sendBtn.innerHTML = '获取验证码';
        sendBtn.disabled = false;
        sendBtn.classList.remove('btn-success');
      }, 3000);
    }
    
    showSuccessMessage('验证码已发送至您的邮箱');
    return data;
  })
  .catch(error => {
    console.error('验证码发送失败:', error);
    
    // 恢复按钮状态
    const sendBtn = document.getElementById(type === 'register' ? 'send-verification-code' : 'send-reset-code');
    if (sendBtn) {
      if (sendBtn._timer) {
        clearInterval(sendBtn._timer);
      }
      sendBtn.innerHTML = '获取验证码';
      sendBtn.disabled = false;
      sendBtn.classList.remove('btn-success');
    }
    
    showErrorMessage(error.message || '发送验证码失败');
    throw error;
  });
}

// 验证验证码
function verifyCode(email, code, type) {
  return fetch('https://api.am-all.com.cn/api/verify-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, code, type })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => { throw err; });
    }
    return response.json();
  });
}

// 重置密码
function resetPassword(resetToken, newPassword) {
  return fetch('https://api.am-all.com.cn/api/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ resetToken, newPassword })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => { throw err; });
    }
    return response.json();
  });
}

// 登录功能
function handleLogin() {
  const login = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errorElement = document.getElementById('login-error');

  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }

  if (!login || !password) {
    showTempErrorMessage(errorElement, '用户名/邮箱和密码不能为空');
    return;
  }

  console.log('开始登录:', login);
  
  secureFetch('https://api.am-all.com.cn/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ login, password })
  })
  .then(data => {
    console.log('登录成功:', data);
    
    if (data.token && data.user) {
      localStorage.setItem('token', data.token);
      return fetchUserInfo(data.token); // 确保获取完整的用户信息
    } else {
      throw new Error(data.error || '登录失败');
    }
  })
  .then(() => {
    loadPage('home');
  })
  .catch(error => {
    console.error('登录失败:', {
      error: error.message,
      status: error.status,
      details: error.details
    });
    
    let userMessage = '登录失败';
    if (error.status === 401) {
      userMessage = '用户名或密码错误';
    } else if (error.status === 500) {
      userMessage = '服务器内部错误，请稍后再试';
    }
    
    showTempErrorMessage(errorElement, userMessage);
  });
}

// 注册功能
function handleRegister() {
  const username = document.getElementById('register-username').value;
  const nickname = document.getElementById('register-nickname').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  const verificationCode = document.getElementById('register-verification-code').value;
  const errorElement = document.getElementById('register-error');

  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }

  if (!username || !password || !email || !verificationCode) {
    showTempErrorMessage(errorElement, '用户名、密码、邮箱和验证码不能为空');
    return;
  }

  if (username.length < 6 || username.length > 20) {
    showTempErrorMessage(errorElement, '用户名长度需在6-20个字符之间');
    return;
  }

  if (nickname && (nickname.length < 6 || nickname.length > 20)) {
    showTempErrorMessage(errorElement, '昵称长度需在6-20个字符之间');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showTempErrorMessage(errorElement, '邮箱格式不正确');
    return;
  }

  if (password.length < 8 || password.length > 16) {
    showTempErrorMessage(errorElement, '密码长度需在8-16个字符之间');
    return;
  }
  if (password !== confirmPassword) {
    showTempErrorMessage(errorElement, '两次输入的密码不一致');
    return;
  }

  fetch('https://api.am-all.com.cn/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password, nickname, email, verificationCode })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => { throw err; });
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      localStorage.setItem('token', data.token);
      updateUserInfo(data.user);
      showUserInfo();
      loadPage('home');
    } else {
      throw new Error(data.error || '注册失败');
    }
  })
  .catch(error => {
    showTempErrorMessage(errorElement, error.error || '注册失败');
  });
}

// 退出登录
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  // 清除权限缓存
  localStorage.removeItem('userPermissions');
  currentUser = null;
  showAuthLinks();
  loadPage('home');
}

// 获取公告详情
function getAnnouncementById(id) {
  return announcementsData.find(item => item.id === id);
}

// 显示公告详情弹窗
function showAnnouncementModal(id) {
  // 确保消息弹窗不会干扰
  const messageModal = document.getElementById('message-modal');
  if (messageModal && messageModal.classList.contains('show')) {
    messageModal.classList.remove('show');
  }

  // 创建或获取公告弹窗
  let modal = document.getElementById('announcement-modal');
  if (!modal) {
    const modalHTML = `
      <div id="announcement-modal" class="modal">
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <h5 id="announcement-title"></h5>
            <button type="button" class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="announcement-meta">
              <span id="announcement-date"></span>
            </div>
            <div id="announcement-content" class="announcement-content"></div>
          </div>
          <div class="modal-footer">
            <button id="announcement-close" class="btn-ok">关闭</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modal = document.getElementById('announcement-modal');
    
    // 添加事件监听器
    document.querySelector('#announcement-modal .modal-close').addEventListener('click', () => {
      modal.classList.remove('show');
    });
    
    document.getElementById('announcement-close').addEventListener('click', () => {
      modal.classList.remove('show');
    });
    
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('show');
      }
    });
  }
  
  const announcement = getAnnouncementById(id);
  
  if (announcement) {
    const titleElement = document.getElementById('announcement-title');
    const dateElement = document.getElementById('announcement-date');
    const contentElement = document.getElementById('announcement-content');
    
    if (titleElement) titleElement.textContent = announcement.title;
    if (dateElement) dateElement.textContent = announcement.date;
    if (contentElement) contentElement.innerHTML = announcement.content;
    
    modal.classList.add('show');
    
    // 修复：添加点击事件监听器到弹窗内的链接
    const pageLinks = modal.querySelectorAll('[data-page]');
    pageLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        modal.classList.remove('show');
        
        if (window.innerWidth <= 992) {
          const sidebar = document.querySelector('.sidebar');
          if (sidebar) sidebar.classList.remove('show');
          document.body.classList.remove('mobile-sidebar-open');
          document.body.classList.add('mobile-sidebar-closed');
        }
        
        loadPage(this.getAttribute('data-page'));
      });
    });
  }
}

// 加载帮助详情页
function loadHelpDetail(id) {
  const content = document.getElementById('content-container');
  if (!content) return;
  
  content.innerHTML = pages['help-detail'];
  
  const helpData = helpContentData[id] || {
    title: "帮助主题不存在",
    content: "<p>请求的帮助内容不存在</p>"
  };
  
  document.getElementById('help-detail-title').textContent = helpData.title;
  document.getElementById('help-content').innerHTML = helpData.content;
  
  const backButton = document.querySelector('.back-button[data-page="help"]');
  if (backButton) {
    backButton.addEventListener('click', function(e) {
      e.preventDefault();
      loadPage('help');
    });
  }
  
  if (typeof languageModule !== 'undefined') {
    languageModule.initLanguage();
  }
}

// 显示登录提示界面
function showLoginRequired(pageId) {
  const contentContainer = document.getElementById('content-container');
  if (!contentContainer) return;
  
  const pageNames = {
    'tools': '实用工具',
    'dllpatcher': '补丁工具',
    'fortune': '每日签到',
    'user-settings': '用户设置',
    'order-entry': '订单录入',
    'exchange': '积分兑换',
    'announcement-admin': '公告管理',
    'download': '下载中心',
    'user-manager': '用户管理'
  };
  
  const pageName = pageNames[pageId] || '此功能';
  
  contentContainer.innerHTML = `
    <div class="section">
      <div class="login-required-container">
        <div class="login-required-icon">
          <i class="fas fa-lock"></i>
        </div>
        <h2>请登录</h2>
        <p>${pageName}需要登录后才能使用</p>
        <button class="login-btn" data-page="login">
          <i class="fas fa-sign-in-alt me-2"></i>
          立即登录
        </button>
      </div>
    </div>
  `;
  
  const loginBtn = contentContainer.querySelector('.login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      loadPage(this.getAttribute('data-page'));
    });
  }
  
  updateActiveMenuItem('home');
  
  // 确保移除加载状态
  document.body.classList.remove('spa-loading');
}

// 设置字符计数器
function setupCharCounters() {
  const usernameInput = document.getElementById('register-username');
  const nicknameInput = document.getElementById('register-nickname');
  const passwordInput = document.getElementById('register-password');
  
  if (usernameInput) {
    usernameInput.addEventListener('input', function() {
      document.getElementById('username-counter').textContent = this.value.length;
    });
  }
  
  if (nicknameInput) {
    nicknameInput.addEventListener('input', function() {
      document.getElementById('nickname-counter').textContent = this.value.length;
    });
  }
  
  if (passwordInput) {
    passwordInput.addEventListener('input', function() {
      document.getElementById('password-counter').textContent = this.value.length;
    });
  }
  
  const settingsNicknameInput = document.getElementById('settings-nickname');
  const newPasswordInput = document.getElementById('new-password');
  
  if (settingsNicknameInput) {
    settingsNicknameInput.addEventListener('input', function() {
      document.getElementById('settings-nickname-counter').textContent = this.value.length;
    });
  }
  
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', function() {
      document.getElementById('new-password-counter').textContent = this.value.length;
    });
  }
}

// 显示每日运势结果
function displayFortune(song, luck, recommendations, pointsEarned) {
  // 确保封面图片显示，动画隐藏
  const coverImg = document.getElementById('cover-img');
  const animationContainer = document.querySelector('.fortune-animation');
  
  if (coverImg) {
    coverImg.style.display = 'block';
    // 修复：安全地访问song.image属性
    const imagePath = song && song.image ? song.image : 'dummy.jpg';
    coverImg.src = `https://oss.am-all.com.cn/asset/img/main/music/${imagePath}`;
  }
  
  if (animationContainer) {
    animationContainer.style.display = 'none';
  }
  
  // 确保song对象存在，否则使用dummy数据
  const displaySong = song || {
    id: '???',
    title: '???',
    artist: '???',
    catname: '???',
    lev_bas: '?',
    lev_adv: '?',
    lev_exp: '?',
    lev_mas: '?',
    lev_ult: '?'
  };
  
  updateDisplay(displaySong, luck, recommendations);

}

// 获取用户权限
async function getUserPermissions() {
  const token = localStorage.getItem('token');
  if (!token) return {};
  
  try {
    // 修改为获取当前用户的权限
    const response = await fetch('https://api.am-all.com.cn/api/admin/users/permissions/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // 如果接口不存在，返回空对象而不是抛出错误
      if (response.status === 404) {
        return {};
      }
      throw new Error('获取用户权限失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取用户权限失败:', error);
    return {};
  }
}

// 辅助函数：检查页面是否默认允许访问
function isPageAllowedByDefault(pageId, user) {
  const defaultAllowedPages = ['home', 'tools', 'dllpatcher', 'settings', 'help', 'fortune', 'exchange'];
  return defaultAllowedPages.includes(pageId);
}

// 显示权限不足提示
function showPermissionDenied(pageId) {
  const contentContainer = document.getElementById('content-container');
  const pageNames = {
    'download': '下载中心',
    'ccb': '游戏查分',
    'announcement-admin': '公告管理',
    'site-admin': '网站管理',
    'download-admin': '下载管理',
    'order-entry': '订单录入',
    'user-manager': '用户管理'
  };
  
  const pageName = pageNames[pageId] || '此功能';
  
  contentContainer.innerHTML = `
    <div class="section">
      <div class="permission-denied-container">
        <div class="permission-denied-icon">
          <i class="fas fa-ban"></i>
        </div>
        <h2>权限不足</h2>
        <p>您没有访问${pageName}的权限</p>
        <p>请联系管理员获取权限</p>
        <button class="back-btn" data-page="home">
          <i class="fas fa-arrow-left me-2"></i>
          返回首页
        </button>
      </div>
    </div>
  `;
  
  const backBtn = contentContainer.querySelector('.back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', function(e) {
      e.preventDefault();
      loadPage(this.getAttribute('data-page'));
    });
  }
}

// 加载页面内容
async function loadPage(pageId) {
  const contentContainer = document.getElementById('content-container');
  if (!contentContainer) return;

  // 检查页面访问权限
  if (PROTECTED_PAGES.includes(pageId)) {
    const token = localStorage.getItem('token');
    if (!token) {
      showLoginRequired(pageId);
      return;
    }
    
    try {
      // 使用新的权限检查API
      const response = await fetch(`https://api.am-all.com.cn/api/check-permission?page=${pageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) { 
        if (response.status === 401) { showLoginRequired(pageId); } 
        else if (typeof showPermissionDenied === 'function') { showPermissionDenied(pageId); }
        return; 
      }
      
      const data = await response.json();
      if (!data.hasAccess) {
        showPermissionDenied(pageId);
        return;
      }
    } catch (error) {
      console.error('检查权限失败:', error);
      showLoginRequired(pageId);
      return;
    }
  }
  
  document.body.classList.add('spa-loading');
  
  contentContainer.scrollTop = 0;
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  
  setTimeout(() => {
    if (pages[pageId]) {
      contentContainer.innerHTML = pages[pageId];
      
      if (typeof languageModule !== 'undefined') {
        languageModule.initLanguage();
      }
      
      if (pageId === 'user-settings') {
        const token = localStorage.getItem('token');
        if (token) {
          fetchUserInfo(token);
        } else {
          loadPage('login');
        }
        
        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        const avatarUpload = document.getElementById('avatar-upload');
        const cancelAvatarBtn = document.getElementById('cancel-avatar-btn');
        
        if (changeAvatarBtn && avatarUpload) {
          changeAvatarBtn.addEventListener('click', () => {
            avatarUpload.click();
          });
          
          avatarUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
              if (file.size > 150 * 1024) {
                showErrorMessage('头像大小不能超过150KB');
                return;
              }
              
              if (cropper) {
                cropper.destroy();
                cropper = null;
              }
              
              const reader = new FileReader();
              reader.onload = function(event) {
                const cropContainer = document.getElementById('avatar-crop-container');
                const previewImg = document.getElementById('avatar-preview');
                
                cropContainer.innerHTML = '';
                const img = document.createElement('img');
                img.id = 'avatar-to-crop';
                img.src = event.target.result;
                img.style.maxWidth = '200px';
                img.style.maxHeight = '200px';
                
                cropContainer.appendChild(img);
                
                cropper = new Cropper(img, {
                  aspectRatio: 1,
                  viewMode: 1,
                  autoCropArea: 0.8,
                  movable: true,
                  zoomable: true,
                  rotatable: false,
                  scalable: false,
                  guides: true,
                  highlight: false,
                  background: false,
                  cropBoxResizable: true,
                  minCropBoxWidth: 100,
                  minCropBoxHeight: 100,
                  crop: function(event) {
                    const canvas = this.cropper.getCroppedCanvas({
                      width: 200,
                      height: 200
                    });
                    
                    const context = canvas.getContext('2d');
                    context.beginPath();
                    context.arc(100, 100, 100, 0, Math.PI * 2, true);
                    context.closePath();
                    context.clip();
                  }
                });
                
                document.getElementById('avatar-crop-section').style.display = 'block';
              };
              reader.readAsDataURL(file);
            }
          });
        }
        
        if (cancelAvatarBtn) {
          cancelAvatarBtn.addEventListener('click', function() {
            if (cropper) {
              cropper.destroy();
              cropper = null;
            }
            document.getElementById('avatar-crop-section').style.display = 'none';
            document.getElementById('avatar-upload').value = '';
          });
        }
        
        const saveAvatarBtn = document.getElementById('save-avatar-btn');
        if (saveAvatarBtn) {
          saveAvatarBtn.addEventListener('click', function() {
            if (cropper) {
              const canvas = cropper.getCroppedCanvas({
                width: 200,
                height: 200
              });
              
              const context = canvas.getContext('2d');
              context.beginPath();
              context.arc(100, 100, 100, 0, Math.PI * 2, true);
              context.closePath();
              context.clip();
              
              canvas.toBlob(function(blob) {
                if (blob.size > 150 * 1024) {
                  showErrorMessage('裁剪后的头像大小不能超过150KB');
                  return;
                }
                
                const formData = new FormData();
                formData.append('avatar', blob, 'avatar.png');
                
                const token = localStorage.getItem('token');
                fetch('https://api.am-all.com.cn/api/user/avatar', {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  },
                  body: formData
                })
                .then(response => response.json())
                .then(data => {
                  if (data.success) {
                    updateUserInfo(data.user);
                    document.getElementById('avatar-crop-section').style.display = 'none';
                    document.getElementById('avatar-upload').value = '';
                    showSuccessMessage('头像更新成功');
                  } else {
                    showErrorMessage('头像更新失败: ' + (data.error || '未知错误'));
                  }
                })
                .catch(error => {
                  console.error('头像更新错误:', error);
                  showErrorMessage('头像更新失败');
                });
              }, 'image/png', 0.9);
            } else {
              showErrorMessage('请先选择并裁剪头像');
            }
          });
        }
        
        const saveProfileBtn = document.getElementById('save-profile-btn');
        if (saveProfileBtn) {
          saveProfileBtn.addEventListener('click', function() {
            const nickname = document.getElementById('settings-nickname').value;
            
            if (nickname && (nickname.length < 6 || nickname.length > 20)) {
              showErrorMessage('昵称长度需在6-20个字符之间');
              return;
            }
            
            const token = localStorage.getItem('token');
            fetch('https://api.am-all.com.cn/api/user/profile', {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ nickname })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                updateUserInfo(data.user);
                showSuccessMessage('个人信息更新成功');
              } else {
                showErrorMessage('个人信息更新失败: ' + (data.error || '未知错误'));
              }
            })
            .catch(error => {
              console.error('个人信息更新错误:', error);
              showErrorMessage('个人信息更新失败');
            });
          });
        }
        
        // 显示查分绑定信息
        setTimeout(displayCCBBindingInfo, 100);
        
        const savePasswordBtn = document.getElementById('save-password-btn');
        if (savePasswordBtn) {
          savePasswordBtn.addEventListener('click', function() {
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword !== confirmPassword) {
              showErrorMessage('两次输入的新密码不一致');
              return;
            }
            
            if (newPassword.length < 8 || newPassword.length > 16) {
              showErrorMessage('密码长度需在8-16个字符之间');
              return;
            }
            
            const token = localStorage.getItem('token');
            fetch('https://api.am-all.com.cn/api/user/password', {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ currentPassword, newPassword })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showSuccessMessage('密码更新成功');
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
              } else {
                showErrorMessage('密码更新失败: ' + (data.error || '未知错误'));
              }
            })
            .catch(error => {
              console.error('密码更新错误:', error);
              showErrorMessage('密码更新失败');
            });
          });
        }
      }

      if (pageId === 'settings') {
        // 初始化设置值
        const languageSelect = document.getElementById('language-select');
        const rememberLanguage = document.getElementById('remember-language');
        
        if (languageSelect) {
          languageSelect.value = localStorage.getItem('language') || 'zh-cn';
        }
        if (rememberLanguage) {
          rememberLanguage.checked = localStorage.getItem('rememberLanguage') === 'true';
        }
        
        // 添加语言切换事件监听器
        if (languageSelect) {
          languageSelect.addEventListener('change', function() {
            const lang = this.value;
            const remember = document.getElementById('remember-language').checked;
            
            if (remember) {
              localStorage.setItem('language', lang);
            }
            
            // 更新URL参数并重新加载页面（与顶部导航栏相同的机制）
            const url = new URL(window.location);
            url.searchParams.set('lang', lang);
            window.history.replaceState({}, '', url);
            
            // 重新加载页面以应用语言更改
            window.location.reload();
          });
        }
        
        // 记住语言偏好开关事件
        if (rememberLanguage) {
          rememberLanguage.addEventListener('change', function() {
            localStorage.setItem('rememberLanguage', this.checked);
          });
        }
        
        // 修改保存按钮事件
        const saveBtn = document.getElementById('save-settings');
        if (saveBtn) {
          saveBtn.addEventListener('click', function() {
            const language = document.getElementById('language-select').value;
            const rememberLanguage = document.getElementById('remember-language').checked;
            
            localStorage.setItem('language', language);
            localStorage.setItem('rememberLanguage', rememberLanguage);
            
            showSuccessMessage('设置已保存');
          });
        }
      }

		if (pageId === 'user-manager') {
		  // 检查用户权限
		  if (currentUser && currentUser.user_rank >= 5) {
			// 初始化用户管理系统
			if (typeof initUserManager === 'function') {
			  setTimeout(initUserManager, 100);
			}
		  } else {
			showLoginRequired('user-manager');
		  }
		}
if (pageId === 'download') {
// 从本地存储获取用户信息
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        
        // 即使权限不足也尝试加载内容，因为可能有公开内容
        if (false && userInfo && userInfo.user_rank <= 0) {
          // 显示权限不足提示，但不阻止页面加载
          showPermissionDenied('download');
        }
        
        // 确保页面加载完成后再初始化下载内容
        setTimeout(() => {
          if (typeof initDownloadPage === 'function') {
            initDownloadPage();
          } else {
            console.error('initDownloadPage 函数未定义');
            // 即使函数未定义，也要确保移除加载状态
            document.body.classList.remove('spa-loading');
          }
        }, 100);
      }
      if (pageId === 'ccb') {
        try { if (typeof initCCBPage === 'function') setTimeout(initCCBPage, 50); }
        catch(e){ console.error('初始化 ccb 页面失败:', e); }
      }



      if (pageId === 'download-detail') {
        // 从URL参数获取下载ID
        const urlParams = new URLSearchParams(window.location.search);
        const downloadId = urlParams.get('id');
        
        if (downloadId && typeof loadDownloadDetail === 'function') {
          setTimeout(() => loadDownloadDetail(downloadId), 100);
        }
      }

      if (pageId === 'download-admin') {
        // 检查用户权限
        if (currentUser && currentUser.user_rank >= 5) {
          // 初始化下载管理系统
          if (typeof initDownloadAdminPage === 'function') {
            setTimeout(initDownloadAdminPage, 100);
          }
        } else {
          showLoginRequired('download-admin');
        }
      }

      if (pageId === 'fortune') {
        setTimeout(() => {
          const coverImg = document.getElementById('cover-img');
          const songIdEl = document.getElementById('song-id');
          const songCategoryEl = document.getElementById('song-category');
          const songTitleEl = document.getElementById('song-title');
          const songArtistEl = document.getElementById('song-artist');
          const difficultiesContainer = document.querySelector('.difficulties');
          const fortuneLuckEl = document.getElementById('fortune-luck');
          const drawBtn = document.getElementById('draw-btn');
          const fortuneHint = document.getElementById('fortune-hint');
          const luckyActionEl = document.getElementById('lucky-action');
          const unluckyActionEl = document.getElementById('unlucky-action');
          
          if (coverImg) {
            if (window.innerWidth <= 768) {
              coverImg.style.width = '190px';
              coverImg.style.height = '190px';
            } else {
              coverImg.style.width = '';
              coverImg.style.height = '';
            }
          }
          
          const luckTexts = ['大凶', '凶', '末吉', '吉', '小吉', '中吉', '大吉', '特大吉'];
          
          const lastDrawDate = localStorage.getItem('dailyFortuneDate');
          const today = new Date().toDateString();
          const dailyFortuneData = localStorage.getItem('dailyFortuneData');
          
          let songList = [];
          
          const dummySong = {
            id: '???',
            title: '???',
            artist: '???',
            catname: '???',
            lev_bas: '?',
            lev_adv: '?',
            lev_exp: '?',
            lev_mas: '?',
            lev_ult: '?'
          };
          
          updateDisplay(dummySong, '???', {lucky: '?', unlucky: '?'});
          
          // 修改歌曲数据加载逻辑
          const fetchMusicData = async () => {
            for (const url of MUSIC_DATA_URLS) {
              try {
                const response = await fetch(url);
                if (!response.ok) continue;
                const data = await response.json();
                
                // 确保数据是数组格式
                if (Array.isArray(data)) {
                  return data;
                } else if (data.songs && Array.isArray(data.songs)) {
                  return data.songs;
                } else {
                  console.error('无效的音乐数据格式:', data);
                  continue;
                }
              } catch (e) {
                console.log(`尝试从 ${url} 加载数据失败`, e);
                continue;
              }
            }
            throw new Error('所有数据源均不可用');
          };
          
          fetchMusicData()
            .then(data => {
              songList = data;
              console.log('成功加载歌曲数据:', songList.length, '首歌曲');
              
              // 只有在没有已保存的运势数据时才显示占位符
              if (!(lastDrawDate === today && dailyFortuneData)) {
                updateDisplay(dummySong, '???', {lucky: '?', unlucky: '?'});
              }
              
              // 检查是否可以抽取运势
              const token = localStorage.getItem('token');
              if (token) {
                // 在获取上次抽取时间的代码部分，添加错误处理
                fetch('https://api.am-all.com.cn/api/fortune/last-draw', {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                })
                .then(response => {
                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }
                  return response.json();
                })
                .then(data => {
                  if (data.canDraw) {
                    if (drawBtn) {
                      drawBtn.disabled = false;
                      drawBtn.innerHTML = '<i class="fas fa-star me-2"></i>抽取今日运势';
                    }
                    if (fortuneHint) {
                      fortuneHint.textContent = '今日运势待抽取';
                    }
                  } else {
                    // 已经抽取过，显示上次抽取的结果
                    if (data.lastFortune) {
                      displayFortune(
                        data.lastFortune.song_data,
                        data.lastFortune.luck,
                        data.lastFortune.recommendations
                      );
                      
                      // 显示历史获得的积分
                      if (data.lastFortune.points_earned) {
                        const fortuneHint = document.getElementById('fortune-hint');
                        if (fortuneHint) {
                          // 使用当前用户积分显示，而不是历史积分
                          const totalPoints = (currentUser.points || 0) + (currentUser.point2 || 0);
                          fortuneHint.textContent = `昨日获得 ${data.lastFortune.points_earned} 积分，当前积分: ${totalPoints}`;
                          fortuneHint.style.color = '#7f8c8d'; // 使用灰色表示历史记录
                        }
                      }
                    }
                    
                    if (drawBtn) {
                      drawBtn.disabled = true;
                      drawBtn.innerHTML = '<i class="fas fa-check me-2"></i>今日已抽取';
                    }
                    
                    if (fortuneHint) {
                      if (data.nextDrawTime) {
                        const nextDraw = new Date(data.nextDrawTime);
                        const now = new Date();
                        const hoursLeft = Math.ceil((nextDraw - now) / (1000 * 60 * 60));
                        fortuneHint.textContent = `今日运势已抽取，${hoursLeft}小时后可再次抽取`;
                      } else {
                        fortuneHint.textContent = `今日运势已抽取，请明天再来`;
                      }
                    }
                  }
                })
                .catch(error => {
                  console.error('检查运势抽取状态失败:', error);
                  // 使用本地逻辑作为后备
                  if (lastDrawDate === today && dailyFortureData) {
                    try {
                      const data = JSON.parse(dailyFortuneData);
                      if (data && data.song) {
                        displayFortune(data.song, data.luck, data.recommendations);
                        if (drawBtn) {
                          drawBtn.disabled = true;
                          drawBtn.innerHTML = '<i class="fas fa-check me-2"></i>今日已抽取';
                        }
                        if (fortuneHint) {
                          fortuneHint.textContent = '今日幸运乐曲已抽取，请明天再来！';
                        }
                      }
                    } catch (e) {
                      console.error('解析运势数据失败', e);
                      localStorage.removeItem('dailyFortuneDate');
                      localStorage.removeItem('dailyFortuneData');
                      updateDisplay(dummySong, '???', {lucky: '?', unlucky: '?'});
                    }
                  } else {
                    // 显示通用错误信息，而不是NaN
                    if (fortuneHint) {
                      fortuneHint.textContent = '无法获取抽取状态，请稍后重试';
                    }
                    if (drawBtn) {
                      drawBtn.disabled = false;
                      drawBtn.innerHTML = '<i class="fas fa-star me-2"></i>抽取今日运势';
                    }
                  }
                });
              }
            })
            .catch(error => {
              console.error('加载歌曲数据失败:', error);
              if (fortuneHint) {
                fortuneHint.textContent = '加载歌曲数据失败，使用备用数据';
              }
              // 使用本地备用数据
              songList = [
                {
                  id: '001',
                  title: '备用歌曲',
                  artist: '系统',
                  catname: 'ORIGINAL',
                  lev_bas: '3',
                  lev_adv: '5',
                  lev_exp: '7',
                  lev_mas: '9',
                  lev_ult: '12',
                  image: 'dummy.jpg'
                }
              ];
              // 只有在没有已保存的运势数据时才显示占位符
              if (!(lastDrawDate === today && dailyFortuneData)) {
                updateDisplay(dummySong, '???', {lucky: '?', unlucky: '?'});
              }
            });
          
          if (drawBtn) {
            drawBtn.addEventListener('click', () => {
              if (!drawBtn) return;
              
              const token = localStorage.getItem('token');
              if (!token) {
                showErrorMessage('请先登录');
                return;
              }
              
              drawBtn.disabled = true;
              drawBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>抽取中...';
              if (fortuneHint) fortuneHint.textContent = '';
              
              // 隐藏封面，显示动画
              const coverImg = document.getElementById('cover-img');
              const animationContainer = contentContainer.querySelector('.fortune-animation');
              const kuji01 = contentContainer.querySelector('#kuji-01');
              const kuji02 = contentContainer.querySelector('#kuji-02');
              
              if (coverImg) {
                coverImg.style.display = 'none';
              }
              
              if (animationContainer) {
                animationContainer.style.display = 'flex';
                kuji01.style.display = 'block';
                kuji01.classList.add('kuji-swing');
                kuji02.style.display = 'none';
                kuji02.classList.remove('kuji-fadein');
              }
              
              setTimeout(() => {
                let scrollCount = 0;
                const scrollInterval = setInterval(() => {
                  if (songList.length === 0) {
                    clearInterval(scrollInterval);
                    return;
                  }
                  
                  const tempSong = songList[Math.floor(Math.random() * songList.length)];
                  
                  updateDisplay(tempSong, '???', {lucky: '?', unlucky: '?'});
                  scrollCount++;
                  
                  if (scrollCount > 30) {
                    clearInterval(scrollInterval);
                    
                    // 调用后端API抽取运势
                  fetch('https://api.am-all.com.cn/api/fortune/draw', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  })
                  .then(response => response.json())
                  .then(data => {
                    if (data.success) {
                      // 修复：传递正确的参数，包括获得的积分
                      displayFortune(data.song, data.luck, data.recommendations);
                      
                      // 显示获得的积分信息
                      if (data.pointsEarned) {
                        const fortuneHint = document.getElementById('fortune-hint');
                        if (fortuneHint) {
                          const totalPoints = data.points + (data.point2 || 0);
                          fortuneHint.textContent = `恭喜获得 ${data.pointsEarned} 积分！当前积分: ${totalPoints}`;
                          fortuneHint.style.color = '#27ae60';
                        }
                      }
                      
                      // 保存到本地存储，用于页面刷新后显示
                      const today = new Date().toDateString();
                      localStorage.setItem('dailyFortuneDate', today);
                      localStorage.setItem('dailyFortuneData', JSON.stringify({
                        song: data.song,
                        luck: data.luck,
                        recommendations: data.recommendations,
                        pointsEarned: data.pointsEarned
                      }));
                      
                      if (drawBtn) {
                        drawBtn.disabled = true;
                        drawBtn.innerHTML = '<i class="fas fa-check me-2"></i>今日已抽取';
                      }
                      
                      // 更新用户信息
                      if (currentUser) {
                        currentUser.points = data.points;
                        currentUser.point2 = data.point2;
                        updateUserInfo(currentUser);
                      }
                    } else {
                      // 抽取失败，显示错误信息
                      if (drawBtn) {
                        drawBtn.disabled = false;
                        drawBtn.innerHTML = '<i class="fas fa-star me-2"></i>抽取今日运势';
                      }
                      if (fortuneHint) {
                        fortuneHint.textContent = data.error || '抽取运势失败';
                        fortuneHint.style.color = '#e74c3c';
                      }
                      
                      // 失败时也要恢复封面显示
                      const coverImg = document.getElementById('cover-img');
                      const animationContainer = document.querySelector('.fortune-animation');
                      if (coverImg) coverImg.style.display = 'block';
                      if (animationContainer) animationContainer.style.display = 'none';
                    }
                  })
                  .catch(error => {
                    console.error('抽取运势失败:', error);
                    if (drawBtn) {
                      drawBtn.disabled = false;
                      drawBtn.innerHTML = '<i class="fas fa-star me-2"></i>抽取今日运势';
                    }
                    if (fortuneHint) {
                      fortuneHint.textContent = '网络错误，请重试';
                      fortuneHint.style.color = '#e74c3c';
                    }
                    
                    // 失败时恢复封面显示并隐藏动画
                    const coverImg = document.getElementById('cover-img');
                    const animationContainer = document.querySelector('.fortune-animation');
                    if (coverImg) coverImg.style.display = 'block';
                    if (animationContainer) animationContainer.style.display = 'none';
                   });
                  }
                }, 100);
              }, 500);
            });
          }
        }, 100);
      }
      
      if (pageId === 'home') {
        // 初始化公告系统
        try {
          if (typeof window.initAnnouncementSystem === 'function') {
            setTimeout(() => {
              try {
                window.initAnnouncementSystem();
              } catch (e) {
                console.error('初始化公告系统失败:', e);
              }
            }, 100);
          } else {
            console.warn('initAnnouncementSystem 不是函数');
          }
        } catch (e) {
          console.error('公告系统初始化异常:', e);
        }
      }

      // 在公告管理页面的处理部分添加：
      if (pageId === 'announcement-admin') {
        // 检查用户权限
        if (currentUser && currentUser.user_rank >= 5) {
          // 初始化公告管理系统
          if (typeof initAnnouncementAdminSystem === 'function') {
            setTimeout(initAnnouncementAdminSystem, 100);
          }
        } else {
          showLoginRequired('announcement-admin');
        }
      }

      if (pageId === 'order-entry') {
        initOrderEntryPage();
      }
      
      if (pageId === 'exchange') {
        document.getElementById('redeem-order-btn').addEventListener('click', handleRedeemOrder);
        document.getElementById('redeem-code-btn').addEventListener('click', () => {
          showSuccessMessage('兑换码功能尚未开放');
        });
      }
      
      // 用户管理页面
      if (pageId === 'user-manager') {
        // 检查用户权限
        if (currentUser && currentUser.user_rank >= 5) {
          // 初始化用户管理系统
          if (typeof initUserManager === 'function') {
            setTimeout(initUserManager, 100);
          }
        } else {
          showLoginRequired('user-manager');
        }
      }
    } else {
        contentContainer.innerHTML = `<div class="section"><h1>404 NO LEAK</h1><p>页面不存在</p></div>`;
    }
    
    setupCharCounters();
    restoreSidebarScroll();
    
    document.body.classList.remove('spa-loading');
    updateActiveMenuItem(pageId);
  }, 300);
}

// 检查页面访问权限
async function checkPageAccess(pageId, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/check-permission?page=${pageId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      const data = await response.json();
      return data.hasAccess;
    }
    
    return false;
  } catch (error) {
    console.error('检查页面权限失败:', error);
    return false;
  }
}

// 检查页面可见性
async function checkPageVisibility(pageId, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/page-visibility/${pageId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      const data = await response.json();
      return data.visible;
    }
    
    return false;
  } catch (error) {
    console.error('检查页面可见性失败:', error);
    return false;
  }
}

// 显示成功消息
function showSuccessMessage(message) {
  const modal = document.getElementById('message-modal');
  if (!modal) {
    const modalHTML = `
      <div id="message-modal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h5 id="modal-title">操作成功</h5>
            <button type="button" class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p id="modal-content">${message}</p>
          </div>
          <div class="modal-footer">
            <button id="modal-ok" class="btn-ok">确定</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 添加事件监听器
    document.querySelector('#message-modal .modal-close').addEventListener('click', () => {
      document.getElementById('message-modal').classList.remove('show');
    });
    
    document.getElementById('modal-ok').addEventListener('click', () => {
      document.getElementById('message-modal').classList.remove('show');
    });
    
    document.getElementById('message-modal').addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('show');
      }
    });
  } else {
    // 确保标题正确
    document.getElementById('modal-title').textContent = '操作成功';
    document.getElementById('modal-content').textContent = message;
  }
  
  document.getElementById('message-modal').classList.add('show');
}

// 显示错误消息
function showErrorMessage(message) {
  const modal = document.getElementById('message-modal');
  if (!modal) {
    const modalHTML = `
      <div id="message-modal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h5 id="modal-title">操作失败</h5>
            <button type="button" class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p id="modal-content">${message}</p>
          </div>
          <div class="modal-footer">
            <button id="modal-ok" class="btn-ok">确定</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 添加事件监听器
    document.querySelector('#message-modal .modal-close').addEventListener('click', () => {
      document.getElementById('message-modal').classList.remove('show');
    });
    
    document.getElementById('modal-ok').addEventListener('click', () => {
      document.getElementById('message-modal').classList.remove('show');
    });
    
    document.getElementById('message-modal').addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('show');
      }
    });
  } else {
    // 确保标题正确
    document.getElementById('modal-title').textContent = '操作失败';
    document.getElementById('modal-content').textContent = message;
  }
  
  document.getElementById('message-modal').classList.add('show');
}

// 更新活动菜单项
function updateActiveMenuItem(activePage) {
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.sidebar-nav a[data-page="${activePage}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    
    if (activePage === 'home') {
        const navDownload = document.getElementById('nav-download');
        const navHome = document.getElementById('nav-home');
        if (navDownload) navDownload.classList.add('active');
        if (navHome) navHome.classList.add('active');
    }
}

// 新增订单管理功能
function initOrderEntryPage() {
  loadOrders();
  
  document.getElementById('order-search-btn').addEventListener('click', () => {
    currentPage = 1;
    loadOrders();
  });
  
  document.getElementById('order-search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentPage = 1;
      loadOrders();
    }
  });
  
  const addBtn = document.getElementById('add-order-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      showOrderModal();
    });
  }
  
  const editBtn = document.getElementById('edit-order-btn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      if (selectedOrderIds.length === 1) {
        const order = currentOrders.find(o => o.id === selectedOrderIds[0]);
        if (order) {
          showOrderModal(order);
        }
      } else {
        showErrorMessage('请选择一条订单进行编辑');
      }
    });
  }
  
  const deleteBtn = document.getElementById('delete-order-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (selectedOrderIds.length > 0) {
        deleteOrders(selectedOrderIds);
      } else {
        showErrorMessage('请选择要删除的订单');
      }
    });
  }
  
  const selectAll = document.getElementById('select-all');
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checkboxes = document.querySelectorAll('.order-checkbox');
      checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
        const orderId = parseInt(cb.dataset.id);
        if (e.target.checked) {
          if (!selectedOrderIds.includes(orderId)) {
            selectedOrderIds.push(orderId);
          }
        } else {
          selectedOrderIds = selectedOrderIds.filter(id => id !== orderId);
        }
      });
      updateActionButtons();
    });
  }

  const orderForm = document.getElementById('order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveOrder();
    });
  }
  
  const redeemedCheckbox = document.getElementById('redeemed');
  if (redeemedCheckbox) {
    redeemedCheckbox.addEventListener('change', function(e) {
      if (e.target.checked && document.getElementById('order-id').value) {
        if (!confirm('确定要将此订单标记为已兑换吗？此操作将影响积分计算！')) {
          e.target.checked = false;
        }
      }
    });
  }

  const closeBtn = document.querySelector('.order-modal .close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeOrderModal();
    });
  }
  
  window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('order-modal')) {
      closeOrderModal();
    }
  });
}

async function loadOrders() {
  try {
    const search = document.getElementById('order-search-input').value;
    const token = localStorage.getItem('token');
    
    if (!token) {
      showLoginRequired('order-entry');
      return;
    }
    
    const response = await fetch(`https://api.am-all.com.cn/api/orders?page=${currentPage}&limit=${ordersPerPage}&search=${encodeURIComponent(search)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('获取订单失败');
    }
    
    const data = await response.json();
    
    currentOrders = data.orders.map(order => ({
      ...order,
      price: typeof order.price === 'string' ? parseFloat(order.price) : order.price
    }));
    
    renderOrders(currentOrders);
    renderPagination(data.pagination);
    
    selectedOrderIds = [];
    updateActionButtons();
    const selectAll = document.getElementById('select-all');
    if (selectAll) selectAll.checked = false;
  } catch (error) {
    console.error('加载订单错误:', error);
    showErrorMessage('加载订单失败: ' + error.message);
  }
}

function renderOrders(orders) {
  const tbody = document.getElementById('orders-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">没有找到订单</td></tr>`;
    return;
  }
  
  const sortedOrders = [...orders].sort((a, b) => a.id - b.id);
  
  sortedOrders.forEach((order, index) => {
    const tr = document.createElement('tr');
    
    const price = typeof order.price === 'number' ? order.price : parseFloat(order.price || 0);
    const formattedPrice = isNaN(price) ? '0.00' : price.toFixed(2);
    
    tr.innerHTML = `
      <td><input type="checkbox" class="order-checkbox" data-id="${order.id}"></td>
      <td>${index + 1}</td>
      <td>${order.taobao_id}</td>
      <td>${order.product_name}</td>
      <td>${order.order_number}</td>
      <td>${formattedPrice}</td>
      <td>${order.redeemed ? '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>已兑换</span>' : '<span class="badge bg-warning"><i class="fas fa-exclamation-circle me-1"></i>未兑换</span>'}</td>
    `;
    tbody.appendChild(tr);
    
    const checkbox = tr.querySelector('.order-checkbox');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        const orderId = parseInt(e.target.dataset.id);
        if (e.target.checked) {
          if (!selectedOrderIds.includes(orderId)) {
            selectedOrderIds.push(orderId);
          }
        } else {
          selectedOrderIds = selectedOrderIds.filter(id => id !== orderId);
          const selectAll = document.getElementById('select-all');
          if (selectAll) selectAll.checked = false;
        }
        updateActionButtons();
      });
    }
  });
}

function renderPagination(pagination) {
  const container = document.getElementById('pagination-controls');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (pagination.totalPages <= 1) return;
  
  const ul = document.createElement('ul');
  ul.className = 'pagination';
  
  const prevLi = document.createElement('li');
  prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  prevLi.innerHTML = `<a class="page-link" href="#">&laquo;</a>`;
  prevLi.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      loadOrders();
    }
  });
  ul.appendChild(prevLi);
  
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(pagination.totalPages, currentPage + 2);
  
  if (startPage > 1) {
    const li = document.createElement('li');
    li.className = 'page-item';
    li.innerHTML = `<a class="page-link" href="#">1</a>`;
    li.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage = 1;
      loadOrders();
    });
    ul.appendChild(li);
    
    if (startPage > 2) {
      const dotLi = document.createElement('li');
      dotLi.className = 'page-item disabled';
      dotLi.innerHTML = `<span class="page-link">...</span>`;
      ul.appendChild(dotLi);
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const li = document.createElement('li');
    li.className = `page-item ${i === currentPage ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage = i;
      loadOrders();
    });
    
    ul.appendChild(li);
  }
  
  if (endPage < pagination.totalPages) {
    if (endPage < pagination.totalPages - 1) {
      const dotLi = document.createElement('li');
      dotLi.className = 'page-item disabled';
      dotLi.innerHTML = `<span class="page-link">...</span>`;
      ul.appendChild(dotLi);
    }
    
    const li = document.createElement('li');
    li.className = 'page-item';
    li.innerHTML = `<a class="page-link" href="#">${pagination.totalPages}</a>`;
    li.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage = pagination.totalPages;
      loadOrders();
    });
    ul.appendChild(li);
  }
  
  const nextLi = document.createElement('li');
  nextLi.className = `page-item ${currentPage === pagination.totalPages ? 'disabled' : ''}`;
  nextLi.innerHTML = `<a class="page-link" href="#">&raquo;</a>`;
  nextLi.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage < pagination.totalPages) {
      currentPage++;
      loadOrders();
    }
  });
  ul.appendChild(nextLi);
  
  const jumpDiv = document.createElement('div');
  jumpDiv.className = 'pagination-jump';
  jumpDiv.innerHTML = `
    <span>跳转到</span>
    <input type="number" min="1" max="${pagination.totalPages}" value="${currentPage}" id="page-jump-input">
    <span>页</span>
    <button class="btn btn-sm btn-outline-primary" id="page-jump-btn">跳转</button>
  `;
  
  const jumpBtn = document.getElementById('page-jump-btn');
  if (jumpBtn) {
    jumpBtn.addEventListener('click', () => {
      const pageInput = document.getElementById('page-jump-input');
      if (pageInput) {
        const page = parseInt(pageInput.value);
        if (page >= 1 && page <= pagination.totalPages) {
          currentPage = page;
          loadOrders();
        }
      }
    });
    
    const pageInput = document.getElementById('page-jump-input');
    if (pageInput) {
      pageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const page = parseInt(pageInput.value);
          if (page >= 1 && page <= pagination.totalPages) {
            currentPage = page;
            loadOrders();
          }
        }
      });
    }
  }
  
  container.appendChild(ul);
}

function updateActionButtons() {
  const deleteBtn = document.getElementById('delete-order-btn');
  const editBtn = document.getElementById('edit-order-btn');
  
  if (deleteBtn) deleteBtn.disabled = selectedOrderIds.length === 0;
  if (editBtn) editBtn.disabled = selectedOrderIds.length !== 1;
}

function showOrderModal(order = null) {
  const modal = document.getElementById('order-modal');
  const form = document.getElementById('order-form');
  const title = document.getElementById('modal-title');
  
  if (!modal || !form || !title) return;
  
  if (order) {
    title.textContent = '编辑订单';
    document.getElementById('order-id').value = order.id;
    document.getElementById('taobao-id').value = order.taobao_id;
    document.getElementById('product-name').value = order.product_name;
    document.getElementById('order-number').value = order.order_number;
    document.getElementById('price').value = order.price;
    document.getElementById('redeemed').checked = order.redeemed;
  } else {
    title.textContent = '添加订单';
    form.reset();
    document.getElementById('order-id').value = '';
    document.getElementById('redeemed').checked = false;
  }
  
  modal.style.display = 'block';
  modal.classList.add('show');
}

function closeOrderModal() {
  const modal = document.getElementById('order-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
}

async function saveOrder() {
  try {
    const form = document.getElementById('order-form');
    if (!form) return;
    
    const orderId = document.getElementById('order-id').value;
    const taobaoId = document.getElementById('taobao-id').value;
    const productName = document.getElementById('product-name').value;
    const orderNumber = document.getElementById('order-number').value;
    const price = parseFloat(document.getElementById('price').value);
    const redeemed = document.getElementById('redeemed').checked;
    const token = localStorage.getItem('token');
    
    if (!taobaoId || !productName || !orderNumber || isNaN(price)) {
      showErrorMessage('请填写所有必填字段');
      return;
    }
    
    let url, method;
    
    if (orderId) {
      url = `https://api.am-all.com.cn/api/orders/${orderId}`;
      method = 'PUT';
    } else {
      url = 'https://api.am-all.com.cn/api/orders';
      method = 'POST';
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        taobao_id: taobaoId,
        product_name: productName,
        order_number: orderNumber,
        price: price,
        redeemed: redeemed
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '保存订单失败');
    }
    
    closeOrderModal();
    loadOrders();
    showSuccessMessage(`订单${orderId ? '更新' : '添加'}成功`);
  } catch (error) {
    console.error('保存订单错误:', error);
    showErrorMessage(`保存订单失败: ${error.message}`);
  }
}

async function deleteOrders(ids) {
  try {
    if (!ids || ids.length === 0) return;
    
    if (!confirm(`确定要删除选中的 ${ids.length} 个订单吗？此操作不可撤销！`)) {
      return;
    }
    
    const token = localStorage.getItem('token');
    const promises = ids.map(id => 
      fetch(`https://api.am-all.com.cn/api/orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    );
    
    const results = await Promise.all(promises);
    const allSuccess = results.every(res => res.ok);
    
    if (allSuccess) {
      loadOrders();
      showSuccessMessage(`成功删除 ${ids.length} 个订单`);
    } else {
      throw new Error('部分订单删除失败');
    }
  } catch (error) {
    console.error('删除订单错误:', error);
    showErrorMessage('删除订单失败: ' + error.message);
  }
}

async function handleRedeemOrder() {
  const orderNumber = document.getElementById('order-number-input').value;
  const resultDiv = document.getElementById('exchange-result');
  
  if (!orderNumber) {
    resultDiv.innerHTML = '<div class="error">请输入订单号</div>';
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('https://api.am-all.com.cn/api/redeem-order', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ order_number: orderNumber })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '兑换失败');
    }
    
    const data = await response.json();
    
    let pointsEarned = 0;
    
    if (data.pointsEarned !== undefined) {
      pointsEarned = data.pointsEarned;
    } else if (data.point2 !== undefined && currentUser?.point2 !== undefined) {
      pointsEarned = data.point2 - currentUser.point2;
    } else if (data.deltaPoints !== undefined) {
      pointsEarned = data.deltaPoints;
    } else if (data.points !== undefined) {
      pointsEarned = data.points;
    }
    
    resultDiv.innerHTML = `<div class="success">兑换成功！获得 ${pointsEarned} 鸽屋积分</div>`;
    
    if (currentUser) {
      if (data.point2 !== undefined) {
        currentUser.point2 = data.point2;
      } else if (pointsEarned > 0) {
        currentUser.point2 = (currentUser.point2 || 0) + pointsEarned;
      }
      updateUserInfo(currentUser);
    }
    
    document.getElementById('order-number-input').value = '';
  } catch (error) {
    console.error('兑换错误:', error);
    resultDiv.innerHTML = `<div class="error">${error.message}</div>`;
  }
}

// 设置保存功能
function saveSettings() {
  const languageSelect = document.getElementById('language-select');
  const rememberLanguage = document.getElementById('remember-language');
  
  if (languageSelect) {
    localStorage.setItem('language', languageSelect.value);
  }
  if (rememberLanguage) {
    localStorage.setItem('rememberLanguage', rememberLanguage.checked);
  }
  
  showSuccessMessage('设置已保存');
  setTimeout(() => {
    window.location.reload();
  }, 1500);
}

// 增强的API请求函数
function secureFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  headers.set('X-Requested-With', 'XMLHttpRequest');
  
  const finalOptions = {
    ...options,
    credentials: 'include',
    mode: 'cors',
    headers
  };
  
  return fetch(url, finalOptions)
    .then(response => {
      if (!response.ok) {
        // 处理HTTP错误状态
        const error = new Error(`请求失败: ${response.status} ${response.statusText}`);
        error.status = response.status;
        
        // 尝试解析错误信息
        return response.text().then(text => {
          try {
            const errorData = JSON.parse(text);
            error.message = errorData.error || error.message;
            error.details = errorData.details;
          } catch (e) {
            error.message = text || error.message;
          }
          throw error;
        });
      }
      
      return response.json();
    })
    .catch(error => {
      console.error('请求处理错误:', error);
      
      // 添加特定错误处理
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        error.message = '网络连接失败，请检查网络设置';
      }
      
      throw error;
    });
}

// 初始化SPA功能
document.addEventListener("DOMContentLoaded", function() {
  function checkAndResetDailyFortune() {
    const lastDrawDate = localStorage.getItem('dailyFortuneDate');
    const today = new Date().toDateString();
    const token = localStorage.getItem('token');
    const savedUserInfo = localStorage.getItem('userInfo');

    // 先尝试从本地存储恢复用户信息
    if (token && savedUserInfo) {
      try {
        const user = JSON.parse(savedUserInfo);
        currentUser = user;
        updateUserInfo(user);
        showUserInfo();
        setupUserDropdown();
      } catch (e) {
        console.error('从本地存储恢复用户信息失败:', e);
        checkLoginStatus();
      }
    } else {
      checkLoginStatus();
    }

    // 其余代码保持不变...
    if (lastDrawDate && lastDrawDate !== today) {
      localStorage.removeItem('dailyFortuneDate');
      localStorage.removeItem('dailyFortuneData');
      
      const activePage = document.querySelector('.sidebar-nav a.active')?.getAttribute('data-page');
      if (activePage === 'fortune') {
        const fortuneSection = document.querySelector('.fortume-section');
        if (fortuneSection) {
          fortuneSection.classList.add('reset-fortune');
          setTimeout(() => {
            loadPage('fortune');
            fortuneSection.classList.remove('reset-fortune');
          }, 1000);
        }
      }
    }
  }

  checkAndResetDailyFortune();
  setInterval(checkAndResetDailyFortune, 60 * 60 * 1000);
    
    checkLoginStatus();
    
    document.getElementById('logout-pc')?.addEventListener('click', handleLogout);
    document.getElementById('logout-mobile')?.addEventListener('click', handleLogout);
    
  document.body.addEventListener('click', function(e) {
    
    // 忽略权限弹窗内部点击，让弹窗自身处理（避免全局代理干扰）
    if (e && e.target && e.target.closest && e.target.closest('.permission-modal')) { return; }
// 处理所有带有 data-page 属性的链接
      const pageLink = e.target.closest('[data-page]');
      if (pageLink) {
        e.preventDefault();
        const pageId = pageLink.getAttribute('data-page');
        loadPage(pageId);
        
        if (window.innerWidth <= 992) {
          const sidebar = document.querySelector('.sidebar');
          if (sidebar) sidebar.classList.remove('show');
          document.body.classList.remove('mobile-sidebar-open');
          document.body.classList.add('mobile-sidebar-closed');
        }
        return;
      }

      // 新增：排除公告分页链接
      const announcementPageLink = e.target.closest('[data-announcement-page]');
      if (announcementPageLink) {
        // 不阻止默认行为，让公告系统处理
        return;
      }
        
      if (e.target.closest('#login-btn')) {
          e.preventDefault();
          handleLogin();
      }
      
      if (e.target.closest('#register-btn')) {
          e.preventDefault();
          handleRegister();
      }
      
      if (e.target.closest('#send-verification-code')) {
          e.preventDefault();
          const emailInput = document.getElementById('register-email');
          const errorElement = document.getElementById('register-error');
          if (emailInput && emailInput.value) {
              sendVerificationCode(emailInput.value, 'register')
                  .then(() => {
                      showSuccessMessage('验证码已发送');
                  })
                  .catch(error => {
                      showTempErrorMessage(errorElement, error.message || '发送验证码失败');
                  });
          } else {
              showTempErrorMessage(errorElement, '请输入邮箱地址');
          }
      }

      if (e.target.closest('#send-reset-code')) {
          e.preventDefault();
          const emailInput = document.getElementById('forgot-email');
          const errorElement = document.getElementById('forgot-error');
          if (emailInput && emailInput.value) {
              sendVerificationCode(emailInput.value, 'reset')
                  .then(() => {
                      showSuccessMessage('验证码已发送');
                  })
                  .catch(error => {
                      showTempErrorMessage(errorElement, error.message || '发送验证码失败');
                  });
          } else {
              showTempErrorMessage(errorElement, '请输入邮箱地址');
          }
      }

      if (e.target.closest('#verify-code-btn')) {
          e.preventDefault();
          const email = document.getElementById('forgot-email').value;
          const code = document.getElementById('forgot-verification-code').value;
          const errorElement = document.getElementById('forgot-error');

          if (!email || !code) {
              showTempErrorMessage(errorElement, '邮箱和验证码不能为空');
              return;
          }

          verifyCode(email, code, 'reset')
              .then(data => {
                  localStorage.setItem('resetToken', data.resetToken);
                  loadPage('reset-password');
              })
              .catch(error => {
                  showTempErrorMessage(errorElement, error.error || '验证码验证失败');
              });
      }

      if (e.target.closest('#reset-password-btn')) {
          e.preventDefault();
          const newPassword = document.getElementById('reset-new-password').value;
          const confirmPassword = document.getElementById('reset-confirm-password').value;
          const resetToken = localStorage.getItem('resetToken');
          const errorElement = document.getElementById('reset-error');

          if (!newPassword || !confirmPassword) {
              showTempErrorMessage(errorElement, '新密码和确认密码不能为空');
              return;
          }

          if (newPassword !== confirmPassword) {
              showTempErrorMessage(errorElement, '两次输入的密码不一致');
              return;
          }

          if (newPassword.length < 8 || newPassword.length > 16) {
              showTempErrorMessage(errorElement, '密码长度需在8-16个字符之间');
              return;
          }

          resetPassword(resetToken, newPassword)
              .then(() => {
                  showSuccessMessage('密码重置成功');
                  localStorage.removeItem('resetToken');
                  setTimeout(() => {
                      loadPage('login');
                  }, 2000);
              })
              .catch(error => {
                  showTempErrorMessage(errorElement, error.error || '密码重置失败');
              });
      }

    // 处理外部链接
    if (e.target.closest('a[href^="http"]') && !e.target.closest('a[href*="am-all.com.cn"]')) {
      // 外部链接，允许正常跳转
      return;
    }

    // 特别处理带有 external-link 类的链接
    if (e.target.closest('a.external-link')) {
      // 外部链接，允许正常跳转
      return;
    }

    // 允许语言切换链接正常跳转
    const languageLink = e.target.closest('a[href*="lang="]');
    if (languageLink) {
      // 允许语言切换链接正常行为
      return;
    }

    // 允许下载链接正常跳转
    const downloadLink = e.target.closest('a[href*="/download/"]') || 
               e.target.closest('a[href$=".zip"]') || 
               e.target.closest('a[href$=".rar"]') || 
               e.target.closest('a[href$=".7z"]') || 
               e.target.closest('a[href$=".exe"]');
    if (downloadLink) {
      // 允许下载链接正常行为
      return;
    }

    // 阻止其他链接的默认行为（仅限SPA内部导航）
    const spaLink = e.target.closest('a[href^="#"]') || 
            e.target.closest('a[href^="/"]') && !e.target.closest('a[href^="http"]');
    if (spaLink) {
      e.preventDefault();
      console.log('SPA链接被阻止:', spaLink.href);
    }
  });

  const sidebarToggle = document.querySelector('.sidebar-toggle');
  if (sidebarToggle) {
      sidebarToggle.style.display = 'none';
  }

  loadPage('home');
});

// 在捕获阶段拦截来自权限弹窗的点击，阻止冒泡到全局路由代理
document.addEventListener('click', function(e){
  if (e.target && e.target.closest && e.target.closest('.permission-modal')) { /* allow */ }
}, true);


// sidebar click delegation (defense in depth)
document.addEventListener('DOMContentLoaded', () => {
  const side = document.querySelector('.sidebar-nav') || document.getElementById('admin-section-nav');
  if (!side) return;
  side.addEventListener('click', (e) => {
    const el = e.target.closest('[data-page]');
    if (!el) return;
    const pid = el.getAttribute('data-page');
    if (!pid) return;
    e.preventDefault();
    try { if (typeof loadPage === 'function') loadPage(pid); } catch {}
  }, { passive: false });
});



// 轻量级 hash 路由：#/page → loadPage('page')
(function(){
  function handleHashRoute(){
    try {
      const h = location.hash || '';
      const m = h.match(/^#\/(\w[\w-]*)/);
      if (m && typeof loadPage === 'function') {
        loadPage(m[1]);
      }
    } catch(e) { console.warn('hash route fail', e); }
  }
  window.addEventListener('hashchange', handleHashRoute, false);
  if (location.hash && typeof loadPage === 'function') {
    try { handleHashRoute(); } catch {}
  }
})();