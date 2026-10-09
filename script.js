// --- 1. ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ ---
function switchPage(pageId) {
    document.querySelectorAll(".tab-page").forEach(page => page.classList.remove("active"));
    document.querySelectorAll(".nav-tab").forEach(tab => tab.classList.remove("active"));

    const activePage = document.getElementById("page-" + pageId);
    if (activePage) activePage.classList.add("active");

    const activeTabBtn = document.querySelector(`.nav-tab[data-tab="${pageId}"]`);
    if (activeTabBtn) activeTabBtn.classList.add("active");

    if (pageId === "admin") renderAdminUsers();
    if (pageId === "forum") renderForumTopics();
    if (pageId === "donate") updateBalanceDisplays();
}

document.querySelectorAll(".nav-tab").forEach(button => {
    button.onclick = () => switchPage(button.getAttribute("data-tab"));
});

// --- 2. ТАЙМЕР ОТСЧЕТА ДО 23 ОКТЯБРЯ 2026 ---
const releaseDate = new Date("Oct 23, 2026 00:00:00").getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const distance = releaseDate - now;

    if (distance < 0) return;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("days").innerText = days < 10 ? "0" + days : days;
    document.getElementById("hours").innerText = hours < 10 ? "0" + hours : hours;
    document.getElementById("minutes").innerText = minutes < 10 ? "0" + minutes : minutes;
    document.getElementById("seconds").innerText = seconds < 10 ? "0" + seconds : seconds;
}
setInterval(updateCountdown, 1000);
updateCountdown();

// --- 3. АККАУНТЫ И АВТОРИЗАЦИЯ ---
const defaultAccounts = [
    { username: "Danik", password: "2007ps3slim123", role: "Разработчик", balance: 1000000 }
];

function getAccounts() {
    const localAccs = localStorage.getItem("rrp_users");
    return localAccs ? JSON.parse(localAccs) : defaultAccounts;
}

function saveAccount(newUser) {
    const accs = getAccounts();
    accs.push(newUser);
    localStorage.setItem("rrp_users", JSON.stringify(accs));
}

function updateAccountBalance(username, newBalance) {
    const accs = getAccounts();
    const user = accs.find(a => a.username.toLowerCase() === username.toLowerCase());
    if (user) {
        user.balance = newBalance;
        localStorage.setItem("rrp_users", JSON.stringify(accs));
    }
}

const authModal = document.getElementById("authModal");
const openAuthBtn = document.getElementById("openAuthBtn");
const closeAuthModal = document.getElementById("closeAuthModal");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authAlert = document.getElementById("authAlert");

const userProfile = document.getElementById("userProfile");
const userName = document.getElementById("userName");
const userBadge = document.getElementById("userBadge");
const logoutBtn = document.getElementById("logoutBtn");
const adminNavTab = document.getElementById("adminNavTab");

function openAuthModal() { authModal.style.display = "flex"; }
openAuthBtn.onclick = openAuthModal;
closeAuthModal.onclick = () => { authModal.style.display = "none"; };

tabLogin.onclick = () => {
    tabLogin.classList.add("active"); tabRegister.classList.remove("active");
    loginForm.classList.remove("hidden"); registerForm.classList.add("hidden");
    authAlert.classList.add("hidden");
};

tabRegister.onclick = () => {
    tabRegister.classList.add("active"); tabLogin.classList.remove("active");
    registerForm.classList.remove("hidden"); loginForm.classList.add("hidden");
    authAlert.classList.add("hidden");
};

function loginUser(user) {
    localStorage.setItem("rrp_current_user", JSON.stringify(user));
    renderProfile();
    authModal.style.display = "none";
}

function updateBalanceDisplays() {
    const currentUser = JSON.parse(localStorage.getItem("rrp_current_user"));
    const bal = currentUser ? (currentUser.balance || 0).toLocaleString("ru-RU") : "0";
    
    document.getElementById("headerBalance").innerText = bal;
    const donateBalEl = document.getElementById("donatePageBalance");
    if (donateBalEl) donateBalEl.innerText = bal + " ₽";
}

function renderProfile() {
    const currentUser = JSON.parse(localStorage.getItem("rrp_current_user"));
    
    if (currentUser) {
        openAuthBtn.classList.add("hidden");
        userProfile.classList.remove("hidden");
        userName.innerText = currentUser.username;
        userBadge.innerText = currentUser.role || "Игрок";

        updateBalanceDisplays();

        if (currentUser.role === "Разработчик" || currentUser.username === "Danik") {
            userBadge.classList.add("dev");
            adminNavTab.classList.remove("hidden");
        } else {
            userBadge.classList.remove("dev");
            adminNavTab.classList.add("hidden");
        }
    } else {
        openAuthBtn.classList.remove("hidden");
        userProfile.classList.add("hidden");
        adminNavTab.classList.add("hidden");
        updateBalanceDisplays();
    }
}

