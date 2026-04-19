import './style.css';

class AudioManager {
  private musicFiles = ['music/music1.ogg', 'music/music2.ogg', 'music/music3.ogg', 'music/music4.ogg', 'music/music5.ogg'];
  private musicIndex = Math.floor(Math.random() * 5);
  private music: HTMLAudioElement;
  private isMuted = false;
  private hasInteracted = false;

  constructor() {
    this.music = new Audio(this.musicFiles[this.musicIndex]);
    this.music.volume = 0.3;
    this.music.preload = 'auto';
    this.music.addEventListener('ended', () => this.nextTrack());

    const savedMute = localStorage.getItem('emerald-muted') === 'true';
    if (savedMute) {
      this.isMuted = true;
      this.music.pause();
    }
  }

  private nextTrack() {
    this.musicIndex = (this.musicIndex + 1) % this.musicFiles.length;
    this.music.src = this.musicFiles[this.musicIndex];
    this.music.preload = 'auto';
    if (!this.isMuted) this.music.play().catch(() => { });
  }

  public start() {
    if (this.hasInteracted || this.isMuted) return;
    this.hasInteracted = true;
    this.music.play().catch(() => { });
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('emerald-muted', String(this.isMuted));
    if (this.isMuted) this.music.pause();
    else {
      if (this.hasInteracted) this.music.play().catch(() => { });
      else {
        this.hasInteracted = true;
        this.music.play().catch(() => { });
      }
    }

    this.updateUI();
  }

  public updateUI() {
    const btn = document.getElementById('audio-toggle');
    if (btn) {
      btn.classList.toggle('muted', this.isMuted);
      const icon = btn.querySelector('i');
      if (icon) icon.className = this.isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    }
  }

  public playSFX(file: string) {
    const sfx = new Audio(`sounds/${file}`);
    sfx.volume = 0.4;
    sfx.play().catch(() => { });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const audio = new AudioManager();
  audio.updateUI();

  const startAudio = () => audio.start();
  document.addEventListener('click', startAudio, { once: true });
  document.getElementById('audio-toggle')?.addEventListener('click', () => {
    audio.playSFX('click.wav');
    audio.toggleMute();
  });

  const tabs = document.querySelectorAll('.tab-item');
  const contents = document.querySelectorAll('.tab-content');

  let activeIndex = 0;

  const updateTabs = (index: number) => {
    if (index < 0) index = tabs.length - 1;
    if (index >= tabs.length) index = 0;

    if (activeIndex !== index) audio.playSFX('click.wav');
    activeIndex = index;

    tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
    });

