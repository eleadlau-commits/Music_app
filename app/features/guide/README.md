# Guide

The Guide tab. **Get a chart from Claude:** type the song (or several), **Copy the prompt**
(the format's rules, quick reference and an example, with the song filled in), paste it into
Claude, then **Paste the answer** (opens Songs' Add songs window). **See the prompt** shows the
whole text. Without a clipboard, the prompt opens in a box to copy by hand.

Then the **Quick reference** and an **Example** drawn as a chart (with `chart.render`, if
`chart-view` is there), or as text.

`prompt.js` holds the prompt, the quick reference and the example. Keep them in step with
`docs/FORMAT.md`.

No saved data, services, slots or events. Uses `chart-view` and `songs`.
