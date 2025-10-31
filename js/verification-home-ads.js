// ========================================
// 首页广告展示功能 - 完全重写版本
// 解决重复加载和刷新失效问题
// ========================================

// 广告加载管理器 - 使用单例模式和防抖
const HomeAdsManager = {
  loading: false,           // 是否正在加载
  loaded: false,           // 是否已加载
  loadTimer: null,         // 防抖计时器
  lastLoadTime: 0,         // 上次加载时间
  MIN_LOAD_INTERVAL: 500,  // 最小加载间隔(毫秒)
  
  /**
   * 重置状态
   */
  reset() {
    console.log('[广告系统] 重置状态');
    this.loaded = false;
    this.loading = false;
  },
  
  /**
   * 检查是否可以加载
   */
  canLoad() {
    const now = Date.now();
    const timeSinceLastLoad = now - this.lastLoadTime;
    
    if (this.loading) {
      console.log('[广告系统] 正在加载中,跳过');
      return false;
    }
    
    if (timeSinceLastLoad < this.MIN_LOAD_INTERVAL) {
      console.log('[广告系统] 加载间隔过短,跳过');
      return false;
    }
    
    return true;
  },
  
  /**
   * 标记开始加载
   */
  startLoading() {
    this.loading = true;
    this.lastLoadTime = Date.now();
  },
  
  /**
   * 标记加载完成
   */
  finishLoading(success) {
    this.loading = false;
    this.loaded = success;
  }
};

/**
 * 清除所有现有的广告区域
 */
function clearAllAdvertisements() {
  const existingAds = document.querySelectorAll('.home-advertisements');
  if (existingAds.length > 0) {
    console.log(`[广告系统] 清除 ${existingAds.length} 个现有广告区`);
    existingAds.forEach(ad => ad.remove());
    return true;
  }
  return false;
}

/**
 * 在首页加载广告 - 主函数
 * @param {boolean} forceReload - 是否强制重新加载
 */
