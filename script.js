// ============================================
// Northbound Dashboard — Supabase-powered
// Auth + Database, called directly from the browser
// No Java/Python backend — Supabase IS the backend.
// ============================================

import { supabaseConfig } from "./supabase-config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

// ---------- DOM references ----------
const authOverlay = document.getElementById('authOverlay');
const appRoot = document.getElementById('appRoot');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const authError = document.getElementById('authError');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');

// Projects (list view)
const projectRows = document.getElementById('projectRows');
const rowCount = document.getElementById('rowCount');

// Overview
const heroName = document.getElementById('heroName');
const heroSub = document.getElementById('heroSub');
const statTotalProjects = document.getElementById('statTotalProjects');
const statAvgProgress = document.getElementById('statAvgProgress');
const statAtRisk = document.getElementById('statAtRisk');
const statusDonut = document.getElementById('statusDonut');
const donutLegend = document.getElementById('donutLegend');
const overviewFeed = document.getElementById('overviewFeed');

// Activity
const activityFeed = document.getElementById('activityFeed');
const timelineList = document.getElementById('timelineList');

// Goals
const goalsList = document.getElementById('goalsList');
const goalsCount = document.getElementById('goalsCount');

// Settings
const settingsName = document.getElementById('settingsName');
const settingsEmail = document.getElementById('settingsEmail');
const settingsRole = document.getElementById('settingsRole');
const settingsSince = document.getElementById('settingsSince');

// New project modal
const newProjectBtn = document.getElementById('newProjectBtn');
const newProjectOverlay = document.getElementById('newProjectOverlay');
const newProjectForm = document.getElementById('newProjectForm');
const npName = document.getElementById('npName');
const npOwner = document.getElementById('npOwner');
const npCategory = document.getElementById('npCategory');
const npStatus = document.getElementById('npStatus');
const npProgress = document.getElementById('npProgress');
const npDeadline = document.getElementById('npDeadline');
const npError = document.getElementById('npError');
const npCancel = document.getElementById('npCancel');
const npSave = document.getElementById('npSave');

// Track the signed-in user/profile for use across views (e.g. Settings)
let currentUser = null;
let currentProfile = null;
let currentView = 'overview';
let allProjects = [];

// Shared "recent activity" data used by both the Overview and Activity feeds
const FEED_ITEMS = [
  { who: 'Priya', what: 'flagged a blocker on Billing migration', when: '2 hours ago' },
  { who: 'Malik', what: 'shipped the onboarding flow to staging', when: '5 hours ago' },
  { who: 'You', what: 'completed 6 tasks in Design system v2', when: 'Yesterday' },
];

// ============================================
// AUTHENTICATION
// ============================================

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in…';

  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmail.value.trim(),
    password: loginPassword.value
  });

  if (error) {
    authError.textContent = friendlyAuthError(error.message);
  }
  // On success, onAuthStateChange (below) handles what happens next

  loginBtn.disabled = false;
  loginBtn.textContent = 'Sign in';
});

logoutBtn.addEventListener('click', () => {
  supabase.auth.signOut();
});

// Runs on load, and again every time sign-in state changes
supabase.auth.onAuthStateChange(async (_event, session) => {
  const user = session?.user;

  if (!user) {
    showLoginScreen();
    return;
  }

  // User is signed in — now check they're actually authorized as admin,
  // via the "profiles" table (see supabase-setup.sql).
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    authError.textContent = 'This account does not have admin access.';
    await supabase.auth.signOut();
    return;
  }

  currentUser = user;
  currentProfile = profile;

  showDashboard(user, profile);
  switchView('overview');
});
const {
  data: { session }
} = await supabase.auth.getSession();

console.log(session);

function friendlyAuthError(message) {
  if (message.includes('Invalid login credentials')) return 'Incorrect email or password.';
  if (message.includes('Email not confirmed')) return 'Please confirm your email before signing in.';
  return 'Sign-in failed. Please try again.';
}

function showLoginScreen() {
  authOverlay.hidden = false;
  appRoot.hidden = true;
  loginForm.reset();
}

function showDashboard(user, profile) {
  authOverlay.hidden = true;
  appRoot.hidden = false;

  const displayName = profile.name || user.email;
  userName.textContent = displayName;
  userRole.textContent = profile.role === 'admin' ? 'Admin' : profile.role;
  userAvatar.textContent = initialsFrom(displayName);
}

function initialsFrom(name) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');
}

