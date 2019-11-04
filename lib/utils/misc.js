"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const github_action_helper_1 = require("@technote-space/github-action-helper");
const filter_github_action_1 = require("@technote-space/filter-github-action");
const core_1 = require("@actions/core");
const constant_1 = require("../constant");
const { getWorkspace, getArrayInput, getBoolValue, isPr, escapeRegExp } = github_action_helper_1.Utils;
exports.getCommitMessage = () => core_1.getInput('COMMIT_MESSAGE', { required: true });
exports.getCommitName = () => core_1.getInput('COMMIT_NAME', { required: true });
exports.getCommitEmail = () => core_1.getInput('COMMIT_EMAIL', { required: true });
exports.replaceDirectory = (message) => {
    const workDir = getWorkspace();
    return message
        .split(` -C ${workDir}`).join('')
        .split(workDir).join('<Working Directory>');
};
/**
 * @return {{string, Function}[]} replacer
 */
const contextVariables = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getPrParam = (context, extractor) => {
        if (!context.payload.pull_request) {
            throw new Error('Invalid context.');
        }
        return extractor(context.payload.pull_request);
    };
    return [
        { key: 'PR_NUMBER', replace: (context) => getPrParam(context, pr => pr.number) },
        { key: 'PR_ID', replace: (context) => getPrParam(context, pr => pr.id) },
        { key: 'PR_HEAD_REF', replace: (context) => getPrParam(context, pr => pr.head.ref) },
        { key: 'PR_BASE_REF', replace: (context) => getPrParam(context, pr => pr.base.ref) },
        { key: 'PR_TITLE', replace: (context) => getPrParam(context, pr => pr.title) },
        { key: 'PR_URL', replace: (context) => getPrParam(context, pr => pr.html_url) },
    ];
};
/**
 * @param {string} variable variable
 * @param {Context} context context
 * @return {string} replaced
 */
const replaceContextVariables = (variable, context) => contextVariables().reduce((acc, value) => acc.replace(`\${${value.key}}`, value.replace(context)), variable);
exports.getPrBranchPrefix = () => core_1.getInput('PR_BRANCH_PREFIX') || constant_1.DEFAULT_PR_BRANCH_PREFIX;
exports.getPrBranchName = (context) => exports.getPrBranchPrefix() + replaceContextVariables(core_1.getInput('PR_BRANCH_NAME', { required: true }), context);
exports.getPrHeadRef = (context) => context.payload.pull_request ? context.payload.pull_request.head.ref : '';
exports.isActionPr = (context) => (new RegExp('^' + escapeRegExp(exports.getPrBranchPrefix()))).test(exports.getPrHeadRef(context));
exports.getCreateBranch = (context) => exports.isActionPr(context) ? exports.getPrHeadRef(context) : exports.getPrBranchName(context);
exports.getPrTitle = (context) => replaceContextVariables(core_1.getInput('PR_TITLE', { required: true }), context);
exports.getPrLink = (context) => context.payload.pull_request ? `[${context.payload.pull_request.title}](${context.payload.pull_request.html_url})` : '';
const prBodyVariables = (files, output) => {
    const toCode = (string) => string.length ? ['', '```', string, '```', ''].join('\n') : '';
    return [
        {
            key: 'PR_LINK',
            replace: (context) => exports.getPrLink(context),
        },
        {
            key: 'COMMANDS',
            replace: () => toCode(output.map(item => `$ ${item.command}`).join('\n')),
        },
        {
            key: 'COMMANDS_STDOUT',
            replace: () => toCode(output.map(item => [
                `$ ${item.command}`,
            ].concat(item.stdout).join('\n')).join('\n')),
        },
        {
            key: 'FILES',
            replace: () => files.map(file => `- ${file}`).join('\n'),
        },
        {
            key: 'FILES_SUMMARY',
            // eslint-disable-next-line no-magic-numbers
            replace: () => 'Changed ' + (files.length > 1 ? 'files' : 'file'),
        },
        {
            key: 'ACTION_NAME',
            replace: () => constant_1.ACTION_NAME,
        },
        {
            key: 'ACTION_URL',
            replace: () => constant_1.ACTION_URL,
        },
    ].concat(contextVariables());
};
const replacePrBodyVariables = (prBody, files, output, context) => prBodyVariables(files, output).reduce((acc, value) => acc.replace(`\${${value.key}}`, value.replace(context)), prBody);
exports.getPrBody = (files, output, context) => replacePrBodyVariables(core_1.getInput('PR_BODY', { required: true }).split(/\r?\n/).map(line => line.replace(/^[\s\t]+/, '')).join('\n'), files, output, context);
exports.isDisabledDeletePackage = () => !getBoolValue(core_1.getInput('DELETE_PACKAGE'));
exports.isClosePR = (context) => isPr(context) && context.payload.action === 'closed';
exports.isTargetContext = (context) => {
    if (!filter_github_action_1.isTargetEvent(constant_1.TARGET_EVENTS, context)) {
        return false;
    }
    if (!isPr(context)) {
        return true;
    }
    return filter_github_action_1.isTargetLabels(getArrayInput('INCLUDE_LABELS'), [], context);
};
exports.filterGitStatus = (line) => {
    const filter = core_1.getInput('FILTER_GIT_STATUS');
    if (filter) {
        const targets = filter.toUpperCase().replace(/[^MDA]/g, '');
        if (!targets) {
            throw new Error('Invalid input [FILTER_GIT_STATUS].');
        }
        return (new RegExp(`^[${targets}]\\s+`)).test(line);
    }
    return true;
};
exports.filterExtension = (line) => {
    const extensions = getArrayInput('FILTER_EXTENSIONS');
    if (extensions.length) {
        const pattern = '(' + extensions.map(item => escapeRegExp('.' + item.replace(/^\./, ''))).join('|') + ')';
        return (new RegExp(`${pattern}$`)).test(line);
    }
    return true;
};
