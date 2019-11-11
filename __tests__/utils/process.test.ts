/* eslint-disable no-magic-numbers */
import { Context } from '@actions/github/lib/context';
import nock from 'nock';
import path from 'path';
import {
	generateContext,
	testEnv,
	testFs,
	disableNetConnect,
	spyOnStdout,
	stdoutCalledWith,
	getApiFixture,
	setChildProcessParams,
	testChildProcess,
} from '@technote-space/github-action-test-helper';
import { Logger } from '@technote-space/github-action-helper';
import { execute } from '../../src/utils/process';
import * as constants from '../../src/constant';

const rootDir   = path.resolve(__dirname, '..', 'fixtures');
const setExists = testFs();
beforeEach(() => {
	Logger.resetForTesting();
});

const context = (action: string, event = 'pull_request'): Context => generateContext({
	owner: 'hello',
	repo: 'world',
	event,
	action,
	ref: 'heads/test',
	sha: '7638417db6d59f3c431d3e1f261cc637155684cd',
}, {
	payload: {
		'pull_request': {
			number: 11,
			id: 21031067,
			head: {
				ref: 'change',
			},
			base: {
				ref: 'master',
			},
		},
	},
});

describe('execute', () => {
	disableNetConnect(nock);
	testEnv();
	testChildProcess();

	it('should close pull request 1', async() => {
		process.env.GITHUB_WORKSPACE     = path.resolve('test');
		process.env.INPUT_GITHUB_TOKEN   = 'test-token';
		process.env.INPUT_PR_BRANCH_NAME = 'close/test';
		const mockStdout                 = spyOnStdout();

		nock('https://api.github.com')
			.persist()
			.get('/repos/hello/world/pulls?head=hello%3Acreate-pr-action%2Fclose%2Ftest')
			.reply(200, () => getApiFixture(rootDir, 'pulls.list'))
			.patch('/repos/hello/world/pulls/1347')
			.reply(200, () => getApiFixture(rootDir, 'pulls.update'))
			.delete('/repos/hello/world/git/refs/heads/create-pr-action/close/test')
			.reply(204);

		await execute(context('closed'));

		stdoutCalledWith(mockStdout, [
			'::group::Closing PullRequest... [create-pr-action/close/test]',
			'::endgroup::',
			'::group::Deleting reference... [refs/heads/create-pr-action/close/test]',
			'::endgroup::',
		]);
	});

	it('should close pull request 2', async() => {
		process.env.GITHUB_WORKSPACE       = path.resolve('test');
		process.env.INPUT_GITHUB_TOKEN     = 'test-token';
		process.env.INPUT_EXECUTE_COMMANDS = 'yarn upgrade';
		process.env.INPUT_PR_BRANCH_NAME   = 'test-branch';
		process.env.INPUT_COMMIT_NAME      = 'GitHub Actions';
		process.env.INPUT_COMMIT_EMAIL     = 'example@example.com';
		process.env.INPUT_PR_BRANCH_NAME   = 'create/test';
		process.env.INPUT_COMMIT_MESSAGE   = 'test: create pull request';
		process.env.INPUT_PR_TITLE         = 'test: create pull request (${PR_NUMBER})';
		process.env.INPUT_PR_BODY          = 'pull request body';
		const mockStdout                   = spyOnStdout();
		setChildProcessParams({
			stdout: (command: string): string => {
				if (command.endsWith('status --short -uno')) {
					return 'M  __tests__/fixtures/test.md';
				}
				if (command.includes(' branch -a ')) {
					return 'test';
				}
				return '';
			},
		});
		setExists(true);
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		constants.INTERVAL_MS = 1;

		nock('https://api.github.com')
			.persist()
			.get('/repos/hello/world/pulls?sort=created&direction=asc&per_page=100&page=1')
			.reply(200, () => getApiFixture(rootDir, 'pulls.list'))
			.get('/repos/hello/world/pulls?sort=created&direction=asc&per_page=100&page=2')
			.reply(200, () => ([]))
			.get('/repos/hello/world/pulls?head=hello%3Acreate-pr-action%2Fcreate%2Ftest')
			.reply(200, () => getApiFixture(rootDir, 'pulls.list'))
			.patch('/repos/hello/world/pulls/1347')
			.reply(200, () => getApiFixture(rootDir, 'pulls.update'))
			.delete('/repos/hello/world/git/refs/heads/create-pr-action/create/test')
			.reply(204);

		await execute(context('synchronize'));

		stdoutCalledWith(mockStdout, [
			'::group::Initializing working directory...',
			'[command]rm -rdf ./*',
			'::endgroup::',
			'::group::Cloning [create-pr-action/create/test] branch from the remote repo...',
			'[command]git clone --branch=create-pr-action/create/test --depth=3',
			'[command]git branch -a | grep -E \'^\\*\' | cut -b 3-',
			'  >> test',
			'> remote branch [create-pr-action/create/test] not found.',
			'> now branch: test',
			'::endgroup::',
			'::group::Cloning [change] from the remote repo...',
			'[command]git clone --branch=change --depth=3',
			'[command]git checkout -b "create-pr-action/create/test"',
			'[command]ls -la',
			'::endgroup::',
			'::group::Running commands...',
			'[command]yarn upgrade',
			'::endgroup::',
			'::group::Checking diff...',
			'[command]git add --all',
			'[command]git status --short -uno',
			'::endgroup::',
			'::group::Configuring git committer to be GitHub Actions <example@example.com>',
			'[command]git config user.name "GitHub Actions"',
			'[command]git config user.email "example@example.com"',
			'::endgroup::',
			'::group::Committing...',
			'[command]git commit -qm "test: create pull request"',
			'[command]git show --stat-count=10 HEAD',
			'::endgroup::',
			'::group::Pushing to hello/world@create-pr-action/create/test...',
			'[command]git push "create-pr-action/create/test":"refs/heads/create-pr-action/create/test"',
			'::endgroup::',
			'::group::Checking references diff...',
			'[command]git fetch --prune --no-recurse-submodules --depth=3 origin +refs/heads/change:refs/remotes/origin/change',
			'[command]git diff origin/change...origin/create-pr-action/create/test --name-only',
			'::endgroup::',
			'::group::Closing PullRequest... [create-pr-action/create/test]',
			'::endgroup::',
			'::group::Deleting reference... [refs/heads/create-pr-action/create/test]',
			'::endgroup::',
		]);
	});

	it('should do nothing 1', async() => {
		process.env.INPUT_GITHUB_TOKEN = 'test-token';
		const mockStdout               = spyOnStdout();

		nock('https://api.github.com')
			.persist()
			.get('/repos/hello/world/pulls?sort=created&direction=asc&per_page=100&page=1')
			.reply(200, () => getApiFixture(rootDir, 'pulls.list'))
			.get('/repos/hello/world/pulls?sort=created&direction=asc&per_page=100&page=2')
			.reply(200, () => ([]));

		await execute(context('', 'schedule'));

		stdoutCalledWith(mockStdout, []);
	});

	it('should do nothing 2', async() => {
		process.env.GITHUB_WORKSPACE       = path.resolve('test');
		process.env.INPUT_GITHUB_TOKEN     = 'test-token';
		process.env.INPUT_EXECUTE_COMMANDS = 'yarn upgrade';
		process.env.INPUT_COMMIT_NAME      = 'GitHub Actions';
		process.env.INPUT_COMMIT_EMAIL     = 'example@example.com';
		process.env.INPUT_PR_BRANCH_NAME   = 'test-branch';
		const mockStdout                   = spyOnStdout();
		setExists(true);

		nock('https://api.github.com')
			.persist()
			.get('/repos/hello/world/pulls?head=hello%3Acreate-pr-action%2Ftest-branch')
			.reply(200, () => []);

		await execute(context('synchronize'));

		stdoutCalledWith(mockStdout, [
			'::group::Initializing working directory...',
			'[command]rm -rdf ./*',
			'  >> stdout',
			'::endgroup::',
			'::group::Cloning [create-pr-action/test-branch] branch from the remote repo...',
			'[command]git clone --branch=create-pr-action/test-branch --depth=3',
			'[command]git branch -a | grep -E \'^\\*\' | cut -b 3-',
			'  >> stdout',
			'> remote branch [create-pr-action/test-branch] not found.',
			'> now branch: stdout',
			'::endgroup::',
			'::group::Cloning [change] from the remote repo...',
			'[command]git clone --branch=change --depth=3',
			'[command]git checkout -b "create-pr-action/test-branch"',
			'  >> stdout',
			'[command]ls -la',
			'  >> stdout',
			'::endgroup::',
			'::group::Running commands...',
			'[command]yarn upgrade',
			'  >> stdout',
			'::endgroup::',
			'::group::Checking diff...',
			'[command]git add --all',
			'  >> stdout',
			'[command]git status --short -uno',
			'> There is no diff.',
			'::endgroup::',
		]);
	});

	it('should create pull request', async() => {
		process.env.GITHUB_WORKSPACE       = path.resolve('test');
		process.env.INPUT_GITHUB_TOKEN     = 'test-token';
		process.env.INPUT_EXECUTE_COMMANDS = 'yarn upgrade';
		process.env.INPUT_COMMIT_NAME      = 'GitHub Actions';
		process.env.INPUT_COMMIT_EMAIL     = 'example@example.com';
		process.env.INPUT_PR_BRANCH_NAME   = 'create/test';
		process.env.INPUT_COMMIT_MESSAGE   = 'test: create pull request';
		process.env.INPUT_PR_TITLE         = 'test: create pull request (${PR_NUMBER})';
		process.env.INPUT_PR_BODY          = 'pull request body';
		const mockStdout                   = spyOnStdout();
		setChildProcessParams({
			stdout: (command: string): string => {
				if (command.endsWith('status --short -uno')) {
					return 'M  __tests__/fixtures/test.md';
				}
				if (command.includes(' diff ')) {
					return '__tests__/fixtures/test.md';
				}
				if (command.includes(' branch -a ')) {
					return 'test';
				}
				return '';
			},
		});
		setExists(true);

		nock('https://api.github.com')
			.persist()
			.get('/repos/hello/world/pulls?head=hello%3Acreate-pr-action%2Fcreate%2Ftest')
			.reply(200, () => getApiFixture(rootDir, 'pulls.list'))
			.post('/repos/hello/world/issues/1347/comments')
			.reply(201)
			.get('/repos/hello/world/pulls/1347')
			.reply(200, () => getApiFixture(rootDir, 'pulls.get.mergeable.true'));

		await execute(context('synchronize'));

		stdoutCalledWith(mockStdout, [
			'::group::Initializing working directory...',
			'[command]rm -rdf ./*',
			'::endgroup::',
			'::group::Cloning [create-pr-action/create/test] branch from the remote repo...',
			'[command]git clone --branch=create-pr-action/create/test --depth=3',
			'[command]git branch -a | grep -E \'^\\*\' | cut -b 3-',
			'  >> test',
			'> remote branch [create-pr-action/create/test] not found.',
			'> now branch: test',
			'::endgroup::',
			'::group::Cloning [change] from the remote repo...',
			'[command]git clone --branch=change --depth=3',
			'[command]git checkout -b "create-pr-action/create/test"',
			'[command]ls -la',
			'::endgroup::',
			'::group::Running commands...',
			'[command]yarn upgrade',
			'::endgroup::',
			'::group::Checking diff...',
			'[command]git add --all',
			'[command]git status --short -uno',
			'::endgroup::',
			'::group::Configuring git committer to be GitHub Actions <example@example.com>',
			'[command]git config user.name "GitHub Actions"',
			'[command]git config user.email "example@example.com"',
			'::endgroup::',
			'::group::Committing...',
			'[command]git commit -qm "test: create pull request"',
			'[command]git show --stat-count=10 HEAD',
			'::endgroup::',
			'::group::Pushing to hello/world@create-pr-action/create/test...',
			'[command]git push "create-pr-action/create/test":"refs/heads/create-pr-action/create/test"',
			'::endgroup::',
			'::group::Checking references diff...',
			'[command]git fetch --prune --no-recurse-submodules --depth=3 origin +refs/heads/change:refs/remotes/origin/change',
			'[command]git diff origin/change...origin/create-pr-action/create/test --name-only',
			'::endgroup::',
			'::group::Creating comment to PullRequest... [create-pr-action/create/test] -> [heads/test]',
			'::endgroup::',
		]);
	});

	it('should do schedule', async() => {
		process.env.GITHUB_WORKSPACE       = path.resolve('test');
		process.env.INPUT_GITHUB_TOKEN     = 'test-token';
		process.env.INPUT_EXECUTE_COMMANDS = 'yarn upgrade';
		process.env.INPUT_PR_BRANCH_NAME   = 'test-branch';
		process.env.INPUT_COMMIT_NAME      = 'GitHub Actions';
		process.env.INPUT_COMMIT_EMAIL     = 'example@example.com';
		process.env.INPUT_PR_BRANCH_NAME   = 'create/test';
		process.env.INPUT_COMMIT_MESSAGE   = 'test: create pull request';
		process.env.INPUT_PR_TITLE         = 'test: create pull request (${PR_NUMBER})';
		process.env.INPUT_PR_BODY          = 'pull request body';
		const mockStdout                   = spyOnStdout();
		setChildProcessParams({
			stdout: (command: string): string => {
				if (command.endsWith('status --short -uno')) {
					return 'M  __tests__/fixtures/test.md';
				}
				if (command.includes(' diff ')) {
					return '__tests__/fixtures/test.md';
				}
				if (command.includes(' branch -a ')) {
					return 'test';
				}
				return '';
			},
		});
		setExists(true);
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		constants.INTERVAL_MS = 1;

		nock('https://api.github.com')
			.persist()
			.get('/repos/hello/world/pulls?sort=created&direction=asc&per_page=100&page=1')
			.reply(200, () => getApiFixture(rootDir, 'pulls.list2'))
			.get('/repos/hello/world/pulls?sort=created&direction=asc&per_page=100&page=2')
			.reply(200, () => ([]))
			.get('/repos/octocat/Hello-World/pulls?head=octocat%3Acreate-pr-action%2Fcreate%2Ftest')
			.reply(200, () => getApiFixture(rootDir, 'pulls.list'))
			.patch('/repos/octocat/Hello-World/pulls/1347')
			.reply(200, () => getApiFixture(rootDir, 'pulls.update'))
			.post('/repos/octocat/Hello-World/issues/1347/comments')
			.reply(201)
			.get('/repos/octocat/Hello-World/pulls/1347')
			.reply(200, () => getApiFixture(rootDir, 'pulls.get.mergeable.true'));

		await execute(context('', 'schedule'));

		stdoutCalledWith(mockStdout, [
			'::group::Target PullRequest Ref [feature/new-topic]',
			'> Initializing working directory...',
			'[command]rm -rdf ./*',
			'> Cloning [create-pr-action/create/test] branch from the remote repo...',
			'[command]git clone --branch=create-pr-action/create/test --depth=3',
			'[command]git branch -a | grep -E \'^\\*\' | cut -b 3-',
			'  >> test',
			'> remote branch [create-pr-action/create/test] not found.',
			'> now branch: test',
			'> Cloning [feature/new-topic] from the remote repo...',
			'[command]git clone --branch=feature/new-topic --depth=3',
			'[command]git checkout -b "create-pr-action/create/test"',
			'[command]ls -la',
			'> Running commands...',
			'[command]yarn upgrade',
			'> Checking diff...',
			'[command]git add --all',
			'[command]git status --short -uno',
			'> Configuring git committer to be GitHub Actions <example@example.com>',
			'[command]git config user.name "GitHub Actions"',
			'[command]git config user.email "example@example.com"',
			'> Committing...',
			'[command]git commit -qm "test: create pull request"',
			'[command]git show --stat-count=10 HEAD',
			'> Pushing to octocat/Hello-World@create-pr-action/create/test...',
			'[command]git push "create-pr-action/create/test":"refs/heads/create-pr-action/create/test"',
			'> Checking references diff...',
			'[command]git fetch --prune --no-recurse-submodules --depth=3 origin +refs/heads/feature/new-topic:refs/remotes/origin/feature/new-topic',
			'[command]git diff origin/feature/new-topic...origin/create-pr-action/create/test --name-only',
			'> Creating comment to PullRequest... [create-pr-action/create/test] -> [heads/test]',
			'::endgroup::',
			'::group::Target PullRequest Ref [feature/new-topic]',
			'> Initializing working directory...',
			'[command]rm -rdf ./*',
			'> Cloning [create-pr-action/create/test] branch from the remote repo...',
			'[command]git clone --branch=create-pr-action/create/test --depth=3',
			'[command]git branch -a | grep -E \'^\\*\' | cut -b 3-',
			'  >> test',
			'> remote branch [create-pr-action/create/test] not found.',
			'> now branch: test',
			'> Cloning [feature/new-topic] from the remote repo...',
			'[command]git clone --branch=feature/new-topic --depth=3',
			'[command]git checkout -b "create-pr-action/create/test"',
			'[command]ls -la',
			'> Running commands...',
			'[command]yarn upgrade',
			'> Checking diff...',
			'[command]git add --all',
			'[command]git status --short -uno',
			'> Configuring git committer to be GitHub Actions <example@example.com>',
			'[command]git config user.name "GitHub Actions"',
			'[command]git config user.email "example@example.com"',
			'> Committing...',
			'[command]git commit -qm "test: create pull request"',
			'[command]git show --stat-count=10 HEAD',
			'> Pushing to octocat/Hello-World@create-pr-action/create/test...',
			'[command]git push "create-pr-action/create/test":"refs/heads/create-pr-action/create/test"',
			'> Checking references diff...',
			'[command]git fetch --prune --no-recurse-submodules --depth=3 origin +refs/heads/feature/new-topic:refs/remotes/origin/feature/new-topic',
			'[command]git diff origin/feature/new-topic...origin/create-pr-action/create/test --name-only',
			'> Creating comment to PullRequest... [create-pr-action/create/test] -> [heads/test]',
			'::endgroup::',
		]);
	});

	it('should resolve conflicts', async() => {
		process.env.GITHUB_WORKSPACE       = path.resolve('test');
		process.env.INPUT_GITHUB_TOKEN     = 'test-token';
		process.env.INPUT_EXECUTE_COMMANDS = 'yarn upgrade';
		process.env.INPUT_COMMIT_NAME      = 'GitHub Actions';
		process.env.INPUT_COMMIT_EMAIL     = 'example@example.com';
		process.env.INPUT_PR_BRANCH_NAME   = 'create/test';
		process.env.INPUT_COMMIT_MESSAGE   = 'test: create pull request';
		process.env.INPUT_PR_TITLE         = 'test: create pull request (${PR_NUMBER})';
		process.env.INPUT_PR_BODY          = 'pull request body';
		const mockStdout                   = spyOnStdout();
		setChildProcessParams({
			stdout: (command: string): string => {
				if (command.startsWith('git merge')) {
					return 'Already up to date.';
				}
				if (command.includes(' diff ')) {
					return '__tests__/fixtures/test.md';
				}
				if (command.includes(' branch -a ')) {
					return 'test';
				}
				return '';
			},
		});
		setExists(true);

		nock('https://api.github.com')
			.persist()
			.get('/repos/hello/world/pulls?head=hello%3Acreate-pr-action%2Fcreate%2Ftest')
			.reply(200, () => getApiFixture(rootDir, 'pulls.list'))
			.get('/repos/hello/world/pulls/1347')
			.reply(200, () => getApiFixture(rootDir, 'pulls.get.mergeable.false'));

		await execute(context('synchronize'));

		stdoutCalledWith(mockStdout, [
			'::group::Initializing working directory...',
			'[command]rm -rdf ./*',
			'::endgroup::',
			'::group::Cloning [create-pr-action/create/test] branch from the remote repo...',
			'[command]git clone --branch=create-pr-action/create/test --depth=3',
			'[command]git branch -a | grep -E \'^\\*\' | cut -b 3-',
			'  >> test',
			'> remote branch [create-pr-action/create/test] not found.',
			'> now branch: test',
			'::endgroup::',
			'::group::Cloning [change] from the remote repo...',
			'[command]git clone --branch=change --depth=3',
			'[command]git checkout -b "create-pr-action/create/test"',
			'[command]ls -la',
			'::endgroup::',
			'::group::Running commands...',
			'[command]yarn upgrade',
			'::endgroup::',
			'::group::Checking diff...',
			'[command]git add --all',
			'[command]git status --short -uno',
			'> There is no diff.',
			'::endgroup::',
			'::group::Checking references diff...',
			'[command]git fetch --prune --no-recurse-submodules --depth=3 origin +refs/heads/change:refs/remotes/origin/change',
			'[command]git diff origin/change...origin/create-pr-action/create/test --name-only',
			'::endgroup::',
			'::group::Merging [change] branch...',
			'[command]git merge --no-edit origin/change || :',
			'  >> Already up to date.',
			'::endgroup::',
			'::group::Pushing to hello/world@create-pr-action/create/test...',
			'[command]git push "create-pr-action/create/test":"refs/heads/create-pr-action/create/test"',
			'::endgroup::',
		]);
	});
});
