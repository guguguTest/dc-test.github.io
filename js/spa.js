// spa.js - 单页面应用主模块
// 用户状态管理
let currentUser = null;
let cropper = null;

// 新增变量
let currentOrders = [];
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

// ====== 成功动画提示功能 ======
/**
 * 显示成功动画提示
 * @param {string} title - 标题文字
 * @param {string} message - 提示信息
 * @param {number} duration - 自动关闭时间（毫秒），默认3000
 * @param {function} callback - 关闭后的回调函数
 */
function showSuccessAnimation(title, message, duration = 3000, callback = null) {
  // 如果已存在成功动画，先移除
  const existingModal = document.getElementById('success-animation-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // 创建成功动画HTML结构
  const modalHTML = `
    <div id="success-animation-modal" class="success-animation-modal">
      <div class="success-animation-content">
        <!-- 光晕效果 -->
        <div class="success-glow"></div>
        
        <!-- 星星效果 -->
        <div class="success-stars">
          <span class="star"></span>
          <span class="star"></span>
          <span class="star"></span>
          <span class="star"></span>
          <span class="star"></span>
        </div>
        
        <!-- 成功图标 -->
        <div class="success-checkmark-wrapper">
          <div class="success-circle">
            <svg class="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="success-checkmark-circle" cx="26" cy="26" r="25"/>
              <path class="success-checkmark-check" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
        </div>
        
        <!-- 文字内容 -->
        <h2 class="success-title">${title}</h2>
        <p class="success-message">${message}</p>
        
        <!-- 进度条 -->
        <div class="success-progress-bar">
          <div class="success-progress"></div>
        </div>
        
        <!-- 彩带效果 -->
        <div class="confetti-container" id="confetti-container"></div>
      </div>
    </div>
  `;
  
  // 插入到body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // 获取modal元素
  const modal = document.getElementById('success-animation-modal');
  
  // 添加彩带粒子
  const confettiContainer = document.getElementById('confetti-container');
  if (confettiContainer) {
    createConfetti(confettiContainer, 30);
  }
  
  // 显示动画
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
  
  // 播放成功音效（如果需要）
  playSuccessSound();
  
  // 自动关闭
  setTimeout(() => {
    closeSuccessAnimation(modal, callback);
  }, duration);
  
  // 点击背景关闭
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeSuccessAnimation(modal, callback);
    }
  });
}

/**
 * 创建彩带粒子效果
 * @param {HTMLElement} container - 容器元素
 * @param {number} count - 粒子数量
 */
function createConfetti(container, count) {
  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(confetti);
  }
}

/**
 * 关闭成功动画
 * @param {HTMLElement} modal - 模态框元素
 * @param {function} callback - 回调函数
 */
function closeSuccessAnimation(modal, callback) {
  if (!modal) return;
  
  modal.style.animation = 'fadeOut 0.3s ease';
  
  setTimeout(() => {
    modal.remove();
    if (callback && typeof callback === 'function') {
      callback();
    }
  }, 300);
}

/**
 * 播放成功音效（可选）
 */
function playSuccessSound() {
  // 如果需要音效，可以在这里添加
  // const audio = new Audio('path/to/success-sound.mp3');
  // audio.play().catch(e => console.log('音效播放失败'));
}

