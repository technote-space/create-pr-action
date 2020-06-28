import {Context} from '@actions/github/lib/context';
import {run} from '@technote-space/github-action-pr-helper';
import {getRunnerArguments} from './utils/misc';

run(getRunnerArguments(new Context()));
