/**
 * ReplyGuyz — JavaScript
 * GSAP animations, smooth scrolling, and interactive behaviors
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    
    // Initialize all modules
    initNavigation();
    initHeroAnimations();
    initScrollAnimations();
    initMarquee();
    initSmoothScroll();
});

/**
 * Navigation Module
 * Handles scroll effects and mobile menu toggle
 */
function initNavigation() {
    const nav = document.getElementById('nav');
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    // Scroll effect for navigation
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        
        // Add/remove scrolled class for shadow/border
        if (currentScrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        
        lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Mobile menu toggle
    if (mobileToggle && mobileMenu) {
        let isMenuOpen = false;
        
        mobileToggle.addEventListener('click', () => {
            isMenuOpen = !isMenuOpen;
            mobileMenu.classList.toggle('open', isMenuOpen);
            
            // Update icon
            const icon = mobileToggle.querySelector('[data-lucide]');
            if (icon) {
                icon.setAttribute('data-lucide', isMenuOpen ? 'x' : 'menu');
                lucide.createIcons();
            }
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = isMenuOpen ? 'hidden' : '';
        });
        
        // Close mobile menu on link click
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                isMenuOpen = false;
                mobileMenu.classList.remove('open');
                document.body.style.overflow = '';
                
                const icon = mobileToggle.querySelector('[data-lucide]');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    lucide.createIcons();
                }
            });
        });
    }
}

/**
 * Hero Animations
 * Staggered text reveal and parallax effect
 */
function initHeroAnimations() {
    const heroHeadline = document.getElementById('heroHeadline');
    const heroSubtext = document.getElementById('heroSubtext');
    const heroCta = document.getElementById('heroCta');
    const heroBg = document.getElementById('heroBg');
    
    if (!heroHeadline) return;
    
    // Split headline into words for staggered animation
    const text = heroHeadline.textContent;
    const words = text.split(' ');
    heroHeadline.innerHTML = words.map(word => 
        `<span class="word">${word}</span>`
    ).join(' ');
    
    // Hero entrance timeline
    const heroTl = gsap.timeline({
        defaults: { ease: 'power3.out' }
    });
    
    // Animate headline words
    heroTl.to('#heroHeadline .word', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.05,
        delay: 0.2
    });
    
    // Animate subtext
    if (heroSubtext) {
        heroTl.to(heroSubtext, {
            opacity: 1,
            y: 0,
            duration: 0.6
        }, '-=0.3');
    }
    
    // Animate CTA button
    if (heroCta) {
        heroTl.to(heroCta, {
            opacity: 1,
            y: 0,
            duration: 0.6
        }, '-=0.3');
    }
    
    // Parallax effect on hero background
    if (heroBg) {
        gsap.to('.hero-shape', {
            y: 100,
            ease: 'none',
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1
            }
        });
    }
}

/**
 * Scroll Animations
 * Reveal animations for cards and sections
 */
function initScrollAnimations() {
    // Case study cards
    const caseStudyCards = document.querySelectorAll('[data-card]');
    if (caseStudyCards.length) {
        gsap.to(caseStudyCards, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.case-studies',
                start: 'top 70%',
                toggleActions: 'play none none none'
            }
        });
    }
    
    // Service cards
    const serviceCards = document.querySelectorAll('[data-service]');
    if (serviceCards.length) {
        gsap.to(serviceCards, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.services',
                start: 'top 70%',
                toggleActions: 'play none none none'
            }
        });
    }
    
    // Process cards
    const processCards = document.querySelectorAll('[data-process]');
    if (processCards.length) {
        gsap.to(processCards, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.process',
                start: 'top 70%',
                toggleActions: 'play none none none'
            }
        });
    }
    
    // About section fade in
    const aboutContent = document.querySelector('.about-content');
    if (aboutContent) {
        gsap.from(aboutContent.children, {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.about',
                start: 'top 70%',
                toggleActions: 'play none none none'
            }
        });
    }
    
    // Trust section fade in
    const trustContent = document.querySelector('.trust-content');
    if (trustContent) {
        gsap.from(trustContent.children, {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.trust',
                start: 'top 70%',
                toggleActions: 'play none none none'
            }
        });
    }
    
    // CTA section fade in
    const ctaContent = document.querySelector('.cta-content');
    if (ctaContent) {
        gsap.from(ctaContent.children, {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.cta',
                start: 'top 70%',
                toggleActions: 'play none none none'
            }
        });
    }
}

