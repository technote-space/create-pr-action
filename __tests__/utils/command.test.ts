/* eslint-disable no-magic-numbers */
import path from 'path';
import nock from 'nock';
import { GitHub } from '@actions/github';
import { Context } from '@actions/github/lib/context';
import {
	getContext,
	testEnv,
	spyOnExec,
	execCalledWith,
	spyOnStdout,
	stdoutCalledWith,
	setChildProcessParams,
	testChildProcess,
	testFs,
	disableNetConnect,
	getApiFixture,
} from '@technote-space/github-action-test-helper';
import { Logger, GitHelper } from '@technote-space/github-action-helper';
import {
	clone,
	checkBranch,
	getDiff,
	getChangedFiles,
	updatePr,
	resolveConflicts,
} from '../../src/utils/command';

beforeEach(() => {
	Logger.resetForTesting();
});
const logger    = new Logger();
const setExists = testFs();
const rootDir   = path.resolve(__dirname, '..', 'fixtures');
const octokit   = new GitHub('');
const context   = (pr: object): Context => getContext({
	repo: {
		owner: 'hello',
		repo: 'world',
	},
	payload: {
		'pull_request': Object.assign({
			number: 11,
			id: 21031067,
			head: {
				ref: 'change',
			},
			base: {
				ref: 'master',
			},
			title: 'title',
			'html_url': 'url',
		}, pr),
	},
});

describe('clone', () => {
	testEnv();
	testChildProcess();

	it('should run clone command', async() => {
		process.env.GITHUB_WORKSPACE     = path.resolve('test-dir');
		process.env.INPUT_GITHUB_TOKEN   = 'test-token';
		process.env.INPUT_PR_BRANCH_NAME = 'test-branch';
		const mockExec                   = spyOnExec();
		const mockStdout                 = spyOnStdout();

		await clone(logger, context({
			head: {
				ref: 'head-test',
			},
			base: {
				ref: 'base-test',
			},
		}));

		const dir = path.resolve('test-dir');
		execCalledWith(mockExec, [
			`git -C ${dir} clone --branch=create-pr-action/test-branch --depth=3 https://octocat:test-token@github.com/hello/world.git . > /dev/null 2>&1 || :`,
		]);
		stdoutCalledWith(mockStdout, [
			'::group::Cloning [create-pr-action/test-branch] branch from the remote repo...',
			'[command]git clone --branch=create-pr-action/test-branch --depth=3',
		]);
	});
});

describe('checkBranch', () => {
	testEnv();
	testChildProcess();

	it('should do nothing', async() => {
		process.env.GITHUB_WORKSPACE     = path.resolve('test-dir');
		process.env.INPUT_GITHUB_TOKEN   = 'test-token';
		process.env.INPUT_PR_BRANCH_NAME = 'test-branch';
		setChildProcessParams({stdout: 'create-pr-action/test-branch'});
		const mockExec = spyOnExec();
		setExists(true);

		await checkBranch(logger, context({
			head: {
				ref: 'test-branch',
			},
		}));

		const dir = path.resolve('test-dir');
		execCalledWith(mockExec, [
			`git -C ${dir} branch -a | grep -E '^\\*' | cut -b 3-`,
			'ls -la',
		]);
	});

	it('should checkout new branch', async() => {
		process.env.GITHUB_WORKSPACE     = path.resolve('test-dir');
		process.env.INPUT_GITHUB_TOKEN   = 'test-token';
		process.env.INPUT_PR_BRANCH_NAME = 'test-branch';
		setChildProcessParams({stdout: 'test-branch2'});
		const mockExec = spyOnExec();
		setExists(true);

		await checkBranch(logger, context({
			head: {
				ref: 'test-branch',
			},
		}));

		const dir = path.resolve('test-dir');
		execCalledWith(mockExec, [
			`git -C ${dir} branch -a | grep -E '^\\*' | cut -b 3-`,
			`git -C ${dir} clone --branch=test-branch --depth=3 https://octocat:test-token@github.com/hello/world.git . > /dev/null 2>&1 || :`,
			`git -C ${dir} checkout -b "create-pr-action/test-branch"`,
			'ls -la',
		]);
	});
});

