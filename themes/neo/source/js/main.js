// Neo Theme - Main TypeScript Entry Point
// Dark mode and donation functionality
// Dark Mode Manager
class DarkModeManager {
    constructor() {
        this.storageKey = 'neo-theme-dark-mode';
        this.htmlElement = document.documentElement;
        this.init();
    }
    init() {
        // Check saved preference or system preference
        const savedTheme = localStorage.getItem(this.storageKey);
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme) {
            this.setTheme(savedTheme === 'dark');
        }
        else {
            this.setTheme(systemDark);
        }
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.storageKey)) {
                this.setTheme(e.matches);
            }
        });
        // Setup toggle button
        this.setupToggle();
    }
    setTheme(isDark) {
        this.htmlElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
    toggle() {
        const currentTheme = this.htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme === 'dark');
        localStorage.setItem(this.storageKey, newTheme);
    }
    setupToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    }
}
// Donation Modal Manager
class DonationManager {
    constructor() {
        this.modal = null;
        this.overlay = null;
        this.init();
    }
    init() {
        this.setupTriggers();
    }
    setupTriggers() {
        const triggers = document.querySelectorAll('[data-donation-trigger]');
        triggers.forEach(trigger => {
            trigger.addEventListener('click', () => this.openModal());
        });
        // Close on overlay click
        document.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.closeModal();
            }
        });
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    openModal() {
        if (!this.modal) {
            this.createModal();
        }
        if (this.modal && this.overlay) {
            this.modal.classList.add('active');
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    closeModal() {
        if (this.modal && this.overlay) {
            this.modal.classList.remove('active');
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    createModal() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'donation-overlay';
        document.body.appendChild(this.overlay);
        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = 'donation-modal';
        this.modal.innerHTML = `
      <div class="donation-modal-content">
        <button class="donation-close" aria-label="Close">&times;</button>
        <h3>支持作者</h3>
        <p>如果这篇文章对您有帮助，欢迎打赏支持</p>
        <div class="donation-tabs">
          <button class="donation-tab active" data-tab="alipay">支付宝</button>
          <button class="donation-tab" data-tab="wechat">微信支付</button>
        </div>
        <div class="donation-qr">
          <img src="/img/alipay_paycode.jpg" alt="支付宝" class="qr-alipay active">
          <img src="/img/wechat_paycode.jpg" alt="微信支付" class="qr-wechat">
        </div>
      </div>
    `;
        document.body.appendChild(this.modal);
        // Setup close button
        const closeBtn = this.modal.querySelector('.donation-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        // Setup tabs
        const tabs = this.modal.querySelectorAll('.donation-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.target;
                const tabName = target.getAttribute('data-tab');
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                target.classList.add('active');
                // Update QR code
                const qrAlipay = this.modal?.querySelector('.qr-alipay');
                const qrWechat = this.modal?.querySelector('.qr-wechat');
                if (tabName === 'alipay') {
                    qrAlipay?.classList.add('active');
                    qrWechat?.classList.remove('active');
                }
                else {
                    qrAlipay?.classList.remove('active');
                    qrWechat?.classList.add('active');
                }
            });
        });
    }
}
class TOCManager {
    constructor() {
        this.tocNav = document.querySelector('.toc-nav');
        this.headings = [];
        this.tocLinks = [];
        this.activeId = null;
        this.init();
    }
    init() {
        if (!this.tocNav) return;
        const article = document.querySelector('.prose');
        if (!article) return;
        this.headings = Array.from(article.querySelectorAll('h2[id], h3[id], h4[id]'));
        this.tocLinks = Array.from(this.tocNav.querySelectorAll('a[href^="#"]'));
        if (this.headings.length === 0 || this.tocLinks.length === 0) return;
        this.setupSmoothScroll();
        this.setupScrollSpy();
        this.updateActiveHeading();
    }
    setupSmoothScroll() {
        this.tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (!href) return;
                const id = decodeURIComponent(href.replace('#', ''));
                const target = document.getElementById(id);
                if (target) {
                    const headerOffset = 100;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    history.pushState(null, '', href);
                }
            });
        });
    }
    setupScrollSpy() {
        const observerOptions = {
            root: null,
            rootMargin: '-100px 0px -60% 0px',
            threshold: 0
        };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.setActiveLink(entry.target.id);
                }
            });
        }, observerOptions);
        this.headings.forEach(heading => {
            observer.observe(heading);
        });
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.updateActiveHeading();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }
    setActiveLink(id) {
        if (this.activeId === id) return;
        this.activeId = id;
        this.tocLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
                link.classList.add('active');
                const tocContainer = this.tocNav?.parentElement;
                if (tocContainer) {
                    const linkTop = link.offsetTop;
                    const containerScrollTop = tocContainer.scrollTop;
                    const containerHeight = tocContainer.clientHeight;
                    if (linkTop < containerScrollTop || linkTop > containerScrollTop + containerHeight - 40) {
                        link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            } else {
                link.classList.remove('active');
            }
        });
    }
    updateActiveHeading() {
        if (this.headings.length === 0) return;
        const scrollPos = window.pageYOffset + 120;
        let currentHeading = null;
        for (const heading of this.headings) {
            if (heading.offsetTop <= scrollPos) {
                currentHeading = heading;
            } else {
                break;
            }
        }
        if (!currentHeading && this.headings.length > 0) {
            currentHeading = this.headings[0];
        }
        if (currentHeading) {
            this.setActiveLink(currentHeading.id);
        }
    }
}
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DarkModeManager();
    new DonationManager();
    new TOCManager();
});
