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
	stdoutContains,
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

	it('should close pull request', async() => {
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

	it('should do nothing', async() => {
		process.env.GITHUB_WORKSPACE       = path.resolve('test');
		process.env.INPUT_GITHUB_TOKEN     = 'test-token';
		process.env.INPUT_EXECUTE_COMMANDS = 'yarn upgrade';
		process.env.INPUT_COMMIT_NAME      = 'GitHub Actions';
		process.env.INPUT_COMMIT_EMAIL     = 'example@example.com';
		process.env.INPUT_PR_BRANCH_NAME   = 'test-branch';
		const mockStdout                   = spyOnStdout();
		setExists(true);

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
		setChildProcessParams({stdout: 'M  __tests__/fixtures/test.md'});
		setExists(true);

		nock('https://api.github.com')
			.persist()
			.get('/repos/hello/world/pulls?head=hello%3Acreate-pr-action%2Fcreate%2Ftest')
			.reply(200, () => getApiFixture(rootDir, 'pulls.list'))
			.post('/repos/hello/world/issues/1347/comments')
			.reply(201);

		await execute(context('synchronize'));

		stdoutContains(mockStdout, [
			'[command]rm -rdf ./*',
			'[command]git clone --branch=create-pr-action/create/test --depth=3',
			'[command]git branch -a | grep -E \'^\\*\' | cut -b 3-',
			'> remote branch [create-pr-action/create/test] not found.',
			'[command]git clone --branch=change --depth=3',
			'[command]git checkout -b "create-pr-action/create/test"',
			'[command]git add --all',
			'[command]git status --short -uno',
			'[command]git config user.name "GitHub Actions"',
			'[command]git config user.email "example@example.com"',
			'[command]git commit -qm "test: create pull request"',
			'[command]git show --stat-count=10 HEAD',
			'[command]git push "create-pr-action/create/test":"refs/heads/create-pr-action/create/test"',
			'[command]git diff origin/master...origin/create-pr-action/create/test --name-only',
			'::group::Creating comment to PullRequest... [create-pr-action/create/test] -> [heads/test]',
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
		setChildProcessParams({stdout: (command: string): string => command.endsWith('status --short -uno') ? 'M  __tests__/fixtures/test.md' : ''});
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
			.get('/repos/octocat/Hello-World/pulls?head=octocat%3Acreate-pr-action%2Fcreate%2Ftest')
			.reply(200, () => getApiFixture(rootDir, 'pulls.list'))
			.patch('/repos/octocat/Hello-World/pulls/1347')
			.reply(200, () => getApiFixture(rootDir, 'pulls.update'))
			.delete('/repos/octocat/Hello-World/git/refs/heads/create-pr-action/create/test')
			.reply(204);

		await execute(context('', 'schedule'));

		stdoutContains(mockStdout, [
			'::group::Target PullRequest Ref [create-pr-action/new-topic]',
			'[command]git clone --branch=create-pr-action/create/test --depth=3',
			'> Checking diff...',
			'[command]git add --all',
			'[command]git status --short -uno',
			'[command]git commit -qm "test: create pull request"',
			'[command]git show --stat-count=10 HEAD',
			'> Cloning [create-pr-action/new-topic] from the remote repo...',
			'[command]git clone --branch=create-pr-action/new-topic --depth=3',
			'[command]git checkout -b "create-pr-action/create/test"',
			'[command]git push "create-pr-action/create/test":"refs/heads/create-pr-action/create/test"',
			'> Checking references diff...',
			'[command]git diff origin/master...origin/create-pr-action/create/test --name-only',
			'> Deleting reference... [refs/heads/create-pr-action/create/test]',
		]);
	});
});
