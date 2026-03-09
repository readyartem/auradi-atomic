document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Update ScrollTrigger on Lenis scroll
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time)=>{
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0, 0);

    // 2. Custom Cursor Logic
    const cursor = document.querySelector('.cursor');
    const cursorText = document.createElement('span');
    cursor.appendChild(cursorText);
    
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if(cursor.style.opacity === '0' || cursor.style.opacity === '') {
            gsap.to(cursor, { opacity: 1, duration: 0.3 });
        }
    });

    // Smooth follow loop
    gsap.ticker.add(() => {
        // Linear interpolation for smooth trailing
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;
        cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    });

    // Hover elements interactions & Magnetic Logic
    const interactiveElements = document.querySelectorAll('a, button, [data-hover]');
    const magneticElements = document.querySelectorAll('[data-magnetic]');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            const hoverText = el.getAttribute('data-cursor-text') || el.getAttribute('data-hover');
            if (hoverText) {
                cursorText.textContent = hoverText;
                cursor.classList.add('text-active');
            } else {
                cursor.classList.add('active');
            }
        });
        
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('active');
            cursor.classList.remove('text-active');
            cursorText.textContent = '';
        });
    });

    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            gsap.to(el, {
                x: x * 0.4,
                y: y * 0.4,
                duration: 0.4,
                ease: 'power2.out'
            });
        });

        el.addEventListener('mouseleave', () => {
            gsap.to(el, {
                x: 0,
                y: 0,
                duration: 0.7,
                ease: 'elastic.out(1, 0.3)'
            });
        });
    });

    // 2.5 Rolling Text Splitting
    const rollingTexts = document.querySelectorAll('.rolling-text');
    rollingTexts.forEach(el => {
        const text = el.getAttribute('data-text');
        el.innerHTML = ''; // Clear existing
        
        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'char';
            span.innerHTML = char === ' ' ? '&nbsp;' : char;
            span.setAttribute('data-char', char === ' ' ? '&nbsp;' : char);
            span.style.setProperty('--char-index', index);
            el.appendChild(span);
        });
        // Hover animation is now handled by pure CSS transitions
    });

    // 2.8 Preloader Sequence
    const preloader = document.querySelector('.preloader');
    const preloaderText = document.querySelector('.preloader-text');
    const preloaderCounter = document.querySelector('.preloader-counter');
    const heroContent = document.querySelector('.hero-content');
    const heroScroll = document.querySelector('.scroll-indicator');

    lenis.stop(); // Disable scrolling during preloader

    const tlPreloader = gsap.timeline({
        onComplete: () => {
            preloader.style.display = 'none';
        }
    });

    // Animate counter 0-100
    let counterObj = { value: 0 };
    tlPreloader.to(counterObj, {
        value: 100,
        duration: 2,
        ease: 'power4.inOut',
        onUpdate: () => {
            preloaderCounter.textContent = Math.round(counterObj.value) + '%';
        }
    }, 0)
    // Reveal Preloader Text
    .to(preloaderText, {
        y: '0%',
        duration: 1,
        ease: 'power4.out'
    }, 0.5)
    // Hide Preloader Layer
    .to(preloader, {
        yPercent: -100,
        duration: 1.2,
        ease: 'power4.inOut'
    }, 2.2)
    .add(() => lenis.start(), 2.8)
    // Drop in Hero Content (overriding the CSS animation)
    .fromTo(heroContent, 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.5, ease: 'power4.out' },
        "-=0.6"
    )
    .fromTo(heroScroll, 
        { y: 20, x: '-50%', opacity: 0 },
        { y: 0, x: '-50%', opacity: 1, duration: 1.5, ease: 'power4.out' },
        "-=1"
    );

    // 3. Navigation Overlay Animation
    const menuToggle = document.querySelector('.menu-toggle');
    const navOverlay = document.querySelector('.nav-overlay');
    const navLinks = document.querySelectorAll('.nav-link span');
    
    let isNavOpen = false;
    
    // Timeline for Navigation
    const navTl = gsap.timeline({ paused: true });
    
    navTl.to(navOverlay, {
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        autoAlpha: 1,
        duration: 0.8,
        ease: 'power3.inOut'
    })
    .to(navLinks, {
        y: '0%',
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out'
    }, "-=0.4");

    menuToggle.addEventListener('click', () => {
        isNavOpen = !isNavOpen;
        document.body.classList.toggle('nav-open');
        
        if (isNavOpen) {
            lenis.stop(); // Disable scroll
            navTl.play();
        } else {
            lenis.start(); // Enable scroll
            navTl.reverse();
        }
    });

    // Close nav when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if(isNavOpen) {
                isNavOpen = false;
                document.body.classList.remove('nav-open');
                lenis.start();
                navTl.reverse();
            }
        });
    });

    // 4. Split Text Animation (Custom Implementation since Club GSAP SplitText is premium)
    // We split elements with class .split-text into line/word spans for animation
    const splitTextElements = document.querySelectorAll('.split-text');
    
    splitTextElements.forEach(elem => {
        // Very basic split by words, wrapped in overflow hidden masks
        const text = elem.innerText;
        const words = text.split(' ');
        elem.innerHTML = '';
        
        words.forEach(word => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'line-mask';
            
            const innerSpan = document.createElement('div');
            innerSpan.innerText = word + '\u00A0'; // Add space
            
            wordSpan.appendChild(innerSpan);
            elem.appendChild(wordSpan);
        });

        // Setup ScrollTrigger for fade up
        gsap.fromTo(elem.querySelectorAll('div'), 
            { y: '100%' },
            {
                y: '0%',
                duration: 1.2,
                stagger: 0.03,
                ease: 'power4.out',
                scrollTrigger: {
                    trigger: elem,
                    start: 'top 85%',
                }
            }
        );
    });

    // Fade up other elements simply
    const fadeElements = document.querySelectorAll('.product-card, .project-item, .showroom-content > p');
    fadeElements.forEach(elem => {
        gsap.fromTo(elem,
            { y: 80, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1.2,
                ease: 'power4.out',
                scrollTrigger: {
                    trigger: elem,
                    start: 'top 85%',
                }
            }
        );
    });

    // 5. Media Reveal Clip-Path Expansion
    const mediaReveal = document.querySelector('.media-inner');
    if (mediaReveal) {
        gsap.to(mediaReveal, {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            ease: 'none',
            scrollTrigger: {
                trigger: '.media-reveal',
                start: 'top 70%',
                end: 'top 20%',
                scrub: 1,
            }
        });
    }

    // 6. Parallax Effects
    const parallaxImages = document.querySelectorAll('.parallax-img');
    parallaxImages.forEach(img => {
        gsap.to(img, {
            yPercent: 15, // Move image down slightly as we scroll down
            ease: 'none',
            scrollTrigger: {
                trigger: img.parentElement,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });
    });

    // Hero background parallax
    gsap.to('.hero-bg', {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        }
    });

    // 7. Testimonials Carousel
    const slides = document.querySelectorAll('.testimonial-slide');
    const slideNum = document.querySelector('.slide-num');
    let currentSlide = 0;
    const totalSlides = slides.length;

    if (slides.length > 0) {
        slideNum.textContent = `01 / 0${totalSlides}`;
        
        // Simple interval rotation
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            
            currentSlide = (currentSlide + 1) % totalSlides;
            
            slides[currentSlide].classList.add('active');
            slideNum.textContent = `0${currentSlide + 1} / 0${totalSlides}`;
        }, 5000);
    }
});
