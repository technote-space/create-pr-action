"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.patch = exports.minor = exports.newest = exports.latest = exports.distTag = exports.list = exports.getPeerDependencies = exports.greatest = exports.defaultPrefix = exports.viewOne = exports.viewManyMemoized = exports.viewMany = exports.packageAuthorChanged = void 0;
const fast_memoize_1 = __importDefault(require("fast-memoize"));
const fs_1 = __importDefault(require("fs"));
const ini_1 = __importDefault(require("ini"));
const camelCase_1 = __importDefault(require("lodash/camelCase"));
const filter_1 = __importDefault(require("lodash/filter"));
const get_1 = __importDefault(require("lodash/get"));
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const last_1 = __importDefault(require("lodash/last"));
const omit_1 = __importDefault(require("lodash/omit"));
const sortBy_1 = __importDefault(require("lodash/sortBy"));
const pacote_1 = __importDefault(require("pacote"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const spawn_please_1 = __importDefault(require("spawn-please"));
const untildify_1 = __importDefault(require("untildify"));
const filterObject_1 = __importDefault(require("../lib/filterObject"));
const keyValueBy_1 = require("../lib/keyValueBy");
const libnpmconfig_1 = __importDefault(require("../lib/libnpmconfig"));
const logging_1 = require("../lib/logging");
const versionUtil = __importStar(require("../lib/version-util"));
const filters_1 = require("./filters");
/** Normalizes the keys of an npm config for pacote. */
const normalizeNpmConfig = (npmConfig) => {
    const npmConfigToPacoteMap = {
        cafile: (path) => {
            // load-cafile, based on github.com/npm/cli/blob/40c1b0f/lib/config/load-cafile.js
            if (!path)
                return;
            // synchronous since it is loaded once on startup, and to avoid complexity in libnpmconfig.read
            // https://github.com/raineorshine/npm-check-updates/issues/636?notification_referrer_id=MDE4Ok5vdGlmaWNhdGlvblRocmVhZDc0Njk2NjAzMjo3NTAyNzY%3D
            const cadata = fs_1.default.readFileSync((0, untildify_1.default)(path), 'utf8');
            const delim = '-----END CERTIFICATE-----';
            const output = cadata
                .split(delim)
                .filter(xs => !!xs.trim())
                .map(xs => `${xs.trimStart()}${delim}`);
            return { ca: output };
        },
        maxsockets: 'maxSockets',
        'strict-ssl': 'strictSSL',
    };
    // all config variables are read in as strings, so we need to type coerce non-strings
    // lowercased and hyphens removed for comparison purposes
    const keyTypes = {
        all: 'boolean',
        allowsameversion: 'boolean',
        audit: 'boolean',
        binlinks: 'boolean',
        color: 'boolean',
        commithooks: 'boolean',
        description: 'boolean',
        dev: 'boolean',
        diffignoreallspace: 'boolean',
        diffnameonly: 'boolean',
        diffnoprefix: 'boolean',
        difftext: 'boolean',
        dryrun: 'boolean',
        enginestrict: 'boolean',
        force: 'boolean',
        foregroundscripts: 'boolean',
        formatpackagelock: 'boolean',
        fund: 'boolean',
        gittagversion: 'boolean',
        global: 'boolean',
        globalstyle: 'boolean',
        ifpresent: 'boolean',
        ignorescripts: 'boolean',
        includestaged: 'boolean',
        includeworkspaceroot: 'boolean',
        installlinks: 'boolean',
        json: 'boolean',
        legacybundling: 'boolean',
        legacypeerdeps: 'boolean',
        link: 'boolean',
        long: 'boolean',
        offline: 'boolean',
        omitlockfileregistryresolved: 'boolean',
        packagelock: 'boolean',
        packagelockonly: 'boolean',
        parseable: 'boolean',
        preferoffline: 'boolean',
        preferonline: 'boolean',
        progress: 'boolean',
        readonly: 'boolean',
        rebuildbundle: 'boolean',
        save: 'boolean',
        savebundle: 'boolean',
        savedev: 'boolean',
        saveexact: 'boolean',
        saveoptional: 'boolean',
        savepeer: 'boolean',
        saveprod: 'boolean',
        shrinkwrap: 'boolean',
        signgitcommit: 'boolean',
        signgittag: 'boolean',
        strictpeerdeps: 'boolean',
        strictssl: 'boolean',
        timing: 'boolean',
        unicode: 'boolean',
        updatenotifier: 'boolean',
        usage: 'boolean',
        version: 'boolean',
        versions: 'boolean',
        workspacesupdate: 'boolean',
        diffunified: 'number',
        fetchretries: 'number',
        fetchretryfactor: 'number',
        fetchretrymaxtimeout: 'number',
        fetchretrymintimeout: 'number',
        fetchtimeout: 'number',
        logsmax: 'number',
        maxsockets: 'number',
        searchlimit: 'number',
        searchstaleness: 'number',
        ssopollfrequency: 'number',
    };
    /** Parses a string to a boolean. */
    const stringToBoolean = (s) => !!s && s !== 'false' && s !== '0';
    /** Parses a string to a number. */
    const stringToNumber = (s) => parseInt(s) || 0;
    // needed until pacote supports full npm config compatibility
    // See: https://github.com/zkat/pacote/issues/156
    const config = (0, keyValueBy_1.keyValueBy)(npmConfig, (key, value) => {
        // replace env ${VARS} in strings with the process.env value
        const normalizedValue = typeof value !== 'string'
            ? value
            : // parse stringified booleans
                keyTypes[key.replace(/-/g, '').toLowerCase()] === 'boolean'
                    ? stringToBoolean(value)
                    : keyTypes[key.replace(/-/g, '').toLowerCase()] === 'number'
                        ? stringToNumber(value)
                        : value.replace(/\${([^}]+)}/, (_, envVar) => process.env[envVar]);
        // normalize the key for pacote
        const { [key]: pacoteKey } = npmConfigToPacoteMap;
        return typeof pacoteKey === 'string'
            ? // key is mapped to a string
                { [pacoteKey]: normalizedValue }
            : // key is mapped to a function
                typeof pacoteKey === 'function'
                    ? { ...pacoteKey(normalizedValue.toString()) }
                    : // otherwise assign the camel-cased key
                        { [key.match(/^[a-z]/i) ? (0, camelCase_1.default)(key) : key]: normalizedValue };
    });
    return config;
};
/** Finds and parses the npm config at the given path. If the path does not exist, returns null. If no path is provided, finds and merges the global and user npm configs using libnpmconfig and sets cache: false. */
const findNpmConfig = (path) => {
    let config;
    if (path) {
        try {
            config = ini_1.default.parse(fs_1.default.readFileSync(path, 'utf-8'));
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return null;
            }
            else {
                throw err;
            }
        }
    }
    else {
        // libnpmconfig incorrectly (?) ignores NPM_CONFIG_USERCONFIG because it is always overridden by the default builtin.userconfig
        // set userconfig manually so that it is prioritized
        const opts = libnpmconfig_1.default.read(null, {
            userconfig: process.env.npm_config_userconfig || process.env.NPM_CONFIG_USERCONFIG,
        });
        config = {
            ...opts.toJSON(),
            cache: false,
        };
    }
    return normalizeNpmConfig(config);
};
// get the base config that is used for all npm queries
// this may be partially overwritten by .npmrc config files when using --deep
const npmConfig = findNpmConfig();
/** A promise that returns true if --global is deprecated on the system npm. Spawns "npm --version". */
const isGlobalDeprecated = new Promise((resolve, reject) => {
    const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    return (0, spawn_please_1.default)(cmd, ['--version'])
        .then((output) => {
        const npmVersion = output.trim();
        // --global was deprecated in npm v8.11.0.
        resolve(semver_1.default.valid(npmVersion) && semver_1.default.gte(npmVersion, '8.11.0'));
    })
        .catch(reject);
});
/**
 * @typedef {object} CommandAndPackageName
 * @property {string} command
 * @property {string} packageName
 */
