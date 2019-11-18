# Create PR Action

[![CI Status](https://github.com/technote-space/upgrade-packages-action/workflows/CI/badge.svg)](https://github.com/technote-space/upgrade-packages-action/actions)
[![codecov](https://codecov.io/gh/technote-space/upgrade-packages-action/branch/master/graph/badge.svg)](https://codecov.io/gh/technote-space/upgrade-packages-action)
[![CodeFactor](https://www.codefactor.io/repository/github/technote-space/upgrade-packages-action/badge)](https://www.codefactor.io/repository/github/technote-space/upgrade-packages-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/technote-space/upgrade-packages-action/blob/master/LICENSE)

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

## Installation
1. Setup workflow  
   e.g. `.github/workflows/update-packages.yml`
   ```yaml
   # on: push
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
             EXECUTE_COMMANDS: ncu -u && yarn install && yarn upgrade && yarn audit
             COMMIT_MESSAGE: 'chore: update npm dependencies'
             COMMIT_NAME: 'GitHub Actions'
             COMMIT_EMAIL: 'example@example.com'
             PR_BRANCH_NAME: 'chore-npm-update-${PR_ID}'
             PR_TITLE: 'chore: update npm dependencies'
   ```
[More details of target event](#action-event-details)

## Options
.....................................

## Action event details
### Target events

### condition

## Addition

## Sample GitHub Actions using this Action

## Author
[GitHub (Technote)](https://github.com/technote-space)  
[Blog](https://technote.space)