describe('getDiff', () => {
	testEnv();
	testChildProcess();

	it('should get diff', async() => {
		process.env.GITHUB_WORKSPACE        = path.resolve('test-dir');
		process.env.INPUT_FILTER_GIT_STATUS = 'M';
		process.env.INPUT_FILTER_EXTENSIONS = 'md';
		setChildProcessParams({stdout: 'M  test1.txt\nM  test2.md\nA  test3.md'});
		const mockExec = spyOnExec();

		expect(await getDiff(logger)).toEqual(['test2.md']);

		const dir = path.resolve('test-dir');
		execCalledWith(mockExec, [
			'git add --all',
			`git -C ${dir} status --short -uno`,
		]);
	});
});

describe('getChangedFiles', () => {
	testEnv();
	testChildProcess();
	const _context = context({
		head: {
			ref: 'create-pr-action/test-branch',
		},
	});

	it('should get changed files 1', async() => {
		process.env.GITHUB_WORKSPACE       = path.resolve('test-dir');
		process.env.INPUT_GITHUB_TOKEN     = 'test-token';
		process.env.INPUT_EXECUTE_COMMANDS = 'yarn upgrade';
		process.env.INPUT_PR_BRANCH_NAME   = 'test-branch';
		setChildProcessParams({stdout: 'M  file1\nA  file2\nD  file3\n   file4\n\nB  file5\n'});

		expect(await getChangedFiles(logger, _context)).toEqual({
			files: [
				'file1',
				'file2',
				'file3',
			],
			output: [
				{
					command: 'yarn upgrade',
					stdout: ['M  file1', 'A  file2', 'D  file3', '   file4', '', 'B  file5'],
				},
			],
		});
	});

	it('should get changed files 2', async() => {
		process.env.GITHUB_WORKSPACE              = path.resolve('test-dir');
		process.env.INPUT_GITHUB_TOKEN            = 'test-token';
		process.env.INPUT_PACKAGE_MANAGER         = 'yarn';
		process.env.INPUT_EXECUTE_COMMANDS        = 'yarn upgrade';
		process.env.INPUT_GLOBAL_INSTALL_PACKAGES = 'npm-check-updates';
		process.env.INPUT_INSTALL_PACKAGES        = 'test1\ntest2';
		process.env.INPUT_PR_BRANCH_NAME          = 'test-branch';
		setChildProcessParams({stdout: 'M  file1\nA  file2\nD  file3\n   file4\n\nB  file5\n'});

		expect(await getChangedFiles(logger, _context)).toEqual({
			files: [
				'file1',
				'file2',
				'file3',
			],
			output: [
				{
					command: 'sudo yarn global add npm-check-updates',
					stdout: ['M  file1', 'A  file2', 'D  file3', '   file4', '', 'B  file5'],
				},
				{
					command: 'yarn add test1 test2',
					stdout: ['M  file1', 'A  file2', 'D  file3', '   file4', '', 'B  file5'],
				},
				{
					command: 'yarn upgrade',
					stdout: ['M  file1', 'A  file2', 'D  file3', '   file4', '', 'B  file5'],
				},
			],
		});
	});

	it('should return empty', async() => {
		process.env.GITHUB_WORKSPACE              = path.resolve('test-dir');
		process.env.INPUT_GITHUB_TOKEN            = 'test-token';
		process.env.INPUT_EXECUTE_COMMANDS        = 'npm update';
		process.env.INPUT_DELETE_PACKAGE          = '1';
		process.env.INPUT_GLOBAL_INSTALL_PACKAGES = 'npm-check-updates';
		process.env.INPUT_INSTALL_PACKAGES        = 'test1\ntest2';
		process.env.INPUT_PR_BRANCH_NAME          = 'test-branch';
		setChildProcessParams({stdout: 'test'});

		expect(await getChangedFiles(logger, _context)).toEqual({
			files: [],
			output: [
				{
					command: 'rm -f package.json',
					stdout: ['test'],
				},
				{
					command: 'rm -f package-lock.json',
					stdout: ['test'],
				},
				{
					command: 'rm -f yarn.lock',
					stdout: ['test'],
				},
				{
					command: 'sudo npm install -g npm-check-updates',
					stdout: ['test'],
				},
				{
					command: 'npm install --save test1 test2',
					stdout: ['test'],
				},
				{
					command: 'npm update',
					stdout: ['test'],
				},
			],
		});
	});
});