/**
 * Parse JSON and throw an informative error on failure.
 *
 * @param result Data to be parsed
 * @param data
 * @returns
 */
function parseJson(result, data) {
    let json;
    // use a try-catch instead of .catch to avoid re-catching upstream errors
    try {
        json = JSON.parse(result);
    }
    catch (err) {
        throw new Error(`Expected JSON from "${data.command}". This could be due to npm instability${data.packageName ? ` or problems with the ${data.packageName} package` : ''}.\n\n${result}`);
    }
    return json;
}
/**
 * Check if package author changed between current and upgraded version.
 *
 * @param packageName Name of the package
 * @param currentVersion Current version declaration (may be range)
 * @param upgradedVersion Upgraded version declaration (may be range)
 * @param npmConfigLocal Additional npm config variables that are merged into the system npm config
 * @returns A promise that fullfills with boolean value.
 */
async function packageAuthorChanged(packageName, currentVersion, upgradedVersion, options = {}, npmConfigLocal) {
    var _a, _b;
    const result = await pacote_1.default.packument(packageName, {
        ...npmConfigLocal,
        ...npmConfig,
        fullMetadata: true,
        ...(options.registry ? { registry: options.registry, silent: true } : null),
    });
    if (result.versions) {
        const pkgVersions = Object.keys(result.versions);
        const current = semver_1.default.minSatisfying(pkgVersions, currentVersion);
        const upgraded = semver_1.default.maxSatisfying(pkgVersions, upgradedVersion);
        if (current && upgraded && result.versions[current]._npmUser && result.versions[upgraded]._npmUser) {
            const currentAuthor = (_a = result.versions[current]._npmUser) === null || _a === void 0 ? void 0 : _a.name;
            const latestAuthor = (_b = result.versions[upgraded]._npmUser) === null || _b === void 0 ? void 0 : _b.name;
            return !(0, isEqual_1.default)(currentAuthor, latestAuthor);
        }
    }
    return false;
}
exports.packageAuthorChanged = packageAuthorChanged;
/**
 * Returns an object of specified values retrieved by npm view.
 *
 * @param packageName   Name of the package
 * @param fields        Array of fields like versions, time, version
 * @param               currentVersion
 * @returns             Promised result
 */
