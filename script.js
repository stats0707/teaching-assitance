/* ===== 猫猫互评系统 - 前端逻辑 v3 (原生 fetch + Supabase REST API) ===== */

// Supabase REST API 配置（从 config.js 读取）
const API_BASE = SUPABASE_URL + '/rest/v1';
const API_HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
  'Content-Type': 'application/json'
};

// 全局状态
let state = {
  currentClass: null,
  currentEvaluator: null,
  currentTarget: null,
  groups: [],
  scores: [],
  classPassword: null,
  _lastRankings: null
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  createPawBackground();
  document.getElementById('classSelect').classList.remove('hidden');
});

function createPawBackground() {
  const bg = document.getElementById('pawBackground');
  const paws = ['🐾', '🐱', '🐈', '🐾', '😺', '😸', '🐾', '😻'];
  for (let i = 0; i < 30; i++) {
    const paw = document.createElement('span');
    paw.className = 'paw';
    paw.textContent = paws[i % paws.length];
    paw.style.left = Math.random() * 95 + '%';
    paw.style.top = Math.random() * 95 + '%';
    paw.style.setProperty('--rot', Math.random() * 360 + 'deg');
    paw.style.setProperty('--delay', Math.random() * 8 + 's');
    bg.appendChild(paw);
  }
}

// ===== Toast 提示 =====
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ===== 班级口令验证 =====
function verifyPassword(classId) {
  const cached = sessionStorage.getItem(`pwd_${classId}`);
  if (cached === 'ok') return true;

  const password = prompt(`🔐 请输入「${CLASS_DATA[classId].name}」的访问口令：`);
  if (!password) return false;

  if (password === CLASS_PASSWORDS[classId]) {
    sessionStorage.setItem(`pwd_${classId}`, 'ok');
    state.classPassword = password;
    return true;
  }
  showToast('😿 口令错误，请重试！');
  return false;
}

// ===== Supabase REST API 操作 =====
async function loadScores(classId) {
  try {
    const resp = await fetch(`${API_BASE}/scores?class_id=eq.${classId}`, {
      headers: API_HEADERS
    });
    if (!resp.ok) { console.error('loadScores error:', resp.status); return []; }
    return await resp.json() || [];
  } catch (e) {
    console.error('loadScores:', e);
    return [];
  }
}

async function upsertScore(scoreRow) {
  // 先尝试更新，如果不存在则插入
  const filterUrl = `${API_BASE}/scores?class_id=eq.${scoreRow.class_id}&evaluator_group=eq.${scoreRow.evaluator_group}&target_group=eq.${scoreRow.target_group}`;
  
  // upsert：使用 Prefer header 实现合并
  const resp = await fetch(`${API_BASE}/scores`, {
    method: 'POST',
    headers: {
      ...API_HEADERS,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(scoreRow)
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`提交失败 (${resp.status}): ${errText}`);
  }
  return true;
}

async function deleteScores(classId) {
  const resp = await fetch(`${API_BASE}/scores?class_id=eq.${classId}`, {
    method: 'DELETE',
    headers: API_HEADERS
  });
  if (!resp.ok) throw new Error(`删除失败 (${resp.status})`);
  return true;
}

// ===== 班级选择 =====
async function selectClass(classId) {
  if (!verifyPassword(classId)) return;

  state.currentClass = classId;
  state.currentEvaluator = null;
  state.currentTarget = null;

  state.groups = CLASS_DATA[classId].groups;
  state.dimensions = DIMENSIONS;
  state.scores = await loadScores(classId);

  document.getElementById('classSelect').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  document.getElementById('className').textContent = CLASS_DATA[classId].name;

  renderEvaluators();
  switchTab('evaluate');
}

function goBack() {
  state.currentClass = null;
  state.currentEvaluator = null;
  state.currentTarget = null;
  state.scores = [];
  document.getElementById('classSelect').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('hidden');
}

// ===== Tab 切换 =====
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

  if (tab === 'evaluate') {
    document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
    document.getElementById('tabEvaluate').classList.remove('hidden');
  } else {
    document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
    document.getElementById('tabRanking').classList.remove('hidden');
    loadRankings();
  }
}