// 添加fadeOut动画样式（如果还没有）
if (!document.querySelector('#fadeOutStyle')) {
  const style = document.createElement('style');
  style.id = 'fadeOutStyle';
  style.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ====== 修改登录成功处理 ======
// 找到 handleLogin 函数中的成功处理部分，替换为：
// 在登录成功的地方（大约在第652行附近）
function handleLoginWithAnimation() {
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
      currentUser = data.user;
      localStorage.setItem('userInfo', JSON.stringify(data.user));
      
      // 显示成功动画
      showSuccessAnimation(
        '登录成功',
        `欢迎回来，${data.user.nickname || data.user.username}！`,
        2500,
        () => {
          // 动画结束后更新界面
          updateUserInfo(data.user);
          showUserInfo();
          setupUserDropdown();
          
          // 异步获取权限并更新侧边栏
          fetchUserPermissions(data.token).then(permissions => {
            localStorage.setItem('userPermissions', JSON.stringify(permissions));
            updateSidebarVisibility(currentUser);
          });
          
          // 跳转到首页
          loadPage('home');
        }
      );
      
      return data;
    } else {
      throw new Error(data.error || '登录失败');
    }
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

// ====== 修改注册成功处理 ======
// 找到 handleRegister 函数中的成功处理部分，替换为：
function handleRegisterWithAnimation() {
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
      
      // 显示成功动画
      showSuccessAnimation(
        '注册成功',
        `欢迎加入，${nickname || username}！`,
        3000,
        () => {
          // 动画结束后更新界面
          updateUserInfo(data.user);
          showUserInfo();
          loadPage('home');
        }
      );
    } else {
      throw new Error(data.error || '注册失败');
    }
  })
  .catch(error => {
    showTempErrorMessage(errorElement, error.error || '注册失败');
  });
}

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

  const setDisplay = (el, show) => { 
    if (el) {
      el.style.display = show ? '' : 'none';
      console.log(`设置元素 ${el.id || el.className} 显示: ${show}`);
    }
  };

  // 定义所有页面
	const allPages = [
	  'home', 'download', 'tools', 'dllpatcher', 'settings', 'help', 'fortune', 'user-settings',
	  'ccb', 'exchange', 'announcement-admin', 'site-admin', 'download-admin', 'user-manager', 'order-entry'
	];

  // 存储每个页面的可见性
  const pageVisibility = {};

  // 处理所有页面的可见性
  if (!token) {
    // 未登录状态
    for (const pageId of allPages) {
      pageVisibility[pageId] = guestVisible.includes(pageId);
    }
  } else {
    // 已登录状态 - 批量获取所有页面的可见性
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // 使用 Promise.all 并行获取所有页面的可见性
    const visibilityPromises = allPages.map(async (pageId) => {
      try {
        const url = `https://api.am-all.com.cn/api/page-visibility/${encodeURIComponent(pageId)}`;
        const response = await fetch(url, {
          headers: headers,
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          return { pageId, visible: !!(data && data.visible) };
        }
        return { pageId, visible: false };
      } catch (e) {
        console.warn(`检查页面 ${pageId} 可见性失败:`, e);
        return { pageId, visible: false };
      }
    });
    
    const results = await Promise.all(visibilityPromises);
    results.forEach(result => {
      pageVisibility[result.pageId] = result.visible;
      console.log(`页面 ${result.pageId} 可见性: ${result.visible}`);
    });
  }

  // 应用可见性到DOM元素
  // 处理 data-page 属性的链接
  const nav = document.querySelector('.sidebar-nav');
  if (nav) {
    const links = nav.querySelectorAll('a[data-page]');
    links.forEach(a => {
      const pid = a.getAttribute('data-page');
      const parentLi = a.parentElement;
      if (parentLi) {
        setDisplay(parentLi, pageVisibility[pid] || false);
      }
    });
  }

  // 处理旧版 ID 兼容
  const legacyMap = {
    'sidebar-home': 'home',
    'sidebar-download': 'download',
    'sidebar-tools': 'tools',
    'sidebar-dllpatcher': 'dllpatcher',
    'sidebar-settings': 'settings',
    'sidebar-help': 'help',
    'sidebar-fortune': 'fortune',
    'sidebar-user-settings': 'user-settings',
    'sidebar-ccb': 'ccb',
    'sidebar-exchange': 'exchange',
    'sidebar-announcement-admin': 'announcement-admin',
	'sidebar-site-admin': 'site-admin', 
    'sidebar-download-admin': 'download-admin',
    'sidebar-user-manager': 'user-manager',
    'sidebar-order-entry': 'order-entry'
  };

  for (const [id, pid] of Object.entries(legacyMap)) {
    const el = document.getElementById(id);
    if (el) {
      const visible = pageVisibility[pid] || false;
      const targetEl = el.querySelector('a')?.parentElement || el;
      setDisplay(targetEl, visible);
      
      // 确保元素有正确的 data-page 属性
      const link = el.querySelector('a') || el;
      if (!link.getAttribute('data-page')) {
        link.setAttribute('data-page', pid);
      }
    }
  }

  // 处理分类标题
  // 等待一段时间确保所有元素都已更新
  setTimeout(() => {
    // 功能分类
    const functionTitle = document.querySelector('.sidebar-section-title');
    const functionNav = functionTitle ? functionTitle.nextElementSibling : null;
    
    if (functionTitle && functionNav && functionNav.tagName === 'UL') {
      if (!token) {
        // 未登录时隐藏功能分类
        setDisplay(functionTitle, false);
        setDisplay(functionNav, false);
      } else {
        // 检查功能分类下是否有可见项
        const functionPages = ['fortune', 'ccb', 'exchange'];
        const hasVisibleFunction = functionPages.some(p => pageVisibility[p]);
        setDisplay(functionTitle, hasVisibleFunction);
        setDisplay(functionNav, hasVisibleFunction);
      }
    }

	// 管理分类
	const adminTitle = document.getElementById('admin-section-title');
	const adminNav = document.getElementById('admin-section-nav');

	if (adminTitle && adminNav) {
	  if (!token) {
		setDisplay(adminTitle, false);
		setDisplay(adminNav, false);
	  } else {
		// 包含 site-admin 在内的所有管理页面
		const adminPages = ['announcement-admin', 'site-admin', 'download-admin', 'user-manager', 'order-entry'];
		const hasVisibleAdmin = adminPages.some(p => pageVisibility[p]);
		
		console.log('管理页面可见性:', adminPages.map(p => `${p}: ${pageVisibility[p]}`));
		console.log('是否显示管理分类:', hasVisibleAdmin);
		
		setDisplay(adminTitle, hasVisibleAdmin);
		setDisplay(adminNav, hasVisibleAdmin);
		
		// 确保管理页面的链接正确显示
		adminPages.forEach(pageId => {
		  const el = document.getElementById(`sidebar-${pageId}`);
		  if (el) {
			const visible = pageVisibility[pageId] || false;
			const targetEl = el.querySelector('a')?.parentElement || el;
			setDisplay(targetEl, visible);
		  }
		});
	  }
	}
  }, 300);  // 增加延迟确保所有异步操作完成
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
      .then(() => {
        // fetchUserInfo 已经调用了 updateSidebarVisibility
        console.log('用户信息加载完成，侧边栏已更新');
      })
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
    return fetchUserPermissions(token).then(permissions => {
      // 保存权限到本地存储
      localStorage.setItem('userPermissions', JSON.stringify(permissions));
      
      // 确保更新侧边栏显示
      updateSidebarVisibility(currentUser);
      
      return currentUser;
    });
  })
  .catch(error => {
    console.error('获取用户信息错误:', error);
    throw error;
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
  
  // 添加账户状态图标
  let stateIcon = userAvatarPc.parentElement.querySelector('.user-state-icon');
  if (!stateIcon) {
    stateIcon = document.createElement('img');
    stateIcon.className = 'user-state-icon';
    userAvatarPc.parentElement.appendChild(stateIcon);
  }
  
  // 根据状态设置图标
	switch(user.banState || 0) {
	  case 0:
		stateIcon.src = 'https://oss.am-all.com.cn/asset/img/other/dc/banState/bs0.png';
		stateIcon.title = '正常';
		break;
	  case 1:
		stateIcon.src = 'https://oss.am-all.com.cn/asset/img/other/dc/banState/bs1.png';
		stateIcon.title = '受限';
		break;
	  case 2:
		stateIcon.src = 'https://oss.am-all.com.cn/asset/img/other/dc/banState/bs2.png';
		stateIcon.title = '封禁';
		break;
	  default:
		stateIcon.src = 'https://oss.am-all.com.cn/asset/img/other/dc/banState/bs0.png';
		stateIcon.title = '正常';
	}
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
  
  // 特效保持不变
  let effect = userAvatarMobile.parentElement.querySelector('.avatar-effect-rainbow');
  if (!effect) {
    effect = document.createElement('div');
    effect.className = 'avatar-effect-rainbow';
    userAvatarMobile.parentElement.appendChild(effect);
  }
  effect.style.display = (user.rankSp === 1) ? 'block' : 'none';
  
  // 将状态图标添加到 user-info-text 容器（昵称和邮箱的容器）
  const userInfoText = document.querySelector('.sidebar-user-area .user-info-text');
  if (userInfoText) {
    let stateIcon = document.querySelector('.sidebar-user-area .user-state-icon-mobile');
    if (!stateIcon) {
      stateIcon = document.createElement('img');
      stateIcon.className = 'user-state-icon-mobile';
      // 插入到user-info-text容器的开头
      userInfoText.insertBefore(stateIcon, userInfoText.firstChild);
    }
    
    // 根据状态设置图标
	switch(user.banState || 0) {
	  case 0:
		stateIcon.src = 'https://oss.am-all.com.cn/asset/img/other/dc/banState/bs0.png';
		stateIcon.title = '正常';
		break;
	  case 1:
		stateIcon.src = 'https://oss.am-all.com.cn/asset/img/other/dc/banState/bs1.png';
		stateIcon.title = '受限';
		break;
	  case 2:
		stateIcon.src = 'https://oss.am-all.com.cn/asset/img/other/dc/banState/bs2.png';
		stateIcon.title = '封禁';
		break;
	  default:
		stateIcon.src = 'https://oss.am-all.com.cn/asset/img/other/dc/banState/bs0.png';
		stateIcon.title = '正常';
	}
  }
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
  const displayText = user.nickname ? 
    `${user.nickname} (${user.username})` : 
    user.username;
  settingsUsername.textContent = displayText;
}
  if (settingsEmail) {
    settingsEmail.textContent = user.email || '未设置';
  }
  if (settingsUid) {
    settingsUid.textContent = user.uid;
  }
  
  // 添加账户状态显示
	const settingsUserState = document.getElementById('settings-user-state');
	if (settingsUserState) {
	  let stateBadge = '';
	  let stateText = '';
	  
	  switch(user.banState || 0) {  // 改为 banState
		case 0:
		  stateBadge = 'state-normal';
		  stateText = '正常';
		  break;
		case 1:
		  stateBadge = 'state-limited';
		  stateText = '受限';
		  break;
		case 2:
		  stateBadge = 'state-banned';
		  stateText = '封禁';
		  break;
		default:
		  stateBadge = 'state-normal';
		  stateText = '正常';
	  }
	  
	  settingsUserState.innerHTML = `<span class="user-state-badge ${stateBadge}">${stateText}</span>`;
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
  
  // 所有页面的显示控制交给 updateSidebarVisibility 统一处理
  // 不再在这里硬编码任何页面的显示/隐藏
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
  
  // 统一使用 updateSidebarVisibility 处理侧边栏显示
  // 传入 null 表示未登录状态
  updateSidebarVisibility(null);
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
      currentUser = data.user;
      localStorage.setItem('userInfo', JSON.stringify(data.user));
      
      // 显示成功动画
      showSuccessAnimation(
        '登录成功',
        `欢迎回来，${data.user.nickname || data.user.username}！`,
        2500,
        () => {
          // 动画结束后更新界面
          updateUserInfo(data.user);
          showUserInfo();
          setupUserDropdown();
          
          // 初始化消息系统（登录成功后）
          if (typeof initMessageSystem === 'function') {
            setTimeout(() => {
              try {
                initMessageSystem();
                console.log('消息系统初始化成功');
              } catch (error) {
                console.error('消息系统初始化失败:', error);
              }
            }, 500);
          }
          
          // 异步获取权限并更新侧边栏
          fetchUserPermissions(data.token).then(permissions => {
            localStorage.setItem('userPermissions', JSON.stringify(permissions));
            updateSidebarVisibility(currentUser);
          }).catch(error => {
            console.error('获取用户权限失败:', error);
            // 即使权限获取失败，也继续其他操作
            updateSidebarVisibility(currentUser);
          });
          
          // 跳转到首页
          loadPage('home');
        }
      );
      
      return data;
    } else {
      throw new Error(data.error || '登录失败');
    }
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
    } else if (error.message) {
      userMessage = error.message;
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
      currentUser = data.user;
      localStorage.setItem('userInfo', JSON.stringify(data.user));
      
      // 显示成功动画
      showSuccessAnimation(
        '注册成功',
        `欢迎加入，${nickname || username}！`,
        3000,
        () => {
          // 动画结束后更新界面
          updateUserInfo(data.user);
          showUserInfo();
          
          // 初始化消息系统（注册成功后）
          if (typeof initMessageSystem === 'function') {
            setTimeout(() => {
              try {
                initMessageSystem();
                console.log('消息系统初始化成功');
              } catch (error) {
                console.error('消息系统初始化失败:', error);
              }
            }, 500);
          }
          
          loadPage('home');
        }
      );
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
  // 清理消息系统
  if (typeof cleanupMessageSystem === 'function') {
    try {
      cleanupMessageSystem();
      console.log('消息系统已清理');
    } catch (error) {
      console.error('清理消息系统失败:', error);
    }
  }
  
  // 清除本地存储
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  localStorage.removeItem('userPermissions');
  
  // 清除当前用户
  currentUser = null;
  
  // 立即更新界面显示
  showAuthLinks();
  
  // 确保侧边栏更新完成
  setTimeout(() => {
    if (typeof updateSidebarVisibility === 'function') {
      updateSidebarVisibility(null);
    }
  }, 100);
  
  // 显示退出成功提示（可选）
  if (typeof showSuccessMessage === 'function') {
    showSuccessMessage('已成功退出登录');
  }
  
  // 跳转到首页
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
    // ===== 特殊处理tools页面 =====
    if (pageId === 'tools') {
      if (typeof initToolsDisplay === 'function') {
        initToolsDisplay();
      } else {
        console.error('initToolsDisplay 函数未定义');
        contentContainer.innerHTML = '<div class="section"><h1>加载失败</h1><p>工具页面模块未加载</p></div>';
      }
      
      if (typeof languageModule !== 'undefined') {
        languageModule.initLanguage();
      }
      
      document.body.classList.remove('spa-loading');
      updateActiveMenuItem(pageId);
      return; // 重要：直接返回，不继续执行后续代码
    }

    // 消息中心 - 不使用 await
    if (pageId === 'message-center') {
      if (typeof renderMessageCenter === 'function') {
        renderMessageCenter();
      } else {
        contentContainer.innerHTML = '<div class="section"><h1>消息中心</h1><p>消息系统加载失败</p></div>';
      }
      
      // 延迟移除加载状态，让页面有时间渲染
      setTimeout(() => {
        document.body.classList.remove('spa-loading');
        updateActiveMenuItem(pageId);
      }, 100);
      
      return;
    }

    // 系统消息管理页面
    if (pageId === 'system-message-admin') {
      document.body.classList.add('spa-loading');
    
      try {
        if (typeof renderSystemMessageAdmin === 'function') {
          renderSystemMessageAdmin();
        }
      } finally {
        document.body.classList.remove('spa-loading');
        updateActiveMenuItem(pageId);
    }
    return;
  }
    // ===== 特殊处理结束 =====
    
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
  
  // 添加选项卡切换功能
  setTimeout(() => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabBtns.length > 0) {
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetTab = btn.getAttribute('data-tab');
          
          // 切换按钮状态
          tabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // 切换内容显示
          tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${targetTab}-tab`) {
              content.classList.add('active');
            }
          });
        });
      });
    }
    
    // 点击头像区域触发上传
    const avatarWrapper = document.querySelector('.avatar-wrapper');
    const avatarUpload = document.getElementById('avatar-upload');
    
    if (avatarWrapper && avatarUpload) {
      avatarWrapper.addEventListener('click', () => {
        avatarUpload.click();
      });
    }
    
    // 检查是否有绑定信息，显示相应内容
    const bindingSection = document.getElementById('ccb-binding-section');
    const noBindingMessage = document.getElementById('no-binding-message');
    
    if (currentUser && currentUser.game_server && currentUser.keychip && currentUser.guid) {
      if (bindingSection) bindingSection.style.display = 'block';
      if (noBindingMessage) noBindingMessage.style.display = 'none';
    } else {
      if (bindingSection) bindingSection.style.display = 'none';
      if (noBindingMessage) noBindingMessage.style.display = 'block';
    }
    
    // 更新显示的用户名和邮箱
    const usernameDisplay = document.getElementById('settings-username-display');
    const emailDisplay = document.getElementById('settings-email-display');
    
    if (usernameDisplay && currentUser) {
      usernameDisplay.textContent = currentUser.username || '-';
    }
    if (emailDisplay && currentUser) {
      emailDisplay.textContent = currentUser.email || '未设置';
    }
  }, 100);
  
  // 头像上传处理
  const changeAvatarBtn = document.getElementById('change-avatar-btn');
  const avatarUpload = document.getElementById('avatar-upload');
  const cancelAvatarBtn = document.getElementById('cancel-avatar-btn');
  
  if (avatarUpload) {
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
          const cropSection = document.getElementById('avatar-crop-section');
          
          cropContainer.innerHTML = '';
          const img = document.createElement('img');
          img.id = 'avatar-to-crop';
          img.src = event.target.result;
          img.style.maxWidth = '100%';
          img.style.maxHeight = '300px';
          
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
            minCropBoxHeight: 100
          });
          
          cropSection.style.display = 'flex';
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
              
              if (cropper) {
                cropper.destroy();
                cropper = null;
              }
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
      
      if (!currentPassword || !newPassword || !confirmPassword) {
        showErrorMessage('请填写所有密码字段');
        return;
      }
      
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
          document.getElementById('new-password-counter').textContent = '0';
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
  
  // 字符计数器
  const nicknameInput = document.getElementById('settings-nickname');
  if (nicknameInput) {
    nicknameInput.addEventListener('input', function() {
      const counter = document.getElementById('settings-nickname-counter');
      if (counter) {
        counter.textContent = this.value.length;
      }
    });
  }
  
  const newPasswordInput = document.getElementById('new-password');
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', function() {
      const counter = document.getElementById('new-password-counter');
      if (counter) {
        counter.textContent = this.value.length;
      }
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
  
  // 添加语言切换事件监听器（修复版：不刷新页面）
  if (languageSelect) {
    languageSelect.addEventListener('change', function() {
      const lang = this.value;
      const remember = document.getElementById('remember-language').checked;
      
      // 保存语言设置
      localStorage.setItem('language', lang);
      if (remember) {
        localStorage.setItem('savedLanguage', lang);
      }
      
      // 直接调用语言模块更新，不刷新页面
      if (typeof languageModule !== 'undefined' && languageModule.setLanguage) {
        // 显示加载提示（可选）
        const loadingEl = document.querySelector('.spa-loader');
        if (loadingEl) {
          loadingEl.style.display = 'flex';
        }
        
        // 使用 setTimeout 确保UI更新流畅
        setTimeout(() => {
          languageModule.setLanguage(lang);
          
          // 隐藏加载提示
          if (loadingEl) {
            loadingEl.style.display = 'none';
          }
          
          // 显示成功提示
          if (typeof showSuccessMessage === 'function') {
            showSuccessMessage('语言已切换为: ' + (lang === 'zh-cn' ? '中文' : lang === 'en-us' ? 'English' : '日本語'));
          }
        }, 50);
      }
      
      // 更新URL参数（不刷新页面）
      const url = new URL(window.location);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url);
      
      // 重要：移除了 window.location.reload() 调用
    });
  }
  
  // 记住语言偏好开关事件
  if (rememberLanguage) {
    rememberLanguage.addEventListener('change', function() {
      localStorage.setItem('rememberLanguage', this.checked);
      if (this.checked) {
        const currentLang = document.getElementById('language-select').value;
        localStorage.setItem('savedLanguage', currentLang);
        showSuccessMessage('已启用语言记忆功能');
      } else {
        localStorage.removeItem('savedLanguage');
        showSuccessMessage('已关闭语言记忆功能');
      }
    });
  }
  
  // ===== 重要：初始化鼠标样式设置 =====
  setTimeout(() => {
    // 方法1：如果有全局函数
    if (typeof window.initCursorSettings === 'function') {
      window.initCursorSettings();
    }
    // 方法2：直接调用CursorManager
    else if (typeof CursorManager !== 'undefined' && CursorManager.initSettingsUI) {
      CursorManager.initSettingsUI();
    }
    // 方法3：手动创建界面
    else {
      console.log('正在手动初始化鼠标设置界面...');
      initCursorSettingsManually();
    }
  }, 100);
  
  // 修改保存按钮事件（移除页面刷新）
  const saveBtn = document.getElementById('save-settings');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      const language = document.getElementById('language-select').value;
      const rememberLanguage = document.getElementById('remember-language').checked;
      
      // 保存设置
      localStorage.setItem('language', language);
      localStorage.setItem('rememberLanguage', rememberLanguage);
      
      if (rememberLanguage) {
        localStorage.setItem('savedLanguage', language);
      }
      
      // 鼠标样式已经在选择时自动保存，这里只需要显示成功消息
      showSuccessMessage('设置已保存');
      
      // 移除了 setTimeout 和 window.location.reload()
    });
  }
}

// 手动初始化鼠标设置界面的备用函数
function initCursorSettingsManually() {
  const container = document.getElementById('cursor-preview-container');
  if (!container) {
    console.error('找不到鼠标预览容器');
    return;
  }
  
  const currentStyle = localStorage.getItem('cursorStyle') || 'default';
  
  // 鼠标样式配置
  const cursorStyles = {
    default: {
      name: '默认',
      description: '系统默认鼠标',
      icon: 'fas fa-mouse-pointer',
      value: 'default'
    },
    custom1: {
      name: '井盖',
      description: '个性化鼠标样式',
      icon: 'fas fa-circle',
      value: 'custom1'
    },
    custom2: {
      name: 'まひろ',
      description: '可爱风格鼠标',
      icon: 'fas fa-heart',
      value: 'custom2'
    }
  };
  
  // 创建预览卡片
  let html = '<div class="cursor-preview">';
  
  Object.entries(cursorStyles).forEach(([key, style]) => {
    const isActive = key === currentStyle;
    html += `
      <div class="cursor-option ${isActive ? 'active' : ''}" data-cursor="${key}">
        <div class="cursor-option-icon">
          <i class="${style.icon}"></i>
        </div>
        <div class="cursor-option-name">${style.name}</div>
        <div class="cursor-option-desc">${style.description}</div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
  
  // 添加点击事件
  container.querySelectorAll('.cursor-option').forEach(option => {
    option.addEventListener('click', function(e) {
      const cursorType = this.dataset.cursor;
      
      // 更新UI
      document.querySelectorAll('.cursor-option').forEach(opt => {
        opt.classList.remove('active');
      });
      this.classList.add('active');
      
      // 保存设置
      localStorage.setItem('cursorStyle', cursorType);
      
      // 应用样式
      applyCursorStyle(cursorType);
      
      // 显示成功消息
      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage(`鼠标样式已切换为: ${cursorStyles[cursorType].name}`);
      }
    });
  });
}

		// 应用鼠标样式的备用函数
		function applyCursorStyle(styleName) {
		  // 移除所有鼠标样式类
		  document.body.classList.remove('cursor-default', 'cursor-custom1', 'cursor-custom2');
		  
		  // 应用新的鼠标样式
		  document.body.classList.add(`cursor-${styleName}`);
}

		if (pageId === 'user-manager') {
		  // 权限已在前面通过 /api/check-permission 检查
		  // 直接初始化页面
		  if (typeof initUserManager === 'function') {
			setTimeout(initUserManager, 100);
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
		  // 权限已在前面通过 /api/check-permission 检查
		  // 直接初始化页面
		  if (typeof initDownloadAdminPage === 'function') {
			setTimeout(initDownloadAdminPage, 100);
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

      // 公告管理页面
      if (pageId === 'announcement-admin') {
        if (typeof initAnnouncementAdminSystem === 'function') {
          setTimeout(initAnnouncementAdminSystem, 100);
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
        // 后端统一鉴权；此处仅初始化页面逻辑
        if (typeof initUserManager === 'function') {
          setTimeout(initUserManager, 100);
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

function normalizePageId(pid) {
  if (!pid) return pid;
  var map = { 
    'ccb': 'ccb', 
    'game-check': 'ccb', 
    'games': 'ccb'
    // 删除 exchange 和 site-admin 的映射
  };
  return map[pid] || pid;
}

function updateActiveMenuItem(activePage) {
  try {
    var page = normalizePageId(activePage);
    // 清空
    var els = document.querySelectorAll('.sidebar-nav li, .sidebar-nav a');
    for (var i=0;i<els.length;i++){ els[i].classList.remove('active'); }

    // 精确匹配 a[data-page]
    var link = document.querySelector('.sidebar-nav a[data-page="' + page + '"]');
    if (!link) {
      var legacy = document.getElementById('sidebar-' + page);
      if (legacy) link = legacy.tagName === 'A' ? legacy : legacy.querySelector('a');
    }
    if (link) {
      link.classList.add('active');
      var li = link.closest ? link.closest('li') : null;
      if (li) li.classList.add('active');
      return;
    }
  } catch (e) { console.warn('[updateActiveMenuItem] error:', e); }
}

// 初始化订单录入页面（增强版）
function initOrderEntryPage() {
  loadOrders();
  
  // 搜索功能
  const searchBtn = document.getElementById('order-search-btn');
  const searchInput = document.getElementById('order-search-input');
  
  if (searchBtn) {
    searchBtn.addEventListener('click', function() {
      currentPage = 1;
      loadOrders();
    });
  }
  
  if (searchInput) {
    // 支持回车搜索
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        currentPage = 1;
        loadOrders();
      }
    });
    
    // 添加清空按钮的支持
    searchInput.addEventListener('input', function(e) {
      if (e.target.value === '') {
        currentPage = 1;
        loadOrders();
      }
    });
  }

  // 添加订单按钮
  const addBtn = document.getElementById('add-order-btn');
  if (addBtn) {
    addBtn.addEventListener('click', function() {
      showOrderModal();
    });
  }

  // 表单提交
  const orderForm = document.getElementById('order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveOrder();
    });
  }
  
  // 关闭模态框按钮
  const closeBtn = document.querySelector('#order-modal .close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      closeOrderModal();
    });
  }
  
  // 点击模态框外部关闭
  const modal = document.getElementById('order-modal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeOrderModal();
      }
    });
  }
  
  // ESC键关闭模态框
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('order-modal');
      if (modal && modal.classList.contains('show')) {
        closeOrderModal();
      }
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
    
    currentOrders = data.orders.map(function(order){
      return Object.assign({}, order, {
        price: (typeof order.price === 'string') ? parseFloat(order.price) : order.price
      });
    });
    
    renderOrders(currentOrders);
    renderPagination(data.pagination);
    
  } catch (error) {
    console.error('加载订单错误:', error);
    showErrorMessage('加载订单失败: ' + error.message);
  }
}