async function loadHomeAdvertisements(forceReload = false) {
  console.log('[广告系统] loadHomeAdvertisements 被调用, forceReload:', forceReload);
  
  // 检查是否在首页
  const hash = window.location.hash;
  const isHomePage = hash === '#/home' || hash === '' || hash === '#/';
  
  if (!isHomePage) {
    console.log('[广告系统] 不在首页,跳过加载');
    return;
  }
  
  // 检查公告容器是否存在
  const announcementsContainer = document.getElementById('announcements-container');
  if (!announcementsContainer) {
    console.log('[广告系统] 未找到公告容器,跳过加载');
    return;
  }
  
  // 检查刷新标记
  const needsRefresh = localStorage.getItem('homeAdsNeedRefresh') === 'true';
  console.log('[广告系统] 刷新标记:', needsRefresh, '强制重载:', forceReload);
  
  // 如果需要刷新或强制重载,先清除所有广告和状态
  if (needsRefresh || forceReload) {
    console.log('[广告系统] 需要刷新,清除旧广告和状态');
    clearAllAdvertisements();
    HomeAdsManager.reset();
    localStorage.removeItem('homeAdsNeedRefresh');
  }
  
  // 如果已加载且不需要刷新,跳过
  if (HomeAdsManager.loaded && !needsRefresh && !forceReload) {
    console.log('[广告系统] 广告已加载且无需刷新,跳过');
    // 但要确保广告真的存在
    const existingAds = document.querySelector('.home-advertisements');
    if (existingAds) {
      return;
    } else {
      console.log('[广告系统] 状态显示已加载但广告不存在,重置状态');
      HomeAdsManager.reset();
    }
  }
  
  // 检查是否可以加载
  if (!HomeAdsManager.canLoad()) {
    return;
  }
  
  // 开始加载
  HomeAdsManager.startLoading();
  
  try {
    console.log('[广告系统] 开始请求广告数据');
    const response = await fetch('https://api.am-all.com.cn/api/verification/active-ads');
    
    if (!response.ok) {
      console.error('[广告系统] 获取广告失败,HTTP状态:', response.status);
      HomeAdsManager.finishLoading(false);
      return;
    }
    
    const data = await response.json();
    console.log('[广告系统] 获取到广告数据:', data);
    
    if (!data.advertisements || data.advertisements.length === 0) {
      console.log('[广告系统] 没有活跃广告');
      HomeAdsManager.finishLoading(true);
      return;
    }
    
    const ads = data.advertisements;
    console.log('[广告系统] 准备显示', ads.length, '个广告');
    
    // 再次确保没有重复的广告区
    clearAllAdvertisements();
    
    // 构建广告HTML
    const adsHTML = `
      <div class="home-advertisements">
        <h3 class="home-advertisements-title">
          <i class="fas fa-star"></i> 合作伙伴
        </h3>
        <div class="home-advertisements-grid">
          ${ads.map(ad => `
            <div class="home-ad-item" onclick="handleAdClick(${ad.id}, '${ad.shop_type}')">
              <img src="https://api.am-all.com.cn${ad.banner_image}" alt="${ad.shop_name}">
              <div class="home-ad-badge ${ad.verification_type}">
                ${ad.verification_type === 'personal' ? '个人' : '官方'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <hr>
    `;
    
    // 插入广告
    announcementsContainer.insertAdjacentHTML('afterend', adsHTML);
    console.log('[广告系统] 广告已成功插入页面');
    
    HomeAdsManager.finishLoading(true);
    
  } catch (error) {
    console.error('[广告系统] 加载首页广告失败:', error);
    HomeAdsManager.finishLoading(false);
  }
}

/**
 * 带防抖的加载函数
 */
function loadHomeAdvertisementsDebounced(forceReload = false, delay = 300) {
  console.log('[广告系统] 防抖加载,延迟:', delay, 'ms');
  
  // 清除之前的计时器
  if (HomeAdsManager.loadTimer) {
    clearTimeout(HomeAdsManager.loadTimer);
  }
  
  // 设置新的计时器
  HomeAdsManager.loadTimer = setTimeout(() => {
    loadHomeAdvertisements(forceReload);
  }, delay);
}

/**
 * 处理广告点击
 */
async function handleAdClick(adId, shopType) {
  try {
    const response = await fetch(`https://api.am-all.com.cn/api/verification/ad/${adId}`);
    
    if (!response.ok) {
      showErrorMessage('获取广告信息失败');
      return;
    }
    
    const data = await response.json();
    const ad = data.advertisement;
    
    if (!ad) {
      showErrorMessage('广告不存在');
      return;
    }
    
    // 记录点击
    recordAdClick(adId);
    
    // 根据店铺类型决定显示方式
    if (ad.shop_type === 'taobao') {
      if (ad.shop_link && ad.shop_link.trim() !== '') {
        window.open(ad.shop_link, '_blank');
      } else {
        showErrorMessage('该店铺暂无链接');
      }
    } else if (ad.shop_type === 'xianyu' || ad.shop_type === 'other') {
      if (ad.qr_code_image) {
        showAdQRCodeDirect(ad);
      } else {
        showErrorMessage('该店铺暂无二维码');
      }
    } else {
      showErrorMessage('未知的店铺类型');
    }
    
  } catch (error) {
    console.error('处理广告点击失败:', error);
    showErrorMessage('操作失败,请稍后重试');
  }
}

/**
 * 显示广告二维码
 */
function showAdQRCodeDirect(ad) {
  const shopTypeText = {
    'xianyu': '闲鱼',
    'taobao': '淘宝',
    'other': '其他'
  };
  
  const modalHTML = `
    <div class="verification-modal show" id="ad-qrcode-modal">
      <div class="verification-modal-content">
        <div class="verification-modal-header">
          <div class="verification-modal-title">${ad.shop_name}</div>
          <button class="verification-modal-close" onclick="closeAdQRCodeModal()">×</button>
        </div>
        
        <div class="text-center">
          <div class="verification-info-item mb-3">
            <div class="verification-info-label">店铺类型</div>
            <div class="verification-info-value">${shopTypeText[ad.shop_type]}</div>
          </div>
          
          <div class="verification-info-label mb-2">扫描二维码访问店铺</div>
          <img src="https://api.am-all.com.cn${ad.qr_code_image}" 
               alt="店铺二维码" 
               style="max-width: 300px; width: 100%; border-radius: 8px;">
        </div>
        
        <div class="verification-tip mt-3">
          <i class="fas fa-info-circle"></i>
          使用对应平台的APP扫描二维码即可访问店铺
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * 显示错误消息
 */
function showErrorMessage(message) {
  alert(message);
}

/**
 * 显示广告二维码(通过ID获取)
 */
async function showAdQRCode(adId) {
  try {
    const response = await fetch(`https://api.am-all.com.cn/api/verification/ad/${adId}`);
    
    if (!response.ok) {
      throw new Error('获取广告详情失败');
    }
    
    const data = await response.json();
    const ad = data.advertisement;
    
    if (!ad || !ad.qr_code_image) {
      showErrorMessage('该店铺暂无二维码');
      return;
    }
    
    showAdQRCodeDirect(ad);
    
  } catch (error) {
    console.error('显示二维码失败:', error);
    showErrorMessage('获取店铺信息失败');
  }
}

