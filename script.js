document.addEventListener('DOMContentLoaded', () => {
  // Navigation active state based on scroll
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('header nav a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').includes(current)) {
        link.classList.add('active');
      }
    });
  });

  // Smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if(targetId === '#') return;
      document.querySelector(targetId).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });

  // Reader Modal Functionality
  const readerModal = document.getElementById('reader-modal');
  const openReaderBtns = document.querySelectorAll('.open-reader');
  const closeBtn = document.querySelector('.close-btn');
  const sizeIncrease = document.getElementById('size-increase');
  const sizeDecrease = document.getElementById('size-decrease');
  const readerContent = document.querySelector('.reader-content');
  
  // Load manuscript from file
  const loadManuscript = async () => {
    try {
      const response = await fetch('001-manuscript.md');
      if (!response.ok) throw new Error('File not found');
      const text = await response.text();
      
      const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');
      readerContent.innerHTML = paragraphs.map(p => {
        let content = p.replace(/^#\s+(.*?)$/gm, '<h3 style="margin-bottom:1.5rem; color:var(--primary);">$1</h3>');
        if (!content.startsWith('<h3')) {
           content = `<p>${content}</p>`;
        }
        return content;
      }).join('');
    } catch (error) {
       console.error(error);
       if (window.location.protocol === 'file:') {
         readerContent.innerHTML = '<p style="text-align: center; color: #ff5555; margin-top: 2rem;">로컬 파일(file://) 환경에서는 브라우저 보안 정책상 원고(.md)를 다이렉트로 불러올 수 없습니다.<br>웹 서버 환경(Live Server, Vercel, GitHub Pages)에서 실행해주세요.</p>';
       } else {
         readerContent.innerHTML = '<p style="text-align: center; margin-top: 2rem;">원고를 불러오지 못했습니다.</p>';
       }
    }
  };

  // Open modal
  openReaderBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      readerModal.classList.add('active');
      document.body.style.overflow = 'hidden'; // prevent background scrolling
      
      if (readerContent.innerHTML.includes('불러오는 중') || readerContent.innerHTML.trim() === '') {
        loadManuscript();
      }
    });
  });

  // Close modal
  closeBtn.addEventListener('click', () => {
    readerModal.classList.remove('active');
    document.body.style.overflow = 'auto';
  });

  // Close on outside click
  readerModal.addEventListener('click', (e) => {
    if (e.target === readerModal) {
      readerModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  });

  // Font size toggle
  let currentSize = 1.1;
  sizeIncrease.addEventListener('click', () => {
    if(currentSize < 1.6) {
      currentSize += 0.1;
      readerContent.style.fontSize = `${currentSize}rem`;
    }
  });

  sizeDecrease.addEventListener('click', () => {
    if(currentSize > 0.9) {
      currentSize -= 0.1;
      readerContent.style.fontSize = `${currentSize}rem`;
    }
  });

  // EMP & Seed Vault Animation
  const canvas = document.getElementById('emp-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('canvas-container');
    
    let width, height;
    let nodes = [];
    const connectionDistance = 70;
    
    function initCanvas() {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;
      
      nodes = [];
      const numNodes = Math.floor((width * height) / 4000);
      for (let i = 0; i < numNodes; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          state: 'alive',
          isSurvivor: i === 0, // Node 0 gets to be the survivor (The Prepper)
          brightness: 1,
          greenBrightness: 0
        });
      }
    }
    
    window.addEventListener('resize', initCanvas);
    initCanvas();

    let isBlackedOut = false;
    let hasPlayed = false;
    let phaseTimer = 0;

    function startSequence() {
      if (hasPlayed) return;
      hasPlayed = true;

      // Let observer appreciate the alive state for 7 seconds
      setTimeout(() => {
        isBlackedOut = true;
      }, 7000);
    }
    
    // Use IntersectionObserver to start animation when visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startSequence();
          observer.unobserve(canvas); // Only do it once
        }
      });
    }, { threshold: 0.5 });
    observer.observe(canvas);

    function draw() {
      ctx.fillStyle = '#0a0a0c'; // Very dark background
      ctx.fillRect(0, 0, width, height);

      if (isBlackedOut) {
         phaseTimer++;
         
         // Staggered, cascading power failure across the grid (looks like cities shutting down)
         if (phaseTimer > 0 && phaseTimer < 120) {
           nodes.forEach(n => {
             if (n.state === 'alive' && Math.random() < 0.04) {
               n.state = n.isSurvivor ? 'green' : 'dead';
             }
           });
         } else if (phaseTimer === 120) {
           // Final cutoff for any stragglers
           nodes.forEach(n => {
             if (n.state === 'alive') n.state = n.isSurvivor ? 'green' : 'dead';
           });
         }
      }

      // Update nodes
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        
        // All nodes drift naturally
        n1.x += n1.vx;
        n1.y += n1.vy;
        if (n1.x < 0 || n1.x > width) n1.vx *= -1;
        if (n1.y < 0 || n1.y > height) n1.vy *= -1;

        // Handle fading colors
        if (n1.state === 'alive') {
           n1.brightness = 1;
        } else if (n1.state === 'dead') {
           n1.brightness *= 0.95; // slower, dying fade to simulate decaying local power
           if (n1.brightness < 0.1) n1.brightness = 0.1;
        }

        if (n1.state === 'green') {
           // Wait deeply in the darkness (250 frames) before the survivor starts to bloom
           if (phaseTimer > 250) {
             n1.greenBrightness += 0.003; // crawling, slow green bloom
             if (n1.greenBrightness > 1) n1.greenBrightness = 1;
           }
        } else {
           n1.greenBrightness = 0;
        }

        // Draw connections
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.hypot(dx, dy);
          
          if (dist < connectionDistance) {
            // Green spreads extremely slowly to dead nodes only after blackout is deeply settled
            if (isBlackedOut && phaseTimer > 500) {
               if (n1.state === 'green' && n2.state === 'dead' && Math.random() < 0.003) n2.state = 'green';
               if (n2.state === 'green' && n1.state === 'dead' && Math.random() < 0.003) n1.state = 'green';
            }

            // Draw line based on state
            if (n1.state === 'alive' || n2.state === 'alive') {
              ctx.beginPath();
              ctx.moveTo(n1.x, n1.y);
              ctx.lineTo(n2.x, n2.y);
              let minBright = Math.min(n1.brightness, n2.brightness);
              ctx.strokeStyle = `rgba(100, 200, 255, ${(1 - dist/connectionDistance) * 0.7 * minBright})`;
              ctx.lineWidth = 1; // Distinct pre-EMP line
              ctx.stroke();
            } else if (n1.state === 'green' && n2.state === 'green') {
              ctx.beginPath();
              ctx.moveTo(n1.x, n1.y);
              ctx.lineTo(n2.x, n2.y);
              let minGreen = Math.min(n1.greenBrightness, n2.greenBrightness);
              ctx.strokeStyle = `rgba(0, 230, 118, ${(1 - dist/connectionDistance) * 0.9 * minGreen})`;
              ctx.lineWidth = 1.5; // Distinct glowing post-EMP root
              ctx.stroke();
            }
          }
        }
      }
      
      // Draw nodes
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.state === 'green' ? 2 : 1.5, 0, Math.PI * 2);
        
        if (n.state === 'alive') {
          ctx.fillStyle = `rgba(100, 200, 255, ${n.brightness * 0.8})`;
          ctx.shadowBlur = 0;
          ctx.shadowColor = `rgba(100, 200, 255, ${n.brightness})`;
        } else if (n.state === 'dead') {
          ctx.fillStyle = `rgba(50, 50, 50, ${n.brightness})`;
          ctx.shadowBlur = 0;
        } else if (n.state === 'green') {
          ctx.fillStyle = `rgba(0, 230, 118, ${n.greenBrightness})`;
          ctx.shadowBlur = 10 * n.greenBrightness;
          ctx.shadowColor = `rgba(0, 230, 118, ${n.greenBrightness})`;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      requestAnimationFrame(draw);
    }
    
    // Start drawing cleanly
    draw();
  }
});
