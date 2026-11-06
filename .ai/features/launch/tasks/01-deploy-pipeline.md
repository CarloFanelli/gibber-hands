# Task 01: deploy-pipeline

## Objective

The deploy, the pull-request check and the rules on main, built before this plan, are confirmed to do what the spec says, and any gap found is fixed.

## Context

**Satisfies**: REQ-1, REQ-2, REQ-3, REQ-12, REQ-13

The workflow, the pull-request check and both rules on main already exist: the check came in with "ci: run the checks on pull requests to main", and the rules were set on 2026-11-05. This task checks them against the spec's edge cases from the workflow file, the run history and the rule settings. It makes no test push and opens no test pull request unless Carlo asks for one.

## Depends on

None

## Expected Behavior

- https://carlofanelli.github.io/gibber-hands/ answers over HTTPS, and http:// redirects to https://.
- A push to main runs typecheck, tests and build, and the site deploys only after all three pass.
- A failed run deploys nothing, so the previous site stays live and unchanged.
- A pull request to main runs the same checks, never deploys, and GitHub refuses to merge it until the checks pass.
- Carlo can push to main directly; anyone else needs a pull request. Nobody can force-push to main or delete it.

## Acceptance Criteria

- [ ] The live site answers over HTTPS, and http:// redirects to https:// (REQ-1)
- [ ] Every push to main runs typecheck, tests and build before the deploy step can start (REQ-2)
- [ ] A failed check leaves the deploy step unrun, so the previous site stays live (REQ-3)
- [ ] A pull request runs the same checks, never deploys, and its required check blocks the merge until it passes (REQ-12)
- [ ] Main's rules let only Carlo push directly, and refuse force-pushes and deletion for everyone (REQ-13)

## Edge Cases

- Pages not enabled yet → the deploy job fails with a clear error; enabling Pages and re-running fixes it (REQ-1)
- Site opened over http:// → redirected to https:// (REQ-1)
- Repository renamed → asset paths break; the base path in the build config must change together with the name (REQ-1)
- Docs-only push → the full pipeline runs anyway (REQ-2)
- Two pushes in quick succession → the older run is cancelled; the newer one deploys (REQ-2)
- A test fails → no deploy; the previous version stays live; the failed run is visible in Actions (REQ-3)
- GitHub Actions outage → site unchanged until a later run succeeds (REQ-3)
- Pull request from a fork → the check runs with read-only access and deploys nothing (REQ-12)
- A pull request's check fails → GitHub refuses the merge; the live site stays as it is (REQ-12)
- New push to an open pull request → its older check is cancelled; a deploy in progress is not (REQ-12)
- Check required before the workflow runs on pull requests → GitHub requires the check only once the workflow change is on main (REQ-12)
- Carlo pushes to main directly → allowed, flagged by GitHub as a bypassed rule; the push deploys as before (REQ-13)
- Force-push or deletion of main, by anyone → refused; a history rewrite first needs Carlo to switch that rule off (REQ-13)
