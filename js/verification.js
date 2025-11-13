// ========================================
// 用户认证系统 JavaScript
// ========================================

// 全局变量
const VerificationModule = {
  currentApplication: null,
  currentAdvertisement: null,
  uploadedProofImage: null,
  uploadedBannerImage: null,
  uploadedQRCodeImage: null,
  
  // 价格配置
  PRICES: {
    personal: {
      'test-1min': 0,
      'trial-1month': 0,
      '1month': 150,
      '3months': 400,
      '6months': 750,
      '12months': 1500
    },
    official: {
      'test-1min': 0,
      'trial-1month': 0,
      '1month': 300,
      '3months': 800,
      '6months': 1500,
      '12months': 2700
    }
  },
  
  // 期限配置（天数）
  DURATIONS: {
    'test-1min': 1 / (24 * 60), // 1分钟转换为天数
    'trial-1month': 30,
    '1month': 30,
    '3months': 90,
    '6months': 180,
    '12months': 365
  },
  
  // 期限显示文本
  DURATION_LABELS: {
    'test-1min': '测试用1分钟',
    'trial-1month': '试用1个月',
    '1month': '1个月',
    '3months': '3个月',
    '6months': '6个月',
    '12months': '12个月'
  }
};

// ========================================
// 用户端功能
// ========================================

/**
 * 初始化认证主页
 */
async function initVerificationHome() {
  const container = document.getElementById('content-container');
  if (!container) return;
  
  const token = localStorage.getItem('token');
  if (!token) {
    container.innerHTML = '<div class="section"><h1>请先登录</h1></div>';
    return;
  }
  
  // 检查是否有申请记录
  try {
    const response = await secureFetch('https://api.am-all.com.cn/api/verification/my-application', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response && response.application) {
      // 有申请记录，显示申请状态
      if (response.application.status === 'approved') {
        // 已通过，显示认证管理页面
        await loadVerificationManagement();
      } else {
        // 待审核或已驳回，显示申请状态页面
        await loadApplicationStatus(response.application);
      }
    } else {
      // 无申请记录，显示认证入口选择页面
      loadVerificationEntry();
    }
  } catch (error) {
    console.error('加载认证状态失败:', error);
    loadVerificationEntry();
  }
}

/**
 * 显示认证入口选择页面
 */
