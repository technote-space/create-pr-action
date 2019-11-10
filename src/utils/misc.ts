import { Context } from '@actions/github/lib/context';
import { Utils } from '@technote-space/github-action-helper';
import { isTargetEvent, isTargetLabels } from '@technote-space/filter-github-action';
import { getInput } from '@actions/core' ;
import moment from 'moment';
import { TARGET_EVENTS, DEFAULT_PR_BRANCH_PREFIX, ACTION_URL, ACTION_NAME, ACTION_OWNER, ACTION_REPO, ACTION_MARKETPLACE_URL } from '../constant';

const {getWorkspace, getArrayInput, getBoolValue, isPr, escapeRegExp, replaceAll} = Utils;

export const getCommitMessage = (): string => getInput('COMMIT_MESSAGE', {required: true});

export const getCommitName = (): string => getInput('COMMIT_NAME', {required: true});

export const getCommitEmail = (): string => getInput('COMMIT_EMAIL', {required: true});

export const replaceDirectory = (message: string): string => {
	const workDir = getWorkspace();
	return message
		.split(` -C ${workDir}`).join('')
		.split(workDir).join('<Working Directory>');
};

const getDate = (suffix: string): string => moment().format(getInput(`DATE_FORMAT${suffix}`));

/**
 * @return {{string, Function}[]} replacer
 */
const contextVariables = (): { key: string; replace: (Context) => string }[] => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const getPrParam = (context: Context, extractor: (pr: { [key: string]: any }) => string): string => {
		if (!context.payload.pull_request) {
			throw new Error('Invalid context.');
		}
		return extractor(context.payload.pull_request);
	};
	return [
		{key: 'PR_NUMBER', replace: (context: Context): string => getPrParam(context, pr => pr.number)},
		{key: 'PR_ID', replace: (context: Context): string => getPrParam(context, pr => pr.id)},
		{key: 'PR_HEAD_REF', replace: (context: Context): string => getPrParam(context, pr => pr.head.ref)},
		{key: 'PR_BASE_REF', replace: (context: Context): string => getPrParam(context, pr => pr.base.ref)},
		{key: 'PR_TITLE', replace: (context: Context): string => getPrParam(context, pr => pr.title)},
		{key: 'PR_URL', replace: (context: Context): string => getPrParam(context, pr => pr.html_url)},
		{key: 'DATE1', replace: (): string => getDate('1')},
		{key: 'DATE2', replace: (): string => getDate('2')},
	];
};

/**
 * @param {string} string string
 * @param {object[]} variables variables
 * @param {Context} context context
 * @return {string} replaced
 */
const replaceVariables = (string: string, variables: { key: string; replace: (Context) => string }[], context: Context): string => variables.reduce((acc, value) => replaceAll(acc, `\${${value.key}}`, value.replace(context)), string);

/**
 * @param {string} string string
 * @param {Context} context context
 * @return {string} replaced
 */
const replaceContextVariables = (string: string, context: Context): string => replaceVariables(string, contextVariables(), context);

export const getPrBranchPrefix = (): string => getInput('PR_BRANCH_PREFIX') || DEFAULT_PR_BRANCH_PREFIX;

export const getPrBranchName = (context: Context): string => getPrBranchPrefix() + replaceContextVariables(getInput('PR_BRANCH_NAME', {required: true}), context);

export const getPrBaseRef = (context: Context): string => context.payload.pull_request ? context.payload.pull_request.base.ref : '';

export const getPrHeadRef = (context: Context): string => context.payload.pull_request ? context.payload.pull_request.head.ref : '';

export const isActionPr = (context: Context): boolean => (new RegExp('^' + escapeRegExp(getPrBranchPrefix()))).test(getPrHeadRef(context));

export const getPrTitle = (context: Context): string => replaceContextVariables(getInput('PR_TITLE', {required: true}), context);

export const getPrLink = (context: Context): string => context.payload.pull_request ? `[${context.payload.pull_request.title}](${context.payload.pull_request.html_url})` : '';

