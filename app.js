// Твои ключи от дома (Supabase)
const supabaseUrl = 'https://utpozwhjvzhsonbkemlq.supabase.co'
const supabaseKey = 'sb_publishable_uiOs8EoSqyydQxiV3WSbrQ_pYCVXJJ6'
const supabase = supabase.createClient(supabaseUrl, supabaseKey)

// 1. ФУНКЦИЯ ВХОДА (Magic Link)
async function handleLogin() {
    const email = document.getElementById('emailInput').value
    if (!email) return alert('Бро, введи почту!')
    
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) alert('Ошибка: ' + error.message)
    else alert('Проверь почту! Ссылка уже там (загляни в спам на всякий).')
}

// 2. ФУНКЦИЯ ИЗМЕНЕНИЯ ИМЕНИ
async function updateNickname() {
    const newName = prompt("Как тебя называть в Nova Space?")
    if (!newName) return

    const { data, error } = await supabase.auth.updateUser({
        data: { display_name: newName }
    })

    if (error) alert("Ошибка: " + error.message)
    else {
        alert("Красивое имя, " + newName + "!");
        location.reload() // Обновляем, чтобы имя появилось в шапке
    }
}

// 3. ФУНКЦИЯ ОТПРАВКИ СООБЩЕНИЯ
async function send() {
    const input = document.getElementById('msgInput')
    const user = await supabase.auth.getUser()
    const userName = user.data.user.user_metadata.display_name || 'Аноним'

    if (!input.value) return

    const { error } = await supabase.from('messages').insert([
        { 
            content: input.value, 
            sender_name: userName,
            type: 'text' 
        }
    ])

    if (error) console.error('Не улетело:', error.message)
    else input.value = '' // Очищаем поле после отправки
}

// ЭТА МАГИЯ СЛЕДИТ ЗА ВХОДОМ
supabase.auth.onAuthStateChange(async (event, session) => {
    const authScreen = document.getElementById('authScreen')
    const chatScreen = document.getElementById('chatScreen')
    const userStatus = document.getElementById('userStatus')

    if (session) {
        // Если залогинились — прячем вход, показываем чат
        authScreen.classList.add('hidden')
        chatScreen.classList.remove('hidden')
        
        const name = session.user.user_metadata.display_name || "Нажми, чтобы дать имя"
        userStatus.innerText = name.toUpperCase()

        // Если имени еще нет, предложим ввести сразу
        if (!session.user.user_metadata.display_name) {
            updateNickname()
        }
    } else {
        // Если не вошли — показываем экран входа
        authScreen.classList.remove('hidden')
        chatScreen.classList.add('hidden')
    }
})