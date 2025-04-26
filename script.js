// العناصر الرئيسية
const voiceBtn = document.getElementById('voiceBtn');
const statusEl = document.getElementById('status');
const conversationEl = document.getElementById('conversation');

// حالة التطبيق
let isListening = false;
let recognition;
let arabicVoice;

// قاعدة المعرفة
const knowledgeBase = {
    "الذكاء": "الذكاء مفهوم متعدد الأبعاد يشمل القدرات المعرفية والعاطفية. أهم نظريات الذكاء هي نظرية جاردنر للذكاءات المتعددة ونظرية سبيرمان للعامل العام.",
    "نظرية جاردنر": "نظرية الذكاءات المتعددة تقسم الذكاء إلى 8 أنواع: لغوي، منطقي-رياضي، مكاني، جسدي-حركي، موسيقي، بين شخصي، داخل شخصي، وطبيعي. طورها هوارد جاردنر عام 1983.",
    "الذكاء العاطفي": "هو القدرة على فهم وإدارة العواطف. يتكون من 5 عناصر: الوعي الذاتي، التنظيم الذاتي، التحفيز، التعاطف، والمهارات الاجتماعية.",
    "التعلم": "أفضل طرق التعلم تشمل: التكرار المتباعد، الممارسة المتغيرة، والاختبار الذاتي. حسب الأبحاث، هذه الطرق تحسن الاحتفاظ بالمعلومات بنسبة 50-70%.",
    "نظريات التعلم": "أهم نظريات التعلم هي: النظرية السلوكية (سكنر، بافلوف)، النظرية المعرفية (بياجيه)، والنظرية البنائية الاجتماعية (فيجوتسكي).",
    "اضطرابات التعلم": "هي صعوبات في اكتساب المهارات الأكاديمية مثل القراءة (عسر القراءة) أو الكتابة (عسر الكتابة) أو الحساب (عسر الحساب). تتطلب تدخلات تعليمية متخصصة.",
    "تحفيز الطلاب": "لتحفيز الطلاب: استخدم التعزيز الإيجابي، حدد أهدافًا واضحة، اجعل التعلم ممتعًا، واربط الدروس بحياتهم اليومية."
};

// تهيئة الأصوات
function initVoices() {
    return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            arabicVoice = voices.find(v => v.lang.includes('ar-SA') || 
                          voices.find(v => v.lang.includes('ar-EG')) ||
                          voices.find(v => v.name.includes('Arabic'));
            resolve();
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                arabicVoice = window.speechSynthesis.getVoices()
                    .find(v => v.lang.includes('ar-SA') || 
                    v.lang.includes('ar-EG') || 
                    v.name.includes('Arabic'));
                resolve();
            };
        }
    });
}

// دالة النطق
function speak(text) {
    return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
            console.error('Web Speech API غير مدعوم');
            resolve();
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        if (arabicVoice) {
            utterance.voice = arabicVoice;
        }

        utterance.onend = resolve;
        utterance.onerror = (e) => {
            console.error('خطأ في النطق:', e);
            resolve();
        };

        window.speechSynthesis.speak(utterance);
    });
}

// تهيئة التعرف الصوتي
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        throw new Error('المتصفح لا يدعم التعرف على الصوت');
    }
    
    recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
        isListening = true;
        voiceBtn.classList.add('active');
        statusEl.textContent = "جاري الاستماع...";
    };
    
    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript.trim();
        await handleUserCommand(transcript);
    };
    
    recognition.onerror = (event) => {
        console.error('حدث خطأ:', event.error);
        showError(getErrorMessage(event.error));
        resetState();
    };
    
    recognition.onend = () => {
        resetState();
    };
    
    return recognition;
}

// معالجة الأوامر
async function handleUserCommand(command) {
    try {
        addMessage(command, 'user');
        statusEl.textContent = "جاري المعالجة...";
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const response = generateResponse(command);
        addMessage(response, 'assistant');
        
        await speak(response);
        
    } catch (error) {
        console.error('حدث خطأ:', error);
        addMessage("حدث خطأ أثناء المعالجة", 'error');
    } finally {
        statusEl.textContent = "اضغط على الزر الأحمر للتحدث";
    }
}

// توليد الرد
function generateResponse(command) {
    command = command.toLowerCase();
    let bestMatch = null;
    let maxKeywords = 0;
    
    for (const [keyword, response] of Object.entries(knowledgeBase)) {
        const keywords = keyword.split(' ');
        const matchCount = keywords.filter(kw => command.includes(kw.toLowerCase())).length;
        
        if (matchCount > maxKeywords) {
            maxKeywords = matchCount;
            bestMatch = response;
        }
    }
    
    return bestMatch || "أسف، لا أملك معلومات عن هذا الموضوع. يمكنك سؤالي عن: الذكاء، نظريات التعلم، أو الذكاء العاطفي";
}

// إضافة رسالة للدردشة
function addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const messageClass = type === 'user' ? 'user-message' : 
                       type === 'error' ? 'error-message' : 'assistant-message';
    
    messageDiv.innerHTML = `<div class="${messageClass}">${text}</div>`;
    conversationEl.appendChild(messageDiv);
    conversationEl.scrollTop = conversationEl.scrollHeight;
}

// عرض الخطأ
function showError(message) {
    statusEl.textContent = message;
    statusEl.style.color = '#ff4757';
    setTimeout(() => {
        statusEl.textContent = "اضغط على الزر الأحمر للتحدث";
        statusEl.style.color = '#666';
    }, 3000);
}

// رسالة الخطأ
function getErrorMessage(error) {
    const errors = {
        'no-speech': 'لم يتم اكتشاف كلام',
        'audio-capture': 'لا يمكن الوصول للميكروفون',
        'not-allowed': 'تم رفض الإذن',
        'language-not-supported': 'اللغة غير مدعومة'
    };
    return errors[error] || 'حدث خطأ غير متوقع';
}

// إعادة تعيين الحالة
function resetState() {
    isListening = false;
    voiceBtn.classList.remove('active');
    statusEl.textContent = "اضغط على الزر الأحمر للتحدث";
    if (recognition) {
        recognition.stop();
    }
}

// حدث الضغط على الزر
voiceBtn.addEventListener('click', async () => {
    try {
        if (!isListening) {
            if (!recognition) {
                recognition = initSpeechRecognition();
            }
            
            await navigator.mediaDevices.getUserMedia({ audio: true });
            recognition.start();
        } else {
            resetState();
        }
    } catch (error) {
        console.error('حدث خطأ:', error);
        showError(error.message);
        resetState();
    }
});

// التهيئة الأولية
window.addEventListener('load', async () => {
    await initVoices();
    
    // رسالة ترحيبية عند أول نقرة
    voiceBtn.addEventListener('click', () => {
        if (!isListening) {
            speak("مرحباً، أنا ذكية. اضغط على الزر الأحمر وابدأ بالتحدث معي");
        }
    }, { once: true });
});
