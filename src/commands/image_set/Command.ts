import { Decoration, SyntaxNode } from "src/derobst/ParsedCommand";
import { ParsedCommand } from "src/derobst/ParsedCommand";

import { CommandContext } from "src/main/Plugin";
import { ButtonWidget } from "./ButtonWidget";

const COMMAND_REGEX = /^\s*!image-set(?:\s(.*)|$)/;

export class Command extends ParsedCommand {
	get regex(): RegExp {
		return COMMAND_REGEX;
	}

	static match(text: string): boolean {
		return text.match(COMMAND_REGEX) !== null;
	}

	buildWidget(context: CommandContext): void {
		const text = new ButtonWidget(context.plugin, this);
		context.builder.add(this.commandNode.from-1, this.commandNode.from-1, Decoration.widget({ widget: text }));
		context.markBasedOnDefaults(this);
	}
}


