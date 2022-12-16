import * as cliArgs from 'command-line-args';
import { API_URL_OPTION, PROFILE_OPTION } from "../generalCommand";

export function getGlobalApiUrl(): string | undefined {
	const options = cliArgs([API_URL_OPTION], { partial: true });
	return options[API_URL_OPTION.name];
}

export function getGlobalProfile(): string {
	const options = cliArgs([PROFILE_OPTION], { partial: true });
	return options[PROFILE_OPTION.name];
}