// ===== 渲染评估者列表 =====
function renderEvaluators() {
  const container = document.getElementById('evaluatorList');
  container.innerHTML = state.groups.map(g => {
    const completed = state.scores.filter(s => s.evaluator_group === g.id).length;
    const total = state.groups.length - 1;
    const isSelected = state.currentEvaluator === g.id;
    const cat = ['😺','😸','😻','😼','😽','🙀','😿','😹','🐱','🐈','🐈‍⬛'][(g.id - 1) % 11];
    return `
      <button class="group-btn ${isSelected ? 'selected' : ''} ${completed >= total ? 'completed' : ''}"
              onclick="selectEvaluator(${g.id})">
        <span class="group-emoji">${cat}</span>
        ${g.name}
        <span class="badge">${completed}/${total} 组</span>
      </button>`;
  }).join('');
}

function selectEvaluator(groupId) {
  state.currentEvaluator = groupId;
  renderEvaluators();
  renderTargets();
}

// ===== 渲染待评小组 =====
function renderTargets() {
  const container = document.getElementById('targetList');
  if (!state.currentEvaluator) {
    container.innerHTML = `<div class="empty-state"><div class="empty-cat">🐱</div><p>喵~ 请先在左侧选择你的小组</p></div>`;
    return;
  }

  const evaluatorId = state.currentEvaluator;
  const myScores = state.scores.filter(s => s.evaluator_group === evaluatorId);
  const cats = ['🐟','🐠','🎣','🐡','🦈','🐬','🐋','🦭','🦀','🦞','🐙','🦑','🐚'];

  container.innerHTML = state.groups
    .filter(g => g.id !== state.currentEvaluator)
    .map((g, i) => {
      const scored = myScores.find(s => s.target_group === g.id);
      return `
        <div class="target-card ${scored ? 'scored' : ''}" onclick="openScoreModal(${g.id})">
          <span class="target-cat">${cats[i % cats.length]}</span>
          <div class="target-name">${g.name}</div>
          <div class="target-members">${g.members.join('、')}</div>
          ${scored ? '<div style="margin-top:8px;color:#4CAF50;font-size:0.85rem;">✅ 已评分 · 点击可修改</div>' : '<div style="margin-top:8px;color:var(--orange);font-size:0.85rem;">🐾 点击评分</div>'}
        </div>`;
      }).join('');
}

// ===== 评分弹窗 =====
function openScoreModal(targetGroupId) {
  if (!state.currentEvaluator) {
    showToast('🐱 请先在左侧选择你的小组哦~');
    return;
  }
  state.currentTarget = targetGroupId;

  const targetGroup = state.groups.find(g => g.id === targetGroupId);
  document.getElementById('modalTitle').textContent = `为 ${targetGroup.name} 打分`;

  const existing = state.scores.find(
    s => s.evaluator_group === state.currentEvaluator && s.target_group === targetGroupId
  );

  const catEmojis = ['😿', '😾', '😼', '😸', '😻'];

  document.getElementById('modalBody').innerHTML = state.dimensions.map(d => {
    const dimKey = 'dim' + d.id;
    const val = existing ? (existing[dimKey] !== undefined ? existing[dimKey] : Math.round(d.maxScore * 0.7)) : Math.round(d.maxScore * 0.7);
    const catIdx = Math.min(Math.floor(val / d.maxScore * 4), 4);
    return `
      <div class="dim-item">
        <div class="dim-header">
          <div class="dim-name">
            ${d.name}
            <span class="dim-subtitle">— ${d.subtitle}</span>
          </div>
          <span class="dim-max">满分 ${d.maxScore}分</span>
        </div>
        <div class="dim-slider">
          <input type="range" id="dim_${d.id}" min="0" max="${d.maxScore}" step="0.5"
                 value="${val}" oninput="updateDimValue(${d.id}, ${d.maxScore})">
          <span class="dim-value" id="dimVal_${d.id}">${val}</span>
        </div>
        <div class="dim-cat" id="dimCat_${d.id}">${catEmojis[catIdx]}</div>
      </div>`;
  }).join('');

  updateTotalDisplay();
  document.getElementById('scoreModal').classList.remove('hidden');
}

function updateDimValue(dimId, maxScore) {
  const slider = document.getElementById(`dim_${dimId}`);
  const val = parseFloat(slider.value);
  document.getElementById(`dimVal_${dimId}`).textContent = val;

  const catEmojis = ['😿', '😾', '😼', '😸', '😻'];
  const catIdx = Math.min(Math.floor(val / maxScore * 4), 4);
  document.getElementById(`dimCat_${dimId}`).textContent = catEmojis[catIdx];

  updateTotalDisplay();
}

