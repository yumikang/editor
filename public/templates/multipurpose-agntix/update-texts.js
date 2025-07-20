// Website Text Update System
// This script automatically updates website texts from JSON data

(function() {
    'use strict';

    // Check if there's saved text data in localStorage
    async function checkForUpdates() {
        // 먼저 localStorage 확인
        const savedTexts = localStorage.getItem('websiteTexts');
        const lastUpdate = localStorage.getItem('websiteTextsTimestamp');
        
        if (savedTexts) {
            try {
                const data = JSON.parse(savedTexts);
                console.log('Found saved text data from:', new Date(lastUpdate).toLocaleString('ko-KR'));
                applyTextUpdates(data);
                return;
            } catch (error) {
                console.error('Error parsing saved texts:', error);
            }
        }
        
        // localStorage에 없으면 JSON 파일 로드
        try {
            const response = await fetch('/website-texts-updated.json');
            if (response.ok) {
                const data = await response.json();
                console.log('Loaded text data from JSON file');
                applyTextUpdates(data);
                // localStorage에도 저장
                localStorage.setItem('websiteTexts', JSON.stringify(data));
                localStorage.setItem('websiteTextsTimestamp', new Date().toISOString());
            }
        } catch (error) {
            console.error('Error loading JSON file:', error);
        }
    }

    // Apply text updates to the page
    function applyTextUpdates(data) {
        let updateCount = 0;

        // Meta tags
        if (data.meta) {
            if (data.meta.title?.korean) {
                document.title = data.meta.title.korean;
                updateCount++;
            }
            if (data.meta.description?.korean) {
                const metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) {
                    metaDesc.content = data.meta.description.korean;
                    updateCount++;
                }
            }
        }

        // Navigation menu updates
        if (data.navigation?.main_menu) {
            // Main menu items
            document.querySelectorAll('.tp-header-menu a').forEach(link => {
                const text = link.textContent.trim();
                Object.entries(data.navigation.main_menu).forEach(([key, value]) => {
                    if (value.english === text && value.korean) {
                        link.textContent = value.korean;
                        updateCount++;
                    }
                });
            });
        }

        // Hero section updates
        if (data.hero_section) {
            // Main title - 특별 처리 필요 (이미지 포함)
            if (data.hero_section.main_title?.korean) {
                const heroTitle = document.querySelector('.tp-hero-title');
                if (heroTitle) {
                    // Digital Design Experience 형태로 되어있는 제목 처리
                    const titleParts = data.hero_section.main_title.korean.split(' ');
                    if (titleParts.length >= 3) {
                        heroTitle.innerHTML = `
                            <span>${titleParts[0]}</span> <br>
                            <span><img class="tp-hero-video d-none d-xl-inline-block" src="assets/img/home-01/hero/hero-video-1.jpg" alt="">${titleParts[1]}</span> ${titleParts.slice(2).join(' ')}
                        `;
                    } else {
                        heroTitle.innerHTML = data.hero_section.main_title.korean;
                    }
                    updateCount++;
                }
            }

            // Subtitle
            if (data.hero_section.subtitle?.korean) {
                const heroInfo = document.querySelector('.tp-hero-info p');
                if (heroInfo) {
                    // 줄바꿈 처리
                    heroInfo.innerHTML = data.hero_section.subtitle.korean.replace(/\\n/g, '<br>');
                    updateCount++;
                }
            }

            // CTA Button
            if (data.hero_section.cta_button?.korean) {
                const ctaButton = document.querySelector('.tp-hero-btn-text');
                if (ctaButton) {
                    ctaButton.textContent = data.hero_section.cta_button.korean;
                    updateCount++;
                }
            }

            // Testimonial
            if (data.hero_section.testimonial) {
                // Testimonial text
                if (data.hero_section.testimonial.text?.korean) {
                    const testimonialText = document.querySelector('.tp-testimonial-text p');
                    if (testimonialText) {
                        testimonialText.textContent = data.hero_section.testimonial.text.korean;
                        updateCount++;
                    }
                }
                
                // Author
                if (data.hero_section.testimonial.author?.korean) {
                    const authorName = document.querySelector('.tp-testimonial-name');
                    if (authorName) {
                        authorName.textContent = data.hero_section.testimonial.author.korean;
                        updateCount++;
                    }
                }
            }

            // Stats
            if (data.hero_section.stats) {
                // Projects completed
                if (data.hero_section.stats.projects_completed?.label?.korean) {
                    const projectsLabel = document.querySelector('.tp-hero-avater-info span');
                    if (projectsLabel && projectsLabel.textContent.includes('Projects Completed')) {
                        projectsLabel.innerHTML = data.hero_section.stats.projects_completed.label.korean;
                        updateCount++;
                    }
                }
            }
        }

        // About section
        if (data.about_section) {
            // Title
            if (data.about_section.title?.korean) {
                const aboutSubtitle = document.querySelector('.tp-section-subtitle.pre');
                if (aboutSubtitle && aboutSubtitle.textContent.includes('WHO WE ARE')) {
                    aboutSubtitle.textContent = data.about_section.title.korean;
                    updateCount++;
                }
            }

            // Description
            if (data.about_section.description?.korean) {
                const aboutText = document.querySelector('.tp-about-text p');
                if (aboutText) {
                    aboutText.innerHTML = data.about_section.description.korean.replace(/\\n/g, '<br>');
                    updateCount++;
                }
            }

            // Sub description
            if (data.about_section.sub_description?.korean) {
                const aboutParagraphs = document.querySelectorAll('.tp-about-text p');
                if (aboutParagraphs.length > 1) {
                    aboutParagraphs[1].textContent = data.about_section.sub_description.korean;
                    updateCount++;
                }
            }
        }

        // Text slider
        if (data.text_slider?.items) {
            const sliderItems = document.querySelectorAll('.tp-text-slider-title');
            data.text_slider.items.forEach((item, index) => {
                if (item.korean && sliderItems[index]) {
                    sliderItems[index].textContent = item.korean;
                    updateCount++;
                }
            });
        }

        // Services section
        if (data.services_section) {
            // Services list
            if (data.services_section.services) {
                // Web Design, Product Design 등의 서비스들
                document.querySelectorAll('.tp-service-content').forEach((serviceEl, index) => {
                    const service = data.services_section.services[index];
                    if (service) {
                        // Service title
                        const titleEl = serviceEl.querySelector('.tp-section-title a');
                        if (titleEl && service.title?.korean) {
                            titleEl.textContent = service.title.korean;
                            updateCount++;
                        }
                        
                        // Service description
                        const descEl = serviceEl.querySelector('p');
                        if (descEl && service.description?.korean) {
                            descEl.innerHTML = service.description.korean.replace(/\\n/g, '<br>');
                            updateCount++;
                        }
                        
                        // Service categories
                        const categoryEl = serviceEl.querySelector('.tp-service-category-text');
                        if (categoryEl && service.categories?.korean) {
                            categoryEl.textContent = service.categories.korean;
                            updateCount++;
                        }
                        
                        // Service button
                        const buttonEl = serviceEl.querySelector('.tp-btn-anim-border span');
                        if (buttonEl && service.button?.korean) {
                            buttonEl.textContent = service.button.korean;
                            updateCount++;
                        }
                    }
                });
            }
        }

        // Projects section
        if (data.projects_section) {
            // Section title
            if (data.projects_section.title?.korean) {
                const projectTitle = document.querySelector('.tp-project-title-pre');
                if (projectTitle) {
                    projectTitle.textContent = data.projects_section.title.korean;
                    updateCount++;
                }
            }

            // View all button
            if (data.projects_section.view_all?.korean) {
                const viewAllBtn = document.querySelector('.tp-btn-border span');
                if (viewAllBtn && viewAllBtn.textContent.includes('View all Works')) {
                    viewAllBtn.textContent = data.projects_section.view_all.korean;
                    updateCount++;
                }
            }

            // Cursor text
            if (data.projects_section.cursor_text?.korean) {
                const cursorText = document.querySelector('.tp-cursor-text-label');
                if (cursorText) {
                    cursorText.textContent = data.projects_section.cursor_text.korean;
                    updateCount++;
                }
            }
        }

        // Work process section
        if (data.work_process_section) {
            // Section title
            if (data.work_process_section.title?.korean) {
                const workTitle = document.querySelector('.tp-design-thinking-pre');
                if (workTitle) {
                    workTitle.textContent = data.work_process_section.title.korean;
                    updateCount++;
                }
            }

            // Section subtitle
            if (data.work_process_section.subtitle?.korean) {
                const workSubtitle = document.querySelector('.tp-section-title-1');
                if (workSubtitle && workSubtitle.textContent.includes('design thinking')) {
                    workSubtitle.textContent = data.work_process_section.subtitle.korean;
                    updateCount++;
                }
            }

            // Process steps
            if (data.work_process_section.steps) {
                const stepTitles = document.querySelectorAll('.tp-service-1-title');
                const stepDescriptions = document.querySelectorAll('.tp-service-1-content p');
                
                data.work_process_section.steps.forEach((step, index) => {
                    if (step.title?.korean && stepTitles[index]) {
                        stepTitles[index].textContent = step.title.korean;
                        updateCount++;
                    }
                    if (step.description?.korean && stepDescriptions[index]) {
                        stepDescriptions[index].textContent = step.description.korean;
                        updateCount++;
                    }
                });
            }
        }

        // Footer section
        if (data.footer_section) {
            // Footer title
            if (data.footer_section.title?.korean) {
                const footerTitle = document.querySelector('.tp-footer-cta-title-1');
                if (footerTitle) {
                    footerTitle.textContent = data.footer_section.title.korean;
                    updateCount++;
                }
            }

            // Quick links
            if (data.footer_section.quick_links) {
                // Quick links title
                const quickLinksTitle = document.querySelector('.tp-footer-widget-title');
                if (quickLinksTitle && data.footer_section.quick_links.title?.korean) {
                    quickLinksTitle.textContent = data.footer_section.quick_links.title.korean;
                    updateCount++;
                }

                // Individual links
                if (data.footer_section.quick_links.links) {
                    document.querySelectorAll('.tp-footer-widget-content ul li a').forEach(link => {
                        const text = link.textContent.trim();
                        Object.entries(data.footer_section.quick_links.links).forEach(([key, value]) => {
                            if (value.english === text && value.korean) {
                                link.textContent = value.korean;
                                updateCount++;
                            }
                        });
                    });
                }
            }

            // Contact info
            if (data.footer_section.contact) {
                // Email
                if (data.footer_section.contact.email?.korean) {
                    const emailLink = document.querySelector('a[href^="mailto:"]');
                    if (emailLink) {
                        emailLink.textContent = data.footer_section.contact.email.korean;
                        emailLink.href = `mailto:${data.footer_section.contact.email.korean}`;
                        updateCount++;
                    }
                }

                // Phone
                if (data.footer_section.contact.phone?.korean) {
                    const phoneLink = document.querySelector('a[href^="tel:"]');
                    if (phoneLink) {
                        phoneLink.textContent = data.footer_section.contact.phone.korean;
                        updateCount++;
                    }
                }

                // Address
                if (data.footer_section.contact.address?.korean) {
                    const addressLinks = document.querySelectorAll('.tp-footer-widget-link a');
                    addressLinks.forEach(link => {
                        if (link.textContent.includes('Washington Ave')) {
                            link.textContent = data.footer_section.contact.address.korean;
                            updateCount++;
                        }
                    });
                }
            }

            // Copyright
            if (data.footer_section.copyright) {
                const copyrightText = document.querySelector('.tp-copyright-text p');
                if (copyrightText && data.footer_section.copyright.text?.korean) {
                    copyrightText.textContent = data.footer_section.copyright.text.korean;
                    updateCount++;
                }
            }
        }

        // Buttons
        if (data.buttons) {
            // Start a Project button
            const startProjectBtns = document.querySelectorAll('.tp-btn-anim span');
            startProjectBtns.forEach(btn => {
                if (btn.textContent === 'Start a Project' && data.buttons.get_started?.korean) {
                    btn.textContent = data.buttons.get_started.korean;
                    updateCount++;
                }
            });

            // More buttons
            const moreBtns = document.querySelectorAll('a');
            moreBtns.forEach(btn => {
                if (btn.textContent.trim() === 'More' && data.buttons.more?.korean) {
                    btn.textContent = data.buttons.more.korean;
                    updateCount++;
                }
            });
        }

        console.log(`✅ Updated ${updateCount} text elements`);
        
        // Add visual indicator
        if (updateCount > 0) {
            showUpdateNotification(updateCount);
        }
    }

    // Show update notification
    function showUpdateNotification(count) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `✅ ${count}개의 텍스트가 업데이트되었습니다!`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkForUpdates);
    } else {
        checkForUpdates();
    }

    // Listen for storage events (updates from other tabs)
    window.addEventListener('storage', (e) => {
        if (e.key === 'websiteTexts' && e.newValue) {
            console.log('Detected text update from another tab');
            try {
                const data = JSON.parse(e.newValue);
                applyTextUpdates(data);
            } catch (error) {
                console.error('Error applying updates:', error);
            }
        }
    });

    // BroadcastChannel로 즉시 업데이트 받기
    if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('website-updates');
        channel.addEventListener('message', (e) => {
            if (e.data.type === 'update-texts' && e.data.data) {
                console.log('Received instant update via BroadcastChannel');
                applyTextUpdates(e.data.data);
            }
        });
    }

    // Expose global function for manual updates
    window.updateWebsiteTexts = function(jsonData) {
        if (typeof jsonData === 'string') {
            try {
                jsonData = JSON.parse(jsonData);
            } catch (error) {
                console.error('Invalid JSON data:', error);
                return false;
            }
        }
        
        localStorage.setItem('websiteTexts', JSON.stringify(jsonData));
        localStorage.setItem('websiteTextsTimestamp', new Date().toISOString());
        applyTextUpdates(jsonData);
        return true;
    };

})();