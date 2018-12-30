# Tom`s Name Game
or Tom`s Over-Engineered Game of Doom
or How I Was Able to Leave Dinner With the Inlaws Early

## Installation

1. Clone this repository and go into it's directory
```bash
git clone https://github.com/newoddity/toms-name-game.git && cd toms-name-game
npm install
```

## Usage

```bash
npm run dev
```

## TODOs
Things that would have been awesome to do...
- GameData needs to be its own class.
 - This would isolate and organize the two levels of information (raw and populated) so that the code would be cleaner.
- Game state needs much better management. 
- Find a someone with visual imagination and crayons to make this look better.
- Add proper documentation so I do not hate past-me.
- Rethink the scoring system. Random tests with "Matt or Nott" weighs those questions astronomically more than the others.
- Rethink the tallying logic.

## Lessons Learned
When not feeling well, it may not be the best idea to architect code/solutions. There was a deadline, but if I had gotten better, things would have been better organized. Staying home when sick is saving coworkers from bugs and code from bugs.

Consistency... There are so many places where props are dot referenced and so many places where props are index referenced. This should not be a mix. There should be one or the other.

After this process, I think I am going to personally review this and implement it properly.