"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.patch = exports.minor = exports.newest = exports.latest = exports.distTag = exports.greatest = exports.list = exports.defaultPrefix = exports.getPathToLookForYarnrc = exports.npmAuthTokenKeyValue = void 0;
// eslint-disable-next-line fp/no-events
const events_1 = require("events");
const fast_memoize_1 = __importDefault(require("fast-memoize"));
const promises_1 = __importDefault(require("fs/promises"));
const jsonlines_1 = __importDefault(require("jsonlines"));
const curry_1 = __importDefault(require("lodash/curry"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const spawn_please_1 = __importDefault(require("spawn-please"));
const yaml_1 = __importDefault(require("yaml"));
const exists_1 = __importDefault(require("../lib/exists"));
const findLockfile_1 = __importDefault(require("../lib/findLockfile"));
const keyValueBy_1 = require("../lib/keyValueBy");
const logging_1 = require("../lib/logging");
const npm_1 = require("./npm");
/** Safely interpolates a string as a template string. */
const interpolate = (s, data) => s.replace(/\$\{([^:-]+)(?:(:)?-([^}]*))?\}/g, (match, key, name, fallbackOnEmpty, fallback) => data[key] || (fallbackOnEmpty ? fallback : ''));
/** Reads an auth token from a yarn config, interpolates it, and returns it as an npm config key-value pair. */
exports.npmAuthTokenKeyValue = (0, curry_1.default)((npmConfig, dep, scopedConfig) => {
    if (scopedConfig.npmAuthToken) {
        // get registry server from this config or a previous config (assumes setNpmRegistry has already been called on all npm scopes)
        const registryServer = scopedConfig.npmRegistryServer || npmConfig[`@${dep}:registry`];
        // interpolate environment variable fallback
        // https://yarnpkg.com/configuration/yarnrc
        if (registryServer) {
            let trimmedRegistryServer = registryServer.replace(/^https?:/, '');
            if (trimmedRegistryServer.endsWith('/')) {
                trimmedRegistryServer = trimmedRegistryServer.slice(0, -1);
            }
            return {
                [`${trimmedRegistryServer}/:_authToken`]: interpolate(scopedConfig.npmAuthToken, process.env),
            };
        }
    }
    return null;
});
/** Reads a registry from a yarn config. interpolates it, and returns it as an npm config key-value pair. */
const npmRegistryKeyValue = (dep, scopedConfig) => scopedConfig.npmRegistryServer
    ? { [`@${dep}:registry`]: interpolate(scopedConfig.npmRegistryServer, process.env) }
    : null;
/**
 * Returns the path to the local .yarnrc.yml, or undefined. This doesn't
 * actually check that the .yarnrc.yml file exists.
 *
 * Exported for test purposes only.
 *
 * @param readdirSync This is only a parameter so that it can be used in tests.
 */
async function getPathToLookForYarnrc(options, readdir = promises_1.default.readdir) {
    var _a;
    if (options.global)
        return undefined;
    const directoryPath = (_a = (await (0, findLockfile_1.default)(options, readdir))) === null || _a === void 0 ? void 0 : _a.directoryPath;
    if (!directoryPath)
        return undefined;
    return path_1.default.join(directoryPath, '.yarnrc.yml');
}
exports.getPathToLookForYarnrc = getPathToLookForYarnrc;
// If private registry auth is specified in npmScopes in .yarnrc.yml, read them in and convert them to npm config variables.
// Define as a memoized function to efficiently call existsSync and readFileSync only once, and only if yarn is being used.
// https://github.com/raineorshine/npm-check-updates/issues/1036
const npmConfigFromYarn = (0, fast_memoize_1.default)(async (options) => {
    const yarnrcLocalPath = await getPathToLookForYarnrc(options);
    const yarnrcUserPath = path_1.default.join(os_1.default.homedir(), '.yarnrc.yml');
    const yarnrcLocalExists = typeof yarnrcLocalPath === 'string' && (await (0, exists_1.default)(yarnrcLocalPath));
    const yarnrcUserExists = await (0, exists_1.default)(yarnrcUserPath);
    const yarnrcLocal = yarnrcLocalExists ? await promises_1.default.readFile(yarnrcLocalPath, 'utf-8') : '';
    const yarnrcUser = yarnrcUserExists ? await promises_1.default.readFile(yarnrcUserPath, 'utf-8') : '';
    const yarnConfigLocal = yaml_1.default.parse(yarnrcLocal);
    const yarnConfigUser = yaml_1.default.parse(yarnrcUser);
    let npmConfig = {
        ...(0, keyValueBy_1.keyValueBy)((yarnConfigUser === null || yarnConfigUser === void 0 ? void 0 : yarnConfigUser.npmScopes) || {}, npmRegistryKeyValue),
        ...(0, keyValueBy_1.keyValueBy)((yarnConfigLocal === null || yarnConfigLocal === void 0 ? void 0 : yarnConfigLocal.npmScopes) || {}, npmRegistryKeyValue),
    };
    // npmAuthTokenKeyValue uses scoped npmRegistryServer, so must come after npmRegistryKeyValue
    npmConfig = {
        ...npmConfig,
        ...(0, keyValueBy_1.keyValueBy)((yarnConfigUser === null || yarnConfigUser === void 0 ? void 0 : yarnConfigUser.npmScopes) || {}, (0, exports.npmAuthTokenKeyValue)(npmConfig)),
        ...(0, keyValueBy_1.keyValueBy)((yarnConfigLocal === null || yarnConfigLocal === void 0 ? void 0 : yarnConfigLocal.npmScopes) || {}, (0, exports.npmAuthTokenKeyValue)(npmConfig)),
    };
    // set auth token after npm registry, since auth token syntax uses regitry
    if (yarnrcLocalExists) {
        (0, logging_1.print)(options, `\nUsing local yarn config at ${yarnrcLocalPath}:`, 'verbose');
        (0, logging_1.print)(options, yarnConfigLocal, 'verbose');
    }
    if (yarnrcUserExists) {
        (0, logging_1.print)(options, `\nUsing user yarn config at ${yarnrcUserPath}:`, 'verbose');
        (0, logging_1.print)(options, yarnConfigLocal, 'verbose');
    }
    if (Object.keys(npmConfig)) {
        (0, logging_1.print)(options, '\nMerged yarn config in npm format:', 'verbose');
        (0, logging_1.print)(options, npmConfig, 'verbose');
    }
    return npmConfig;
});
/**
 * Parse JSON lines and throw an informative error on failure.
 *
 * @param result    Output from `yarn list --json` to be parsed
 */
async function parseJsonLines(result) {
    const dependencies = {};
    const parser = jsonlines_1.default.parse();
    parser.on('data', d => {
        // only parse info data
        // ignore error info, e.g. "Visit https://yarnpkg.com/en/docs/cli/list for documentation about this command."
        if (d.type === 'info' && !d.data.match(/^Visit/)) {
            // parse package name and version number from info data, e.g. "nodemon@2.0.4" has binaries
            const [, pkgName, pkgVersion] = d.data.match(/"(@?.*)@(.*)"/) || [];
            dependencies[pkgName] = {
                version: pkgVersion,
                from: pkgName,
            };
        }
        else if (d.type === 'error') {
            throw new Error(d.data);
        }
    });
    parser.write(result);
    parser.end();
    await (0, events_1.once)(parser, 'end');
    return { dependencies };
}
/**
 * Spawn yarn requires a different command on Windows.
 *
 * @param args
 * @param [yarnOptions={}]
 * @param [spawnOptions={}]
 * @returns
 */
async function spawnYarn(args, yarnOptions = {}, spawnOptions) {
    const cmd = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
    const fullArgs = [
        ...(yarnOptions.location === 'global' ? 'global' : []),
        ...(Array.isArray(args) ? args : [args]),
        '--depth=0',
        ...(yarnOptions.prefix ? `--prefix=${yarnOptions.prefix}` : []),
        '--json',
        '--no-progress',
    ];
    return (0, spawn_please_1.default)(cmd, fullArgs, spawnOptions);
}
/**
 * Get platform-specific default prefix to pass on to yarn.
 *
 * @param options
 * @param [options.global]
 * @param [options.prefix]
 * @returns
 */
async function defaultPrefix(options) {
    if (options.prefix) {
        return Promise.resolve(options.prefix);
    }
    const cmd = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
    const prefix = await (0, spawn_please_1.default)(cmd, ['global', 'dir'])
        // yarn 2.0 does not support yarn global
        // catch error to prevent process from crashing
        // https://github.com/raineorshine/npm-check-updates/issues/873
        .catch(() => {
        /* empty */
    });
    // FIX: for ncu -g doesn't work on homebrew or windows #146
    // https://github.com/raineorshine/npm-check-updates/issues/146
    return options.global && prefix && prefix.match('Cellar')
        ? '/usr/local'
        : // Workaround: get prefix on windows for global packages
            // Only needed when using npm api directly
            process.platform === 'win32' && options.global && !process.env.prefix
                ? prefix
                    ? prefix.trim()
                    : `${process.env.LOCALAPPDATA}\\Yarn\\Data\\global`
                : null;
}
exports.defaultPrefix = defaultPrefix;
/**
 * Fetches the list of all installed packages.
 *
 * @param [options]
 * @param [options.cwd]
 * @param [options.global]
 * @param [options.prefix]
 * @returns
 */
const list = async (options = {}, spawnOptions) => {
    const jsonLines = await spawnYarn('list', options, {
        ...(options.cwd ? { cwd: options.cwd } : {}),
        ...spawnOptions,
    });
    const json = await parseJsonLines(jsonLines);
    return (0, keyValueBy_1.keyValueBy)(json.dependencies, (name, info) => {
        var _a;
        return ({
            // unmet peer dependencies have a different structure
            [name]: info.version || ((_a = info.required) === null || _a === void 0 ? void 0 : _a.version),
        });
    });
};
exports.list = list;
/**
 * Fetches the highest version number, regardless of tag or publish time.
 *
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
const greatest = async (packageName, currentVersion, options = {}) => (0, npm_1.greatest)(packageName, currentVersion, options, await npmConfigFromYarn(options));
exports.greatest = greatest;
/**
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
const distTag = async (packageName, currentVersion, options = {}) => (0, npm_1.distTag)(packageName, currentVersion, options, await npmConfigFromYarn(options));
exports.distTag = distTag;
/**
 * Fetches the version published to the latest tag.
 *
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
const latest = async (packageName, currentVersion, options = {}) => (0, exports.distTag)(packageName, currentVersion, { ...options, distTag: 'latest' });
exports.latest = latest;
/**
 * Fetches the most recently published version, regardless of version number.
 *
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
const newest = async (packageName, currentVersion, options = {}) => (0, npm_1.newest)(packageName, currentVersion, options, await npmConfigFromYarn(options));
exports.newest = newest;
/**
 * Fetches the highest version with the same major version as currentVersion.
 *
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
const minor = async (packageName, currentVersion, options = {}) => (0, npm_1.minor)(packageName, currentVersion, options, await npmConfigFromYarn(options));
exports.minor = minor;
/**
 * Fetches the highest version with the same minor and major version as currentVersion.
 *
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
const patch = async (packageName, currentVersion, options = {}) => (0, npm_1.patch)(packageName, currentVersion, options, await npmConfigFromYarn(options));
exports.patch = patch;
exports.default = spawnYarn;
//# sourceMappingURL=yarn.js.map