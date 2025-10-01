// fortune.js - 每日运势独立模块
(function() {
  'use strict';
  
  const MUSIC_DATA_URLS = [
    'https://oss.am-all.com.cn/asset/img/main/data/music.json',
  ];
  
  const LUCK_TEXTS = ['大凶', '凶', '末吉', '吉', '小吉', '中吉', '大吉', '特大吉'];
  
  let songList = [];
  let isInitialized = false;
  
  // 初始化运势页面
  async function initFortunePage() {
    if (isInitialized) return;
    isInitialized = true;
    
    console.log('初始化运势页面...');
    
    // 显示加载状态
    showLoadingState();
    
    try {
      // 加载歌曲数据
      await loadMusicData();
      
      // 检查并显示运势状态
      await checkFortuneStatus();
      
      // 设置抽取按钮事件
      setupDrawButton();
      
    } catch (error) {
      console.error('初始化运势页面失败:', error);
      showErrorState('初始化失败，请刷新页面重试');
    }
  }
  
  // 显示加载状态
  function showLoadingState() {
    const coverImg = document.getElementById('cover-img');
    const songIdEl = document.getElementById('song-id');
    const songTitleEl = document.getElementById('song-title');
    const songArtistEl = document.getElementById('song-artist');
    const fortuneLuckEl = document.getElementById('fortune-luck');
    const fortuneHint = document.getElementById('fortune-hint');
    
    if (coverImg) coverImg.src = 'https://oss.am-all.com.cn/asset/img/main/music/dummy.jpg';
    if (songIdEl) songIdEl.textContent = '加载中...';
    if (songTitleEl) songTitleEl.textContent = '正在获取运势数据...';
    if (songArtistEl) songArtistEl.textContent = '请稍候';
    if (fortuneLuckEl) fortuneLuckEl.textContent = '...';
    if (fortuneHint) fortuneHint.textContent = '正在加载...';
  }
  
  // 显示错误状态
  function showErrorState(message) {
    const fortuneHint = document.getElementById('fortune-hint');
    if (fortuneHint) {
      fortuneHint.textContent = message;
      fortuneHint.style.color = '#e74c3c';
    }
  }
  
  // 加载歌曲数据
  async function loadMusicData() {
    for (const url of MUSIC_DATA_URLS) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const data = await response.json();
        
        if (Array.isArray(data)) {
          songList = data;
        } else if (data.songs && Array.isArray(data.songs)) {
          songList = data.songs;
        } else {
          console.error('无效的音乐数据格式:', data);
          continue;
        }
        
        console.log('成功加载歌曲数据:', songList.length, '首歌曲');
        return;
      } catch (e) {
        console.log(`从 ${url} 加载数据失败`, e);
        continue;
      }
    }
    
    // 如果所有数据源都失败，使用备用数据
    songList = [{
      id: '001',
      title: '备用歌曲',
      artist: '系统',
      catname: 'ORIGINAL',
      lev_bas: '3',
      lev_adv: '5',
      lev_exp: '7',
      lev_mas: '9',
      lev_ult: '12',
      image: 'dummy.jpg'
    }];
    console.warn('使用备用歌曲数据');
  }
  
  // 检查运势状态
  async function checkFortuneStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
      showErrorState('请先登录');
      return;
    }
    
    try {
      const response = await fetch('https://api.am-all.com.cn/api/fortune/last-draw', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('运势状态数据:', data);
      
      const drawBtn = document.getElementById('draw-btn');
      const fortuneHint = document.getElementById('fortune-hint');
      
      if (data.canDraw) {
        // 可以抽取
        if (drawBtn) {
          drawBtn.disabled = false;
          drawBtn.innerHTML = '<i class="fas fa-star me-2"></i>抽取今日运势';
        }
        if (fortuneHint) {
          fortuneHint.textContent = '今日运势待抽取';
          fortuneHint.style.color = '#667eea';
        }
        
        // 显示占位符
        displayDummyFortune();
      } else {
        // 已经抽取过，显示上次抽取的结果
        if (data.lastFortune) {
          console.log('显示上次抽取结果:', data.lastFortune);
          
          // 解析song_data（可能是JSON字符串）
          let songData = data.lastFortune.song_data;
          if (typeof songData === 'string') {
            try {
              songData = JSON.parse(songData);
            } catch (e) {
              console.error('解析歌曲数据失败:', e);
            }
          }
          
          // 解析recommendations
          let recommendations = data.lastFortune.recommendations;
          if (typeof recommendations === 'string') {
            try {
              recommendations = JSON.parse(recommendations);
            } catch (e) {
              console.error('解析推荐数据失败:', e);
            }
          }
          
          displayFortune(
            songData,
            data.lastFortune.luck,
            recommendations
          );
          
          // 显示历史获得的积分
          if (data.lastFortune.points_earned && window.currentUser) {
            const totalPoints = (window.currentUser.points || 0) + (window.currentUser.point2 || 0);
            if (fortuneHint) {
              fortuneHint.textContent = `昨日获得 ${data.lastFortune.points_earned} 积分，当前积分: ${totalPoints}`;
              fortuneHint.style.color = '#7f8c8d';
            }
          }
        } else {
          // 没有历史数据，显示占位符
          displayDummyFortune();
        }
        
        if (drawBtn) {
          drawBtn.disabled = true;
          drawBtn.innerHTML = '<i class="fas fa-check me-2"></i>今日已抽取';
        }
        
        if (fortuneHint && !data.lastFortune) {
          if (data.nextDrawTime) {
            const nextDraw = new Date(data.nextDrawTime);
            const now = new Date();
            const hoursLeft = Math.ceil((nextDraw - now) / (1000 * 60 * 60));
            fortuneHint.textContent = `今日运势已抽取，${hoursLeft}小时后可再次抽取`;
          } else {
            fortuneHint.textContent = `今日运势已抽取，请明天再来`;
          }
        }
      }
    } catch (error) {
      console.error('检查运势抽取状态失败:', error);
      showErrorState('无法获取抽取状态，请稍后重试');
      
      // 显示占位符作为后备
      displayDummyFortune();
    }
  }
  
  // 显示占位符运势
  function displayDummyFortune() {
    const dummySong = {
      id: '???',
      title: '???',
      artist: '???',
      catname: '???',
      lev_bas: '?',
      lev_adv: '?',
      lev_exp: '?',
      lev_mas: '?',
      lev_ult: '?'
    };
    
    updateDisplay(dummySong, '???', {lucky: '?', unlucky: '?'});
  }
  
  // 显示运势结果
  function displayFortune(song, luck, recommendations) {
    console.log('displayFortune 被调用:', { song, luck, recommendations });
    
    // 确保封面图片显示，动画隐藏
    const coverImg = document.getElementById('cover-img');
    const animationContainer = document.querySelector('.fortune-animation');
    
    if (coverImg) {
      coverImg.style.display = 'block';
      const imagePath = song && song.image ? song.image : 'dummy.jpg';
      coverImg.src = `https://oss.am-all.com.cn/asset/img/main/music/${imagePath}`;
      console.log('设置封面图片:', coverImg.src);
    }
    
    if (animationContainer) {
      animationContainer.style.display = 'none';
    }
    
    const displaySong = song || {
      id: '???',
      title: '???',
      artist: '???',
      catname: '???',
      lev_bas: '?',
      lev_adv: '?',
      lev_exp: '?',
      lev_mas: '?',
      lev_ult: '?'
    };
    
    updateDisplay(displaySong, luck, recommendations);
  }
  
  // 更新显示
  function updateDisplay(song, luck, recommendations) {
    console.log('updateDisplay 被调用:', { song, luck, recommendations });
    
    const difficultiesContainer = document.querySelector('.difficulties');
    const coverImg = document.getElementById('cover-img');
    const songIdEl = document.getElementById('song-id');
    const songTitleEl = document.getElementById('song-title');
    const songArtistEl = document.getElementById('song-artist');
    const songCategoryEl = document.getElementById('song-category');
    const fortuneLuckEl = document.getElementById('fortune-luck');
    const luckyActionEl = document.getElementById('lucky-action');
    const unluckyActionEl = document.getElementById('unlucky-action');
    
    if (!song) return;
    
    // 更新吉凶显示
    if (fortuneLuckEl && luck) {
      fortuneLuckEl.textContent = luck;
    }
    
    // 更新宜不宜显示
    if (luckyActionEl && recommendations?.lucky) {
      luckyActionEl.textContent = recommendations.lucky;
    }
    
    if (unluckyActionEl && recommendations?.unlucky) {
      unluckyActionEl.textContent = recommendations.unlucky;
    }
    
    if (difficultiesContainer) {
      difficultiesContainer.innerHTML = '';
    }
    
    if (coverImg) {
      coverImg.src = song.image ? 
        `https://oss.am-all.com.cn/asset/img/main/music/${song.image}` : 
        'https://oss.am-all.com.cn/asset/img/main/music/dummy.jpg';
    }
    if (songIdEl) songIdEl.textContent = song.id || '???';
    if (songTitleEl) songTitleEl.textContent = song.title || '???';
    if (songArtistEl) songArtistEl.textContent = song.artist || '???';
    
    const isDummy = song.id === '???';
    
    if (songCategoryEl) {
      if (isDummy) {
        songCategoryEl.textContent = '???';
        songCategoryEl.className = 'song-category cat-dummy';
      } else if (song.catname) {
        songCategoryEl.textContent = song.catname;
        songCategoryEl.className = 'song-category ' + getCategoryClass(song.catname);
      } else {
        songCategoryEl.textContent = '???';
        songCategoryEl.className = 'song-category';
      }
    }
    
    const isWorldsEndSong = song.we_kanji || song.we_star;
    
    if (isWorldsEndSong && !isDummy) {
      if (song.we_kanji || song.we_star) {
        const weDiv = document.createElement('div');
        weDiv.className = 'difficulty-tag lev-we';
        weDiv.textContent = 'World\'s End: ';
        
        if (song.we_kanji) {
          weDiv.textContent += song.we_kanji;
        }
        
        if (song.we_star) {
          const starsContainer = document.createElement('span');
          starsContainer.className = 'we-stars';
          
          const starCount = parseInt(song.we_star);
          const starDisplayCount = Math.ceil(starCount / 2);
          
          for (let i = 0; i < starDisplayCount; i++) {
            const star = document.createElement('i');
            star.className = 'fas fa-star star';
            starsContainer.appendChild(star);
          }
          
          weDiv.appendChild(starsContainer);
        }
        
        if (difficultiesContainer) {
          difficultiesContainer.appendChild(weDiv);
        }
      }
    } else {
      // 添加普通难度标签
      const difficulties = [
        { level: 'bas', label: 'BASIC', value: song.lev_bas },
        { level: 'adv', label: 'ADVANCE', value: song.lev_adv },
        { level: 'exp', label: 'EXPERT', value: song.lev_exp },
        { level: 'mas', label: 'MASTER', value: song.lev_mas },
        { level: 'ult', label: 'ULTIMA', value: song.lev_ult }
      ];
      
      difficulties.forEach(diff => {
        if (diff.value || isDummy) {
          const div = document.createElement('div');
          div.className = `difficulty-tag lev-${diff.level}`;
          div.setAttribute('data-level', diff.label);
          const span = document.createElement('span');
          span.textContent = isDummy ? '?' : diff.value;
          div.appendChild(span);
          if (difficultiesContainer) difficultiesContainer.appendChild(div);
        }
      });
    }
  }
  
  // 获取分类样式
  function getCategoryClass(catname) {
    const categoryMap = {
      'POPS & ANIME': 'cat-pops',
      'niconico': 'cat-nico',
      '东方Project': 'cat-touhou',
      'VARIETY': 'cat-variety',
      'イロドリミドリ': 'cat-irodori',
      'ゲキマイ': 'cat-gekimai',
      'ORIGINAL': 'cat-original'
    };
    return categoryMap[catname] || '';
  }
  
  // 设置抽取按钮
  function setupDrawButton() {
    const drawBtn = document.getElementById('draw-btn');
    if (!drawBtn) return;
    
    // 移除旧的事件监听器
    const newBtn = drawBtn.cloneNode(true);
    drawBtn.parentNode.replaceChild(newBtn, drawBtn);
    
    newBtn.addEventListener('click', handleDraw);
  }
  
  // 处理抽取
  async function handleDraw() {
    const drawBtn = document.getElementById('draw-btn');
    const fortuneHint = document.getElementById('fortune-hint');
    
    if (!drawBtn) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('请先登录');
      }
      return;
    }
    
    drawBtn.disabled = true;
    drawBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>抽取中...';
    if (fortuneHint) fortuneHint.textContent = '';
    
    // 隐藏封面，显示动画
    const coverImg = document.getElementById('cover-img');
    const animationContainer = document.querySelector('.fortune-animation');
    const kuji01 = document.querySelector('#kuji-01');
    const kuji02 = document.querySelector('#kuji-02');
    
    if (coverImg) {
      coverImg.style.display = 'none';
    }
    
    if (animationContainer) {
      animationContainer.style.display = 'flex';
      if (kuji01) {
        kuji01.style.display = 'block';
        kuji01.classList.add('kuji-swing');
      }
      if (kuji02) {
        kuji02.style.display = 'none';
        kuji02.classList.remove('kuji-fadein');
      }
    }
    
    // 滚动动画
    setTimeout(() => {
      let scrollCount = 0;
      const scrollInterval = setInterval(() => {
        if (songList.length === 0) {
          clearInterval(scrollInterval);
          return;
        }
        
        const tempSong = songList[Math.floor(Math.random() * songList.length)];
        updateDisplay(tempSong, '???', {lucky: '?', unlucky: '?'});
        scrollCount++;
        
        if (scrollCount > 30) {
          clearInterval(scrollInterval);
          performDraw(token);
        }
      }, 100);
    }, 500);
  }
  
  // 执行抽取API调用
  async function performDraw(token) {
    try {
      const response = await fetch('https://api.am-all.com.cn/api/fortune/draw', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        displayFortune(data.song, data.luck, data.recommendations);
        
        // 显示获得的积分信息
        if (data.pointsEarned) {
          const fortuneHint = document.getElementById('fortune-hint');
          if (fortuneHint) {
            const totalPoints = data.points + (data.point2 || 0);
            fortuneHint.textContent = `恭喜获得 ${data.pointsEarned} 积分！当前积分: ${totalPoints}`;
            fortuneHint.style.color = '#27ae60';
          }
        }
        
        const drawBtn = document.getElementById('draw-btn');
        if (drawBtn) {
          drawBtn.disabled = true;
          drawBtn.innerHTML = '<i class="fas fa-check me-2"></i>今日已抽取';
        }
        
        // 更新用户信息
        if (window.currentUser && typeof window.updateUserInfo === 'function') {
          window.currentUser.points = data.points;
          window.currentUser.point2 = data.point2;
          window.updateUserInfo(window.currentUser);
        }
      } else {
        throw new Error(data.error || '抽取运势失败');
      }
    } catch (error) {
      console.error('抽取运势失败:', error);
      
      const drawBtn = document.getElementById('draw-btn');
      const fortuneHint = document.getElementById('fortune-hint');
      
      if (drawBtn) {
        drawBtn.disabled = false;
        drawBtn.innerHTML = '<i class="fas fa-star me-2"></i>抽取今日运势';
      }
      if (fortuneHint) {
        fortuneHint.textContent = error.message || '网络错误，请重试';
        fortuneHint.style.color = '#e74c3c';
      }
      
      // 恢复封面显示
      const coverImg = document.getElementById('cover-img');
      const animationContainer = document.querySelector('.fortune-animation');
      if (coverImg) coverImg.style.display = 'block';
      if (animationContainer) animationContainer.style.display = 'none';
    }
  }
  
  // 重置初始化状态（用于页面重新加载）
  function resetFortuneModule() {
    isInitialized = false;
    songList = [];
  }
  
  // 暴露到全局
  window.FortuneModule = {
    init: initFortunePage,
    reset: resetFortuneModule
  };
  
})();
