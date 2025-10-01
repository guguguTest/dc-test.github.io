// 页面内容定义
const pages = {
	// 首页
	home: `
	  <div class="section">
		<h1 class="page-title" data-i18n="home.title">首页</h1>
		
		<!-- 公告区域 -->
		<div class="announcements-container" id="announcements-container">
		  <div class="text-center">
			<div class="spinner-border text-primary" role="status">
			  <span class="visually-hidden">加载中...</span>
			</div>
			<p data-i18n="home.announcementsLoading">公告加载中...</p>
		  </div>
		</div>
		
		<!-- footer -->
		<hr>
		<div class="welcome-section mt-5">
		  <h2 class="section-title">
			<i class="fas fa-star"></i>
			<span data-i18n="home.welcome">MAY THE LEAKER BE WITH YOU!</span>
		  </h2>
		  <p data-i18n="home.selectFunction">请从左侧菜单选择功能</p>
		</div>
	  </div>
	`,

// 用户管理界面
'user-manager': `
<div class="section">
  <h1 class="page-title" data-i18n="userManager.title">用户管理</h1>
  <div class="user-manager-container">
    <div class="user-search-section">
      <div class="search-filters">
        <div class="search-input">
          <input type="text" id="user-search-input" data-i18n="userManager.searchPlaceholder" placeholder="搜索用户ID、用户名或邮箱...">
          <button id="user-search-btn" class="btn btn-primary">
            <i class="fas fa-search"></i> <span data-i18n="userManager.search">搜索</span>
          </button>
        </div>
        <select id="user-rank-filter" class="filter-select">
          <option value="" data-i18n="userManager.allGroups">所有用户组</option>
          <option value="0" data-i18n="userManager.normalUser">普通用户</option>
          <option value="1" data-i18n="userManager.juniorUser">初级用户</option>
          <option value="2" data-i18n="userManager.middleUser">中级用户</option>
          <option value="3" data-i18n="userManager.seniorUser">高级用户</option>
          <option value="4" data-i18n="userManager.vipUser">贵宾用户</option>
          <option value="5" data-i18n="userManager.admin">系统管理员</option>
        </select>
        <select id="user-state-filter" class="filter-select">
          <option value="" data-i18n="userManager.allStatus">所有状态</option>
          <option value="0" data-i18n="userManager.normal">正常</option>
          <option value="1" data-i18n="userManager.restricted">受限</option>
          <option value="2" data-i18n="userManager.banned">封禁</option>
        </select>
      </div>
    </div>
    
    <div class="user-table-container">
      <table class="user-table">
        <thead>
          <tr>
            <th data-i18n="userManager.avatar">头像</th>
            <th data-i18n="userManager.uid">UID</th>
            <th data-i18n="userManager.username">用户名</th>
            <th data-i18n="userManager.email">邮箱</th>
            <th data-i18n="userManager.userGroup">用户组</th>
            <th data-i18n="userManager.specialGroup">特殊用户组</th>
            <th data-i18n="userManager.points">积分</th>
            <th data-i18n="userManager.point2">鸽屋积分</th>
            <th data-i18n="userManager.gameServer">游戏服务器</th>
            <th>Keychip</th>
            <th>GUID</th>
            <th data-i18n="userManager.status">状态</th>
            <th data-i18n="userManager.actions">操作</th>
          </tr>
        </thead>
        <tbody id="users-table-body">
          <!-- 用户数据将通过JavaScript动态填充 -->
        </tbody>
      </table>
      <div id="user-pagination" class="pagination-container"></div>
    </div>
  </div>
</div>
`,

// 下载页面
download: `
  <h1 class="page-title" data-i18n="download.title">下载中心</h1>
  <div class="section">
    <h2 class="section-title">
      <i class="fas fa-gamepad"></i>
      <span data-i18n="download.gameDownload">游戏下载</span>
    </h2>
    <div class="warning">
      <strong><i class="fas fa-exclamation-circle me-2"></i> <span data-i18n="download.warning">重要提示：</span></strong>
      <span data-i18n="download.warningDetail">OneDrive下载渠道已下线</span>
    </div>
    <p class="mb-4"><strong><span data-i18n="download.lastUpdate">最后更新</span>: <span id="game-last-update"></span></strong></p>
    <div class="table-container" id="game-downloads">
      <!-- 游戏下载内容将通过JavaScript动态填充 -->
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">
      <i class="fas fa-archive"></i>
      <span data-i18n="download.archiveDownload">存档下载</span>
    </h2>
    <p class="mb-4"><strong><span data-i18n="download.lastUpdate">最后更新</span>: <span id="archive-last-update"></span></strong></p>
    <div class="table-container" id="archive-downloads">
      <!-- 存档下载内容将通过JavaScript动态填充 -->
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">
      <i class="fas fa-folder-plus"></i>
      <span data-i18n="download.otherResources">其他资源</span>
    </h2>
    <p class="mb-4"><strong><span data-i18n="download.lastUpdate">最后更新</span>: <span id="other-last-update"></span></strong></p>
    <div class="table-container" id="other-downloads">
      <!-- 其他资源内容将通过JavaScript动态填充 -->
    </div>
    <div class="warning mt-4">
      <strong><i class="fas fa-info-circle me-2"></i> <span data-i18n="download.downloadInfo">下载说明：</span></strong>
      <span data-i18n="download.downloadInfoDetail">目前本站全部资源仅提供「百度网盘」作为下载方式</span>
    </div>
  </div>

  <script>
    // 页面加载完成后初始化下载内容
    setTimeout(function() {
      if (typeof initDownloadPage === 'function') {
        initDownloadPage();
      }
      // 更新翻译
      if (typeof languageModule !== 'undefined' && languageModule.updateTranslations) {
        languageModule.updateTranslations();
      }
    }, 100);
  </script>

  <footer>
    <p data-i18n="footer.text1">SEGAY FEIWU</p>
    <p data-i18n="footer.text2">1145141919810</p>
  </footer>
`,

// 通用下载详情页面
'download-detail': `
  <div class="game-detail">
    <h1 class="page-title" data-i18n="download.title">下载详情</h1>
    <button class="back-button" data-page="download">
      <i class="fas fa-arrow-left me-2"></i>
      <span data-i18n="download.backToDownload">返回下载中心</span>
    </button>
    
    <div class="section">
      <h2 class="section-title" id="detail-title">
        <i class="fas fa-download"></i>
        <span data-i18n="download.downloadList">下载列表</span>
      </h2>
      
      <div class="mb-4">
        <p><span data-i18n="download.lastUpdate">最后更新</span>: <span id="detail-last-update"></span></p>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <td data-i18n="download.downloadMethod">下载方式</td>
                <td data-i18n="download.fileCount">文件数</td>
                <td data-i18n="download.accessCode">提取码/访问密码</td>
                <td data-i18n="download.validity">资源有效期</td>
              </tr>
            </thead>
            <tbody id="detail-download-info">
              <!-- 下载信息将通过JavaScript动态填充 -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <footer>
      <p data-i18n="footer.text1">SEGAY FEIWU</p>
      <p data-i18n="footer.text2">1145141919810</p>
    </footer>
  </div>
`,

// 下载管理页面
'download-admin': `
  <div class="section">
    <h1 class="page-title" data-i18n="downloadAdmin.title">下载管理</h1>
    <button class="back-button" data-page="home">
      <i class="fas fa-arrow-left me-2"></i>
      <span data-i18n="common.back">返回</span>
    </button>
    
    <div class="admin-actions mb-4">
      <button id="create-download-btn" class="btn btn-primary">
        <i class="fas fa-plus me-2"></i><span data-i18n="downloadAdmin.create">新建下载项目</span>
      </button>
    </div>
    
    <div class="table-responsive">
      <table class="table table-hover" id="downloads-table">
        <thead>
          <tr>
            <th data-i18n="downloadAdmin.serialNumber">序号</th>
            <th data-i18n="downloadAdmin.title2">标题</th>
            <th data-i18n="downloadAdmin.category">分类</th>
            <th data-i18n="downloadAdmin.pageId">页面ID</th>
            <th data-i18n="downloadAdmin.version">版本</th>
            <th data-i18n="downloadAdmin.fileCount">文件数</th>
            <th data-i18n="downloadAdmin.lastUpdate">最后更新</th>
            <th data-i18n="downloadAdmin.status">状态</th>
            <th data-i18n="downloadAdmin.actions">操作</th>
          </tr>
        </thead>
        <tbody id="downloads-body">
          <!-- 下载项目数据将通过JavaScript动态填充 -->
        </tbody>
      </table>
    </div>
    
	<!-- 下载项目模态框 -->
	<div id="download-modal" class="modal">
	  <div class="modal-content">
		<div class="modal-header">
		  <h5 id="modal-title" data-i18n="downloadAdmin.modalTitle">新建下载项目</h5>
		  <span class="close">×</span>
		</div>
		<form id="download-form">
		  <div class="modal-body">
			<input type="hidden" id="download-id">
			
			<!-- 基本信息区 -->
			<div class="form-section">
			  <h6 class="section-title" data-i18n="downloadAdmin.basicInfo">基本信息</h6>
			  <div class="form-row">
				<div class="form-group">
				  <label><span data-i18n="downloadAdmin.title2">标题</span> <span class="text-danger">*</span></label>
				  <input type="text" class="form-control" id="download-title" required>
				</div>
				<div class="form-group">
				  <label><span data-i18n="downloadAdmin.category">分类</span> <span class="text-danger">*</span></label>
				  <select class="form-control" id="download-category" required>
					<option value="game" data-i18n="downloadAdmin.categoryGame">游戏下载</option>
					<option value="archive" data-i18n="downloadAdmin.categoryArchive">存档下载</option>
					<option value="other" data-i18n="downloadAdmin.categoryOther">其他资源</option>
				  </select>
				</div>
			  </div>
			  
			  <div class="form-row">
				<div class="form-group">
				  <label><span data-i18n="downloadAdmin.pageId">页面ID</span> <span class="text-danger">*</span></label>
				  <input type="text" class="form-control" id="download-page-id" required>
				  <small class="form-text text-muted" data-i18n="downloadAdmin.pageIdHint">唯一标识符，用于URL访问</small>
				</div>
				<div class="form-group">
				  <label data-i18n="downloadAdmin.version">版本号</label>
				  <input type="text" class="form-control" id="download-version">
				</div>
				<div class="form-group">
				  <label data-i18n="downloadAdmin.fileCount">文件数</label>
				  <input type="number" class="form-control" id="download-file-count" min="0">
				</div>
			  </div>
			</div>
			
			<!-- 下载链接区 -->
			<div class="download-links-section">
			  <div class="download-links-header">
				<h4 data-i18n="downloadAdmin.downloadLinks">下载链接</h4>
				<button type="button" id="add-download-link">
				  <i class="fas fa-plus"></i> <span data-i18n="downloadAdmin.addLink">添加链接</span>
				</button>
			  </div>
			  <div id="download-links-container">
				<!-- 动态添加下载链接 -->
			  </div>
			</div>
			
			<!-- 权限设置区 -->
			<div class="form-section">
			  <h6 class="section-title" data-i18n="downloadAdmin.permissions">权限设置</h6>
			  <div class="form-row">
				<div class="form-group">
				  <label data-i18n="downloadAdmin.accessLevel">访问权限</label>
				  <select class="form-control" id="download-access-level">
					<option value="-1" data-i18n="downloadAdmin.unlimited">不限</option>
					<option value="0" data-i18n="userManager.normalUser">普通用户</option>
					<option value="1" data-i18n="userManager.juniorUser">初级用户</option>
					<option value="2" data-i18n="userManager.middleUser">中级用户</option>
					<option value="3" data-i18n="userManager.seniorUser">高级用户</option>
					<option value="4" data-i18n="userManager.vipUser">贵宾用户</option>
					<option value="5" data-i18n="userManager.admin">系统管理员</option>
				  </select>
				</div>
				<div class="form-group">
				  <label data-i18n="userManager.specialGroup">特殊用户组</label>
				  <input type="text" class="form-control" id="download-special-group">
				  <small class="form-text text-muted" data-i18n="downloadAdmin.specialGroupHint">留空表示无限制</small>
				</div>
				<div class="form-group">
				  <label data-i18n="downloadAdmin.requiredPoints">所需积分</label>
				  <input type="number" class="form-control" id="download-required-points" min="0" value="0">
				</div>
			  </div>
			</div>
			
			<!-- 其他信息区 -->
			<div class="form-section">
			  <h6 class="section-title" data-i18n="downloadAdmin.otherInfo">其他信息</h6>
			  <div class="form-row">
				<div class="form-group">
				  <label data-i18n="downloadAdmin.lastUpdate">最后更新</label>
				  <input type="date" class="form-control" id="download-last-update">
				</div>
				<div class="form-group">
				  <label data-i18n="downloadAdmin.status">状态</label>
				  <select class="form-control" id="download-status">
					<option value="1" data-i18n="downloadAdmin.active">激活</option>
					<option value="0" data-i18n="downloadAdmin.disabled">禁用</option>
				  </select>
				</div>
			  </div>
			  
			  <div class="form-group">
				<label data-i18n="downloadAdmin.imageUrl">图片URL</label>
				<input type="url" class="form-control" id="download-image-url">
			  </div>
			  
			  <div class="form-group">
				<label data-i18n="downloadAdmin.description">描述</label>
				<textarea class="form-control" id="download-description" rows="3"></textarea>
			  </div>
			</div>
		  </div>
		  
		  <div class="modal-footer">
			<button type="button" class="btn btn-secondary" id="cancel-download-btn" data-i18n="downloadAdmin.cancel">取消</button>
			<button type="submit" class="btn btn-primary" data-i18n="downloadAdmin.save">保存</button>
		  </div>
		</form>
	  </div>
	</div>
  </div>
`,

  // 公告管理页面
  'announcement-admin': `
    <div class="section">
      <h1 class="page-title" data-i18n="announcementAdmin.title">公告管理</h1>
      <button class="back-button" data-page="home">
        <i class="fas fa-arrow-left me-2"></i>
        <span data-i18n="common.back">返回</span>
      </button>
      
      <div class="announcement-admin-container">
        <div class="announcement-admin-actions">
          <button id="create-announcement-btn" class="btn btn-primary">
            <i class="fas fa-plus me-2"></i><span data-i18n="announcementAdmin.create">新建公告</span>
          </button>
        </div>
        
        <!-- 编辑器放在这里，初始状态为隐藏 -->
        <div class="announcement-editor" id="announcement-editor" style="display: none;">
          <h3 id="editor-title" data-i18n="announcementAdmin.editorTitle">新建公告</h3>
          <div class="form-group">
            <label for="announcement-title" data-i18n="announcementAdmin.announcementTitle">标题</label>
            <input type="text" id="announcement-title" class="form-control">
          </div>
          <div class="form-group">
            <label for="announcement-type" data-i18n="announcementAdmin.type">类型</label>
            <select id="announcement-type" class="form-control">
              <option value="notice" data-i18n="announcementAdmin.typeNotice">通知</option>
              <option value="important" data-i18n="announcementAdmin.typeImportant">重要</option>
              <option value="update" data-i18n="announcementAdmin.typeUpdate">更新</option>
              <option value="top" data-i18n="announcementAdmin.typeTop">置顶</option>
            </select>
          </div>
          <div class="form-group form-check">
            <input type="checkbox" id="announcement-pinned" class="form-check-input">
            <label for="announcement-pinned" class="form-check-label" data-i18n="announcementAdmin.pinned">置顶公告</label>
          </div>
          <div class="form-group">
            <label data-i18n="announcementAdmin.content">内容</label>
          <div class="editor-toolbar">
            <button type="button" data-command="bold"><i class="fas fa-bold"></i></button>
            <button type="button" data-command="italic"><i class="fas fa-italic"></i></button>
            <button type="button" data-command="underline"><i class="fas fa-underline"></i></button>
            <button type="button" data-command="insertUnorderedList"><i class="fas fa-list-ul"></i></button>
            <button type="button" data-command="insertOrderedList"><i class="fas fa-list-ol"></i></button>
            <button type="button" data-command="createLink"><i class="fas fa-link"></i></button>
            <button type="button" data-command="insertImage"><i class="fas fa-image"></i></button>
          </div>
            <div id="announcement-editor-content" class="editor-content"></div>
          </div>
          <div class="form-group">
            <button id="save-announcement-btn" class="btn btn-primary" data-i18n="announcementAdmin.save">保存</button>
            <button id="cancel-announcement-btn" class="btn btn-secondary" data-i18n="announcementAdmin.cancel">取消</button>
          </div>
        </div>
        
        <div id="admin-announcements-list" class="admin-announcements-list">
          <div class="text-center">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">加载中...</span>
            </div>
            <p data-i18n="announcementAdmin.loading">公告加载中...</p>
          </div>
        </div>
      </div>
    </div>
  `,

// 订单录入页面
'order-entry': `
  <div class="order-entry-container">
    <div class="section">
      <h1 class="page-title">
        <i class="fas fa-clipboard-list me-2"></i>
        <span data-i18n="orderEntry.title">订单录入管理</span>
      </h1>
      <button class="back-button" data-page="home">
        <i class="fas fa-arrow-left me-2"></i>
        <span data-i18n="orderEntry.back">返回首页</span>
      </button>
      
      <!-- 搜索框 -->
      <div class="order-search-box">
        <div class="input-group">
          <input type="text" 
                 id="order-search-input" 
                 class="form-control" 
                 data-i18n="orderEntry.searchPlaceholder"
                 placeholder="输入淘宝ID、商品名称或订单号搜索...">
          <button class="btn btn-primary" id="order-search-btn">
            <i class="fas fa-search"></i>
            <span data-i18n="orderEntry.search">搜索</span>
          </button>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="order-actions">
        <button class="btn btn-success" id="add-order-btn">
          <i class="fas fa-plus-circle"></i>
          <span data-i18n="orderEntry.add">添加订单</span>
        </button>
      </div>
      
      <!-- 表格容器 -->
      <div class="table-container">
        <div class="table-responsive">
          <table class="table" id="orders-table">
            <thead>
              <tr>
                <th style="width: 60px;" data-i18n="orderEntry.serialNumber">序号</th>
                <th data-i18n="orderEntry.taobaoId">淘宝ID</th>
                <th data-i18n="orderEntry.productName">商品名称</th>
                <th data-i18n="orderEntry.orderNumber">订单号</th>
                <th style="width: 100px;" data-i18n="orderEntry.price">价格(元)</th>
                <th style="width: 120px;" data-i18n="orderEntry.status">兑换状态</th>
                <th style="width: 140px;" data-i18n="orderEntry.actions">操作</th>
              </tr>
            </thead>
            <tbody id="orders-body">
              <!-- 订单数据将通过JavaScript动态填充 -->
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- 分页控件 -->
      <div class="pagination-container">
        <div id="pagination-controls"></div>
      </div>
    </div>
  </div>
  
  <!-- 订单编辑模态框 -->
  <div id="order-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modal-title" data-i18n="orderEntry.modalAdd">添加订单</h2>
        <span class="close">&times;</span>
      </div>
      <div class="modal-body">
        <form id="order-form">
          <input type="hidden" id="order-id">
          
          <div class="form-group">
            <label for="taobao-id">
              <i class="fas fa-user me-1"></i>
              <span data-i18n="orderEntry.taobaoId">淘宝ID</span>
            </label>
            <input type="text" 
                   id="taobao-id" 
                   class="form-control" 
                   data-i18n="orderEntry.taobaoIdPlaceholder"
                   placeholder="请输入淘宝用户ID" 
                   required>
          </div>
          
          <div class="form-group">
            <label for="product-name">
              <i class="fas fa-box me-1"></i>
              <span data-i18n="orderEntry.productName">商品名称</span>
            </label>
            <input type="text" 
                   id="product-name" 
                   class="form-control" 
                   data-i18n="orderEntry.productNamePlaceholder"
                   placeholder="请输入商品名称" 
                   required>
          </div>
          
          <div class="form-group">
            <label for="order-number">
              <i class="fas fa-hashtag me-1"></i>
              <span data-i18n="orderEntry.orderNumber">订单号</span>
            </label>
            <input type="text" 
                   id="order-number" 
                   class="form-control" 
                   data-i18n="orderEntry.orderNumberPlaceholder"
                   placeholder="请输入订单号（唯一）" 
                   required>
          </div>
          
          <div class="form-group">
            <label for="price">
              <i class="fas fa-yen-sign me-1"></i>
              <span data-i18n="orderEntry.price">价格(元)</span>
            </label>
            <input type="number" 
                   id="price" 
                   class="form-control" 
                   step="0.01" 
                   min="0" 
                   placeholder="0.00" 
                   required>
          </div>
          
          <div class="form-group">
            <label for="redeemed">
              <i class="fas fa-exchange-alt me-1"></i>
              <span data-i18n="orderEntry.status">兑换状态</span>
            </label>
            <select id="redeemed" class="form-control">
              <option value="false" data-i18n="orderEntry.unredeemed">未兑换</option>
              <option value="true" data-i18n="orderEntry.redeemed">已兑换</option>
            </select>
          </div>
          
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save me-2"></i>
            <span data-i18n="orderEntry.saveOrder">保存订单</span>
          </button>
        </form>
      </div>
    </div>
  </div>
`,

// 兑换页面
	'exchange': `
	  <div class="section">
		<h1 class="page-title" data-i18n="exchange.title">兑换码</h1>
		<button class="back-button" onclick="loadPage('home')">
		  <i class="fas fa-arrow-left me-2"></i>
		  <span data-i18n="exchange.back">返回</span>
		</button>
		
		<div class="exchange-container">
		  <div class="exchange-card">
			<div class="card-header-with-btn">
			  <h3><i class="fas fa-ticket-alt me-2"></i><span data-i18n="exchange.code">兑换码</span></h3>
			  <button class="btn-info" onclick="showUserRedemptionHistory('code')">
				<i class="fas fa-history"></i> <span data-i18n="exchange.redemptionHistory">兑换记录</span>
			  </button>
			</div>
			<p data-i18n="exchange.codeDescription">请输入兑换码进行兑换</p>
			<div class="input-group">
			  <input type="text" class="form-control" id="exchange-code" data-i18n="exchange.codePlaceholder" placeholder="请输入兑换码">
			  <button class="btn btn-primary" id="redeem-code-btn" onclick="redeemCode()">
				<i class="fas fa-gift me-2"></i><span data-i18n="exchange.redeem">兑换</span>
			  </button>
			</div>
			<div class="exchange-result" id="code-exchange-result"></div>
		  </div>
		  
		  <div class="exchange-divider">
			<span data-i18n="exchange.or">或</span>
		  </div>
		  
		  <div class="exchange-card">
			<div class="card-header-with-btn">
			  <h3><i class="fas fa-coins me-2"></i><span data-i18n="exchange.points">鸽屋积分兑换</span></h3>
			  <button class="btn-info" onclick="showUserRedemptionHistory('points')">
				<i class="fas fa-history"></i> <span data-i18n="exchange.redemptionHistory">兑换记录</span>
			  </button>
			</div>
			<p data-i18n="exchange.pointsDescription">请输入淘宝订单号兑换积分</p>
			<div class="input-group">
			  <input type="text" class="form-control" id="order-number-input" data-i18n="exchange.orderPlaceholder" placeholder="请输入淘宝订单号">
			  <button class="btn btn-primary" id="redeem-order-btn" onclick="redeemOrder()">
				<i class="fas fa-exchange-alt me-2"></i><span data-i18n="exchange.redeem">兑换</span>
			  </button>
			</div>
			<div class="exchange-result" id="order-exchange-result"></div>
		  </div>
		</div>
	  </div>
	`,

  // 登录页面
  login: `
    <div class="auth-container">
      <h1 class="page-title" data-i18n="auth.login">登录</h1>
      <button class="back-button" data-page="home">
        <i class="fas fa-arrow-left me-2"></i>
        <span data-i18n="auth.back">返回</span>
      </button>
      <div class="auth-form">
        <div class="form-group">
          <label for="login-username" data-i18n="auth.usernameOrEmail">用户名或邮箱</label>
          <input type="text" id="login-username" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="login-password" data-i18n="auth.password">密码</label>
          <input type="password" id="login-password" class="form-control" required>
        </div>
        <button id="login-btn" class="auth-btn" data-i18n="auth.login">登录</button>
        <div class="auth-footer">
          <span><span data-i18n="auth.noAccount">没有账号？</span><a href="#" data-page="register" data-i18n="auth.registerNow">立即注册</a></span>
          <span class="forgot-password"><a href="#" data-page="forgot-password" data-i18n="auth.forgotPassword">忘记密码？</a></span>
        </div>
        <div id="login-error" class="error-message" style="display: none;"></div>
      </div>
    </div>
  `,

  // 注册页面
	register: `
	  <div class="auth-container">
		<h1 class="page-title" data-i18n="auth.register">注册</h1>
		<button class="back-button" data-page="home">
		  <i class="fas fa-arrow-left me-2"></i>
		  <span data-i18n="auth.back">返回</span>
		</button>
		<div class="auth-form">
		  <div class="form-group">
			<label for="register-username" data-i18n="auth.username">用户名</label>
			<input type="text" id="register-username" class="form-control" required maxlength="20">
			<div class="char-counter"><span id="username-counter">0</span>/20</div>
		  </div>
		  <div class="form-group">
			<label for="register-email" data-i18n="auth.email">邮箱</label>
			<input type="email" id="register-email" class="form-control" required>
		  </div>
		  <div class="form-group">
			<label for="register-nickname" data-i18n="auth.nickname">昵称</label>
			<input type="text" id="register-nickname" class="form-control" maxlength="20">
			<div class="char-counter"><span id="nickname-counter">0</span>/20</div>
		  </div>
		  <div class="form-group">
			<label for="register-password" data-i18n="auth.password">密码</label>
			<input type="password" id="register-password" class="form-control" required maxlength="16">
			<div class="char-counter"><span id="password-counter">0</span>/16</div>
		  </div>
		  <div class="form-group">
			<label for="register-confirm-password" data-i18n="auth.confirmPassword">确认密码</label>
			<input type="password" id="register-confirm-password" class="form-control" required maxlength="16">
		  </div>
		  <div class="form-group">
			<label for="register-verification-code" data-i18n="auth.verificationCode">验证码</label>
			<div class="verification-code-group">
			  <input type="text" id="register-verification-code" class="form-control" required>
			  <button id="send-verification-code" class="btn btn-outline-secondary" data-i18n="auth.getVerificationCode">获取验证码</button>
			</div>
		  </div>
		  <button id="register-btn" class="auth-btn" data-i18n="auth.register">注册</button>
		  <div class="auth-footer">
			<span><span data-i18n="auth.hasAccount">已有账号？</span><a href="#" data-page="login" data-i18n="auth.loginNow">立即登录</a></span>
		  </div>
		  <div id="register-error" class="error-message" style="display: none;"></div>
		</div>
	  </div>
	`,

  // 忘记密码页面
  'forgot-password': `
    <div class="auth-container">
      <h1 class="page-title" data-i18n="auth.resetPassword">找回密码</h1>
      <button class="back-button" data-page="login">
        <i class="fas fa-arrow-left me-2"></i>
        <span data-i18n="auth.back">返回登录</span>
      </button>
      <div class="auth-form">
        <div class="form-group">
          <label for="forgot-email" data-i18n="auth.email">注册邮箱</label>
          <input type="email" id="forgot-email" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="forgot-verification-code" data-i18n="auth.verificationCode">验证码</label>
          <div class="verification-code-group">
            <input type="text" id="forgot-verification-code" class="form-control" required>
            <button id="send-reset-code" class="btn btn-outline-secondary" data-i18n="auth.getVerificationCode">获取验证码</button>
          </div>
        </div>
        <button id="verify-code-btn" class="auth-btn" data-i18n="auth.verify">验证</button>
        <div id="forgot-error" class="error-message" style="display: none;"></div>
      </div>
    </div>
  `,

  // 重置密码页面
  'reset-password': `
    <div class="auth-container">
      <h1 class="page-title" data-i18n="auth.resetPassword">重置密码</h1>
      <div class="auth-form">
        <div class="form-group">
          <label for="reset-new-password" data-i18n="auth.newPassword">新密码</label>
          <input type="password" id="reset-new-password" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="reset-confirm-password" data-i18n="auth.confirmPassword">确认密码</label>
          <input type="password" id="reset-confirm-password" class="form-control" required>
        </div>
        <button id="reset-password-btn" class="auth-btn" data-i18n="auth.resetPassword">重置密码</button>
        <div id="reset-error" class="error-message" style="display: none;"></div>
      </div>
    </div>
  `,

// 用户设置页面
'user-settings': `
  <div class="user-settings-container">
    <div class="settings-header">
      <h1 class="settings-title">
        <i class="fas fa-user-cog"></i>
        <span data-i18n="userSettings.title">用户设置</span>
      </h1>
    </div>
    
    <div class="settings-content">
      <!-- 用户概览卡片 -->
      <div class="user-overview-card">
        <div class="user-overview-bg"></div>
        <div class="user-overview-content">
          <div class="user-avatar-section">
            <div class="avatar-wrapper">
              <img id="settings-avatar" class="user-avatar-display" src="" alt="用户头像">
              <div class="avatar-upload-overlay">
                <i class="fas fa-camera"></i>
              </div>
            </div>
            <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
          </div>
          
          <div class="user-info-summary">
            <h2 id="settings-username" class="user-display-name"></h2>
            <p id="settings-email" class="user-email"></p>
            <div class="user-badges">
              <span class="badge-uid">UID: <span id="settings-uid"></span></span>
              <span id="settings-user-state"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 头像裁剪模态框 -->
      <div id="avatar-crop-section" class="avatar-crop-modal" style="display: none;">
        <div class="crop-modal-content">
          <h3 data-i18n="userSettings.adjustAvatar">调整头像</h3>
          <div id="avatar-crop-container" class="crop-container"></div>
          <div class="crop-actions">
            <button id="cancel-avatar-btn" class="btn-secondary">
              <i class="fas fa-times"></i> <span data-i18n="common.cancel">取消</span>
            </button>
            <button id="save-avatar-btn" class="btn-primary">
              <i class="fas fa-check"></i> <span data-i18n="common.save">保存</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 设置选项卡 -->
      <div class="settings-tabs">
        <div class="tab-nav">
          <button class="tab-btn active" data-tab="profile">
            <i class="fas fa-user"></i>
            <span data-i18n="userSettings.profile">个人信息</span>
          </button>
          <button class="tab-btn" data-tab="points">
            <i class="fas fa-coins"></i>
            <span data-i18n="userSettings.pointsInfo">积分信息</span>
          </button>
          <button class="tab-btn" data-tab="security">
            <i class="fas fa-shield-alt"></i>
            <span data-i18n="userSettings.security">安全设置</span>
          </button>
          <button class="tab-btn" data-tab="binding">
            <i class="fas fa-link"></i>
            <span data-i18n="userSettings.binding">绑定管理</span>
          </button>
          <button class="tab-btn" data-tab="privacy">
            <i class="fas fa-user-shield"></i>
            <span data-i18n="userSettings.privacy">隐私设置</span>
          </button>
        </div>

        <!-- 个人信息选项卡 -->
        <div class="tab-content active" id="profile-tab">
          <div class="settings-card">
            <div class="card-header">
              <h3><i class="fas fa-id-card"></i> <span data-i18n="userSettings.basicInfo">基本信息</span></h3>
            </div>
            <div class="card-body">
              <div class="info-row">
                <label data-i18n="userSettings.username">用户名</label>
                <div class="info-value" id="settings-username-display"></div>
              </div>
              <div class="info-row">
                <label data-i18n="userSettings.email">邮箱</label>
                <div class="info-value" id="settings-email-display"></div>
              </div>
              <div class="form-group">
                <label for="settings-nickname" data-i18n="userSettings.setNickname">
                  设置昵称
                </label>
                <div class="input-wrapper">
                  <input type="text" id="settings-nickname" class="form-input" maxlength="20" data-i18n="userSettings.nicknamePlaceholder" placeholder="设置您的昵称">
                  <span class="char-counter"><span id="settings-nickname-counter">0</span>/20</span>
                </div>
              </div>
              <button id="save-profile-btn" class="btn-primary btn-block">
                <i class="fas fa-save"></i> <span data-i18n="userSettings.saveProfile">保存个人信息</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 积分信息选项卡 -->
        <div class="tab-content" id="points-tab">
          <div class="settings-card">
            <div class="card-header">
              <h3><i class="fas fa-chart-line"></i> <span data-i18n="userSettings.pointsStats">积分统计</span></h3>
            </div>
            <div class="card-body">
              <div class="points-grid">
                <div class="points-item">
                  <div class="points-icon">
                    <i class="fas fa-star"></i>
                  </div>
                  <div class="points-info">
                    <div class="points-label" data-i18n="userSettings.totalPoints">总积分</div>
                    <div class="points-value" id="settings-total-points">0</div>
                  </div>
                </div>
                <div class="points-item">
                  <div class="points-icon">
                    <i class="fas fa-coins"></i>
                  </div>
                  <div class="points-info">
                    <div class="points-label" data-i18n="userSettings.normalPoints">普通积分</div>
                    <div class="points-value" id="settings-points">0</div>
                  </div>
                </div>
                <div class="points-item">
                  <div class="points-icon">
                    <i class="fas fa-dove"></i>
                  </div>
                  <div class="points-info">
                    <div class="points-label" data-i18n="userSettings.point2">鸽屋积分</div>
                    <div class="points-value" id="settings-point2">0</div>
                  </div>
                </div>
                <div class="points-item">
                  <div class="points-icon">
                    <i class="fas fa-gem"></i>
                  </div>
                  <div class="points-info">
                    <div class="points-label" data-i18n="userSettings.creditPoints">CREDIT点数</div>
                    <div class="points-value" id="settings-credit">0</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 安全设置选项卡 -->
        <div class="tab-content" id="security-tab">
          <div class="settings-card">
            <div class="card-header">
              <h3><i class="fas fa-lock"></i> <span data-i18n="userSettings.changePassword">修改密码</span></h3>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label for="current-password">
                  <i class="fas fa-key"></i> <span data-i18n="userSettings.currentPassword">当前密码</span>
                </label>
                <input type="password" id="current-password" class="form-input" data-i18n="userSettings.currentPasswordPlaceholder" placeholder="请输入当前密码">
              </div>
              <div class="form-group">
                <label for="new-password">
                  <i class="fas fa-lock"></i> <span data-i18n="userSettings.newPassword">新密码</span>
                </label>
                <div class="input-wrapper">
                  <input type="password" id="new-password" class="form-input" maxlength="16" data-i18n="userSettings.newPasswordPlaceholder" placeholder="请输入新密码">
                  <span class="char-counter"><span id="new-password-counter">0</span>/16</span>
                </div>
              </div>
              <div class="form-group">
                <label for="confirm-password">
                  <i class="fas fa-lock"></i> <span data-i18n="userSettings.confirmNewPassword">确认新密码</span>
                </label>
                <input type="password" id="confirm-password" class="form-input" maxlength="16" data-i18n="userSettings.confirmNewPasswordPlaceholder" placeholder="请再次输入新密码">
              </div>
              <button id="save-password-btn" class="btn-primary btn-block">
                <i class="fas fa-save"></i> <span data-i18n="userSettings.updatePassword">更新密码</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 绑定管理选项卡 -->
        <div class="tab-content" id="binding-tab">
          <!-- 查分绑定卡片 -->
          <div class="settings-card" id="ccb-binding-section" style="display: none;">
            <div class="card-header">
              <h3><i class="fas fa-gamepad"></i> <span data-i18n="userSettings.ccbBinding">查分绑定信息</span></h3>
            </div>
            <div class="card-body">
              <div class="binding-info">
                <div class="binding-item">
                  <i class="fas fa-server"></i>
                  <div>
                    <label data-i18n="userSettings.server">服务器</label>
                    <div class="binding-value" id="ccb-server-info">-</div>
                  </div>
                </div>
                <div class="binding-item">
                  <i class="fas fa-microchip"></i>
                  <div>
                    <label>KeyChip</label>
                    <div class="binding-value" id="ccb-keychip-info">-</div>
                  </div>
                </div>
                <div class="binding-item">
                  <i class="fas fa-id-badge"></i>
                  <div>
                    <label data-i18n="userSettings.cardNumber">游戏卡号</label>
                    <div class="binding-value" id="ccb-guid-info">-</div>
                  </div>
                </div>
              </div>
              <button id="ccb-unbind-settings-btn" class="btn-danger btn-block">
                <i class="fas fa-unlink"></i> <span data-i18n="userSettings.unbindCcb">解绑查分信息</span>
              </button>
            </div>
          </div>
          
          <!-- 无查分绑定提示 -->
          <div class="settings-card" id="no-binding-message" style="display: none;">
            <div class="card-body text-center">
              <i class="fas fa-gamepad empty-icon"></i>
              <h4 data-i18n="userSettings.noCcbBinding">暂无查分绑定</h4>
              <p class="text-muted mt-2" data-i18n="userSettings.goToBindHint">前往游戏查分页面进行绑定</p>
              <button class="btn-primary mt-3" onclick="loadPage('ccb')">
                <i class="fas fa-link"></i> <span data-i18n="userSettings.goToBind">前往绑定</span>
              </button>
            </div>
          </div>
          
          <!-- 收货信息卡片 -->
          <div class="settings-card" id="shipping-binding-section" style="display: none;">
            <div class="card-header">
              <h3><i class="fas fa-truck"></i> <span data-i18n="userSettings.shippingInfo">收货绑定信息</span></h3>
            </div>
            <div class="card-body">
              <div class="binding-info">
                <div class="binding-item">
                  <i class="fas fa-user"></i>
                  <div>
                    <label data-i18n="userSettings.recipient">收件人</label>
                    <div class="binding-value" id="shipping-name">-</div>
                  </div>
                </div>
                <div class="binding-item">
                  <i class="fas fa-phone"></i>
                  <div>
                    <label data-i18n="userSettings.phone">联系电话</label>
                    <div class="binding-value" id="shipping-phone">-</div>
                  </div>
                </div>
                <div class="binding-item">
                  <i class="fas fa-map-marker-alt"></i>
                  <div>
                    <label data-i18n="userSettings.address">收货地址</label>
                    <div class="binding-value" id="shipping-address">-</div>
                  </div>
                </div>
                <div class="binding-item">
                  <i class="fas fa-shopping-cart"></i>
                  <div>
                    <label data-i18n="orderEntry.taobaoId">淘宝ID</label>
                    <div class="binding-value" id="shipping-postal-code">-</div>
                  </div>
                </div>
              </div>
              <button id="unbind-shipping-btn" class="btn-danger btn-block">
                <i class="fas fa-unlink"></i> <span data-i18n="userSettings.unbindShipping">解绑收货信息</span>
              </button>
            </div>
          </div>
          
          <!-- 无收货信息提示 -->
          <div class="settings-card" id="no-shipping-message" style="display: none;">
            <div class="card-body text-center">
              <i class="fas fa-box-open empty-icon"></i>
              <h4 data-i18n="userSettings.noShippingBinding">暂无收货绑定</h4>
              <p class="text-muted mt-2" data-i18n="userSettings.needBindingForShop">需要先绑定收货信息才能使用积分商城</p>
              <button id="add-shipping-btn" class="btn-primary mt-3">
                <i class="fas fa-link"></i> <span data-i18n="userSettings.goToBind">前往绑定</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 隐私设置选项卡 -->
        <div class="tab-content" id="privacy-tab">
          <div class="settings-card">
            <div class="card-header">
              <h3><i class="fas fa-user-shield"></i> <span data-i18n="userSettings.privacySettings">隐私设置</span></h3>
            </div>
            <div class="card-body">
              <div class="privacy-option">
                <div class="privacy-option-title">
                  <i class="fas fa-search"></i>
                  <span data-i18n="userSettings.searchBy">允许通过以下方式被搜索</span>
                </div>
                <div class="privacy-checkboxes">
                  <div class="privacy-checkbox">
                    <input type="checkbox" id="search-by-uid" value="uid" checked>
                    <label for="search-by-uid">UID</label>
                  </div>
                  <div class="privacy-checkbox">
                    <input type="checkbox" id="search-by-username" value="username" checked>
                    <label for="search-by-username" data-i18n="userSettings.username">用户名</label>
                  </div>
                  <div class="privacy-checkbox">
                    <input type="checkbox" id="search-by-nickname" value="nickname" checked>
                    <label for="search-by-nickname" data-i18n="auth.nickname">昵称</label>
                  </div>
                </div>
              </div>
              
              <div class="privacy-option">
                <div class="privacy-option-title">
                  <i class="fas fa-envelope"></i>
                  <span data-i18n="userSettings.messageReceive">消息接收设置</span>
                </div>
                <div class="privacy-radio-group">
                  <div class="privacy-radio">
                    <input type="radio" id="msg-all" name="message-privacy" value="all" checked>
                    <label for="msg-all" data-i18n="userSettings.receiveAll">接收所有人的消息</label>
                  </div>
                  <div class="privacy-radio">
                    <input type="radio" id="msg-friends" name="message-privacy" value="friends">
                    <label for="msg-friends" data-i18n="userSettings.receiveFriendsOnly">仅接收好友的消息</label>
                  </div>
                  <div class="privacy-radio">
                    <input type="radio" id="msg-none" name="message-privacy" value="none">
                    <label for="msg-none" data-i18n="userSettings.receiveNone">不接收任何消息</label>
                  </div>
                </div>
              </div>
              
              <button id="save-privacy-btn" class="btn-primary btn-block">
                <i class="fas fa-save"></i> <span data-i18n="userSettings.savePrivacy">保存隐私设置</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`,

    // 每日运势页面
	fortune: `
	  <div class="fortune-container">
		<h1 class="page-title" data-i18n="fortune.title">每日签到</h1>
		<button class="back-button" data-page="home">
		  <i class="fas fa-arrow-left me-2"></i>
		  <span data-i18n="fortune.backHome">返回主页</span>
		</button>
		
		<div class="section fortune-section">
		  <div class="song-cover">
			<img id="cover-img" src="https://oss.am-all.com.cn/asset/img/main/music/dummy.jpg" alt="歌曲封面">
			<!-- 新增签筒动画元素 -->
			<div class="fortune-animation">
			  <img id="kuji-01" class="kuji-img" src="https://oss.am-all.com.cn/asset/img/other/dc/kuji/kuji01.png" alt="签筒">
			  <img id="kuji-02" class="kuji-img" src="https://oss.am-all.com.cn/asset/img/other/dc/kuji/kuji02.png" alt="抽签">
			</div>
		  </div>
		  
		  <div class="song-info">
			<div class="song-id-cat">
			  <div class="song-id">ID: <span id="song-id">？？？</span></div>
			  <div class="song-category" id="song-category">？？？</div>
			</div>
			
			<div class="song-title" id="song-title">？？？</div>
			<div class="song-artist" id="song-artist">？？？</div>
			
			<div class="difficulties">
			  <div class="difficulty-tag lev-bas"><span id="lev-bas"></span></div>
			  <div class="difficulty-tag lev-adv"><span id="lev-adv"></span></div>
			  <div class="difficulty-tag lev-exp"><span id="lev-exp"></span></div>
			  <div class="difficulty-tag lev-mas"><span id="lev-mas"></span></div>
			  <div class="difficulty-tag lev-ult"><span id="lev-ult"></span></div>
			</div>
			
			<!-- 新增吉凶显示 -->
			  <div class="fortune-luck-container">
				<div class="fortune-luck-label" data-i18n="fortune.todayFortune">今日运势</div>
				<div class="fortune-luck-value" id="fortune-luck">？？？</div>
			  </div>
		  </div>
		  
		    <!-- 新增宜不宜部分 -->
			<div class="fortune-recommendation">
			  <div class="recommend-item">
				<div class="recommend-label" data-i18n="fortune.suitable">宜：</div>
				<div id="lucky-action">?</div>
			  </div>
			  <div class="recommend-item">
				<div class="recommend-label" data-i18n="fortune.unsuitable">不宜：</div>
				<div id="unlucky-action">?</div>
			  </div>
			</div>
		  
		  <button id="draw-btn" class="fortune-btn">
			<i class="fas fa-star me-2"></i>
			<span data-i18n="fortune.signin">签到</span>
		  </button>
		  
		  <div id="fortune-hint" class="fortune-hint"></div>
		</div>
	  </div>
	`,


	// 帮助页面
    help: `
      <div class="game-detail">
        <h1 class="page-title" data-i18n="help.title">帮助中心</h1>
        <button class="back-button" data-page="home">
          <i class="fas fa-arrow-left me-2"></i>
          <span data-i18n="help.back">返回</span>
        </button>
        
        <div class="section">
          <div class="help-grid">
            ${[1, 2].map(i => `
              <div class="help-card" data-id="${i}">
                <div class="help-icon">
                  <i class="fas fa-${i === 1 ? 'download' : 'tools'}"></i>
                </div>
                <div class="help-title" data-i18n="help.${i === 1 ? 'downloadGuide' : 'toolsGuide'}">${i === 1 ? '下载指南' : '实用工具指南'}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `,

    'help-detail': `
      <div class="game-detail">
        <h1 class="page-title" id="help-detail-title" data-i18n="help.title">帮助详情</h1>
        <button class="back-button" data-page="help">
          <i class="fas fa-arrow-left me-2"></i>
          <span data-i18n="help.back">返回</span>
        </button>
        
        <div class="section">
          <div id="help-content">
            <!-- 内容将根据主题动态加载 -->
          </div>
        </div>
      </div>
    `,

    // 其他页面模板
    'sdhd-archive': `<div class="game-detail"><span data-i18n="common.loading">准备中...</span></div>`,
    
    // 其他页面
    'data-center': `<div class="section"><h1 data-i18n="dataCenter.title">数据中心</h1><p data-i18n="dataCenter.content">数据中心内容...</p></div>`,

// 设置页面
settings: `
  <div class="settings-container">
    <h1 class="page-title" data-i18n="settings.title">设置</h1>
    <button class="back-button" data-page="home">
      <i class="fas fa-arrow-left me-2"></i>
      <span data-i18n="settings.back">返回</span>
    </button>
    
    <!-- 语言设置卡片 -->
    <div class="setting-card">
      <div class="setting-header">
        <i class="fas fa-language me-2"></i>
        <span data-i18n="settings.language">语言设置</span>
      </div>
      <div class="setting-body">
        <div class="form-group">
          <label for="language-select" data-i18n="settings.interfaceLanguage">界面语言</label>
          <select id="language-select" class="form-control">
            <option value="zh-cn">简体中文</option>
            <option value="en-us">English</option>
            <option value="ja-jp">日本語</option>
          </select>
        </div>
        <div class="setting-item">
          <div>
            <span data-i18n="settings.rememberLanguage">记住语言偏好</span>
            <div class="setting-description" data-i18n="settings.rememberLanguageDesc">下次访问时自动使用您选择的语言</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="remember-language">
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>
    
	<!-- 表情缓存管理卡片 -->
	<div class="setting-card" id="emoji-cache-card">
	  <div class="setting-header">
		<i class="fas fa-database me-2"></i>
		<span data-i18n="settings.emojiCache">表情缓存管理</span>
	  </div>
	  <div class="setting-body">
		<div class="cache-stats">
		  <div class="cache-stat-item">
			<i class="far fa-smile"></i>
			<div>
			  <div class="cache-stat-value" id="cache-emoji-count">0</div>
			  <div class="cache-stat-label" data-i18n="settings.cachedEmoji">已缓存表情</div>
			</div>
		  </div>
		  <div class="cache-stat-item">
			<i class="fas fa-music"></i>
			<div>
			  <div class="cache-stat-value" id="cache-audio-count">0</div>
			  <div class="cache-stat-label" data-i18n="settings.cachedAudio">已缓存音频</div>
			</div>
		  </div>
		  <div class="cache-stat-item">
			<i class="far fa-image"></i>
			<div>
			  <div class="cache-stat-value" id="cache-message-count">0</div>
			  <div class="cache-stat-label" data-i18n="settings.messageImages">消息图片</div>
			</div>
		  </div>
		  <div class="cache-stat-item">
			<i class="fas fa-hdd"></i>
			<div>
			  <div class="cache-stat-value" id="cache-size">0.00 MB</div>
			  <div class="cache-stat-label" data-i18n="settings.cacheSize">缓存大小</div>
			</div>
		  </div>
		</div>
		
		<div class="cache-progress">
		  <div class="ring-progress-container">
			<svg class="ring-progress-svg" viewBox="0 0 140 140">
			  <defs>
				<linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
				  <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
				  <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
				</linearGradient>
			  </defs>
			  <circle class="ring-progress-bg" cx="70" cy="70" r="65"></circle>
			  <circle class="ring-progress-fill" id="ring-progress-fill" cx="70" cy="70" r="65"></circle>
			</svg>
			<div class="ring-progress-text">
			  <span class="ring-progress-percent" id="ring-progress-percent">0%</span>
			  <span class="ring-progress-label" data-i18n="settings.used">已使用</span>
			</div>
		  </div>
		  <div class="cache-progress-info">
			<span id="cache-usage-text">0.00 MB / 500 MB</span>
		  </div>
		</div>
		
		<div class="cache-actions">
		  <button class="settings-btn settings-btn-primary" id="refresh-cache-stats" onclick="handleRefreshCacheStats()">
			<i class="fas fa-sync-alt me-2"></i><span data-i18n="settings.refreshStats">刷新统计</span>
		  </button>
		  <button class="settings-btn settings-btn-warning" id="clean-old-cache" onclick="handleCleanOldCache()">
			<i class="fas fa-broom me-2"></i><span data-i18n="settings.cleanOldCache">清理旧缓存</span>
		  </button>
		  <button class="settings-btn settings-btn-danger" id="clear-all-cache" onclick="handleClearAllCache()">
			<i class="fas fa-trash-alt me-2"></i><span data-i18n="settings.clearAllCache">清空所有缓存</span>
		  </button>
		</div>
		
		<div class="cache-settings">
		  <div class="setting-item">
			<label class="settings-label">
			  <input type="checkbox" id="auto-clean-cache" checked>
			  <span data-i18n="settings.autoCleanCache">自动清理过期缓存</span>
			</label>
		  </div>
		  <div class="setting-item">
			<label class="settings-label">
			  <input type="checkbox" id="preload-emoji" checked>
			  <span data-i18n="settings.preloadEmoji">预加载常用表情和音频</span>
			</label>
		  </div>
		</div>
	  </div>
	</div>
    
    <!-- 鼠标样式设置卡片 -->
    <div class="setting-card" id="cursor-settings-card">
      <div class="setting-header">
        <i class="fas fa-mouse-pointer me-2"></i>
        <span data-i18n="settings.cursorStyle">鼠标样式</span>
      </div>
      <div class="setting-body">
        <!-- 移动端提示 -->
        <div class="cursor-mobile-hint">
          <i class="fas fa-info-circle me-2"></i>
          <span data-i18n="settings.cursorHint">鼠标样式设置仅在桌面设备上生效</span>
        </div>
        
        <div class="setting-description" style="margin-bottom: 15px;" data-i18n="settings.cursorDesc">
          选择您喜欢的鼠标指针样式，让浏览体验更加个性化
        </div>
        
        <!-- 鼠标样式预览容器 -->
        <div id="cursor-preview-container">
          <div class="text-center" style="padding: 20px; color: #999;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>
            <p style="margin-top: 10px;" data-i18n="common.loading">加载中...</p>
          </div>
        </div>
        
        <div class="setting-description" style="margin-top: 15px; font-size: 0.85rem; color: #94a3b8;">
          <i class="fas fa-info-circle me-1"></i>
          <span data-i18n="settings.cursorLoadingHint">提示：自定义鼠标样式需要加载额外资源，首次使用可能需要几秒钟加载</span>
        </div>
      </div>
    </div>
    
    <div class="settings-buttons">
      <button class="save-btn" id="save-settings">
        <i class="fas fa-save me-2"></i>
        <span data-i18n="settings.saveSettings">保存设置</span>
      </button>
    </div>
  </div>
  
  <!-- 页面初始化脚本（仅初始化鼠标设置和调用缓存初始化）-->
  <script>
    // 页面加载后初始化
    setTimeout(function() {
      console.log('初始化设置页面...');
      
      // 初始化鼠标设置
      initCursorSettings();
      
      // 初始化缓存设置（如果函数存在）
      if (typeof window.initCacheSettings === 'function') {
        console.log('调用缓存设置初始化...');
        window.initCacheSettings();
      } else {
        console.warn('缓存管理函数未加载，请确保已引入 cache-manager.js');
      }
      
      // 更新翻译
      if (typeof languageModule !== 'undefined' && languageModule.updateTranslations) {
        languageModule.updateTranslations();
      }
    }, 100);
    
    // 初始化鼠标设置的函数
    function initCursorSettings() {
      const container = document.getElementById('cursor-preview-container');
      if (!container) return;
      
      const currentStyle = localStorage.getItem('cursorStyle') || 'default';
      
      const cursorStyles = {
        default: {
          name: languageModule.t('settings.cursorDefault'),
          description: languageModule.t('settings.cursorDefaultDesc'),
          icon: 'fas fa-mouse-pointer',
          value: 'default'
        },
        custom1: {
          name: languageModule.t('settings.cursorCustom1'),
          description: languageModule.t('settings.cursorCustom1Desc'),
          icon: 'fas fa-circle',
          value: 'custom1'
        },
        custom2: {
          name: languageModule.t('settings.cursorCustom2'),
          description: languageModule.t('settings.cursorCustom2Desc'),
          icon: 'fas fa-heart',
          value: 'custom2'
        }
      };
      
      let html = '<div class="cursor-preview">';
      
      Object.entries(cursorStyles).forEach(([key, style]) => {
        const isActive = key === currentStyle;
        html += \`
          <div class="cursor-option \${isActive ? 'active' : ''}" data-cursor="\${key}">
            <div class="cursor-option-icon">
              <i class="\${style.icon}"></i>
            </div>
            <div class="cursor-option-name">\${style.name}</div>
            <div class="cursor-option-desc">\${style.description}</div>
          </div>
        \`;
      });
      
      html += '</div>';
      container.innerHTML = html;
      
      // 添加点击事件
      container.querySelectorAll('.cursor-option').forEach(option => {
        option.addEventListener('click', function(e) {
          const cursorType = this.dataset.cursor;
          
          document.querySelectorAll('.cursor-option').forEach(opt => {
            opt.classList.remove('active');
          });
          this.classList.add('active');
          
          localStorage.setItem('cursorStyle', cursorType);
          document.body.classList.remove('cursor-default', 'cursor-custom1', 'cursor-custom2');
          document.body.classList.add('cursor-' + cursorType);
          
          if (typeof showSuccessMessage === 'function') {
            const styleName = cursorStyles[cursorType].name;
            showSuccessMessage(languageModule.t('common.success'));
          }
        });
      });
    }
  </script>
`,
	
    // ICF Editor
    icfeditor: `
      <div class="game-detail">
        <div class="d-flex align-items-center">
          <h1 class="page-title me-2">ICF Editor</h1>
          <button id="icf-help-btn" class="btn btn-sm btn-circle btn-outline-secondary">
            <i class="fas fa-question"></i>
          </button>
        </div>
        <button class="back-button" data-page="tools">
          <i class="fas fa-arrow-left me-2"></i>
          <span data-i18n="common.back">返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p data-i18n="common.loading">正在加载ICF编辑器...</p>
          </div>
          <iframe 
            src="icfemain.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p data-i18n="footer.text1">SEGAY FEIWU</p>
          <p data-i18n="footer.text2">1145141919810</p>
        </footer>
      </div>
    `,

    //CHUNITHM 补丁工具主页面
    dllpatcher: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM 补丁工具</h1>
        <button class="back-button" data-page="home">
          <i class="fas fa-arrow-left me-2"></i>
          <span id="back-to-home">返回</span>
        </button>
        
        <div class="section">
          <h2 class="section-title">
            <i class="fas fa-plug"></i>
            <span>请选择游戏</span>
          </h2>
          
          <div class="patcher-container">
            <!-- CHUNITHM -->
            <div class="patcher-card" data-page="chuni">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chuni.png" alt="CHUNITHM">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM
              </div>
            </div>
            
            <!-- CHUNITHM PLUS -->
            <div class="patcher-card" data-page="chuniplus">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chuniplus.jpg" alt="CHUNITHM PLUS">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM PLUS
              </div>
            </div>
            
            <!-- CHUNITHM AIR -->
            <div class="patcher-card" data-page="chuniair">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chuniair.png" alt="CHUNITHM AIR">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM AIR
              </div>
            </div>
            
            <!-- CHUNITHM STAR -->
            <div class="patcher-card" data-page="chunistar">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chunistar.png" alt="CHUNITHM STAR">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM STAR
              </div>
            </div>

            <!-- CHUNITHM AMAZON -->
            <div class="patcher-card" data-page="chuniamazon">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chuniamazon.png" alt="CHUNITHM AMAZON">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM AMAZON
              </div>
            </div>

            <!-- CHUNITHM CRYSTAL -->
            <div class="patcher-card" data-page="chunicrystal">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chunicrystal.png" alt="CHUNITHM CRYSTAL">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM CRYSTAL
              </div>
            </div>

            <!-- CHUNITHM PARADISE -->
            <div class="patcher-card" data-page="chuniparadise">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chuniparadise.png" alt="CHUNITHM PARADISE">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM PARADISE
              </div>
            </div>

            <!-- CHUNITHM NEW -->
            <div class="patcher-card" data-page="chusan">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusan.png" alt="CHUNITHM NEW">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM NEW
              </div>
            </div>

            <!-- CHUNITHM NEW PLUS -->
            <div class="patcher-card" data-page="chusan">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusanplus.png" alt="CHUNITHM NEW PLUS">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM NEW PLUS
              </div>
            </div>

            <!-- CHUNITHM SUN -->
            <div class="patcher-card" data-page="chusansun">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusansun.png" alt="CHUNITHM SUN">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM SUN
              </div>
            </div>

            <!-- CHUNITHM SUN PLUS -->
            <div class="patcher-card" data-page="chusansunplus">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusansunplus.png" alt="CHUNITHM SUN PLUS">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM SUN PLUS
              </div>
            </div>

            <!-- CHUNITHM LUMINOUS -->
            <div class="patcher-card" data-page="chusanlmn">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chulmn.png" alt="CHUNITHM LUMINOUS">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM LUMINOUS
              </div>
            </div>

            <!-- CHUNITHM LUMINOUS PLUS -->
            <div class="patcher-card" data-page="chusanlmnplus">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusan_lmnp.png" alt="CHUNITHM LUMINOUS PLUS">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM LUMINOUS PLUS
              </div>
            </div>

            <!-- CHUNITHM VERSE -->
            <div class="patcher-card" data-page="chusanvrs">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusan_vrs.png" alt="CHUNITHM VERSE">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM VERSE
              </div>
            </div>

            <!-- CHUNITHM X-VERSE -->
            <div class="patcher-card" data-page="chusanxvrs">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusan_xvrs.png" alt="CHUNITHM X-VERSE">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM XVERSE
              </div>
            </div>

            <!-- 中二节奏2025 -->
            <div class="patcher-card" data-page="chusan2025">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusan2025.png" alt="中二节奏2025">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                中二节奏2025
              </div>
            </div>

          </div>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,
    
    // CHUNITHM 页面
    chuni: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chuni.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,
    
    // CHUNITHM PLUS 页面
    chuniplus: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM PLUS 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chuniplus.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,
	
	// CHUNITHM AIR 页面
    chuniair: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM AIR 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chuniair.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

	// CHUNITHM STAR 页面
    chunistar: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM STAR 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chunistar.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

	// CHUNITHM AMAZON 页面
    chuniamazon: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM AMAZON 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chuniamazon.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM CRYSTAL 页面
    chunicrystal: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM CRYSTAL 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chunicrystal.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

	// CHUNITHM PARADISE 页面
    chuniparadise: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM PARADISE 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chuniparadise.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM NEW 页面
    chusan: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM NEW 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusan.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM NEW PLUS 页面
    chusanplus: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM NEW PLUS 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusanplus.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM SUN 页面
    chusansun: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM SUN 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusansun.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM SUN PLUS 页面
    chusansunplus: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM SUN PLUS 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusansunplus.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM LUMINOUS 页面
    chusanlmn: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM LUMINOUS 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusanlmn.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM LUMINOUS PLUS 页面
    chusanlmnplus: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM LUMINOUS PLUS 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusanlmnplus.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM VERSE 页面
    chusanvrs: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM VERSE 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusanvrs.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM X-VERSE 页面
    chusanxvrs: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM X-VERSE 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusanxvrs.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // 中二节奏2025 页面
    chusan2025: `
      <div class="game-detail">
        <h1 class="page-title">中二节奏2025 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusan2025.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,
};

// 页面加载完成后，通知语言模块更新翻译
window.addEventListener('DOMContentLoaded', function() {
    // 确保在任何页面切换后都更新翻译
    window.addEventListener('pageLoaded', function() {
        if (typeof languageModule !== 'undefined' && languageModule.updateTranslations) {
            languageModule.updateTranslations();
        }
    });
});