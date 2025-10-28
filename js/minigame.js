// js/minigame.js - 小游戏系统前端代码

// 游戏配置
const MINIGAMES = {
  irodori: {
    id: 'irodori',
    name: 'IRODORIMIDORI FANTASY VII (强化版)',
    url: 'https://irodori.am-all.com.cn',
    description: 'イロドリミドリ2024年愚人节小游戏',
    icon: 'https://oss.am-all.com.cn/asset/img/other/dc/mgame/icon.png'
  },
  irodori2025: {
    id: 'irodori2025',
    name: 'IRODORIMIDORI FANTASY VII INTERNATIONAL',
    url: 'https://irodori2025.am-all.com.cn',
    description: 'イロドリミドリ2025年愚人节小游戏',
    icon: 'https://oss.am-all.com.cn/asset/img/other/dc/mgame/icon.png'
  }
};

// 渲染小游戏入口页面
async function renderMinigamePage() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return `
        <div class="minigame-container">
          <div class="alert alert-warning">
            <i class="fas fa-lock"></i> 请先登录以访问小游戏
          </div>
        </div>
      `;
    }

    // 检查权限
    const response = await secureFetch('https://api.am-all.com.cn/api/page-visibility/minigame', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.visible) {
      return `
        <div class="minigame-container">
          <div class="alert alert-warning">
            <i class="fas fa-lock"></i> 您没有权限访问小游戏
          </div>
        </div>
      `;
    }

    return `
      <div class="minigame-container">
        <div class="minigame-header">
          <h2><i class="fas fa-gamepad"></i> 迷你游戏</h2>
          <p class="minigame-subtitle">选择游戏开始挑战,刷新您的最佳成绩!</p>
        </div>

        <!-- 游戏卡片 -->
        <div class="minigame-grid">
          ${Object.values(MINIGAMES).map(game => `
            <div class="minigame-card" data-game-id="${game.id}">
              <div class="minigame-card-icon">
                <img src="${game.icon}" alt="${game.name}" style="width: 64px; height: 64px; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <span style="display: none; font-size: 4rem;">🎮</span>
              </div>
              <div class="minigame-card-content">
                <h3 class="minigame-card-title">${game.name}</h3>
                <p class="minigame-card-desc">${game.description}</p>
                <button class="btn-minigame-play" onclick="playMinigame('${game.id}')">
                  <i class="fas fa-play"></i> 开始游戏
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- 排行榜规则说明 -->
        <div class="leaderboard-rules-notice">
          <div class="rules-header">
            <i class="fas fa-info-circle"></i> 排行榜规则
          </div>
          <div class="rules-content">
            <p><strong>🏆 奖励规则：</strong>每月1日0点系统将自动清空排行榜并按排名发放奖励</p>
            <ul class="rules-list">
              <li><span class="rank-badge-mini gold">🥇 1位</span><strong>10 CREDIT</strong></li>
              <li><span class="rank-badge-mini silver">🥈 2位</span><strong>100 积分</strong></li>
              <li><span class="rank-badge-mini bronze">🥉 3位</span><strong>50 积分</strong></li>
              <li><span class="rank-badge-mini top10">4-10位</span><strong>25 积分</strong></li>
              <li><span class="rank-badge-mini top50">11-50位</span><strong>10 积分</strong></li>
              <li><span class="rank-badge-mini participant">51位~</span><strong>5 积分</strong></li>
            </ul>
            <p class="rules-note">
              <i class="fas fa-exclamation-circle"></i> 排名基于您在本月内提交的最高分数
            </p>
          </div>
        </div>

        <!-- 排行榜切换标签 -->
        <div class="minigame-tabs">
          <button class="minigame-tab active" data-game="irodori" onclick="switchLeaderboard('irodori')">
            ${MINIGAMES.irodori.name} 排行榜
          </button>
          <button class="minigame-tab" data-game="irodori2025" onclick="switchLeaderboard('irodori2025')">
            ${MINIGAMES.irodori2025.name} 排行榜
          </button>
        </div>

        <!-- 排行榜容器 -->
        <div class="minigame-leaderboard-container">
          <div class="minigame-leaderboard" id="leaderboard-irodori">
            <div class="loading">
              <i class="fas fa-spinner fa-spin"></i> 加载中...
            </div>
          </div>
          <div class="minigame-leaderboard" id="leaderboard-irodori2025" style="display: none;">
            <div class="loading">
              <i class="fas fa-spinner fa-spin"></i> 加载中...
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('渲染迷你游戏页面失败:', error);
    return `
      <div class="minigame-container">
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i> 加载失败: ${error.message}
        </div>
      </div>
    `;
  }
}

