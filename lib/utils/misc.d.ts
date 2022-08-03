import type { Context } from '@actions/github/lib/context';
import type { MainArguments } from '@technote-space/github-action-pr-helper/dist/types';
export declare const replaceNcuCommands: (commands: Array<string>) => Array<string>;
export declare const getOnlyDefaultBranchFlag: (context: Context) => boolean;
export declare const getRunnerArguments: (context: Context) => MainArguments;
