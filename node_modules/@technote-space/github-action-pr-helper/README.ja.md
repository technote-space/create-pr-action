# GitHub Action PR Helper

[![npm version](https://badge.fury.io/js/%40technote-space%2Fgithub-action-pr-helper.svg)](https://badge.fury.io/js/%40technote-space%2Fgithub-action-pr-helper)
[![CI Status](https://github.com/technote-space/github-action-pr-helper/workflows/CI/badge.svg)](https://github.com/technote-space/github-action-pr-helper/actions)
[![codecov](https://codecov.io/gh/technote-space/github-action-pr-helper/branch/master/graph/badge.svg)](https://codecov.io/gh/technote-space/github-action-pr-helper)
[![CodeFactor](https://www.codefactor.io/repository/github/technote-space/github-action-pr-helper/badge)](https://www.codefactor.io/repository/github/technote-space/github-action-pr-helper)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/technote-space/github-action-pr-helper/blob/master/LICENSE)

*Read this in other languages: [English](README.md), [日本語](README.ja.md).*

GitHub Actions 用のプルリクヘルパー

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [使用方法](#%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95)
- [Author](#author)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 使用方法
1. インストール  
   1. npm  
   `npm i @technote-space/github-action-pr-helper`
   1. yarn  
   `yarn add @technote-space/github-action-pr-helper`
1. 使用
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