async function viewMany(packageName, fields, currentVersion, options, retried = 0, npmConfigLocal) {
    if (currentVersion && (!semver_1.default.validRange(currentVersion) || versionUtil.isWildCard(currentVersion))) {
        return Promise.resolve({});
    }
    // merge project npm config with base config
    const npmConfigProjectPath = options.packageFile ? path_1.default.join(options.packageFile, '../.npmrc') : null;
    const npmConfigProject = options.packageFile ? findNpmConfig(npmConfigProjectPath) : null;
    const npmConfigCWDPath = options.cwd ? path_1.default.join(options.cwd, '.npmrc') : null;
    const npmConfigCWD = options.cwd ? findNpmConfig(npmConfigCWDPath) : null;
    if (npmConfigProject) {
        (0, logging_1.print)(options, `\nUsing npm config in project directory: ${npmConfigProjectPath}:`, 'verbose');
        (0, logging_1.print)(options, (0, omit_1.default)(npmConfigProject, 'cache'), 'verbose');
    }
    if (npmConfigCWD) {
        (0, logging_1.print)(options, `\nUsing npm config in current working directory: ${npmConfigCWDPath}:`, 'verbose');
        // omit cache since it is added to every config
        (0, logging_1.print)(options, (0, omit_1.default)(npmConfigCWD, 'cache'), 'verbose');
    }
    const npmOptions = {
        ...npmConfig,
        ...npmConfigLocal,
        ...npmConfigProject,
        ...npmConfigCWD,
        ...(options.registry ? { registry: options.registry, silent: true } : null),
        ...(options.timeout ? { timeout: options.timeout } : null),
        fullMetadata: fields.includes('time'),
    };
    let result;
    try {
        result = await pacote_1.default.packument(packageName, npmOptions);
    }
    catch (err) {
        if (options.retry && ++retried <= options.retry) {
            const packument = await viewMany(packageName, fields, currentVersion, options, retried, npmConfigLocal);
            return packument;
        }
        throw err;
    }
    return fields.reduce((accum, field) => ({
        ...accum,
        [field]: field.startsWith('dist-tags.') && result.versions
            ? result.versions[(0, get_1.default)(result, field)]
            : result[field],
    }), {});
}
exports.viewMany = viewMany;
/** Memoize viewMany for --deep performance. */
exports.viewManyMemoized = (0, fast_memoize_1.default)(viewMany);
/**
 * Returns the value of one of the properties retrieved by npm view.
 *
 * @param packageName   Name of the package
 * @param field         Field such as "versions" or "dist-tags.latest" are parsed from the pacote result (https://www.npmjs.com/package/pacote#packument)
 * @param currentVersion
 * @returns            Promised result
 */