loginForm.onsubmit = (e) => {
    e.preventDefault();
    const uVal = document.getElementById("loginUser").value.trim();
    const pVal = document.getElementById("loginPass").value.trim();
    const accs = getAccounts();
    const found = accs.find(acc => acc.username.toLowerCase() === uVal.toLowerCase() && acc.password === pVal);

    if (found) loginUser(found);
    else {
        authAlert.innerText = "Неверный никнейм или пароль!";
        authAlert.className = "auth-alert error";
        authAlert.classList.remove("hidden");
    }
};

registerForm.onsubmit = (e) => {
    e.preventDefault();
    const uVal = document.getElementById("regUser").value.trim();
    const pVal = document.getElementById("regPass").value.trim();
    const accs = getAccounts();
    if (accs.some(acc => acc.username.toLowerCase() === uVal.toLowerCase())) {
        authAlert.innerText = "Никнейм занят!";
        authAlert.className = "auth-alert error";
        authAlert.classList.remove("hidden");
        return;
    }
    
    const newUser = { username: uVal, password: pVal, role: "Игрок", balance: 10 };
    saveAccount(newUser);
    loginUser(newUser);
};

logoutBtn.onclick = () => {
    localStorage.removeItem("rrp_current_user");
    renderProfile();
};

// --- 4. ДОНАТ ПОКУПКИ С АНИМАЦИЕЙ КНОПОК ---
function buyDonateItem(btnEl, itemName, price) {
    const currentUser = JSON.parse(localStorage.getItem("rrp_current_user"));
    if (!currentUser) {
        openAuthModal();
        return;
    }

    if (btnEl.disabled) return;

    const currentBalance = currentUser.balance || 0;

    // Недостаточно денег -> Красная кнопка с анимацией Shake
    if (currentBalance < price) {
        btnEl.classList.add("no-money");
        const originalText = btnEl.innerText;
        btnEl.innerText = "❌ Недостаточно денег!";
        btnEl.disabled = true;

        setTimeout(() => {
            btnEl.classList.remove("no-money");
            btnEl.innerText = originalText;
            btnEl.disabled = false;
        }, 2200);
        return;
    }

    // Достаточно денег -> Зеленая кнопка с анимацией
    const newBalance = currentBalance - price;
    currentUser.balance = newBalance;
    localStorage.setItem("rrp_current_user", JSON.stringify(currentUser));
    updateAccountBalance(currentUser.username, newBalance);

    updateBalanceDisplays();

    btnEl.classList.add("bought");
    const originalText = btnEl.innerText;
    btnEl.innerText = "✓ Куплено!";
    btnEl.disabled = true;

    setTimeout(() => {
        btnEl.classList.remove("bought");
        btnEl.innerText = originalText;
        btnEl.disabled = false;
    }, 2200);
}

// --- 5. ФОРУМ ---
const defaultTopics = [
    {
        id: 1,
        title: "🔥 Добро пожаловать на официальный форум R-RP!",
        author: "Danik",
        role: "Разработчик",
        category: "📢 Новости",
        content: "Приветствуем всех игроков! Форум официально открыт. Здесь вы можете общаться, делиться идеями и следить за последними новостями разработки сервера.",
        date: "09.10.2026",
        comments: [
            { author: "Игрок_Арзамас", text: "Жду открытия! Карта бомба!", date: "09.10.2026" }
        ]
    }
];

function getTopics() {
    const list = localStorage.getItem("rrp_forum_topics");
    return list ? JSON.parse(list) : defaultTopics;
}

function saveTopics(topics) {
    localStorage.setItem("rrp_forum_topics", JSON.stringify(topics));
}

let activeCategory = "Все";
let activeTopicId = null;

document.querySelectorAll(".forum-cat-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".forum-cat-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeCategory = btn.getAttribute("data-cat");
        renderForumTopics();
    };
});

function renderForumTopics() {
    const container = document.getElementById("forumTopicsList");
    const topics = getTopics();

    const filtered = activeCategory === "Все" ? topics : topics.filter(t => t.category === activeCategory);

    if (filtered.length === 0) {
        container.innerHTML = "<p style='color:#666; text-align:center; padding: 20px;'>В этой категории пока нет тем.</p>";
        return;
    }

    container.innerHTML = "";
    filtered.forEach(topic => {
        const row = document.createElement("div");
        row.className = "topic-row";
        row.onclick = () => openViewTopicModal(topic.id);
        row.innerHTML = `
            <div>
                <div class="topic-title">${topic.title}</div>
                <div class="topic-meta">Автор: <span>${topic.author}</span> • Категория: ${topic.category} • Дата: ${topic.date}</div>
            </div>
            <div class="topic-comments-badge">💬 ${topic.comments ? topic.comments.length : 0}</div>
        `;
        container.appendChild(row);
    });
}

