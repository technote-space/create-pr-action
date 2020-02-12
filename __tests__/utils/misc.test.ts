/* eslint-disable no-magic-numbers */
import path from 'path';
import { stdoutCalledWith, spyOnStdout, testEnv } from '@technote-space/github-action-test-helper';
import { getRunnerArguments } from '../../src/utils/misc';

describe('getRunnerArguments', () => {
	testEnv(path.resolve(__dirname, '../..'));

	it('should return args', () => {
		const args = getRunnerArguments();
		expect(args).toHaveProperty('executeCommands');
		expect(args.executeCommands).toHaveLength(1);
		delete args.executeCommands;
		expect(args).toEqual({
			rootDir: path.resolve(__dirname, '../..'),
			actionName: 'Create PR Action',
			actionOwner: 'technote-space',
			actionRepo: 'create-pr-action',
			checkDefaultBranch: true,
			checkOnlyDefaultBranch: false,
			commitEmail: '',
			commitMessage: '',
			commitName: '',
			deletePackage: false,
			devInstallPackages: [],
			filterExtensions: [],
			filterGitStatus: '',
			globalInstallPackages: [],
			includeLabels: [],
			installPackages: [],
			prBody: '## Base PullRequest\n' +
				'\n' +
				'${PR_TITLE} (${PR_NUMBER_REF})\n' +
				'\n' +
				'## Command results\n' +
				'<details>\n' +
				'  <summary>Details: </summary>\n' +
				'\n' +
				'  ${COMMANDS_OUTPUT}\n' +
				'\n' +
				'</details>\n' +
				'\n' +
				'## Changed files\n' +
				'<details>\n' +
				'  <summary>${FILES_SUMMARY}: </summary>\n' +
				'\n' +
				'  ${FILES}\n' +
				'\n' +
				'</details>\n' +
				'\n' +
				'<hr>\n' +
				'\n' +
				'[:octocat: Repo](${ACTION_URL}) | [:memo: Issues](${ACTION_URL}/issues) | [:department_store: Marketplace](${ACTION_MARKETPLACE_URL})',
			prBodyForComment: '## Command results\n' +
				'<details>\n' +
				'  <summary>Details: </summary>\n' +
				'\n' +
				'  ${COMMANDS_OUTPUT}\n' +
				'\n' +
				'</details>\n' +
				'\n' +
				'## Changed files\n' +
				'<details>\n' +
				'  <summary>${FILES_SUMMARY}: </summary>\n' +
				'\n' +
				'  ${FILES}\n' +
				'\n' +
				'</details>\n' +
				'\n' +
				'<hr>\n' +
				'\n' +
				'[:octocat: Repo](${ACTION_URL}) | [:memo: Issues](${ACTION_URL}/issues) | [:department_store: Marketplace](${ACTION_MARKETPLACE_URL})',
			prBranchPrefix: 'create-pr-action/',
			prBranchName: '',
			prBodyForDefaultBranch: '',
			prBranchPrefixForDefaultBranch: '',
			prBranchNameForDefaultBranch: '',
			prCloseMessage: 'This PR is no longer needed because the package looks up-to-date.',
			prDateFormats: [
				'YYYY-MM-DD HH:mm:ss',
				'YYYY-MM-DD',
			],
			prTitle: '',
			prTitleForDefaultBranch: '',
			targetBranchPrefix: [],
		});
	});

	it('should return args', async() => {
		process.env.INPUT_INSTALL_PACKAGES         = 'test1\ntest2';
		process.env.INPUT_DEV_INSTALL_PACKAGES     = 'test3\ntest4';
		process.env.INPUT_GLOBAL_INSTALL_PACKAGES  = 'test5\ntest6\nnpm-check-updates';
		process.env.INPUT_EXECUTE_COMMANDS         = 'ls -lat\nncu -u && npx npm-check-updates -u --packageFile package.json && yarn upgrade\nls -lat';
		process.env.INPUT_COMMIT_NAME              = 'GitHub Actions';
		process.env.INPUT_COMMIT_EMAIL             = 'example@example.com';
		process.env.INPUT_COMMIT_MESSAGE           = 'test: create pull request';
		process.env.INPUT_PR_BRANCH_PREFIX         = 'prefix/';
		process.env.INPUT_PR_BRANCH_NAME           = 'test-branch-${PR_ID}';
		process.env.INPUT_PR_TITLE                 = 'test: create pull request (${PR_NUMBER})';
		process.env.INPUT_PR_BODY                  = 'pull request body';
		process.env.INPUT_PR_COMMENT_BODY          = 'pull request body for comment';
		process.env.INPUT_PR_DEFAULT_BRANCH_PREFIX = 'test/';
		process.env.INPUT_PR_DEFAULT_BRANCH_NAME   = '${PATCH_VERSION}';
		process.env.INPUT_PR_DEFAULT_BRANCH_TITLE  = 'test: create pull request 2 (${PR_NUMBER})';
		process.env.INPUT_PR_DEFAULT_BRANCH_BODY   = 'pull request body 2';
		process.env.INPUT_PR_CLOSE_MESSAGE         = 'close message';
		process.env.INPUT_PR_DATE_FORMAT1          = 'YYYY-MM-DD HH:mm';
		process.env.INPUT_PR_DATE_FORMAT2          = 'YYYY-MM-DD HH';
		process.env.INPUT_FILTER_GIT_STATUS        = 'MD';
		process.env.INPUT_FILTER_EXTENSIONS        = '.md, txt';
		process.env.INPUT_TARGET_BRANCH_PREFIX     = 'feature/\nrelease/';
		process.env.INPUT_DELETE_PACKAGE           = '1';
		process.env.INPUT_INCLUDE_LABELS           = 'label1, label2\nlabel3';
		process.env.INPUT_CHECK_DEFAULT_BRANCH     = '0';
		process.env.INPUT_ONLY_DEFAULT_BRANCH      = 'true';

		const args = getRunnerArguments();
		expect(args).toHaveProperty('executeCommands');
		expect(args.executeCommands).toHaveLength(6);
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		const task = args.executeCommands.shift();
		expect(typeof task === 'function').toBe(true);
		expect(args).toEqual({
			rootDir: path.resolve(__dirname, '../..'),
			actionName: 'Create PR Action',
			actionOwner: 'technote-space',
			actionRepo: 'create-pr-action',
			checkDefaultBranch: false,
			checkOnlyDefaultBranch: true,
			commitEmail: 'example@example.com',
			commitMessage: 'test: create pull request',
			commitName: 'GitHub Actions',
			deletePackage: true,
			devInstallPackages: [
				'test3',
				'test4',
			],
			executeCommands: [
				'ls -lat',
				'ncu -u',
				'ncu -u --packageFile package.json',
				'yarn upgrade',
				'ls -lat',
			],
			filterExtensions: [
				'.md',
				'txt',
			],
			filterGitStatus: 'MD',
			globalInstallPackages: [
				'test5',
				'test6',
			],
			includeLabels: [
				'label1',
				'label2',
				'label3',
			],
			installPackages: [
				'test1',
				'test2',
			],
			prBody: 'pull request body',
			prBodyForComment: 'pull request body for comment',
			prBodyForDefaultBranch: 'pull request body 2',
			prBranchPrefix: 'prefix/',
			prBranchName: 'test-branch-${PR_ID}',
			prBranchPrefixForDefaultBranch: 'test/',
			prBranchNameForDefaultBranch: '${PATCH_VERSION}',
			prCloseMessage: 'close message',
			prDateFormats: [
				'YYYY-MM-DD HH:mm',
				'YYYY-MM-DD HH',
			],
			prTitle: 'test: create pull request (${PR_NUMBER})',
			prTitleForDefaultBranch: 'test: create pull request 2 (${PR_NUMBER})',
			targetBranchPrefix: ['feature/', 'release/'],
		});

		const mockStdout = spyOnStdout();
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		expect(await task()).toEqual({
			command: 'add path',
			stdout: [
				path.resolve(__dirname, '../../node_modules/.bin'),
			],
			stderr: [],
		});
		stdoutCalledWith(mockStdout, [
			`::add-path::${path.resolve(__dirname, '../../node_modules/.bin')}`,
		]);
	});
});