function updateTotalDisplay() {
  let total = 0;
  state.dimensions.forEach(d => {
    const slider = document.getElementById(`dim_${d.id}`);
    if (slider) total += parseFloat(slider.value);
  });
  document.getElementById('totalScore').textContent = total.toFixed(1);
}

function closeModal() {
  document.getElementById('scoreModal').classList.add('hidden');
  state.currentTarget = null;
}

// ===== 提交评分 =====
async function submitScore() {
  const scoreRow = {
    class_id: state.currentClass,
    evaluator_group: state.currentEvaluator,
    target_group: state.currentTarget
  };
  state.dimensions.forEach(d => {
    const slider = document.getElementById(`dim_${d.id}`);
    scoreRow['dim' + d.id] = parseFloat(slider.value);
  });

  try {
    await upsertScore(scoreRow);
    state.scores = await loadScores(state.currentClass);
    showToast('🐱 评分已保存！喵~');
    closeModal();
    renderEvaluators();
    renderTargets();
  } catch (e) {
    console.error(e);
    showToast('😿 ' + e.message);
  }
}

// ===== 排名计算 =====
function calculateRankings() {
  const groups = state.groups;
  const dimensions = state.dimensions;
  const scores = state.scores;

  const rankings = groups.map(g => {
    const targetScores = scores.filter(s => s.target_group === g.id);
    const n = targetScores.length;
    let totalScore = 0;
    const dimTotals = { dim1: 0, dim2: 0, dim3: 0, dim4: 0, dim5: 0 };

    targetScores.forEach(s => {
      totalScore += (s.dim1 || 0) + (s.dim2 || 0) + (s.dim3 || 0) + (s.dim4 || 0) + (s.dim5 || 0);
      dimTotals.dim1 += (s.dim1 || 0);
      dimTotals.dim2 += (s.dim2 || 0);
      dimTotals.dim3 += (s.dim3 || 0);
      dimTotals.dim4 += (s.dim4 || 0);
      dimTotals.dim5 += (s.dim5 || 0);
    });

    const avgTotal = n > 0 ? Math.round(totalScore / n * 100) / 100 : 0;
    const avgDims = {};
    dimensions.forEach(d => {
      const key = 'dim' + d.id;
      avgDims[key] = n > 0 ? Math.round(dimTotals[key] / n * 100) / 100 : 0;
    });

    return {
      group: g,
      average_total: avgTotal,
      average_dims: avgDims,
      evaluator_count: n,
      total_evaluators_needed: groups.length - 1,
      score_details: targetScores.map(s => ({
        evaluator: s.evaluator_group,
        total: (s.dim1 || 0) + (s.dim2 || 0) + (s.dim3 || 0) + (s.dim4 || 0) + (s.dim5 || 0)
      }))
    };
  });

  rankings.sort((a, b) => b.average_total - a.average_total);
  return rankings;
}

