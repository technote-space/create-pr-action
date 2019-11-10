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
const fs_1 = __importDefault(require("fs"));
const github_action_helper_1 = require("@technote-space/github-action-helper");
const core_1 = require("@actions/core");
const misc_1 = require("./misc");
const { getWorkspace, getRepository, getArrayInput, useNpm } = github_action_helper_1.Utils;
const helper = new github_action_helper_1.GitHelper(new github_action_helper_1.Logger(misc_1.replaceDirectory), { filter: (line) => misc_1.filterGitStatus(line) && misc_1.filterExtension(line) });
exports.getApiHelper = (logger) => new github_action_helper_1.ApiHelper(logger);
exports.clone = (logger, context) => __awaiter(void 0, void 0, void 0, function* () {
    logger.startProcess('Cloning [%s] branch from the remote repo...', misc_1.getPrBranchName(context));
    yield helper.cloneBranch(getWorkspace(), misc_1.getPrBranchName(context), context);
});
exports.checkBranch = (logger, context) => __awaiter(void 0, void 0, void 0, function* () {
    const clonedBranch = yield helper.getCurrentBranchName(getWorkspace());
    if (misc_1.getPrBranchName(context) !== clonedBranch) {
        logger.info('remote branch [%s] not found.', misc_1.getPrBranchName(context));
        logger.info('now branch: %s', clonedBranch);
        logger.startProcess('Cloning [%s] from the remote repo...', misc_1.getPrHeadRef(context));
        yield helper.cloneBranch(getWorkspace(), misc_1.getPrHeadRef(context), context);
        yield helper.createBranch(getWorkspace(), misc_1.getPrBranchName(context));
    }
    yield helper.runCommand(getWorkspace(), ['ls -la']);
});
const getClearPackageCommands = () => {
    if (misc_1.isDisabledDeletePackage()) {
        return [];
    }
    return [
        'rm -f package.json',
        'rm -f package-lock.json',
        'rm -f yarn.lock',
    ];
};
const getGlobalInstallPackagesCommands = (workDir) => {
    const packages = getArrayInput('GLOBAL_INSTALL_PACKAGES');
    if (packages.length) {
        if (useNpm(workDir, core_1.getInput('PACKAGE_MANAGER'))) {
            return [
                'sudo npm install -g ' + packages.join(' '),
            ];
        }
        else {
            return [
                'sudo yarn global add ' + packages.join(' '),
            ];
        }
    }
    return [];
};
const getInstallPackagesCommands = (workDir) => {
    const packages = getArrayInput('INSTALL_PACKAGES');
    if (packages.length) {
        if (useNpm(workDir, core_1.getInput('PACKAGE_MANAGER'))) {
            return [
                'npm install --save ' + packages.join(' '),
            ];
        }
        else {
            return [
                'yarn add ' + packages.join(' '),
            ];
        }
    }
    return [];
};
const normalizeCommand = (command) => command.trim().replace(/\s{2,}/g, ' ');
const getExecuteCommands = () => getArrayInput('EXECUTE_COMMANDS', true, '&&').map(normalizeCommand);
exports.getDiff = (logger) => __awaiter(void 0, void 0, void 0, function* () {
    logger.startProcess('Checking diff...');
    yield helper.runCommand(getWorkspace(), ['git add --all']);
    return yield helper.getDiff(getWorkspace());
});
exports.getRefDiff = (base, compare, logger, context) => __awaiter(void 0, void 0, void 0, function* () {
    logger.startProcess('Checking references diff...');
    yield helper.fetchBranch(getWorkspace(), base, context);
    return (yield helper.getRefDiff(getWorkspace(), base, compare, misc_1.getGitFilterStatus())).filter(misc_1.filterExtension);
});
const initDirectory = (logger) => __awaiter(void 0, void 0, void 0, function* () {
    logger.startProcess('Initializing working directory...');
    yield helper.runCommand(getWorkspace(), ['rm -rdf ./*']);
    fs_1.default.mkdirSync(getWorkspace(), { recursive: true });
});
exports.merge = (branch, logger) => __awaiter(void 0, void 0, void 0, function* () {
    logger.startProcess('Merging [%s] branch...', branch.replace(/^(refs\/)?heads/, ''));
    const results = yield helper.runCommand(getWorkspace(), [
        `git merge --no-edit ${branch.replace(/^(refs\/)?heads/, '')}`,
    ]);
    return !results[0].stdout.some(RegExp.prototype.test, /^CONFLICT /);
});
exports.config = (logger, helper) => __awaiter(void 0, void 0, void 0, function* () {
    const name = misc_1.getCommitName();
    const email = misc_1.getCommitEmail();
    logger.startProcess('Configuring git committer to be %s <%s>', name, email);
    yield helper.config(getWorkspace(), name, email);
});
exports.commit = (logger, helper) => __awaiter(void 0, void 0, void 0, function* () {
    logger.startProcess('Committing...');
    yield helper.makeCommit(getWorkspace(), misc_1.getCommitMessage());
});
exports.push = (branchName, logger, helper, context) => __awaiter(void 0, void 0, void 0, function* () {
    logger.startProcess('Pushing to %s@%s...', getRepository(context), branchName);
    yield helper.push(getWorkspace(), branchName, false, context);
});
exports.isMergeable = (number, octokit, context) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield octokit.pulls.get({
        owner: context.repo.owner,
        repo: context.repo.repo,
        'pull_number': number,
    })).data.mergeable;
});
exports.updatePr = (branchName, files, output, logger, octokit, context) => __awaiter(void 0, void 0, void 0, function* () {
    const info = yield exports.getApiHelper(logger).pullsCreateOrComment(branchName, {
        title: misc_1.getPrTitle(context),
        body: misc_1.getPrBody(files, output, context),
    }, octokit, context);
    if (!info.isPrCreated) {
        // updated PR
        return exports.isMergeable(info.number, octokit, context);
    }
    return true;
});
const runCommands = (logger) => __awaiter(void 0, void 0, void 0, function* () {
    const commands = new Array().concat.apply([], [
        getClearPackageCommands(),
        getGlobalInstallPackagesCommands(getWorkspace()),
        getInstallPackagesCommands(getWorkspace()),
        getExecuteCommands(),
    ]);
    logger.startProcess('Running commands...');
    const output = yield helper.runCommand(getWorkspace(), commands);
    return {
        files: yield exports.getDiff(logger),
        output,
    };
});
exports.getChangedFiles = (logger, context) => __awaiter(void 0, void 0, void 0, function* () {
    yield initDirectory(logger);
    yield exports.clone(logger, context);
    yield exports.checkBranch(logger, context);
    return runCommands(logger);
});
exports.getChangedFilesForRebase = (logger, context) => __awaiter(void 0, void 0, void 0, function* () {
    yield initDirectory(logger);
    yield helper.cloneBranch(getWorkspace(), misc_1.getPrHeadRef(context), context);
    yield helper.createBranch(getWorkspace(), misc_1.getPrBranchName(context));
    return runCommands(logger);
});
exports.resolveConflicts = (branchName, logger, helper, octokit, context) => __awaiter(void 0, void 0, void 0, function* () {
    if (yield exports.merge(misc_1.getPrBaseRef(context), logger)) {
        // succeeded to merge
        yield exports.push(branchName, logger, helper, context);
    }
    else {
        // failed to merge
        const { files, output } = yield exports.getChangedFilesForRebase(logger, context);
        if (!files.length) {
            yield exports.getApiHelper(logger).closePR(branchName, octokit, context);
            return;
        }
        yield exports.commit(logger, helper);
        yield exports.push(branchName, logger, helper, context);
        yield exports.getApiHelper(logger).pullsCreateOrUpdate(branchName, {
            title: misc_1.getPrTitle(context),
            body: misc_1.getPrBody(files, output, context),
        }, octokit, context);
    }
});
