// 积分商城主模块
(function() {
  'use strict';
  
  let currentShopType = 'points';
  let currentUser = null;
  let shippingAddress = null;
  const BASE_URL = 'https://api.am-all.com.cn';
  
  // ========== 工具函数定义 ==========
  // 定义 secureFetch 函数
  if (typeof window.secureFetch === 'undefined') {
    window.secureFetch = async function(url, options = {}) {
      const token = localStorage.getItem('token');
      
      // 合并默认headers
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
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        return data;
      } catch (error) {
        console.error('secureFetch error:', error);
        throw error;
      }
    };
  }
  
  // 确保消息提示函数存在
  if (typeof window.showSuccessMessage === 'undefined') {
    window.showSuccessMessage = function(message) {
      // 创建成功提示
      const toast = document.createElement('div');
      toast.className = 'toast success-toast';
      toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
      `;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    };
  }
  
  if (typeof window.showErrorMessage === 'undefined') {
    window.showErrorMessage = function(message) {
      // 创建错误提示
      const toast = document.createElement('div');
      toast.className = 'toast error-toast';
      toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
      `;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    };
  }
  
  if (typeof window.showInfoMessage === 'undefined') {
    window.showInfoMessage = function(message) {
      // 创建信息提示
      const toast = document.createElement('div');
      toast.className = 'toast info-toast';
      toast.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>${message}</span>
      `;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3498db;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    };
  }
  
  // 添加CSS动画
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.innerHTML = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .toast {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        font-weight: 500;
      }
      
      .toast i {
        font-size: 18px;
      }
    `;
    document.head.appendChild(style);
  }
  
// ========== 初始化和基础功能 ==========
// 初始化积分商城
window.initPointShop = async function() {
  try {
    // 获取当前用户信息
    currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    // 检查收货地址
    const addressRes = await secureFetch('https://api.am-all.com.cn/api/shop/shipping-address');
    
    if (addressRes.success && addressRes.address) {
      shippingAddress = addressRes.address;
      renderShopSelection();
    } else {
      // 检查是否之前跳过了绑定
      const skipped = localStorage.getItem('shipping_skipped');
      if (skipped === 'true') {
        shippingAddress = null;
        renderShopSelection();
      } else {
        renderShippingForm();
      }
    }
  } catch (error) {
    console.error('初始化积分商城失败:', error);
    showErrorMessage('加载失败，请刷新重试');
  }
};

// 渲染收货信息表单
function renderShippingForm() {
  const content = document.getElementById('content-container');
  content.innerHTML = `
    <div class="section">
      <h1 class="page-title">绑定收货信息</h1>
      <div class="shipping-form-container">
        <div class="form-card">
          <p class="form-hint">首次使用积分商城需要绑定收货信息（如果只兑换虚拟物品可以跳过）</p>
          <form id="shipping-form">
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
              <button type="button" class="btn btn-secondary" onclick="skipShippingBinding()">
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
  
  document.getElementById('shipping-form').addEventListener('submit', handleShippingSubmit);
}

//跳过收货信息绑定
window.skipShippingBinding = function() {
  if (confirm('跳过后您将无法兑换实物商品，只能兑换虚拟物品。确定要跳过吗？')) {
    // 标记用户选择了跳过
    localStorage.setItem('shipping_skipped', 'true');
    shippingAddress = null;
    renderShopSelection();
  }
};
  
  // 处理收货信息提交
  async function handleShippingSubmit(e) {
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
        renderShopSelection();
      }
    } catch (error) {
      showErrorMessage('绑定失败：' + error.message);
    }
  }
  
  // 渲染商店选择页面
  function renderShopSelection() {
    const content = document.getElementById('content-container');
    content.innerHTML = `
      <div class="section">
        <h1 class="page-title">积分商城</h1>
        <div class="shop-selection-container">
          <div class="shop-cards">
            <div class="shop-card" onclick="openPointShop('points')">
              <div class="shop-card-icon">
                <i class="fas fa-coins"></i>
              </div>
              <h3>普通积分商店</h3>
              <p>使用普通积分兑换商品</p>
              <div class="shop-card-points">
                当前积分：<span class="points-value">${currentUser.points || 0}</span>
              </div>
            </div>
            
            <div class="shop-card" onclick="openPointShop('point2')">
              <div class="shop-card-icon">
                <i class="fas fa-dove"></i>
              </div>
              <h3>鸽屋积分商店</h3>
              <p>使用鸽屋积分兑换商品</p>
              <div class="shop-card-points">
                当前积分：<span class="points-value">${currentUser.point2 || 0}</span>
              </div>
            </div>
            
			<div class="shop-card" onclick="initCreditShop()">
			  <div class="shop-card-icon">
				<i class="fas fa-gem"></i>
			  </div>
			  <h3>CREDIT点数商店</h3>
			  <p>使用CREDIT点数兑换商品</p>
			  <div class="shop-card-points">
				当前CREDIT：<span class="points-value">${currentUser.credit || 0}</span>
			  </div>
			</div>
          </div>
        </div>
      </div>
    `;
  }
  
  // 打开积分商店
  window.openPointShop = async function(shopType) {
    currentShopType = shopType;
    renderShopPage(shopType);
  };
  
  // 渲染商店页面
  async function renderShopPage(shopType) {
    const content = document.getElementById('content-container');
    const shopName = shopType === 'points' ? '普通积分商店' : '鸽屋积分商店';
    const pointsName = shopType === 'points' ? '普通积分' : '鸽屋积分';
    const userPoints = shopType === 'points' ? currentUser.points : currentUser.point2;
    
    content.innerHTML = `
      <div class="section">
        <div class="shop-header">
          <button class="btn-back" onclick="initPointShop()">
            <i class="fas fa-arrow-left"></i> 返回
          </button>
          <h1 class="page-title">${shopName}</h1>
          <div class="shop-header-right">
            <button class="btn btn-info" onclick="showMyOrders('${shopType}')">
              <i class="fas fa-history"></i> 兑换记录
            </button>
            <div class="user-points">
              <i class="fas fa-coins"></i> ${pointsName}：<span id="current-points">${userPoints || 0}</span>
            </div>
          </div>
        </div>
        
        <div class="shop-filters">
          <div class="search-bar">
            <input type="text" id="search-input" placeholder="搜索商品名称">
            <button onclick="searchItems()"><i class="fas fa-search"></i></button>
          </div>
          <div class="price-filter">
            <input type="number" id="min-price" placeholder="最低价">
            <span>~</span>
            <input type="number" id="max-price" placeholder="最高价">
            <button onclick="searchItems()">筛选</button>
          </div>
        </div>
        
        <div class="shop-items" id="shop-items">
          <div class="loading">
            <i class="fas fa-spinner fa-spin"></i> 加载中...
          </div>
        </div>
      </div>
    `;
    
    loadShopItems(shopType);
  }

  // ========== 显示用户兑换记录函数 ==========
  window.showMyOrders = async function(shopType) {
    const content = document.getElementById('content-container');
    const shopName = shopType === 'points' ? '普通积分商店' : '鸽屋积分商店';
    
    content.innerHTML = `
      <div class="section">
        <div class="shop-header">
          <button class="btn-back" onclick="openPointShop('${shopType}')">
            <i class="fas fa-arrow-left"></i> 返回商店
          </button>
          <h1 class="page-title">${shopName} - 我的兑换记录</h1>
        </div>
        
        <div class="orders-container">
          <table class="orders-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>商品名称</th>
                <th>类型</th>
                <th>消耗积分</th>
                <th>兑换码</th>
                <th>状态</th>
                <th>兑换时间</th>
                <th>操作</th>
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
    
    loadUserOrders(shopType, 1);
  };

  // ========== 加载用户兑换记录 ==========
  async function loadUserOrders(shopType, page = 1) {
    try {
      const res = await secureFetch(`https://api.am-all.com.cn/api/shop/orders/my?shop_type=${shopType}&page=${page}`);
      
      if (res.success) {
        renderUserOrders(res.orders, res.pagination, shopType);
      }
    } catch (error) {
      showErrorMessage('加载兑换记录失败');
    }
  }

  // ========== 渲染用户兑换记录 ==========
  function renderUserOrders(orders, pagination, shopType) {
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
          <td><span class="status-badge ${order.order_status}">${statusText}</span></td>
          <td>${new Date(order.created_at).toLocaleString()}</td>
          <td>
            <button class="btn-small btn-info" onclick="showOrderDetail('${order.order_number}')">
              <i class="fas fa-eye"></i> 详情
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    // 渲染分页
    renderPagination('orders-pagination', pagination, (page) => loadUserOrders(shopType, page));
  }

  // ========== 复制兑换码 ==========
  window.copyRedemptionCode = function(code) {
    const textarea = document.createElement('textarea');
    textarea.value = code;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showSuccessMessage('兑换码已复制到剪贴板');
  };

  // ========== 显示订单详情 ==========
  window.showOrderDetail = function(orderNumber) {
    // 这里可以实现显示订单详情的弹窗
    showInfoMessage('订单号：' + orderNumber);
  };

  // 加载商品列表
  async function loadShopItems(shopType, search = '', minPrice = '', maxPrice = '') {
    try {
      const params = new URLSearchParams({
        shop_type: shopType,
        search: search,
        min_price: minPrice,
        max_price: maxPrice
      });
      
      const res = await secureFetch(`https://api.am-all.com.cn/api/shop/items?${params}`);
      
      if (res.success) {
        renderItems(res.items);
      }
    } catch (error) {
      showErrorMessage('加载商品失败');
    }
  }
  
  // 渲染商品列表
  function renderItems(items) {
    const container = document.getElementById('shop-items');
    
    if (items.length === 0) {
      container.innerHTML = '<div class="no-items">暂无商品</div>';
      return;
    }
    
    container.innerHTML = items.map(item => `
      <div class="shop-item ${item.stock === 0 ? 'sold-out' : ''}" onclick="showItemDetail(${item.id})">
        ${item.stock === 0 ? '<div class="sold-out-badge">售罄</div>' : ''}
        <div class="item-image">
          <img src="${item.item_image ? BASE_URL + item.item_image : '/images/default-item.png'}" alt="${item.item_name}">
        </div>
        <div class="item-name">${item.item_name}</div>
        <div class="item-price">${item.price} ${currentShopType === 'points' ? '积分' : '鸽屋积分'}</div>
        <div class="item-stock">库存: ${item.stock > 0 ? item.stock : '等待补货'}</div>
      </div>
    `).join('');
  }
  
  // 搜索商品
  window.searchItems = function() {
    const search = document.getElementById('search-input').value;
    const minPrice = document.getElementById('min-price').value;
    const maxPrice = document.getElementById('max-price').value;
    
    loadShopItems(currentShopType, search, minPrice, maxPrice);
  };

// 显示商品详情
window.showItemDetail = async function(itemId) {
  try {
    const params = new URLSearchParams({ shop_type: currentShopType });
    const res = await secureFetch(`https://api.am-all.com.cn/api/shop/items?${params}`);
    
    const item = res.items.find(i => i.id === itemId);
    if (!item) return;
    
    // 检查是否为实物商品且未绑定收货信息
    if (item.item_type === 'physical' && !shippingAddress) {
      if (confirm('兑换实物商品需要绑定收货信息。是否现在去绑定？')) {
        renderShippingForm();
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
            <div class="detail-price">价格：${item.price} ${currentShopType === 'points' ? '积分' : '鸽屋积分'}</div>
            <div class="detail-stock">库存：${item.stock}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="redeemItem(${item.id})" ${item.stock === 0 ? 'disabled' : ''}>
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
  
// 兑换商品（修复后的版本）
window.redeemItem = async function(itemId) {
  try {
    // 先获取商品信息
    const params = new URLSearchParams({ shop_type: currentShopType });
    const res = await secureFetch(`https://api.am-all.com.cn/api/shop/items?${params}`);
    const item = res.items.find(i => i.id === itemId);
    
    if (!item) {
      showErrorMessage('商品不存在');
      return;
    }
    
    // 检测用户组升级商品
    if (item.item_type === 'upgrade' && item.upgrade_rank) {
      const currentRank = currentUser.user_rank || 0;
      const targetRank = item.upgrade_rank;
      
      if (currentRank >= targetRank) {
        showErrorMessage(`您当前的用户组等级已经高于或等于目标等级，无法兑换此升级商品！\n当前等级：${getUserRankName(currentRank)}\n目标等级：${getUserRankName(targetRank)}`);
        return;
      }
    }
    
    if (!confirm('确定要兑换此商品吗？')) return;
    
    console.log('开始兑换商品:', itemId);
    
    const redeemRes = await secureFetch('https://api.am-all.com.cn/api/shop/redeem', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId })
    });
    
    console.log('兑换响应:', redeemRes);
    
    // 修复：先获取并关闭特定的商品详情模态框
    const detailModal = document.querySelector('.modal.show .shop-detail-modal');
    const modalParent = detailModal ? detailModal.closest('.modal') : null;
    
    if (modalParent) {
      modalParent.remove();
    }
    
    // 更新用户积分显示
    if (redeemRes.user) {
      currentUser = redeemRes.user;
      localStorage.setItem('userInfo', JSON.stringify(redeemRes.user));
      const pointsElement = document.getElementById('current-points');
      if (pointsElement) {
        pointsElement.textContent = 
          currentShopType === 'points' ? redeemRes.user.points : redeemRes.user.point2;
      }
    } else {
      // 如果响应中没有用户信息，重新获取
      try {
        const userRes = await secureFetch('https://api.am-all.com.cn/api/user');
        
        if (userRes) {
          currentUser = userRes;
          localStorage.setItem('userInfo', JSON.stringify(userRes));
          const pointsElement = document.getElementById('current-points');
          if (pointsElement) {
            pointsElement.textContent = 
              currentShopType === 'points' ? userRes.points : userRes.point2;
          }
        }
      } catch (e) {
        console.error('更新用户信息失败:', e);
      }
    }
    
    // 刷新商品列表
    loadShopItems(currentShopType);
    
    // 延迟显示成功消息和兑换码
    setTimeout(() => {
      showSuccessMessage('兑换成功！');
      
      // 显示兑换码（如果有）
      if (redeemRes.redemption_code) {
        setTimeout(() => {
          alert(`兑换码：${redeemRes.redemption_code}\n请妥善保管！`);
        }, 500);
      }
    }, 100);
    
  } catch (error) {
    console.error('兑换失败:', error);
    showErrorMessage('兑换失败：' + (error.message || '未知错误'));
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
  
  // 商品管理页面
  window.initShopAdmin = async function(shopType) {
    const content = document.getElementById('content-container');
    const isPointShop = shopType === 'points';
    const pageTitle = isPointShop ? '积分商品管理' : '鸽屋积分商品管理';
    
    content.innerHTML = `
      <div class="section">
        <h1 class="page-title">${pageTitle}</h1>
        <div class="admin-toolbar">
          <button class="btn btn-primary" onclick="showAddItemModal('${shopType}')">
            <i class="fas fa-plus"></i> 新建商品
          </button>
          <button class="btn btn-info" onclick="showAdminOrders('${shopType}')">
            <i class="fas fa-history"></i> 兑换记录
          </button>
          <button class="btn btn-secondary" onclick="selectAllItems()">
            <i class="fas fa-check-square"></i> 全选
          </button>
          <button class="btn btn-secondary" onclick="unselectAllItems()">
            <i class="fas fa-square"></i> 取消全选
          </button>
          <button class="btn btn-danger" onclick="deleteSelectedItems()">
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
                ${isPointShop ? '<th width="100">类型</th>' : ''}
                <th width="120">操作</th>
              </tr>
            </thead>
            <tbody id="items-tbody">
              <tr>
                <td colspan="${isPointShop ? 9 : 8}" class="loading-cell">
                  <i class="fas fa-spinner fa-spin"></i> 加载中...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    loadAdminItems(shopType);
    
    document.getElementById('select-all-checkbox').addEventListener('change', function() {
      const checkboxes = document.querySelectorAll('.item-checkbox');
      checkboxes.forEach(cb => cb.checked = this.checked);
    });
  };
  
  // 加载管理商品列表
  async function loadAdminItems(shopType) {
    try {
      const res = await secureFetch(`https://api.am-all.com.cn/api/admin/shop/items?shop_type=${shopType}`);
      
      if (res.success) {
        renderAdminItems(res.items, shopType);
      }
    } catch (error) {
      showErrorMessage('加载商品列表失败');
    }
  }
  
  // 渲染管理商品列表
  function renderAdminItems(items, shopType) {
    const tbody = document.getElementById('items-tbody');
    const isPointShop = shopType === 'points';
    
    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${isPointShop ? 9 : 8}" class="empty-cell">暂无商品</td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = items.map(item => {
      const typeText = {
        'virtual': '虚拟物品',
        'upgrade': '用户组升级',
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
          ${isPointShop ? `<td>${typeText}</td>` : ''}
          <td>
            <button class="btn-small btn-edit" onclick="editItem(${item.id}, '${shopType}')">
              <i class="fas fa-edit"></i> 编辑
            </button>
            <button class="btn-small btn-delete" onclick="deleteItem(${item.id}, '${shopType}')">
              <i class="fas fa-trash"></i> 删除
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }
  
  // 显示添加商品弹窗
  window.showAddItemModal = function(shopType) {
    showItemModal(null, shopType);
  };
  
  // 编辑商品
  window.editItem = async function(itemId, shopType) {
    try {
      const res = await secureFetch(`https://api.am-all.com.cn/api/admin/shop/items?shop_type=${shopType}`);
      const item = res.items.find(i => i.id === itemId);
      if (item) {
        showItemModal(item, shopType);
      }
    } catch (error) {
      showErrorMessage('加载商品信息失败');
    }
  };
  
  // 显示商品编辑弹窗
  function showItemModal(item, shopType) {
    const isEdit = !!item;
    const isPointShop = shopType === 'points';
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content item-modal">
        <div class="modal-header">
          <h3>${isEdit ? '编辑商品' : '新建商品'}</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form id="item-form" class="modal-body">
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
          
          ${isPointShop ? `
            <div class="form-group">
              <label>物品类型</label>
              <select name="item_type" onchange="onItemTypeChange(this.value)">
                <option value="physical" ${item?.item_type === 'physical' ? 'selected' : ''}>实体商品</option>
                <option value="virtual" ${item?.item_type === 'virtual' ? 'selected' : ''}>虚拟物品</option>
                <option value="upgrade" ${item?.item_type === 'upgrade' ? 'selected' : ''}>用户组升级</option>
              </select>
            </div>
            
            <div class="form-group" id="upgrade-rank-group" style="display: ${item?.item_type === 'upgrade' ? 'block' : 'none'}">
              <label>升级到用户组</label>
              <select name="upgrade_rank">
                <option value="1" ${item?.upgrade_rank === 1 ? 'selected' : ''}>初级用户</option>
                <option value="2" ${item?.upgrade_rank === 2 ? 'selected' : ''}>中级用户</option>
                <option value="3" ${item?.upgrade_rank === 3 ? 'selected' : ''}>高级用户</option>
                <option value="4" ${item?.upgrade_rank === 4 ? 'selected' : ''}>贵宾用户</option>
                <option value="5" ${item?.upgrade_rank === 5 ? 'selected' : ''}>管理员</option>
              </select>
            </div>
          ` : ''}
          
          <div class="form-group">
            <label>商品图片</label>
            <div class="image-upload-area">
              <input type="file" id="item-image-file" accept="image/*" onchange="previewImage(this)">
              <input type="hidden" name="item_image" value="${item?.item_image || ''}">
              <div id="image-preview" ${item?.item_image ? '' : 'style="display:none"'}>
                <img src="${item?.item_image ? BASE_URL + item.item_image : ''}" alt="">
              </div>
            </div>
          </div>

			${isPointShop ? `
			  <div class="form-group" id="virtual-type-group" style="display: ${item?.item_type === 'virtual' ? 'block' : 'none'}">
				<label>虚拟物品功能</label>
				<select name="virtual_type" onchange="onVirtualTypeChange(this.value)">
				  <option value="code" ${item?.virtual_type === 'code' ? 'selected' : ''}>仅发行兑换码</option>
				  <option value="points" ${item?.virtual_type === 'points' ? 'selected' : ''}>增加积分</option>
				  <option value="credit" ${item?.virtual_type === 'credit' ? 'selected' : ''}>增加CREDIT</option>
				  <option value="user_group" ${item?.virtual_type === 'user_group' ? 'selected' : ''}>变更用户组</option>
				  <option value="coupon" ${item?.virtual_type === 'coupon' ? 'selected' : ''}>优惠券</option>
				</select>
			  </div>
			  
			  <div class="form-group" id="virtual-value-group" style="display: none">
				<label id="virtual-value-label">数值</label>
				<input type="number" name="virtual_value" id="virtual-value" min="1">
				<select name="user_group_value" id="user-group-select" style="display: none">
				  <option value="1">初级用户</option>
				  <option value="2">中级用户</option>
				  <option value="3">高级用户</option>
				  <option value="4">贵宾用户</option>
				</select>
			  </div>
			` : ''}
        </form>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="saveItem(${item?.id || 'null'}, '${shopType}')">
            <i class="fas fa-save"></i> 保存
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
            <i class="fas fa-times"></i> 取消
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  // ========== 切换限购输入框显示 ==========
  window.toggleLimitInput = function() {
    const checkbox = document.getElementById('enable-limit');
    const input = document.getElementById('max-per-user');
    input.style.display = checkbox.checked ? 'inline-block' : 'none';
    if (!checkbox.checked) {
      input.value = '';
    }
  };
  
  // 物品类型变化
  window.onItemTypeChange = function(type) {
    const upgradeGroup = document.getElementById('upgrade-rank-group');
    if (upgradeGroup) {
      upgradeGroup.style.display = type === 'upgrade' ? 'block' : 'none';
    }
  };
  
  // 预览图片
  window.previewImage = async function(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // 上传图片
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
          
          const preview = document.getElementById('image-preview');
          preview.style.display = 'block';
          preview.querySelector('img').src = BASE_URL + data.url;
        }
      } catch (error) {
        showErrorMessage('图片上传失败');
      }
    }
  };
  
  // 保存商品（修复后的版本）
  window.saveItem = async function(itemId, shopType) {
    const form = document.getElementById('item-form');
    if (!form) {
      showErrorMessage('表单未找到');
      return;
    }
    
    const formData = new FormData(form);
    
    console.log('=== 保存商品调试 ===');
    console.log('商品ID:', itemId);
    console.log('商店类型:', shopType);
    
    // 获取表单值
    const enableLimit = document.getElementById('enable-limit')?.checked || false;
    const maxPerUserInput = document.getElementById('max-per-user');
    const maxPerUser = enableLimit && maxPerUserInput ? parseInt(maxPerUserInput.value) : null;
    
    // 构建要发送的数据对象
    const data = {
      item_name: formData.get('item_name') || '',
      item_description: formData.get('item_description') || '',
      price: parseInt(formData.get('price')) || 0,
      stock: parseInt(formData.get('stock')) || 0,
      item_image: formData.get('item_image') || null,
      shop_type: shopType,
      max_per_user: maxPerUser,
      is_active: true
    };
    
    // 处理商品类型相关字段
    if (shopType === 'points') {
      data.item_type = formData.get('item_type') || 'physical';
      if (data.item_type === 'upgrade') {
        const upgradeRankValue = formData.get('upgrade_rank');
        data.upgrade_rank = upgradeRankValue ? parseInt(upgradeRankValue) : null;
      } else {
        data.upgrade_rank = null;
      }
    } else {
      data.item_type = 'physical';
      data.upgrade_rank = null;
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
    
    if (data.stock < 0) {
      showErrorMessage('库存不能为负数');
      return;
    }
    
    console.log('发送的数据:', data);
    
    try {
      const url = itemId ? 
        `https://api.am-all.com.cn/api/admin/shop/items/${itemId}` :
        'https://api.am-all.com.cn/api/admin/shop/items';
      
      const method = itemId ? 'PUT' : 'POST';
      
      const res = await secureFetch(url, {
        method: method,
        body: JSON.stringify(data)
      });
      
      console.log('服务器响应:', res);
      
      // 修复：先获取并关闭特定的商品编辑模态框
      const itemModal = document.querySelector('.modal.show .item-modal');
      const modalParent = itemModal ? itemModal.closest('.modal') : null;
      
      if (modalParent) {
        modalParent.remove();
      }
      
      // 延迟显示成功消息，确保模态框已关闭
      setTimeout(() => {
        showSuccessMessage(itemId ? '更新成功' : '添加成功');
      }, 100);
      
      // 重新加载商品列表
      loadAdminItems(shopType);
      
    } catch (error) {
      console.error('保存商品错误:', error);
      showErrorMessage('保存失败：' + (error.message || '未知错误'));
    }
  };

  // ========== 显示管理员兑换记录 ==========
  window.showAdminOrders = async function(shopType) {
    const content = document.getElementById('content-container');
    const shopName = shopType === 'points' ? '普通积分商店' : '鸽屋积分商店';
    
    content.innerHTML = `
      <div class="section">
        <div class="shop-header">
          <button class="btn-back" onclick="initShopAdmin('${shopType}')">
            <i class="fas fa-arrow-left"></i> 返回管理
          </button>
          <h1 class="page-title">${shopName} - 所有兑换记录</h1>
        </div>
        
        <div class="admin-search-bar">
          <input type="text" id="order-search" placeholder="搜索订单号、用户名或商品名">
          <button class="btn btn-primary" onclick="searchAdminOrders('${shopType}')">
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
                <th>消耗积分</th>
                <th>兑换码</th>
                <th>收货信息</th>
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
    
    loadAdminOrders(shopType, 1);
  };

  // ========== 加载管理员兑换记录 ==========
  async function loadAdminOrders(shopType, page = 1, search = '') {
    try {
      const params = new URLSearchParams({
        shop_type: shopType,
        page: page
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const res = await secureFetch(`https://api.am-all.com.cn/api/admin/shop/orders?${params}`);
      
      if (res.success) {
        renderAdminOrders(res.orders, res.pagination, shopType);
      }
    } catch (error) {
      showErrorMessage('加载兑换记录失败');
    }
  }

  // ========== 渲染管理员兑换记录 ==========
  function renderAdminOrders(orders, pagination, shopType) {
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
        'upgrade': '用户组升级',
        'physical': '实体商品'
      }[order.item_type] || '未知';
      
      // 状态映射
      const statusMap = {
        'pending': '待处理',
        'processing': '处理中',
        'shipped': '已发货',
        'completed': '已完成',
        'cancelled': '已取消'
      };
      
      const currentStatus = order.order_status || 'processing';
      const statusText = statusMap[currentStatus] || '处理中';
      
      let shippingInfo = '-';
      if (order.shipping_info) {
        const info = order.shipping_info;
        shippingInfo = `
          <div class="shipping-info-cell">
            <div>淘宝ID: ${info.taobao_id}</div>
            <div>收件人: ${info.receiver_name}</div>
            <div>电话: ${info.contact_phone}</div>
          </div>
        `;
      }
      
      return `
        <tr>
          <td class="order-number">${order.order_number}</td>
          <td>${order.nickname || order.username} (UID:${order.uid})</td>
          <td>${order.item_name}</td>
          <td>${typeText}</td>
          <td>${order.price}</td>
          <td>${order.redemption_code || '-'}</td>
          <td>${shippingInfo}</td>
          <td>
            <select class="status-select" data-order="${order.order_number}" onchange="updateOrderStatus('${order.order_number}', this.value)">
              <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>待处理</option>
              <option value="processing" ${currentStatus === 'processing' ? 'selected' : ''}>处理中</option>
              <option value="shipped" ${currentStatus === 'shipped' ? 'selected' : ''}>已发货</option>
              <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>已完成</option>
              <option value="cancelled" ${currentStatus === 'cancelled' ? 'selected' : ''}>已取消</option>
            </select>
          </td>
          <td>${new Date(order.created_at).toLocaleString()}</td>
        </tr>
      `;
    }).join('');
    
    // 渲染分页
    renderPagination('admin-orders-pagination', pagination, (page) => {
      const search = document.getElementById('order-search')?.value || '';
      loadAdminOrders(shopType, page, search);
    });
  }

  // 添加更新订单状态的函数
  window.updateOrderStatus = async function(orderNumber, newStatus) {
    try {
      const res = await secureFetch(`https://api.am-all.com.cn/api/admin/shop/orders/${orderNumber}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.success) {
        showSuccessMessage('订单状态已更新');
      }
    } catch (error) {
      showErrorMessage('更新状态失败：' + error.message);
      // 恢复原状态
      location.reload();
    }
  };

  // ========== 搜索管理员兑换记录 ==========
  window.searchAdminOrders = function(shopType) {
    const search = document.getElementById('order-search').value;
    loadAdminOrders(shopType, 1, search);
  };

  // ========== 分页渲染函数 ==========
  function renderPagination(containerId, pagination, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const { currentPage, totalPages } = pagination;
    
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }
    
    let html = '<div class="pagination">';
    
    // 上一页
    if (currentPage > 1) {
      html += `<button onclick="(${onPageChange})(${currentPage - 1})">上一页</button>`;
    }
    
    // 页码
    for (let i = 1; i <= totalPages; i++) {
      if (i === currentPage) {
        html += `<span class="current-page">${i}</span>`;
      } else if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
        html += `<button onclick="(${onPageChange})(${i})">${i}</button>`;
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        html += `<span>...</span>`;
      }
    }
    
    // 下一页
    if (currentPage < totalPages) {
      html += `<button onclick="(${onPageChange})(${currentPage + 1})">下一页</button>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
  }
  
  // 删除商品
  window.deleteItem = async function(itemId, shopType) {
    if (!confirm('确定要删除此商品吗？')) return;
    
    try {
      const res = await secureFetch(`https://api.am-all.com.cn/api/admin/shop/items/${itemId}`, {
        method: 'DELETE'
      });
      
      if (res.success) {
        showSuccessMessage('删除成功');
        loadAdminItems(shopType);
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
  
  // 删除选中
  window.deleteSelectedItems = async function() {
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
        const shopType = window.location.hash.includes('point2') ? 'point2' : 'points';
        loadAdminItems(shopType);
      }
    } catch (error) {
      showErrorMessage('删除失败');
    }
  };
  
  // 用户设置页面的收货信息管理
  window.initShippingSettings = async function() {
    try {
      const res = await secureFetch('https://api.am-all.com.cn/api/shop/shipping-address');
      
      const container = document.getElementById('shipping-settings-content');
      if (!container) return;
      
      if (res.success && res.address) {
        container.innerHTML = `
          <div class="shipping-info">
            <div class="info-row">
              <span class="label">淘宝ID：</span>
              <span>${res.address.taobao_id}</span>
            </div>
            <div class="info-row">
              <span class="label">收件人：</span>
              <span>${res.address.receiver_name}</span>
            </div>
            <div class="info-row">
              <span class="label">收货地址：</span>
              <span>${res.address.shipping_address}</span>
            </div>
            <div class="info-row">
              <span class="label">联系电话：</span>
              <span>${res.address.contact_phone}</span>
            </div>
            <button class="btn btn-danger" onclick="unbindShipping()">
              <i class="fas fa-unlink"></i> 解绑
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <p class="no-shipping">未绑定收货信息</p>
          <button class="btn btn-primary" onclick="loadPage('point-shop')">
            <i class="fas fa-link"></i> 去绑定
          </button>
        `;
      }
    } catch (error) {
      console.error('加载收货信息失败:', error);
    }
  };
  
  // 解绑收货信息
  window.unbindShipping = async function() {
    if (!confirm('确定要解绑收货信息吗？解绑后需要重新绑定才能使用积分商城。')) return;
    
    try {
      const res = await secureFetch('https://api.am-all.com.cn/api/shop/shipping-address', {
        method: 'DELETE'
      });
      
      if (res.success) {
        showSuccessMessage('解绑成功');
        initShippingSettings();
      }
    } catch (error) {
      showErrorMessage('解绑失败');
    }
  };
  
})();

// 虚拟物品类型变化处理
window.onVirtualTypeChange = function(type) {
  const valueGroup = document.getElementById('virtual-value-group');
  const valueLabel = document.getElementById('virtual-value-label');
  const valueInput = document.getElementById('virtual-value');
  const groupSelect = document.getElementById('user-group-select');
  
  if (!valueGroup) return;
  
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

// 修改物品类型变化处理，添加虚拟物品功能显示
window.onItemTypeChange = function(type) {
  const upgradeGroup = document.getElementById('upgrade-rank-group');
  const virtualGroup = document.getElementById('virtual-type-group');
  
  if (upgradeGroup) {
    upgradeGroup.style.display = type === 'upgrade' ? 'block' : 'none';
  }
  
  if (virtualGroup) {
    virtualGroup.style.display = type === 'virtual' ? 'block' : 'none';
    if (type !== 'virtual') {
      document.getElementById('virtual-value-group').style.display = 'none';
    }
  }
};