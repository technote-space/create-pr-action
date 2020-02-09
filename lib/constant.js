"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
exports.ACTION_NAME = 'Create PR Action';
exports.ACTION_OWNER = 'technote-space';
exports.ACTION_REPO = 'create-pr-action';
exports.TARGET_NCU_COMMANDS = [
    'npx npm-check-updates ',
    'npm-check-updates ',
    'ncu ',
];
exports.REPLACE_NCU_COMMAND = path_1.resolve(__dirname, '../node_modules/.bin/ncu ');
