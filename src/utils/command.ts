import fs from 'fs';
import { Logger, GitHelper, Utils } from '@technote-space/github-action-helper';
import { Context } from '@actions/github/lib/context';
import { getInput } from '@actions/core' ;
import { replaceDirectory, isDisabledDeletePackage, filterGitStatus, filterExtension, getPrHeadRef } from './misc';

const {getWorkspace, getArrayInput, useNpm} = Utils;

const helper = new GitHelper(new Logger(replaceDirectory), {filter: (line: string): boolean => filterGitStatus(line) && filterExtension(line)});

export const clone = async(logger: Logger, context: Context): Promise<void> => {
	logger.startProcess('Cloning from the remote repo...');

	await helper.cloneBranch(getWorkspace(), getPrHeadRef(context), context);
	await helper.runCommand(getWorkspace(), ['ls -la']);
};

export const checkBranch = async(logger: Logger, context: Context): Promise<void> => {
	const branchName   = getPrHeadRef(context);
	const clonedBranch = await helper.getCurrentBranchName(getWorkspace());
	if (branchName !== clonedBranch) {
		logger.info('remote branch [%s] not found.', branchName);
		logger.info('now branch: %s', clonedBranch);

		logger.startProcess('Initializing local git repo [%s]', branchName);
		await helper.gitInit(getWorkspace(), branchName);
	}
};

const getClearPackageCommands = (): string[] => {
	if (isDisabledDeletePackage()) {
		return [];
	}
	return [
		'rm -f package.json',
		'rm -f package-lock.json',
		'rm -f yarn.lock',
	];
};

const getGlobalInstallPackagesCommands = (workDir: string): string[] => {
	const packages = getArrayInput('GLOBAL_INSTALL_PACKAGES');
	if (packages.length) {
		if (useNpm(workDir, getInput('PACKAGE_MANAGER'))) {
			return [
				'sudo npm install -g ' + packages.join(' '),
			];
		} else {
			return [
				'sudo yarn global add ' + packages.join(' '),
			];
		}
	}
	return [];
};

const getInstallPackagesCommands = (workDir: string): string[] => {
	const packages = getArrayInput('INSTALL_PACKAGES');
	if (packages.length) {
		if (useNpm(workDir, getInput('PACKAGE_MANAGER'))) {
			return [
				'npm install --save ' + packages.join(' '),
			];
		} else {
			return [
				'yarn add ' + packages.join(' '),
			];
		}
	}
	return [];
};

const normalizeCommand = (command: string): string => command.trim().replace(/\s{2,}/g, ' ');

const getExecuteCommands = (): string[] => getArrayInput('EXECUTE_COMMANDS', true, '&&').map(normalizeCommand);

export const getDiff = async(logger: Logger): Promise<string[]> => {
	logger.startProcess('Checking diff...');
	await helper.runCommand(getWorkspace(), ['git add --all']);
	return await helper.getDiff(getWorkspace());
};

const initDirectory = async(): Promise<void> => {
	await helper.runCommand(getWorkspace(), ['rm -rdf ./*']);
	fs.mkdirSync(getWorkspace(), {recursive: true});
};

export const getChangedFiles = async(logger: Logger, context: Context): Promise<{
	files: string[];
	output: {
		command: string;
		stdout: string[];
	}[];
}> => {
	logger.startProcess('Running commands and getting changed files...');

	await initDirectory();
	await clone(logger, context);
	await checkBranch(logger, context);

	const commands: string[] = new Array<string>().concat.apply([], [
		getClearPackageCommands(),
		getGlobalInstallPackagesCommands(getWorkspace()),
		getInstallPackagesCommands(getWorkspace()),
		getExecuteCommands(),
	]);

	logger.startProcess('Running commands...');
	const output = await helper.runCommand(getWorkspace(), commands);
	const files  = await getDiff(logger);

	return {
		files,
		output,
	};
};
