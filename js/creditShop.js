// CREDIT点数商店模块
(function() {
  'use strict';
  
  let currentUser = null;
  let shippingAddress = null;
  const BASE_URL = 'https://api.am-all.com.cn';
  
// 初始化CREDIT商店
window.initCreditShop = async function() {
  try {
    currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    const addressRes = await secureFetch('https://api.am-all.com.cn/api/shop/shipping-address');
    
    if (addressRes.success && addressRes.address) {
      shippingAddress = addressRes.address;
      renderCreditShopPage();
    } else {
      const skipped = localStorage.getItem('shipping_skipped');
      if (skipped === 'true') {
        shippingAddress = null;
        renderCreditShopPage();
      } else {
        renderShippingFormForCredit();
      }
    }
  } catch (error) {
    console.error('初始化CREDIT商店失败:', error);
    showErrorMessage('加载失败，请刷新重试');
  }
};
  
// 渲染收货信息表单
function renderShippingFormForCredit() {
  const content = document.getElementById('content-container');
  content.innerHTML = `
    <div class="section">
      <h1 class="page-title">绑定收货信息</h1>
      <div class="shipping-form-container">
        <div class="form-card">
          <p class="form-hint">首次使用CREDIT商店需要绑定收货信息（如果只兑换虚拟物品可以跳过）</p>
          <form id="credit-shipping-form">
            <div class="form-group">
              <label for="taobao-id">淘宝ID <span class="required">*</span></label>
              <input type="text" id="taobao-id" class="form-control" required>
            </div>
            <div class="form-group">
              <label for="receiver-name">收件人 <span class="required">*</span></label>
              <input type="text" id="receiver-name" class="form-control" required>
            </div>
            <div class="form-group">
              <label for="shipping-address">收货地址 <span class="required">*</span></label>
              <textarea id="shipping-address" class="form-control" rows="3" required></textarea>
            </div>
            <div class="form-group">
              <label for="contact-phone">联系电话 <span class="required">*</span></label>
              <input type="tel" id="contact-phone" class="form-control" required>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-check"></i> 绑定信息
              </button>
              <button type="button" class="btn btn-secondary" onclick="skipCreditShippingBinding()">
                <i class="fas fa-forward"></i> 跳过（仅兑换虚拟物品）
              </button>
              <button type="button" class="btn btn-secondary" onclick="loadPage('home')">
                <i class="fas fa-times"></i> 取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('credit-shipping-form').addEventListener('submit', handleCreditShippingSubmit);
}

// 跳过CREDIT收货信息绑定
window.skipCreditShippingBinding = function() {
  if (confirm('跳过后您将无法兑换实物商品，只能兑换虚拟物品。确定要跳过吗？')) {
    localStorage.setItem('shipping_skipped', 'true');
    shippingAddress = null;
    renderCreditShopPage();
  }
};
  
  // 处理收货信息提交
  async function handleCreditShippingSubmit(e) {
    e.preventDefault();
    
    const data = {
      taobao_id: document.getElementById('taobao-id').value,
      receiver_name: document.getElementById('receiver-name').value,
      shipping_address: document.getElementById('shipping-address').value,
      contact_phone: document.getElementById('contact-phone').value
    };
    
    try {
      const res = await secureFetch('https://api.am-all.com.cn/api/shop/shipping-address', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (res.success) {
        shippingAddress = data;
        showSuccessMessage('收货信息绑定成功');
        renderCreditShopPage();
      }
    } catch (error) {
      showErrorMessage('绑定失败：' + error.message);
    }
  }
  
  // 渲染CREDIT商店页面（全局函数）
  window.renderCreditShopPage = async function() {
    const content = document.getElementById('content-container');
    const userCredit = currentUser.credit || 0;
    
    content.innerHTML = `
      <div class="section">
        <div class="shop-header">
          <button class="btn-back" onclick="loadPage('point-shop')">
            <i class="fas fa-arrow-left"></i> 返回
          </button>
          <h1 class="page-title">CREDIT点数商店</h1>
          <div class="shop-header-right">
            <button class="btn btn-info" onclick="showCreditOrders()">
              <i class="fas fa-history"></i> 兑换记录
            </button>
            <div class="user-points">
              <i class="fas fa-star"></i> CREDIT: <span id="current-credit">${userCredit}</span>
            </div>
          </div>
        </div>
        
        <div class="shop-filters">
          <div class="search-bar">
            <input type="text" id="search-input" placeholder="搜索商品名称">
            <button onclick="searchCreditItems()"><i class="fas fa-search"></i></button>
          </div>
          <div class="price-filter">
            <input type="number" id="min-price" placeholder="最低价">
            <span>~</span>
            <input type="number" id="max-price" placeholder="最高价">
            <button onclick="searchCreditItems()">筛选</button>
          </div>
        </div>
        
        <div class="shop-items" id="shop-items">
          <div class="loading">
            <i class="fas fa-spinner fa-spin"></i> 加载中...
          </div>
        </div>
      </div>
    `;
    
    loadCreditItems();
  }
  
  // 加载CREDIT商品
  async function loadCreditItems(search = '', minPrice = '', maxPrice = '') {
    try {
      const params = new URLSearchParams({
        shop_type: 'credit',
        search: search,
        min_price: minPrice,
        max_price: maxPrice
      });
      
      const res = await secureFetch(`https://api.am-all.com.cn/api/shop/items?${params}`);
      
      if (res.success) {
        renderCreditItems(res.items);
      }
    } catch (error) {
      showErrorMessage('加载商品失败');
    }
  }
  
  // 渲染商品列表
  function renderCreditItems(items) {
    const container = document.getElementById('shop-items');
    
    if (items.length === 0) {
      container.innerHTML = '<div class="no-items">暂无商品</div>';
      return;
    }
    
    container.innerHTML = items.map(item => `
      <div class="shop-item ${item.stock === 0 ? 'sold-out' : ''}" onclick="showCreditItemDetail(${item.id})">
        ${item.stock === 0 ? '<div class="sold-out-badge">售罄</div>' : ''}
        <div class="item-image">
          <img src="${item.item_image ? BASE_URL + item.item_image : '/images/default-item.png'}" alt="${item.item_name}">
        </div>
        <div class="item-name">${item.item_name}</div>
        <div class="item-price">${item.price} CREDIT</div>
        <div class="item-stock">库存: ${item.stock > 0 ? item.stock : '等待补货'}</div>
      </div>
    `).join('');
  }
  
  // 搜索商品
  window.searchCreditItems = function() {
    const search = document.getElementById('search-input').value;
    const minPrice = document.getElementById('min-price').value;
    const maxPrice = document.getElementById('max-price').value;
    
    loadCreditItems(search, minPrice, maxPrice);
  };
  
// 显示商品详情
window.showCreditItemDetail = async function(itemId) {
  try {
    const params = new URLSearchParams({ shop_type: 'credit' });
    const res = await secureFetch(`https://api.am-all.com.cn/api/shop/items?${params}`);
    
    const item = res.items.find(i => i.id === itemId);
    if (!item) return;
    
    // 检查是否为实物商品且未绑定收货信息
    if (item.item_type === 'physical' && !shippingAddress) {
      if (confirm('兑换实物商品需要绑定收货信息。是否现在去绑定？')) {
        renderShippingFormForCredit();
      }
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content shop-detail-modal">
        <div class="modal-header">
          <h3>${item.item_name}</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-image">
            <img src="${item.item_image ? BASE_URL + item.item_image : '/images/default-item.png'}" alt="${item.item_name}">
          </div>
          <div class="detail-info">
            <div class="detail-desc">${item.item_description || '暂无介绍'}</div>
            <div class="detail-price">价格：${item.price} CREDIT</div>
            <div class="detail-stock">库存：${item.stock}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="redeemCreditItem(${item.id})" ${item.stock === 0 ? 'disabled' : ''}>
            <i class="fas fa-shopping-cart"></i> 兑换
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
            <i class="fas fa-times"></i> 取消
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  } catch (error) {
    showErrorMessage('加载商品详情失败');
  }
};
  
// 兑换商品
window.redeemCreditItem = async function(itemId) {
  try {
    // 先获取商品信息
    const params = new URLSearchParams({ shop_type: 'credit' });
    const res = await secureFetch(`https://api.am-all.com.cn/api/shop/items?${params}`);
    const item = res.items.find(i => i.id === itemId);
    
    if (!item) {
      showErrorMessage('商品不存在');
      return;
    }
    
    // 检测虚拟物品的用户组变更
    if (item.item_type === 'virtual' && item.virtual_type === 'user_group' && item.virtual_value) {
      const currentRank = currentUser.user_rank || 0;
      const targetRank = item.virtual_value;
      
      if (currentRank >= targetRank) {
        showErrorMessage(`您当前的用户组等级已经高于或等于目标等级，无法兑换此升级商品！\n当前等级：${getUserRankName(currentRank)}\n目标等级：${getUserRankName(targetRank)}`);
        return;
      }
    }
    
    if (!confirm('确定要兑换此商品吗？')) return;
    
    const redeemRes = await secureFetch('https://api.am-all.com.cn/api/shop/redeem', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId })
    });
    
    // 关闭模态框
    const modal = document.querySelector('.modal.show');
    if (modal) modal.remove();
    
    // 更新用户积分显示
    const userRes = await secureFetch('https://api.am-all.com.cn/api/user');
    if (userRes) {
      currentUser = userRes;
      localStorage.setItem('userInfo', JSON.stringify(userRes));
      const creditElement = document.getElementById('current-credit');
      if (creditElement) {
        creditElement.textContent = userRes.credit;
      }
    }
    
    // 刷新商品列表
    loadCreditItems();
    
    showSuccessMessage('兑换成功！');
    
    if (redeemRes.redemption_code) {
      setTimeout(() => {
        alert(`兑换码：${redeemRes.redemption_code}\n请妥善保管！`);
      }, 500);
    }
    
    if (redeemRes.coupon_code) {
      setTimeout(() => {
        alert(`优惠券码：${redeemRes.coupon_code}\n请妥善保管！`);
      }, 1000);
    }
  } catch (error) {
    showErrorMessage('兑换失败：' + error.message);
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
  
  // 显示用户兑换记录
  window.showCreditOrders = async function() {
    const content = document.getElementById('content-container');
    
    content.innerHTML = `
      <div class="section">
        <div class="shop-header">
          <button class="btn-back" onclick="renderCreditShopPage()">
            <i class="fas fa-arrow-left"></i> 返回商店
          </button>
          <h1 class="page-title">CREDIT商店 - 我的兑换记录</h1>
        </div>
        
        <div class="orders-container">
          <table class="orders-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>商品名称</th>
                <th>类型</th>
                <th>消耗CREDIT</th>
                <th>兑换码</th>
                <th>优惠券码</th>
                <th>状态</th>
                <th>兑换时间</th>
              </tr>
            </thead>
            <tbody id="orders-tbody">
              <tr>
                <td colspan="8" class="loading-cell">
                  <i class="fas fa-spinner fa-spin"></i> 加载中...
                </td>
              </tr>
            </tbody>
          </table>
          <div id="orders-pagination"></div>
        </div>
      </div>
    `;
    
    loadUserCreditOrders(1);
  };
  
  // 加载用户CREDIT订单
  async function loadUserCreditOrders(page = 1) {
    try {
      const res = await secureFetch(`https://api.am-all.com.cn/api/shop/orders/my?shop_type=credit&page=${page}`);
      
      if (res.success) {
        renderUserCreditOrders(res.orders, res.pagination);
      }
    } catch (error) {
      showErrorMessage('加载兑换记录失败');
    }
  }
  
  // 渲染用户订单
  function renderUserCreditOrders(orders, pagination) {
    const tbody = document.getElementById('orders-tbody');
    
    if (orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-cell">暂无兑换记录</td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = orders.map(order => {
      const typeText = {
        'virtual': '虚拟物品',
        'upgrade': '用户组升级',
        'physical': '实体商品'
      }[order.item_type] || '未知';
      
      const statusText = order.order_status === 'completed' ? '已完成' : '处理中';
      
      return `
        <tr>
          <td class="order-number">${order.order_number}</td>
          <td>${order.item_name}</td>
          <td>${typeText}</td>
          <td>${order.price}</td>
          <td>
            ${order.redemption_code ? 
              `<span class="redemption-code">${order.redemption_code}</span>
               <button class="btn-small btn-copy" onclick="copyRedemptionCode('${order.redemption_code}')">
                 <i class="fas fa-copy"></i>
               </button>` : 
              '-'}
          </td>
          <td>
            ${order.coupon_code ? 
              `<span class="coupon-code">${order.coupon_code}</span>
               <button class="btn-small btn-copy" onclick="copyRedemptionCode('${order.coupon_code}')">
                 <i class="fas fa-copy"></i>
               </button>` : 
              '-'}
          </td>
          <td><span class="status-badge ${order.order_status}">${statusText}</span></td>
          <td>${new Date(order.created_at).toLocaleString()}</td>
        </tr>
      `;
    }).join('');
    
    // 渲染分页
    if (pagination) {
      renderCreditPagination('orders-pagination', pagination, (page) => loadUserCreditOrders(page));
    }
  }
  
  // CREDIT商品管理
  window.initCreditShopAdmin = async function() {
    const content = document.getElementById('content-container');
    
    content.innerHTML = `
      <div class="section">
        <h1 class="page-title">CREDIT点数商品管理</h1>
        <div class="admin-toolbar">
          <button class="btn btn-primary" onclick="showAddCreditItemModal()">
            <i class="fas fa-plus"></i> 新建商品
          </button>
          <button class="btn btn-info" onclick="showAdminCreditOrders()">
            <i class="fas fa-history"></i> 兑换记录
          </button>
          <button class="btn btn-secondary" onclick="selectAllItems()">
            <i class="fas fa-check-square"></i> 全选
          </button>
          <button class="btn btn-secondary" onclick="unselectAllItems()">
            <i class="fas fa-square"></i> 取消全选
          </button>
          <button class="btn btn-danger" onclick="deleteSelectedCreditItems()">
            <i class="fas fa-trash"></i> 删除选中
          </button>
        </div>
        
        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th width="40"><input type="checkbox" id="select-all-checkbox"></th>
                <th width="60">图片</th>
                <th>商品名</th>
                <th>介绍</th>
                <th width="100">价格</th>
                <th width="80">库存</th>
                <th width="80">限购</th>
                <th width="100">类型</th>
                <th width="120">操作</th>
              </tr>
            </thead>
            <tbody id="items-tbody">
              <tr>
                <td colspan="9" class="loading-cell">
                  <i class="fas fa-spinner fa-spin"></i> 加载中...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    loadAdminCreditItems();
    
    document.getElementById('select-all-checkbox').addEventListener('change', function() {
      const checkboxes = document.querySelectorAll('.item-checkbox');
      checkboxes.forEach(cb => cb.checked = this.checked);
    });
  };
  
  // 管理员查看所有兑换记录
  window.showAdminCreditOrders = async function() {
    const content = document.getElementById('content-container');
    
    content.innerHTML = `
      <div class="section">
        <div class="shop-header">
          <button class="btn-back" onclick="initCreditShopAdmin()">
            <i class="fas fa-arrow-left"></i> 返回管理
          </button>
          <h1 class="page-title">CREDIT商店 - 所有兑换记录</h1>
        </div>
        
        <div class="admin-search-bar">
          <input type="text" id="order-search" placeholder="搜索订单号、用户名或商品名">
          <button class="btn btn-primary" onclick="searchAdminCreditOrders()">
            <i class="fas fa-search"></i> 搜索
          </button>
        </div>
        
        <div class="orders-container">
          <table class="orders-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>用户</th>
                <th>商品名称</th>
                <th>类型</th>
                <th>消耗CREDIT</th>
                <th>兑换码</th>
                <th>优惠券码</th>
                <th>状态</th>
                <th>兑换时间</th>
              </tr>
            </thead>
            <tbody id="admin-orders-tbody">
              <tr>
                <td colspan="9" class="loading-cell">
                  <i class="fas fa-spinner fa-spin"></i> 加载中...
                </td>
              </tr>
            </tbody>
          </table>
          <div id="admin-orders-pagination"></div>
        </div>
      </div>
    `;
    
    loadAdminCreditOrders(1);
  };
  
  // 加载管理员CREDIT订单
  async function loadAdminCreditOrders(page = 1, search = '') {
    try {
      const params = new URLSearchParams({
        shop_type: 'credit',
        page: page
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const res = await secureFetch(`https://api.am-all.com.cn/api/admin/shop/orders?${params}`);
      
      if (res.success) {
        renderAdminCreditOrders(res.orders, res.pagination);
      }
    } catch (error) {
      showErrorMessage('加载兑换记录失败');
    }
  }
  
  // 渲染管理员CREDIT订单
  function renderAdminCreditOrders(orders, pagination) {
    const tbody = document.getElementById('admin-orders-tbody');
    
    if (orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-cell">暂无兑换记录</td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = orders.map(order => {
      const typeText = {
        'virtual': '虚拟物品',
        'physical': '实体商品'
      }[order.item_type] || '未知';
      
      const statusText = order.order_status === 'completed' ? '已完成' : '处理中';
      
      return `
        <tr>
          <td class="order-number">${order.order_number}</td>
          <td>${order.nickname || order.username} (UID:${order.uid})</td>
          <td>${order.item_name}</td>
          <td>${typeText}</td>
          <td>${order.price}</td>
          <td>
            ${order.redemption_code ? 
              `<span class="redemption-code">${order.redemption_code}</span>
               <button class="btn-small btn-copy" onclick="copyRedemptionCode('${order.redemption_code}')">
                 <i class="fas fa-copy"></i>
               </button>` : 
              '-'}
          </td>
          <td>
            ${order.coupon_code ? 
              `<span class="coupon-code">${order.coupon_code}</span>
               <button class="btn-small btn-copy" onclick="copyRedemptionCode('${order.coupon_code}')">
                 <i class="fas fa-copy"></i>
               </button>` : 
              '-'}
          </td>
          <td><span class="status-badge ${order.order_status}">${statusText}</span></td>
          <td>${new Date(order.created_at).toLocaleString()}</td>
        </tr>
      `;
    }).join('');
    
    // 渲染分页
    if (pagination) {
      renderCreditPagination('admin-orders-pagination', pagination, (page) => {
        const search = document.getElementById('order-search')?.value || '';
        loadAdminCreditOrders(page, search);
      });
    }
  }
  
  // 搜索管理员CREDIT订单
  window.searchAdminCreditOrders = function() {
    const search = document.getElementById('order-search').value;
    loadAdminCreditOrders(1, search);
  };
  
  // CREDIT分页渲染函数
  function renderCreditPagination(containerId, pagination, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const { currentPage, totalPages } = pagination;
    
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }
    
    let html = '<div class="pagination">';
    
    if (currentPage > 1) {
      html += `<button onclick="(${onPageChange})(${currentPage - 1})">上一页</button>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === currentPage) {
        html += `<span class="current-page">${i}</span>`;
      } else if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
        html += `<button onclick="(${onPageChange})(${i})">${i}</button>`;
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        html += `<span>...</span>`;
      }
    }
    
    if (currentPage < totalPages) {
      html += `<button onclick="(${onPageChange})(${currentPage + 1})">下一页</button>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
  }
  
  // 加载管理商品列表
  async function loadAdminCreditItems() {
    try {
      const res = await secureFetch(`https://api.am-all.com.cn/api/admin/shop/items?shop_type=credit`);
      
      if (res.success) {
        renderAdminCreditItems(res.items);
      }
    } catch (error) {
      showErrorMessage('加载商品列表失败');
    }
  }
  
  // 渲染管理商品列表
  function renderAdminCreditItems(items) {
    const tbody = document.getElementById('items-tbody');
    
    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-cell">暂无商品</td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = items.map(item => {
      const typeText = {
        'virtual': '虚拟物品',
        'physical': '实体商品'
      }[item.item_type] || '实体商品';
      
      const limitText = item.max_per_user ? `${item.max_per_user}次` : '不限';
      
      return `
        <tr data-item-id="${item.id}">
          <td><input type="checkbox" class="item-checkbox" value="${item.id}"></td>
          <td>
            <img src="${item.item_image ? BASE_URL + item.item_image : '/images/default-item.png'}" 
                 class="admin-item-thumb" alt="${item.item_name}">
          </td>
          <td>${item.item_name}</td>
          <td class="desc-cell">${item.item_description || '-'}</td>
          <td>${item.price}</td>
          <td>${item.stock}</td>
          <td>${limitText}</td>
          <td>${typeText}</td>
          <td>
            <button class="btn-small btn-edit" onclick="editCreditItem(${item.id})">
              <i class="fas fa-edit"></i> 编辑
            </button>
            <button class="btn-small btn-delete" onclick="deleteCreditItem(${item.id})">
              <i class="fas fa-trash"></i> 删除
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }
  
  // 显示添加商品弹窗
  window.showAddCreditItemModal = function() {
    showCreditItemModal(null);
  };
  
  // 编辑商品
  window.editCreditItem = async function(itemId) {
    try {
      const res = await secureFetch(`https://api.am-all.com.cn/api/admin/shop/items?shop_type=credit`);
      const item = res.items.find(i => i.id === itemId);
      if (item) {
        showCreditItemModal(item);
      }
    } catch (error) {
      showErrorMessage('加载商品信息失败');
    }
  };
  
  // 显示商品编辑弹窗
  function showCreditItemModal(item) {
    const isEdit = !!item;
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content item-modal">
        <div class="modal-header">
          <h3>${isEdit ? '编辑商品' : '新建商品'}</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form id="credit-item-form" class="modal-body">
          <div class="form-group">
            <label>商品名 <span class="required">*</span></label>
            <input type="text" name="item_name" value="${item?.item_name || ''}" required>
          </div>
          
          <div class="form-group">
            <label>商品介绍</label>
            <textarea name="item_description" rows="3">${item?.item_description || ''}</textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>价格 <span class="required">*</span></label>
              <input type="number" name="price" value="${item?.price || ''}" min="1" required>
            </div>
            
            <div class="form-group">
              <label>库存 <span class="required">*</span></label>
              <input type="number" name="stock" value="${item?.stock || 0}" min="0" required>
            </div>
          </div>
          
          <div class="form-group limit-setting">
            <label>
              <input type="checkbox" id="enable-limit" ${item?.max_per_user ? 'checked' : ''} 
                     onchange="toggleLimitInput()">
              启用限购
            </label>
            <input type="number" name="max_per_user" id="max-per-user" 
                   value="${item?.max_per_user || 1}" min="1" 
                   style="display: ${item?.max_per_user ? 'inline-block' : 'none'};"
                   placeholder="每人限购次数">
          </div>
          
          <div class="form-group">
            <label>物品类型</label>
            <select name="item_type" onchange="onCreditItemTypeChange(this.value)">
              <option value="physical" ${item?.item_type === 'physical' ? 'selected' : ''}>实体商品</option>
              <option value="virtual" ${item?.item_type === 'virtual' ? 'selected' : ''}>虚拟物品</option>
            </select>
          </div>
          
          <div class="form-group" id="credit-virtual-type-group" style="display: ${item?.item_type === 'virtual' ? 'block' : 'none'}">
            <label>虚拟物品功能</label>
            <select name="virtual_type" onchange="onCreditVirtualTypeChange(this.value)">
              <option value="code" ${item?.virtual_type === 'code' ? 'selected' : ''}>仅发行兑换码</option>
              <option value="points" ${item?.virtual_type === 'points' ? 'selected' : ''}>增加积分</option>
              <option value="credit" ${item?.virtual_type === 'credit' ? 'selected' : ''}>增加CREDIT</option>
              <option value="user_group" ${item?.virtual_type === 'user_group' ? 'selected' : ''}>变更用户组</option>
              <option value="coupon" ${item?.virtual_type === 'coupon' ? 'selected' : ''}>优惠券</option>
            </select>
          </div>
          
          <div class="form-group" id="credit-virtual-value-group" style="display: none">
            <label id="credit-virtual-value-label">数值</label>
            <input type="number" name="virtual_value" id="credit-virtual-value" min="1">
            <select name="user_group_value" id="credit-user-group-select" style="display: none">
              <option value="1">初级用户</option>
              <option value="2">中级用户</option>
              <option value="3">高级用户</option>
              <option value="4">贵宾用户</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>商品图片</label>
            <div class="image-upload-area">
              <input type="file" id="credit-item-image-file" accept="image/*" onchange="previewCreditImage(this)">
              <input type="hidden" name="item_image" value="${item?.item_image || ''}">
              <div id="credit-image-preview" ${item?.item_image ? '' : 'style="display:none"'}>
                <img src="${item?.item_image ? BASE_URL + item.item_image : ''}" alt="">
              </div>
            </div>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="saveCreditItem(${item?.id || 'null'})">
            <i class="fas fa-save"></i> 保存
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
            <i class="fas fa-times"></i> 取消
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 如果是编辑模式，设置虚拟物品的值
    if (item && item.item_type === 'virtual' && item.virtual_type) {
      onCreditVirtualTypeChange(item.virtual_type);
      if (item.virtual_value) {
        if (item.virtual_type === 'user_group') {
          document.getElementById('credit-user-group-select').value = item.virtual_value;
        } else {
          document.getElementById('credit-virtual-value').value = item.virtual_value;
        }
      }
    }
  }
  
  // 物品类型变化
  window.onCreditItemTypeChange = function(type) {
    const virtualGroup = document.getElementById('credit-virtual-type-group');
    if (virtualGroup) {
      virtualGroup.style.display = type === 'virtual' ? 'block' : 'none';
    }
  };
  
  // 虚拟物品类型变化
  window.onCreditVirtualTypeChange = function(type) {
    const valueGroup = document.getElementById('credit-virtual-value-group');
    const valueLabel = document.getElementById('credit-virtual-value-label');
    const valueInput = document.getElementById('credit-virtual-value');
    const groupSelect = document.getElementById('credit-user-group-select');
    
    if (type === 'code' || type === 'coupon') {
      valueGroup.style.display = 'none';
    } else if (type === 'points') {
      valueGroup.style.display = 'block';
      valueLabel.textContent = '增加积分数量';
      valueInput.style.display = 'block';
      groupSelect.style.display = 'none';
    } else if (type === 'credit') {
      valueGroup.style.display = 'block';
      valueLabel.textContent = '增加CREDIT数量';
      valueInput.style.display = 'block';
      groupSelect.style.display = 'none';
    } else if (type === 'user_group') {
      valueGroup.style.display = 'block';
      valueLabel.textContent = '变更到用户组';
      valueInput.style.display = 'none';
      groupSelect.style.display = 'block';
    }
  };
  
  // 切换限购输入框
  window.toggleLimitInput = function() {
    const checkbox = document.getElementById('enable-limit');
    const input = document.getElementById('max-per-user');
    input.style.display = checkbox.checked ? 'inline-block' : 'none';
    if (!checkbox.checked) {
      input.value = '';
    }
  };
  
  // 预览图片
  window.previewCreditImage = async function(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://api.am-all.com.cn/api/admin/shop/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        const data = await res.json();
        if (data.success) {
          document.querySelector('input[name="item_image"]').value = data.url;
          
          const preview = document.getElementById('credit-image-preview');
          preview.style.display = 'block';
          preview.querySelector('img').src = BASE_URL + data.url;
        }
      } catch (error) {
        showErrorMessage('图片上传失败');
      }
    }
  };
  
  // 保存商品
  window.saveCreditItem = async function(itemId) {
    const form = document.getElementById('credit-item-form');
    if (!form) {
      showErrorMessage('表单未找到');
      return;
    }
    
    const formData = new FormData(form);
    
    const enableLimit = document.getElementById('enable-limit')?.checked || false;
    const maxPerUserInput = document.getElementById('max-per-user');
    const maxPerUser = enableLimit && maxPerUserInput ? parseInt(maxPerUserInput.value) : null;
    
    const data = {
      item_name: formData.get('item_name') || '',
      item_description: formData.get('item_description') || '',
      price: parseInt(formData.get('price')) || 0,
      stock: parseInt(formData.get('stock')) || 0,
      item_image: formData.get('item_image') || null,
      shop_type: 'credit',
      max_per_user: maxPerUser,
      is_active: true,
      item_type: formData.get('item_type') || 'physical'
    };
    
    // 处理虚拟物品相关字段
    if (data.item_type === 'virtual') {
      data.virtual_type = formData.get('virtual_type') || 'code';
      
      if (data.virtual_type === 'user_group') {
        data.virtual_value = parseInt(formData.get('user_group_value')) || null;
      } else if (data.virtual_type !== 'code' && data.virtual_type !== 'coupon') {
        data.virtual_value = parseInt(formData.get('virtual_value')) || null;
      }
    }
    
    // 验证必填字段
    if (!data.item_name) {
      showErrorMessage('商品名称不能为空');
      return;
    }
    
    if (!data.price || data.price <= 0) {
      showErrorMessage('价格必须大于0');
      return;
    }
    
    try {
      const url = itemId ? 
        `https://api.am-all.com.cn/api/admin/shop/items/${itemId}` :
        'https://api.am-all.com.cn/api/admin/shop/items';
      
      const method = itemId ? 'PUT' : 'POST';
      
      const res = await secureFetch(url, {
        method: method,
        body: JSON.stringify(data)
      });
      
      const modal = document.querySelector('.modal.show');
      if (modal) modal.remove();
      
      showSuccessMessage(itemId ? '更新成功' : '添加成功');
      
      loadAdminCreditItems();
      
    } catch (error) {
      showErrorMessage('保存失败：' + error.message);
    }
  };
  
  // 删除商品
  window.deleteCreditItem = async function(itemId) {
    if (!confirm('确定要删除此商品吗？')) return;
    
    try {
      const res = await secureFetch(`https://api.am-all.com.cn/api/admin/shop/items/${itemId}`, {
        method: 'DELETE'
      });
      
      if (res.success) {
        showSuccessMessage('删除成功');
        loadAdminCreditItems();
      }
    } catch (error) {
      showErrorMessage('删除失败');
    }
  };
  
  // 全选
  window.selectAllItems = function() {
    document.getElementById('select-all-checkbox').checked = true;
    document.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = true);
  };
  
  // 取消全选
  window.unselectAllItems = function() {
    document.getElementById('select-all-checkbox').checked = false;
    document.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = false);
  };
  
  // 删除选中商品
  window.deleteSelectedCreditItems = async function() {
    const checkboxes = document.querySelectorAll('.item-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (ids.length === 0) {
      showErrorMessage('请选择要删除的商品');
      return;
    }
    
    if (!confirm(`确定要删除选中的 ${ids.length} 个商品吗？`)) return;
    
    try {
      const res = await secureFetch('https://api.am-all.com.cn/api/admin/shop/items/batch-delete', {
        method: 'POST',
        body: JSON.stringify({ ids })
      });
      
      if (res.success) {
        showSuccessMessage('批量删除成功');
        loadAdminCreditItems();
      }
    } catch (error) {
      showErrorMessage('删除失败');
    }
  };
  
  // 复制兑换码
  window.copyRedemptionCode = function(code) {
    const textarea = document.createElement('textarea');
    textarea.value = code;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showSuccessMessage('已复制到剪贴板');
  };
  
})();