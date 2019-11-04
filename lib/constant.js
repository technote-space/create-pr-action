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
exports.ACTION_URL = 'https://github.com/technote-space/create-pr-action';
exports.INTERVAL_MS = 500;