/**
 * Marquee Animation
 * Smooth infinite horizontal scroll
 */
function initMarquee() {
    const marqueeTrack = document.getElementById('marqueeTrack');
    if (!marqueeTrack) return;
    
    // Pause marquee on hover
    const marqueeContents = marqueeTrack.querySelectorAll('.marquee-content');
    
    marqueeTrack.addEventListener('mouseenter', () => {
        marqueeContents.forEach(content => {
            content.style.animationPlayState = 'paused';
        });
    });
    
    marqueeTrack.addEventListener('mouseleave', () => {
        marqueeContents.forEach(content => {
            content.style.animationPlayState = 'running';
        });
    });
}

/**
 * Smooth Scroll
 * Smooth scrolling for anchor links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (!target) return;
            
            e.preventDefault();
            
            // Account for fixed nav height
            const navHeight = document.getElementById('nav').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
}

/**
 * Button Hover Effect
 * Arrow slide animation for CTA buttons
 */
document.querySelectorAll('.nav-cta, .hero-cta, .cta-button, .footer-cta-button').forEach(button => {
    button.addEventListener('mouseenter', function() {
        const icon = this.querySelector('i, svg');
        if (icon) {
            gsap.to(icon, {
                x: 4,
                duration: 0.25,
                ease: 'power2.out'
            });
        }
    });
    
    button.addEventListener('mouseleave', function() {
        const icon = this.querySelector('i, svg');
        if (icon) {
            gsap.to(icon, {
                x: 0,
                duration: 0.25,
                ease: 'power2.out'
            });
        }
    });
});

/**
 * Card Hover Effects
 * Lift and image zoom for case study cards
 */
document.querySelectorAll('.case-study-card').forEach(card => {
    const image = card.querySelector('img');
    
    card.addEventListener('mouseenter', () => {
        gsap.to(card, {
            y: -4,
            duration: 0.3,
            ease: 'power2.out'
        });
        
        if (image) {
            gsap.to(image, {
                scale: 1.02,
                duration: 0.4,
                ease: 'power2.out'
            });
        }
    });
    
    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            y: 0,
            duration: 0.3,
            ease: 'power2.out'
        });
        
        if (image) {
            gsap.to(image, {
                scale: 1,
                duration: 0.4,
                ease: 'power2.out'
            });
        }
    });
});

/**
 * Service Card Hover Effects
 * Image zoom for service cards
 */
document.querySelectorAll('.service-card').forEach(card => {
    const image = card.querySelector('.service-bg img');
    
    card.addEventListener('mouseenter', () => {
        if (image) {
            gsap.to(image, {
                scale: 1.05,
                duration: 0.4,
                ease: 'power2.out'
            });
        }
    });
    
    card.addEventListener('mouseleave', () => {
        if (image) {
            gsap.to(image, {
                scale: 1,
                duration: 0.4,
                ease: 'power2.out'
            });
        }
    });
});

/**
 * Process Card Hover Effects
 * Subtle lift effect
 */
document.querySelectorAll('.process-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        gsap.to(card, {
            y: -4,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            duration: 0.3,
            ease: 'power2.out'
        });
    });
    
    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            y: 0,
            boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
            duration: 0.3,
            ease: 'power2.out'
        });
    });
});

/**
 * Intersection Observer for progressive enhancement
 * Used as fallback for browsers without GSAP
 */
if (!window.gsap) {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    };
    
    const revealObserver = new IntersectionObserver(revealCallback, observerOptions);
    
    document.querySelectorAll('[data-card], [data-service], [data-process]').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        revealObserver.observe(el);
    });
}

/**
 * Performance: Cleanup ScrollTrigger on page unload
 */
window.addEventListener('beforeunload', () => {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
});

/**
 * Resize handler
 * Refresh ScrollTrigger on resize for accurate calculations
 */
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
    }, 250);
}, { passive: true });