const newTopicModal = document.getElementById("newTopicModal");
const createTopicBtn = document.getElementById("createTopicBtn");
const closeTopicModal = document.getElementById("closeTopicModal");

createTopicBtn.onclick = () => {
    const currentUser = JSON.parse(localStorage.getItem("rrp_current_user"));
    if (!currentUser) {
        openAuthModal();
        return;
    }
    newTopicModal.style.display = "flex";
};
closeTopicModal.onclick = () => { newTopicModal.style.display = "none"; };

document.getElementById("newTopicForm").onsubmit = (e) => {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem("rrp_current_user"));
    if (!currentUser) return;

    const title = document.getElementById("topicTitle").value.trim();
    const category = document.getElementById("topicCategory").value;
    const content = document.getElementById("topicContent").value.trim();

    const newTopic = {
        id: Date.now(),
        title: title,
        author: currentUser.username,
        role: currentUser.role || "Игрок",
        category: category,
        content: content,
        date: new Date().toLocaleDateString("ru-RU"),
        comments: []
    };

    const topics = getTopics();
    topics.unshift(newTopic);
    saveTopics(topics);

    newTopicModal.style.display = "none";
    document.getElementById("newTopicForm").reset();
    renderForumTopics();
};

const viewTopicModal = document.getElementById("viewTopicModal");
const closeViewTopicModal = document.getElementById("closeViewTopicModal");

closeViewTopicModal.onclick = () => { viewTopicModal.style.display = "none"; };

function openViewTopicModal(topicId) {
    activeTopicId = topicId;
    const topics = getTopics();
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;

    document.getElementById("viewTopicContent").innerHTML = `
        <span style="background: rgba(0,255,136,0.15); color: #00ff88; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight:800;">${topic.category}</span>
        <h2 style="margin: 12px 0 6px 0; font-weight:900;">${topic.title}</h2>
        <div style="font-size: 13px; color: #777; margin-bottom: 20px;">Автор: <b style="color:#00ff88;">${topic.author}</b> (${topic.role}) • ${topic.date}</div>
        <p style="font-size: 16px; color: #ddd; white-space: pre-wrap; line-height: 1.6;">${topic.content}</p>
    `;

    renderComments(topic);
    viewTopicModal.style.display = "flex";
}

function renderComments(topic) {
    const list = document.getElementById("commentsList");
    document.getElementById("commentsCount").innerText = topic.comments ? topic.comments.length : 0;

    if (!topic.comments || topic.comments.length === 0) {
        list.innerHTML = "<p style='color:#666; font-size: 13px;'>Комментариев пока нет. Будьте первым!</p>";
        return;
    }

    list.innerHTML = "";
    topic.comments.forEach(c => {
        const item = document.createElement("div");
        item.className = "comment-card";
        item.innerHTML = `
            <div><span class="comment-author">${c.author}</span> <span class="comment-date">${c.date}</span></div>
            <div class="comment-text">${c.text}</div>
        `;
        list.appendChild(item);
    });
}

document.getElementById("addCommentForm").onsubmit = (e) => {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem("rrp_current_user"));
    if (!currentUser) {
        openAuthModal();
        return;
    }

    const text = document.getElementById("commentText").value.trim();
    if (!text || !activeTopicId) return;

    const topics = getTopics();
    const topic = topics.find(t => t.id === activeTopicId);
    if (!topic) return;

    if (!topic.comments) topic.comments = [];
    topic.comments.push({
        author: currentUser.username,
        text: text,
        date: new Date().toLocaleDateString("ru-RU")
    });

    saveTopics(topics);
    document.getElementById("commentText").value = "";
    renderComments(topic);
    renderForumTopics();
};

// --- 6. АДМИНКА (Danik) ---
function renderAdminUsers() {
    const listContainer = document.getElementById("adminUsersList");
    const accs = getAccounts();

    document.getElementById("adminTotalUsers").innerText = accs.length;

    listContainer.innerHTML = "";
    accs.forEach(acc => {
        const card = document.createElement("div");
        card.className = "user-admin-card";
        card.innerHTML = `
            <div>
                <b style="color: #00ff88;">👤 ${acc.username}</b> (${acc.role || 'Игрок'})
            </div>
            <div>
                Баланс: <b>${(acc.balance || 0).toLocaleString("ru-RU")} ₽</b>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

window.onclick = (e) => {
    if (e.target === authModal) authModal.style.display = "none";
    if (e.target === newTopicModal) newTopicModal.style.display = "none";
    if (e.target === viewTopicModal) viewTopicModal.style.display = "none";
};

// Запуск при старте
renderProfile();
renderForumTopics();