// ============================================
// VIEW SWITCHING (Overview / Projects / Activity / Goals / Settings)
// ============================================

function switchView(name) {
  currentView = name;

  document.querySelectorAll('.view').forEach(section => {
    const isMatch = section.dataset.view === name;
    section.classList.toggle('is-active', isMatch);
    section.hidden = !isMatch;
  });

  document.querySelectorAll('.nav-link[data-view]').forEach(link => {
    link.classList.toggle('is-active', link.dataset.view === name);
  });

  if (name === 'overview') loadOverview();
  if (name === 'projects') loadProjects();
  if (name === 'activity') loadActivity();
  if (name === 'goals') loadGoals();
  if (name === 'settings') loadSettings();

  
  // Close the mobile sidebar after navigating
  if (window.innerWidth <= 860) {
    sidebar.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }
}

document.querySelectorAll('.nav-link[data-view]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(link.dataset.view);
  });
});

// ============================================
// OVERVIEW — status donut + summary stats + feed
// ============================================

async function loadOverview() {
  heroName.textContent = (currentProfile?.name || currentUser?.email || 'there').split(' ')[0];

  const { data: projects, error } = await supabase
    .from('projects')
    .select('status, progress');

  if (error || !projects) {
    heroSub.textContent = "Couldn't load your project summary right now.";
    renderFeed(overviewFeed);
    return;
  }

  const total = projects.length;
  const counts = { ahead: 0, track: 0, risk: 0 };
  let progressSum = 0;

  projects.forEach(p => {
    counts[p.status] = (counts[p.status] || 0) + 1;
    progressSum += Number(p.progress) || 0;
  });

  const avgProgress = total ? Math.round(progressSum / total) : 0;

  statTotalProjects.textContent = total;
  statAvgProgress.textContent = `${avgProgress}%`;
  statAtRisk.textContent = counts.risk;

  heroSub.textContent = total
    ? `${counts.ahead + counts.track} of ${total} projects are on track or ahead. ${counts.risk} need attention.`
    : 'No projects yet — create one to get started.';

  // Donut chart via conic-gradient
  if (total === 0) {
    statusDonut.style.setProperty('--donut-ahead', '0%');
    statusDonut.style.setProperty('--donut-ahead-track', '0%');
    donutLegend.innerHTML = `<li>No projects yet</li>`;
  } else {
    const aheadPct = (counts.ahead / total) * 100;
    const aheadTrackPct = ((counts.ahead + counts.track) / total) * 100;
    statusDonut.style.setProperty('--donut-ahead', `${aheadPct}%`);
    statusDonut.style.setProperty('--donut-ahead-track', `${aheadTrackPct}%`);

    donutLegend.innerHTML = `
      <li><span class="dot" style="background: var(--teal)"></span> Ahead <span class="count">${counts.ahead}</span></li>
      <li><span class="dot" style="background: var(--gold)"></span> On track <span class="count">${counts.track}</span></li>
      <li><span class="dot" style="background: var(--brick)"></span> At risk <span class="count">${counts.risk}</span></li>
    `;
  }

  renderFeed(overviewFeed);
}

function renderFeed(targetEl) {
  if (!targetEl) return;
  targetEl.innerHTML = FEED_ITEMS.map(item => `
    <li>
      <span class="feed-dot" aria-hidden="true"></span>
      <div>
        <p><strong>${escapeHtml(item.who)}</strong> ${escapeHtml(item.what)}</p>
        <time>${escapeHtml(item.when)}</time>
      </div>
    </li>
  `).join('');
}

// ============================================
// PROJECTS — full list
// ============================================
console.log("--------------------------");
async function loadProjects() {
  projectRows.innerHTML = `<tr class="loading-row"><td colspan="4">Loading projects…</td></tr>`;

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*");

allProjects = projects || [];
console.log("Projects from Supabase:", projects);
console.log("allProjects:", allProjects);
console.log(error);
  if (error) {
    projectRows.innerHTML = `<tr class="loading-row"><td colspan="4">Couldn't load projects — check your RLS policies and that you're signed in as admin.</td></tr>`;
    return;
  }

  if (!projects || projects.length === 0) {
    projectRows.innerHTML = `<tr class="loading-row"><td colspan="4">No projects yet. Click "+ New project" to add one.</td></tr>`;
    if (rowCount) rowCount.textContent = '0 active';
    return;
  }

  projectRows.innerHTML = '';
  projects.forEach(p => projectRows.appendChild(buildProjectRow(p)));

  if (rowCount) rowCount.textContent = `${projects.length} active`;
}

