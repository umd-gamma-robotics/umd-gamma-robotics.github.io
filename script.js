const menuButton = document.querySelector('[data-menu]');
const navigation = document.querySelector('#nav');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  navigation.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navigation.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}

const slideshow = document.querySelector('[data-slideshow]');

if (slideshow) {
  const slides = Array.from(slideshow.querySelectorAll('.slide'));
  const dotsContainer = slideshow.querySelector('.slide-dots');
  const dots = slides.map(() => dotsContainer.appendChild(document.createElement('span')));
  let current = 0;
  let timer = null;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
    slides[(current + 1) % slides.length].querySelector('img')?.setAttribute('loading', 'eager');
  };

  const stop = () => window.clearInterval(timer);
  const start = () => {
    stop();
    timer = window.setInterval(() => show(current + 1), 4000);
  };

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  show(0);
  start();
}

const cardVideos = Array.from(document.querySelectorAll('[data-card-video]'));

if (cardVideos.length) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ isIntersecting, target }) => {
          if (isIntersecting && !document.hidden) target.play().catch(() => {});
          else target.pause();
        });
      },
      { rootMargin: '120px 0px', threshold: 0.15 }
    );

    cardVideos.forEach((video) => videoObserver.observe(video));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cardVideos.forEach((video) => video.pause());
      else cardVideos.filter((video) => video.getBoundingClientRect().top < window.innerHeight && video.getBoundingClientRect().bottom > 0).forEach((video) => video.play().catch(() => {}));
    });
  }
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const publicationList = document.querySelector('.publication-list');