describe('updatePr', () => {
	disableNetConnect(nock);
	testEnv();

	it('should return true 1', async() => {
		process.env.INPUT_PR_TITLE = 'test title';
		process.env.INPUT_PR_BODY  = 'test body';

		nock('https://api.github.com')
			.persist()
			.get('/repos/hello/world/pulls?head=hello%3Atest')
			.reply(200, () => getApiFixture(rootDir, 'pulls.list'))
			.post('/repos/hello/world/issues/1347/comments')
			.reply(201, () => getApiFixture(rootDir, 'issues.comment.create'))
			.get('/repos/hello/world/pulls/1347')
			.reply(200, () => getApiFixture(rootDir, 'pulls.get.mergeable.true'));

		expect(await updatePr('test', [], [], logger, octokit, context({}))).toBe(true);
	});

	it('should return true 2', async() => {
		process.env.INPUT_PR_TITLE = 'test title';
		process.env.INPUT_PR_BODY  = 'test body';

		nock('https://api.github.com')
			.persist()
			.get('/repos/hello/world/pulls?head=hello%3Atest')
			.reply(200, () => [])
			.post('/repos/hello/world/pulls')
			.reply(201, () => getApiFixture(rootDir, 'pulls.create'));

		expect(await updatePr('test', [], [], logger, octokit, context({}))).toBe(true);
	});

	it('should return false', async() => {
		process.env.INPUT_PR_TITLE = 'test title';
		process.env.INPUT_PR_BODY  = 'test body';

		nock('https://api.github.com')
			.persist()
			.get('/repos/hello/world/pulls?head=hello%3Atest')
			.reply(200, () => getApiFixture(rootDir, 'pulls.list'))
			.post('/repos/hello/world/issues/1347/comments')
			.reply(201, () => getApiFixture(rootDir, 'issues.comment.create'))
			.get('/repos/hello/world/pulls/1347')
			.reply(200, () => getApiFixture(rootDir, 'pulls.get.mergeable.false'));

		expect(await updatePr('test', [], [], logger, octokit, context({}))).toBe(false);
	});
});

