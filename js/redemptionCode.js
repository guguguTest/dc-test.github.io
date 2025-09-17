// 兑换码功能模块
(function() {
  'use strict';
  
  // 初始化兑换码管理页面
  window.initRedemptionCodeAdmin = async function() {
    const content = document.getElementById('content-container');
    content.innerHTML = `
      <div class="section">
        <h1 class="page-title">发行代码管理</h1>
        <div class="admin-toolbar">
          <button class="btn btn-primary" onclick="showIssueCodeModal()">
            <i class="fas fa-plus"></i> 发行代码
          </button>
          <button class="btn btn-secondary" onclick="selectAllCodes()">
            <i class="fas fa-check-square"></i> 全选
          </button>
          <button class="btn btn-secondary" onclick="unselectAllCodes()">
            <i class="fas fa-square"></i> 取消全选
          </button>
          <button class="btn btn-danger" onclick="deleteSelectedCodes()">
            <i class="fas fa-trash"></i> 删除选中
          </button>
        </div>
        
        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th width="40"><input type="checkbox" id="select-all-codes"></th>
                <th>兑换码</th>
                <th>项目名称</th>
                <th>兑换类型</th>
                <th>兑换值</th>
                <th>状态</th>
                <th>有效期</th>
                <th>使用者</th>
                <th>使用时间</th>
                <th width="100">操作</th>
              </tr>
            </thead>
            <tbody id="codes-tbody">
              <tr>
                <td colspan="10" class="loading-cell">
                  <i class="fas fa-spinner fa-spin"></i> 加载中...
                </td>
              </tr>
            </tbody>
          </table>
          <div id="codes-pagination"></div>
        </div>
      </div>
    `;
    
    loadRedemptionCodes(1);
    
    document.getElementById('select-all-codes').addEventListener('change', function() {
      const checkboxes = document.querySelectorAll('.code-checkbox');
      checkboxes.forEach(cb => cb.checked = this.checked);
    });
  };
  
  // 加载兑换码列表
  async function loadRedemptionCodes(page = 1) {
    try {
      const res = await secureFetch(`https://api.am-all.com.cn/api/admin/redemption-codes?page=${page}`);
      
      if (res.success) {
        renderRedemptionCodes(res.codes, res.pagination);
      }
    } catch (error) {
      showErrorMessage('加载兑换码列表失败');
    }
  }
  
  // 渲染兑换码列表
  function renderRedemptionCodes(codes, pagination) {
    const tbody = document.getElementById('codes-tbody');
    
    if (codes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" class="empty-cell">暂无兑换码</td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = codes.map(code => {
      const typeText = {
        'points': '增加积分',
        'credit': '增加CREDIT',
        'user_group': '用户组升级',
        'coupon': '优惠券'
      }[code.redemption_type] || '未知';
      
      const statusText = code.is_used ? '已使用' : '未使用';
      const statusClass = code.is_used ? 'used' : 'unused';
      
      let expiresText = '永久';
      if (code.expires_at) {
        const expiresDate = new Date(code.expires_at);
        const now = new Date();
        if (expiresDate < now) {
          expiresText = '已过期';
        } else {
          const days = Math.floor((expiresDate - now) / (1000 * 60 * 60 * 24));
          expiresText = `剩余${days}天`;
        }
      }
      
      return `
        <tr>
          <td><input type="checkbox" class="code-checkbox" value="${code.id}"></td>
          <td class="code-text">${code.code}</td>
          <td>${code.project_name}</td>
          <td>${typeText}</td>
          <td>${code.redemption_value || '-'}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>${expiresText}</td>
          <td>${code.username || '-'}</td>
          <td>${code.used_at ? new Date(code.used_at).toLocaleString() : '-'}</td>
          <td>
            <button class="btn-small btn-copy" onclick="copyCode('${code.code}')">
              <i class="fas fa-copy"></i>
            </button>
            <button class="btn-small btn-delete" onclick="deleteCode(${code.id})">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    // 渲染分页
    if (pagination) {
      renderCodePagination(pagination);
    }
  }
  
  // 渲染分页
  function renderCodePagination(pagination) {
    const container = document.getElementById('codes-pagination');
    if (!container) return;
    
    const { currentPage, totalPages } = pagination;
    
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }
    
    let html = '<div class="pagination">';
    
    if (currentPage > 1) {
      html += `<button onclick="loadRedemptionCodes(${currentPage - 1})">上一页</button>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === currentPage) {
        html += `<span class="current-page">${i}</span>`;
      } else if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
        html += `<button onclick="loadRedemptionCodes(${i})">${i}</button>`;
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        html += `<span>...</span>`;
      }
    }
    
    if (currentPage < totalPages) {
      html += `<button onclick="loadRedemptionCodes(${currentPage + 1})">下一页</button>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
  }
  
  // 显示发行代码弹窗
  window.showIssueCodeModal = function() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content code-modal">
        <div class="modal-header">
          <h3>发行代码</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form id="issue-code-form" class="modal-body">
          <div class="form-group">
            <label>项目名称 <span class="required">*</span></label>
            <input type="text" name="project_name" required>
          </div>
          
          <div class="form-group">
            <label>兑换种类 <span class="required">*</span></label>
            <select name="redemption_type" onchange="onRedemptionTypeChange(this.value)">
              <option value="points">增加积分</option>
              <option value="credit">增加CREDIT</option>
              <option value="user_group">变更用户组</option>
              <option value="coupon">优惠券</option>
            </select>
          </div>
          
          <div class="form-group" id="redemption-value-group">
            <label id="redemption-value-label">增加数量</label>
            <input type="number" name="redemption_value" id="redemption-value-input" min="1">
            <select name="user_group_value" id="redemption-user-group" style="display: none">
              <option value="1">初级用户</option>
              <option value="2">中级用户</option>
              <option value="3">高级用户</option>
              <option value="4">贵宾用户</option>
              <option value="5">管理员</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>
              <input type="checkbox" id="batch-issue" onchange="onBatchIssueChange(this.checked)">
              批量发行
            </label>
            <input type="number" name="batch_count" id="batch-count" min="1" max="100" 
                   style="display: none;" placeholder="批量数量">
          </div>
          
          <div class="form-group">
            <label>有效期</label>
            <select name="validity_period" onchange="onValidityChange(this.value)">
              <option value="permanent">永久有效</option>
              <option value="7">7天</option>
              <option value="30">30天</option>
              <option value="90">90天</option>
              <option value="custom">自定义</option>
            </select>
            <input type="number" name="custom_days" id="custom-days" min="1" 
                   style="display: none;" placeholder="天数">
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="issueRedemptionCodes()">
            <i class="fas fa-check"></i> 发行
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
            <i class="fas fa-times"></i> 取消
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  };
  
  // 兑换类型变化
  window.onRedemptionTypeChange = function(type) {
    const valueGroup = document.getElementById('redemption-value-group');
    const valueLabel = document.getElementById('redemption-value-label');
    const valueInput = document.getElementById('redemption-value-input');
    const groupSelect = document.getElementById('redemption-user-group');
    
    if (type === 'coupon') {
      valueGroup.style.display = 'none';
    } else if (type === 'user_group') {
      valueGroup.style.display = 'block';
      valueLabel.textContent = '变更到用户组';
      valueInput.style.display = 'none';
      groupSelect.style.display = 'block';
    } else {
      valueGroup.style.display = 'block';
      valueLabel.textContent = type === 'points' ? '增加积分数量' : '增加CREDIT数量';
      valueInput.style.display = 'block';
      groupSelect.style.display = 'none';
    }
  };
  
  // 批量发行变化
  window.onBatchIssueChange = function(checked) {
    const batchCount = document.getElementById('batch-count');
    batchCount.style.display = checked ? 'block' : 'none';
    if (!checked) {
      batchCount.value = '';
    }
  };
  
  // 有效期变化
  window.onValidityChange = function(value) {
    const customDays = document.getElementById('custom-days');
    customDays.style.display = value === 'custom' ? 'block' : 'none';
    if (value !== 'custom') {
      customDays.value = '';
    }
  };
  
  // 发行兑换码
  window.issueRedemptionCodes = async function() {
    const form = document.getElementById('issue-code-form');
    const formData = new FormData(form);
    
    const data = {
      project_name: formData.get('project_name'),
      redemption_type: formData.get('redemption_type'),
      batch_issue: document.getElementById('batch-issue').checked,
      batch_count: parseInt(formData.get('batch_count')) || 1,
      validity_period: formData.get('validity_period')
    };
    
    // 处理兑换值
    if (data.redemption_type === 'user_group') {
      data.redemption_value = parseInt(formData.get('user_group_value'));
    } else if (data.redemption_type !== 'coupon') {
      data.redemption_value = parseInt(formData.get('redemption_value'));
    }
    
    // 处理有效期
    if (data.validity_period === 'custom') {
      data.validity_days = parseInt(formData.get('custom_days'));
    } else if (data.validity_period !== 'permanent') {
      data.validity_days = parseInt(data.validity_period);
    }
    
    if (!data.batch_issue) {
      data.batch_count = 1;
    }
    
    try {
      const res = await secureFetch('https://api.am-all.com.cn/api/admin/redemption-codes/issue', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (res.success) {
        const modal = document.querySelector('.modal.show');
        if (modal) modal.remove();
        
        showSuccessMessage(`成功发行 ${res.count} 个兑换码`);
        
        // 显示生成的兑换码
        if (res.codes && res.codes.length > 0) {
          showGeneratedCodes(res.codes);
        }
        
        loadRedemptionCodes(1);
      }
    } catch (error) {
      showErrorMessage('发行失败：' + error.message);
    }
  };
  
  // 显示生成的兑换码
  function showGeneratedCodes(codes) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>生成的兑换码</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="generated-codes">
            ${codes.map(code => `
              <div class="code-item">
                <span class="code-text">${code}</span>
                <button class="btn-small btn-copy" onclick="copyCode('${code}')">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-primary btn-block" onclick="copyAllCodes('${codes.join('\\n')}')">
            <i class="fas fa-copy"></i> 复制所有
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
  
  // 复制兑换码
  window.copyCode = function(code) {
    const textarea = document.createElement('textarea');
    textarea.value = code;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showSuccessMessage('兑换码已复制');
  };
  
  // 复制所有兑换码
  window.copyAllCodes = function(codes) {
    const textarea = document.createElement('textarea');
    textarea.value = codes;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showSuccessMessage('所有兑换码已复制');
  };
  
  // 删除兑换码
  window.deleteCode = async function(codeId) {
    if (!confirm('确定要删除此兑换码吗？')) return;
    
    try {
      const res = await secureFetch(`https://api.am-all.com.cn/api/admin/redemption-codes/${codeId}`, {
        method: 'DELETE'
      });
      
      if (res.success) {
        showSuccessMessage('删除成功');
        loadRedemptionCodes(1);
      }
    } catch (error) {
      showErrorMessage('删除失败');
    }
  };
  
  // 全选
  window.selectAllCodes = function() {
    document.getElementById('select-all-codes').checked = true;
    document.querySelectorAll('.code-checkbox').forEach(cb => cb.checked = true);
  };
  
  // 取消全选
  window.unselectAllCodes = function() {
    document.getElementById('select-all-codes').checked = false;
    document.querySelectorAll('.code-checkbox').forEach(cb => cb.checked = false);
  };
  
  // 删除选中
  window.deleteSelectedCodes = async function() {
    const checkboxes = document.querySelectorAll('.code-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (ids.length === 0) {
      showErrorMessage('请选择要删除的兑换码');
      return;
    }
    
    if (!confirm(`确定要删除选中的 ${ids.length} 个兑换码吗？`)) return;
    
    try {
      const res = await secureFetch('https://api.am-all.com.cn/api/admin/redemption-codes/batch-delete', {
        method: 'POST',
        body: JSON.stringify({ ids })
      });
      
      if (res.success) {
        showSuccessMessage('批量删除成功');
        loadRedemptionCodes(1);
      }
    } catch (error) {
      showErrorMessage('删除失败');
    }
  };
  
  // 兑换历史记录弹窗
  window.showRedemptionHistory = async function(type) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content large-modal">
        <div class="modal-header">
          <h3>兑换历史记录</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <table class="history-table">
            <thead>
              <tr>
                <th>兑换时间</th>
                <th>项目名称</th>
                <th>兑换码/订单号</th>
                <th>优惠券码</th>
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
        renderRedemptionHistory(res.history);
      }
    } catch (error) {
      showErrorMessage('加载历史记录失败');
    }
  };
  
  // 渲染历史记录
  function renderRedemptionHistory(history) {
    const tbody = document.getElementById('history-tbody');
    
    if (history.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-cell">暂无兑换记录</td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = history.map(record => `
      <tr>
        <td>${new Date(record.created_at).toLocaleString()}</td>
        <td>${record.project_name}</td>
        <td>${record.redemption_code || record.order_number || '-'}</td>
        <td>${record.coupon_code || '-'}</td>
      </tr>
    `).join('');
  }
  
})();