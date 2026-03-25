const CHAPTER_COUNT = 12;
const MANUSCRIPT_DIR = '../the-prepper-sows-seeds-in-a-fallen-city/';
let currentFontSize = 18; // base px

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    buildSidebar();
    attachEventListeners();
    
    // Auto-close sidebar on smaller screens
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.add('closed');
    }
});

// === Theme Management ===
function initTheme() {
    const savedTheme = localStorage.getItem('webnovel-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('webnovel-theme', newTheme);
}

// === Sidebar & File Loading ===
async function buildSidebar() {
    const list = document.getElementById('chapter-list');
    
    for (let i = 1; i <= CHAPTER_COUNT; i++) {
        const paddedNum = String(i).padStart(3, '0');
        const filename = `${paddedNum}-manuscript.md`;
        
        const li = document.createElement('li');
        const btn = document.createElement('button');
        
        // Initial state
        btn.innerHTML = `Ep ${parseInt(paddedNum)} <span class="loading-text">(불러오는 중...)</span>`;
        btn.dataset.file = filename;
        
        btn.addEventListener('click', () => loadChapter(btn, filename));
        li.appendChild(btn);
        list.appendChild(li);
        
        // Fetch title individually
        fetch(`${MANUSCRIPT_DIR}${filename}`)
            .then(res => {
                if (!res.ok) throw new Error('File not found');
                return res.text();
            })
            .then(text => {
                const lines = text.split('\n');
                let title = '';
                // Try to find the first H1
                for(let line of lines) {
                    if (line.startsWith('# ')) {
                        title = line.replace(/^#\s*/, '').trim();
                        break;
                    }
                }
                
                if (!title) {
                    title = `에피소드 ${parseInt(paddedNum)}`;
                }
                btn.textContent = title;
                btn.title = title; // tooltip for truncated titles
            })
            .catch(() => {
                btn.textContent = `에피소드 ${parseInt(paddedNum)}`;
            });
    }
}

async function loadChapter(button, filename) {
    // Update active UI
    document.querySelectorAll('.chapter-list button').forEach(btn => btn.classList.remove('active'));
    if (button) button.classList.add('active');

    const contentDiv = document.getElementById('content');
    
    // Skeleton Loading
    contentDiv.innerHTML = `
        <div class="skeleton">
            <div class="skeleton-title"></div>
            <div class="skeleton-text" style="width: 100%;"></div>
            <div class="skeleton-text" style="width: 95%;"></div>
            <div class="skeleton-text" style="width: 90%;"></div>
            <div class="skeleton-text" style="width: 98%;"></div>
            <div class="skeleton-text" style="width: 80%;"></div>
            <br>
            <div class="skeleton-text" style="width: 100%;"></div>
            <div class="skeleton-text" style="width: 92%;"></div>
            <div class="skeleton-text" style="width: 88%;"></div>
        </div>
    `;

    try {
        const response = await fetch(`${MANUSCRIPT_DIR}${filename}`);
        if (!response.ok) throw new Error('원고 파일을 불러올 수 없습니다.');
        
        const markdown = await response.text();
        
        // Parse markdown using marked.js
        // Enable breaks (newline to <br>) if desired, but novels usually don't need it.
        marked.setOptions({
            breaks: true,
            gfm: true
        });
        
        const html = marked.parse(markdown);
        
        // Render content
        requestAnimationFrame(() => {
            contentDiv.innerHTML = `<div class="fade-in">${html}</div>`;
            document.getElementById('reader-container').scrollTop = 0;
        });

        // Auto collapse sidebar on mobile after selection
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.add('closed');
        }

    } catch (error) {
        contentDiv.innerHTML = `
            <div class="welcome-screen">
                <h2>에러 발생</h2>
                <p>${error.message}</p>
                <p class="help-text">파일 경로(${MANUSCRIPT_DIR})와 파일명(${filename})을 확인하세요.</p>
                <p class="help-text">브라우저 보안 정책(CORS)으로 인해 로컬 파일 읽기가 제한되었을 수 있습니다.<br>로컬 웹 서버를 통해 실행해주세요.</p>
            </div>
        `;
    }
}

// === Event Listeners ===
function attachEventListeners() {
    // Topbar
    const sidebar = document.getElementById('sidebar');
    document.getElementById('toggle-sidebar').addEventListener('click', () => {
        sidebar.classList.toggle('closed');
    });

    // Theme Toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Typography Controls
    const root = document.documentElement;
    
    document.getElementById('font-increase').addEventListener('click', () => {
        if (currentFontSize < 28) { // max limit
            currentFontSize += 2;
            root.style.setProperty('--font-size-base', `${currentFontSize}px`);
        }
    });

    document.getElementById('font-decrease').addEventListener('click', () => {
        if (currentFontSize > 14) { // min limit
            currentFontSize -= 2;
            root.style.setProperty('--font-size-base', `${currentFontSize}px`);
        }
    });
}
