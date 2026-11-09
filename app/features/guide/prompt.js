// What the Guide tab shows: the quick reference and the prompt to give Claude. Keep these in
// step with docs/FORMAT.md (section 12 and "Asking Claude for a chart").

export const QUICK_REFERENCE = `title: …   artist: …   key: G   tempo: 120   time: 4/4   capo: 2   notes: …
*name: ▲ Label            your own notation
[Section]  [Section x2]   empty [Section] = play it again
| G . . . | C . D . |     bars; one thing per beat; . = hold
-   N.C.                  no chord
%                         repeat the bar before
[D C]                     two chords in one beat; brackets nest
x2   |: … :|              repeat the line
1 4 5 6m b7 5/7           Nashville numbers (needs key:)
lyrics ^under the ^chords   ^ = where each chord lands; | in words = new bar (optional)
G!  G*stop  G*name  G*"text"   notations
{3/4} {key: A} {tempo: 90}     changes from the next bar
{every 4 bars *crash}  {every off}
> cue for the band
// comment
---                       next song
`;

export const EXAMPLE = `title: Example
key: G
tempo: 100
*hit: ▲ Band hit

[Verse]
| G . . . | Em . . . | C . [D C] . | D*hit . - . |
I ^walk this | ^road a|^lone ^now | ^Stop!

[Chorus]
| C . G . | D . . . | {3/4} Em . . | {4/4} D . . . | x2
^Sing it ^out, ^sing it ^loud
`;

// The prompt for Claude. {song} is replaced by what the person types (or left as a gap).
export const PROMPT = `Write a chord chart in the Chords format described below, for: {song}

Reply with only the chart in one code block, no explanation. If you aren't sure of a chord, a section or a lyric, write your best guess and put "// check" at the end of that line. Don't write out full copyrighted lyrics: give the first few words of each line followed by "…" (still with ^ marks), unless I've given you the words. For several songs, separate them with a line of three dashes (---); for a set list, start with a line "// Set: name" and put --- before each song.

THE CHORDS FORMAT
What a line starts with decides what it is:
- "name: value" at the top: header (title, artist, key, tempo, time, capo, notes)
- "*name: symbol label": a notation of my own, e.g. *hit: ▲ Band hit
- "[Name]": a section, e.g. [Verse 1], [Chorus x2]. An empty section with the same name as an earlier one plays it again, so write each chorus once and then just [Chorus].
- "|": a line of bars. The chords in a bar share it equally, so write one thing per beat: "| G . . . | C . D . |" ("." holds the chord for a beat). "-" is no chord. "%" repeats the bar before. "[D C]" squeezes several chords into one beat; brackets nest. "x2" after the last | repeats the line.
- "{...}": a change from the next bar on: {3/4}, {key: A}, {tempo: 140}, or at the start of a bar: "| {2/4} D . |". {every 4 bars *crash} puts a notation every few bars or beats; {every off} stops it.
- ">": a cue the band reads, e.g. > Drums only
- "//": a comment
- anything else: lyrics for the bar line just above. Put ^ before the syllable where each chord lands; the ^ marks go to the chords in order (holds don't count). Optionally put | in the words where each bar starts.

Chords: G Em F#m7 Bbmaj7 Dsus4 C6/9 D/F#, or Nashville numbers from the key (1 4 5 6m 2m7 b7 5/7). Notations go straight after a chord, ".", or "-" with no space: G! (accent), D*stop, .*push, G*"own words". Built in: accent stop push hold fill solo drums build quiet loud.

QUICK REFERENCE
${QUICK_REFERENCE}
EXAMPLE
${EXAMPLE}`;

// The prompt with the song filled in.
export function promptFor(song) {
  const s = String(song || '').trim();
  return PROMPT.replace('{song}', s || '[song name and artist]');
}
