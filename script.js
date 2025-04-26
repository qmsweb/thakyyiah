class TypeWriter {
    constructor(text, element, onComplete) {
        this.text = text;
        this.element = element;
        this.onComplete = onComplete;
        this.currentIndex = 0;
        this.write();
    }

    write() {
        if (this.currentIndex < this.text.length) {
            this.element.textContent += this.text[this.currentIndex];
            this.currentIndex++;
            setTimeout(() => this.write(), 50);
        } else if (this.onComplete) {
            this.onComplete();
        }
    }
}

class VoiceAssistant {
    constructor() {
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.initSpeechRecognition();
        this.initElements();
        this.initResponsiveVoice();
        this.addWelcomeMessage();
    }

    initElements() {
        this.micButton = document.getElementById('micButton');
        this.statusText = document.getElementById('status');
        this.chatMessages = document.getElementById('chatMessages');

        this.micButton.addEventListener('click', () => this.toggleListening());
    }

    initResponsiveVoice() {
        // تأكد من تحميل ResponsiveVoice
        if (typeof responsiveVoice === 'undefined') {
            console.error('ResponsiveVoice not loaded');
            return;
        }

        // تهيئة ResponsiveVoice
        responsiveVoice.init();
    }

    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.lang = 'ar-SA';
            this.recognition.interimResults = false;

            this.recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                this.handleUserInput(text);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateMicButtonState();
            };
        } else {
            console.error('Speech recognition not supported');
        }
    }

    addWelcomeMessage() {
        const welcomeMessage = 'مرحباً! أنا ذكية، مساعدتك في علم النفس التربوي. اسألني عن الذكاء، نظريات التعلم، التحفيز، أو صعوبات التعلم';
        const messageElement = this.addMessage(welcomeMessage, 'assistant', true);
        
        new TypeWriter(welcomeMessage, messageElement, () => {
            // نطق رسالة الترحيب بعد اكتمال الكتابة
            this.speakResponse(welcomeMessage);
        });
    }

    toggleListening() {
        if (!this.isListening && !this.isSpeaking) {
            // إيقاف أي نطق جارٍ
            responsiveVoice.cancel();
            
            this.recognition?.start();
            this.isListening = true;
        } else {
            this.recognition?.stop();
            this.isListening = false;
        }
        this.updateMicButtonState();
    }

    updateMicButtonState() {
        this.micButton.className = 'mic-button' + 
            (this.isListening ? ' listening' : '') +
            (this.isSpeaking ? ' speaking' : '');
        this.statusText.textContent = this.isListening ? 
            'جاري الاستماع...' : 'انقر على الزر للتحدث';
    }

    handleUserInput(text) {
        this.addMessage(text, 'user');
        const response = this.generateResponse(text);
        const messageElement = this.addMessage(response, 'assistant', true);
        
        new TypeWriter(response, messageElement, () => {
            this.speakResponse(response);
        });
    }

    calculateSimilarity(str1, str2) {
        const words1 = str1.toLowerCase().split(' ');
        const words2 = str2.toLowerCase().split(' ');
        
        let matches = 0;
        for (const word1 of words1) {
            for (const word2 of words2) {
                if (word2.includes(word1) || word1.includes(word2)) {
                    matches++;
                }
            }
        }
        
        return matches / Math.max(words1.length, words2.length);
    }

    generateResponse(input) {
        const knowledgeBase = {
            "الذكاء": {
                keywords: ["ذكاء", "ذكي", "قدرات", "معرفي", "عقلي"],
                response: "الذكاء مفهوم متعدد الأبعاد يشمل القدرات المعرفية والعاطفية. يتضمن القدرة على التفكير المنطقي وحل المشكلات والتكيف مع المواقف الجديدة."
            },
            "نظريات التعلم": {
                keywords: ["نظرية", "نظريات", "تعلم", "سلوكية", "معرفية", "بنائية"],
                response: "أهم نظريات التعلم هي السلوكية (بافلوف وسكنر) والمعرفية (بياجيه) والبنائية (فيجوتسكي). كل نظرية تقدم فهماً مختلفاً لكيفية اكتساب المعرفة والمهارات."
            },
            "الذكاء العاطفي": {
                keywords: ["عاطفي", "عواطف", "مشاعر", "انفعالات", "تعاطف"],
                response: "الذكاء العاطفي هو القدرة على فهم وإدارة العواطف. يشمل خمسة أبعاد: الوعي الذاتي، التنظيم الذاتي، التحفيز، التعاطف، والمهارات الاجتماعية."
            },
            "صعوبات التعلم": {
                keywords: ["صعوبة", "صعوبات", "عسر", "قراءة", "كتابة", "حساب"],
                response: "صعوبات التعلم هي اضطرابات تؤثر على القدرة على التعلم، مثل عسر القراءة (الديسلكسيا) وعسر الكتابة (الديسغرافيا) وعسر الحساب (الديسكالكوليا). تتطلب تدخلاً تربوياً متخصصاً."
            },
            "التحفيز": {
                keywords: ["تحفيز", "دافعية", "حافز", "تشجيع", "دوافع"],
                response: "التحفيز هو عملية إثارة وتوجيه السلوك نحو هدف معين. يمكن تحفيز الطلاب من خلال: تحديد أهداف واضحة، التعزيز الإيجابي، ربط التعلم بالحياة الواقعية، وخلق بيئة تعليمية داعمة."
            }
        };

        let bestMatch = null;
        let highestSimilarity = 0;

        for (const [topic, data] of Object.entries(knowledgeBase)) {
            let titleSimilarity = this.calculateSimilarity(input, topic);
            
            let keywordSimilarity = data.keywords.reduce((max, keyword) => {
                const similarity = this.calculateSimilarity(input, keyword);
                return Math.max(max, similarity);
            }, 0);

            const totalSimilarity = Math.max(titleSimilarity, keywordSimilarity);

            if (totalSimilarity > highestSimilarity) {
                highestSimilarity = totalSimilarity;
                bestMatch = data.response;
            }
        }

        return highestSimilarity > 0.2 ? bestMatch : 
            "عذراً، لم أفهم سؤالك بشكل جيد. يمكنك السؤال عن: الذكاء، نظريات التعلم، الذكاء العاطفي، صعوبات التعلم، أو التحفيز";
    }

    addMessage(text, type, empty = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = empty ? '' : text;
        
        messageDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        return contentDiv;
    }

    speakResponse(text) {
        this.isSpeaking = true;
        this.updateMicButtonState();

        // استخدام ResponsiveVoice للنطق
        responsiveVoice.speak(text, "Arabic Female", {
            pitch: 1,
            rate: 0.9,
            onend: () => {
                this.isSpeaking = false;
                this.updateMicButtonState();
            }
        });
    }
}

// تهيئة المساعد عند تحميل الصفحة
window.addEventListener('load', () => {
    const assistant = new VoiceAssistant();
});
