# Task 04: sharing

## Objective

A link to the live demo, shared in a chat or a post, shows the title, a one-line description and a 1200×630 still from the demo. The repository's About box links the live site and lists the seven topics.

## Context

**Satisfies**: REQ-9, REQ-10

Today the page has only a title. The About box has a description, but no website and no topics. Carlo records the still, since it needs his hand and camera. The About box is visible outside the repo, so it changes only with Carlo's go-ahead at that moment. It doesn't have to wait for the still.

## Depends on

None

## Expected Behavior

- The page gives link previews a title, a one-line description and the still, with the still's address absolute on the live site.
- The still is 1200×630, taken from the demo, kept in the repo and served by the site.
- The About box shows https://carlofanelli.github.io/gibber-hands/ and the topics mediapipe, gibber, web-audio, typescript, gesture-recognition, creative-coding and claude-code. The description stays as it is.
- The page still sends nothing anywhere and makes no request to a new site.

## Acceptance Criteria

- [ ] A link-preview inspector shows the title, the one-line description and the 1200×630 still for the live URL (REQ-9)
- [ ] The still's address in the page is absolute, on carlofanelli.github.io (REQ-9)
- [ ] The About box shows the live site URL and exactly the seven topics, with the description unchanged (REQ-10)
- [ ] The About box changed only after Carlo's go-ahead in that session (REQ-10)

## Edge Cases

- Preview image given as a relative path → absolute URL, since link-preview crawlers need one (REQ-9)
- A platform shows an old preview from its cache → refreshed through that platform's preview inspector; outside the site's control (REQ-9)
- Topics with spaces or capitals → lowercase and hyphenated, as GitHub requires; the seven listed already are (REQ-10)
- Site not live yet → the About URL is set after the first successful deploy; true since 2026-11-05 (REQ-10)
- Agent asked to edit the About box → only with Carlo's go-ahead in that session; the existing description stays (REQ-10)