function buildProjectRow(p) {
  const tr = document.createElement('tr');

  const statusClass = { ahead: 'pill--ahead', track: 'pill--track', risk: 'pill--risk' }[p.status] || 'pill--track';
  const statusLabel = { ahead: 'Ahead', track: 'On track', risk: 'At risk' }[p.status] || p.status;
  const progress = Math.max(0, Math.min(100, Number(p.progress) || 0));

  tr.innerHTML = `
    <td data-label="Project">
      <span class="proj-name">${escapeHtml(p.name || 'Untitled project')}</span>
      <span class="proj-sub">${escapeHtml(p.category || '')}</span>
    </td>
    <td data-label="Owner">${escapeHtml(p.owner || '—')}</td>
    <td data-label="Status"><span class="pill ${statusClass}">${statusLabel}</span></td>
    <td data-label="Progress">
      <div class="bar"><span style="width: ${progress}%"></span></div>
    </td>
  `;
  return tr;
}

// ============================================
// ACTIVITY — weekly focus chart + project timelines
// ============================================

async function loadActivity() {
  renderFeed(activityFeed);

  timelineList.innerHTML = `<li>Loading…</li>`;

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*");

console.log("Projects:", projects);
console.log("Error:", error);

allProjects = projects || [];

console.log("allProjects:", allProjects);

  if (error) {
    timelineList.innerHTML = `<li>Couldn't load project timelines.</li>`;
    return;
  }

  if (!projects || projects.length === 0) {
    timelineList.innerHTML = `<li>No projects yet.</li>`;
    return;
  }

  timelineList.innerHTML = '';
  projects.forEach(p => timelineList.appendChild(buildTimelineRow(p)));
}

function buildTimelineRow(p) {
  const li = document.createElement('li');
  const progress = Math.max(0, Math.min(100, Number(p.progress) || 0));

  let dueLabel = 'No deadline set';
  let dueClass = 'pill--track';

  if (p.deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(p.deadline);
    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      dueLabel = `${Math.abs(diffDays)}d overdue`;
      dueClass = 'pill--risk';
    } else if (diffDays === 0) {
      dueLabel = 'Due today';
      dueClass = 'pill--risk';
    } else if (diffDays <= 7) {
      dueLabel = `${diffDays}d left`;
      dueClass = 'pill--track';
    } else {
      dueLabel = `${diffDays}d left`;
      dueClass = 'pill--ahead';
    }
  }

  li.innerHTML = `
    <div class="timeline-head">
      <strong>${escapeHtml(p.name || 'Untitled project')}</strong>
      <span class="pill ${dueClass}">${escapeHtml(dueLabel)}</span>
    </div>
    <div class="bar"><span style="width: ${progress}%"></span></div>
    <p class="timeline-meta">${progress}% complete${p.deadline ? ` · Due ${formatDate(p.deadline)}` : ''}</p>
  `;
  return li;
}

// ============================================
// GOALS — milestones with due dates
// ============================================

async function loadGoals() {
  goalsList.innerHTML = `<li>Loading…</li>`;

  const { data: goals, error } = await supabase
    .from('goals')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) {
    goalsList.innerHTML = `<li>Couldn't load goals — make sure the "goals" table exists (see supabase-migration-2.sql).</li>`;
    goalsCount.textContent = '';
    return;
  }

  if (!goals || goals.length === 0) {
    goalsList.innerHTML = `<li>No goals yet.</li>`;
    goalsCount.textContent = '0 goals';
    return;
  }

  goalsCount.textContent = `${goals.length} goal${goals.length === 1 ? '' : 's'}`;
  goalsList.innerHTML = '';
  goals.forEach(g => goalsList.appendChild(buildGoalRow(g)));
}

function buildGoalRow(g) {
  const li = document.createElement('li');

  const statusMap = {
    done: { cls: 'pill--done', label: 'Done' },
    in_progress: { cls: 'pill--track', label: 'In progress' },
    pending: { cls: 'pill--pending', label: 'Pending' },
  };
  const statusInfo = statusMap[g.status] || statusMap.pending;

  let overdueBadge = '';
  if (g.status !== 'done' && g.due_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(g.due_date);
    if (due < today) {
      overdueBadge = `<span class="pill pill--overdue">Overdue</span>`;
    }
  }

  li.innerHTML = `
    <div>
      <p class="goal-title">${escapeHtml(g.title || 'Untitled goal')}</p>
      ${g.description ? `<p class="goal-desc">${escapeHtml(g.description)}</p>` : ''}
      <p class="goal-due">${g.due_date ? `Due ${formatDate(g.due_date)}` : 'No due date'}</p>
    </div>
    <div class="goal-badges">
      <span class="pill ${statusInfo.cls}">${statusInfo.label}</span>
      ${overdueBadge}
    </div>
  `;
  return li;
}

