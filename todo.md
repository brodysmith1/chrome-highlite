## Extension basics

- Hard css reset to cover all sites
- x Only inject content code on activation in current tab
- x Style popup for active/inactive

## Highlight

- Triple click works

- Adding selection to highlight:

  - x successfully add data-highlights-active to all chunks
  - x adjust selection to word bounds
  - x adds formatted string to collection

- For already highlighted spans:
  - x :hover is replaced with .hover for all substrings
  - x Alt dialog shows with: delete, share, copy

## Panel buttons

- Export all to: email, plain-text (md)
- Add counter badge w animations
- x Copy all to clipboard
- x Delete highlight

## Design

- Add highlights logo

--

## Version 2 features

### Save url highlights in local to enable page revisiting and reload

- Currently, page data is reset on a new content.js injection
- Remaining hurdle is to somehow save the Selection points to re-highlight the old collection in the
  document
- Otherwise, infrastructure is already there to save collection between sessions.
- See here for useful source code for recreating highlighted range:
  https://stackoverflow.com/questions/23479533/how-can-i-save-a-range-object-from-getselection-so-that-i-can-reproduce-it-on

### Other ideas

- Scrub handles allow editing the highlight bounds
- User can drag position of Logo Button to preferred position
- Allow editing the text of individual highlights in panel
