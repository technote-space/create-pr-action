# GitHub Action PR Helper

[![npm version](https://badge.fury.io/js/%40technote-space%2Fgithub-action-pr-helper.svg)](https://badge.fury.io/js/%40technote-space%2Fgithub-action-pr-helper)
[![CI Status](https://github.com/technote-space/github-action-pr-helper/workflows/CI/badge.svg)](https://github.com/technote-space/github-action-pr-helper/actions)
[![codecov](https://codecov.io/gh/technote-space/github-action-pr-helper/branch/master/graph/badge.svg)](https://codecov.io/gh/technote-space/github-action-pr-helper)
[![CodeFactor](https://www.codefactor.io/repository/github/technote-space/github-action-pr-helper/badge)](https://www.codefactor.io/repository/github/technote-space/github-action-pr-helper)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/technote-space/github-action-pr-helper/blob/master/LICENSE)

*Read this in other languages: [English](README.md), [日本語](README.ja.md).*

PullRequest Helper for GitHub Actions.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Usage](#usage)
- [Author](#author)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usage
1. Install  
   1. npm  
   `npm i @technote-space/github-action-pr-helper`
   1. yarn  
   `yarn add @technote-space/github-action-pr-helper`
1. Use
```typescript
import { run } from '@technote-space/github-action-pr-helper';

run({
	actionName: 'Test Action',
	actionOwner: 'octocat',
	actionRepo: 'hello-world',
});
```

## Author
[GitHub (Technote)](https://github.com/technote-space)  
[Blog](https://technote.space)
