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
        const mobileToggleBtn = document.getElementById('theme-toggle-mobile');
        if (mobileToggleBtn) {
            mobileToggleBtn.addEventListener('click', () => this.toggle());
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
            rootMargin: '-80px 0px -70% 0px',
            threshold: 0
        };
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.setActiveLink(entry.target.id);
                }
            });
        }, observerOptions);
        this.headings.forEach(heading => {
            this.observer.observe(heading);
        });
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) return;
            scrollTimeout = window.setTimeout(() => {
                this.updateActiveHeading();
                scrollTimeout = undefined;
            }, 100);
        }, { passive: true });
    }
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
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
// Code Block Manager with header bar and actions
class CodeBlockManager {
    constructor() {
        this.init();
    }

    init() {
        const codeBlocks = document.querySelectorAll('.highlight');
        codeBlocks.forEach(block => {
            this.addHeader(block);
            this.wrapContent(block);
        });
    }

    addHeader(block) {
        if (block.querySelector('.code-header')) return;

        const lang = this.getLanguage(block);
        const header = document.createElement('div');
        header.className = 'code-header';

        const langSection = document.createElement('div');
        langSection.className = 'lang-section';

        const langLabel = document.createElement('span');
        langLabel.className = 'lang-label';
        langLabel.textContent = lang;

        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'collapse-btn';
        collapseBtn.setAttribute('aria-label', '折叠/展开代码');
        collapseBtn.setAttribute('data-tooltip', '折叠/展开');
        collapseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
        collapseBtn.addEventListener('click', () => this.toggleCollapse(block, collapseBtn));

        langSection.appendChild(langLabel);
        langSection.appendChild(collapseBtn);

        const actions = document.createElement('div');
        actions.className = 'code-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.setAttribute('aria-label', '复制代码');
        copyBtn.setAttribute('data-tooltip', '复制');
        copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        copyBtn.addEventListener('click', () => this.copyCode(block));

        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'fullscreen-btn';
        fullscreenBtn.setAttribute('aria-label', '全屏查看');
        fullscreenBtn.setAttribute('data-tooltip', '全屏');
        fullscreenBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>';
        fullscreenBtn.addEventListener('click', () => this.toggleFullscreen(block, fullscreenBtn));

        actions.appendChild(copyBtn);
        actions.appendChild(fullscreenBtn);

        header.appendChild(langSection);
        header.appendChild(actions);

        const feedback = document.createElement('span');
        feedback.className = 'copy-feedback';
        feedback.textContent = '已复制!';

        block.insertBefore(header, block.firstChild);
        block.appendChild(feedback);
    }

