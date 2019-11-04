/* eslint-disable no-magic-numbers */
import path from 'path';
import {
	getContext,
	testEnv,
	testFs,
	spyOnExec,
	execCalledWith,
	spyOnStdout,
	stdoutCalledWith,
	setChildProcessParams,
	testChildProcess,
} from '@technote-space/github-action-test-helper';
import { Logger } from '@technote-space/github-action-helper';
import {
	clone,
	getDiff,
	getChangedFiles,
} from '../../src/utils/command';

const setExists = testFs();
beforeEach(() => {
	Logger.resetForTesting();
});
const logger = new Logger();

describe('clone', () => {
	testEnv();
	testChildProcess();

	it('should run clone command', async() => {
		process.env.GITHUB_WORKSPACE     = path.resolve('test-dir');
		process.env.INPUT_GITHUB_TOKEN   = 'test-token';
		const mockExec                   = spyOnExec();
		const mockStdout                 = spyOnStdout();

		await clone(logger, getContext({
			payload: {
				'pull_request': {
					head: {
						ref: 'head-test',
					},
					base: {
						ref: 'base-test',
					},
				},
			},
		}));

		const dir = path.resolve('test-dir');
		execCalledWith(mockExec, [
			`git -C ${dir} clone --branch=head-test --depth=3 https://octocat:test-token@github.com//.git . > /dev/null 2>&1 || :`,
		]);
		stdoutCalledWith(mockStdout, [
			'::group::Cloning from the remote repo...',
			'[command]git clone --branch=head-test --depth=3',
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
			`git -C ${dir} status --short -uno`,
		]);
	});
});

describe('getChangedFiles', () => {
	testEnv();
	testChildProcess();
	const context = getContext({
		payload: {
			'pull_request': {
				head: {
					ref: 'create-pr-action/test-branch',
				},
			},
		},
	});

	it('should get changed files 1', async() => {
		process.env.INPUT_GITHUB_TOKEN = 'test-token';
		process.env.GITHUB_WORKSPACE   = path.resolve('test-dir');
		setChildProcessParams({stdout: 'M  file1\nA  file2\nD  file3\n   file4\n\nB  file5\n'});
		setExists([true]);

		expect(await getChangedFiles(logger, context)).toEqual({
			files: [
				'file1',
				'file2',
				'file3',
			],
			output: [
				{
					command: 'git add --all',
					stdout: ['M  file1', 'A  file2', 'D  file3', '   file4', '', 'B  file5', ''],
				},
			],
		});
	});

	it('should get changed files 2', async() => {
		process.env.INPUT_GITHUB_TOKEN     = 'test-token';
		process.env.INPUT_INSTALL_PACKAGES = 'test1\ntest2';
		process.env.GITHUB_WORKSPACE       = path.resolve('test-dir');
		setChildProcessParams({stdout: 'M  file1\nA  file2\nD  file3\n   file4\n\nB  file5\n'});
		setExists([true]);

		expect(await getChangedFiles(logger, context)).toEqual({
			files: [
				'file1',
				'file2',
				'file3',
			],
			output: [
				{
					command: 'yarn add test1 test2',
					stdout: ['M  file1', 'A  file2', 'D  file3', '   file4', '', 'B  file5', ''],
				},
				{
					command: 'git add --all',
					stdout: ['M  file1', 'A  file2', 'D  file3', '   file4', '', 'B  file5', ''],
				},
			],
		});
	});

	it('should return empty', async() => {
		process.env.INPUT_GITHUB_TOKEN     = 'test-token';
		process.env.INPUT_DELETE_PACKAGE   = '1';
		process.env.INPUT_INSTALL_PACKAGES = 'test1\ntest2';
		process.env.GITHUB_WORKSPACE       = path.resolve('test-dir');
		setChildProcessParams({stdout: 'test'});
		setExists([false, true]);

		expect(await getChangedFiles(logger, context)).toEqual({
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
					command: 'npm install --save test1 test2',
					stdout: ['test'],
				},
				{
					command: 'git add --all',
					stdout: ['test'],
				},
			],
		});
	});
});
