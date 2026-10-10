# My website

I am just adding random "content" here. Most stuff I do for fun.

## Game in P5JS

* Name : `Gravminer`? (Mining gravity)

* Concept : you a spaceship pilot and can set an arbitrary positio in space as gravity source to control the ship. Your job is to collect as many rocks as possible in a given time.

### Progress

- [ ] Engine
    - [x] Colision detection
        - [ ] support for polygons
    - [x] Spaceship control
- [ ] Gameplay
    - [x] Game state manager
        - INIT, INTRO, PLAY, OUTRO, FINISH
    - [x] Timer
    - [x] Counter
    - [x] 8 Levels
- [ ] Visuals/Artwork
    - [x] Spaceship
    - [ ] Obstacles

- [ ] Enhancements
    - [ ] Level Editor
    - [x] Online leaderboard
    - [ ] Dialogue system

## Buckshot (`buckshot/`)

A Buckshot Roulette style game with placeholder canvas graphics. Plain ES modules, no build step.

- `js/model/`: game rules (shotgun, participants, item registry, `Game`)
- `js/ai/dealer.js`: dealer decision-making (uses only info the dealer could know)
- `js/view/`: layout, drawing primitives, item icons, effects, renderer, clickable regions
- `js/input.js`: pointer and keyboard input; `js/controller.js`: async turn loop and pacing
- `tests/simulate.test.js`: headless AI-vs-AI rules check (`node buckshot/tests/simulate.test.js`)