// ============================================
// SETTINGS — current admin's account info
// ============================================

function loadSettings() {

    console.log("Settings Loaded");

}

// ============================================
// NEW PROJECT MODAL
// ============================================

newProjectBtn.addEventListener('click', () => {
  npError.textContent = '';
  newProjectForm.reset();
  newProjectOverlay.hidden = false;
});

npCancel.addEventListener('click', () => {
  newProjectOverlay.hidden = true;
});

newProjectOverlay.addEventListener('click', (e) => {
  if (e.target === newProjectOverlay) newProjectOverlay.hidden = true;
});

newProjectForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  npError.textContent = '';
  npSave.disabled = true;
  npSave.textContent = 'Creating…';

  const { error } = await supabase.from('projects').insert({
    name: npName.value.trim(),
    owner: npOwner.value.trim() || null,
    category: npCategory.value.trim() || null,
    status: npStatus.value,
    progress: Number(npProgress.value) || 0,
    deadline: npDeadline.value || null,
  });

  npSave.disabled = false;
  npSave.textContent = 'Create project';

  if (error) {
  console.error("Supabase Error:", error);
  npError.textContent = error.message;
  alert(JSON.stringify(error, null, 2));
  return;
}

});


// ============================================
// Helpers
// ============================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ============================================
// UI: sidebar toggle, search, compass animation
// ============================================

const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}



const results = document.getElementById("searchResults");



const search = document.getElementById("tableSearch");

search.addEventListener("input", () => {

    const value = search.value.trim().toLowerCase();

    switch (currentView) {

        case "overview":
            searchOverview(value);
            break;

        case "projects":
            searchProjects(value);
            break;

        case "activity":
            searchActivity(value);
            break;

        case "goals":
            searchGoals(value);
            break;

        case "settings":
            searchSettings(value);
            break;

    }

});function searchProjects(value) {

    const filtered = allProjects.filter(project => {

        return (

            (project.name || "").toLowerCase().includes(value) ||
            (project.owner || "").toLowerCase().includes(value) ||
            (project.category || "").toLowerCase().includes(value) ||
            (project.status || "").toLowerCase().includes(value) ||
            (project.deadline || "").toLowerCase().includes(value)

        );

    });

    projectRows.innerHTML = "";

    if(filtered.length===0){

        projectRows.innerHTML=
        `<tr><td colspan="4">No Projects Found</td></tr>`;

        return;
    }

    filtered.forEach(project=>{

        projectRows.appendChild(buildProjectRow(project));

    });

}function searchOverview(value){

    const cards=document.querySelectorAll(".overview-card");

    cards.forEach(card=>{

        const text=card.innerText.toLowerCase();

        if(text.includes(value)){

            card.style.display="";

        }
        else{

            card.style.display="none";

        }

    });

}function searchActivity(value){

    const items=document.querySelectorAll("#timelineList li");

    items.forEach(item=>{

        const text=item.innerText.toLowerCase();

        if(text.includes(value)){

            item.style.display="";

        }
        else{

            item.style.display="none";

        }

    });

}function searchGoals(value){

    const items=document.querySelectorAll("#goalsList li");

    items.forEach(item=>{

        const text=item.innerText.toLowerCase();

        if(text.includes(value)){

            item.style.display="";

        }
        else{

            item.style.display="none";

        }

    });

}function searchSettings(value){

    const fields=document.querySelectorAll(".settings-card");

    fields.forEach(field=>{

        const text=field.innerText.toLowerCase();

        if(text.includes(value)){

            field.style.display="";

        }
        else{

            field.style.display="none";

        }

    });

}
window.addEventListener('DOMContentLoaded', () => {
  const progress = document.querySelector('.compass-progress');
  if (!progress) return;
  const target = progress.style.strokeDasharray;
  progress.style.strokeDasharray = '0 100';
  requestAnimationFrame(() => {
    setTimeout(() => { progress.style.strokeDasharray = target; }, 100);
  });
});
