const supabaseUrl = 'https://utpozwhjvzhsonbkemlq.supabase.co'
const supabaseKey = 'sb_publishable_uiOs8EoSqyydQxiV3WSbrQ_pYCVXJJ6'
const supabase = supabase.createClient(supabaseUrl, supabaseKey)

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
    messagesDiv.innerHTML += msgHtml;
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Скролл вниз
}

// 2. Загрузка старых сообщений при входе
async function loadMessages(user) {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    document.getElementById('messages').innerHTML = '';
    data.forEach(m => renderMessage(m, user));
}

// 3. ОТПРАВКА (Починил!)
async function send() {
    const input = document.getElementById('msgInput');
    const val = input.value.trim();
    if (!val) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Войди в аккаунт!');

    const { error } = await supabase.from('messages').insert([
        { 
            content: val, 
            sender_name: user.user_metadata.display_name || 'Аноним', 
            type: 'text' 
        }
    ]);

    if (error) alert('Ошибка отправки: ' + error.message);
    input.value = ''; // Очищаем поле
}

// 4. ВХОД
async function handleLogin() {
    const email = document.getElementById('emailInput').value;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert('Ссылка улетела на почту!');
}

// 5. РЕАЛЬНОЕ ВРЕМЯ (Слушаем базу данных)
supabase.channel('public:messages')
.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
    supabase.auth.getUser().then(({data}) => renderMessage(payload.new, data.user));
})
.subscribe();

// СЛЕЖКА ЗА СТАТУСОМ
supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('chatScreen').classList.remove('hidden');
        document.getElementById('userStatus').innerText = (session.user.user_metadata.display_name || 'ONLINE').toUpperCase();
        loadMessages(session.user);
    }
});

async function updateNickname() {
    const name = prompt("Новый ник:");
    if (name) {
        await supabase.auth.updateUser({ data: { display_name: name } });
        location.reload();
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('hidden');
}