async function viewOne(packageName, field, currentVersion, options, npmConfigLocal) {
    const result = await (0, exports.viewManyMemoized)(packageName, [field], currentVersion, options, 0, npmConfigLocal);
    return result && result[field];
}
exports.viewOne = viewOne;
/**
 * Spawns npm. Handles different commands for Window and Linux/OSX, and automatically converts --location=global to --global on node < 8.11.0.
 *
 * @param args
 * @param [npmOptions={}]
 * @param [spawnOptions={}]
 * @returns
 */
async function spawnNpm(args, npmOptions = {}, spawnOptions = {}) {
    const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    args = Array.isArray(args) ? args : [args];
    const fullArgs = args.concat(npmOptions.location
        ? (await isGlobalDeprecated)
            ? `--location=${npmOptions.location}`
            : npmOptions.location === 'global'
                ? '--global'
                : ''
        : [], npmOptions.prefix ? `--prefix=${npmOptions.prefix}` : [], '--depth=0', '--json');
    return (0, spawn_please_1.default)(cmd, fullArgs, spawnOptions);
}
/**
 * Get platform-specific default prefix to pass on to npm.
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
    const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    let prefix;
    // catch spawn error which can occur on Windows
    // https://github.com/raineorshine/npm-check-updates/issues/703
    try {
        prefix = await (0, spawn_please_1.default)(cmd, ['config', 'get', 'prefix']);
    }
    catch (e) {
        const message = (e.message || e || '').toString();
        (0, logging_1.print)(options, 'Error executing `npm config get prefix`. Caught and ignored. Unsolved: https://github.com/raineorshine/npm-check-updates/issues/703. ERROR: ' +
            message, 'verbose', 'error');
    }
    // FIX: for ncu -g doesn't work on homebrew or windows #146
    // https://github.com/raineorshine/npm-check-updates/issues/146
    return options.global && (prefix === null || prefix === void 0 ? void 0 : prefix.match('Cellar'))
        ? '/usr/local'
        : // Workaround: get prefix on windows for global packages
            // Only needed when using npm api directly
            process.platform === 'win32' && options.global && !process.env.prefix
                ? prefix
                    ? prefix.trim()
                    : `${process.env.AppData}\\npm`
                : undefined;
}
exports.defaultPrefix = defaultPrefix;
/**
 * Fetches the highest version number, regardless of tag or publish time.
 *
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
const greatest = async (packageName, currentVersion, options = {}, npmConfig) => {
    // known type based on 'versions'
    const versions = (await viewOne(packageName, 'versions', currentVersion, options, npmConfig));
    return ((0, last_1.default)(
    // eslint-disable-next-line fp/no-mutating-methods
    (0, filter_1.default)(versions, (0, filters_1.filterPredicate)(options))
        .map(o => o.version)
        .sort(versionUtil.compareVersions)) || null);
};
exports.greatest = greatest;
/**
 * Fetches the list of peer dependencies for a specific package version.
 *
 * @param packageName
 * @param version
 * @returns Promised {packageName: version} collection
 */
const getPeerDependencies = async (packageName, version) => {
    // if version number uses >, omit the version and find latest
    // otherwise, it will error out in the shell
    // https://github.com/raineorshine/npm-check-updates/issues/1181
    const atVersion = !version.startsWith('>') ? `@${version}` : '';
    const npmArgs = ['view', `${packageName}${atVersion}`, 'peerDependencies'];
    const result = await spawnNpm(npmArgs, {}, { rejectOnError: false });
    return result ? parseJson(result, { command: `${npmArgs.join(' ')} --json` }) : {};
};
exports.getPeerDependencies = getPeerDependencies;
/**
 * Fetches the list of all installed packages.
 *
 * @param [options]
 * @param [options.cwd]
 * @param [options.global]
 * @param [options.prefix]
 * @returns
 */
