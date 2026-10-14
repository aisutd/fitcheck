# FitCheck

## Description

FitCheck is an AI-powered virtual wardrobe and personal stylist for web and mobile. Users can try on clothes virtually, organize a digital closet, and receive outfit suggestions based on occasions, preferences, and items they already own.

## Planned Technologies

- Python and JavaScript/TypeScript
- React Native with Expo
- Node.js and Express
- Firebase
- Replicate, CLIP, Google Cloud Vision, Claude, and SerpAPI

## Docker Setup

Make sure Docker Desktop is installed and running.

```bash
docker compose up -d
docker compose down
docker compose ps
```

This is a generic starter configuration. The team can add project-specific dependencies and startup commands later.

## Python Setup

Use Python 3.11, as specified in `.python-version`. With pyenv installed, run
`pyenv install --skip-existing "$(cat .python-version)"`. Then create an environment:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
python -m pip check
```

On Windows, activate the environment with `.venv\Scripts\Activate.ps1` in PowerShell.
Add Python runtime dependencies to `requirements.txt` and development tools to
`requirements-dev.txt`, using exact versions (`package==version`). The runtime
file is intentionally empty until the Python backend is added; it does not install
the example libraries from the setup guide before the application needs them.

Once Python tests are added (`test_*.py` or `*_test.py`), run `python -m pytest`.
There are currently no Python tests on `main`.

## Continuous Integration

The **FitCheck CI** workflow runs on pull requests to `main`, pushes to `main`,
and manual dispatch. It installs the Python dependencies, checks dependency
compatibility and tracked Python syntax, runs pytest when Python test files exist,
and validates the Docker Compose configuration. It explicitly reports when no
Python tests exist; a green scaffold check does not mean the app has been tested.

For each tracked `package.json`, CI uses Node.js 22, requires a committed
`package-lock.json`, installs with `npm ci`, and runs the `lint`, `typecheck`, and
`test` scripts if defined. App code currently lives on feature branches, so npm
checks will start when those manifests are included in a pull request. Add these
scripts to each app as its checks become available; missing scripts are skipped.

## Dependency Updates

Dependabot checks Python requirements and GitHub Actions weekly after this
configuration is merged to the default branch. Minor and patch updates are grouped
per ecosystem to reduce PR noise; major updates remain separate for review.
Updates create pull requests and do not merge automatically.

The default branch does not have an npm manifest yet. When an npm app is merged,
add an entry to `.github/dependabot.yml` for its actual directory. For example:

```yaml
  - package-ecosystem: npm
    directory: /privacy-demo
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
    groups:
      npm-minor-and-patch:
        update-types:
          - minor
          - patch
```

Use `/` for a root app, or the relevant subdirectory for each standalone app.
Commit both its manifest and lockfile. These paths must exist on the default
branch for Dependabot to find the dependencies.

## Recommended Main-Branch Rule

Repository rules are configured separately from this PR. After the workflow has
completed successfully, an administrator can edit the ruleset targeting `main`
to require a pull request, require the **CI** status check, and require branches
to be up to date before merging. Use the final **CI** check because it waits for
both Python and any discovered npm projects. This PR does not change repository
rules or merge any feature branches.
