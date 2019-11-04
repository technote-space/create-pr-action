/* eslint-disable no-magic-numbers */
import { testEnv, getContext, generateContext } from '@technote-space/github-action-test-helper';
import path from 'path';
import {
	getCommitMessage,
	getCommitName,
	getCommitEmail,
	replaceDirectory,
	getPrBranchPrefix,
	getPrBranchName,
	getPrHeadRef,
	isActionPr,
	getPrTitle,
	getPrLink,
	getPrBody,
	isDisabledDeletePackage,
	isTargetContext,
	isClosePR,
	filterGitStatus,
	filterExtension,
} from '../../src/utils/misc';
import { DEFAULT_PR_BRANCH_PREFIX } from '../../src/constant';

describe('isTargetContext', () => {
	testEnv();

	it('should return true 1', () => {
		expect(isTargetContext(generateContext({
			event: 'pull_request',
			action: 'opened',
		}, {
			payload: {
				'pull_request': {
					labels: [],
				},
			},
		}))).toBe(true);
	});

	it('should return true 2', () => {
		process.env.INPUT_INCLUDE_LABELS = 'label2';
		expect(isTargetContext(generateContext({
			event: 'pull_request',
			action: 'synchronize',
		}, {
			payload: {
				'pull_request': {
					labels: [{name: 'label1'}, {name: 'label2'}],
				},
			},
		}))).toBe(true);
	});

	it('should return true 3', () => {
		process.env.INPUT_INCLUDE_LABELS = 'label1,label2\nlabel3';
		expect(isTargetContext(generateContext({
			event: 'pull_request',
			action: 'synchronize',
		}, {
			payload: {
				'pull_request': {
					labels: [{name: 'label2'}],
				},
			},
		}))).toBe(true);
	});

	it('should return true 4', () => {
		expect(isTargetContext(generateContext({
			event: 'pull_request',
			action: 'opened',
		}, {
			payload: {
				'pull_request': {
					labels: [],
				},
			},
		}))).toBe(true);
	});

	it('should return true 5', () => {
		expect(isTargetContext(generateContext({
			event: 'pull_request',
			action: 'closed',
		}, {
			payload: {
				'pull_request': {
					labels: [],
				},
			},
		}))).toBe(true);
	});

	it('should return true 6', () => {
		expect(isTargetContext(generateContext({
			event: 'schedule',
		}))).toBe(true);
	});

	it('should return false 1', () => {
		expect(isTargetContext(generateContext({
			ref: 'tags/test',
			event: 'push',
		}))).toBe(false);
	});

	it('should return false 2', () => {
		process.env.INPUT_INCLUDE_LABELS = 'test2';
		expect(isTargetContext(generateContext({
			event: 'pull_request',
			action: 'opened',
		}, {
			payload: {
				'pull_request': {
					labels: [{name: 'label1'}],
				},
			},
		}))).toBe(false);
	});

	it('should return false 3', () => {
		expect(isTargetContext(generateContext({
			ref: 'heads/test',
			event: 'push',
		}))).toBe(false);
	});

	it('should return false 4', () => {
		process.env.INPUT_INCLUDE_LABELS = 'label1';
		expect(isTargetContext(generateContext({
			ref: 'heads/master',
			event: 'pull_request',
			action: 'synchronize',
		}, {
			payload: {
				'pull_request': {
					labels: [{name: 'label2'}],
				},
			},
		}))).toBe(false);
	});

	it('should return false 5', () => {
		expect(isTargetContext(generateContext({
			event: 'pull_request',
			action: 'closed',
		}))).toBe(false);
	});
});

describe('getCommitMessage', () => {
	testEnv();

	it('should get commit message', () => {
		process.env.INPUT_COMMIT_MESSAGE = 'test';
		expect(getCommitMessage()).toBe('test');
	});

	it('should throw error', () => {
		expect(() => getCommitMessage()).toThrow();
	});
});

describe('getCommitName', () => {
	testEnv();

	it('should get commit name', () => {
		process.env.INPUT_COMMIT_NAME = 'test';
		expect(getCommitName()).toBe('test');
	});

	it('should throw error', () => {
		process.env.INPUT_COMMIT_NAME = '';
		expect(() => getCommitName()).toThrow();
	});
});

describe('getCommitEmail', () => {
	testEnv();

	it('should get commit email', () => {
		process.env.INPUT_COMMIT_EMAIL = 'test';
		expect(getCommitEmail()).toBe('test');
	});

	it('should throw error', () => {
		process.env.INPUT_COMMIT_EMAIL = '';
		expect(() => getCommitEmail()).toThrow();
	});
});