// ===== 排名面板 =====
async function loadRankings() {
  state.scores = await loadScores(state.currentClass);

  const rankings = calculateRankings();
  const totalEvals = rankings.reduce((s, r) => s + r.evaluator_count, 0);
  const totalPossible = state.groups.length * (state.groups.length - 1);

  document.getElementById('rankingStats').innerHTML = `
    总评分次数：<span>${totalEvals}</span> / ${totalPossible} &nbsp;|&nbsp;
    小组数：<span>${state.groups.length}</span> &nbsp;|&nbsp;
    最高分：<span>${rankings[0]?.average_total || 0} 分</span>
  `;

  const maxScore = Math.max(...rankings.map(r => r.average_total), 1);
  document.getElementById('rankingChart').innerHTML = `
    <div class="chart-title">🐱 小组平均分排行</div>
    ${rankings.map((r, i) => {
      let barClass = 'normal';
      if (i === 0) barClass = 'gold';
      else if (i === 1) barClass = 'silver';
      else if (i === 2) barClass = 'bronze';
      const width = (r.average_total / maxScore * 100);
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
      return `
        <div class="chart-bar-wrap">
          <div class="chart-label">
            <span class="group-name">${medal} ${r.group.name}</span>
            <span>${r.average_total} 分</span>
          </div>
          <div class="chart-bar">
            <div class="chart-bar-fill ${barClass}" style="width: ${width}%">
              ${r.average_total > 30 ? r.average_total : ''}
            </div>
          </div>
        </div>`;
    }).join('')}
  `;

  document.getElementById('rankingList').innerHTML = `
    <h3 style="color:var(--warm-brown);margin-bottom:15px;">🏆 详细排名</h3>
    ${rankings.length === 0 ? '<div class="empty-state"><div class="empty-cat">😿</div><p>暂未有人评分，快去评分吧~</p></div>' : ''}
    ${rankings.map((r, i) => {
      let rankClass = '';
      let badgeClass = 'normal';
      let badgeContent = i + 1;
      if (i === 0) { rankClass = 'rank-1'; badgeClass = 'top1'; badgeContent = '🥇'; }
      else if (i === 1) { rankClass = 'rank-2'; badgeClass = 'top2'; badgeContent = '🥈'; }
      else if (i === 2) { rankClass = 'rank-3'; badgeClass = 'top3'; badgeContent = '🥉'; }
      return `
        <div class="rank-item ${rankClass}" onclick="showGroupDetail('${r.group.id}', '${r.group.name}', '${r.group.members.join('、')}')">
          <div class="rank-badge ${badgeClass}">${badgeContent}</div>
          <div class="rank-info">
            <div class="rank-name">${r.group.name}</div>
            <div class="rank-members">${r.group.members.join('、')}</div>
          </div>
          <div style="text-align:right;">
            <div class="rank-score">${r.average_total}</div>
            <div class="rank-progress">已评 ${r.evaluator_count}/${r.total_evaluators_needed} 次</div>
          </div>
        </div>`;
    }).join('')}
  `;

  state._lastRankings = rankings;
  document.getElementById('detailPanel').innerHTML = '';
}

// ===== 显示小组详情 =====
function showGroupDetail(groupId, groupName, members) {
  const rankings = state._lastRankings || calculateRankings();
  const group = rankings.find(r => r.group.id === parseInt(groupId));
  if (!group) return;

  const dimEmojis = ['💡', '📊', '📈', '🔍', '🎤'];
  document.getElementById('detailPanel').innerHTML = `
    <h3>🔎 ${groupName} · ${members} · 维度详情</h3>
    <div class="dim-detail-grid">
      ${state.dimensions.map((d, i) => {
        const dimKey = 'dim' + d.id;
        const avgScore = group.average_dims[dimKey] || 0;
        const pct = d.maxScore > 0 ? Math.round(avgScore / d.maxScore * 100) : 0;
        return `
          <div class="dim-detail-card">
            <div class="dim-detail-name">${dimEmojis[i]} ${d.name}</div>
            <div class="dim-detail-score">${avgScore}</div>
            <div class="dim-detail-max">满分 ${d.maxScore} · ${pct}%</div>
          </div>`;
      }).join('')}
    </div>
    ${group.score_details && group.score_details.length > 0 ? `
      <div style="margin-top:15px;">
        <h4 style="color:var(--warm-brown);margin-bottom:10px;">📋 各小组评分明细</h4>
        ${group.score_details.map(s => `
          <div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--cream);border-radius:8px;margin-bottom:4px;">
            <span>第${s.evaluator}组 评价 →</span>
            <span style="font-weight:bold;color:var(--dark-orange);">${s.total} 分</span>
          </div>`).join('')}
      </div>
    ` : ''}
  `;

  document.getElementById('detailPanel').scrollIntoView({ behavior: 'smooth' });
}

// ===== 重置评分 =====
async function resetScores() {
  if (!confirm('确定要重置当前班级的所有评分数据吗？此操作不可恢复！🐱')) return;

  try {
    await deleteScores(state.currentClass);
    state.scores = [];
    showToast('🔄 数据已重置');
    renderEvaluators();
    renderTargets();
    if (!document.getElementById('tabRanking').classList.contains('hidden')) {
      loadRankings();
    }
  } catch (e) {
    showToast('😿 ' + e.message);
  }
}

// ===== 事件监听 =====
document.addEventListener('click', function(e) {
  if (e.target.id === 'scoreModal') closeModal();
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});
