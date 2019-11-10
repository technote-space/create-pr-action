"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TARGET_EVENTS = {
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
exports.DEFAULT_PR_BRANCH_PREFIX = 'create-pr-action/';
exports.ACTION_NAME = 'Create PR Action';
exports.ACTION_OWNER = 'technote-space';
exports.ACTION_REPO = 'create-pr-action';
exports.ACTION_URL = `https://github.com/${exports.ACTION_OWNER}/${exports.ACTION_REPO}`;
exports.ACTION_MARKETPLACE_URL = `https://github.com/marketplace/actions/${exports.ACTION_REPO}`;
exports.INTERVAL_MS = 1000;
