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

  const playVideo = (video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    const playback = video.play();
    if (playback) playback.catch(() => {});
  };

  const visibleVideos = () => cardVideos.filter((video) => {
    const bounds = video.getBoundingClientRect();
    return bounds.top < window.innerHeight && bounds.bottom > 0;
  });

  const playVisibleVideos = () => {
    if (!document.hidden) visibleVideos().forEach(playVideo);
  };

  cardVideos.forEach((video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
  });

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ isIntersecting, target }) => {
          if (isIntersecting && !document.hidden) playVideo(target);
          else target.pause();
        });
      },
      { rootMargin: '120px 0px', threshold: 0.15 }
    );

    cardVideos.forEach((video) => videoObserver.observe(video));
  } else if (!reducedMotion) {
    playVisibleVideos();
  }

  if (reducedMotion) cardVideos.forEach((video) => {
    video.removeAttribute('autoplay');
    video.pause();
  });
  else {
    playVisibleVideos();
    window.addEventListener('pageshow', playVisibleVideos);
    window.addEventListener('touchstart', playVisibleVideos, { once: true, passive: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cardVideos.forEach((video) => video.pause());
    else if (!reducedMotion) playVisibleVideos();
  });
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const newsList = document.querySelector('[data-news-src]');

if (newsList) {
  const olderNewsList = document.querySelector('[data-news-more]');
  const olderNews = olderNewsList.closest('details');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const createNewsItem = (news) => {
    const item = document.createElement('li');
    const time = document.createElement('time');
    const [year, month] = news.date.split('-');
    time.dateTime = news.date;
    time.textContent = month ? `${monthNames[Number(month) - 1]} ${year}` : year;

    const link = document.createElement('a');
    link.href = news.url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = news.title;

    const source = document.createElement('span');
    source.textContent = news.source;
    item.append(time, link, source);
    return item;
  };

  const renderNews = (newsData) => {
    if (!Array.isArray(newsData)) throw new Error('News data must be an array');
    const sortedNews = newsData.slice().sort((a, b) => b.date.localeCompare(a.date));
    const recentNews = sortedNews.slice(0, 8);
    const remainingNews = sortedNews.slice(8);
    newsList.replaceChildren(...recentNews.map(createNewsItem));
    olderNewsList.replaceChildren(...remainingNews.map(createNewsItem));
    olderNews.hidden = remainingNews.length === 0;
  };

  const newsSource = newsList.dataset.newsSrc;
  fetch(newsSource)
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load ${newsSource}`);
      return response.json();
    })
    .then(renderNews)
    .catch((error) => {
      console.error(error);
      const status = document.createElement('li');
      status.className = 'news-status';
      status.textContent = 'News could not be loaded. Please refresh the page.';
      newsList.replaceChildren(status);
    });
}

const publicationList = document.querySelector('.publication-list');

if (publicationList) {
  const createExternalLink = (label, href) => {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = label;
    return link;
  };

  const createPublicationRow = (publication) => {
    const article = document.createElement('article');
    article.className = 'publication-row';
    article.dataset.topics = publication.topics.join(' ');

    const linkEntries = Object.entries(publication.links);
    const primaryUrl = publication.links.Webpage ?? linkEntries[0][1];
    const thumb = createExternalLink('', primaryUrl);
    thumb.className = 'publication-thumb';
    thumb.setAttribute('aria-label', `${publication.title} webpage`);

    if (publication.thumbnail.src) {
      const image = document.createElement('img');
      image.src = publication.thumbnail.src;
      image.alt = publication.thumbnail.alt ?? '';
      image.loading = 'lazy';
      thumb.append(image);
    } else {
      const placeholder = document.createElement('span');
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.textContent = publication.thumbnail.placeholder;
      thumb.classList.add('publication-placeholder');
      thumb.append(placeholder);
    }

    const copy = document.createElement('div');
    copy.className = 'publication-copy';
    const title = document.createElement('h2');
    title.textContent = publication.title;
    copy.append(title);

    if (publication.authors) {
      const authors = document.createElement('p');
      authors.className = 'publication-authors';
      authors.textContent = publication.authors;
      copy.append(authors);
    }

    const venue = document.createElement('p');
    venue.className = 'publication-meta';
    venue.textContent = publication.venue;
    const links = document.createElement('p');
    links.className = 'publication-links';
    linkEntries.forEach(([label, href], index) => {
      if (index) links.append(document.createTextNode(' , '));
      links.append(createExternalLink(label, href));
    });
    copy.append(venue, links);
    article.append(thumb, copy);
    return article;
  };

  const initializePublicationArchive = (publicationData) => {
    if (!Array.isArray(publicationData)) throw new Error('Publication data must be an array');
    publicationList.replaceChildren(...publicationData.map(createPublicationRow));

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
  };

  const publicationSource = publicationList.dataset.publicationsSrc;
  fetch(publicationSource)
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load ${publicationSource}`);
      return response.json();
    })
    .then(initializePublicationArchive)
    .catch((error) => {
      console.error(error);
      const status = document.createElement('p');
      status.className = 'publication-status';
      status.textContent = 'Publications could not be loaded. Please refresh the page.';
      publicationList.replaceChildren(status);
    });
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
