// ========================================
// 认证管理和广告发布功能
// ========================================

/**
 * 加载认证管理页面
 */
async function loadVerificationManagement() {
  const container = document.getElementById('content-container');
  if (!container) return;
  
  try {
    const token = localStorage.getItem('token');
    
    // 获取认证申请信息
    const appResponse = await secureFetch('https://api.am-all.com.cn/api/verification/my-application', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!appResponse || !appResponse.application || appResponse.application.status !== 'approved') {
      loadVerificationEntry();
      return;
    }
    
    const application = appResponse.application;
    VerificationModule.currentApplication = application;
    
    // 获取广告信息
    const adResponse = await secureFetch('https://api.am-all.com.cn/api/verification/my-advertisement', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const typeText = application.type === 'personal' ? '个人认证' : '官方认证';
    const typeIcon = application.type === 'personal' ? 'user-circle' : 'certificate';
    
    let advertisementSection = '';
    
	if (adResponse && adResponse.advertisement) {
	  // 已发布广告
	  const ad = adResponse.advertisement;
	  VerificationModule.currentAdvertisement = ad;
	  
	  const remainingDays = Math.ceil(
		(new Date(ad.end_date) - new Date()) / (1000 * 60 * 60 * 24)
	  );
	  const isExpired = ad.status === 'expired' || remainingDays < 0;
	  const isCancelled = ad.status === 'cancelled';
	  // 只有“未过期且剩余 ≤ 7 天”的广告可以续费
	  const canRenew = !isExpired && remainingDays <= 7;
	  
	  // 确定广告的实际状态
	  let statusText = '';
	  let statusBadgeClass = '';
	  if (isCancelled) {
		statusText = '已下架';
		statusBadgeClass = 'status-cancelled';
	  } else if (isExpired) {
		statusText = '已过期';
		statusBadgeClass = 'status-expired';
	  } else {
		statusText = '生效中';
		statusBadgeClass = 'status-active';
	  }
	  
	  advertisementSection = `
		<div class="advertisement-card">
		  <div class="advertisement-header">
			<div class="advertisement-title">
			  <i class="fas fa-ad"></i> 首页广告
			</div>
			<span class="advertisement-status-badge ${statusBadgeClass}">
			  ${statusText}
			</span>
		  </div>
		  
		  <div class="advertisement-details">
			<div class="advertisement-detail-item">
			  <span class="advertisement-detail-label">店铺名称</span>
			  <span class="advertisement-detail-value">${ad.shop_name}</span>
			</div>
			<div class="advertisement-detail-item">
			  <span class="advertisement-detail-label">店铺类型</span>
			  <span class="advertisement-detail-value">${getShopTypeText(ad.shop_type)}</span>
			</div>
			<div class="advertisement-detail-item">
			  <span class="advertisement-detail-label">剩余时间</span>
			  <span class="advertisement-detail-value ${isExpired ? 'text-danger' : ''}">
				${isExpired ? '已过期' : remainingDays + ' 天'}
			  </span>
			</div>
			<div class="advertisement-detail-item">
			  <span class="advertisement-detail-label">发布时间</span>
			  <span class="advertisement-detail-value">${formatDateTime(ad.start_date)}</span>
			</div>
			<div class="advertisement-detail-item">
			  <span class="advertisement-detail-label">到期时间</span>
			  <span class="advertisement-detail-value">${formatDateTime(ad.end_date)}</span>
			</div>
		  </div>
		  
		  <div class="text-center mt-3">
			<button class="verification-btn verification-btn-secondary me-2" onclick="viewAdvertisementDetails()">
			  <i class="fas fa-eye"></i> 查看详情
			</button>
			${!isExpired ? `
			  <button class="verification-btn verification-btn-primary me-2" onclick="showEditAdModal()">
				<i class="fas fa-edit"></i> 修改
			  </button>
			  ${!isCancelled ? `
				<button class="verification-btn verification-btn-warning me-2" onclick="deactivateAdvertisement()">
				  <i class="fas fa-toggle-off"></i> 下架
				</button>
			  ` : `
				<button class="verification-btn verification-btn-info me-2" onclick="reactivateAdvertisement()">
				  <i class="fas fa-toggle-on"></i> 上架
				</button>
			  `}
			` : ''}
			<button 
			  class="verification-btn verification-btn-success ${canRenew ? '' : 'verification-btn-disabled'}"
			  ${canRenew ? '' : 'disabled title="只有在广告剩余时间 7 天内才可以续费"'}
			  onclick="showRenewalModal()"
			>
			  <i class="fas fa-sync-alt"></i> 续费
			</button>
		  </div>
		</div>
	  `;
	} else {
      // 未发布广告
      advertisementSection = `
        <div class="verification-status-card">
          <div class="verification-empty-state">
            <div class="verification-empty-icon">
              <i class="fas fa-ad"></i>
            </div>
            <div class="verification-empty-text">您还未发布首页广告</div>
            <button class="verification-btn verification-btn-primary mt-3" onclick="showPublishModal()">
              <i class="fas fa-plus"></i> 发布广告
            </button>
          </div>
        </div>
      `;
    }
    
    container.innerHTML = `
      <div class="section">
        <h1 class="page-title">
          <i class="fas fa-${typeIcon}"></i> ${typeText}管理
        </h1>
        
        <!-- 认证信息卡片 -->
        <div class="verification-status-card mb-4">
          <h3 class="mb-3">
            <i class="fas fa-check-circle text-success"></i> 认证信息
          </h3>
          
          <div class="verification-info-grid">
            <div class="verification-info-item">
              <div class="verification-info-label">认证昵称</div>
              <div class="verification-info-value">${application.nickname}</div>
            </div>
            <div class="verification-info-item">
              <div class="verification-info-label">联系方式</div>
              <div class="verification-info-value">${application.contact}</div>
            </div>
            <div class="verification-info-item">
              <div class="verification-info-label">通过时间</div>
              <div class="verification-info-value">${formatDateTime(application.reviewed_at)}</div>
            </div>
            <div class="verification-info-item">
              <div class="verification-info-label">认证类型</div>
              <div class="verification-info-value">${typeText}</div>
            </div>
          </div>
        </div>
        
        <!-- 广告信息 -->
        ${advertisementSection}
      </div>
    `;
    
  } catch (error) {
    console.error('加载认证管理页面失败:', error);
    showErrorMessage('加载失败，请刷新重试');
  }
}

/**
 * 显示发布广告模态框
 */
function showPublishModal() {
  const application = VerificationModule.currentApplication;
  if (!application) return;
  
  const isPersonal = application.type === 'personal';
  const typeText = isPersonal ? '个人认证' : '官方认证';
  
  // 店铺类型选项
  const shopTypeOptions = isPersonal 
    ? '<option value="xianyu">闲鱼</option><option value="taobao">淘宝</option><option value="other">其他</option>'
    : '<option value="taobao">淘宝</option><option value="other">其他</option>';
  
  const modalHTML = `
    <div class="verification-modal show" id="publish-modal">
      <div class="verification-modal-content">
        <div class="verification-modal-header">
          <div class="verification-modal-title">发布首页广告</div>
          <button class="verification-modal-close" onclick="closePublishModal()">×</button>
        </div>
        
        <form id="publish-form">
          <!-- 店铺名称 -->
          <div class="verification-form-group">
            <label class="verification-form-label">
              <span class="required">*</span> 店铺名称
            </label>
            <input 
              type="text" 
              class="verification-form-input" 
              id="publish-shop-name"
              required
              placeholder="请输入店铺名称"
            >
          </div>
          
          <!-- Banner图片 -->
          <div class="verification-form-group">
            <label class="verification-form-label">
              <span class="required">*</span> Banner图片
            </label>
            <div class="verification-tip mb-2">
              <i class="fas fa-info-circle"></i>
              图片尺寸：150x50像素
            </div>
            <div class="verification-image-upload" id="banner-upload-area" onclick="document.getElementById('banner-image-input').click()">
              <div class="verification-upload-icon">
                <i class="fas fa-image"></i>
              </div>
              <div class="verification-upload-text">点击上传Banner图片</div>
              <div class="verification-upload-hint">建议尺寸：150x50px</div>
            </div>
            <input 
              type="file" 
              id="banner-image-input" 
              accept="image/*"
              style="display: none"
              onchange="handleBannerImageUpload(event)"
            >
            <div id="banner-image-preview" class="verification-image-preview" style="display: none">
              <img id="banner-image-preview-img" src="" alt="Banner预览">
            </div>
          </div>
          
          <!-- 店铺类型 -->
          <div class="verification-form-group">
            <label class="verification-form-label">
              <span class="required">*</span> 店铺类型
            </label>
            <select 
              class="verification-form-select" 
              id="publish-shop-type"
              onchange="handleShopTypeChange()"
              required
            >
              <option value="">请选择店铺类型</option>
              ${shopTypeOptions}
            </select>
          </div>
          
          <!-- 店铺二维码（条件显示） -->
          <div class="verification-form-group" id="qrcode-group" style="display: none">
            <label class="verification-form-label">
              <span class="required">*</span> 店铺分享二维码
            </label>
            <div class="verification-image-upload" id="qrcode-upload-area" onclick="document.getElementById('qrcode-image-input').click()">
              <div class="verification-upload-icon">
                <i class="fas fa-qrcode"></i>
              </div>
              <div class="verification-upload-text">点击上传二维码</div>
            </div>
            <input 
              type="file" 
              id="qrcode-image-input" 
              accept="image/*"
              style="display: none"
              onchange="handleQRCodeImageUpload(event)"
            >
            <div id="qrcode-image-preview" class="verification-image-preview" style="display: none">
              <img id="qrcode-image-preview-img" src="" alt="二维码预览">
            </div>
          </div>
          
          <!-- 店铺链接（条件显示） -->
          <div class="verification-form-group" id="link-group" style="display: none">
            <label class="verification-form-label">
              <span class="required">*</span> 店铺链接
            </label>
            <input 
              type="url" 
              class="verification-form-input" 
              id="publish-shop-link"
              placeholder="请输入淘宝店铺链接"
            >
          </div>
          
          <!-- 发布期限 -->
          <div class="verification-form-group">
            <label class="verification-form-label">
              <span class="required">*</span> 发布期限
            </label>
            <select 
              class="verification-form-select" 
              id="publish-duration"
              onchange="updatePublishCost()"
              required
            >
              <option value="">请选择发布期限</option>
              <option value="trial-1month">试用1个月</option>
              <option value="1month">1个月</option>
              <option value="3months">3个月</option>
              <option value="6months">6个月</option>
              <option value="12months">12个月</option>
            </select>
          </div>
          
          <!-- 发布费用 -->
          <div class="verification-price-info" id="publish-cost-info" style="display: none">
            <div class="verification-price-item">
              <span class="verification-price-label">发布费用</span>
              <span class="verification-price-value" id="publish-cost-value">0 CREDIT</span>
            </div>
          </div>
          
          <!-- 提交按钮 -->
          <div class="text-center mt-4">
            <button type="submit" class="verification-btn verification-btn-primary">
              <i class="fas fa-rocket"></i> 发布广告
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // 绑定表单提交事件
  const form = document.getElementById('publish-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitAdvertisement();
  });
}

/**
 * 关闭发布模态框
 */
function closePublishModal() {
  const modal = document.getElementById('publish-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
  
  // 重置上传的图片
  VerificationModule.uploadedBannerImage = null;
  VerificationModule.uploadedQRCodeImage = null;
}

/**
 * 处理店铺类型变化
 */
function handleShopTypeChange() {
  const shopType = document.getElementById('publish-shop-type').value;
  const qrcodeGroup = document.getElementById('qrcode-group');
  const linkGroup = document.getElementById('link-group');
  
  if (shopType === 'taobao') {
    qrcodeGroup.style.display = 'none';
    linkGroup.style.display = 'block';
  } else if (shopType === 'xianyu' || shopType === 'other') {
    qrcodeGroup.style.display = 'block';
    linkGroup.style.display = 'none';
  } else {
    qrcodeGroup.style.display = 'none';
    linkGroup.style.display = 'none';
  }
}

/**
 * 处理Banner图片上传
 */
async function handleBannerImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.size > 10 * 1024 * 1024) {
    showErrorMessage('图片大小不能超过 10MB');
    return;
  }
  
  if (!file.type.startsWith('image/')) {
    showErrorMessage('请上传图片文件');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('banner-image-preview');
    const img = document.getElementById('banner-image-preview-img');
    img.src = e.target.result;
    preview.style.display = 'block';
    
    const uploadArea = document.getElementById('banner-upload-area');
    uploadArea.classList.add('has-image');
  };
  reader.readAsDataURL(file);
  
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch('https://api.am-all.com.cn/api/verification/upload-banner', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      VerificationModule.uploadedBannerImage = data.imagePath;
      showSuccessMessage('Banner上传成功');
    } else {
      throw new Error(data.error || '上传失败');
    }
  } catch (error) {
    console.error('上传Banner失败:', error);
    showErrorMessage('Banner上传失败，请重试');
  }
}

/**
 * 处理二维码图片上传
 */
async function handleQRCodeImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.size > 10 * 1024 * 1024) {
    showErrorMessage('图片大小不能超过 10MB');
    return;
  }
  
  if (!file.type.startsWith('image/')) {
    showErrorMessage('请上传图片文件');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('qrcode-image-preview');
    const img = document.getElementById('qrcode-image-preview-img');
    img.src = e.target.result;
    preview.style.display = 'block';
    
    const uploadArea = document.getElementById('qrcode-upload-area');
    uploadArea.classList.add('has-image');
  };
  reader.readAsDataURL(file);
  
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch('https://api.am-all.com.cn/api/verification/upload-qrcode', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      VerificationModule.uploadedQRCodeImage = data.imagePath;
      showSuccessMessage('二维码上传成功');
    } else {
      throw new Error(data.error || '上传失败');
    }
  } catch (error) {
    console.error('上传二维码失败:', error);
    showErrorMessage('二维码上传失败，请重试');
  }
}

/**
 * 更新发布费用显示
 */
function updatePublishCost() {
  const duration = document.getElementById('publish-duration').value;
  const application = VerificationModule.currentApplication;
  
  if (!duration || !application) return;
  
  const type = application.type;
  const cost = VerificationModule.PRICES[type][duration];
  
  const costInfo = document.getElementById('publish-cost-info');
  const costValue = document.getElementById('publish-cost-value');
  
  costInfo.style.display = 'block';
  
  if (cost === 0) {
    costValue.innerHTML = '<span class="free">免费</span>';
    costValue.classList.add('free');
  } else {
    costValue.textContent = cost + ' CREDIT';
    costValue.classList.remove('free');
  }
}

/**
 * 提交广告发布
 */
async function submitAdvertisement() {
  const application = VerificationModule.currentApplication;
  if (!application) return;
  
  const shopName = document.getElementById('publish-shop-name').value.trim();
  const shopType = document.getElementById('publish-shop-type').value;
  const duration = document.getElementById('publish-duration').value;
  const shopLink = document.getElementById('publish-shop-link')?.value.trim() || '';
  
  if (!shopName || !shopType || !duration) {
    showErrorMessage('请填写所有必填项');
    return;
  }
  
  if (!VerificationModule.uploadedBannerImage) {
    showErrorMessage('请上传Banner图片');
    return;
  }
  
  // 验证条件字段
  if (shopType === 'taobao' && !shopLink) {
    showErrorMessage('请填写店铺链接');
    return;
  }
  
  if ((shopType === 'xianyu' || shopType === 'other') && !VerificationModule.uploadedQRCodeImage) {
    showErrorMessage('请上传店铺二维码');
    return;
  }
  
  const cost = VerificationModule.PRICES[application.type][duration];
  
  try {
    const token = localStorage.getItem('token');
    
    // 根据店铺类型准备数据
    const requestData = {
      shopName: shopName,
      bannerImage: VerificationModule.uploadedBannerImage,
      shopType: shopType,
      duration: duration,
      cost: cost
    };
    
    // 根据店铺类型添加相应的字段
    if (shopType === 'taobao') {
      // 淘宝类型：只发送链接
      requestData.shopLink = shopLink || null;
      requestData.qrCodeImage = null;
    } else if (shopType === 'xianyu' || shopType === 'other') {
      // 闲鱼或其他类型：只发送二维码
      requestData.qrCodeImage = VerificationModule.uploadedQRCodeImage || null;
      requestData.shopLink = null;
    }
    
    const response = await secureFetch('https://api.am-all.com.cn/api/verification/publish-ad', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (response && response.success) {
      closePublishModal();
      showSuccessMessage('广告发布成功！');
      // 标记首页广告需要刷新
      if (typeof markHomeAdsForRefresh === 'function') {
        markHomeAdsForRefresh();
      }
      setTimeout(() => {
        loadVerificationManagement();
      }, 1500);
    } else {
      throw new Error(response.error || '发布失败');
    }
  } catch (error) {
    console.error('发布广告失败:', error);
    showErrorMessage(error.message || '发布失败，请重试');
  }
}

/**
 * 查看广告详情
 */
function viewAdvertisementDetails() {
  const ad = VerificationModule.currentAdvertisement;
  if (!ad) return;
  
  const shopTypeText = getShopTypeText(ad.shop_type);
  
  let linkOrQRCode = '';
  if (ad.shop_type === 'taobao' && ad.shop_link) {
    linkOrQRCode = `
      <div class="verification-info-item">
        <div class="verification-info-label">店铺链接</div>
        <div class="verification-info-value">
          <a href="${ad.shop_link}" target="_blank" style="color: #667eea; text-decoration: underline">
            ${ad.shop_link}
          </a>
        </div>
      </div>
    `;
  } else if (ad.qr_code_image) {
    linkOrQRCode = `
      <div class="verification-form-group">
        <div class="verification-info-label">店铺二维码</div>
        <img src="https://api.am-all.com.cn${ad.qr_code_image}" 
             alt="店铺二维码" 
             style="max-width: 200px; border-radius: 8px; margin-top: 10px; cursor: pointer"
             onclick="window.open(this.src)">
      </div>
    `;
  }
  
  const modalHTML = `
    <div class="verification-modal show" id="ad-detail-modal">
      <div class="verification-modal-content">
        <div class="verification-modal-header">
          <div class="verification-modal-title">广告详情</div>
          <button class="verification-modal-close" onclick="closeAdDetailModal()">×</button>
        </div>
        
        <div class="verification-info-grid">
          <div class="verification-info-item">
            <div class="verification-info-label">店铺名称</div>
            <div class="verification-info-value">${ad.shop_name}</div>
          </div>
          <div class="verification-info-item">
            <div class="verification-info-label">店铺类型</div>
            <div class="verification-info-value">${shopTypeText}</div>
          </div>
          <div class="verification-info-item">
            <div class="verification-info-label">发布费用</div>
            <div class="verification-info-value">${ad.cost_credit} CREDIT</div>
          </div>
          <div class="verification-info-item">
            <div class="verification-info-label">发布天数</div>
            <div class="verification-info-value">${ad.duration_days} 天</div>
          </div>
        </div>
        
        ${linkOrQRCode}
        
        <div class="verification-form-group">
          <div class="verification-info-label">Banner图片</div>
          <img src="https://api.am-all.com.cn${ad.banner_image}" 
               alt="Banner图片" 
               style="max-width: 100%; border-radius: 8px; margin-top: 10px; cursor: pointer"
               onclick="window.open(this.src)">
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * 关闭广告详情模态框
 */
function closeAdDetailModal() {
  const modal = document.getElementById('ad-detail-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

/**
 * 获取店铺类型文本
 */
function getShopTypeText(type) {
  const types = {
    'xianyu': '闲鱼',
    'taobao': '淘宝',
    'other': '其他'
  };
  return types[type] || type;
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 下架广告
 */
async function deactivateAdvertisement() {
  if (!confirm('确定要下架广告吗？下架后将不会在首页显示，但可以随时重新上架。')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await secureFetch('https://api.am-all.com.cn/api/verification/deactivate-ad', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response && response.success) {
      showSuccessMessage('广告已下架');
      // 标记首页广告需要刷新
      if (typeof markHomeAdsForRefresh === 'function') {
        markHomeAdsForRefresh();
      }
      setTimeout(() => {
        loadVerificationManagement();
      }, 1500);
    } else {
      throw new Error(response.error || '下架失败');
    }
  } catch (error) {
    console.error('下架广告失败:', error);
    showErrorMessage(error.message || '下架失败，请重试');
  }
}

/**
 * 重新上架广告
 */
async function reactivateAdvertisement() {
  if (!confirm('确定要重新上架广告吗？上架后将重新在首页显示。')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await secureFetch('https://api.am-all.com.cn/api/verification/reactivate-ad', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response && response.success) {
      showSuccessMessage('广告已重新上架');
      // 标记首页广告需要刷新
      if (typeof markHomeAdsForRefresh === 'function') {
        markHomeAdsForRefresh();
      }
      setTimeout(() => {
        loadVerificationManagement();
      }, 1500);
    } else {
      throw new Error(response.error || '上架失败');
    }
  } catch (error) {
    console.error('上架广告失败:', error);
    showErrorMessage(error.message || '上架失败，请重试');
  }
}

/**
 * 显示修改广告模态框
 */
function showEditAdModal() {
  const ad = VerificationModule.currentAdvertisement;
  if (!ad) return;
  
  const application = VerificationModule.currentApplication;
  const isPersonal = application.type === 'personal';
  
  // 店铺类型选项
  const shopTypeOptions = isPersonal 
    ? '<option value="xianyu">闲鱼</option><option value="taobao">淘宝</option><option value="other">其他</option>'
    : '<option value="taobao">淘宝</option><option value="other">其他</option>';
  
  const modalHTML = `
    <div class="verification-modal show" id="edit-ad-modal">
      <div class="verification-modal-content">
        <div class="verification-modal-header">
          <div class="verification-modal-title">修改广告信息</div>
          <button class="verification-modal-close" onclick="closeEditAdModal()">×</button>
        </div>
        
        <form id="edit-ad-form">
          <!-- 店铺名称 -->
          <div class="verification-form-group">
            <label class="verification-form-label">
              <span class="required">*</span> 店铺名称
            </label>
            <input 
              type="text" 
              class="verification-form-input" 
              id="edit-shop-name"
              value="${ad.shop_name}"
              required
              placeholder="请输入店铺名称"
            >
          </div>
          
          <!-- Banner图片 -->
          <div class="verification-form-group">
            <label class="verification-form-label">
              <span class="required">*</span> Banner图片
            </label>
            <div class="verification-tip mb-2">
              <i class="fas fa-info-circle"></i>
              图片尺寸：150x50像素
            </div>
            <div class="verification-image-upload" id="edit-banner-upload-area" onclick="document.getElementById('edit-banner-image-input').click()">
              <div class="verification-upload-icon">
                <i class="fas fa-image"></i>
              </div>
              <div class="verification-upload-text">点击上传新Banner图片</div>
              <div class="verification-upload-hint">不修改请保持当前图片</div>
            </div>
            <input 
              type="file" 
              id="edit-banner-image-input" 
              accept="image/*"
              style="display: none"
              onchange="handleEditBannerImageUpload(event)"
            >
            <div id="edit-banner-image-preview" class="verification-image-preview" style="display: block">
              <img id="edit-banner-image-preview-img" src="https://api.am-all.com.cn${ad.banner_image}" alt="Banner预览">
            </div>
          </div>
          
          <!-- 店铺类型 -->
          <div class="verification-form-group">
            <label class="verification-form-label">
              <span class="required">*</span> 店铺类型
            </label>
            <select 
              class="verification-form-select" 
              id="edit-shop-type"
              onchange="handleEditShopTypeChange()"
              required
            >
              <option value="">请选择店铺类型</option>
              ${shopTypeOptions}
            </select>
          </div>
          
          <!-- 店铺链接（淘宝） -->
          <div class="verification-form-group" id="edit-link-group" style="display: none">
            <label class="verification-form-label">
              <span class="required">*</span> 店铺链接
            </label>
            <input 
              type="url" 
              class="verification-form-input" 
              id="edit-shop-link"
              value="${ad.shop_link || ''}"
              placeholder="请输入淘宝店铺链接"
            >
          </div>
          
          <!-- 店铺二维码（闲鱼/其他） -->
          <div class="verification-form-group" id="edit-qrcode-group" style="display: none">
            <label class="verification-form-label">
              <span class="required">*</span> 店铺二维码
            </label>
            <div class="verification-image-upload" id="edit-qrcode-upload-area" onclick="document.getElementById('edit-qrcode-image-input').click()">
              <div class="verification-upload-icon">
                <i class="fas fa-qrcode"></i>
              </div>
              <div class="verification-upload-text">点击上传新二维码</div>
              <div class="verification-upload-hint">不修改请保持当前二维码</div>
            </div>
            <input 
              type="file" 
              id="edit-qrcode-image-input" 
              accept="image/*"
              style="display: none"
              onchange="handleEditQRCodeImageUpload(event)"
            >
            <div id="edit-qrcode-image-preview" class="verification-image-preview" style="${ad.qr_code_image ? 'display: block' : 'display: none'}">
              <img id="edit-qrcode-image-preview-img" src="${ad.qr_code_image ? 'https://api.am-all.com.cn' + ad.qr_code_image : ''}" alt="二维码预览">
            </div>
          </div>
          
          <div class="verification-modal-actions">
            <button type="button" class="verification-btn verification-btn-secondary" onclick="closeEditAdModal()">
              取消
            </button>
            <button type="button" class="verification-btn verification-btn-primary" onclick="submitEditAdvertisement()">
              <i class="fas fa-save"></i> 保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // 设置当前店铺类型
  document.getElementById('edit-shop-type').value = ad.shop_type;
  handleEditShopTypeChange();
  
  // 保存当前图片路径
  VerificationModule.editedBannerImage = ad.banner_image;
  VerificationModule.editedQRCodeImage = ad.qr_code_image;
}

/**
 * 关闭修改广告模态框
 */
function closeEditAdModal() {
  const modal = document.getElementById('edit-ad-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
      VerificationModule.editedBannerImage = null;
      VerificationModule.editedQRCodeImage = null;
    }, 300);
  }
}

/**
 * 处理修改Banner图片上传
 */
async function handleEditBannerImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // 预览图片
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('edit-banner-image-preview');
    const img = document.getElementById('edit-banner-image-preview-img');
    img.src = e.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
  
  // 上传图片
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch('https://api.am-all.com.cn/api/verification/upload-banner', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      VerificationModule.editedBannerImage = data.imagePath;
      showSuccessMessage('Banner上传成功');
    } else {
      throw new Error(data.error || '上传失败');
    }
  } catch (error) {
    console.error('上传Banner失败:', error);
    showErrorMessage('Banner上传失败，请重试');
  }
}

/**
 * 处理修改二维码上传
 */
async function handleEditQRCodeImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // 预览图片
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('edit-qrcode-image-preview');
    const img = document.getElementById('edit-qrcode-image-preview-img');
    img.src = e.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
  
  // 上传图片
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch('https://api.am-all.com.cn/api/verification/upload-qrcode', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      VerificationModule.editedQRCodeImage = data.imagePath;
      showSuccessMessage('二维码上传成功');
    } else {
      throw new Error(data.error || '上传失败');
    }
  } catch (error) {
    console.error('上传二维码失败:', error);
    showErrorMessage('二维码上传失败，请重试');
  }
}

/**
 * 处理修改店铺类型变化
 */
function handleEditShopTypeChange() {
  const shopType = document.getElementById('edit-shop-type').value;
  const linkGroup = document.getElementById('edit-link-group');
  const qrcodeGroup = document.getElementById('edit-qrcode-group');
  
  if (shopType === 'taobao') {
    linkGroup.style.display = 'block';
    qrcodeGroup.style.display = 'none';
  } else if (shopType === 'xianyu' || shopType === 'other') {
    linkGroup.style.display = 'none';
    qrcodeGroup.style.display = 'block';
  } else {
    linkGroup.style.display = 'none';
    qrcodeGroup.style.display = 'none';
  }
}

/**
 * 提交广告修改
 */
async function submitEditAdvertisement() {
  const shopName = document.getElementById('edit-shop-name').value.trim();
  const shopType = document.getElementById('edit-shop-type').value;
  const shopLink = document.getElementById('edit-shop-link')?.value.trim() || '';
  
  if (!shopName || !shopType) {
    showErrorMessage('请填写所有必填项');
    return;
  }
  
  if (!VerificationModule.editedBannerImage) {
    showErrorMessage('请上传Banner图片');
    return;
  }
  
  // 验证条件字段
  if (shopType === 'taobao' && !shopLink) {
    showErrorMessage('请填写店铺链接');
    return;
  }
  
  if ((shopType === 'xianyu' || shopType === 'other') && !VerificationModule.editedQRCodeImage) {
    showErrorMessage('请上传店铺二维码');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    // 根据店铺类型准备数据
    const requestData = {
      shopName: shopName,
      bannerImage: VerificationModule.editedBannerImage,
      shopType: shopType
    };
    
    // 根据店铺类型添加相应的字段
    if (shopType === 'taobao') {
      // 淘宝类型：只发送链接，清除二维码
      requestData.shopLink = shopLink || null;
      requestData.qrCodeImage = null;
    } else if (shopType === 'xianyu' || shopType === 'other') {
      // 闲鱼或其他类型：只发送二维码，清除链接
      requestData.qrCodeImage = VerificationModule.editedQRCodeImage || null;
      requestData.shopLink = null;
    }
    
    const response = await secureFetch('https://api.am-all.com.cn/api/verification/update-ad', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (response && response.success) {
      closeEditAdModal();
      showSuccessMessage('广告信息已更新！');
      // 标记首页广告需要刷新
      if (typeof markHomeAdsForRefresh === 'function') {
        markHomeAdsForRefresh();
      }
      setTimeout(() => {
        loadVerificationManagement();
      }, 1500);
    } else {
      throw new Error(response.error || '更新失败');
    }
  } catch (error) {
    console.error('更新广告失败:', error);
    showErrorMessage(error.message || '更新失败，请重试');
  }
}

// 将函数暴露到全局作用域
window.loadVerificationManagement = loadVerificationManagement;
window.showPublishModal = showPublishModal;
window.closePublishModal = closePublishModal;
window.handleShopTypeChange = handleShopTypeChange;
window.handleBannerImageUpload = handleBannerImageUpload;
window.handleQRCodeImageUpload = handleQRCodeImageUpload;
window.updatePublishCost = updatePublishCost;
window.submitAdvertisement = submitAdvertisement;
window.viewAdvertisementDetails = viewAdvertisementDetails;
window.closeAdDetailModal = closeAdDetailModal;
window.deactivateAdvertisement = deactivateAdvertisement;
window.reactivateAdvertisement = reactivateAdvertisement;
window.showEditAdModal = showEditAdModal;
window.closeEditAdModal = closeEditAdModal;
window.handleEditBannerImageUpload = handleEditBannerImageUpload;
window.handleEditQRCodeImageUpload = handleEditQRCodeImageUpload;
window.handleEditShopTypeChange = handleEditShopTypeChange;
window.submitEditAdvertisement = submitEditAdvertisement;
window.getShopTypeText = getShopTypeText;
window.formatDateTime = formatDateTime;