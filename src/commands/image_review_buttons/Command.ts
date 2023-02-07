import { Decoration, ParsedCommand, SyntaxNode, } from "src/derobst/ParsedCommand";

import { CommandContext } from "src/main/Plugin";
import { ButtonWidget } from "./ButtonWidget";
import { ParsedCommandWithSettings } from "src/derobst/ParsedCommandWithSettings";

const COMMAND_REGEX = /^\s*!(?:image-review-buttons|irb)(?:\s(.*)|$)/;

export class Command extends ParsedCommandWithSettings {
	get regex(): RegExp {
		return COMMAND_REGEX;
	}

	static match(text: string): boolean {
		return text.match(COMMAND_REGEX) !== null;
	}

	buildWidget(context: CommandContext): void {
		const text = new ButtonWidget(context.plugin, this);
		context.builder.add(this.commandNode.from-1, this.commandNode.from-1, Decoration.widget({ widget: text }));
		context.markWithBehaviorClasses(this);
	}
}


