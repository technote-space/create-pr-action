import { getInput } from '@actions/core';
import { GitHub } from '@actions/github';
import { Context } from '@actions/github/lib/context';
import { Logger, Utils, ContextHelper } from '@technote-space/github-action-helper';
import {
	getApiHelper,
	getChangedFiles,
	getRefDiff,
	commit,
	push,
	isMergeable,
	updatePr,
	resolveConflicts,
} from './command';
import {
	replaceDirectory,
	getPrBranchName,
	isActionPr,
	isClosePR,
	isTargetBranch,
	getPrHeadRef,
} from './misc';
import { INTERVAL_MS } from '../constant';

const {sleep}        = Utils;
const {isPr, isCron} = ContextHelper;
const commonLogger   = new Logger(replaceDirectory);

const createPr = async(logger: Logger, octokit: GitHub, context: Context): Promise<void> => {
	if (isActionPr(context)) {
		return;
	}
	if (!isTargetBranch(getPrHeadRef(context))) {
		return;
	}
	if (isCron(context)) {
		commonLogger.startProcess('Target PullRequest Ref [%s]', getPrHeadRef(context));
	}

	let mergeable    = false;
	const branchName = getPrBranchName(context);

	const {files, output} = await getChangedFiles(logger, context);
	if (!files.length) {
		logger.info('There is no diff.');
		const pr = await getApiHelper(logger).findPullRequest(branchName, octokit, context);
		if (!pr) {
			// There is no PR
			return;
		}
		if (!(await getRefDiff(getPrHeadRef(context), logger)).length) {
			// Close if there is no diff
			await getApiHelper(logger).closePR(branchName, octokit, context);
			return;
		}
		mergeable = await isMergeable(pr.number, octokit, context);
	} else {
		// Commit local diffs
		await commit(logger);
		if (!(await getRefDiff(getPrHeadRef(context), logger)).length) {
			// Close if there is no diff
			await getApiHelper(logger).closePR(branchName, octokit, context);
			return;
		}
		await push(branchName, logger, context);
	}

	if (files.length) {
		// Update PR if there is at least one change
		mergeable = await updatePr(branchName, files, output, logger, octokit, context);
	}

	if (!mergeable) {
		// Resolve conflicts if PR is not mergeable
		await resolveConflicts(branchName, logger, octokit, context);
	}

	if (isCron(context)) {
		// Sleep
		await sleep(INTERVAL_MS);
	}
};

export const execute = async(context: Context): Promise<void> => {
	const octokit = new GitHub(getInput('GITHUB_TOKEN', {required: true}));
	if (isClosePR(context)) {
		await getApiHelper(commonLogger).closePR(getPrBranchName(context), octokit, context);
		return;
	}

	if (isPr(context)) {
		await createPr(commonLogger, octokit, context);
	} else {
		const logger = new Logger(replaceDirectory, true);
		for await (const pull of getApiHelper(logger).pullsList({}, octokit, context)) {
			await createPr(logger, octokit, Object.assign({}, context, {
				payload: {
					'pull_request': {
						number: pull.number,
						id: pull.id,
						head: pull.head,
						base: pull.base,
						title: pull.title,
						'html_url': pull.html_url,
					},
				},
				repo: {
					owner: pull.base.repo.owner.login,
					repo: pull.base.repo.name,
				},
			}));
		}
	}
	commonLogger.endProcess();
};