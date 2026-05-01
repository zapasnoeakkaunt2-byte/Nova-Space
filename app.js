const supabaseUrl = 'https://utpozwhjvzhsonbkemlq.supabase.co'
const supabaseKey = 'sb_publishable_uiOs8EoSqyydQxiV3WSbrQ_pYCVXJJ6'
const supabaseInstance = supabase.createClient(supabaseUrl, supabaseKey)

// 1. Отрисовка сообщения на экране
function renderMessage(msg, currentUser) {
    const messagesDiv = document.getElementById('messages');
    const isMine = msg.sender_name === (currentUser?.user_metadata?.display_name || 'Аноним');
    
    const msgHtml = `
        <div class="flex ${isMine ? 'justify-end' : 'justify-start'} mb-2">
            <div class="${isMine ? 'message-out' : 'message-in'} p-3 max-w-[80%]">
                <p class="text-[10px] opacity-50 font-bold mb-1">${msg.sender_name}</p>
                <p>${msg.content}</p>
            </div>
        </div>
    `;
    
    // Исправлено: используем appendChild вместо +=
    const msgEl = document.createElement('div');
    msgEl.innerHTML = msgHtml;
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Скролл вниз
}

// 2. Загрузка старых сообщений при входе
async function loadMessages(user) {
    try {
        const { data } = await supabaseInstance.from('messages').select('*').order('created_at', { ascending: true });
        
        // Исправлено: проверка на null
        if (!data) return console.error('Не удалось загрузить сообщения');
        
        document.getElementById('messages').innerHTML = '';
        data.forEach(m => renderMessage(m, user));
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error.message);
    }
}

// 3. ОТПРАВКА (Починил!)
async function send() {
    const input = document.getElementById('msgInput');
    const val = input.value.trim();
    if (!val) return;

    const { data: { user } } = await supabaseInstance.auth.getUser();
    if (!user) return alert('Войди в аккаунт!');

    const { error } = await supabaseInstance.from('messages').insert([
        { 
            content: val, 
            sender_name: user.user_metadata.display_name || 'Аноним', 
            type: 'text' 
        }
    ]);

    if (error) alert('Ошибка отправки: ' + error.message);
    else input.value = ''; // Очищаем поле только при успехе
}

// 4. ВХОД
async function handleLogin() {
    const email = document.getElementById('emailInput').value.trim();
    
    // Исправлено: проверка email
    if (!email) return alert('Введи почту!');
    if (!email.includes('@')) return alert('Это не похоже на email!');
    
    const { error } = await supabaseInstance.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert('Ссылка улетела на почту!');
}

// 5. РЕАЛЬНОЕ ВРЕМЯ (Слушаем базу данных)
supabaseInstance.channel('public:messages')
.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
    supabaseInstance.auth.getUser().then(({data}) => renderMessage(payload.new, data.user));
})
.subscribe();

// СЛЕЖКА ЗА СТАТУСОМ (Исправлено: добавлена логика выхода)
supabaseInstance.auth.onAuthStateChange(async (event, session) => {
    const authScreen = document.getElementById('authScreen');
    const chatScreen = document.getElementById('chatScreen');
    const userStatus = document.getElementById('userStatus');
    
    if (session) {
        // Если залогинились
        authScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
        userStatus.innerText = (session.user.user_metadata.display_name || 'ONLINE').toUpperCase();
        loadMessages(session.user);
    } else {
        // Если вышли (Исправлено!)
        authScreen.classList.remove('hidden');
        chatScreen.classList.add('hidden');
        document.getElementById('emailInput').value = '';
    }
});

async function updateNickname() {
    const name = prompt("Новый ник:");
    if (name && name.trim()) {
        try {
            await supabaseInstance.auth.updateUser({ data: { display_name: name.trim() } });
            alert('Ник изменён на: ' + name);
            location.reload();
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    }
}

// Функция выхода (Добавлено!)
async function logout() {
    await supabaseInstance.auth.signOut();
    alert('Ты вышел из аккаунта');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('hidden');
}