// 初始化小游戏页面
async function initMinigamePage() {
  // 加载两个游戏的排行榜
  await loadLeaderboard('irodori');
  await loadLeaderboard('irodori2025');
}

// 切换排行榜
function switchLeaderboard(gameId) {
  // 更新标签状态
  document.querySelectorAll('.minigame-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`.minigame-tab[data-game="${gameId}"]`).classList.add('active');

  // 切换排行榜显示
  document.querySelectorAll('.minigame-leaderboard').forEach(board => {
    board.style.display = 'none';
  });
  document.getElementById(`leaderboard-${gameId}`).style.display = 'block';
}

// 加载排行榜
async function loadLeaderboard(gameId) {
  const container = document.getElementById(`leaderboard-${gameId}`);
  if (!container) return;

  try {
    const token = localStorage.getItem('token');
    const response = await secureFetch(
      `https://api.am-all.com.cn/api/minigame/leaderboard/${gameId}?limit=50`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!response.success) {
      throw new Error(response.error || '加载失败');
    }

    // 渲染排行榜
    container.innerHTML = renderLeaderboard(gameId, response);
  } catch (error) {
    console.error(`加载${gameId}排行榜失败:`, error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i> 加载失败: ${error.message}
      </div>
    `;
  }
}

// 渲染排行榜
function renderLeaderboard(gameId, data) {
  const { leaderboard, userBest, total } = data;

  let html = '<div class="leaderboard-content">';

  // 用户个人最佳成绩
  if (userBest) {
    html += `
      <div class="user-best-score">
        <div class="best-score-header">
          <i class="fas fa-trophy"></i> MY BEST SCORE
        </div>
        <div class="best-score-body">
          <div class="best-score-item">
            <span class="label">排名:</span>
            <span class="value rank-${getRankClass(userBest.ranking)}">${userBest.ranking}位</span>
          </div>
          <div class="best-score-item">
            <span class="label">总分:</span>
            <span class="value highlight">${userBest.total_score.toLocaleString()}</span>
          </div>
          <div class="best-score-item">
            <span class="label">评价:</span>
            <span class="value rank-badge ${getRankBadgeClass(userBest.rank)}">${userBest.rank || '-'}</span>
          </div>
          <div class="best-score-item">
            <span class="label">游戏时间:</span>
            <span class="value">${userBest.play_time_minutes}:${String(userBest.play_time_seconds).padStart(2, '0')}</span>
          </div>
        </div>
        <button class="btn-view-history" onclick="viewUserHistory('${gameId}')">
          <i class="fas fa-history"></i> 查看历史记录
        </button>
      </div>
    `;
  }

  // 排行榜表格
  html += `
    <div class="leaderboard-table-container">
      <div class="leaderboard-header">
        <h3><i class="fas fa-medal"></i> 全站排行榜</h3>
        <span class="total-count">共 ${total} 位玩家</span>
      </div>
      <div class="leaderboard-table-wrapper">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>玩家</th>
              <th>评价</th>
              <th>总分</th>
              <th>游戏时间</th>
              <th>回合数</th>
              <th>提交时间</th>
            </tr>
          </thead>
          <tbody>
  `;

  if (leaderboard && leaderboard.length > 0) {
    leaderboard.forEach(score => {
      const rankClass = getRankClass(score.ranking);
      const displayName = score.nickname || score.username;
      html += `
        <tr class="${rankClass}">
          <td class="rank-cell">
            ${score.ranking <= 3 ? getMedalIcon(score.ranking) : `#${score.ranking}`}
          </td>
          <td class="player-cell">
            <span class="player-name">${escapeHtml(displayName)}</span>
          </td>
          <td class="rank-badge ${getRankBadgeClass(score.rank)}">${score.rank || '-'}</td>
          <td class="score-cell">${score.total_score.toLocaleString()}</td>
          <td>${score.play_time_minutes}:${String(score.play_time_seconds).padStart(2, '0')}</td>
          <td>${score.turn_count || '-'}</td>
          <td class="time-cell">${formatDate(score.created_at)}</td>
        </tr>
      `;
    });
  } else {
    html += `
      <tr>
        <td colspan="7" class="empty-message">
          <i class="fas fa-inbox"></i> 暂无排行榜数据
        </td>
      </tr>
    `;
  }

  html += `
        </tbody>
      </table>
      </div>
    </div>
  </div>
  `;

  return html;
}

// 获取等级样式类
function getRankClass(ranking) {
  if (ranking === 1) return 'rank-1';
  if (ranking === 2) return 'rank-2';
  if (ranking === 3) return 'rank-3';
  if (ranking <= 10) return 'rank-top10';
  return '';
}

// 获取等级徽章的CSS类名
function getRankBadgeClass(rank) {
  if (!rank) return '';
  const rankUpper = rank.toUpperCase();
  if (rankUpper === 'SSS+') return 'rank-sss-plus';
  if (rankUpper === 'SSS') return 'rank-sss';
  if (rankUpper === 'SS') return 'rank-ss';
  if (rankUpper === 'S') return 'rank-s';
  if (rankUpper === 'A') return 'rank-a';
  if (rankUpper === 'B') return 'rank-b';
  if (rankUpper === 'C') return 'rank-c';
  return '';
}

// 获取奖牌图标
function getMedalIcon(ranking) {
  const medals = {
    1: '<i class="fas fa-trophy" style="color: #FFD700;"></i>',
    2: '<i class="fas fa-trophy" style="color: #C0C0C0;"></i>',
    3: '<i class="fas fa-trophy" style="color: #CD7F32;"></i>'
  };
  return medals[ranking] || `#${ranking}`;
}

// 格式化日期
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// HTML转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ✅ 修复后的开始游戏函数
function playMinigame(gameId) {
  const game = MINIGAMES[gameId];
  if (!game) {
    console.error('游戏不存在:', gameId);
    return;
  }

  console.log('开始游戏:', gameId, game);

  // 保存当前游戏ID到sessionStorage,供minigame-play页面使用
  sessionStorage.setItem('currentGameId', gameId);
  
  // 导航到游戏iframe页面
  if (typeof window.loadPage === 'function') {
    window.loadPage('minigame-play');
  } else {
    console.error('loadPage function not found');
  }
}

// ✅ 修复后的渲染游戏iframe页面函数
function renderMinigamePlayPage(params) {
  // 优先从params获取gameId,如果没有则从sessionStorage获取
  let gameId = params?.gameId;
  
  if (!gameId) {
    gameId = sessionStorage.getItem('currentGameId');
  }
  
  console.log('渲染游戏页面,gameId:', gameId);
  
  const game = MINIGAMES[gameId];
  
  if (!game) {
    return `
      <div class="minigame-container">
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i> 游戏不存在 (ID: ${gameId || '未知'})
        </div>
        <button class="btn btn-primary" onclick="window.loadPage('minigame')">
          <i class="fas fa-arrow-left"></i> 返回游戏列表
        </button>
      </div>
    `;
  }

  return `
    <div class="minigame-play-container">
      <div class="minigame-play-header">
        <button class="btn-back" onclick="window.loadPage('minigame')">
          <i class="fas fa-arrow-left"></i> 返回
        </button>
        <h2>${game.name}</h2>
      </div>
      <div class="minigame-iframe-wrapper">
        <iframe 
          id="minigame-iframe"
          src="${game.url}" 
          frameborder="0"
          allowfullscreen
          class="minigame-iframe"
          onload="console.log('游戏框架加载完成')"
          onerror="console.error('游戏框架加载失败')"
        ></iframe>
      </div>
    </div>
  `;
}

// 查看用户历史记录
async function viewUserHistory(gameId) {
  try {
    const token = localStorage.getItem('token');
    const response = await secureFetch(
      `https://api.am-all.com.cn/api/minigame/user-history/${gameId}?limit=20`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!response.success) {
      throw new Error(response.error || '加载失败');
    }

    // 显示历史记录模态框
    showHistoryModal(gameId, response);
  } catch (error) {
    console.error('加载历史记录失败:', error);
    showAlert('加载历史记录失败: ' + error.message, 'error');
  }
}

// 显示历史记录模态框
function showHistoryModal(gameId, data) {
  const { history, stats } = data;
  const game = MINIGAMES[gameId];

  let modalHTML = `
    <div class="minigame-modal" id="history-modal">
      <div class="minigame-modal-content">
        <div class="minigame-modal-header">
          <h3><i class="fas fa-history"></i> ${game.name} - 游戏历史</h3>
          <button class="minigame-modal-close" onclick="closeHistoryModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="minigame-modal-body">
          <!-- 统计信息 -->
          <div class="history-stats">
            <div class="stat-item">
              <span class="stat-label">游戏次数</span>
              <span class="stat-value">${stats.play_count}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最高分</span>
              <span class="stat-value highlight">${stats.best_score ? stats.best_score.toLocaleString() : '-'}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均分</span>
              <span class="stat-value">${stats.avg_score ? Math.round(stats.avg_score).toLocaleString() : '-'}</span>
            </div>
          </div>

          <!-- 历史记录表格 -->
          <div class="history-table-container">
            <table class="history-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>等级</th>
                  <th>总分</th>
                  <th>游戏时间</th>
                  <th>回合数</th>
                  <th>提交时间</th>
                </tr>
              </thead>
              <tbody>
  `;

  if (history && history.length > 0) {
    history.forEach((record, index) => {
      const isBest = record.total_score === stats.best_score;
      modalHTML += `
        <tr class="${isBest ? 'best-record' : ''}">
          <td>${index + 1}</td>
          <td class="rank-badge ${getRankBadgeClass(record.rank)}">${record.rank || '-'}</td>
          <td class="score-cell">
            ${record.total_score.toLocaleString()}
            ${isBest ? '<i class="fas fa-crown" title="最佳成绩"></i>' : ''}
          </td>
          <td>${record.play_time_minutes}:${String(record.play_time_seconds).padStart(2, '0')}</td>
          <td>${record.turn_count || '-'}</td>
          <td class="time-cell">${new Date(record.created_at).toLocaleString('zh-CN')}</td>
        </tr>
      `;
    });
  } else {
    modalHTML += `
      <tr>
        <td colspan="6" class="empty-message">暂无游戏记录</td>
      </tr>
    `;
  }

  modalHTML += `
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  // 添加到页面
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // 显示模态框
  setTimeout(() => {
    document.getElementById('history-modal').classList.add('show');
  }, 10);

  // 点击背景关闭
  document.getElementById('history-modal').addEventListener('click', (e) => {
    if (e.target.id === 'history-modal') {
      closeHistoryModal();
    }
  });
}

// 关闭历史记录模态框
function closeHistoryModal() {
  const modal = document.getElementById('history-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
}

// 提交游戏成绩(供游戏调用)
async function submitMinigameScore(gameId, scoreData) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('请先登录');
    }

    const response = await secureFetch('https://api.am-all.com.cn/api/minigame/submit-score', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gameId,
        ...scoreData
      })
    });

    if (!response.success) {
      throw new Error(response.error || '提交失败');
    }

    return response;
  } catch (error) {
    console.error('提交成绩失败:', error);
    throw error;
  }
}

// 导出给全局使用
window.renderMinigamePage = renderMinigamePage;
window.initMinigamePage = initMinigamePage;
window.renderMinigamePlayPage = renderMinigamePlayPage;
window.playMinigame = playMinigame;
window.switchLeaderboard = switchLeaderboard;
window.viewUserHistory = viewUserHistory;
window.closeHistoryModal = closeHistoryModal;
window.submitMinigameScore = submitMinigameScore;
window.MINIGAMES = MINIGAMES; // 导出游戏配置供其他模块使用