// 渲染订单列表
function renderOrders(orders) {
  const tbody = document.getElementById('orders-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>暂无订单数据</p>
          </div>
        </td>
      </tr>`;
    return;
  }
  
  const sortedOrders = [...orders].sort((a, b) => a.id - b.id);
  
  sortedOrders.forEach((order, index) => {
    const tr = document.createElement('tr');
    
    const price = typeof order.price === 'number' ? order.price : parseFloat(order.price || 0);
    const formattedPrice = isNaN(price) ? '0.00' : price.toFixed(2);
    
    // 正确判断兑换状态
    const isRedeemed = order.redeemed === true || order.redeemed === 1 || order.redeemed === '1';
    
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${order.taobao_id || '-'}</td>
      <td title="${order.product_name || '-'}">${order.product_name || '-'}</td>
      <td>${order.order_number || '-'}</td>
      <td>¥${formattedPrice}</td>
      <td>
        ${isRedeemed ? 
          '<span class="status-badge redeemed"><i class="fas fa-check-circle"></i>已兑换</span>' : 
          '<span class="status-badge pending"><i class="fas fa-clock"></i>未兑换</span>'}
      </td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-2" onclick="editOrder(${order.id})" title="编辑订单">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder(${order.id})" title="删除订单">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 新增编辑订单函数：
function editOrder(orderId) {
  const order = currentOrders.find(o => o.id === orderId);
  if (order) {
    showOrderModal(order);
  } else {
    showErrorMessage('订单不存在');
  }
}

// 新增删除订单函数：
function deleteOrder(orderId) {
  const order = currentOrders.find(o => o.id === orderId);
  if (!order) {
    showErrorMessage('订单不存在');
    return;
  }
  
  if (confirm(`确定要删除订单 "${order.order_number}" 吗？\n此操作不可撤销！`)) {
    deleteOrderById(orderId);
  }
}

// 新增根据ID删除订单的函数：
async function deleteOrderById(id) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`https://api.am-all.com.cn/api/orders/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('删除订单失败');
    }
    
    // 重新加载订单列表
    await loadOrders();
    
    // 显示成功动画（如果有的话）
    if (typeof showSuccessAnimation === 'function') {
      showSuccessAnimation(
        '删除成功',
        '订单已删除',
        2000
      );
    } else {
      showSuccessMessage('订单删除成功');
    }
  } catch (error) {
    console.error('删除订单错误:', error);
    showErrorMessage('删除订单失败: ' + error.message);
  }
}