    contents.forEach((content, i) => {
      content.classList.toggle('active', i === index);
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => updateTabs(index));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'q' || e.key === 'ArrowLeft') updateTabs(activeIndex - 1);
    if (e.key === 'e' || e.key === 'ArrowRight') updateTabs(activeIndex + 1);
  });

  document.getElementById('prev-tab')?.addEventListener('click', () => updateTabs(activeIndex - 1));
  document.getElementById('next-tab')?.addEventListener('click', () => updateTabs(activeIndex + 1));

  const carouselImg = document.querySelector('.carousel-img') as HTMLImageElement;
  const screenshots = [
    'Community/image.png',
    'Community/image2.png',
    'Community/image3.png',
    'Community/image4.png',
    'Community/image5.png',
    'Community/image6.png'
  ];
  let screenIndex = 0;

  const rotateScreenshot = (dir: number, isManual = false) => {
    if (isManual) audio.playSFX('wood click.wav');
    screenIndex = (screenIndex + dir + screenshots.length) % screenshots.length;
    if (carouselImg) {
      carouselImg.style.opacity = '0';
      setTimeout(() => {
        carouselImg.src = screenshots[screenIndex];
        carouselImg.style.opacity = '1';
      }, 100);
    }
  };

  document.querySelector('.carousel-arrow.left')?.addEventListener('click', () => rotateScreenshot(-1, true));
  document.querySelector('.carousel-arrow.right')?.addEventListener('click', () => rotateScreenshot(1, true));

  const repo = 'Emerald-Legacy-Launcher/Emerald-Legacy-Launcher';
  const modal = document.getElementById('download-modal');
  const modalOptions = document.getElementById('modal-options');
  const modalTitle = document.getElementById('modal-title');
  const closeModal = document.getElementById('close-modal');

  let latestAssets: any[] = [];
  let nightlyAssets: any[] = [];
  let currentOSType = 'Windows';

  const detectOS = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    const plat = (window.navigator as any).platform?.toLowerCase() || '';
    let os = 'Unknown';
    let arch = 'x64';

    if (ua.includes('win')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';

    if (
      ua.includes('arm64') ||
      ua.includes('aarch64') ||
      plat.includes('arm64') ||
      plat.includes('aarch64') ||
      (os === 'macOS' && (window.navigator as any).maxTouchPoints > 0)
    ) {
      arch = 'arm64';
    }

    return { os, arch };
  };

  const getRecommendedAsset = (os: string, arch: string, assets: any[]) => {
    if (os === 'Windows') {
      return assets.find(a => a.name.endsWith('.exe')) || assets.find(a => a.name.endsWith('.msi'));
    }
    if (os === 'macOS') {
      const suffix = arch === 'arm64' ? 'aarch64.dmg' : 'x64.dmg';
      return assets.find(a => a.name.endsWith(suffix));
    }
    if (os === 'Linux') {
      const archTag = arch === 'arm64' ? 'aarch64' : 'x86_64';
      const specific = assets.find(a => a.name.endsWith('.flatpak') && a.name.includes(archTag));
      if (specific) return specific;

      return assets.find(a => a.name.endsWith('.flatpak'));
    }
    return null;
  };

  const openDownloadModal = (osType: string) => {
    if (!modal || !modalOptions || !modalTitle) return;
    currentOSType = osType;

    const nightlyToggle = document.getElementById('nightly-toggle') as HTMLInputElement;
    const isNightly = nightlyToggle?.checked || false;
    const assets = isNightly ? nightlyAssets : latestAssets;

    let filteredAssets = [];
    let title = 'Select Downloader';

    if (osType === 'Windows') {
      filteredAssets = assets.filter(a => a.name.endsWith('.exe') || a.name.endsWith('.msi'));
      title = `Emerald Legacy for Windows ${isNightly ? '(Nightly)' : ''}`;
    } else if (osType === 'macOS') {
      filteredAssets = assets.filter(a => a.name.endsWith('.dmg'));
      title = `Emerald Legacy for macOS ${isNightly ? '(Nightly)' : ''}`;
    } else if (osType === 'Linux') {
      filteredAssets = assets.filter(a => a.name.endsWith('.flatpak') || a.name.endsWith('.deb') || a.name.endsWith('.rpm'));
      title = `Emerald Legacy for Linux ${isNightly ? '(Nightly)' : ''}`;
    }

    const { arch } = detectOS();
    const recommended = getRecommendedAsset(osType, arch, filteredAssets);

    modalTitle.innerText = title;
    modalOptions.innerHTML = filteredAssets.length > 0 ? filteredAssets.map(asset => {
      const isRecommended = asset.name === recommended?.name;
      return `
        <div class="modal-btn-container">
          <a href="${asset.browser_download_url}" class="main-btn" onclick="window.playAudioSFX('levelup.ogg')">
            <span>${asset.name.split('_').pop()?.split('-').pop() || asset.name}</span>
          </a>
          ${isRecommended ? '<span class="splash-text">Recommended!</span>' : ''}
        </div>
      `;
    }).join('') : `<div style="color: grey; font-size: 1.2rem; padding: 20px;">No builds found for this platform.</div>`;

    modal.classList.add('active');
  };

  const nightlyToggle = document.getElementById('nightly-toggle');
  nightlyToggle?.addEventListener('change', () => {
    audio.playSFX('click.wav');
    openDownloadModal(currentOSType);
  });

  (window as any).playAudioSFX = (file: string) => audio.playSFX(file);

  const updateDownloadButtons = async () => {
    try {
      const [latestRes, nightlyRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${repo}/releases/latest`),
        fetch(`https://api.github.com/repos/${repo}/releases/tags/nightly`)
      ]);

      const [latestData, nightlyData] = await Promise.all([
        latestRes.json(),
        nightlyRes.json()
      ]);

      latestAssets = latestData.assets || [];
      nightlyAssets = nightlyData.assets || [];

      const { os } = detectOS();

      const mainBtn = document.getElementById('main-download-btn');
      if (mainBtn) {
        mainBtn.addEventListener('click', (e) => {
          e.preventDefault();
          openDownloadModal(os === 'Unknown' ? 'Windows' : os);
        });
        const span = mainBtn.querySelector('span');
        if (span) span.innerText = `Download for ${os === 'Unknown' ? 'Your OS' : os}`;
      }

      const winBtn = document.getElementById('download-win');
      const linuxBtn = document.getElementById('download-linux');
      const macBtn = document.getElementById('download-macos');

      winBtn?.addEventListener('click', (e) => { e.preventDefault(); openDownloadModal('Windows'); });
      linuxBtn?.addEventListener('click', (e) => { e.preventDefault(); openDownloadModal('Linux'); });
      macBtn?.addEventListener('click', (e) => { e.preventDefault(); openDownloadModal('macOS'); });

    } catch (error) {
      console.error('Error fetching releases:', error);
    }
  };

  closeModal?.addEventListener('click', () => {
    audio.playSFX('back.ogg');
    modal?.classList.remove('active');
  });
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      audio.playSFX('back.ogg');
      modal.classList.remove('active');
    }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modal?.classList.contains('active')) audio.playSFX('back.ogg');
      modal?.classList.remove('active');
    }
  });

  const imageModal = document.getElementById('image-modal');
  const expandedImg = document.getElementById('expanded-image') as HTMLImageElement;
  const closeImageModal = document.getElementById('close-image-modal');

  const openImageModal = (src: string) => {
    if (!imageModal || !expandedImg) return;
    audio.playSFX('levelup.ogg');
    expandedImg.src = src;
    imageModal.classList.add('active');
  };

  document.querySelectorAll('.gallery-frame img, .carousel-img').forEach(img => {
    (img as HTMLElement).style.cursor = 'pointer';
    img.addEventListener('click', () => {
      openImageModal((img as HTMLImageElement).src);
    });
  });

  closeImageModal?.addEventListener('click', () => {
    audio.playSFX('back.ogg');
    imageModal?.classList.remove('active');
  });

  imageModal?.addEventListener('click', (e) => {
    if (e.target === imageModal) {
      audio.playSFX('back.ogg');
      imageModal.classList.remove('active');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (imageModal?.classList.contains('active')) {
        audio.playSFX('back.ogg');
        imageModal.classList.remove('active');
      }
    }
  });

  updateDownloadButtons();

  setInterval(() => rotateScreenshot(1, false), 5000);
});