/**
 * 关闭广告二维码模态框
 */
function closeAdQRCodeModal() {
  const modal = document.getElementById('ad-qrcode-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

/**
 * 记录广告点击
 */
async function recordAdClick(adId) {
  try {
    await fetch(`https://api.am-all.com.cn/api/verification/ad/${adId}/click`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('记录广告点击失败:', error);
  }
}

/**
 * 强制刷新首页广告
 */
function refreshHomeAdvertisements() {
  console.log('[广告系统] 强制刷新');
  clearAllAdvertisements();
  HomeAdsManager.reset();
  localStorage.removeItem('homeAdsNeedRefresh');
  loadHomeAdvertisements(true);
}

/**
 * 标记首页广告需要刷新
 */
function markHomeAdsForRefresh() {
  console.log('[广告系统] 标记需要刷新');
  localStorage.setItem('homeAdsNeedRefresh', 'true');
  // 同时重置加载状态,确保下次可以重新加载
  HomeAdsManager.reset();
}

// 将函数暴露到全局作用域
window.loadHomeAdvertisements = loadHomeAdvertisements;
window.loadHomeAdvertisementsDebounced = loadHomeAdvertisementsDebounced;
window.handleAdClick = handleAdClick;
window.showAdQRCode = showAdQRCode;
window.showAdQRCodeDirect = showAdQRCodeDirect;
window.showErrorMessage = showErrorMessage;
window.closeAdQRCodeModal = closeAdQRCodeModal;
window.recordAdClick = recordAdClick;
window.refreshHomeAdvertisements = refreshHomeAdvertisements;
window.markHomeAdsForRefresh = markHomeAdsForRefresh;
window.clearAllAdvertisements = clearAllAdvertisements;
window.HomeAdsManager = HomeAdsManager;

// ========================================
// 事件监听器 - 简化版
// ========================================

if (typeof window !== 'undefined') {
  
  // 1. 页面加载完成
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[广告系统] DOMContentLoaded');
    // 使用防抖加载
    loadHomeAdvertisementsDebounced(false, 800);
  });
  
  // 2. 路由变化 - 这是最重要的
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    console.log('[广告系统] hashchange:', hash);
    
    // 只在切换到首页时处理
    if (hash === '#/home' || hash === '' || hash === '#/') {
      console.log('[广告系统] 切换到首页');
      
      // 检查是否需要刷新
      const needsRefresh = localStorage.getItem('homeAdsNeedRefresh') === 'true';
      console.log('[广告系统] 需要刷新:', needsRefresh);
      
      if (needsRefresh) {
        // 需要刷新 - 清除旧的并重新加载
        console.log('[广告系统] 执行强制刷新');
        clearAllAdvertisements();
        HomeAdsManager.reset();
        localStorage.removeItem('homeAdsNeedRefresh');
        loadHomeAdvertisementsDebounced(true, 400);
      } else {
        // 不需要刷新 - 如果还没加载则加载
        if (!HomeAdsManager.loaded) {
          console.log('[广告系统] 首次加载');
          loadHomeAdvertisementsDebounced(false, 400);
        } else {
          console.log('[广告系统] 已加载,跳过');
        }
      }
    } else {
      // 离开首页 - 重置状态,但保留刷新标记
      console.log('[广告系统] 离开首页,重置状态');
      HomeAdsManager.loaded = false;
    }
  });
  
  // 3. 全局手动刷新函数
  window.forceRefreshHomeAds = function() {
    console.log('[广告系统] 手动强制刷新');
    refreshHomeAdvertisements();
  };
  
  console.log('[广告系统] 事件监听器已初始化');
}