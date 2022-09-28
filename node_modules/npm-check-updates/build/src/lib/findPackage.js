"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const find_up_1 = __importDefault(require("find-up"));
const promises_1 = __importDefault(require("fs/promises"));
const get_stdin_1 = __importDefault(require("get-stdin"));
const path_1 = __importDefault(require("path"));
const logging_1 = require("../lib/logging");
const chalk_1 = __importDefault(require("./chalk"));
const getPackageFileName_1 = __importDefault(require("./getPackageFileName"));
const programError_1 = __importDefault(require("./programError"));
/**
 * Finds the package file and data.
 *
 * Searches as follows:
 * --packageData flag
 * --packageFile flag
 * --stdin
 * --findUp
 *
 * @returns Promise<PkgInfo>
 */
async function findPackage(options) {
    let pkgData;
    let pkgFile = null;
    (0, logging_1.print)(options, 'Running in local mode', 'verbose');
    (0, logging_1.print)(options, 'Finding package file data', 'verbose');
    const defaultPackageFilename = (0, getPackageFileName_1.default)(options);
    /** Reads the contents of a package file. */
    function getPackageDataFromFile(pkgFile, pkgFileName) {
        // exit if no pkgFile to read from fs
        if (pkgFile != null) {
            const relPathToPackage = path_1.default.resolve(pkgFile);
            (0, logging_1.print)(options, `${options.upgrade ? 'Upgrading' : 'Checking'} ${relPathToPackage}`);
        }
        else {
            (0, programError_1.default)(options, `${chalk_1.default.red(`No ${pkgFileName}`)}\n\nPlease add a ${pkgFileName} to the current directory, specify the ${chalk_1.default.cyan('--packageFile')} or ${chalk_1.default.cyan('--packageData')} options, or pipe a ${pkgFileName} to stdin.`);
        }
        return promises_1.default.readFile(pkgFile, 'utf-8');
    }
    // get the package data from the various input possibilities
    if (options.packageData) {
        pkgFile = null;
        pkgData = Promise.resolve(options.packageData);
    }
    else if (options.packageFile) {
        pkgFile = options.packageFile;
        pkgData = getPackageDataFromFile(pkgFile, defaultPackageFilename);
    }
    else if (options.stdin) {
        (0, logging_1.print)(options, 'Waiting for package data on stdin', 'verbose');
        // get data from stdin
        // trim stdin to account for \r\n
        const stdinData = await (0, get_stdin_1.default)();
        const data = stdinData.trim().length > 0 ? stdinData : null;
        // if no stdin content fall back to searching for package.json from pwd and up to root
        pkgFile = data || !defaultPackageFilename ? null : find_up_1.default.sync(defaultPackageFilename);
        pkgData = data || getPackageDataFromFile(await pkgFile, defaultPackageFilename);
    }
    else {
        // find the closest package starting from the current working directory and going up to the root
        pkgFile = defaultPackageFilename ? find_up_1.default.sync(defaultPackageFilename) : null;
        pkgData = getPackageDataFromFile(pkgFile, defaultPackageFilename);
    }
    return Promise.all([pkgData, pkgFile]);
}
exports.default = findPackage;
//# sourceMappingURL=findPackage.js.map