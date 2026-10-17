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
  // People photos keep their places (newest first); research pictures are shuffled among their slots.
  const shuffleSlots = Array.from(slideshow.querySelectorAll('[data-shuffle]'));
  const shuffled = shuffleSlots.map((slide) => slide.cloneNode(true));
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  shuffleSlots.forEach((slot, i) => slot.replaceWith(shuffled[i]));

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

    topicLinks.forEach((link) => {
      const key = link.dataset.topic;
      const rows = Array.from(publicationList.children).filter((row) =>
        (row.dataset.topics ?? '').split(' ').includes(key)
      );
      const section = document.createElement('section');
      section.className = 'publication-topic';
      section.id = `topic-${key}`;
      const heading = document.createElement('h2');
      heading.textContent = link.textContent;
      const list = document.createElement('div');
      list.className = 'publication-list';
      rows.forEach((row) => list.append(row.cloneNode(true)));
      section.append(heading, list);
      topicList.append(section);
    });

    publicationList.after(topicList);

    const showView = (view) => {
      publicationList.hidden = view !== 'date';
      topicList.hidden = view !== 'topic';
      viewLinks.forEach((link) => link.classList.toggle('active', link.dataset.view === view));
    };

    const applyHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('topic')) {
        showView('topic');
        document.getElementById(hash)?.scrollIntoView();
      } else {
        showView('date');
      }
    };

    window.addEventListener('hashchange', applyHash);
    applyHash();
  }
}
