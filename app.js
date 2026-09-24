/**
 * TALABOX — Interactive Engine
 * 3D Frame Sequence Canvas Viewer (240 Frames), Eco Calculator, Accordion FAQs, & Sample Modal
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. 3D FRAME SEQUENCE CANVAS VIEWER (240 FRAMES)
  // ==========================================================================
  const TOTAL_FRAMES = 240;
  const canvas = document.getElementById('box-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const viewport = document.getElementById('canvas-viewport');
  const frameDisplay = document.getElementById('frame-num-display');
  const frameSlider = document.getElementById('frame-slider');
  const loader = document.getElementById('canvas-loader');
  const loadProgress = document.getElementById('load-progress');
  const dragHint = document.getElementById('drag-hint');
  const playToggleBtn = document.getElementById('btn-play-toggle');
  const playIcon = document.getElementById('play-icon');
  const playText = document.getElementById('play-text');
  const openBoxBtn = document.getElementById('btn-open-box');
  const resetViewBtn = document.getElementById('btn-reset-view');

  const frames = [];
  let currentFrameIndex = 1; // 1-indexed (1 to 240)
  let isPlaying = false;
  let playAnimationId = null;
  let isDragging = false;
  let startX = 0;
  let startFrame = 1;
  let loadedCount = 0;

  // Helper to format frame filename: BOX/ezgif-frame-001.jpg
  function getFrameSrc(index) {
    const padded = String(index).padStart(3, '0');
    return `BOX/ezgif-frame-${padded}.jpg`;
  }

  // Draw specific frame to canvas
  function renderFrame(index) {
    if (!ctx || !canvas) return;
    const img = frames[index];
    if (img && img.complete && img.naturalWidth > 0) {
      // Clear and draw with aspect ratio containment
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const hRatio = canvas.width / img.naturalWidth;
      const vRatio = canvas.height / img.naturalHeight;
      const ratio = Math.min(hRatio, vRatio);

      const centerShiftX = (canvas.width - img.naturalWidth * ratio) / 2;
      const centerShiftY = (canvas.height - img.naturalHeight * ratio) / 2;

      ctx.drawImage(
        img,
        0, 0, img.naturalWidth, img.naturalHeight,
        centerShiftX, centerShiftY, img.naturalWidth * ratio, img.naturalHeight * ratio
      );
    }

    currentFrameIndex = index;

    // Update display counter & slider
    if (frameDisplay) {
      frameDisplay.textContent = String(index).padStart(3, '0');
    }
    if (frameSlider && document.activeElement !== frameSlider) {
      frameSlider.value = index;
    }
  }

  // Set frame with boundary wrapping
  function setFrame(newIndex) {
    let target = newIndex;
    if (target > TOTAL_FRAMES) target = 1;
    if (target < 1) target = TOTAL_FRAMES;
    renderFrame(target);
  }

  // Preload initial batch, then remaining frames in background
  function initSequence() {
    if (!canvas) return;

    // First image for instant preview
    const firstImg = new Image();
    firstImg.src = getFrameSrc(1);
    frames[1] = firstImg;

    firstImg.onload = () => {
      renderFrame(1);
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.classList.add('hidden'), 300);
      }
      // Load rest of frames progressively
      loadRemainingFrames();
    };

    firstImg.onerror = () => {
      // Fallback if local path issue
      if (loader) loader.classList.add('hidden');
    };
  }

  function loadRemainingFrames() {
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameSrc(i);
      img.onload = () => {
        loadedCount++;
        if (loadProgress) {
          const pct = Math.round((loadedCount / (TOTAL_FRAMES - 1)) * 100);
          loadProgress.textContent = `${pct}%`;
        }
      };
      frames[i] = img;
    }
  }

  // Auto-play loop
  function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
      if (playIcon) playIcon.textContent = '⏸';
      if (playText) playText.textContent = 'Jeda';
      animateSequence();
    } else {
      if (playIcon) playIcon.textContent = '▶';
      if (playText) playText.textContent = 'Putar 360°';
      if (playAnimationId) cancelAnimationFrame(playAnimationId);
    }
  }

  let lastTimestamp = 0;
  const FPS = 24;
  const frameInterval = 1000 / FPS;

  function animateSequence(timestamp) {
    if (!isPlaying) return;

    if (!lastTimestamp) lastTimestamp = timestamp || 0;
    const delta = (timestamp || 0) - lastTimestamp;

    if (delta > frameInterval) {
      lastTimestamp = timestamp || 0;
      let nextFrame = currentFrameIndex + 1;
      if (nextFrame > TOTAL_FRAMES) nextFrame = 1;
      renderFrame(nextFrame);
    }

    playAnimationId = requestAnimationFrame(animateSequence);
  }

  // Unbox transition demo (animate from current frame to open position ~frame 120)
  function triggerUnboxDemo() {
    if (isPlaying) togglePlay(); // pause normal rotation

    const targetFrame = currentFrameIndex < 90 ? 120 : 1;
    const step = currentFrameIndex < targetFrame ? 2 : -2;

    function stepToTarget() {
      if ((step > 0 && currentFrameIndex < targetFrame) || (step < 0 && currentFrameIndex > targetFrame)) {
        renderFrame(currentFrameIndex + step);
        requestAnimationFrame(stepToTarget);
      } else {
        renderFrame(targetFrame);
      }
    }
    requestAnimationFrame(stepToTarget);
  }

  // Drag / Swipe handling
  if (viewport) {
    function startDrag(clientX) {
      isDragging = true;
      startX = clientX;
      startFrame = currentFrameIndex;
      if (isPlaying) togglePlay();
      if (dragHint) dragHint.style.opacity = '0';
    }

    function moveDrag(clientX) {
      if (!isDragging) return;
      const deltaX = clientX - startX;
      // sensitivity: 4 pixels per frame
      const frameDelta = Math.round(deltaX / 4);
      let newFrame = startFrame + frameDelta;

      while (newFrame > TOTAL_FRAMES) newFrame -= TOTAL_FRAMES;
      while (newFrame < 1) newFrame += TOTAL_FRAMES;

      renderFrame(newFrame);
    }

    function endDrag() {
      isDragging = false;
    }

    // Mouse events
    viewport.addEventListener('mousedown', (e) => startDrag(e.clientX));
    window.addEventListener('mousemove', (e) => moveDrag(e.clientX));
    window.addEventListener('mouseup', endDrag);

    // Touch events
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) startDrag(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) moveDrag(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchend', endDrag);
  }

  // Slider events
  if (frameSlider) {
    frameSlider.addEventListener('input', (e) => {
      if (isPlaying) togglePlay();
      if (dragHint) dragHint.style.opacity = '0';
      renderFrame(parseInt(e.target.value, 10));
    });
  }

  // Buttons
  if (playToggleBtn) playToggleBtn.addEventListener('click', togglePlay);
  if (openBoxBtn) openBoxBtn.addEventListener('click', triggerUnboxDemo);
  if (resetViewBtn) {
    resetViewBtn.addEventListener('click', () => {
      if (isPlaying) togglePlay();
      renderFrame(1);
    });
  }

  // Run 3D sequence initialization
  initSequence();

  // ==========================================================================
  // 2. FAQ ACCORDION LOGIC
  // ==========================================================================
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // Close all others for crisp accordion feel
      accordionItems.forEach(other => {
        other.classList.remove('active');
      });

      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });

  // ==========================================================================
  // 3. SAMPLE RESERVATION MODAL LOGIC
  // ==========================================================================
  const bookingModal = document.getElementById('booking-modal');
  const modalClose = document.getElementById('modal-close');
  const bookingForm = document.getElementById('booking-form');
  const bookingSuccess = document.getElementById('booking-success');
  const clientPlanSelect = document.getElementById('client-plan');

  const navBtnReserve = document.getElementById('nav-btn-reserve');
  const heroBtnReserve = document.getElementById('hero-btn-reserve');
  const finalBtnReserve = document.getElementById('final-btn-reserve');
  const selectPlanBtns = document.querySelectorAll('.select-plan-btn');

  function openModal(preferredPlan) {
    if (!bookingModal) return;
    if (preferredPlan && clientPlanSelect) {
      if (preferredPlan.includes('Meal') || preferredPlan.includes('L')) {
        clientPlanSelect.value = 'TalaBox Meal Box (L)';
      } else if (preferredPlan.includes('Snack') || preferredPlan.includes('M')) {
        clientPlanSelect.value = 'TalaBox Snack (M)';
      }
    }
    bookingModal.classList.add('active');
    bookingModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!bookingModal) return;
    bookingModal.classList.remove('active');
    bookingModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Bind opening triggers
  [navBtnReserve, heroBtnReserve, finalBtnReserve].forEach(btn => {
    if (btn) btn.addEventListener('click', () => openModal('TalaBox Meal Box (L)'));
  });

  selectPlanBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.getAttribute('data-plan');
      openModal(plan);
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);

  if (bookingModal) {
    bookingModal.addEventListener('click', (e) => {
      if (e.target === bookingModal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      bookingForm.classList.add('hidden');
      if (bookingSuccess) bookingSuccess.classList.remove('hidden');

      setTimeout(() => {
        closeModal();
        setTimeout(() => {
          bookingForm.reset();
          bookingForm.classList.remove('hidden');
          if (bookingSuccess) bookingSuccess.classList.add('hidden');
        }, 400);
      }, 3500);
    });
  }

  // ==========================================================================
  // ==========================================================================
  // 5. MOBILE NAVIGATION TOGGLE
  // ==========================================================================
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('nav-open');
    });
  }

  // ==========================================================================
  // 6. LENIS SMOOTH SCROLL & GSAP SCROLLTRIGGER INTEGRATION
  // ==========================================================================
  let lenisInstance = null;

  if (typeof Lenis !== 'undefined') {
    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      // Synchronize Lenis with GSAP ScrollTrigger
      lenisInstance.on('scroll', ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenisInstance.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenisInstance.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  // ==========================================================================
  // 7. HORIZONTAL SCROLL ANIMATION (RUPZ WEB CONCEPT: GSAP & LENIS)
  // ==========================================================================
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    const mm = gsap.matchMedia();

    // Desktop: Pinned Horizontal Scroll
    mm.add("(min-width: 993px)", () => {
      const track = document.getElementById('bathbomb-track');
      const pinWrapper = document.querySelector('.horizontal-pin-wrapper');
      const progressBar = document.getElementById('catalog-progress');
      const variantNum = document.getElementById('current-variant-num');

      if (!track || !pinWrapper) return;

      // Calculate total horizontal translation distance
      const getScrollAmount = () => {
        return track.scrollWidth - window.innerWidth + 120;
      };

      // Main Horizontal Tween driven by ScrollTrigger
      const horizontalTween = gsap.to(track, {
        x: () => -getScrollAmount(),
        ease: "none",
        scrollTrigger: {
          trigger: pinWrapper,
          start: "top top",
          end: () => `+=${getScrollAmount()}`,
          pin: true,
          pinSpacing: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (progressBar) {
              progressBar.style.width = `${Math.min(100, Math.max(0, self.progress * 100))}%`;
            }
            if (variantNum) {
              const idx = Math.min(3, Math.floor(self.progress * 3) + 1);
              variantNum.textContent = `0${idx}`;
            }
          },
        },
      });

      // Rupz Web effect: Interactive scaling & parallax on cards as they glide across
      const cards = track.querySelectorAll('.bathbomb-item');
      cards.forEach((card) => {
        const photo = card.querySelector('.bathbomb-photo-card');
        if (photo) {
          gsap.fromTo(
            photo,
            { scale: 0.95, rotate: -1 },
            {
              scale: 1.03,
              rotate: 1,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                containerAnimation: horizontalTween,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            }
          );
        }
      });
    });

    // Mobile & Tablet (< 993px): Interactive touch pills & smooth sync
    const trackContainer = document.querySelector('.horizontal-track-container');
    const progressBar = document.getElementById('catalog-progress');
    const variantNum = document.getElementById('current-variant-num');
    const mTabBtns = document.querySelectorAll('.m-tab-btn');
    const variantItems = document.querySelectorAll('.bathbomb-item');

    if (mTabBtns.length > 0 && trackContainer) {
      mTabBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetIdx = parseInt(btn.getAttribute('data-target'), 10);
          const targetCard = variantItems[targetIdx];
          if (targetCard) {
            const scrollPos = targetCard.offsetLeft - trackContainer.offsetLeft - 16;
            trackContainer.scrollTo({
              left: scrollPos,
              behavior: 'smooth'
            });
          }
          mTabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    }

    if (trackContainer) {
      trackContainer.addEventListener('scroll', () => {
        if (window.innerWidth <= 992) {
          const scrollLeft = trackContainer.scrollLeft;
          const maxScroll = trackContainer.scrollWidth - trackContainer.clientWidth;
          const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
          if (progressBar) progressBar.style.width = `${progress * 100}%`;
          const idx = Math.min(2, Math.floor(progress * 2.99));
          if (variantNum) variantNum.textContent = `0${idx + 1}`;

          if (mTabBtns.length > 0) {
            mTabBtns.forEach((b, i) => {
              b.classList.toggle('active', i === idx);
            });
          }
        }
      }, { passive: true });
    }

    // Animate QC standard cards
    const qcCards = document.querySelectorAll('.qc-card');
    if (qcCards.length > 0) {
      gsap.fromTo(
        qcCards,
        { opacity: 0, y: 35, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.12,
          ease: 'back.out(1.4)',
          scrollTrigger: {
            trigger: '.qc-cards-grid',
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    // Animate Formula progress bars
    const progressBars = document.querySelectorAll('.progress-bar');
    if (progressBars.length > 0) {
      progressBars.forEach((bar) => {
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        ScrollTrigger.create({
          trigger: '.formula-table',
          start: 'top 75%',
          onEnter: () => {
            gsap.to(bar, {
              width: targetWidth,
              duration: 1.2,
              ease: 'power2.out',
            });
          },
        });
      });
    }

    // Refresh ScrollTrigger once full page has loaded to ensure exact heights
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });
  }

  // ==========================================================================
  // 8. SMOOTH SCROLL NAV CLICKS (WITH LENIS COMPATIBILITY)
  // ==========================================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 80;

        // Close mobile nav if opened
        if (navLinks) {
          navLinks.classList.remove('nav-open');
        }

        if (lenisInstance) {
          lenisInstance.scrollTo(targetEl, {
            offset: -headerOffset,
            duration: 1.2,
          });
        } else {
          const elementPosition = targetEl.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });

})();
