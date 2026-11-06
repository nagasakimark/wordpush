# Word Push! ことばブロック

A Baba Is You-style sentence puzzle for NEW HORIZON Elementary 5–6 (2024) vocabulary. Kids push word blocks into simple English sentences (subject → verb → object), and every sentence changes how the world works. 37 levels in 8 chapters, plus a sandbox. Single-file game.

- Play: open `index.html` (works on Chromebooks, no install). GitHub Pages serves it from `main` / root.
- Edit levels: `src/levels.js` (ASCII maps), check with `node src/solve.js [level numbers]` (can it be won?) and `node src/check.js` (can it be won *without* moving any words? it should not be), then `python3 src/build.py` (solves every level for the par counts, cached in `src/solutions.json`) to rebuild `index.html`.

## What sentences can do
Everything on the board is an object, and the word blocks decide what each object does. Many levels have more than one way to win.

| Sentence | Effect |
|---|---|
| `I AM DOG` | You control every dog (become something else). With no `AM` block, you are the level's hero. If you turn into something else (`BOY IS FIRE`), you are still you. |
| `WALL IS STAR` | Transformation: walls turn into stars. `DOG IS DOG` stops dogs from changing. |
| `ROCK IS BIG / SMALL / LOW` | Blocks you / can be pushed / you can walk over it. |
| Fire (`FIRE IS HOT` by nature) | Burns you unless you are HOT or flying. `BOY IS HOT` makes you fireproof and lets you melt through ice. `FIRE IS COLD` puts the fire out. `RIVER IS COLD` freezes the river. |
| `KEY IS OPEN`, `DOOR IS CLOSED` | Open and closed things destroy each other when they meet. |
| `DOG IS HUNGRY` | Eats you (and food) on the same square. Flyers are safe. |
| `CAT IS SLEEPY` | Can't move. |
| `I CAN SWIM / FLY / JUMP / CLIMB / RUN` | Cross rivers / fly over rivers and mountains / hop one blocker / climb mountains / move every turn. `CAN'T` cancels `CAN`. |
| `I WANT APPLE`, `HE WANTS CAKE` | Touching what you want wins. If you *are* what you want, you win at once. |
| `ROCK HAS KEY`, `I HAVE KEY` | When a rock disappears (sinks, melts, gets eaten), a key appears. |
| `WALL AND TREE ARE SMALL` | `AND` makes a plural subject, so `ARE`. |

Pushed things sink into rivers and take the river square with them. Nature defaults (walls and trees block, rocks and keys can be pushed, doors are closed, rivers are deep, fire is hot, ice is cold) are listed in the side panel and can be overridden by sentences.

Grammar checks with Japanese feedback: word order, `I AM` / `IS` / `ARE` agreement, `WANT/WANTS`, `HAVE/HAS`, he/she. The English is simplified (no articles, all capitals), and the tutorial says so.

The "ぶん ずかん" (sentence book) records every sentence a student makes and every weird event they discover (becoming a rock, getting eaten, melting...).

## Credits
Tiles, UI and sounds by [Kenney](https://kenney.nl) (CC0): New Platformer Pack, UI Pack Pixel Adventure, Game Icons, Interface Sounds. Characters, grass, bushes, star and food are AI-generated. Tree, ice and flower are drawn in code as placeholders.
