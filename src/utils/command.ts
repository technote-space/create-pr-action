import fs from 'fs';
import { Logger, GitHelper, Utils } from '@technote-space/github-action-helper';
import { Context } from '@actions/github/lib/context';
import { replaceDirectory, isDisabledDeletePackage, filterGitStatus, filterExtension, getPrHeadRef } from './misc';

const {getWorkspace, getArrayInput, useNpm} = Utils;

const helper = new GitHelper(new Logger(replaceDirectory), {filter: (line: string): boolean => filterGitStatus(line) && filterExtension(line)});

export const clone = async(logger: Logger, context: Context): Promise<void> => {
	logger.startProcess('Cloning from the remote repo...');

	await helper.cloneBranch(getWorkspace(), getPrHeadRef(context), context);
};

const getClearPackageCommands = async(): Promise<string[]> => {
	if (isDisabledDeletePackage()) {
		return [];
	}
	return [
		'rm -f package.json',
		'rm -f package-lock.json',
		'rm -f yarn.lock',
	];
};

const getInstallPackagesCommands = async(workDir: string): Promise<string[]> => {
	const packages = getArrayInput('INSTALL_PACKAGES');
	if (packages.length) {
		if (useNpm(workDir)) {
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

const getExecuteCommands = async(): Promise<string[]> => getArrayInput('EXECUTE_COMMANDS');

export const getCommitCommands = async(): Promise<string[]> => (['git add --all']);

export const getDiff = async(logger: Logger): Promise<string[]> => {
	logger.startProcess('Checking diff...');

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
	logger.startProcess('Running commands and getting changed files');

	await initDirectory();
	await clone(logger, context);

	const commands: string[] = new Array<string>().concat.apply([], [
		await getClearPackageCommands(),
		await getInstallPackagesCommands(getWorkspace()),
		await getExecuteCommands(),
		await getCommitCommands(),
	]);

	return {
		files: await getDiff(logger),
		output: await helper.runCommand(getWorkspace(), commands),
	};
};
