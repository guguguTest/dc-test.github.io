// ========================================
// 续费功能和管理员审核功能
// ========================================

/**
 * 显示续费模态框
 */
function showRenewalModal() {
  const application = VerificationModule.currentApplication;
  const ad = VerificationModule.currentAdvertisement;
  
  if (!application || !ad) return;
  
  // 前端也做一层校验：只允许“生效中 + 剩余 ≤ 7 天”的广告续费
  const now = new Date();
  const endDate = new Date(ad.end_date);
  const diffMs = endDate.getTime() - now.getTime();
  const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (ad.status !== 'active' || remainingDays > 7 || remainingDays < 0) {
    showErrorMessage('只有在广告剩余时间 7 天内且尚未过期时才可以续费。');
    return;
  }
  
  const isPersonal = application.type === 'personal';
  const typeText = isPersonal ? '个人认证' : '官方认证';
  
  const modalHTML = `
    <div class="verification-modal show" id="renewal-modal">
      <div class="verification-modal-content">
        <div class="verification-modal-header">
          <div class="verification-modal-title">广告续费（${typeText}）</div>
          <button class="verification-modal-close" onclick="closeRenewalModal()">×</button>
        </div>
        
        <form id="renewal-form">
          <!-- 提示：7 天内才能续费 -->
          <div class="verification-tip mb-3">
            <i class="fas fa-info-circle"></i>
            当前广告剩余 <strong>${remainingDays}</strong> 天，仅在到期前 7 天内可以续费。
          </div>
          
          <!-- 续费期限 -->
          <div class="verification-form-group">
            <label class="verification-form-label">
              <span class="required">*</span> 续费期限
            </label>
            <select 
              class="verification-form-select" 
              id="renewal-duration"
              onchange="updateRenewalCost()"
              required
            >
              <option value="">请选择续费期限</option>
              <option value="trial-1month">试用1个月</option>
              <option value="1month">1个月</option>
              <option value="3months">3个月</option>
              <option value="6months">6个月</option>
              <option value="12months">12个月</option>
            </select>
          </div>
          
          <!-- 续费费用 -->
          <div class="verification-price-info" id="renewal-cost-info" style="display: none">
            <div class="verification-price-item">
              <span class="verification-price-label">续费费用（${typeText}）</span>
              <span class="verification-price-value" id="renewal-cost-value">0 CREDIT</span>
            </div>
          </div>
          
          <!-- 当前到期时间 -->
          <div class="verification-info-item mt-3">
            <div class="verification-info-label">当前到期时间</div>
            <div class="verification-info-value">${formatDateTime(ad.end_date)}</div>
          </div>
          
          <!-- 续费后到期时间 -->
          <div class="verification-info-item" id="new-end-date-container" style="display: none">
            <div class="verification-info-label">续费后到期时间</div>
            <div class="verification-info-value" id="new-end-date">--</div>
          </div>
          
          <!-- 底部按钮 -->
          <div class="text-center mt-4">
            <button type="button" class="verification-btn verification-btn-secondary me-2" onclick="closeRenewalModal()">
              取消
            </button>
            <button type="submit" class="verification-btn verification-btn-success">
              <i class="fas fa-sync-alt"></i> 确认续费
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // 绑定表单提交事件
  const form = document.getElementById('renewal-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitRenewal();
  });
}

/**
 * 关闭续费模态框
 */
function closeRenewalModal() {
  const modal = document.getElementById('renewal-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

/**
 * 更新续费费用显示
 */
function updateRenewalCost() {
  const duration = document.getElementById('renewal-duration').value;
  const application = VerificationModule.currentApplication;
  const ad = VerificationModule.currentAdvertisement;
  
  if (!duration || !application || !ad) return;
  
  const type = application.type;
  const cost = VerificationModule.PRICES[type][duration];
  const days = VerificationModule.DURATIONS[duration];
  
  const costInfo = document.getElementById('renewal-cost-info');
  const costValue = document.getElementById('renewal-cost-value');
  
  costInfo.style.display = 'block';
  
  if (cost === 0) {
    costValue.innerHTML = '<span class="free">免费</span>';
    costValue.classList.add('free');
  } else {
    costValue.textContent = cost + ' CREDIT';
    costValue.classList.remove('free');
  }
  
  // 计算新的到期时间
  const currentEndDate = new Date(ad.end_date);
  const newEndDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000);
  
  const newEndDateContainer = document.getElementById('new-end-date-container');
  const newEndDateValue = document.getElementById('new-end-date');
  
  newEndDateContainer.style.display = 'block';
  newEndDateValue.textContent = formatDateTime(newEndDate);
}

/**
 * 提交续费
 */
async function submitRenewal() {
  const duration = document.getElementById('renewal-duration').value;
  const application = VerificationModule.currentApplication;
  const ad = VerificationModule.currentAdvertisement;
  
  if (!duration || !application || !ad) return;
  
  const cost = VerificationModule.PRICES[application.type][duration];
  
  try {
    const token = localStorage.getItem('token');
    const response = await secureFetch('https://api.am-all.com.cn/api/verification/renew-ad', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        advertisementId: ad.id,
        duration: duration,
        cost: cost
      })
    });
    
    if (response && response.success) {
      closeRenewalModal();
      showSuccessMessage('续费成功！');
      setTimeout(() => {
        loadVerificationManagement();
      }, 1500);
    } else {
      throw new Error(response.error || '续费失败');
    }
  } catch (error) {
    console.error('续费失败:', error);
    showErrorMessage(error.message || '续费失败，请重试');
  }
}

// ========================================
// 管理员审核功能
// ========================================

/**
 * 初始化认证申请管理页面
 */
async function initVerificationAdmin() {
  const container = document.getElementById('content-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="section">
      <h1 class="page-title">
        <i class="fas fa-tasks"></i> 认证申请管理
      </h1>
      
      <!-- 筛选器 -->
      <div class="row mb-4">
        <div class="col-md-4">
          <select class="form-select" id="admin-status-filter" onchange="loadVerificationApplications()">
            <option value="">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
          </select>
        </div>
        <div class="col-md-4">
          <select class="form-select" id="admin-type-filter" onchange="loadVerificationApplications()">
            <option value="">全部类型</option>
            <option value="personal">个人认证</option>
            <option value="official">官方认证</option>
          </select>
        </div>
      </div>
      
      <!-- 申请列表 -->
      <div id="applications-list">
        <div class="verification-loading">
          <div class="verification-loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    </div>
  `;
  
  loadVerificationApplications();
}

