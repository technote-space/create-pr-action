# Create PR Action

[![CI Status](https://github.com/technote-space/upgrade-packages-action/workflows/CI/badge.svg)](https://github.com/technote-space/upgrade-packages-action/actions)
[![codecov](https://codecov.io/gh/technote-space/upgrade-packages-action/branch/master/graph/badge.svg)](https://codecov.io/gh/technote-space/upgrade-packages-action)
[![CodeFactor](https://www.codefactor.io/repository/github/technote-space/upgrade-packages-action/badge)](https://www.codefactor.io/repository/github/technote-space/upgrade-packages-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/technote-space/upgrade-packages-action/blob/master/LICENSE)

*Read this in other languages: [English](README.md), [日本語](README.ja.md).*

これは任意のコマンドを実行して変更をプルリクエストにコミットする `GitHub Actions` です。

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

## スクリーンショット
![action](https://raw.githubusercontent.com/technote-space/create-pr-action/images/screenshot-1.png)

## インストール
1. workflow を設定  
   例：`.github/workflows/update-packages.yml`
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

## オプション
### GLOBAL_INSTALL_PACKAGES
グローバルにインストールするパッケージ
default: `''`

### EXECUTE_COMMANDS
実行するコマンド

### COMMIT_MESSAGE
コミットメッセージ

### COMMIT_NAME
コミット時に設定する名前  
default: `'GitHub Actions'`

### COMMIT_EMAIL
コミット時に設定するメールアドレス  
default: `'example@example.com'`

### PR_BRANCH_PREFIX
ブランチ名のプリフィックス  
default: `'create-pr-action/'`

### PR_BRANCH_NAME
ブランチ名  
いくつかの変数が使用可能です ([variables1](#variables1))

### PR_TITLE
プルリクエストのタイトル  
いくつかの変数が使用可能です ([variables1](#variables1))

### PR_BODY
プルリクエストの本文  
いくつかの変数が使用可能です ([variables2](#variables2))

## Action イベント詳細
### 対象イベント
| eventName | action |
|:---:|:---:|
|pull_request|opened, synchronize, reopened, labeled, unlabeled|
|pull_request|closed|
|schedule|*|

- The following activity types must be explicitly specified ([detail](https://help.github.com/en/github/automating-your-workflow-with-github-actions/events-that-trigger-workflows#pull-request-event-pull_request))
  - `labeled`, `unlabeled`, `closed`

## 変数
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

## 補足
GitHub Actions で提供される`GITHUB_TOKEN`は連続するイベントを作成する権限がありません。  
したがって、プッシュによってトリガーされるビルドアクションなどは実行されません。  
これはブランチプロテクションを設定していると問題になる場合があります。  

もしアクションをトリガーしたい場合は代わりに`personal access token`を使用してください。  
1. public_repo または repo の権限で [Personal access token](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line) を生成  
(repo はプライベートリポジトリで必要です)  
1. [ACCESS_TOKENとして保存](https://help.github.com/en/articles/virtual-environments-for-github-actions#creating-and-using-secrets-encrypted-variables)
1. `GITHUB_TOKEN`の代わりに`ACCESS_TOKEN`を使用  
   例：`.github/workflows/update-packages.yml`
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
