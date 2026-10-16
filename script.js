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
}