window.editOrder = editOrder;
window.deleteOrder = deleteOrder;

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

// 显示订单模态框（修复编辑时的兑换状态显示）
function showOrderModal(order = null) {
  const modal = document.getElementById('order-modal');
  const form = document.getElementById('order-form');
  const title = document.getElementById('modal-title');
  
  if (!modal || !form || !title) return;
  
  if (order) {
    title.innerHTML = '<i class="fas fa-edit me-2"></i>编辑订单';
    document.getElementById('order-id').value = order.id;
    document.getElementById('taobao-id').value = order.taobao_id || '';
    document.getElementById('product-name').value = order.product_name || '';
    document.getElementById('order-number').value = order.order_number || '';
    document.getElementById('price').value = order.price || '';
    
    // 修复：正确设置兑换状态选择框的值
    const redeemedSelect = document.getElementById('redeemed');
    const isRedeemed = order.redeemed === true || order.redeemed === 1 || order.redeemed === '1';
    redeemedSelect.value = isRedeemed ? 'true' : 'false';
  } else {
    title.innerHTML = '<i class="fas fa-plus-circle me-2"></i>添加订单';
    form.reset();
    document.getElementById('order-id').value = '';
    document.getElementById('redeemed').value = 'false';
  }
  
  modal.classList.add('show');
}