describe('replaceDirectory', () => {
	testEnv();

	it('should replace working directory 1', () => {
		process.env.GITHUB_WORKSPACE = path.resolve('test-dir');
		const workDir                = path.resolve('test-dir');

		expect(replaceDirectory(`git -C ${workDir} fetch`)).toBe('git fetch');
	});

	it('should replace working directory 2', () => {
		process.env.GITHUB_WORKSPACE = path.resolve('test-dir');
		const workDir                = path.resolve('test-dir');

		expect(replaceDirectory(`cp -a ${workDir}/test1 ${workDir}/test2`)).toBe('cp -a <Working Directory>/test1 <Working Directory>/test2');
	});
});

describe('getPrBranchPrefix', () => {
	testEnv();

	it('should get branch prefix', () => {
		process.env.INPUT_PR_BRANCH_PREFIX = 'test-prefix/';
		expect(getPrBranchPrefix()).toBe('test-prefix/');
	});

	it('should get default', () => {
		expect(getPrBranchPrefix()).toBe(DEFAULT_PR_BRANCH_PREFIX);
	});
});

describe('getPrBranchName', () => {
	testEnv();
	const context = getContext({
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
				title: 'title',
				'html_url': 'url',
			},
		},
	});

	it('should get branch name', () => {
		process.env.INPUT_PR_BRANCH_NAME = '${PR_NUMBER}-${PR_ID}-${PR_HEAD_REF}-${PR_BASE_REF}-${PR_TITLE}-${PR_URL}';
		expect(getPrBranchName(context)).toBe('create-pr-action/11-21031067-change-master-title-url');
	});

	it('should throw error', () => {
		expect(() => getPrBranchName(context)).toThrow();
	});

	it('should throw error', () => {
		process.env.INPUT_PR_BRANCH_NAME = '${PR_NUMBER}-${PR_ID}-${PR_HEAD_REF}-${PR_BASE_REF}';
		expect(() => getPrBranchName(getContext({}))).toThrow();
	});
});

describe('getPrHeadRef', () => {
	it('should get pr head ref', () => {
		expect(getPrHeadRef(getContext({
			payload: {
				'pull_request': {
					head: {
						ref: 'change',
					},
				},
			},
		}))).toBe('change');
	});

	it('should return empty', () => {
		expect(getPrHeadRef(getContext({}))).toBe('');
	});
});

describe('isActionPr', () => {
	testEnv();

	it('should return true', () => {
		process.env.INPUT_PR_BRANCH_PREFIX = 'prefix/';
		expect(isActionPr(getContext({
			payload: {
				'pull_request': {
					head: {
						ref: 'prefix/test',
					},
				},
			},
		}))).toBe(true);
	});

	it('should return false 1', () => {
		expect(isActionPr(getContext({
			payload: {
				'pull_request': {
					head: {
						ref: 'prefix/test',
					},
				},
			},
		}))).toBe(false);
	});

	it('should return false 2', () => {
		expect(isActionPr(getContext({
			payload: {},
		}))).toBe(false);
	});
});

describe('getPrTitle', () => {
	testEnv();
	const context = getContext({
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

	it('should get PR title', () => {
		process.env.INPUT_PR_TITLE = '${PR_NUMBER}-${PR_ID}-${PR_HEAD_REF}-${PR_BASE_REF}';
		expect(getPrTitle(context)).toBe('11-21031067-change-master');
	});

	it('should throw error', () => {
		expect(() => getPrTitle(context)).toThrow();
	});

	it('should throw error', () => {
		process.env.INPUT_PR_TITLE = '${PR_NUMBER}-${PR_ID}-${PR_HEAD_REF}-${PR_BASE_REF}';
		expect(() => getPrTitle(getContext({}))).toThrow();
	});
});

describe('getPrLink', () => {
	it('should get pr link', () => {
		expect(getPrLink(generateContext({
			ref: 'heads/test',
			event: 'push',
		}, {
			payload: {
				'pull_request': {
					title: 'test title',
					'html_url': 'http://example.com',
				},
			},
		}))).toBe('[test title](http://example.com)');
	});

	it('should get empty', () => {
		expect(getPrLink(getContext({}))).toEqual('');
	});
});

describe('getPrBody', () => {
	testEnv();
	const context = getContext({
		ref: 'refs/heads/test',
		eventName: 'push',
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
				title: 'test title',
				'html_url': 'http://example.com',
			},
		},
	});

	it('should get PR Body', () => {
		process.env.INPUT_PR_BODY = `
      [\${ACTION_NAME}](\${ACTION_URL})
      \${PR_LINK}
      <details>
        <summary>Output:</summary>

        \${COMMANDS_STDOUT}

      </details>
      <details>
        <summary>\${FILES_SUMMARY}</summary>

        \${FILES}

      </details>
`;

		expect(getPrBody(['README.md', 'CHANGELOG.md'], [
			{command: 'test1', stdout: ['test1-1', 'test1-2']},
			{command: 'test2', stdout: ['test2-1', 'test2-2']},
		], context)).toBe([
			'[Create PR Action](https://github.com/technote-space/create-pr-action)',
			'[test title](http://example.com)',
			'<details>',
			'<summary>Output:</summary>',
			'',
			'',
			'```',
			'$ test1',
			'test1-1',
			'test1-2',
			'$ test2',
			'test2-1',
			'test2-2',
			'```',
			'',
			'',
			'</details>',
			'<details>',
			'<summary>Changed files</summary>',
			'',
			'- README.md',
			'- CHANGELOG.md',
			'',
			'</details>',
		].join('\n'));
	});

	it('should get PR Body', () => {
		process.env.INPUT_PR_BODY = `
		\${PR_LINK}
		\${COMMANDS}
		\${COMMANDS_STDOUT}
		\${FILES}
		\${FILES_SUMMARY}
		\${ACTION_NAME}
		\${ACTION_URL}
`;

		expect(getPrBody(['README.md'], [
			{command: 'test1', stdout: ['test1-1', 'test1-2']},
			{command: 'test2', stdout: ['test2-1', 'test2-2']},
		], context)).toBe([
			'[test title](http://example.com)',
			'',
			'```',
			'$ test1',
			'$ test2',
			'```',
			'',
			'',
			'```',
			'$ test1',
			'test1-1',
			'test1-2',
			'$ test2',
			'test2-1',
			'test2-2',
			'```',
			'',
			'- README.md',
			'Changed file',
			'Create PR Action',
			'https://github.com/technote-space/create-pr-action',
		].join('\n'));
	});

	it('should not be code', () => {
		process.env.INPUT_PR_BODY = '${COMMANDS}';

		expect(getPrBody([], [], context)).toBe('');
	});

	it('should throw error', () => {
		expect(() => getPrBody([], [], context)).toThrow();
	});
});

