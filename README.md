# Create PR Action

[![CI Status](https://github.com/technote-space/create-pr-action/workflows/CI/badge.svg)](https://github.com/technote-space/create-pr-action/actions)
[![codecov](https://codecov.io/gh/technote-space/create-pr-action/branch/master/graph/badge.svg)](https://codecov.io/gh/technote-space/create-pr-action)
[![CodeFactor](https://www.codefactor.io/repository/github/technote-space/create-pr-action/badge)](https://www.codefactor.io/repository/github/technote-space/create-pr-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/technote-space/create-pr-action/blob/master/LICENSE)

*Read this in other languages: [English](README.md), [日本語](README.ja.md).*

This is a `GitHub Actions` that executes an arbitrary command and commits the changes to the new pull request.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Screenshots](#screenshots)
- [Installation](#installation)
- [Options](#options)
- [Action event details](#action-event-details)
  - [Target events](#target-events)
  - [condition](#condition)
- [Addition](#addition)
- [Sample GitHub Actions using this Action](#sample-github-actions-using-this-action)
- [Author](#author)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Screenshots
![action](https://raw.githubusercontent.com/technote-space/create-pr-action/images/screenshot-1.png)

## Installation
1. Setup workflow  
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
       name: Update js packages
       runs-on: ubuntu-latest
       steps:
         - name: Release GitHub Actions
           uses: technote-space/create-pr-action@v1
           with:
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
             GLOBAL_INSTALL_PACKAGES: npm-check-updates
             EXECUTE_COMMANDS: |
               ncu -u --packageFile package.json
               yarn install
               yarn upgrade
               yarn audit
             COMMIT_MESSAGE: 'chore: update npm dependencies'
             COMMIT_NAME: 'GitHub Actions'
             COMMIT_EMAIL: 'example@example.com'
             PR_BRANCH_NAME: 'chore-npm-update-${PR_ID}'
             PR_TITLE: 'chore: update npm dependencies'
   ```
[More details of target event](#action-event-details)

## Options
### GLOBAL_INSTALL_PACKAGES
Packages to be global installed.  
default: `''`

### EXECUTE_COMMANDS
Commands to be executed.  

### COMMIT_MESSAGE
Commit message.

### COMMIT_NAME
Git commit name.  
default: `'GitHub Actions'`

### COMMIT_EMAIL
Git commit email.  
default: `'example@example.com'`

### PR_BRANCH_PREFIX
PullRequest branch prefix.  
default: `'create-pr-action/'`

### PR_BRANCH_NAME
PullRequest branch name.  
Several variables are available ([variables1](#variables1))

### PR_TITLE
PullRequest title.  
Several variables are available ([variables1](#variables1))

### PR_BODY
PullRequest body.  
Several variables are available ([variables2](#variables2))

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
- PR_NUMBER
- PR_ID
- PR_HEAD_REF
- PR_TITLE
- PR_URL

### Variables2
- [variables1](#variables1)
- PR_LINK
- COMMANDS
- COMMANDS_STDOUT
- COMMANDS_OUTPUT
- FILES
- FILES_SUMMARY

## Addition
The `GITHUB_TOKEN` that is provided as a part of `GitHub Actions` doesn't have authorization to create any successive events.  
So it won't spawn actions which triggered by push.  
This can be a problem if you have branch protection configured.  

If you want to trigger actions, use a personal access token instead.  
1. Generate a [personal access token](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line) with the public_repo or repo scope.  
(repo is required for private repositories).  
1. [Save as ACCESS_TOKEN](https://help.github.com/en/articles/virtual-environments-for-github-actions#creating-and-using-secrets-encrypted-variables)
1. Use `ACCESS_TOKEN` instead of `GITHUB_TOKEN`.  
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
       name: Update js packages
       runs-on: ubuntu-latest
       steps:
         - name: Release GitHub Actions
           uses: technote-space/create-pr-action@v1
           with:
             # GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
             GITHUB_TOKEN: ${{ secrets.ACCESS_TOKEN }}
             GLOBAL_INSTALL_PACKAGES: npm-check-updates
             EXECUTE_COMMANDS: |
               ncu -u --packageFile package.json
               yarn install
               yarn upgrade
               yarn audit
             COMMIT_MESSAGE: 'chore: update npm dependencies'
             COMMIT_NAME: 'GitHub Actions'
             COMMIT_EMAIL: 'example@example.com'
             PR_BRANCH_NAME: 'chore-npm-update-${PR_ID}'
             PR_TITLE: 'chore: update npm dependencies'
   ```

## Author
[GitHub (Technote)](https://github.com/technote-space)  
[Blog](https://technote.space)
