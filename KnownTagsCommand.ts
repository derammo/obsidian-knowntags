import { ParsedCommand } from "./ParsedCommand";

const COMMAND_REGEX = /^\s*!known_tags(?:\s(.*)|$)/;

export class KnownTagsCommand extends ParsedCommand {
	get regex(): RegExp {
		return COMMAND_REGEX;
	}

	// this can be used to check if we even need to construct this object, when typically that is not the case
	static match(text: string): boolean {
		return text.match(COMMAND_REGEX) !== null;
	}
}
