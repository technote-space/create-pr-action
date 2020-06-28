import {resolve} from 'path';

export const ACTION_NAME         = 'Create PR Action';
export const ACTION_OWNER        = 'technote-space';
export const ACTION_REPO         = 'create-pr-action';
export const TARGET_NCU_COMMANDS = [
  'npx npm-check-updates ',
];
export const BIN_PATH            = resolve(__dirname, '../node_modules/.bin');