function loadVerificationEntry() {
  const container = document.getElementById('content-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="section">
      <h1 class="page-title">账户认证</h1>
      <p class="text-muted mb-4">选择您需要的认证类型</p>
      
      <div class="verification-entry-container">
        <!-- 个人认证 -->
        <div class="verification-entry-card" onclick="loadVerificationForm('personal')">
          <div class="verification-entry-icon">
            <i class="fas fa-user-circle"></i>
          </div>
          <div class="verification-entry-title">个人认证</div>
          <div class="verification-entry-desc">
            个人用户：可发布二手购物平台个人店铺广告信息
          </div>
        </div>
        
        <!-- 官方认证 -->
        <div class="verification-entry-card official" onclick="loadVerificationForm('official')">
          <div class="verification-entry-icon">
            <i class="fas fa-certificate"></i>
          </div>
          <div class="verification-entry-title">官方认证</div>
          <div class="verification-entry-desc">
            官方用户：可发布大型购物平台个人品牌或大型品牌店铺广告信息
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 显示认证申请表单
 */
async function loadVerificationForm(type) {
  const container = document.getElementById('content-container');
  if (!container) return;
  
  const token = localStorage.getItem('token');
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  
  const typeText = type === 'personal' ? '个人认证' : '官方认证';
  
  container.innerHTML = `
    <div class="section">
      <button class="btn btn-secondary mb-3" onclick="initVerificationHome()">
        <i class="fas fa-arrow-left"></i> 返回
      </button>
      
      <div class="verification-form-container">
        <div class="verification-form-title">${typeText}申请</div>
        
        <form id="verification-form">
          <!-- 昵称 -->
          <div class="verification-form-group">
            <label class="verification-form-label">
              <span class="required">*</span> 昵称
            </label>
            <input 
              type="text" 
              class="verification-form-input" 
              id="verification-nickname"
              value="${userInfo.nickname || ''}"
              required
              placeholder="请输入昵称"
            >
          </div>
          
          <!-- 联系方式 -->
          <div class="verification-form-group">
            <label class="verification-form-label">
              <span class="required">*</span> 联系方式
            </label>
            <input 
              type="text" 
              class="verification-form-input" 
              id="verification-contact"
              required
              placeholder="请输入QQ或邮箱"
            >
          </div>
          
          <!-- 申请凭证 -->
          <div class="verification-form-group">
            <label class="verification-form-label">
              <span class="required">*</span> 申请凭证
            </label>
            <div class="verification-image-upload" id="proof-upload-area" onclick="document.getElementById('proof-image-input').click()">
              <div class="verification-upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
              </div>
              <div class="verification-upload-text">点击上传申请凭证</div>
              <div class="verification-upload-hint">支持 JPG、PNG 格式，大小不超过 10MB</div>
            </div>
            <input 
              type="file" 
              id="proof-image-input" 
              accept="image/*"
              style="display: none"
              onchange="handleProofImageUpload(event)"
            >
            <div id="proof-image-preview" class="verification-image-preview" style="display: none">
              <img id="proof-image-preview-img" src="" alt="凭证预览">
            </div>
          </div>

          <div class="verification-warning">
            <i class="fas fa-info-circle"></i>
            <b>申请凭证：能够证明您的身份信息，例如：店铺后台页面、购物平台卖家界面。</b>
          </div>

          <div class="verification-warning">
            <i class="fas fa-info-circle"></i>
            <b>申请通过后，您所发布的店铺其经营内容必须包含音乐游戏或街机游戏的相关内容</b>
          </div>

          <div class="verification-tip">
            <i class="fas fa-info-circle"></i>
            <b>请确保上传的凭证清晰可见，敏感信息可隐去，但店铺名与用户名必须展示出来。</b>
          </div>
          
          <!-- 提交按钮 -->
          <div class="text-center mt-4">
            <button type="submit" class="verification-btn verification-btn-primary">
              <i class="fas fa-paper-plane"></i> 提交申请
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // 绑定表单提交事件
  const form = document.getElementById('verification-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitVerificationApplication(type);
  });
}

/**
 * 处理凭证图片上传
 */
async function handleProofImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // 检查文件大小（10MB）
  if (file.size > 10 * 1024 * 1024) {
    showErrorMessage('图片大小不能超过 10MB');
    return;
  }
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    showErrorMessage('请上传图片文件');
    return;
  }
  
  // 显示预览
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('proof-image-preview');
    const img = document.getElementById('proof-image-preview-img');
    img.src = e.target.result;
    preview.style.display = 'block';
    
    const uploadArea = document.getElementById('proof-upload-area');
    uploadArea.classList.add('has-image');
  };
  reader.readAsDataURL(file);
  
  // 上传到服务器
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch('https://api.am-all.com.cn/api/verification/upload-proof', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      VerificationModule.uploadedProofImage = data.imagePath;
      showSuccessMessage('图片上传成功');
    } else {
      throw new Error(data.error || '上传失败');
    }
  } catch (error) {
    console.error('上传图片失败:', error);
    showErrorMessage('图片上传失败，请重试');
  }
}

/**
 * 提交认证申请
 */
async function submitVerificationApplication(type) {
  const nickname = document.getElementById('verification-nickname').value.trim();
  const contact = document.getElementById('verification-contact').value.trim();
  
  if (!nickname || !contact) {
    showErrorMessage('请填写所有必填项');
    return;
  }
  
  if (!VerificationModule.uploadedProofImage) {
    showErrorMessage('请上传申请凭证');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await secureFetch('https://api.am-all.com.cn/api/verification/apply', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: type,
        nickname: nickname,
        contact: contact,
        proofImage: VerificationModule.uploadedProofImage
      })
    });
    
    if (response && response.success) {
      // 发送系统消息
      await sendSystemMessage(
        JSON.parse(localStorage.getItem('userInfo')).id,
        '认证申请已提交',
        '您的认证申请已提交成功，请等待管理员审核。'
      );
      
      showSuccessMessage('申请已提交，请等待管理员审核');
      setTimeout(() => {
        initVerificationHome();
      }, 1500);
    } else {
      throw new Error(response.error || '提交失败');
    }
  } catch (error) {
    console.error('提交申请失败:', error);
    showErrorMessage('提交失败，请重试');
  }
}

/**
 * 显示申请状态页面
 */
async function loadApplicationStatus(application) {
  const container = document.getElementById('content-container');
  if (!container) return;
  
  VerificationModule.currentApplication = application;
  
  const statusText = {
    'pending': '待审核',
    'approved': '已通过',
    'rejected': '已驳回'
  };
  
  const statusClass = {
    'pending': 'pending',
    'approved': 'approved',
    'rejected': 'rejected'
  };
  
  const typeText = application.type === 'personal' ? '个人认证' : '官方认证';
  
  let actionButtons = '';
  if (application.status === 'pending') {
    actionButtons = `
      <div class="verification-warning">
        <i class="fas fa-clock"></i>
        您的申请正在审核中，请耐心等待管理员处理。
      </div>
    `;
  } else if (application.status === 'rejected') {
    if (application.modify_count < 3) {
      actionButtons = `
        <div class="verification-error">
          <i class="fas fa-times-circle"></i>
          申请未通过：${application.reject_reason || '请查看驳回原因'}
        </div>
        <div class="verification-tip">
          您还可以修改申请 ${3 - application.modify_count} 次
        </div>
        <div class="text-center mt-3">
          <button class="verification-btn verification-btn-primary" onclick="modifyApplication()">
            <i class="fas fa-edit"></i> 修改申请
          </button>
        </div>
      `;
    } else {
      actionButtons = `
        <div class="verification-error">
          <i class="fas fa-times-circle"></i>
          申请未通过：${application.reject_reason || '请查看驳回原因'}
        </div>
        <div class="verification-warning">
          您的修改次数已用完，无法再次修改申请。
        </div>
      `;
    }
  }
  
  container.innerHTML = `
    <div class="section">
      <button class="btn btn-secondary mb-3" onclick="initVerificationHome()">
        <i class="fas fa-arrow-left"></i> 返回
      </button>
      
      <div class="verification-status-container">
        <div class="verification-status-card">
          <h2 class="verification-form-title">${typeText}申请状态</h2>
          
          <div class="text-center mb-4">
            <span class="verification-status-badge ${statusClass[application.status]}">
              ${statusText[application.status]}
            </span>
          </div>
          
          <div class="verification-info-grid">
            <div class="verification-info-item">
              <div class="verification-info-label">申请昵称</div>
              <div class="verification-info-value">${application.nickname}</div>
            </div>
            <div class="verification-info-item">
              <div class="verification-info-label">联系方式</div>
              <div class="verification-info-value">${application.contact}</div>
            </div>
            <div class="verification-info-item">
              <div class="verification-info-label">申请时间</div>
              <div class="verification-info-value">${formatDateTime(application.created_at)}</div>
            </div>
            <div class="verification-info-item">
              <div class="verification-info-label">修改次数</div>
              <div class="verification-info-value">${application.modify_count}/3</div>
            </div>
          </div>
          
          <div class="mt-3">
            <div class="verification-info-label">申请凭证</div>
            <img src="https://api.am-all.com.cn${application.proof_image}" 
                 alt="申请凭证" 
                 style="max-width: 100%; border-radius: 8px; margin-top: 10px; cursor: pointer"
                 onclick="window.open(this.src)">
          </div>
          
          ${actionButtons}
        </div>
      </div>
    </div>
  `;
}

/**
 * 修改申请
 */
async function modifyApplication() {
  const application = VerificationModule.currentApplication;
  if (!application) return;
  
  const container = document.getElementById('content-container');
  if (!container) return;
  
  const typeText = application.type === 'personal' ? '个人认证' : '官方认证';
  
  container.innerHTML = `
    <div class="section">
      <button class="btn btn-secondary mb-3" onclick="loadApplicationStatus(VerificationModule.currentApplication)">
        <i class="fas fa-arrow-left"></i> 返回
      </button>
      
      <div class="verification-form-container">
        <div class="verification-form-title">修改${typeText}申请</div>
        
        <div class="verification-warning mb-3">
          <i class="fas fa-exclamation-triangle"></i>
          您还可以修改 ${3 - application.modify_count} 次申请
        </div>
        
        <form id="verification-modify-form">
          <!-- 昵称 -->
          <div class="verification-form-group">
            <label class="verification-form-label">
              <span class="required">*</span> 昵称
            </label>
            <input 
              type="text" 
              class="verification-form-input" 
              id="verification-nickname"
              value="${application.nickname}"
              required
            >
          </div>
          
          <!-- 联系方式 -->
          <div class="verification-form-group">
            <label class="verification-form-label">
              <span class="required">*</span> 联系方式
            </label>
            <input 
              type="text" 
              class="verification-form-input" 
              id="verification-contact"
              value="${application.contact}"
              required
            >
          </div>
          
          <!-- 申请凭证 -->
          <div class="verification-form-group">
            <label class="verification-form-label">
              <span class="required">*</span> 申请凭证
            </label>
            <div class="verification-image-upload has-image" id="proof-upload-area" onclick="document.getElementById('proof-image-input').click()">
              <div class="verification-upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
              </div>
              <div class="verification-upload-text">点击重新上传申请凭证</div>
              <div class="verification-upload-hint">支持 JPG、PNG 格式，大小不超过 10MB</div>
            </div>
            <input 
              type="file" 
              id="proof-image-input" 
              accept="image/*"
              style="display: none"
              onchange="handleProofImageUpload(event)"
            >
            <div id="proof-image-preview" class="verification-image-preview" style="display: block">
              <img id="proof-image-preview-img" src="https://api.am-all.com.cn${application.proof_image}" alt="凭证预览">
            </div>
          </div>
          
          <!-- 提交按钮 -->
          <div class="text-center mt-4">
            <button type="submit" class="verification-btn verification-btn-primary">
              <i class="fas fa-save"></i> 保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // 设置已上传的图片路径
  VerificationModule.uploadedProofImage = application.proof_image;
  
  // 绑定表单提交事件
  const form = document.getElementById('verification-modify-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitModifiedApplication();
  });
}

/**
 * 提交修改后的申请
 */
async function submitModifiedApplication() {
  const application = VerificationModule.currentApplication;
  if (!application) return;
  
  const nickname = document.getElementById('verification-nickname').value.trim();
  const contact = document.getElementById('verification-contact').value.trim();
  
  if (!nickname || !contact) {
    showErrorMessage('请填写所有必填项');
    return;
  }
  
  if (!VerificationModule.uploadedProofImage) {
    showErrorMessage('请上传申请凭证');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await secureFetch(`https://api.am-all.com.cn/api/verification/modify/${application.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nickname: nickname,
        contact: contact,
        proofImage: VerificationModule.uploadedProofImage
      })
    });
    
    if (response && response.success) {
      showSuccessMessage('修改成功，请等待管理员重新审核');
      setTimeout(() => {
        initVerificationHome();
      }, 1500);
    } else {
      throw new Error(response.error || '修改失败');
    }
  } catch (error) {
    console.error('修改申请失败:', error);
    showErrorMessage('修改失败，请重试');
  }
}

// 将函数暴露到全局作用域
window.initVerificationHome = initVerificationHome;
window.loadVerificationEntry = loadVerificationEntry;
window.loadVerificationForm = loadVerificationForm;
window.handleProofImageUpload = handleProofImageUpload;
window.submitVerificationApplication = submitVerificationApplication;
window.loadApplicationStatus = loadApplicationStatus;
window.modifyApplication = modifyApplication;
window.submitModifiedApplication = submitModifiedApplication;
window.VerificationModule = VerificationModule;