describe('isDisabledDeletePackage', () => {
	testEnv();

	it('should be false 1', () => {
		process.env.INPUT_DELETE_PACKAGE = '1';
		expect(isDisabledDeletePackage()).toBe(false);
	});

	it('should be false 2', () => {
		process.env.INPUT_DELETE_PACKAGE = 'true';
		expect(isDisabledDeletePackage()).toBe(false);
	});

	it('should be false 3', () => {
		process.env.INPUT_DELETE_PACKAGE = 'abc';
		expect(isDisabledDeletePackage()).toBe(false);
	});

	it('should be true 1', () => {
		process.env.INPUT_DELETE_PACKAGE = '0';
		expect(isDisabledDeletePackage()).toBe(true);
	});

	it('should be true 2', () => {
		process.env.INPUT_DELETE_PACKAGE = 'false';
		expect(isDisabledDeletePackage()).toBe(true);
	});

	it('should be true 3', () => {
		process.env.INPUT_DELETE_PACKAGE = '';
		expect(isDisabledDeletePackage()).toBe(true);
	});
});

describe('isClosePR', () => {
	testEnv();
	it('should return true', () => {
		expect(isClosePR(generateContext({
			event: 'pull_request',
			action: 'closed',
		}))).toBe(true);
	});

	it('should return false 1', () => {
		process.env.INPUT_PR_BRANCH_NAME = 'test';
		expect(isClosePR(generateContext({
			event: 'push',
		}))).toBe(false);
	});

	it('should return false 2', () => {
		expect(isClosePR(generateContext({
			event: 'pull_request',
			action: 'synchronize',
		}))).toBe(false);
	});
});

describe('filterGitStatusFunc', () => {
	testEnv();

	it('should filter git status', () => {
		process.env.INPUT_FILTER_GIT_STATUS = 'Mdc';

		expect(filterGitStatus('M  test.md')).toBe(true);
		expect(filterGitStatus('D  test.md')).toBe(true);
		expect(filterGitStatus('A  test.md')).toBe(false);
		expect(filterGitStatus('C  test.md')).toBe(false);
	});

	it('should not filter', () => {
		expect(filterGitStatus('M  test.md')).toBe(true);
		expect(filterGitStatus('D  test.md')).toBe(true);
		expect(filterGitStatus('A  test.md')).toBe(true);
		expect(filterGitStatus('C  test.md')).toBe(true);
	});

	it('should throw error', () => {
		process.env.INPUT_FILTER_GIT_STATUS = 'c';
		expect(() => filterGitStatus('C  test.md')).toThrow();
	});
});

describe('filterExtension', () => {
	testEnv();

	it('should filter extension', () => {
		process.env.INPUT_FILTER_EXTENSIONS = 'md,.txt';

		expect(filterExtension('test.md')).toBe(true);
		expect(filterExtension('test.txt')).toBe(true);
		expect(filterExtension('test.js')).toBe(false);
		expect(filterExtension('test.1md')).toBe(false);
		expect(filterExtension('test.md1')).toBe(false);
	});

	it('should not filter', () => {
		expect(filterExtension('test.md')).toBe(true);
		expect(filterExtension('test.txt')).toBe(true);
		expect(filterExtension('test.js')).toBe(true);
		expect(filterExtension('test.1md')).toBe(true);
		expect(filterExtension('test.md1')).toBe(true);
	});
});