/**
 * 加载认证申请列表
 */
async function loadVerificationApplications() {
  const listContainer = document.getElementById('applications-list');
  if (!listContainer) return;
  
  const status = document.getElementById('admin-status-filter')?.value || '';
  const type = document.getElementById('admin-type-filter')?.value || '';
  
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    
    const response = await secureFetch(`https://api.am-all.com.cn/api/verification/admin/applications?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response || !response.applications) {
      throw new Error('获取申请列表失败');
    }
    
    const applications = response.applications;
    
    if (applications.length === 0) {
      listContainer.innerHTML = `
        <div class="verification-empty-state">
          <div class="verification-empty-icon">
            <i class="fas fa-inbox"></i>
          </div>
          <div class="verification-empty-text">暂无申请记录</div>
        </div>
      `;
      return;
    }
    
    let tableHTML = `
      <table class="verification-admin-table">
        <thead>
          <tr>
            <th>用户</th>
            <th>认证类型</th>
            <th>昵称</th>
            <th>联系方式</th>
            <th>状态</th>
            <th>申请时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    applications.forEach(app => {
      const statusText = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已驳回'
      };
      
      const typeText = app.type === 'personal' ? '个人认证' : '官方认证';
      
      const actions = app.status === 'pending' 
        ? `
          <button class="btn btn-sm btn-primary me-2" onclick="viewApplicationDetail(${app.id})">
            详情
          </button>
          <button class="btn btn-sm btn-success me-2" onclick="approveApplication(${app.id})">
            通过
          </button>
          <button class="btn btn-sm btn-danger" onclick="rejectApplication(${app.id})">
            驳回
          </button>
        `
        : `
          <button class="btn btn-sm btn-primary" onclick="viewApplicationDetail(${app.id})">
            详情
          </button>
        `;
      
      tableHTML += `
        <tr>
          <td>${app.username || app.user_id}</td>
          <td>
            <span class="verification-type-badge ${app.type}">
              ${typeText}
            </span>
          </td>
          <td>${app.nickname}</td>
          <td>${app.contact}</td>
          <td>
            <span class="verification-status-badge ${app.status}">
              ${statusText[app.status]}
            </span>
          </td>
          <td>${formatDateTime(app.created_at)}</td>
          <td>${actions}</td>
        </tr>
      `;
    });
    
    tableHTML += `
        </tbody>
      </table>
    `;
    
    listContainer.innerHTML = tableHTML;
    
  } catch (error) {
    console.error('加载申请列表失败:', error);
    listContainer.innerHTML = `
      <div class="verification-error">
        <i class="fas fa-exclamation-triangle"></i>
        加载失败，请刷新重试
      </div>
    `;
  }
}

/**
 * 查看申请详情
 */
