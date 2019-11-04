import { getInput } from '@actions/core';
import { GitHub } from '@actions/github';
import { Context } from '@actions/github/lib/context';
import { Logger, ApiHelper, GitHelper, Utils } from '@technote-space/github-action-helper';
import { getChangedFiles } from './command';
import {
	replaceDirectory,
	getCommitMessage,
	getCommitName,
	getCommitEmail,
	getPrBody,
	getPrBranchName,
	getPrTitle,
	isClosePR,
	getPrHeadRef,
	getCreateBranch,
} from './misc';
import { INTERVAL_MS } from '../constant';

const {getWorkspace, isPr, isCron, sleep} = Utils;
const commonLogger                        = new Logger(replaceDirectory);

const getGitHelper = (logger: Logger): GitHelper => new GitHelper(logger);

const getApiHelper = (logger: Logger): ApiHelper => new ApiHelper(logger);

const config = async(helper: GitHelper): Promise<void> => {
	const name  = getCommitName();
	const email = getCommitEmail();
	await helper.config(getWorkspace(), name, email);
};

const createPr = async(logger: Logger, octokit: GitHub, context: Context): Promise<void> => {
	if (isCron(context)) {
		commonLogger.startProcess('Target PullRequest Ref [%s]', getPrHeadRef(context));
	}

	const {files, output} = await getChangedFiles(logger, context);
	if (!files.length) {
		return;
	}

	const helper     = getGitHelper(logger);
	const branchName = getCreateBranch(context);

	await config(helper);
	await helper.makeCommit(getWorkspace(), getCommitMessage());
	await helper.push(getWorkspace(), branchName, context);
	await getApiHelper(logger).pullsCreateOrUpdate(branchName, {
		title: getPrTitle(context),
		body: getPrBody(files, output, context),
	}, octokit, context);

	if (isCron(context)) {
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
					},
				},
			}));
		}
	}
	commonLogger.endProcess();
};