"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const github_action_helper_1 = require("@technote-space/github-action-helper");
const core_1 = require("@actions/core");
const constant_1 = require("../constant");
const { getArrayInput, getBoolValue } = github_action_helper_1.Utils;
exports.getRunnerArguments = () => ({
    rootDir: path_1.default.resolve(__dirname, '../..'),
    actionName: constant_1.ACTION_NAME,
    actionOwner: constant_1.ACTION_OWNER,
    actionRepo: constant_1.ACTION_REPO,
    installPackages: getArrayInput('INSTALL_PACKAGES'),
    devInstallPackages: getArrayInput('DEV_INSTALL_PACKAGES'),
    globalInstallPackages: getArrayInput('GLOBAL_INSTALL_PACKAGES'),
    executeCommands: getArrayInput('EXECUTE_COMMANDS', false, '&&', false),
    commitMessage: core_1.getInput('COMMIT_MESSAGE'),
    commitName: core_1.getInput('COMMIT_NAME'),
    commitEmail: core_1.getInput('COMMIT_EMAIL'),
    prBranchPrefix: core_1.getInput('PR_BRANCH_PREFIX'),
    prBranchName: core_1.getInput('PR_BRANCH_NAME'),
    prTitle: core_1.getInput('PR_TITLE'),
    prBody: core_1.getInput('PR_BODY'),
    prBranchPrefixForDefaultBranch: core_1.getInput('PR_DEFAULT_BRANCH_PREFIX'),
    prBranchNameForDefaultBranch: core_1.getInput('PR_DEFAULT_BRANCH_NAME'),
    prTitleForDefaultBranch: core_1.getInput('PR_DEFAULT_BRANCH_TITLE'),
    prBodyForDefaultBranch: core_1.getInput('PR_DEFAULT_BRANCH_BODY'),
    prBodyForComment: core_1.getInput('PR_COMMENT_BODY'),
    prDateFormats: [core_1.getInput('PR_DATE_FORMAT1'), core_1.getInput('PR_DATE_FORMAT2')],
    prCloseMessage: core_1.getInput('PR_CLOSE_MESSAGE'),
    filterGitStatus: core_1.getInput('FILTER_GIT_STATUS'),
    filterExtensions: getArrayInput('FILTER_EXTENSIONS'),
    targetBranchPrefix: getArrayInput('TARGET_BRANCH_PREFIX'),
    deletePackage: getBoolValue(core_1.getInput('DELETE_PACKAGE')),
    includeLabels: getArrayInput('INCLUDE_LABELS'),
    checkDefaultBranch: getBoolValue(core_1.getInput('CHECK_DEFAULT_BRANCH')),
    checkOnlyDefaultBranch: getBoolValue(core_1.getInput('ONLY_DEFAULT_BRANCH')),
});
