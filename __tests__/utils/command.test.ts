/* eslint-disable no-magic-numbers */
import path from 'path';
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
} from '@technote-space/github-action-test-helper';
import { Logger } from '@technote-space/github-action-helper';
import {
	clone,
	checkBranch,
	getDiff,
	getChangedFiles,
} from '../../src/utils/command';

beforeEach(() => {
	Logger.resetForTesting();
});
const logger    = new Logger();
const setExists = testFs();
const context   = (pr: object): Context => getContext({
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
			`git -C ${dir} clone --branch=create-pr-action/test-branch --depth=3 https://octocat:test-token@github.com//.git . > /dev/null 2>&1 || :`,
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
			`git -C ${dir} clone --branch=test-branch --depth=3 https://octocat:test-token@github.com//.git . > /dev/null 2>&1 || :`,
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
