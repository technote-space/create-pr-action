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
		process.env.GITHUB_WORKSPACE     = path.resolve('test');
		process.env.INPUT_GITHUB_TOKEN   = 'test-token';
		process.env.INPUT_COMMIT_NAME    = 'GitHub Actions';
		process.env.INPUT_COMMIT_EMAIL   = 'example@example.com';
		const mockStdout                 = spyOnStdout();
		setExists(true);

		await execute(context('synchronize'));

		stdoutCalledWith(mockStdout, [
			'::group::Running commands and getting changed files',
			'[command]rm -rdf ./*',
			'  >> stdout',
			'::endgroup::',
			'::group::Cloning from the remote repo...',
			'[command]git clone --branch=change --depth=3',
			'::endgroup::',
			'::group::Checking diff...',
			'[command]git status --short -uno',
			'[command]git add --all',
			'  >> stdout',
			'::endgroup::',
		]);
	});

	it('should create pull request', async() => {
		process.env.GITHUB_WORKSPACE     = path.resolve('test');
		process.env.INPUT_GITHUB_TOKEN   = 'test-token';
		process.env.INPUT_COMMIT_NAME    = 'GitHub Actions';
		process.env.INPUT_COMMIT_EMAIL   = 'example@example.com';
		process.env.INPUT_PR_BRANCH_NAME = 'create/test';
		process.env.INPUT_COMMIT_MESSAGE = 'test: create pull request';
		process.env.INPUT_PR_TITLE       = 'test: create pull request (${PR_NUMBER})';
		process.env.INPUT_PR_BODY        = 'pull request body';
		const mockStdout                 = spyOnStdout();
		setChildProcessParams({stdout: 'M  __tests__/fixtures/test.md'});
		setExists(true);

		nock('https://api.github.com')
			.persist()
			.get('/repos/hello/world/pulls?head=hello%3Acreate-pr-action%2Fcreate%2Ftest')
			.reply(200, () => getApiFixture(rootDir, 'pulls.list'))
			.patch('/repos/hello/world/pulls/1347')
			.reply(200, () => getApiFixture(rootDir, 'pulls.update'));

		await execute(context('synchronize'));

		stdoutContains(mockStdout, [
			'[command]git config user.name "GitHub Actions"',
			'[command]git config user.email "example@example.com"',
			'[command]rm -rdf ./*',
			'[command]git status --short -uno',
			'[command]git add --all',
			'::group::Updating PullRequest... [create-pr-action/create/test] -> [heads/test]',
		]);
	});

	it('should do schedule', async() => {
		process.env.GITHUB_WORKSPACE     = path.resolve('test');
		process.env.INPUT_GITHUB_TOKEN   = 'test-token';
		process.env.INPUT_PR_BRANCH_NAME = 'test-branch';
		process.env.INPUT_COMMIT_NAME    = 'GitHub Actions';
		process.env.INPUT_COMMIT_EMAIL   = 'example@example.com';
		process.env.INPUT_PR_BRANCH_NAME = 'create/test';
		process.env.INPUT_COMMIT_MESSAGE = 'test: create pull request';
		process.env.INPUT_PR_TITLE       = 'test: create pull request (${PR_NUMBER})';
		process.env.INPUT_PR_BODY        = 'pull request body';
		const mockStdout                 = spyOnStdout();
		setChildProcessParams({stdout: 'M  __tests__/fixtures/test.md'});
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
			.get('/repos/hello/world/pulls?head=hello%3Acreate-pr-action%2Fnew-topic')
			.reply(200, () => getApiFixture(rootDir, 'pulls.list'))
			.patch('/repos/hello/world/pulls/1347')
			.reply(200, () => getApiFixture(rootDir, 'pulls.update'));

		await execute(context('', 'schedule'));

		stdoutContains(mockStdout, [
			'::group::Target PullRequest Ref [create-pr-action/new-topic]',
			'[command]git clone --branch=create-pr-action/new-topic --depth=3',
			'> Checking diff...',
			'[command]git status --short -uno',
			'[command]git add --all',
			'[command]git commit -qm "test: create pull request"',
			'[command]git show --stat-count=10 HEAD',
			'[command]git push --tags "create-pr-action/new-topic":"refs/heads/create-pr-action/new-topic"',
			'> Updating PullRequest... [create-pr-action/new-topic] -> [heads/test]',
			'> Cloning from the remote repo...',
			'[command]git clone --branch=create-pr-action/new-topic --depth=3',
		]);
	});
});
