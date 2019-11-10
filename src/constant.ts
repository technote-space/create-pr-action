export const TARGET_EVENTS            = {
	'pull_request': [
		'opened',
		'reopened',
		'synchronize',
		'labeled',
		'unlabeled',
		'closed',
	],
	'schedule': '*',
};
export const DEFAULT_PR_BRANCH_PREFIX = 'create-pr-action/';
export const ACTION_NAME              = 'Create PR Action';
export const ACTION_OWNER             = 'technote-space';
export const ACTION_REPO              = 'create-pr-action';
export const ACTION_URL               = `https://github.com/${ACTION_OWNER}/${ACTION_REPO}`;
export const ACTION_MARKETPLACE_URL   = `https://github.com/marketplace/actions/${ACTION_REPO}`;
export const INTERVAL_MS              = 1000;
