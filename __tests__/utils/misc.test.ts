/* eslint-disable no-magic-numbers */
import { testEnv } from '@technote-space/github-action-test-helper';
import { getRunnerArguments } from '../../src/utils/misc';
import { DEFAULT_PR_BRANCH_PREFIX } from '../../src/constant';

describe('getRunnerArguments', () => {
	testEnv();

	it('should return args', () => {
		expect(getRunnerArguments()).toEqual({
			actionName: 'Create PR Action',
			actionOwner: 'technote-space',
			actionRepo: 'create-pr-action',
			commitEmail: '',
			commitMessage: '',
			commitName: '',
			deletePackage: false,
			devInstallPackages: [],
			executeCommands: [],
			filterExtensions: [],
			filterGitStatus: '',
			globalInstallPackages: [],
			includeLabels: [],
			installPackages: [],
			prBody: '',
			prBranchName: '',
			prBranchPrefix: DEFAULT_PR_BRANCH_PREFIX,
			prDateFormats: [
				'',
				'',
			],
			prTitle: '',
			targetBranchPrefix: '',
		});
	});

	it('should return args', () => {
		process.env.INPUT_INSTALL_PACKAGES        = 'test1\ntest2';
		process.env.INPUT_DEV_INSTALL_PACKAGES    = 'test3\ntest4';
		process.env.INPUT_GLOBAL_INSTALL_PACKAGES = 'test5\ntest6';
		process.env.INPUT_EXECUTE_COMMANDS        = 'ncu -u && yarn upgrade';
		process.env.INPUT_COMMIT_NAME             = 'GitHub Actions';
		process.env.INPUT_COMMIT_EMAIL            = 'example@example.com';
		process.env.INPUT_COMMIT_MESSAGE          = 'test: create pull request';
		process.env.INPUT_PR_BRANCH_PREFIX        = 'prefix/';
		process.env.INPUT_PR_BRANCH_NAME          = 'test-branch-${PR_ID}';
		process.env.INPUT_PR_TITLE                = 'test: create pull request (${PR_NUMBER})';
		process.env.INPUT_PR_BODY                 = 'pull request body';
		process.env.INPUT_PR_DATE_FORMAT1         = 'YYYY-MM-DD HH:mm:ss';
		process.env.INPUT_PR_DATE_FORMAT2         = 'YYYY-MM-DD';
		process.env.INPUT_FILTER_GIT_STATUS       = 'MD';
		process.env.INPUT_FILTER_EXTENSIONS       = '.md, txt';
		process.env.INPUT_TARGET_BRANCH_PREFIX    = 'feature/';
		process.env.INPUT_DELETE_PACKAGE          = '1';
		process.env.INPUT_INCLUDE_LABELS          = 'label1, label2\nlabel3';

		expect(getRunnerArguments()).toEqual({
			actionName: 'Create PR Action',
			actionOwner: 'technote-space',
			actionRepo: 'create-pr-action',
			commitEmail: 'example@example.com',
			commitMessage: 'test: create pull request',
			commitName: 'GitHub Actions',
			deletePackage: true,
			devInstallPackages: [
				'test3',
				'test4',
			],
			executeCommands: [
				'ncu -u',
				'yarn upgrade',
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
			prBranchName: 'test-branch-${PR_ID}',
			prBranchPrefix: 'prefix/',
			prDateFormats: [
				'YYYY-MM-DD HH:mm:ss',
				'YYYY-MM-DD',
			],
			prTitle: 'test: create pull request (${PR_NUMBER})',
			targetBranchPrefix: 'feature/',
		});
	});
});
