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
export const ACTION_URL               = 'https://github.com/technote-space/create-pr-action';
export const INTERVAL_MS              = 500;