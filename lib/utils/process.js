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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const github_action_helper_1 = require("@technote-space/github-action-helper");
const command_1 = require("./command");
const misc_1 = require("./misc");
const constant_1 = require("../constant");
const { getWorkspace, getRepository, isPr, isCron, sleep } = github_action_helper_1.Utils;
const commonLogger = new github_action_helper_1.Logger(misc_1.replaceDirectory);
const getGitHelper = (logger) => new github_action_helper_1.GitHelper(logger);
const getApiHelper = (logger) => new github_action_helper_1.ApiHelper(logger);
const config = (logger, helper) => __awaiter(void 0, void 0, void 0, function* () {
    const name = misc_1.getCommitName();
    const email = misc_1.getCommitEmail();
    logger.startProcess('Configuring git committer to be %s <%s>', name, email);
    yield helper.config(getWorkspace(), name, email);
});
const commit = (logger, helper) => __awaiter(void 0, void 0, void 0, function* () {
    logger.startProcess('Committing...');
    yield helper.makeCommit(getWorkspace(), misc_1.getCommitMessage());
});
const push = (branchName, logger, helper, context) => __awaiter(void 0, void 0, void 0, function* () {
    logger.startProcess('Pushing to %s@%s...', getRepository(context), branchName);
    yield helper.push(getWorkspace(), branchName, false, context);
});
const createPr = (logger, octokit, context) => __awaiter(void 0, void 0, void 0, function* () {
    if (isCron(context)) {
        commonLogger.startProcess('Target PullRequest Ref [%s]', misc_1.getPrHeadRef(context));
    }
    const { files, output } = yield command_1.getChangedFiles(logger, context);
    if (!files.length) {
        logger.info('There is no diff.');
        return;
    }
    const helper = getGitHelper(logger);
    const branchName = misc_1.getPrBranchName(context);
    yield config(logger, helper);
    yield commit(logger, helper);
    yield push(branchName, logger, helper, context);
    if ((yield command_1.getRefDiff(misc_1.getPrBaseRef(context), branchName, logger, context)).length) {
        yield getApiHelper(logger).pullsCreateOrComment(branchName, {
            title: misc_1.getPrTitle(context),
            body: misc_1.getPrBody(files, output, context),
        }, octokit, context);
    }
    else {
        yield getApiHelper(logger).closePR(branchName, octokit, context);
    }
    if (isCron(context)) {
        yield sleep(constant_1.INTERVAL_MS);
    }
});
exports.execute = (context) => __awaiter(void 0, void 0, void 0, function* () {
    var e_1, _a;
    const octokit = new github_1.GitHub(core_1.getInput('GITHUB_TOKEN', { required: true }));
    if (misc_1.isClosePR(context)) {
        yield getApiHelper(commonLogger).closePR(misc_1.getPrBranchName(context), octokit, context);
        return;
    }
    if (isPr(context)) {
        yield createPr(commonLogger, octokit, context);
    }
    else {
        const logger = new github_action_helper_1.Logger(misc_1.replaceDirectory, true);
        try {
            for (var _b = __asyncValues(getApiHelper(logger).pullsList({}, octokit, context)), _c; _c = yield _b.next(), !_c.done;) {
                const pull = _c.value;
                yield createPr(logger, octokit, Object.assign({}, context, {
                    payload: {
                        'pull_request': {
                            number: pull.number,
                            id: pull.id,
                            head: pull.head,
                            base: pull.base,
                        },
                    },
                    repo: {
                        owner: pull.base.repo.owner.login,
                        repo: pull.base.repo.name,
                    },
                }));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    commonLogger.endProcess();
});
