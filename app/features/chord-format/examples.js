// Example songs in the Chords format. They're made up (words and all), so they're safe to
// ship. The Songs tab adds them the first time the app opens, and tests/examples.test.js
// checks they read without a single problem. docs/FORMAT.md shows the same two.

export const HARBOUR_LIGHTS = `title: Harbour Lights
artist: The Example Band
key: G
tempo: 92
time: 4/4
*hit: ▲ Band hit together
*gtr: ♪ Guitar riff

// Intro: the riff twice
[Intro]
| G*gtr . . . | Cadd9 . . . | Em7 . D . | Cadd9 . . . | x2

[Verse 1]
| G . . . | D/F# . . . | Em7 . . . | C . . . |
The ^harbour lights are | ^fading out to | ^sea, and I'm | ^still here
| G . . . | D/F# . . . | C . . . | D . Dsus4 D |
^Counting all the | ^boats that never | ^came back | ^home to ^me ^now

[Pre-chorus]
| Am7 . . . | C . . . | Am7 . . . | D!*stop . - . |
So ^hold on | ^tight now | ^hold on | ^Stop!

[Chorus]
| G . . . | D . . . | Em7 . . . | C . . . |
^Harbour lights, | ^show me the | ^way back | ^home
| G . . . | D . . . | C . [D C] . | G . . . |
^Harbour lights, | ^I won't be a|^lone ^to^night | ^

[Verse 2]
| G . . . | D/F# . . . | Em7 . . . | C . . . |
The ^tide is turning | ^slowly in the | ^dark, and the | ^gulls cry
| G . . . | D/F# . . . | C . . . | D . Dsus4 D |
^Every little | ^light's a little | ^spark that | ^brings ^me ^home

[Pre-chorus]

[Chorus x2]

[Bridge]
> Half time feel, drums on the toms
{3/4}
| Em . . | C . . | G . . | D . . |
^Out past the | ^rocks where the | ^water runs | ^deep
| Em . . | C . . | {2/4} D . | {4/4} D*hit . D*hit D*hit |
^Who's gonna | ^find me, | ^who's gonna | ^keep ^me ^safe

[Solo]
{every 4 bars *"crash"}
| G*solo . . . | D/F# . . . | Em7 . . . | C . . . | x2

[Outro]
| G*gtr . . . | Cadd9 . . . | Em7 . D . | Cadd9 . . . |
| G . . . | % | G*hold . . . |
`;

export const NUMBERS_GAME = `title: Numbers Game
artist: The Example Band
key: D
tempo: 120
time: 6/8
*clap: ✋ Everyone claps

// Written in numbers, so it plays in any key: change "key:" or transpose in the app.
[Intro]
{every 2 beats *clap}
| 1 . . 4 . . | 1 . . 5 . . | x2
{every off}

[Verse]
| 1 . . . . . | 6m . . . . . | 4 . . 5 . . | 1 . . . . . |
^One, two, I'm ^counting on you, ^three, four, ^out the door
| 1 . . . . . | 6m . . . . . | 4 . . [5 5/7] . . | 1 . . . . . |
^Five, six, a ^bag of tricks, ^seven, ^eight ^don't be late

[Chorus]
| 4 . . 5 . . | 6m . . 1/3 . . | 4 . . 5 . . | 1 . . - . . |
^This is the ^numbers game, ^every night the ^same, we ^play it ^loud and ^Hey!

[Turnaround]
| b7 . . 4 . . | 1 . . 5 . [4 4/3] | {key: E} 1 . . . . . |
> Up a step for the last chorus

[Chorus]
`;

export const EXAMPLES = [
  { id: 'example-harbour-lights', text: HARBOUR_LIGHTS },
  { id: 'example-numbers-game', text: NUMBERS_GAME },
];
