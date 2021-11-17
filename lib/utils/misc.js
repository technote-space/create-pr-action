"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRunnerArguments = exports.getOnlyDefaultBranchFlag = exports.replaceNcuCommands = void 0;
const path_1 = __importDefault(require("path"));
const github_action_helper_1 = require("@technote-space/github-action-helper");
const core_1 = require("@actions/core");
const constant_1 = require("../constant");
const { getArrayInput, getBoolValue } = github_action_helper_1.Utils;
// ^npx npm-check-updates ⇒ ncu
const replaceNcuCommand = (command) => constant_1.TARGET_NCU_COMMANDS.reduce((command, target) => command.replace(github_action_helper_1.Utils.getPrefixRegExp(target), `${constant_1.BIN_FILE} `), command);
const getAddPathCommand = () => () => __awaiter(void 0, void 0, void 0, function* () {
    (0, core_1.addPath)(constant_1.BIN_PATH);
    return {
        command: 'add path',
        stdout: [constant_1.BIN_PATH],
        stderr: [],
    };
});
const replaceNcuCommands = (commands) => commands.map(replaceNcuCommand);
exports.replaceNcuCommands = replaceNcuCommands;
const getOnlyDefaultBranchFlag = (context) => {
    const input = (0, core_1.getInput)('ONLY_DEFAULT_BRANCH');
    if ('' === input) {
        return !github_action_helper_1.ContextHelper.isPr(context);
    }
    return getBoolValue(input);
};
exports.getOnlyDefaultBranchFlag = getOnlyDefaultBranchFlag;
const getRunnerArguments = (context) => ({
    rootDir: path_1.default.resolve(__dirname, '../..'),
    actionName: constant_1.ACTION_NAME,
    actionOwner: constant_1.ACTION_OWNER,
    actionRepo: constant_1.ACTION_REPO,
    installPackages: getArrayInput('INSTALL_PACKAGES'),
    devInstallPackages: getArrayInput('DEV_INSTALL_PACKAGES'),
    globalInstallPackages: getArrayInput('GLOBAL_INSTALL_PACKAGES').filter(item => 'npm-check-updates' !== item),
    executeCommands: [getAddPathCommand()].concat((0, exports.replaceNcuCommands)(getArrayInput('EXECUTE_COMMANDS', false, '&&', false))),
    commitMessage: (0, core_1.getInput)('COMMIT_MESSAGE'),
    commitName: (0, core_1.getInput)('COMMIT_NAME'),
    commitEmail: (0, core_1.getInput)('COMMIT_EMAIL'),
    prBranchPrefix: (0, core_1.getInput)('PR_BRANCH_PREFIX'),
    prBranchName: (0, core_1.getInput)('PR_BRANCH_NAME'),
    prTitle: (0, core_1.getInput)('PR_TITLE'),
    prBody: (0, core_1.getInput)('PR_BODY'),
    prBranchPrefixForDefaultBranch: (0, core_1.getInput)('PR_DEFAULT_BRANCH_PREFIX'),
    prBranchNameForDefaultBranch: (0, core_1.getInput)('PR_DEFAULT_BRANCH_NAME'),
    prTitleForDefaultBranch: (0, core_1.getInput)('PR_DEFAULT_BRANCH_TITLE'),
    prBodyForDefaultBranch: (0, core_1.getInput)('PR_DEFAULT_BRANCH_BODY'),
    prBodyForComment: (0, core_1.getInput)('PR_COMMENT_BODY'),
    prDateFormats: [(0, core_1.getInput)('PR_DATE_FORMAT1'), (0, core_1.getInput)('PR_DATE_FORMAT2')],
    prCloseMessage: (0, core_1.getInput)('PR_CLOSE_MESSAGE'),
    filterGitStatus: (0, core_1.getInput)('FILTER_GIT_STATUS'),
    filterExtensions: getArrayInput('FILTER_EXTENSIONS'),
    targetBranchPrefix: getArrayInput('TARGET_BRANCH_PREFIX'),
    deletePackage: getBoolValue((0, core_1.getInput)('DELETE_PACKAGE')),
    includeLabels: getArrayInput('INCLUDE_LABELS'),
    checkDefaultBranch: getBoolValue((0, core_1.getInput)('CHECK_DEFAULT_BRANCH')),
    checkOnlyDefaultBranch: (0, exports.getOnlyDefaultBranchFlag)(context),
    autoMergeThresholdDays: (0, core_1.getInput)('AUTO_MERGE_THRESHOLD_DAYS'),
});
exports.getRunnerArguments = getRunnerArguments;
