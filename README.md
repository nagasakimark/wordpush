# Word Push! ことばブロック

Baba Is You-style sentence puzzle for NEW HORIZON Elementary 5–6 (2024) vocabulary. 24 levels, single-file game.

- Play: open `index.html` (works on Chromebooks, no install). Enable GitHub Pages on `main` / root to share a link.
- Edit levels: `src/levels.js` (ASCII maps), then `node src/solve.js` to prove each is beatable, then `python3 src/build.py` to rebuild `index.html`.
- `src/gen.js` scatters blocks randomly and keeps layouts the solver can beat.

Grammar covered: IS + adjective, CAN / CAN'T + verb, I WANT / HE-SHE WANTS + food, SVO word order. (CAN'T and WANTS are grammar forms, not in the vocab list.)

## Credits
Tiles, UI and sounds by [Kenney](https://kenney.nl) (CC0): New Platformer Pack, UI Pack Pixel Adventure, Game Icons, Interface Sounds. Characters, grass, bushes, star and food are AI-generated.
