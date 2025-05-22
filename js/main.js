// Инициализация бургер-меню
document.addEventListener('DOMContentLoaded', function() {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav');
    
    if (burger && nav) {
        burger.addEventListener('click', function() {
            this.classList.toggle('active');
            nav.classList.toggle('active');
        });
    }
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav') && !e.target.closest('.burger')) {
            if (nav) nav.classList.remove('active');
            if (burger) burger.classList.remove('active');
        }
    });
    
    // Инициализация FAQ аккордеона
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', () => {
                // Закрываем все остальные элементы
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Открываем/закрываем текущий
                item.classList.toggle('active');
            });
        });
    }
    
    // Инициализация бегущей строки
    function initMarquee(marqueeId, text) {
        const marquee = document.getElementById(marqueeId);
        if (!marquee) return;
        
        const content = marquee.querySelector('.marquee-content');
        if (!content) return;
        
        // Создаем дубликаты текста для бесконечной анимации
        content.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const item = document.createElement('span');
            item.className = 'marquee-item';
            item.textContent = text;
            content.appendChild(item);
        }
        
        // Анимация
        let position = 0;
        const speed = 2;
        const contentWidth = content.offsetWidth;
        
        function animate() {
            position -= speed;
            
            if (position < -contentWidth/2) {
                position = 0;
            }
            
            content.style.transform = `translateX(${position}px)`;
            requestAnimationFrame(animate);
        }
        
        animate();
    }
    
    initMarquee('marquee1', 'UMBRELLA COFFEE');
    initMarquee('marquee2', 'UMBRELLA COFFEE');
});
