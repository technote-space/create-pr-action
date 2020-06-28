"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BIN_PATH = exports.TARGET_NCU_COMMANDS = exports.ACTION_REPO = exports.ACTION_OWNER = exports.ACTION_NAME = void 0;
const path_1 = require("path");
exports.ACTION_NAME = 'Create PR Action';
exports.ACTION_OWNER = 'technote-space';
exports.ACTION_REPO = 'create-pr-action';
exports.TARGET_NCU_COMMANDS = [
    'npx npm-check-updates ',
    'npx ncu ',
    'npm-check-updates ',
    'ncu ',
];
exports.BIN_PATH = path_1.resolve(__dirname, '../node_modules/npm-check-updates/bin');