const list = async (options = {}) => {
    const result = await spawnNpm('ls', {
        // spawnNpm takes the modern --location option and converts it to --global on older versions of npm
        ...(options.global ? { location: 'global' } : null),
        ...(options.prefix ? { prefix: options.prefix } : null),
    }, {
        ...(options.cwd ? { cwd: options.cwd } : null),
        rejectOnError: false,
    });
    const json = parseJson(result, {
        command: `npm${process.platform === 'win32' ? '.cmd' : ''} ls --json${options.global ? ' --location=global' : ''}`,
    });
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
 * Fetches the version of a package published to options.distTag.
 *
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
const distTag = async (packageName, currentVersion, options = {}, npmConfig) => {
    const revision = (await viewOne(packageName, `dist-tags.${options.distTag}`, currentVersion, options, npmConfig)); // known type based on dist-tags.latest
    // latest should not be deprecated
    // if latest exists and latest is not a prerelease version, return it
    // if latest exists and latest is a prerelease version and --pre is specified, return it
    // if latest exists and latest not satisfies min version of engines.node
    if (revision && (0, filters_1.filterPredicate)(options)(revision))
        return revision.version;
    // If we use a custom dist-tag, we do not want to get other 'pre' versions, just the ones from this dist-tag
    if (options.distTag && options.distTag !== 'latest')
        return null;
    // if latest is a prerelease version and --pre is not specified
    // or latest is deprecated
    // find the next valid version
    // known type based on dist-tags.latest
    return (0, exports.greatest)(packageName, currentVersion, options, npmConfig);
};
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
const newest = async (packageName, currentVersion, options = {}, npmConfig) => {
    const result = await (0, exports.viewManyMemoized)(packageName, ['time', 'versions'], currentVersion, options, 0, npmConfig);
    // Generate a map of versions that satisfy the node engine.
    // result.versions is an object but is parsed as an array, so manually convert it to an object.
    // Otherwise keyValueBy will pass the predicate arguments in the wrong order.
    const versionsSatisfyingNodeEngine = (0, keyValueBy_1.keyValueBy)(Object.values(result.versions || {}), packument => (0, filters_1.satisfiesNodeEngine)(packument, options.nodeEngineVersion) ? { [packument.version]: true } : null);
    // filter out times that do not satisfy the node engine
    // filter out prereleases if pre:false (same as allowPreOrIsNotPre)
    const timesSatisfyingNodeEngine = (0, filterObject_1.default)(result.time || {}, version => versionsSatisfyingNodeEngine[version] && (options.pre !== false || !versionUtil.isPre(version)));
    // sort by timestamp (entry[1]) and map versions
    const versionsSortedByTime = (0, sortBy_1.default)(Object.entries(timesSatisfyingNodeEngine), 1).map(([version]) => version);
    return (0, last_1.default)(versionsSortedByTime) || null;
};
exports.newest = newest;
/**
 * Fetches the highest version with the same major version as currentVersion.
 *
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
const minor = async (packageName, currentVersion, options = {}, npmConfig) => {
    const versions = (await viewOne(packageName, 'versions', currentVersion, options, npmConfig));
    return versionUtil.findGreatestByLevel((0, filter_1.default)(versions, (0, filters_1.filterPredicate)(options)).map(o => o.version), currentVersion, 'minor');
};
exports.minor = minor;
/**
 * Fetches the highest version with the same minor and major version as currentVersion.
 *
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
const patch = async (packageName, currentVersion, options = {}, npmConfig) => {
    const versions = (await viewOne(packageName, 'versions', currentVersion, options, npmConfig));
    return versionUtil.findGreatestByLevel((0, filter_1.default)(versions, (0, filters_1.filterPredicate)(options)).map(o => o.version), currentVersion, 'patch');
};
exports.patch = patch;
exports.default = spawnNpm;
//# sourceMappingURL=npm.js.map