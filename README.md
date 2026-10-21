# GAMMA Robotics Website

## Adding a publication

Publications are stored in [`publications.json`](publications.json). Add a new object to that array; you do not need to edit `research.html`.

```json
{
  "title": "Example Paper Title",
  "authors": "First Author, Second Author, Dinesh Manocha",
  "venue": "ICRA 2027",
  "topics": ["navigation"],
  "thumbnail": {"src": "assets/papers/example.jpg", "alt": "Short description of the image"},
  "links": {"Webpage": "https://example.com", "Paper": "https://arxiv.org/abs/0000.00000", "Code": "https://github.com/example/repository"}
}
```

- Use one or more existing topic values: `navigation`, `planning`, `vision`, `physics`, or `aerial`.
- `authors` and thumbnail `alt` text are optional. If there is no image, use `"thumbnail": {"placeholder": "EP"}` instead.
- `links` must contain at least one link. `Webpage`, `Paper`, and `Code` are the usual labels.
- Keep the JSON valid: separate entries with commas, but do not add a comma after the final entry.

The page sorts publications automatically using the year and venue, so a new entry can be added anywhere in the array.

## Adding news

News items are stored in [`news.json`](news.json). Add a new object using the `YYYY-MM` date format:

```json
{
  "date": "2027-01",
  "title": "GAMMA Robotics announcement",
  "url": "https://example.com/news",
  "source": "UMD CS"
}
```

News is sorted automatically by date. The eight newest items appear on the homepage, and older items appear under “Show all news.”

## Edit Access

If you are a current GAMMA Robotics member and would like edit access to the website, please email <a href="mailto:hyunjin@umd.edu">Hyunjin Kim</a>.
