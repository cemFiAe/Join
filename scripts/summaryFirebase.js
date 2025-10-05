// @ts-check
/* global firebase */
/// <reference path="./boardTypesD.ts" />

/** @typedef {Task} SummaryTask */
/** @typedef {{todo:number,done:number,inProgress:number,feedback:number,urgent:number,all:number,nextDeadline:Date|null}} SummaryStats */

// Robust: 'yyyy-mm-dd' | 'dd/mm/yyyy' | Date-fallback
function parseTaskDate(dateStr) {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/'); return new Date(`${y}-${m}-${d}`);
  }
  const dObj = new Date(dateStr);
  return isNaN(dObj.getTime()) ? null : dObj;
}

function fetchTasksOnce() {
  return firebase.database().ref('tasks').once('value')
    .then(s => /** @type {SummaryTask[]} */ (Object.values(s.val() || {})));
}

function summarizeTasks(tasks) {
  const s = { todo:0, done:0, inProgress:0, feedback:0, urgent:0, all:0, nextDeadline:null };
  for (const t of tasks) {
    s.all++; const st = String(t.status||'').toLowerCase();
    if (st==='todo') s.todo++; else if (st==='done') s.done++;
    else if (st==='inprogress') s.inProgress++; else if (st==='awaitingfeedback') s.feedback++;
    if (t.priority==='urgent') s.urgent++;
    const d = parseTaskDate(t.dueDate||''); if (d && (!s.nextDeadline || d < s.nextDeadline)) s.nextDeadline = d;
  } return s;
}

function setText(id, v){ const el=document.getElementById(id); if(el) el.textContent=String(v); }

function updateSummaryUI(s) {
  setText('summary-todo', s.todo); setText('summary-done', s.done);
  setText('summary-inprogress', s.inProgress); setText('summary-feedback', s.feedback);
  setText('summary-urgent', s.urgent); setText('summary-all', s.all);
  const d = s.nextDeadline;
  setText('summary-next-deadline', d ? d.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'2-digit'}) : '-');
}

function getGreeting(){ const h=new Date().getHours(); if(h<5)return'Good night,'; if(h<12)return'Good morning,'; if(h<18)return'Good afternoon,'; return'Good evening,'; }

function formatNameHtml(name){
  const p=(name||'Guest').trim().split(/\s+/); if(p.length<=1) return `<span style="color:#29ABE2;font-weight:800;">${p[0]}</span>`;
  const f=p.shift(); return `${f} <span style="color:#29ABE2;font-weight:800;">${p.join(' ')}</span>`;
}

function goBoard(hash){ const base='../pages/board.html'; window.location.href = hash ? `${base}#${hash}` : base; }

// findet den Karten-Container (macht ganze Kachel klickbar)
function cardTarget(el){
  return /** @type {HTMLElement} */(
    el.closest('[data-card]') ||
    el.closest('.summary-card, .summary-box, .summary-item, .tile, .kachel, .count-card, .count-box') ||
    el
  );
}

// macht die übergebenen Elemente/Container klickbar
function makeClickable(ids, hash) {
  /** @type {Set<HTMLElement>} */ const targets = new Set();
  ids.forEach(id => { const n=document.getElementById(id); if(n) targets.add(cardTarget(n)); });
  targets.forEach(el => {
    el.style.cursor='pointer'; el.setAttribute('tabindex','0'); el.setAttribute('role','button');
    const go=()=>goBoard(hash);
    el.addEventListener('click', go);
    el.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); }});
  });
}

function initSummary() {
  fetchTasksOnce().then(ts => updateSummaryUI(summarizeTasks(ts)));
  const g=document.getElementById('greeting-message'); const u=document.getElementById('summary-username');
  if (g) g.textContent=getGreeting();
  if (u) u.innerHTML=formatNameHtml(localStorage.getItem('currentUserName')||'Guest');

  // IDs der ganzen Kacheln (falls vorhanden) + Fallback auf die Zahl-IDs
  makeClickable(['card-todo','summary-todo'], 'todo');
  makeClickable(['card-done','summary-done'], 'done');
  makeClickable(['card-inprogress','summary-inprogress'], 'inprogress');
  makeClickable(['card-feedback','summary-feedback'], 'awaitingfeedback');
  makeClickable(['card-urgent','summary-urgent'], '');
  makeClickable(['card-all','summary-all'], '');
  makeClickable(['card-deadline','summary-next-deadline'], '');
}

document.addEventListener('DOMContentLoaded', initSummary);