if (publicationList) {
  const venueTimeline = [
    { pattern: /NEURIPS/, position: 12 },
    { pattern: /CORL|ACCV/, position: 11 },
    { pattern: /IROS/, position: 10 },
    { pattern: /ECCV|ICCV/, position: 9 },
    { pattern: /ICRA/, position: 7 },
    { pattern: /CVPR/, position: 5 },
    { pattern: /AAAI/, position: 2 },
    { pattern: /WACV/, position: 1 },
  ];

  const arxivDate = (publication) => {
    const arxivLink = Array.from(publication.querySelectorAll('a')).find((link) =>
      link.href.includes('arxiv.org/')
    );
    const match = arxivLink?.href.match(/arxiv\.org\/(?:abs|html|pdf)\/(\d{2})(\d{2})\.(\d+)/i);

    if (!match) return null;

    return {
      year: 2000 + Number(match[1]),
      position: Number(match[2]) + Number(`0.${match[3]}`),
    };
  };

  const publications = Array.from(publicationList.querySelectorAll('.publication-row')).map(
    (publication, originalIndex) => {
      const meta = publication.querySelector('.publication-meta')?.textContent.trim() ?? '';
      const yearMatch = meta.match(/\b(20\d{2})\b/);
      const isArxivOnly = /^arxiv\b/i.test(meta);
      const arxiv = isArxivOnly ? arxivDate(publication) : null;
      const venue = venueTimeline.find(({ pattern }) => pattern.test(meta.toUpperCase()));

      return {
        publication,
        originalIndex,
        year: arxiv?.year ?? Number(yearMatch?.[1] ?? 0),
        position: arxiv?.position ?? venue?.position ?? 0,
      };
    }
  );

  publications
    .sort(
      (a, b) =>
        b.year - a.year || b.position - a.position || a.originalIndex - b.originalIndex
    )
    .forEach(({ publication }) => publicationList.append(publication));

  const filter = document.querySelector('.publication-filter');

  if (filter) {
    const topicLinks = Array.from(filter.querySelectorAll('[data-topic]'));
    const viewLinks = Array.from(filter.querySelectorAll('[data-view]'));
    const topicList = document.createElement('div');
    topicList.className = 'publication-topic-list';
    topicList.hidden = true;

    const publicationArea = (row) => {
      const legacyTopics = (row.dataset.topics ?? '').split(' ');
      const text = (row.querySelector('h2')?.textContent ?? '').toLowerCase();
      const links = Array.from(row.querySelectorAll('a')).map((anchor) => anchor.href).join(' ').toLowerCase();
      const matches = (pattern) => pattern.test(text);

      if (legacyTopics.includes('vision') || legacyTopics.includes('aerial')) return 'perception';
      if (legacyTopics.includes('physics')) return 'simulation';

      if (legacyTopics.includes('planning')) {
        return matches(/crowd|pedestrian|social|human[- ]robot|multi[- ]robot|multiple .*robot|reciprocal|velocity obstacle/)
          ? 'multiagent'
          : 'simulation';
      }

      if (matches(/crowd|pedestrian|social|multi[- ]agent|multi[- ]robot|swarm|traffic|autonomous driv|vehicle|road[- ]agent|intersection|flock|collective behavior|group cohesion|rvo|orca/) || links.includes('/autonomousdriving/')) return 'multiagent';
      if (matches(/foundation model|vision.language|\bvlms?\b|\bllms?\b|\bvlas?\b|embodied|locomotion|gait|quadruped|curriculum learning|object navigation|target finding|agentic|human preference|reinforcement learning|policy learning/)) return 'embodied';
      if (matches(/physical property estimation/)) return 'simulation';
      if (matches(/robot navigation|outdoor navigation|terrain navigation|traversability|trajectory generator|navigation in .* environment|navigation using|mapless navigation|obstacle detection/)) return 'navigation';
      if (matches(/3d object detection|segmentation|scene completion|depth|gaussian splatting|physical property estimation|localization|place recognition|mapping/)) return 'perception';

      return 'navigation';
    };

    topicLinks.forEach((link) => {
      const key = link.dataset.topic;
      const rows = Array.from(publicationList.children).filter((row) =>
        publicationArea(row) === key
      );
      const section = document.createElement('section');
      section.className = 'publication-topic';
      section.id = `topic-${key}`;
      const heading = document.createElement('h2');
      heading.textContent = link.textContent;
      const description = document.createElement('p');
      description.className = 'publication-topic-description';
      description.textContent = link.dataset.description ?? '';
      const list = document.createElement('div');
      list.className = 'publication-list';
      rows.forEach((row) => list.append(row.cloneNode(true)));
      section.append(heading, description, list);
      topicList.append(section);
    });

    publicationList.after(topicList);

    const showView = (view, topic = null) => {
      publicationList.hidden = view !== 'date';
      topicList.hidden = view !== 'topic';
      viewLinks.forEach((link) => {
        const active = link.dataset.view === view;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      topicLinks.forEach((link) => {
        const active = view === 'topic' && link.dataset.topic === topic;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      Array.from(topicList.children).forEach((section) => {
        section.hidden = view !== 'topic' || section.id !== `topic-${topic}`;
      });
    };

    const applyHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('topic-')) {
        showView('topic', hash.replace('topic-', ''));
        document.getElementById(hash)?.scrollIntoView();
      } else {
        showView('date');
      }
    };

    window.addEventListener('hashchange', applyHash);
    applyHash();
  }
}

const researchTabs = Array.from(document.querySelectorAll('[data-research-view]'));
const researchPanels = Array.from(document.querySelectorAll('[data-research-panel]'));

if (researchTabs.length && researchPanels.length) {
  const applyResearchHash = () => {
    const hash = window.location.hash.slice(1);
    const views = researchTabs.map((tab) => tab.dataset.researchView);
    const view = views.includes(hash) ? hash : views[0];

    researchTabs.forEach((tab) => {
      const active = tab.dataset.researchView === view;
      tab.classList.toggle('active', active);
      if (active) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
    researchPanels.forEach((panel) => {
      panel.hidden = panel.dataset.researchPanel !== view;
    });
  };

  window.addEventListener('hashchange', applyResearchHash);
  applyResearchHash();
}