    wrapContent(block) {
        const content = block.querySelector('table, pre:not(.code-header ~ pre)');
        if (!content || content.parentElement.classList.contains('highlight-content')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'highlight-content';

        if (content.parentElement === block) {
            block.insertBefore(wrapper, content);
            wrapper.appendChild(content);
        }
    }

    getLanguage(block) {
        const dataLang = block.getAttribute('data-lang');
        if (dataLang) return dataLang;

        const blockClasses = block.className.split(' ');
        for (const cls of blockClasses) {
            if (cls.startsWith('lang-')) {
                return cls.replace('lang-', '');
            }
        }

        for (const cls of blockClasses) {
            if (cls.startsWith('highlight-') && cls !== 'highlight') {
                return cls.replace('highlight-', '');
            }
        }

        // Check for direct language class (e.g., "highlight pwsh" -> "pwsh")
        const nonHighlightClass = blockClasses.find(cls => cls && cls !== 'highlight');
        if (nonHighlightClass) {
            return nonHighlightClass;
        }

        const codeElement = block.querySelector('code');
        if (codeElement) {
            const codeClasses = codeElement.className.split(' ');
            for (const cls of codeClasses) {
                if (cls.startsWith('language-')) {
                    return cls.replace('language-', '');
                }
                if (cls.startsWith('lang-')) {
                    return cls.replace('lang-', '');
                }
            }
        }

        return 'code';
    }

    toggleCollapse(block, btn) {
        block.classList.toggle('collapsed');
        btn.classList.toggle('collapsed');
    }

    toggleFullscreen(block, btn) {
        const isFullscreen = block.classList.contains('fullscreen');

        if (isFullscreen) {
            block.classList.remove('fullscreen');
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>';
            btn.setAttribute('aria-label', '全屏查看');
            document.body.style.overflow = '';
        } else {
            block.classList.add('fullscreen');
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>';
            btn.setAttribute('aria-label', '退出全屏');
            document.body.style.overflow = 'hidden';

            const exitOnEscape = (e) => {
                if (e.key === 'Escape') {
                    this.toggleFullscreen(block, btn);
                    document.removeEventListener('keydown', exitOnEscape);
                }
            };
            document.addEventListener('keydown', exitOnEscape);
        }
    }

    getCodeText(block) {
        // Only get code from td.code pre, not from gutter (line numbers)
        const codeElement = block.querySelector('td.code pre');
        if (!codeElement) {
            // Fallback for code blocks without line numbers
            const pre = block.querySelector('.highlight-content pre');
            if (pre) {
                const clone = pre.cloneNode(true);
                clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
                return clone.textContent || '';
            }
            return '';
        }

        const clone = codeElement.cloneNode(true);
        clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
        return clone.textContent || '';
    }

    async copyCode(block) {
        const code = this.getCodeText(block);
        if (!code) return;

        const feedback = block.querySelector('.copy-feedback');
        const copyBtn = block.querySelector('.copy-btn');

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(code);
            } else {
                this.fallbackCopy(code);
            }
            this.showFeedback(feedback, copyBtn);
        } catch {
            this.showFeedback(feedback, copyBtn, '复制失败');
        }
    }

    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none;z-index:-1;';

        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, text.length);

        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    showFeedback(feedback, button, message = '已复制!') {
        if (!feedback) return;

        const originalText = feedback.textContent;
        feedback.textContent = message;
        feedback.classList.add('show');

        if (button) {
            button.style.opacity = '0.5';
        }

        setTimeout(() => {
            feedback.classList.remove('show');
            feedback.textContent = originalText;
            if (button) {
                button.style.opacity = '';
            }
        }, 2000);
    }
}
// Mobile TOC Toggle Manager
class MobileTOCManager {
    constructor() {
        this.toggleBtn = document.getElementById('toc-toggle');
        this.tocContent = document.getElementById('toc-mobile');
        this.tocIcon = document.getElementById('toc-icon');
        this.init();
    }
    init() {
        if (!this.toggleBtn || !this.tocContent) return;
        this.toggleBtn.addEventListener('click', () => this.toggle());
        this.setupLinkClose();
    }
    toggle() {
        const isHidden = this.tocContent.classList.contains('hidden');
        if (isHidden) {
            this.tocContent.classList.remove('hidden');
            this.tocIcon.style.transform = 'rotate(180deg)';
        } else {
            this.tocContent.classList.add('hidden');
            this.tocIcon.style.transform = 'rotate(0deg)';
        }
    }
    setupLinkClose() {
        const links = this.tocContent?.querySelectorAll('a');
        links?.forEach(link => {
            link.addEventListener('click', () => {
                this.tocContent.classList.add('hidden');
                this.tocIcon.style.transform = 'rotate(0deg)';
            });
        });
    }
}
// Reading Progress Manager
class ReadingProgressManager {
    constructor() {
        this.progressBar = document.getElementById('reading-progress');
        this.article = document.querySelector('.prose');
        this.init();
    }
    init() {
        if (!this.progressBar || !this.article) {
            this.progressBar.style.display = 'none';
            return;
        }
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        this.updateProgress();
    }
    updateProgress() {
        const articleRect = this.article.getBoundingClientRect();
        const articleTop = articleRect.top + window.pageYOffset;
        const articleHeight = this.article.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrolled = window.pageYOffset - articleTop + windowHeight / 2;
        const progress = Math.max(0, Math.min(100, (scrolled / articleHeight) * 100));
        this.progressBar.style.width = progress + '%';
    }
}
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DarkModeManager();
    new DonationManager();
    new TOCManager();
    new CodeBlockManager();
    new MobileTOCManager();
    new ReadingProgressManager();
});
