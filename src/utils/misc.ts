import { Context } from '@actions/github/lib/context';
import { Utils } from '@technote-space/github-action-helper';
import { isTargetEvent, isTargetLabels } from '@technote-space/filter-github-action';
import { getInput } from '@actions/core' ;
import { TARGET_EVENTS, DEFAULT_PR_BRANCH_PREFIX, ACTION_URL, ACTION_NAME } from '../constant';

const {getWorkspace, getArrayInput, getBoolValue, isPr, escapeRegExp} = Utils;

export const getCommitMessage = (): string => getInput('COMMIT_MESSAGE', {required: true});

export const getCommitName = (): string => getInput('COMMIT_NAME', {required: true});

export const getCommitEmail = (): string => getInput('COMMIT_EMAIL', {required: true});

export const replaceDirectory = (message: string): string => {
	const workDir = getWorkspace();
	return message
		.split(` -C ${workDir}`).join('')
		.split(workDir).join('<Working Directory>');
};

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
	];
};

/**
 * @param {string} variable variable
 * @param {Context} context context
 * @return {string} replaced
 */
const replaceContextVariables = (variable: string, context: Context): string => contextVariables().reduce((acc, value) => acc.replace(`\${${value.key}}`, value.replace(context)), variable);

export const getPrBranchPrefix = (): string => getInput('PR_BRANCH_PREFIX') || DEFAULT_PR_BRANCH_PREFIX;

export const getPrBranchName = (context: Context): string => getPrBranchPrefix() + replaceContextVariables(getInput('PR_BRANCH_NAME', {required: true}), context);

export const getPrHeadRef = (context: Context): string => context.payload.pull_request ? context.payload.pull_request.head.ref : '';

export const isActionPr = (context: Context): boolean => (new RegExp('^' + escapeRegExp(getPrBranchPrefix()))).test(getPrHeadRef(context));

export const getCreateBranch = (context: Context): string => isActionPr(context) ? getPrHeadRef(context) : getPrBranchName(context);

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
			replace: (): string => toCode(output.map(item => `$ ${item.command}`).join('\n')),
		},
		{
			key: 'COMMANDS_STDOUT',
			replace: (): string => toCode(output.map(item => [
				`$ ${item.command}`,
			].concat(item.stdout).join('\n')).join('\n')),
		},
		{
			key: 'FILES',
			replace: (): string => files.map(file => `- ${file}`).join('\n'),
		},
		{
			key: 'FILES_SUMMARY',
			// eslint-disable-next-line no-magic-numbers
			replace: (): string => 'Changed ' + (files.length > 1 ? 'files' : 'file'),
		},
		{
			key: 'ACTION_NAME',
			replace: (): string => ACTION_NAME,
		},
		{
			key: 'ACTION_URL',
			replace: (): string => ACTION_URL,
		},
	].concat(contextVariables());
};

const replacePrBodyVariables = (prBody: string, files: string[], output: {
	command: string;
	stdout: string[];
}[], context: Context): string => prBodyVariables(files, output).reduce((acc, value) => acc.replace(`\${${value.key}}`, value.replace(context)), prBody);

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

export const filterGitStatus = (line: string): boolean => {
	const filter = getInput('FILTER_GIT_STATUS');
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