const prBodyVariables = (files: string[], output: {
	command: string;
	stdout: string[];
}[]): { key: string; replace: (Context) => string }[] => {
	const toCode = (string: string): string => string.length ? ['', '```', string, '```', ''].join('\n') : '';
	return [
		{
			key: 'PR_LINK',
			replace: (context: Context): string => getPrLink(context),
		},
		{
			key: 'COMMANDS',
			replace: (): string => output.length ? toCode(output.map(item => `$ ${item.command}`).join('\n')) : '',
		},
		{
			key: 'COMMANDS_STDOUT',
			replace: (): string => output.length ? '<details>\n' + output.map(item => [
				`<summary><em>${item.command}</em></summary>`,
				toCode(item.stdout.join('\n')),
			].join('\n')).join('\n</details>\n<details>\n') + '\n</details>' : '',
		},
		{
			key: 'COMMANDS_STDOUT_OPEN',
			replace: (): string => output.length ? '<details open>\n' + output.map(item => [
				`<summary><em>${item.command}</em></summary>`,
				toCode(item.stdout.join('\n')),
			].join('\n')).join('\n</details>\n<details open>\n') + '\n</details>' : '',
		},
		{
			key: 'FILES',
			replace: (): string => files.map(file => `- ${file}`).join('\n'),
		},
		{
			key: 'FILES_SUMMARY',
			// eslint-disable-next-line no-magic-numbers
			replace: (): string => 'Changed ' + (files.length > 1 ? `${files.length} files` : 'file'),
		},
		{
			key: 'ACTION_NAME',
			replace: (): string => ACTION_NAME,
		},
		{
			key: 'ACTION_OWNER',
			replace: (): string => ACTION_OWNER,
		},
		{
			key: 'ACTION_REPO',
			replace: (): string => ACTION_REPO,
		},
		{
			key: 'ACTION_URL',
			replace: (): string => ACTION_URL,
		},
		{
			key: 'ACTION_MARKETPLACE_URL',
			replace: (): string => ACTION_MARKETPLACE_URL,
		},
	].concat(contextVariables());
};

const replacePrBodyVariables = (prBody: string, files: string[], output: {
	command: string;
	stdout: string[];
}[], context: Context): string => replaceVariables(prBody, prBodyVariables(files, output), context);

export const getPrBody = (files: string[], output: {
	command: string;
	stdout: string[];
}[], context: Context): string => replacePrBodyVariables(
	getInput('PR_BODY', {required: true}).split(/\r?\n/).map(line => line.replace(/^[\s\t]+/, '')).join('\n'),
	files,
	output,
	context,
);

export const isDisabledDeletePackage = (): boolean => !getBoolValue(getInput('DELETE_PACKAGE'));

export const isClosePR = (context: Context): boolean => isPr(context) && context.payload.action === 'closed';

export const isTargetContext = (context: Context): boolean => {
	if (!isTargetEvent(TARGET_EVENTS, context)) {
		return false;
	}

	if (!isPr(context)) {
		return true;
	}

	return isTargetLabels(getArrayInput('INCLUDE_LABELS'), [], context);
};

export const getGitFilterStatus = (): string => getInput('FILTER_GIT_STATUS');

export const filterGitStatus = (line: string): boolean => {
	const filter = getGitFilterStatus();
	if (filter) {
		const targets = filter.toUpperCase().replace(/[^MDA]/g, '');
		if (!targets) {
			throw new Error('Invalid input [FILTER_GIT_STATUS].');
		}
		return (new RegExp(`^[${targets}]\\s+`)).test(line);
	}
	return true;
};

export const filterExtension = (line: string): boolean => {
	const extensions = getArrayInput('FILTER_EXTENSIONS');
	if (extensions.length) {
		const pattern = '(' + extensions.map(item => escapeRegExp('.' + item.replace(/^\./, ''))).join('|') + ')';
		return (new RegExp(`${pattern}$`)).test(line);
	}
	return true;
};