async function viewApplicationDetail(applicationId) {
  try {
    const token = localStorage.getItem('token');
    const response = await secureFetch(`https://api.am-all.com.cn/api/verification/admin/application/${applicationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response || !response.application) {
      throw new Error('获取申请详情失败');
    }
    
    const app = response.application;
    const typeText = app.type === 'personal' ? '个人认证' : '官方认证';
    const statusText = {
      'pending': '待审核',
      'approved': '已通过',
      'rejected': '已驳回'
    };
    
    const modalHTML = `
      <div class="verification-modal show" id="app-detail-modal">
        <div class="verification-modal-content">
          <div class="verification-modal-header">
            <div class="verification-modal-title">申请详情</div>
            <button class="verification-modal-close" onclick="closeAppDetailModal()">×</button>
          </div>
          
          <div class="verification-status-badge ${app.status} mb-3">
            ${statusText[app.status]}
          </div>
          
          <div class="verification-info-grid">
            <div class="verification-info-item">
              <div class="verification-info-label">用户ID</div>
              <div class="verification-info-value">${app.user_id}</div>
            </div>
            <div class="verification-info-item">
              <div class="verification-info-label">认证类型</div>
              <div class="verification-info-value">${typeText}</div>
            </div>
            <div class="verification-info-item">
              <div class="verification-info-label">申请昵称</div>
              <div class="verification-info-value">${app.nickname}</div>
            </div>
            <div class="verification-info-item">
              <div class="verification-info-label">联系方式</div>
              <div class="verification-info-value">${app.contact}</div>
            </div>
            <div class="verification-info-item">
              <div class="verification-info-label">修改次数</div>
              <div class="verification-info-value">${app.modify_count}/3</div>
            </div>
            <div class="verification-info-item">
              <div class="verification-info-label">申请时间</div>
              <div class="verification-info-value">${formatDateTime(app.created_at)}</div>
            </div>
          </div>
          
          <div class="verification-form-group">
            <div class="verification-info-label">申请凭证</div>
            <img src="https://api.am-all.com.cn${app.proof_image}" 
                 alt="申请凭证" 
                 style="max-width: 100%; border-radius: 8px; margin-top: 10px; cursor: pointer"
                 onclick="window.open(this.src)">
          </div>
          
          ${app.status === 'rejected' && app.reject_reason ? `
            <div class="verification-error mt-3">
              <strong>驳回原因：</strong>${app.reject_reason}
            </div>
          ` : ''}
          
          ${app.status === 'pending' ? `
            <div class="text-center mt-4">
              <button class="verification-btn verification-btn-success me-2" onclick="approveApplication(${app.id}); closeAppDetailModal();">
                <i class="fas fa-check"></i> 通过
              </button>
              <button class="verification-btn verification-btn-danger" onclick="rejectApplication(${app.id}); closeAppDetailModal();">
                <i class="fas fa-times"></i> 驳回
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
  } catch (error) {
    console.error('查看申请详情失败:', error);
    showErrorMessage('获取详情失败');
  }
}

/**
 * 关闭申请详情模态框
 */
function closeAppDetailModal() {
  const modal = document.getElementById('app-detail-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

/**
 * 通过申请
 */
async function approveApplication(applicationId) {
  if (!confirm('确定要通过这个认证申请吗？')) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await secureFetch(`https://api.am-all.com.cn/api/verification/admin/approve/${applicationId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response && response.success) {
      showSuccessMessage('申请已通过');
      loadVerificationApplications();
    } else {
      throw new Error(response.error || '操作失败');
    }
  } catch (error) {
    console.error('通过申请失败:', error);
    showErrorMessage(error.message || '操作失败');
  }
}

/**
 * 驳回申请
 */
async function rejectApplication(applicationId) {
  const reason = prompt('请输入驳回原因：');
  if (!reason) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await secureFetch(`https://api.am-all.com.cn/api/verification/admin/reject/${applicationId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: reason })
    });
    
    if (response && response.success) {
      showSuccessMessage('申请已驳回');
      loadVerificationApplications();
    } else {
      throw new Error(response.error || '操作失败');
    }
  } catch (error) {
    console.error('驳回申请失败:', error);
    showErrorMessage(error.message || '操作失败');
  }
}

/**
 * 发送系统消息（辅助函数）
 */
async function sendSystemMessage(userId, title, content) {
  try {
    const token = localStorage.getItem('token');
    await fetch('https://api.am-all.com.cn/api/messages/system', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        title: title,
        content: content
      })
    });
  } catch (error) {
    console.error('发送系统消息失败:', error);
  }
}

// 将函数暴露到全局作用域
window.showRenewalModal = showRenewalModal;
window.closeRenewalModal = closeRenewalModal;
window.updateRenewalCost = updateRenewalCost;
window.submitRenewal = submitRenewal;
window.initVerificationAdmin = initVerificationAdmin;
window.loadVerificationApplications = loadVerificationApplications;
window.viewApplicationDetail = viewApplicationDetail;
window.closeAppDetailModal = closeAppDetailModal;
window.approveApplication = approveApplication;
window.rejectApplication = rejectApplication;
window.sendSystemMessage = sendSystemMessage;