// 关闭订单模态框
function closeOrderModal() {
  const modal = document.getElementById('order-modal');
  if (modal) {
    modal.classList.remove('show');
    // 清空表单
    const form = document.getElementById('order-form');
    if (form) {
      form.reset();
      document.getElementById('order-id').value = '';
    }
  }
}

// 保存订单（修复兑换状态的保存）
async function saveOrder() {
  try {
    const form = document.getElementById('order-form');
    if (!form) return;
    
    const orderId = document.getElementById('order-id').value;
    const taobaoId = document.getElementById('taobao-id').value.trim();
    const productName = document.getElementById('product-name').value.trim();
    const orderNumber = document.getElementById('order-number').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    
    // 修复：正确获取兑换状态的布尔值
    const redeemedValue = document.getElementById('redeemed').value;
    const redeemed = redeemedValue === 'true' || redeemedValue === '1';
    
    const token = localStorage.getItem('token');
    
    // 验证必填字段
    if (!taobaoId || !productName || !orderNumber || isNaN(price)) {
      showErrorMessage('请填写所有必填字段');
      return;
    }
    
    // 验证价格
    if (price < 0) {
      showErrorMessage('价格不能为负数');
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
        redeemed: redeemed  // 发送布尔值
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '保存订单失败');
    }
    
    closeOrderModal();
    await loadOrders();
    
    // 显示成功动画（如果有的话）
    if (typeof showSuccessAnimation === 'function') {
      showSuccessAnimation(
        `订单${orderId ? '更新' : '添加'}成功`,
        `订单号: ${orderNumber}`,
        2000
      );
    } else {
      showSuccessMessage(`订单${orderId ? '更新' : '添加'}成功`);
    }
  } catch (error) {
    console.error('保存订单错误:', error);
    showErrorMessage(`保存订单失败: ${error.message}`);
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
    // 修复：排除消息系统相关的链接点击
    const isMessageSystemClick = e.target.closest('.message-dropdown') || 
                                  e.target.closest('.message-dropdown-mobile') ||
                                  e.target.closest('.message-item') ||
                                  e.target.closest('.chat-modal') ||
                                  e.target.closest('#system-message-modal') ||
                                  e.target.closest('[data-message-id]');
    
    if (isMessageSystemClick) {
      // 让消息系统自己处理点击事件
      return;
    }
    
    const spaLink = e.target.closest('a[href^="#"]') || 
            e.target.closest('a[href^="/"]') && !e.target.closest('a[href^="http"]');
    if (spaLink) {
      // 只阻止真正的导航链接，不阻止功能性链接
      const href = spaLink.getAttribute('href');
      if (href && href !== '#' && !href.includes('javascript:')) {
        e.preventDefault();
        // console.log('SPA链接被阻止:', spaLink.href); // 注释掉调试信息
      }
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


// === Safe Route Contract (non-breaking) ===
// Falls back to site's original loadPage for all unknown routes.
(function(){
  if (window.__routeContractInstalledSafe) return;
  window.__routeContractInstalledSafe = true;

  if (typeof window !== 'undefined' && typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
  }

  function ensure(fnName){
    return (typeof window[fnName] === 'function') ? window[fnName] : function(){
      const c = document.getElementById('content-container') || document.body;
      if (c) c.innerHTML = '<div class="section"><h1>404</h1><p>缺少渲染函数：' + fnName + '</p></div>';
    };
  }

  async function checkAuth(permissionPage){
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      const base = window.API_BASE_URL || 'https://api.am-all.com.cn';
      const r = await fetch(base + '/api/check-permission?page=' + encodeURIComponent(permissionPage), {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await r.json().catch(()=>({}));
      return !!(r.ok && (data.hasAccess !== false));
    } catch (e) {
      console.warn('checkAuth error:', e);
      return false;
    }
  }

  const ROUTES = {
    'ccb': { protected: true, perm: 'ccb', handler: () => ensure('renderCCBUserPage')() },
    'site-admin': { protected: true, perm: 'site-admin', handler: () => ensure('renderSiteAdminHome')() },
    'site-admin-ccb-servers': { protected: true, perm: 'site-admin', handler: () => ensure('renderCCBServersPage')() },
    'site-admin-ccb-games': { protected: true, perm: 'site-admin', handler: () => ensure('renderCCBGamesPage')() },
  };
  window.ROUTES = Object.assign({}, window.ROUTES || {}, ROUTES);

  function makeWrapper(orig){
    async function wrapper(pageId){
      try {
        const route = (window.ROUTES && window.ROUTES[pageId]) || null;
        if (route) {
          if (route.protected) {
            const ok = await checkAuth(route.perm || pageId);
            if (!ok) {
              if (typeof showErrorMessage === 'function') showErrorMessage('需要权限才能访问此页面');
              // fall back to home via orig if available
              if (typeof orig === 'function') return orig('home');
              return;
            }
          }
          return route.handler();
        }
        // Unknown route: defer to site's original router
        if (typeof orig === 'function') return orig(pageId);
        // No original: do nothing (do NOT force 404 to avoid breaking legacy flows)
      } catch (e) {
        console.error('Route wrapper error:', e);
        if (typeof orig === 'function') return orig(pageId);
      }
    }
    // Tag for detection
    Object.defineProperty(wrapper, '__isRouteWrapper', { value: true });
    return wrapper;
  }

  function install(){
    const orig = (typeof window.loadPage === 'function' && !window.loadPage.__isRouteWrapper)
      ? window.loadPage
      : (typeof window.__origLoadPage === 'function' ? window.__origLoadPage : null);

    window.__origLoadPage = orig || window.__origLoadPage || null;
    const wrapper = makeWrapper(window.__origLoadPage);
    window.loadPage = wrapper;
  }

  // Install once DOM is ready (to maximize chance that site's router is already defined)
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(install, 0);
  } else {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(install, 0); });
  }

  // Auto re-wrap if other scripts replace loadPage later
  let tries = 0;
  const maxTries = 20;
  const iv = setInterval(function(){
    tries++;
    const lp = window.loadPage;
    if (typeof lp === 'function' && !lp.__isRouteWrapper) {
      // Someone replaced it; capture as new orig and re-wrap
      window.__origLoadPage = lp;
      window.loadPage = makeWrapper(lp);
    }
    if (tries >= maxTries) clearInterval(iv);
  }, 250);
})();


// -- Delegate: immediately highlight sidebar item on click

document.addEventListener('click', function(e){
  var t = e.target; if (!t || !t.closest) return;
  var a = t.closest('.sidebar-nav a[data-page]');
  if (!a) return;
  var pid = a.getAttribute('data-page');
  if (!pid) return;
  try { updateActiveMenuItem(pid); } catch(_) {}
}, true);