describe('resolveConflicts', () => {
	disableNetConnect(nock);
	testEnv();
	testChildProcess();
	const helper = new GitHelper(logger);

	it('should merge', async() => {
		process.env.GITHUB_WORKSPACE       = path.resolve('test-dir');
		process.env.INPUT_GITHUB_TOKEN     = 'test-token';
		process.env.INPUT_PR_BRANCH_NAME   = 'test-branch';
		process.env.INPUT_EXECUTE_COMMANDS = 'yarn upgrade';
		setChildProcessParams({
			stdout: (command: string): string => {
				if (command.startsWith('git merge')) {
					return 'Already up to date.';
				}
				return '';
			},
		});
		const mockExec = spyOnExec();

		await resolveConflicts('test', logger, helper, octokit, context({}));

		execCalledWith(mockExec, [
			'git merge --no-edit origin/master || :',
			`git -C ${process.env.GITHUB_WORKSPACE} push "https://octocat:test-token@github.com/hello/world.git" "test":"refs/heads/test" > /dev/null 2>&1`,
		]);
	});

	it('should close pull request', async() => {
		process.env.GITHUB_WORKSPACE       = path.resolve('test-dir');
		process.env.INPUT_GITHUB_TOKEN     = 'test-token';
		process.env.INPUT_PR_BRANCH_NAME   = 'test-branch';
		process.env.INPUT_EXECUTE_COMMANDS = 'yarn upgrade';
		setChildProcessParams({
			stdout: (command: string): string => {
				if (command.startsWith('git merge')) {
					return 'Auto-merging merge.txt\nCONFLICT (content): Merge conflict in merge.txt\nAutomatic merge failed; fix conflicts and then commit the result.';
				}
				return '';
			},
		});
		const mockExec = spyOnExec();
		nock('https://api.github.com')
			.persist()
			.get('/repos/hello/world/pulls?head=hello%3Atest')
			.reply(200, () => []);

		await resolveConflicts('test', logger, helper, octokit, context({}));

		execCalledWith(mockExec, [
			'git merge --no-edit origin/master || :',
			'rm -rdf ./*',
			`git -C ${process.env.GITHUB_WORKSPACE} clone --branch=change --depth=3 https://octocat:test-token@github.com/hello/world.git . > /dev/null 2>&1 || :`,
			`git -C ${process.env.GITHUB_WORKSPACE} checkout -b "create-pr-action/test-branch"`,
			'yarn upgrade',
			'git add --all',
			`git -C ${process.env.GITHUB_WORKSPACE} status --short -uno`,
		]);
	});

	it('should rebase', async() => {
		process.env.GITHUB_WORKSPACE       = path.resolve('test-dir');
		process.env.INPUT_GITHUB_TOKEN     = 'test-token';
		process.env.INPUT_PR_BRANCH_NAME   = 'test-branch';
		process.env.INPUT_EXECUTE_COMMANDS = 'yarn upgrade';
		process.env.INPUT_COMMIT_MESSAGE   = 'commit message';
		process.env.INPUT_PR_TITLE         = 'pr title';
		process.env.INPUT_PR_BODY          = 'pr body';
		process.env.INPUT_COMMIT_NAME      = 'GitHub Actions';
		process.env.INPUT_COMMIT_EMAIL     = 'example@example.com';
		setChildProcessParams({
			stdout: (command: string): string => {
				if (command.startsWith('git merge')) {
					return 'Auto-merging merge.txt\nCONFLICT (content): Merge conflict in merge.txt\nAutomatic merge failed; fix conflicts and then commit the result.';
				}
				if (command.endsWith('status --short -uno')) {
					return 'M  __tests__/fixtures/test.md';
				}
				return '';
			},
		});
		const mockExec = spyOnExec();
		nock('https://api.github.com')
			.persist()
			.get('/repos/hello/world/pulls?head=hello%3Atest')
			.reply(200, () => getApiFixture(rootDir, 'pulls.list'))
			.patch('/repos/hello/world/pulls/1347')
			.reply(200, () => getApiFixture(rootDir, 'pulls.update'));

		await resolveConflicts('test', logger, helper, octokit, context({}));

		execCalledWith(mockExec, [
			'git merge --no-edit origin/master || :',
			'rm -rdf ./*',
			`git -C ${process.env.GITHUB_WORKSPACE} clone --branch=change --depth=3 https://octocat:test-token@github.com/hello/world.git . > /dev/null 2>&1 || :`,
			`git -C ${process.env.GITHUB_WORKSPACE} checkout -b "create-pr-action/test-branch"`,
			'yarn upgrade',
			'git add --all',
			`git -C ${process.env.GITHUB_WORKSPACE} status --short -uno`,
			`git -C ${process.env.GITHUB_WORKSPACE} config user.name "GitHub Actions"`,
			`git -C ${process.env.GITHUB_WORKSPACE} config user.email "example@example.com"`,
			`git -C ${process.env.GITHUB_WORKSPACE} commit -qm "commit message"`,
			`git -C ${process.env.GITHUB_WORKSPACE} show --stat-count=10 HEAD`,
			`git -C ${process.env.GITHUB_WORKSPACE} push "https://octocat:test-token@github.com/hello/world.git" "test":"refs/heads/test" > /dev/null 2>&1`,
		]);
	});
});
