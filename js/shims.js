/*!
 * shims.js
 * 目的：为新路由层提供缺失的渲染函数别名，不改动现有页面实现。
 * 使用：在 spa.js 与 ccb.js 之后引入本文件。
 * 安全性：仅在目标函数不存在时才定义；内部调用你已有的 initXXX 函数；可多次加载无副作用。
 */
(function (global) {
  'use strict';

  // ---- 工具方法：安全调用并把返回值（含 Promise）原样透传 ----
  function tryCall(fnName, args) {
    try {
      var fn = global[fnName];
      if (typeof fn === 'function') {
        return fn.apply(global, args || []);
      }
      console.warn('[shims] 函数未定义：' + fnName);
    } catch (err) {
      console.error('[shims] 调用 ' + fnName + ' 出错：', err);
    }
    return undefined;
  }

  // ---- 1) 游戏查分页面：renderCCBUserPage → initCCBPage ----
  if (typeof global.renderCCBUserPage !== 'function') {
    global.renderCCBUserPage = function () {
      // 你的旧实现名：initCCBPage
      return tryCall('initCCBPage', arguments);
    };
  }

  // ---- 2) 网站管理主页：renderSiteAdminHome → initSiteAdminPage ----
  if (typeof global.renderSiteAdminHome !== 'function') {
    global.renderSiteAdminHome = function () {
      // 你的旧实现名：initSiteAdminPage
      return tryCall('initSiteAdminPage', arguments);
    };
  }

  // ---- 3) （可选）两个子页占位：路由若指向它们，先无害地落到站点管理主页 ----
  if (typeof global.renderCCBServersPage !== 'function') {
    global.renderCCBServersPage = function () {
      return tryCall('initSiteAdminPage', arguments);
    };
  }

  if (typeof global.renderCCBGamesPage !== 'function') {
    global.renderCCBGamesPage = function () {
      return tryCall('initSiteAdminPage', arguments);
    };
  }

  // ---- 4) 诊断输出（一次性）----
  if (!global.__SHIMS_DIAG_PRINTED__) {
    global.__SHIMS_DIAG_PRINTED__ = true;
    var map = {
      renderCCBUserPage: '→ initCCBPage',
      renderSiteAdminHome: '→ initSiteAdminPage',
      renderCCBServersPage: '→ initSiteAdminPage',
      renderCCBGamesPage: '→ initSiteAdminPage'
    };
    try {
    } catch (_) {}
  }
})(typeof window !== 'undefined' ? window : globalThis);
