# Task 02: hand-model-loading

## Objective

When the page opens, the hand model downloads at the same time as the camera request, with its progress shown as a percentage. If it can't load, the camera panel says why and offers Try again.

## Context

**Satisfies**: REQ-4, REQ-5

A first visit downloads about 12 MB: the 8.4 MB hand model plus the MediaPipe runtime files. It must start at once and show progress, or the 10-second target to the first tracked hand is lost. The sliders that appear with some failures arrive in Task 05; tracking itself arrives in Task 03.

## Depends on

- Task 01 (the camera panel shows the progress and the failure messages)

## Expected Behavior

- On page load the hand model starts downloading in parallel with the camera request; neither waits for the other.
- The camera panel shows "Loading hand model… 42%", with or without the video behind it.
- When the server sends no file size, it shows "Loading hand model…" without a percentage.
- When loading completes, the progress disappears.
- If loading fails, the panel names the reason and offers Try again, except when the browser can't run hand tracking at all.
- The runtime files come from the CDN at exactly the installed MediaPipe package version.

## Acceptance Criteria

- [ ] The hand model starts downloading on page load, before the camera prompt is answered (REQ-4)
- [ ] The camera panel shows download progress as a percentage, which reaches 100% when the model is ready (REQ-4)
- [ ] The runtime files' CDN address contains the installed MediaPipe package version, 1.2.0 (REQ-4)
- [ ] With the network off, the panel shows "Hand tracking unavailable: no network" and Try again (REQ-5)
- [ ] Try again after a failure restarts the download without reloading the page (REQ-5)
- [ ] A download with no progress for 30 s is reported as a failure (REQ-5)

## Edge Cases

- Server sends no file size → "Loading hand model…" without a percentage (REQ-4)
- Camera ready before the model → the video shows with the progress over it (REQ-4)
- Second visit within the cache window → the model comes from the browser cache; progress jumps to 100% (REQ-4)
- Camera prompt not answered yet → the model keeps downloading (REQ-1)
- Offline at load → "Hand tracking unavailable: no network"; Try again offered (REQ-5)
- Download stalls 30 s with no progress → treated as a failure (REQ-5)
- Runtime files blocked (firewall, content blocker) → the failure message names the file that couldn't load (REQ-5)
- Model file corrupted or wrong format → "Hand model is damaged" (REQ-5)
- Browser without WebAssembly → "This browser can't run hand tracking", no Try again (REQ-5)
- Graphics acceleration unavailable → the model falls back to the processor without a message (REQ-5)

## Notes from implementation

- **Known limitation**: the 30 s stall check covers the hand model download only. The runtime files (about 3.3 MB compressed) are fetched by MediaPipe's own loader, which reports no progress, so a stall there can't be told apart from a slow connection; a failed runtime fetch is still reported and names the file. /dev, 2026-11-02.
