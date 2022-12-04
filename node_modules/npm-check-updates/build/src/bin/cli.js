#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const pickBy_1 = __importDefault(require("lodash/pickBy"));
const semver_1 = __importDefault(require("semver"));
const package_json_1 = __importDefault(require("../../package.json"));
const cli_options_1 = __importDefault(require("../cli-options"));
const index_1 = __importDefault(require("../index"));
const chalk_1 = require("../lib/chalk");
const getNcuRc_1 = __importDefault(require("../lib/getNcuRc"));
(async () => {
    var _a, _b, _c;
    // importing update-notifier dynamically as esm modules are only allowed to be dynamically imported inside of cjs modules
    const { default: updateNotifier } = await import('update-notifier');
    // check if a new version of ncu is available and print an update notification
    //
    // For testing from specific versions, use:
    //
    // updateNotifier({
    //   pkg: {
    //     name: 'npm-check-updates',
    //     version: x.y.z
    //   },
    //   updateCheckInterval: 0
    // })
    const notifier = updateNotifier({ pkg: package_json_1.default });
    if (notifier.update && notifier.update.latest !== package_json_1.default.version) {
        const { default: chalk } = await import('chalk');
        // generate release urls for all the major versions from the current version up to the latest
        const currentMajor = (_a = semver_1.default.parse(notifier.update.current)) === null || _a === void 0 ? void 0 : _a.major;
        const latestMajor = (_b = semver_1.default.parse(notifier.update.latest)) === null || _b === void 0 ? void 0 : _b.major;
        const majorVersions = 
        // Greater than or equal to (>=) will always return false if either operant is NaN or undefined.
        // Without this condition, it can result in a RangeError: Invalid array length.
        // See: https://github.com/raineorshine/npm-check-updates/issues/1200
        currentMajor && latestMajor && latestMajor >= currentMajor
            ? new Array(latestMajor - currentMajor).fill(0).map((x, i) => currentMajor + i + 1)
            : [];
        const releaseUrls = majorVersions.map(majorVersion => { var _a; return `${(_a = package_json_1.default.homepage) !== null && _a !== void 0 ? _a : ''}/releases/tag/v${majorVersion}.0.0`; });
        // for non-major updates, generate a URL to view all commits since the current version
        const compareUrl = `${(_c = package_json_1.default.homepage) !== null && _c !== void 0 ? _c : ''}/compare/v${notifier.update.current}...v${notifier.update.latest}`;
        notifier.notify({
            defer: false,
            isGlobal: true,
            message: `Update available ${chalk.dim('{currentVersion}')}${chalk.reset(' → ')}${notifier.update.type === 'major'
                ? chalk.red('{latestVersion}')
                : notifier.update.type === 'minor'
                    ? chalk.yellow('{latestVersion}')
                    : chalk.green('{latestVersion}')}
Run ${chalk.cyan('{updateCommand}')} to update
${chalk.dim.underline(notifier.update.type === 'major' ? releaseUrls.map(url => chalk.dim.underline(url)).join('\n') : compareUrl)}`,
        });
    }
    // manually detect option-specific help
    // https://github.com/raineorshine/npm-check-updates/issues/787
    const rawArgs = process.argv.slice(2);
    if (rawArgs.includes('--help') && rawArgs.length > 1) {
        const color = rawArgs.includes('--color');
        await (0, chalk_1.chalkInit)(color);
        const nonHelpArgs = rawArgs.filter(arg => arg !== '--help');
        nonHelpArgs.forEach(arg => {
            // match option by long or short
            const query = arg.replace(/^-*/, '');
            const option = cli_options_1.default.find(option => option.long === query || option.short === query);
            if (option) {
                console.info(`Usage: ncu --${option.long}${option.arg ? ` [${option.arg}]` : ''}`);
                if (option.short) {
                    console.info(`       ncu -${option.short}${option.arg ? ` [${option.arg}]` : ''}`);
                }
                if (option.default !== undefined && !(Array.isArray(option.default) && option.default.length === 0)) {
                    console.info(`Default: ${option.default}`);
                }
                if (option.help) {
                    const helpText = typeof option.help === 'function' ? option.help() : option.help;
                    console.info(`\n${helpText}`);
                }
                else if (option.description) {
                    console.info(`\n${option.description}`);
                }
            }
            else {
                console.info(`Unknown option: ${arg}`);
            }
        });
        if (rawArgs.length - nonHelpArgs.length > 1) {
            console.info('Would you like some help with your help?');
        }
        process.exit(0);
    }
    // start commander program
    commander_1.program
        .description('[filter] is a list or regex of package names to check (all others will be ignored).')
        .usage('[options] [filter]');
    // add cli options
    cli_options_1.default.forEach(({ long, short, arg, description, default: defaultValue, help, parse }) => 
    // handle 3rd/4th argument polymorphism
    commander_1.program.option(`${short ? `-${short}, ` : ''}--${long}${arg ? ` <${arg}>` : ''}`, 
    // point to help in description if extended help text is available
    `${description}${help ? ` Run "ncu --help --${long}" for details.` : ''}`, parse || defaultValue, parse ? defaultValue : undefined));
    // set version option at the end
    commander_1.program.version(package_json_1.default.version);
    // commander mutates its optionValues with program.parse
    // In order to call program.parse again and parse the rc file options, we need to clear commander's internal optionValues
    // Otherwise array options will be duplicated
    const initialOptionValues = (0, cloneDeep_1.default)(commander_1.program._optionValues);
    commander_1.program.parse(process.argv);
    let programOpts = commander_1.program.opts();
    const { color, configFileName, configFilePath, packageFile, mergeConfig } = programOpts;
    // Force color on all chalk instances.
    // See: /src/lib/chalk.ts
    await (0, chalk_1.chalkInit)(color);
    // load .ncurc
    // Do not load when global option is set
    // Do not load when tests are running (an be overridden if configFilePath is set explicitly, or --mergeConfig option specified)
    const rcResult = !programOpts.global && (!process.env.NCU_TESTS || configFilePath || mergeConfig)
        ? await (0, getNcuRc_1.default)({ configFileName, configFilePath, packageFile, color })
        : null;
    // insert config arguments into command line arguments so they can all be parsed by commander
    const combinedArguments = [...process.argv.slice(0, 2), ...((rcResult === null || rcResult === void 0 ? void 0 : rcResult.args) || []), ...process.argv.slice(2)];
    commander_1.program._optionValues = initialOptionValues;
    commander_1.program.parse(combinedArguments);
    programOpts = commander_1.program.opts();
    // filter out undefined program options and combine cli options with config file options
    const options = {
        ...(rcResult && Object.keys(rcResult.config).length > 0 ? { rcConfigPath: rcResult.filePath } : null),
        ...(0, pickBy_1.default)(commander_1.program.opts(), value => value !== undefined),
        args: commander_1.program.args,
        ...(programOpts.filter ? { filter: programOpts.filter } : null),
        ...(programOpts.reject ? { reject: programOpts.reject } : null),
    };
    // NOTE: Options handling and defaults go in initOptions in index.js
    (0, index_1.default)(options, { cli: true });
})();
//# sourceMappingURL=cli.js.map