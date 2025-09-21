// 兑换功能模块
(function() {
  'use strict';
  
  // 初始化兑换页面
  window.initExchangePage = function() {
    const content = document.getElementById('content-container');
    content.innerHTML = `
      <div class="section">
        <h1 class="page-title">兑换码</h1>
        <button class="back-button" onclick="loadPage('home')">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="exchange-container">
          <div class="exchange-card">
            <div class="card-header-with-btn">
              <h3><i class="fas fa-ticket-alt me-2"></i>兑换码</h3>
              <button class="btn-info" onclick="showUserRedemptionHistory('code')">
                <i class="fas fa-history"></i> 兑换记录
              </button>
            </div>
            <p>请输入兑换码进行兑换</p>
            <div class="input-group">
              <input type="text" class="form-control" id="exchange-code" placeholder="请输入兑换码">
              <button class="btn btn-primary" id="redeem-code-btn" onclick="redeemCode()">
                <i class="fas fa-gift me-2"></i>兑换
              </button>
            </div>
            <div class="exchange-result" id="code-exchange-result"></div>
          </div>
          
          <div class="exchange-divider">
            <span>或</span>
          </div>
          
          <div class="exchange-card">
            <div class="card-header-with-btn">
              <h3><i class="fas fa-coins me-2"></i>鸽屋积分兑换</h3>
              <button class="btn-info" onclick="showUserRedemptionHistory('points')">
                <i class="fas fa-history"></i> 兑换记录
              </button>
            </div>
            <p>请输入淘宝订单号兑换积分</p>
            <div class="input-group">
              <input type="text" class="form-control" id="order-number-input" placeholder="请输入淘宝订单号">
              <button class="btn btn-primary" id="redeem-order-btn" onclick="redeemOrder()">
                <i class="fas fa-exchange-alt me-2"></i>兑换
              </button>
            </div>
            <div class="exchange-result" id="order-exchange-result"></div>
          </div>
        </div>
      </div>
    `;
  };
  
// 兑换码兑换功能（修复API路径和添加防重复点击）
window.redeemCode = async function() {
  const redeemBtn = document.getElementById('redeem-code-btn');
  const codeInput = document.getElementById('exchange-code');
  const resultDiv = document.getElementById('code-exchange-result');
  
  // 防止元素不存在的错误
  if (!codeInput || !redeemBtn || !resultDiv) {
    console.error('Required elements not found');
    return;
  }
  
  // 防止重复点击
  if (redeemBtn.disabled) return;
  
  const code = codeInput.value.trim();
  
  // 清空之前的结果
  resultDiv.className = 'exchange-result';
  resultDiv.style.display = 'none';
  resultDiv.innerHTML = '';
  
  if (!code) {
    showExchangeResult('code-exchange-result', '请输入兑换码', 'error');
    return;
  }
  
  // 禁用按钮，显示加载状态
  redeemBtn.disabled = true;
  const originalBtnContent = redeemBtn.innerHTML;
  redeemBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>兑换中...';
  
  try {
    // 先检查兑换码信息（如果有此API）
    const checkRes = await secureFetch(`https://api.am-all.com.cn/api/check-redemption-code?code=${encodeURIComponent(code)}`);
    
    if (checkRes && checkRes.redemption_type === 'user_group' && checkRes.redemption_value) {
      const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const currentRank = currentUser.user_rank || 0;
      const targetRank = checkRes.redemption_value;
      
      if (currentRank >= targetRank) {
        showExchangeResult('code-exchange-result', 
          `此兑换码是用户组升级码，但您当前的用户组等级已经高于或等于目标等级！\n当前等级：${getUserRankName(currentRank)}\n目标等级：${getUserRankName(targetRank)}`, 
          'error'
        );
        return;
      }
    }
    
    // 执行兑换
    const res = await secureFetch('https://api.am-all.com.cn/api/redeem-code', {
      method: 'POST',
      body: JSON.stringify({ code: code })
    });
    
    if (res.success) {
      // 处理不同类型的兑换结果
      let message = res.message || '兑换成功！';
      
      // 如果有优惠券码，显示它
      if (res.coupon_code) {
        message += `\n优惠券码：${res.coupon_code}`;
      }
      
      showExchangeResult('code-exchange-result', message, 'success');
      codeInput.value = '';
      
      // 如果返回了更新后的用户信息，直接更新
      if (res.user) {
        localStorage.setItem('userInfo', JSON.stringify(res.user));
        if (typeof window.updateNavUserInfo === 'function') {
          window.updateNavUserInfo();
        }
      } else {
        // 否则主动获取更新
        await updateUserInfo();
      }
    } else {
      showExchangeResult('code-exchange-result', res.error || res.message || '兑换失败', 'error');
    }
  } catch (error) {
    console.error('兑换码兑换错误:', error);
    showExchangeResult('code-exchange-result', error.message || '网络错误，请稍后重试', 'error');
  } finally {
    // 恢复按钮状态
    redeemBtn.disabled = false;
    redeemBtn.innerHTML = originalBtnContent;
  }
};

// 辅助函数：获取用户组名称
function getUserRankName(rank) {
  const rankNames = {
    0: '普通用户',
    1: '初级用户',
    2: '中级用户',
    3: '高级用户',
    4: '贵宾用户',
    5: '管理员'
  };
  return rankNames[rank] || '未知等级';
}
  
  // 订单号兑换功能（添加防重复点击）
  window.redeemOrder = async function() {
    const redeemBtn = document.getElementById('redeem-order-btn');
    const orderInput = document.getElementById('order-number-input');
    const resultDiv = document.getElementById('order-exchange-result');
    
    // 防止元素不存在的错误
    if (!orderInput || !redeemBtn || !resultDiv) {
      console.error('Required elements not found');
      return;
    }
    
    // 防止重复点击
    if (redeemBtn.disabled) return;
    
    const orderNumber = orderInput.value.trim();
    
    // 清空之前的结果
    resultDiv.className = 'exchange-result';
    resultDiv.style.display = 'none';
    resultDiv.innerHTML = '';
    
    if (!orderNumber) {
      showExchangeResult('order-exchange-result', '请输入淘宝订单号', 'error');
      return;
    }
    
    // 验证订单号格式（淘宝订单号通常是数字，但不限制长度）
    if (!/^\d+$/.test(orderNumber)) {
      showExchangeResult('order-exchange-result', '请输入正确的订单号格式', 'error');
      return;
    }
    
    // 禁用按钮，显示加载状态
    redeemBtn.disabled = true;
    const originalBtnContent = redeemBtn.innerHTML;
    redeemBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>兑换中...';
    
    try {
      const res = await secureFetch('https://api.am-all.com.cn/api/redeem-order', {
        method: 'POST',
        body: JSON.stringify({ order_number: orderNumber })
      });
      
      if (res.success) {
        const message = res.message || (res.points ? 
          `兑换成功！获得 ${res.points} 鸽屋积分` : 
          '兑换成功！');
        showExchangeResult('order-exchange-result', message, 'success');
        orderInput.value = '';
        
        // 更新用户信息
        if (res.points !== undefined || res.point2 !== undefined) {
          const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
          if (res.points !== undefined) userInfo.points = res.points;
          if (res.point2 !== undefined) userInfo.point2 = res.point2;
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
          
          if (typeof window.updateNavUserInfo === 'function') {
            window.updateNavUserInfo();
          }
        } else {
          await updateUserInfo();
        }
      } else {
        showExchangeResult('order-exchange-result', res.error || res.message || '兑换失败', 'error');
      }
    } catch (error) {
      console.error('订单兑换错误:', error);
      showExchangeResult('order-exchange-result', error.message || '网络错误，请稍后重试', 'error');
    } finally {
      // 恢复按钮状态
      redeemBtn.disabled = false;
      redeemBtn.innerHTML = originalBtnContent;
    }
  };
  
  // 显示兑换结果（改进版本）
  function showExchangeResult(elementId, message, type) {
    const resultDiv = document.getElementById(elementId);
    if (!resultDiv) return;
    
    resultDiv.className = `exchange-result show ${type}`;
    
    // 支持换行符显示多行消息
    if (message.includes('\n')) {
      resultDiv.innerHTML = message.split('\n').map(line => 
        `<div>${escapeHtml(line)}</div>`
      ).join('');
    } else {
      resultDiv.textContent = message;
    }
    
    resultDiv.style.display = 'block';
    
    // 成功消息8秒后自动隐藏，错误消息10秒后隐藏
    const timeout = type === 'success' ? 8000 : 10000;
    setTimeout(() => {
      resultDiv.className = 'exchange-result';
      resultDiv.style.display = 'none';
    }, timeout);
  }
  
  // HTML转义函数
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // 显示用户兑换历史记录（主函数）
  window.showUserRedemptionHistory = async function(type) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content large-modal">
        <div class="modal-header">
          <h3>${type === 'code' ? '兑换码' : '积分'}兑换历史</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <table class="history-table">
            <thead>
              <tr>
                <th>兑换时间</th>
                <th>项目名称</th>
                <th>${type === 'code' ? '兑换码' : '订单号'}</th>
                <th>${type === 'code' ? '优惠券码' : '获得积分'}</th>
              </tr>
            </thead>
            <tbody id="history-tbody">
              <tr>
                <td colspan="4" class="loading-cell">
                  <i class="fas fa-spinner fa-spin"></i> 加载中...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 加载历史记录
    try {
      const res = await secureFetch(`https://api.am-all.com.cn/api/redemption-history?type=${type}`);
      
      if (res.success) {
        renderRedemptionHistory(res.history, type);
      } else {
        document.getElementById('history-tbody').innerHTML = `
          <tr>
            <td colspan="4" class="error-cell">加载失败：${res.error || '未知错误'}</td>
          </tr>
        `;
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
      document.getElementById('history-tbody').innerHTML = `
        <tr>
          <td colspan="4" class="error-cell">加载失败：${error.message || '网络错误'}</td>
        </tr>
      `;
    }
  };
  
  // 为兼容性添加别名
  window.showRedemptionHistory = window.showUserRedemptionHistory;
  
  // 渲染历史记录
  function renderRedemptionHistory(history, type) {
    const tbody = document.getElementById('history-tbody');
    
    if (!history || history.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-cell">暂无兑换记录</td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = history.map(record => `
      <tr>
        <td>${new Date(record.created_at).toLocaleString('zh-CN')}</td>
        <td>${escapeHtml(record.project_name || '-')}</td>
        <td>${escapeHtml(record.redemption_code || record.order_number || '-')}</td>
        <td>${escapeHtml(record.coupon_code || (record.points_used ? `+${record.points_used}` : '-'))}</td>
      </tr>
    `).join('');
  }
  
  // 更新用户信息
  async function updateUserInfo() {
    try {
      const res = await secureFetch('https://api.am-all.com.cn/api/user');
      if (res) {
        localStorage.setItem('userInfo', JSON.stringify(res));
        
        // 更新导航栏用户信息
        if (typeof window.updateNavUserInfo === 'function') {
          window.updateNavUserInfo();
        }
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
    }
  }
  
  // 确保 secureFetch 函数存在
  if (typeof window.secureFetch === 'undefined') {
    window.secureFetch = async function(url, options = {}) {
      const token = localStorage.getItem('token');
      
      const defaultHeaders = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }
      
      const fetchOptions = {
        ...options,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {})
        }
      };
      
      try {
        const response = await fetch(url, fetchOptions);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
        }
        
        return data;
      } catch (error) {
        console.error('secureFetch error:', error);
        throw error;
      }
    };
  }
  
})();