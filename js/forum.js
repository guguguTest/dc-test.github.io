// forum.js - 论坛功能主模块(完整修复版 + 图片支持 + 楼层编辑)

(function() {
  'use strict';

  const API_BASE = 'https://api.am-all.com.cn/api';
  let currentSection = null;
  let currentPostId = null;
  let currentPostAuthorId = null;
  let postEditor = null;
  let replyEditor = null;
  let currentRepliesCache = []; // 缓存当前帖子的回复列表

  // 初始化论坛
  function initForum() {
    const container = document.getElementById('content-container');
    if (!container) return;

    const token = localStorage.getItem('token');
    if (!token) {
      if (typeof showLoginRequired === 'function') {
        showLoginRequired('forum');
      }
      return;
    }

    showSectionSelection();
  }

  // 显示分区选择界面
  function showSectionSelection() {
    const container = document.getElementById('content-container');
    container.innerHTML = `
      <div class="forum-container">
        <div class="forum-header">
          <h1 class="forum-title">
            <i class="fas fa-comments"></i>
            交流区
          </h1>
          <p class="forum-subtitle">选择一个分区开始交流</p>
        </div>
        
        <div class="section-grid">
          <div class="section-card player" data-section="player">
            <div class="section-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="section-name">玩家交流区</div>
            <div class="section-desc">自由交流游戏心得、分享经验</div>
          </div>
          
          <div class="section-card qa" data-section="qa">
            <div class="section-icon">
              <i class="fas fa-question-circle"></i>
            </div>
            <div class="section-name">问答区</div>
            <div class="section-desc">提问和解答,设置积分悬赏</div>
          </div>
          
          <div class="section-card official" data-section="official">
            <div class="section-icon">
              <i class="fas fa-bullhorn"></i>
            </div>
            <div class="section-name">官方信息发布区</div>
            <div class="section-desc">官方公告和重要信息</div>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.section-card').forEach(card => {
      card.addEventListener('click', function() {
        const section = this.dataset.section;
        loadSection(section);
      });
    });
  }

  // 加载分区内容
  async function loadSection(section) {
    currentSection = section;
    const container = document.getElementById('content-container');
    
    const sectionNames = {
      player: '玩家交流区',
      qa: '问答区',
      official: '官方信息发布区'
    };

    container.innerHTML = `
      <div class="forum-container">
        <div class="forum-header">
          <h1 class="forum-title">
            <i class="fas fa-arrow-left" style="cursor: pointer; font-size: 20px;" onclick="window.ForumModule.showSections()"></i>
            ${sectionNames[section]}
          </h1>
        </div>
        
        <div class="forum-toolbar">
          <div class="toolbar-left">
            <div class="forum-search">
              <i class="fas fa-search"></i>
              <input type="text" id="forum-search-input" placeholder="搜索帖子...">
            </div>
          </div>
          <div class="toolbar-right">
            <button class="forum-btn forum-btn-secondary" onclick="window.ForumModule.refreshPosts()">
              <i class="fas fa-sync-alt"></i>
              刷新
            </button>
            <button class="forum-btn forum-btn-secondary" onclick="window.ForumModule.markAllRead()">
              <i class="fas fa-check-double"></i>
              全部已读
            </button>
            <button class="forum-btn forum-btn-primary" onclick="window.ForumModule.showNewPostModal()">
              <i class="fas fa-plus-circle"></i>
              发布主题
            </button>
          </div>
        </div>
        
        <div class="post-list" id="post-list-container">
          <div class="forum-loading">
            <div class="forum-spinner"></div>
          </div>
        </div>
      </div>
    `;

    await loadPosts();

    const searchInput = document.getElementById('forum-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        loadPosts(searchInput.value);
      }, 500));
    }
  }

  // 加载帖子列表
  async function loadPosts(keyword = '') {
    const token = localStorage.getItem('token');
    const container = document.getElementById('post-list-container');
    
    try {
      const url = `${API_BASE}/forum/${currentSection}/posts?keyword=${encodeURIComponent(keyword)}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('加载失败');
      
      const data = await response.json();
      renderPosts(data.posts);
    } catch (error) {
      console.error('加载帖子失败:', error);
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>加载失败,请刷新重试</p>
        </div>
      `;
    }
  }

  // 渲染帖子列表
  function renderPosts(posts) {
    const container = document.getElementById('post-list-container');
    
    if (!posts || posts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>暂无帖子</p>
        </div>
      `;
      return;
    }

    let html = '';
    posts.forEach(post => {
      const pinLevel = post.pin_level || 0;
      const statusBadge = getStatusBadge(post);
      const isUnread = post.is_unread;
      
      let pinBadge = '';
      if (pinLevel === 2) {
        pinBadge = '<i class="fas fa-crown" style="color: #ef4444; margin-right: 8px;" title="超级置顶"></i>';
      } else if (pinLevel === 1) {
        pinBadge = '<i class="fas fa-thumbtack" style="color: #f59e0b; margin-right: 8px;" title="普通置顶"></i>';
      }
      
      html += `
        <div class="post-item ${pinLevel > 0 ? 'post-pinned' : ''} ${isUnread ? 'post-unread' : ''}" onclick="window.ForumModule.viewPost(${post.id})">
          <img src="${post.avatar || 'https://api.am-all.com.cn/avatars/default_avatar.png'}" class="post-avatar" alt="avatar">
          
          <div class="post-info">
            <div class="post-title-row">
              ${isUnread ? '<span class="unread-indicator"></span>' : ''}
              ${pinBadge}
              <span class="post-title ${isUnread ? 'post-title-unread' : ''}">${escapeHtml(post.title)}</span>
              ${post.tag_name ? `<span class="post-tag" style="background: ${post.tag_color}; color: ${post.text_color};">${post.tag_name}</span>` : ''}
              ${statusBadge}
            </div>
            <div class="post-meta">
              <span>${post.author_name}</span>
              <span>•</span>
              <span>${formatTime(post.created_at)}</span>
            </div>
          </div>
          
          <div class="post-stat">
            <i class="fas fa-eye"></i>
            ${post.view_count || 0}
          </div>
          
          <div class="post-stat">
            <i class="fas fa-comment"></i>
            ${post.reply_count || 0}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // 获取状态徽章
  function getStatusBadge(post) {
    if (currentSection !== 'qa') return '';
    
    if (post.is_solved) {
      return '<span class="post-status solved"><i class="fas fa-check-circle"></i> 已解决</span>';
    } else if (post.is_closed) {
      return '<span class="post-status closed"><i class="fas fa-times-circle"></i> 未解决</span>';
    } else {
      return '<span class="post-status pending"><i class="fas fa-clock"></i> 寻求解答中</span>';
    }
  }

  // 显示发帖模态框
  async function showNewPostModal() {
    const token = localStorage.getItem('token');
    let tags = [];
    
    try {
      const response = await fetch(`${API_BASE}/forum/tags?section=${currentSection}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        tags = await response.json();
      }
    } catch (error) {
      console.error('加载标签失败:', error);
    }

    const modal = document.createElement('div');
    modal.className = 'forum-modal show';
    modal.id = 'new-post-modal';
    
    const isQA = currentSection === 'qa';
    
    modal.innerHTML = `
      <div class="forum-modal-content">
        <div class="forum-modal-header">
          <h3 class="forum-modal-title">
            <i class="fas fa-edit"></i>
            发布新主题
          </h3>
          <button class="forum-modal-close" onclick="window.ForumModule.closeModal('new-post-modal')">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="forum-modal-body">
          <div class="forum-form-group">
            <label class="forum-form-label">帖子标题 *</label>
            <input type="text" class="forum-form-input" id="post-title" placeholder="请输入帖子标题" maxlength="100">
          </div>
          
          <div class="forum-form-group">
            <label class="forum-form-label">帖子分类</label>
            <select class="forum-form-select" id="post-tag">
              <option value="">请选择分类</option>
              ${tags.map(tag => `<option value="${tag.id}">${tag.tag_name}</option>`).join('')}
            </select>
          </div>
          
          ${isQA ? `
            <div class="forum-form-group">
              <label class="forum-form-label">悬赏设置</label>
              <div class="reward-inputs">
                <div>
                  <label>普通积分</label>
                  <input type="number" class="forum-form-input" id="reward-points" min="0" value="0" placeholder="0">
                </div>
                <div>
                  <label>CREDIT</label>
                  <input type="number" class="forum-form-input" id="reward-credit" min="0" value="0" placeholder="0">
                </div>
              </div>
            </div>
          ` : ''}
          
          <div class="forum-form-group">
            <label class="forum-form-label">帖子内容 *</label>
            <div class="forum-editor" id="post-editor">
              <div class="editor-toolbar"></div>
              <div class="editor-content" data-placeholder="请输入帖子内容..."></div>
            </div>
          </div>
        </div>
        
        <div class="forum-modal-footer">
          <button class="forum-btn forum-btn-secondary" onclick="window.ForumModule.closeModal('new-post-modal')">
            取消
          </button>
          <button class="forum-btn forum-btn-primary" onclick="window.ForumModule.submitPost()">
            <i class="fas fa-paper-plane"></i>
            发布
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    const editorContainer = document.getElementById('post-editor');
    postEditor = new ForumEditor(editorContainer);
  }

  // 提交帖子
  async function submitPost() {
    const title = document.getElementById('post-title').value.trim();
    const tagId = document.getElementById('post-tag').value;
    const content = postEditor.getContent();
    
    if (!title) {
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('请输入帖子标题');
      }
      return;
    }
    
    if (postEditor.isEmpty()) {
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('请输入帖子内容');
      }
      return;
    }

    const postData = {
      title,
      tag_id: tagId || null,
      content
    };

    if (currentSection === 'qa') {
      const rewardPoints = parseInt(document.getElementById('reward-points').value) || 0;
      const rewardCredit = parseInt(document.getElementById('reward-credit').value) || 0;
      
      postData.reward_points = rewardPoints;
      postData.reward_credit = rewardCredit;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/forum/${currentSection}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '发布失败');
      }

      closeModal('new-post-modal');
      
      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage('发布成功!');
      }
      
      await loadPosts();
    } catch (error) {
      console.error('发布帖子失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage(error.message);
      }
    }
  }

  // 编辑帖子
  async function editPost(postId) {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE}/forum/posts/${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('加载失败');
      
      const data = await response.json();
      showEditPostModal(data.post);
    } catch (error) {
      console.error('加载帖子失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('加载帖子失败');
      }
    }
  }

  // 显示编辑帖子模态框
  async function showEditPostModal(post) {
    const token = localStorage.getItem('token');
    let tags = [];
    
    try {
      const response = await fetch(`${API_BASE}/forum/tags?section=${currentSection}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        tags = await response.json();
      }
    } catch (error) {
      console.error('加载标签失败:', error);
    }

    const modal = document.createElement('div');
    modal.className = 'forum-modal show';
    modal.id = 'edit-post-modal';
    
    modal.innerHTML = `
      <div class="forum-modal-content">
        <div class="forum-modal-header">
          <h3 class="forum-modal-title">
            <i class="fas fa-edit"></i>
            编辑帖子
          </h3>
          <button class="forum-modal-close" onclick="window.ForumModule.closeModal('edit-post-modal')">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="forum-modal-body">
          <div class="forum-form-group">
            <label class="forum-form-label">帖子标题 *</label>
            <input type="text" class="forum-form-input" id="edit-post-title" value="${escapeHtml(post.title)}" maxlength="100">
          </div>
          
          <div class="forum-form-group">
            <label class="forum-form-label">帖子分类</label>
            <select class="forum-form-select" id="edit-post-tag">
              <option value="">请选择分类</option>
              ${tags.map(tag => `<option value="${tag.id}" ${tag.id == post.tag_id ? 'selected' : ''}>${tag.tag_name}</option>`).join('')}
            </select>
          </div>
          
          <div class="forum-form-group">
            <label class="forum-form-label">帖子内容 *</label>
            <div class="forum-editor" id="edit-post-editor">
              <div class="editor-toolbar"></div>
              <div class="editor-content" data-placeholder="请输入帖子内容..."></div>
            </div>
          </div>
        </div>
        
        <div class="forum-modal-footer">
          <button class="forum-btn forum-btn-secondary" onclick="window.ForumModule.closeModal('edit-post-modal')">
            取消
          </button>
          <button class="forum-btn forum-btn-primary" onclick="window.ForumModule.updatePost(${post.id})">
            <i class="fas fa-save"></i>
            保存
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    const editorContainer = document.getElementById('edit-post-editor');
    postEditor = new ForumEditor(editorContainer);
    postEditor.setContent(post.content);
  }

  // 更新帖子
  async function updatePost(postId) {
    const title = document.getElementById('edit-post-title').value.trim();
    const tagId = document.getElementById('edit-post-tag').value;
    const content = postEditor.getContent();
    
    if (!title) {
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('请输入帖子标题');
      }
      return;
    }
    
    if (postEditor.isEmpty()) {
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('请输入帖子内容');
      }
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/forum/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          tag_id: tagId || null,
          content
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '更新失败');
      }

      closeModal('edit-post-modal');
      
      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage('更新成功!');
      }
      
      await viewPost(postId);
    } catch (error) {
      console.error('更新帖子失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage(error.message);
      }
    }
  }

  // 查看帖子详情
  async function viewPost(postId) {
    currentPostId = postId;
    const token = localStorage.getItem('token');
    const container = document.getElementById('content-container');

    container.innerHTML = `
      <div class="forum-container">
        <div class="forum-loading">
          <div class="forum-spinner"></div>
        </div>
      </div>
    `;

    try {
      const response = await fetch(`${API_BASE}/forum/posts/${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('加载失败');
      
      const data = await response.json();
      renderPostDetail(data.post, data.replies);
    } catch (error) {
      console.error('加载帖子详情失败:', error);
      container.innerHTML = `
        <div class="forum-container">
          <div class="empty-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>加载失败,请返回重试</p>
          </div>
        </div>
      `;
    }
  }

  // 渲染帖子详情
  function renderPostDetail(post, replies) {
    const container = document.getElementById('content-container');
    const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const isAuthor = currentUser.id === post.user_id;
    const isAdmin = currentUser.user_rank >= 5;
    const canEdit = isAuthor || isAdmin;
    
    currentPostAuthorId = post.user_id;
    
    const isQA = currentSection === 'qa';
    const statusBadge = getStatusBadge(post);
    const pinLevel = post.pin_level || 0;
    
    let pinBadge = '';
    if (pinLevel === 2) {
      pinBadge = '<span class="post-pin-badge super-pin"><i class="fas fa-crown"></i> 超级置顶</span>';
    } else if (pinLevel === 1) {
      pinBadge = '<span class="post-pin-badge normal-pin"><i class="fas fa-thumbtack"></i> 普通置顶</span>';
    }

    let html = `
      <div class="forum-container">
        <div class="forum-header" style="margin-bottom: 20px;">
          <button class="forum-btn forum-btn-secondary" onclick="window.ForumModule.backToList()">
            <i class="fas fa-arrow-left"></i>
            返回列表
          </button>
        </div>

        <div class="post-detail-header">
          <div class="post-detail-title">${escapeHtml(post.title)}</div>
          <div class="post-detail-meta">
            ${post.tag_name ? `<span class="post-tag" style="background: ${post.tag_color}; color: ${post.text_color};">${post.tag_name}</span>` : ''}
            ${pinBadge}
            ${statusBadge}
            <span><i class="fas fa-eye"></i> ${post.view_count || 0} 浏览</span>
            <span><i class="fas fa-comment"></i> ${post.reply_count || 0} 回复</span>
            <span><i class="fas fa-clock"></i> ${formatTime(post.created_at)}</span>
          </div>
          
          ${isQA && (post.reward_points > 0 || post.reward_credit > 0) ? `
            <div class="post-detail-reward">
              <i class="fas fa-gift"></i>
              <span>悬赏: ${post.reward_points > 0 ? `${post.reward_points}积分` : ''} ${post.reward_credit > 0 ? `${post.reward_credit}CREDIT` : ''}</span>
            </div>
          ` : ''}
          
          <div class="post-detail-toolbar">
            ${canEdit ? `
              <button class="forum-btn forum-btn-secondary forum-btn-sm" onclick="window.ForumModule.editPost(${post.id})">
                <i class="fas fa-edit"></i> 编辑
              </button>
              <button class="forum-btn forum-btn-danger forum-btn-sm" onclick="window.ForumModule.deletePost(${post.id})">
                <i class="fas fa-trash"></i> 删除
              </button>
            ` : ''}
            ${isAdmin ? `
              <button class="forum-btn forum-btn-warning forum-btn-sm" onclick="window.ForumModule.showPinMenu(${post.id}, ${pinLevel})">
                <i class="fas fa-thumbtack"></i> 置顶管理
              </button>
            ` : ''}
            ${isQA && isAuthor && !post.is_closed && !post.is_solved ? `
              <button class="forum-btn forum-btn-warning forum-btn-sm" onclick="window.ForumModule.closePost(${post.id})">
                <i class="fas fa-times-circle"></i> 结贴(未解决)
              </button>
            ` : ''}
          </div>
        </div>

        <div class="reply-list" id="reply-list">
			<!-- 楼主帖子 -->
			<div class="reply-item" id="floor-0">
			  <div class="reply-author">
				<!-- 头像容器,添加光环和认证图标 -->
				<div class="reply-author-avatar-container" style="position: relative; display: inline-block;">
				  <img src="${post.avatar || 'https://api.am-all.com.cn/avatars/default_avatar.png'}" class="reply-author-avatar" alt="avatar">
				  
				  <!-- 彩虹光环特效 (rankSp === 1) -->
				  ${post.rankSp === 1 ? '<div class="avatar-effect-rainbow-forum"></div>' : ''}
				  
				  <!-- 账户认证图标 (右下角) -->
				  ${post.account_auth === 1 ? `
					<img src="https://oss.am-all.com.cn/asset/img/other/dc/account/account_auth_1.png" 
						 class="forum-auth-icon" 
						 title="个人认证" 
						 alt="个人认证">
				  ` : ''}
				  ${post.account_auth === 2 ? `
					<img src="https://oss.am-all.com.cn/asset/img/other/dc/account/account_auth_2.png" 
						 class="forum-auth-icon" 
						 title="官方认证" 
						 alt="官方认证">
				  ` : ''}
				</div>
				
				<div class="reply-author-name">${escapeHtml(post.author_name)}</div>
				<div class="reply-author-rank">${getUserRankText(post.user_rank)}</div>
				
				<!-- 特殊用户组显示 -->
				${post.rankSp === 1 ? `
				  <div class="reply-author-badge special-rank">
					<i class="fas fa-crown"></i> 特殊用户组
				  </div>
				` : ''}
			  </div>
			  <div class="reply-content-wrapper">
				<div class="reply-meta">
				  <span class="reply-floor op">楼主</span>
				  <span>${formatTime(post.created_at)}</span>
				</div>
				<div class="reply-content">${processContent(post.content)}</div>
			  </div>
			</div>
        </div>

        ${!post.is_closed ? `
          <div class="reply-input-area">
            <div class="reply-input-title">
              <i class="fas fa-reply"></i>
              发表回复
              <span style="color: #9ca3af; font-size: 13px; font-weight: normal; margin-left: 12px;">提示: 使用 @用户名 来提醒其他用户</span>
            </div>
            <div class="forum-editor" id="reply-editor">
              <div class="editor-toolbar"></div>
              <div class="editor-content" data-placeholder="请输入回复内容... (使用 @用户名 来提醒其他用户)"></div>
            </div>
            <div style="margin-top: 16px; text-align: right;">
              <button class="forum-btn forum-btn-primary" onclick="window.ForumModule.submitReply()">
                <i class="fas fa-paper-plane"></i>
                发布回复
              </button>
            </div>
          </div>
        ` : `
          <div class="post-closed-notice">
            <i class="fas fa-lock"></i>
            <span>该帖已结贴,无法继续回复</span>
          </div>
        `}

        <button class="back-to-top" id="back-to-top" onclick="window.ForumModule.scrollToTop()">
          <i class="fas fa-arrow-up"></i>
        </button>
      </div>
    `;

    container.innerHTML = html;

    if (!post.is_closed) {
      const editorContainer = document.getElementById('reply-editor');
      replyEditor = new ForumEditor(editorContainer);
    }

    renderReplies(replies, post);

    const backToTop = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        backToTop.classList.add('show');
      } else {
        backToTop.classList.remove('show');
      }
    });
  }

  // 渲染回复列表
  function renderReplies(replies, post) {
    const container = document.getElementById('reply-list');
    const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const isAdmin = currentUser.user_rank >= 5;
    const isQA = currentSection === 'qa';
    const isPostAuthor = currentUser.id === currentPostAuthorId;
    const postClosed = post.is_closed;
    const postSolved = post.is_solved;

    // 缓存回复列表供编辑使用
    currentRepliesCache = replies;

    replies.forEach(reply => {
      const isAuthor = currentUser.id === reply.user_id;
      const canEdit = isAuthor || isAdmin;
      const canDelete = isAuthor || isAdmin;
      const isAccepted = reply.id === post.accepted_reply_id;
      const canAccept = isQA && isPostAuthor && !postClosed && !postSolved && !isAccepted;

		const replyHtml = `
		  <div class="reply-item ${isAccepted ? 'reply-accepted' : ''}" id="floor-${reply.floor_number}">
			<div class="reply-author">
			  <!-- 头像容器,添加光环和认证图标 -->
			  <div class="reply-author-avatar-container" style="position: relative; display: inline-block;">
				<img src="${reply.avatar || 'https://api.am-all.com.cn/avatars/default_avatar.png'}" class="reply-author-avatar" alt="avatar">
				
				<!-- 彩虹光环特效 (rankSp === 1) -->
				${reply.rankSp === 1 ? '<div class="avatar-effect-rainbow-forum"></div>' : ''}
				
				<!-- 账户认证图标 (右下角) -->
				${reply.account_auth === 1 ? `
				  <img src="https://oss.am-all.com.cn/asset/img/other/dc/account/account_auth_1.png" 
					   class="forum-auth-icon" 
					   title="个人认证" 
					   alt="个人认证">
				` : ''}
				${reply.account_auth === 2 ? `
				  <img src="https://oss.am-all.com.cn/asset/img/other/dc/account/account_auth_2.png" 
					   class="forum-auth-icon" 
					   title="官方认证" 
					   alt="官方认证">
				` : ''}
			  </div>
			  
			  <div class="reply-author-name">${escapeHtml(reply.author_name)}</div>
			  <div class="reply-author-rank">${getUserRankText(reply.user_rank)}</div>
			  
			  <!-- 特殊用户组显示 -->
			  ${reply.rankSp === 1 ? `
				<div class="reply-author-badge special-rank">
				  <i class="fas fa-crown"></i> 特殊用户组
				</div>
			  ` : ''}
			  
			  ${isAccepted ? '<div class="reply-author-badge accepted"><i class="fas fa-check-circle"></i> 已采纳</div>' : ''}
			</div>
			<div class="reply-content-wrapper">
			  <div class="reply-meta">
				<span class="reply-floor">#${reply.floor_number}</span>
				<span>${formatTime(reply.created_at)}</span>
			  </div>
			  <div class="reply-content">${processContent(reply.content)}</div>
			  ${(canEdit || canDelete || canAccept) ? `
				<div class="reply-actions">
				  ${canAccept ? `
					<button class="forum-btn forum-btn-success forum-btn-sm" onclick="window.ForumModule.acceptReply(${reply.id})">
					  <i class="fas fa-check-circle"></i> 采纳答案
					</button>
				  ` : ''}
				  ${canEdit ? `
					<button class="forum-btn forum-btn-secondary forum-btn-sm" onclick="window.ForumModule.editReply(${reply.id})">
					  <i class="fas fa-edit"></i> 编辑
					</button>
				  ` : ''}
				  ${canDelete ? `
					<button class="forum-btn forum-btn-danger forum-btn-sm" onclick="window.ForumModule.deleteReply(${reply.id})">
					  <i class="fas fa-trash"></i> 删除
					</button>
				  ` : ''}
				</div>
			  ` : ''}
			</div>
		  </div>
		`;

      container.insertAdjacentHTML('beforeend', replyHtml);
    });
  }

  // 提交回复
  async function submitReply() {
    if (replyEditor.isEmpty()) {
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('请输入回复内容');
      }
      return;
    }

    const content = replyEditor.getContent();
    const token = localStorage.getItem('token');

    const mentionedUsers = extractMentions(content);

    try {
      const response = await fetch(`${API_BASE}/forum/posts/${currentPostId}/replies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          content,
          mentioned_users: mentionedUsers
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '回复失败');
      }

      replyEditor.clear();
      
      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage('回复成功!');
      }
      
      await viewPost(currentPostId);
    } catch (error) {
      console.error('回复失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage(error.message);
      }
    }
  }

  // 编辑回复
  async function editReply(replyId) {
    // 从缓存中查找回复数据
    const reply = currentRepliesCache.find(r => r.id === replyId);
    
    if (!reply) {
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('未找到回复数据');
      }
      return;
    }
    
    showEditReplyModal(reply);
  }

  // 显示编辑回复模态框
  async function showEditReplyModal(reply) {
    const modal = document.createElement('div');
    modal.className = 'forum-modal show';
    modal.id = 'edit-reply-modal';
    
    modal.innerHTML = `
      <div class="forum-modal-content">
        <div class="forum-modal-header">
          <h3 class="forum-modal-title">
            <i class="fas fa-edit"></i>
            编辑回复
          </h3>
          <button class="forum-modal-close" onclick="window.ForumModule.closeModal('edit-reply-modal')">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="forum-modal-body">
          <div class="forum-form-group">
            <label class="forum-form-label">回复内容 *</label>
            <div class="forum-editor" id="edit-reply-editor">
              <div class="editor-toolbar"></div>
              <div class="editor-content" data-placeholder="请输入回复内容..."></div>
            </div>
          </div>
        </div>
        
        <div class="forum-modal-footer">
          <button class="forum-btn forum-btn-secondary" onclick="window.ForumModule.closeModal('edit-reply-modal')">
            取消
          </button>
          <button class="forum-btn forum-btn-primary" onclick="window.ForumModule.updateReply(${reply.id})">
            <i class="fas fa-save"></i>
            保存
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    const editorContainer = document.getElementById('edit-reply-editor');
    replyEditor = new ForumEditor(editorContainer);
    replyEditor.setContent(reply.content);
  }

  // 更新回复
  async function updateReply(replyId) {
    const content = replyEditor.getContent();
    
    if (replyEditor.isEmpty()) {
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('请输入回复内容');
      }
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/forum/replies/${replyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '更新失败');
      }

      closeModal('edit-reply-modal');
      
      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage('更新成功!');
      }
      
      await viewPost(currentPostId);
    } catch (error) {
      console.error('更新回复失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage(error.message);
      }
    }
  }

  // 提取@用户
  function extractMentions(content) {
    const mentionRegex = /@([^\s@]+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }

  // 处理内容,高亮@用户、表情和图片
  function processContent(content) {
    if (!content) return '';
    
    console.log('=== processContent Debug ===');
    console.log('Input:', content);
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    let decodedContent = tempDiv.innerHTML;
    
    console.log('Decoded:', decodedContent);
    
    // 处理表情标记
    const emojiRegex = /\[emoji:(\d+):((?:https?:)?\/[^\]]+?)(?::([^\]]+?))?\]/g;
    
    let hasEmoji = false;
    let processedContent = decodedContent.replace(emojiRegex, function(match, emojiId, imagePath, audioPath) {
      hasEmoji = true;
      console.log('Found emoji:', { match, emojiId, imagePath, audioPath });
      
      imagePath = imagePath.trim();
      const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
      const fullImagePath = imagePath.startsWith('http') ? imagePath : `${API_BASE_URL}${imagePath}`;
      
      console.log('Image URL:', fullImagePath);
      
      let audioAttr = '';
      if (audioPath) {
        audioPath = audioPath.trim();
        const fullAudioPath = audioPath.startsWith('http') ? audioPath : `${API_BASE_URL}${audioPath}`;
        audioAttr = `data-audio-path="${fullAudioPath}" onclick="if(window.playEmojiAudio) window.playEmojiAudio('${fullAudioPath}')" style="cursor: pointer;"`;
        console.log('Audio URL:', fullAudioPath);
      }
      
      const emojiHtml = `<img src="${fullImagePath}" class="emoji-message-img" ${audioAttr} style="max-width: 120px; max-height: 120px; vertical-align: middle; border-radius: 8px; margin: 0 4px;" alt="表情">`;
      
      console.log('Generated HTML:', emojiHtml);
      
      return emojiHtml;
    });
    
    if (hasEmoji) {
      console.log('After emoji processing:', processedContent);
    }
    
    // 处理图片标记
    const imageRegex = /\[image:(\/[^\]]+?)\]/g;
    
    let hasImage = false;
    processedContent = processedContent.replace(imageRegex, function(match, imagePath) {
      hasImage = true;
      console.log('Found image:', { match, imagePath });
      
      const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
      const fullImagePath = `${API_BASE_URL}${imagePath}`;
      
      console.log('Full image URL:', fullImagePath);
      
      // 生成可点击放大的图片HTML
      const imageHtml = `<img src="${fullImagePath}" 
                             class="forum-uploaded-image" 
                             data-original-src="${fullImagePath}"
                             onclick="if(window.showForumImagePreview) window.showForumImagePreview('${fullImagePath}')"
                             style="max-width: 50%; height: auto; display: inline-block; margin: 4px; border-radius: 8px; cursor: pointer; vertical-align: middle;" 
                             alt="图片">`;
      
      console.log('Generated image HTML:', imageHtml);
      
      return imageHtml;
    });
    
    if (hasImage) {
      console.log('After image processing:', processedContent);
    }
    
    // 处理@mention功能
    processedContent = processedContent.replace(
      /@([^\s@<]+)(?![^<]*>)/g,
      function(match, username) {
        return `<span class="mention" data-username="${username}">@${username}</span>`;
      }
    );
    
    console.log('Final output:', processedContent);
    console.log('=== End processContent Debug ===');
    
    return processedContent;
  }

  // 全局图片预览函数
  window.showForumImagePreview = function(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'image-preview-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s;
    `;
    
    const isMobile = window.innerWidth <= 768;
    
    modal.innerHTML = `
      <div class="preview-container" style="position: relative; max-width: 90%; max-height: 90%; ${isMobile ? 'touch-action: pan-x pan-y pinch-zoom;' : ''}">
        <img src="${imageUrl}" style="max-width: 100%; max-height: 90vh; object-fit: contain; display: block; border-radius: 8px;">
        <button class="preview-close" style="position: absolute; top: -40px; right: 0; background: rgba(255,255,255,0.2); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 20px;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    const closeBtn = modal.querySelector('.preview-close');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // 移动端支持手势缩放
    if (isMobile) {
      const img = modal.querySelector('img');
      let scale = 1;
      let lastDistance = 0;
      
      img.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          lastDistance = Math.hypot(
            e.touches[0].pageX - e.touches[1].pageX,
            e.touches[0].pageY - e.touches[1].pageY
          );
        }
      });
      
      img.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
          e.preventDefault();
          const distance = Math.hypot(
            e.touches[0].pageX - e.touches[1].pageX,
            e.touches[0].pageY - e.touches[1].pageY
          );
          
          const delta = distance - lastDistance;
          scale += delta * 0.01;
          scale = Math.max(0.5, Math.min(scale, 3));
          
          img.style.transform = `scale(${scale})`;
          lastDistance = distance;
        }
      });
    }
    
    document.body.appendChild(modal);
  };

  // 采纳答案
  async function acceptReply(replyId) {
    if (!confirm('确定采纳此答案吗?采纳后将结贴并发放悬赏。')) {
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE}/forum/posts/${currentPostId}/accept/${replyId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '采纳失败');
      }

      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage('答案已采纳!');
      }
      
      await viewPost(currentPostId);
    } catch (error) {
      console.error('采纳答案失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage(error.message);
      }
    }
  }

  // 结贴
  async function closePost(postId) {
    if (!confirm('确定结贴吗?结贴后将无法继续回复,悬赏金将退回。')) {
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE}/forum/posts/${postId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '结贴失败');
      }

      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage('已结贴!');
      }
      
      await viewPost(postId);
    } catch (error) {
      console.error('结贴失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage(error.message);
      }
    }
  }

  // 显示置顶菜单
  async function showPinMenu(postId, currentPinLevel) {
    const menuHtml = `
      <div class="forum-modal show" id="pin-menu-modal">
        <div class="forum-modal-content" style="max-width: 400px;">
          <div class="forum-modal-header">
            <h3 class="forum-modal-title">
              <i class="fas fa-thumbtack"></i>
              置顶管理
            </h3>
            <button class="forum-modal-close" onclick="window.ForumModule.closeModal('pin-menu-modal')">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="forum-modal-body">
            <p style="margin-bottom: 20px; color: #6b7280;">当前置顶状态: ${currentPinLevel === 2 ? '超级置顶' : currentPinLevel === 1 ? '普通置顶' : '未置顶'}</p>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <button class="forum-btn forum-btn-danger" onclick="window.ForumModule.setPinLevel(${postId}, 2)" ${currentPinLevel === 2 ? 'disabled' : ''}>
                <i class="fas fa-crown"></i> 设为超级置顶
              </button>
              <button class="forum-btn forum-btn-warning" onclick="window.ForumModule.setPinLevel(${postId}, 1)" ${currentPinLevel === 1 ? 'disabled' : ''}>
                <i class="fas fa-thumbtack"></i> 设为普通置顶
              </button>
              <button class="forum-btn forum-btn-secondary" onclick="window.ForumModule.setPinLevel(${postId}, 0)" ${currentPinLevel === 0 ? 'disabled' : ''}>
                <i class="fas fa-times"></i> 取消置顶
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', menuHtml);
  }

  // 设置置顶级别
  async function setPinLevel(postId, pinLevel) {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE}/forum/posts/${postId}/pin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pin_level: pinLevel })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '设置失败');
      }
      
      closeModal('pin-menu-modal');
      
      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage(result.message);
      }
      
      await viewPost(postId);
    } catch (error) {
      console.error('设置置顶失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage(error.message);
      }
    }
  }

  // 删除回复
  async function deleteReply(replyId) {
    if (!confirm('确定删除此回复吗?')) {
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE}/forum/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '删除失败');
      }

      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage('回复已删除!');
      }
      
      await viewPost(currentPostId);
    } catch (error) {
      console.error('删除回复失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage(error.message);
      }
    }
  }

  // 删除帖子
  async function deletePost(postId) {
    if (!confirm('确定删除此帖子吗?')) {
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE}/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '删除失败');
      }

      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage('帖子已删除!');
      }
      
      backToList();
    } catch (error) {
      console.error('删除帖子失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage(error.message);
      }
    }
  }

  // 返回列表
  function backToList() {
    loadSection(currentSection);
  }

  // 滚动到顶部
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 关闭模态框
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    }
  }

  // 刷新帖子列表
  function refreshPosts() {
    loadPosts();
  }

  // 全部已读
  async function markAllRead() {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE}/forum/${currentSection}/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        if (typeof showSuccessMessage === 'function') {
          showSuccessMessage('已标记为已读');
        }
        
        await loadPosts();
      } else {
        const result = await response.json();
        throw new Error(result.error || '标记失败');
      }
    } catch (error) {
      console.error('标记已读失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage(error.message || '标记失败');
      }
    }
  }

  // 工具函数
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
    if (diff < 2592000) return Math.floor(diff / 86400) + '天前';

    return date.toLocaleDateString();
  }

  function getUserRankText(rank) {
    const ranks = {
      0: '普通用户',
      1: '初级用户',
      2: '中级用户',
      3: '高级用户',
      4: '贵宾用户',
      5: '管理员'
    };
    return ranks[rank] || '普通用户';
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // 暴露到全局
  window.ForumModule = {
    init: initForum,
    showSections: showSectionSelection,
    loadSection,
    showNewPostModal,
    submitPost,
    editPost,
    updatePost,
    viewPost,
    submitReply,
    editReply,
    updateReply,
    acceptReply,
    closePost,
    deleteReply,
    deletePost,
    backToList,
    scrollToTop,
    closeModal,
    refreshPosts,
    markAllRead,
    showPinMenu,
    setPinLevel
  };
})();