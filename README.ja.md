# Create PR Action

[![CI Status](https://github.com/technote-space/create-pr-action/workflows/CI/badge.svg)](https://github.com/technote-space/create-pr-action/actions)
[![codecov](https://codecov.io/gh/technote-space/create-pr-action/branch/main/graph/badge.svg)](https://codecov.io/gh/technote-space/create-pr-action)
[![CodeFactor](https://www.codefactor.io/repository/github/technote-space/create-pr-action/badge)](https://www.codefactor.io/repository/github/technote-space/create-pr-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/technote-space/create-pr-action/blob/main/LICENSE)

*Read this in other languages: [English](README.md), [日本語](README.ja.md).*

これは任意のコマンドを実行して変更をプルリクエストにコミットする `GitHub Actions` です。  
コンフリクトを解決したり不要になったプルリクエストをクローズしたりするマネジメント機能も備えています。  

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
<details>
<summary>Details</summary>

- [インストール](#%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)
  - [例：Update npm packages](#%E4%BE%8Bupdate-npm-packages)
  - [例：Update composer packages](#%E4%BE%8Bupdate-composer-packages)
  - [例：Mixed](#%E4%BE%8Bmixed)
- [スクリーンショット](#%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88)
  - [コマンドの実行](#%E3%82%B3%E3%83%9E%E3%83%B3%E3%83%89%E3%81%AE%E5%AE%9F%E8%A1%8C)
  - [作成されたプルリクエスト](#%E4%BD%9C%E6%88%90%E3%81%95%E3%82%8C%E3%81%9F%E3%83%97%E3%83%AB%E3%83%AA%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88)
- [オプション](#%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3)
- [Action イベント詳細](#action-%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88%E8%A9%B3%E7%B4%B0)
  - [対象イベント](#%E5%AF%BE%E8%B1%A1%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88)
- [変数](#%E5%A4%89%E6%95%B0)
  - [Variables1](#variables1)
  - [Variables2](#variables2)
- [補足](#%E8%A3%9C%E8%B6%B3)
  - [GITHUB_TOKEN](#github_token)
  - [Auto merge](#auto-merge)
- [Author](#author)

</details>
<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## インストール
### 例：Update npm packages
例：`.github/workflows/update-npm-packages.yml`
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
       uses: technote-space/create-pr-action@v2
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

### 例：Update composer packages
例：`.github/workflows/update-composer-packages.yml`
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
       uses: technote-space/create-pr-action@v2
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

### 例：Mixed
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
   name: Update packages
   runs-on: ubuntu-latest
   steps:
     - name: Update packages
       uses: technote-space/create-pr-action@v2
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

## スクリーンショット
### コマンドの実行
![run command](https://raw.githubusercontent.com/technote-space/create-pr-action/images/screenshot-1.png)

### 作成されたプルリクエスト
![pull request](https://raw.githubusercontent.com/technote-space/create-pr-action/images/screenshot-2.png)

## オプション
| name | description | default | required | e.g. |
|:---:|:---|:---:|:---:|:---:|
|GLOBAL_INSTALL_PACKAGES|グローバルにインストールするパッケージ| | |`imagemin-cli`|
|EXECUTE_COMMANDS|実行するコマンド| | | |
|COMMIT_MESSAGE|コミットメッセージ| | | |
|COMMIT_NAME|コミット時に設定する名前|`${github.actor}`| | |
|COMMIT_EMAIL|コミット時に設定するメールアドレス|`${github.actor}@users.noreply.github.com`| | |
|PR_BRANCH_PREFIX|ブランチ名のプリフィックス|`create-pr-action/`|true|`imagemin/`|
|PR_BRANCH_NAME|ブランチ名<br>いくつかの変数が使用可能です ([variables1](#variables1))| |true|`imagemin-${PR_ID}`|
|PR_TITLE|プルリクエストのタイトル<br>いくつかの変数が使用可能です ([variables1](#variables1))| |true|`chore: minify images`|
|PR_BODY|プルリクエストの本文<br>いくつかの変数が使用可能です ([variables2](#variables2))| |true| |
|CHECK_DEFAULT_BRANCH|デフォルトブランチをチェックするかどうか|`true`| |`false`|
|ONLY_DEFAULT_BRANCH|デフォルトブランチ以外をチェックしないかどうか|`pull_request: false` <br> `else: true`| |`true`|
|AUTO_MERGE_THRESHOLD_DAYS|自動マージを行う日数しきい値<br>[詳細](#auto-merge)| | |`30`|
|GITHUB_TOKEN|アクセストークン|`${{github.token}}`|true|`${{secrets.ACCESS_TOKEN}}`|

## Action イベント詳細
### 対象イベント
| eventName | action |
|:---:|:---:|
|pull_request|opened, synchronize, reopened, labeled, unlabeled|
|pull_request|closed|
|schedule, repository_dispatch, workflow_dispatch|*|

- 次のアクティビティタイプは明示的に指定する必要があります ([detail](https://help.github.com/ja/github/automating-your-workflow-with-github-actions/events-that-trigger-workflows#pull-request-event-pull_request))
  - `labeled`, `unlabeled`, `closed`

## 変数
### Variables1
| name | description |
|:---|:---|
| PR_NUMBER | pull_request.number (例：`11`) |
| PR_NUMBER_REF | `#${pull_request.number}` (例：`#11`) |
| PR_ID | pull_request.id (例：`21031067`) |
| PR_HEAD_REF | pull_request.head.ref (例：`change`) |
| PR_BASE_REF | pull_request.base.ref (例：`main`) |
| PR_TITLE | pull_request.title (例：`Update the README with new information.`) |
| PATCH_VERSION | new patch version (e.g. `v1.2.4`) |
| MINOR_VERSION | new minor version (e.g. `v1.3.0`) |
| MAJOR_VERSION | new major version (e.g. `v2.0.0`) |

### Variables2
- [variables1](#variables1)

| name | description |
|:---|:---|
| PR_LINK | プルリクエストへのリンク |
| COMMANDS_OUTPUT | コマンドの結果 |
| FILES_SUMMARY | 例：`Changed 2 files` |
| FILES | 変更されたファイル一覧 |

## 補足
### GITHUB_TOKEN
GitHub Actions で提供される`GITHUB_TOKEN`は連続するイベントを作成する権限がありません。  
したがって、プッシュによってトリガーされるビルドアクションなどは実行されません。  
これはブランチプロテクションを設定していると問題になる場合があります。  

もしアクションをトリガーしたい場合は代わりに`personal access token`を使用してください。  
1. public_repo または repo の権限で [Personal access token](https://help.github.com/ja/articles/creating-a-personal-access-token-for-the-command-line) を生成  
(repo はプライベートリポジトリで必要です)  
1. [ACCESS_TOKENとして保存](https://help.github.com/ja/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets)
1. `GITHUB_TOKEN`の代わりに`ACCESS_TOKEN`を使用するように設定  
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
       name: Update npm packages
       runs-on: ubuntu-latest
       steps:
         - name: Update npm packages
           uses: technote-space/create-pr-action@v2
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
以下の条件を満たす場合、自動でマージを行います。

* `AUTO_MERGE_THRESHOLD_DAYS` が設定されている
* 今回の実行で変更がない
* PRを作成してからこの値の日数が経っている
* すべてのチェックがSuccess
* マージ可能

## Author
[GitHub (Technote)](https://github.com/technote-space)  
[Blog](https://technote.space)
