# Create PR Action

[![CI Status](https://github.com/technote-space/create-pr-action/workflows/CI/badge.svg)](https://github.com/technote-space/create-pr-action/actions)
[![codecov](https://codecov.io/gh/technote-space/create-pr-action/branch/master/graph/badge.svg)](https://codecov.io/gh/technote-space/create-pr-action)
[![CodeFactor](https://www.codefactor.io/repository/github/technote-space/create-pr-action/badge)](https://www.codefactor.io/repository/github/technote-space/create-pr-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/technote-space/create-pr-action/blob/master/LICENSE)

*Read this in other languages: [English](README.md), [日本語](README.ja.md).*

これは任意のコマンドを実行して変更をプルリクエストにコミットする `GitHub Actions` です。  
コンフリクトを解決したり不要になったプルリクエストをクローズしたりするマネジメント機能も備えています。  

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [スクリーンショット](#%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88)
  - [コマンドの実行](#%E3%82%B3%E3%83%9E%E3%83%B3%E3%83%89%E3%81%AE%E5%AE%9F%E8%A1%8C)
  - [作成されたプルリクエスト](#%E4%BD%9C%E6%88%90%E3%81%95%E3%82%8C%E3%81%9F%E3%83%97%E3%83%AB%E3%83%AA%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88)
- [インストール](#%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)
- [オプション](#%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3)
  - [GLOBAL_INSTALL_PACKAGES](#global_install_packages)
  - [EXECUTE_COMMANDS](#execute_commands)
  - [COMMIT_MESSAGE](#commit_message)
  - [COMMIT_NAME](#commit_name)
  - [COMMIT_EMAIL](#commit_email)
  - [PR_BRANCH_PREFIX](#pr_branch_prefix)
  - [PR_BRANCH_NAME](#pr_branch_name)
  - [PR_TITLE](#pr_title)
  - [PR_BODY](#pr_body)
- [Action イベント詳細](#action-%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88%E8%A9%B3%E7%B4%B0)
  - [対象イベント](#%E5%AF%BE%E8%B1%A1%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88)
- [変数](#%E5%A4%89%E6%95%B0)
  - [Variables1](#variables1)
  - [Variables2](#variables2)
- [補足](#%E8%A3%9C%E8%B6%B3)
- [Author](#author)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## スクリーンショット
### コマンドの実行
![run command](https://raw.githubusercontent.com/technote-space/create-pr-action/images/screenshot-1.png)

### 作成されたプルリクエスト
![pull request](https://raw.githubusercontent.com/technote-space/create-pr-action/images/screenshot-2.png)

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
default: `'github-actions[bot]'`

### COMMIT_EMAIL
コミット時に設定するメールアドレス  
default: `'41898282+github-actions[bot]@users.noreply.github.com'`

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
| name | description |
|:---|:---|
| PR_NUMBER | pull_request.number (例：`11`) |
| PR_NUMBER_REF | `#${pull_request.number}` (例：`#11`) |
| PR_ID | pull_request.id (例：`21031067`) |
| PR_HEAD_REF | pull_request.head.ref (例：`change`) |
| PR_BASE_REF | pull_request.base.ref (例：`master`) |
| PR_TITLE | pull_request.title (例：`Update the README with new information.`) |

### Variables2
- [variables1](#variables1)

| name | description |
|:---|:---|
| PR_LINK | プルリクエストへのリンク |
| COMMANDS_OUTPUT | TOC コマンドの結果 |
| FILES_SUMMARY | 例：`Changed 2 files` |
| FILES | 変更されたファイル一覧 |

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
