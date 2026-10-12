# Repository rulesets

Source of truth for the `main` branch and `v*` tag rules. Applying them needs repository admin rights:

```bash
gh api -X POST repos/vue-stripe/vue-stripe/rulesets --input .github/rulesets/main.json
gh api -X POST repos/vue-stripe/vue-stripe/rulesets --input .github/rulesets/release-tags.json
```

To change a ruleset later, edit the JSON and `PUT` it to `repos/vue-stripe/vue-stripe/rulesets/<id>` (list the ids with `gh api repos/vue-stripe/vue-stripe/rulesets`).

- `main`: pull request with one code-owner approval, required checks (both Node legs of CI, Vue 2.7 compatibility, Conventional commits, Conventional PR title), no force pushes, no deletion. Repository admins may bypass only through a pull request.
- `release tags`: only repository admins can create, move or delete `v*` tags, so only the maintainer can trigger `publish.yml`.

`actor_id: 5` is GitHub's built-in Admin repository role.
