# Create PR Action

[![CI Status](https://github.com/technote-space/create-pr-action/workflows/CI/badge.svg)](https://github.com/technote-space/create-pr-action/actions)
[![codecov](https://codecov.io/gh/technote-space/create-pr-action/branch/master/graph/badge.svg)](https://codecov.io/gh/technote-space/create-pr-action)
[![CodeFactor](https://www.codefactor.io/repository/github/technote-space/create-pr-action/badge)](https://www.codefactor.io/repository/github/technote-space/create-pr-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/technote-space/create-pr-action/blob/master/LICENSE)

*Read this in other languages: [English](README.md), [日本語](README.ja.md).*

This is a `GitHub Actions` that executes an arbitrary command and commits the changes to the new pull request.  
It also has a management function that resolves conflicts and closes pull requests that are no longer needed.  

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
<details>
<summary>Details</summary>

- [Installation](#installation)
  - [e.g. Update npm packages](#eg-update-npm-packages)
  - [e.g. Update composer packages](#eg-update-composer-packages)
  - [e.g. Mixed](#eg-mixed)
- [Screenshots](#screenshots)
  - [Run commands](#run-commands)
  - [Created Pull Request](#created-pull-request)
- [Options](#options)
- [Action event details](#action-event-details)
  - [Target event](#target-event)
- [Variables](#variables)
  - [Variables1](#variables1)
  - [Variables2](#variables2)
- [Addition](#addition)
  - [GITHUB_TOKEN](#github_token)
  - [Auto merge](#auto-merge)
- [Author](#author)

</details>
<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation
### e.g. Update npm packages
e.g. `.github/workflows/update-npm-packages.yml`
```yaml
on:
 schedule:
   - cron: 0 0 * * *
 pull_request:
   types: [opened, synchronize, reopened, closed]

name: Update packages
jobs:
 release:
   name: Update npm packages
   runs-on: ubuntu-latest
   steps:
     - name: Update npm packages
       uses: technote-space/create-pr-action@v1
       with:
         EXECUTE_COMMANDS: |
           npx npm-check-updates -u --packageFile package.json
           yarn install
           yarn upgrade
           yarn audit
         COMMIT_MESSAGE: 'chore: update npm dependencies'
         COMMIT_NAME: 'GitHub Actions'
         COMMIT_EMAIL: 'example@example.com'
         PR_BRANCH_NAME: 'chore-npm-update-${PR_ID}'
         PR_TITLE: 'chore: update npm dependencies'
```

### e.g. Update composer packages
e.g. `.github/workflows/update-composer-packages.yml`
```yaml
on:
 schedule:
   - cron: 0 0 * * *
 pull_request:
   types: [opened, synchronize, reopened, closed]

name: Update packages
jobs:
 release:
   name: Update composer packages
   runs-on: ubuntu-latest
   steps:
     - name: Update composer packages
       uses: technote-space/create-pr-action@v1
       with:
         EXECUTE_COMMANDS: |
           rm -f "composer.lock"
           < "composer.json" jq -r '.require | to_entries[] | select(.value | startswith("^")) | select(.key | contains("/")) | .key' | tr '\n' ' ' | xargs -r php -d memory_limit=2G "$(command -v composer)" require --no-interaction --prefer-dist --no-suggest
           < "composer.json" jq -r '."require-dev" | to_entries[] | select(.value | startswith("^")) | select(.key | contains("/")) | .key' | tr '\n' ' ' | xargs -r php -d memory_limit=2G "$(command -v composer)" require --dev --no-interaction --prefer-dist --no-suggest
         COMMIT_MESSAGE: 'chore: update composer dependencies'
         COMMIT_NAME: 'GitHub Actions'
         COMMIT_EMAIL: 'example@example.com'
         PR_BRANCH_NAME: 'chore-composer-update-${PR_ID}'
         PR_TITLE: 'chore: update composer dependencies'
```

### e.g. Mixed
e.g. `.github/workflows/update-packages.yml`
```yaml
on:
 schedule:
   - cron: 0 0 * * *
 pull_request:
   types: [opened, synchronize, reopened, closed]

name: Update packages
jobs:
 release:
   name: Update packages
   runs-on: ubuntu-latest
   steps:
     - name: Update packages
       uses: technote-space/create-pr-action@v1
       with:
         EXECUTE_COMMANDS: |
           npx npm-check-updates -u --packageFile package.json
           yarn install
           yarn upgrade
           yarn audit
           rm -f "composer.lock"
           < "composer.json" jq -r '.require | to_entries[] | select(.value | startswith("^")) | select(.key | contains("/")) | .key' | tr '\n' ' ' | xargs -r php -d memory_limit=2G "$(command -v composer)" require --no-interaction --prefer-dist --no-suggest
           < "composer.json" jq -r '."require-dev" | to_entries[] | select(.value | startswith("^")) | select(.key | contains("/")) | .key' | tr '\n' ' ' | xargs -r php -d memory_limit=2G "$(command -v composer)" require --dev --no-interaction --prefer-dist --no-suggest
         COMMIT_MESSAGE: 'chore: update dependencies'
         COMMIT_NAME: 'GitHub Actions'
         COMMIT_EMAIL: 'example@example.com'
         PR_BRANCH_NAME: 'chore-update-${PR_ID}'
         PR_TITLE: 'chore: update dependencies'
```

[More details of target event](#action-event-details)

## Screenshots
### Run commands
![run command](https://raw.githubusercontent.com/technote-space/create-pr-action/images/screenshot-1.png)

### Created Pull Request
![pull request](https://raw.githubusercontent.com/technote-space/create-pr-action/images/screenshot-2.png)

## Options
| name | description | default | required | e.g. |
|:---:|:---|:---:|:---:|:---:|
|GLOBAL_INSTALL_PACKAGES|Packages to be global installed| | |`imagemin-cli`|
|EXECUTE_COMMANDS|Commands to be executed| | | |
|COMMIT_MESSAGE|Commit message| | | |
|COMMIT_NAME|Git commit name|`${github.actor}`| | |
|COMMIT_EMAIL|Git commit email|`${github.actor}@users.noreply.github.com`| | |
|PR_BRANCH_PREFIX|PullRequest branch prefix|`create-pr-action/`|true|`imagemin/`|
|PR_BRANCH_NAME|PullRequest branch name<br>Several variables are available ([variables1](#variables1))| |true|`imagemin-${PR_ID}`|
|PR_TITLE|PullRequest title<br>Several variables are available ([variables1](#variables1))| |true|`chore: minify images`|
|PR_BODY|PullRequest body<br>Several variables are available ([variables2](#variables2))| |true| |
|CHECK_DEFAULT_BRANCH|Whether to check default branch|`true`| |`false`|
|ONLY_DEFAULT_BRANCH|Whether not to check other than default branch|`false`| |`true`|
|AUTO_MERGE_THRESHOLD_DAYS|Threshold days to auto merge<br>[Detail](#auto-merge)| | |`30`|
|GITHUB_TOKEN|アクセストークン|`${{github.token}}`|true|`${{secrets.ACCESS_TOKEN}}`|

Perform an automatic merge under the following conditions:

* The number of days has passed since the PR was created
* All checks are Success
* Mergeable

## Action event details
### Target event
| eventName | action |
|:---:|:---:|
|pull_request|opened, synchronize, reopened, labeled, unlabeled|
|pull_request|closed|
|schedule|*|

- The following activity types must be explicitly specified ([detail](https://help.github.com/en/github/automating-your-workflow-with-github-actions/events-that-trigger-workflows#pull-request-event-pull_request))
  - `labeled`, `unlabeled`, `closed`

## Variables
### Variables1
| name | description |
|:---|:---|
| PR_NUMBER | pull_request.number (e.g. `11`) |
| PR_NUMBER_REF | `#${pull_request.number}` (e.g. `#11`) |
| PR_ID | pull_request.id (e.g. `21031067`) |
| PR_HEAD_REF | pull_request.head.ref (e.g. `change`) |
| PR_BASE_REF | pull_request.base.ref (e.g. `master`) |
| PR_TITLE | pull_request.title (e.g. `Update the README with new information.`) |
| PATCH_VERSION | new patch version (e.g. `v1.2.4`) |
| MINOR_VERSION | new minor version (e.g. `v1.3.0`) |
| MAJOR_VERSION | new major version (e.g. `v2.0.0`) |

### Variables2
- [variables1](#variables1)

| name | description |
|:---|:---|
| PR_LINK | Link to PR |
| COMMANDS_OUTPUT | Results of command |
| FILES_SUMMARY | e.g. `Changed 2 files` |
| FILES | Changed file list |

## Addition
### GITHUB_TOKEN
The `GITHUB_TOKEN` that is provided as a part of `GitHub Actions` doesn't have authorization to create any successive events.  
So it won't spawn actions which triggered by push.  
This can be a problem if you have branch protection configured.  

If you want to trigger actions, use a personal access token instead.  
1. Generate a [personal access token](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line) with the public_repo or repo scope.  
(repo is required for private repositories).  
1. [Save as ACCESS_TOKEN](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets)
1. Add input to use `ACCESS_TOKEN` instead of `GITHUB_TOKEN`.  
   e.g. `.github/workflows/update-packages.yml`
   ```yaml
   on:
     schedule:
       - cron: 0 0 * * *
     pull_request:
       types: [opened, synchronize, reopened, closed]

   name: Update packages
   jobs:
     release:
       name: Update npm packages
       runs-on: ubuntu-latest
       steps:
         - name: Update npm packages
           uses: technote-space/create-pr-action@v1
           with:
             GITHUB_TOKEN: ${{ secrets.ACCESS_TOKEN }}
             EXECUTE_COMMANDS: |
               npx npm-check-updates -u --packageFile package.json
               yarn install
               yarn upgrade
               yarn audit
             COMMIT_MESSAGE: 'chore: update npm dependencies'
             COMMIT_NAME: 'GitHub Actions'
             COMMIT_EMAIL: 'example@example.com'
             PR_BRANCH_NAME: 'chore-npm-update-${PR_ID}'
             PR_TITLE: 'chore: update npm dependencies'
   ```

### Auto merge
Perform an automatic merge under the following conditions:

* `AUTO_MERGE_THRESHOLD_DAYS` option is set
* No changes in this run
* The number of days has passed since the PR was created
* All checks are Success
* Mergeable

## Author
[GitHub (Technote)](https://github.com/technote-space)  
[Blog](https://technote.space)
