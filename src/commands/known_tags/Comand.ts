import { ParsedCommandWithSettings, Decoration, SyntaxNode } from "src/derobst/ParsedCommandWithSettings";
import { CommandContext } from "src/main/Plugin";

import { ComboBoxWidget } from "./ComboBoxWidget";
import { EditWidget } from "./EditWidget";
import { RadioGroupWidget } from './RadioGroupWidget';

const COMMAND_REGEX = /^\s*!known[_-]tags(?:\s(.*)|$)/;

export class Command extends ParsedCommandWithSettings {
	get regex(): RegExp {
		return COMMAND_REGEX;
	}

	// this can be used to check if we even need to construct this object, when typically that is not the case
	static match(text: string): boolean {
		return text.match(COMMAND_REGEX) !== null;
	}

	buildWidget(context: CommandContext, tagTextNode: SyntaxNode) {
		const builder = context.builder;
		const plugin = context.plugin;

		if (this.settings.combo) {
			const combo = new ComboBoxWidget(plugin, tagTextNode, this);
			builder.add(this.commandNode.from - 1, this.commandNode.from - 1, Decoration.widget({ widget: combo }));
		} else {
			const radio = new RadioGroupWidget(plugin, tagTextNode, this);
			builder.add(this.commandNode.from - 1, this.commandNode.from - 1, Decoration.widget({ widget: radio }));

			if (!this.settings.noedit) {
				const text = new EditWidget(plugin, tagTextNode, this);
				builder.add(this.commandNode.from - 1, this.commandNode.from - 1, Decoration.widget({ widget: text }));
			}
		}
		context.markWithBehaviorClasses(this);
	}
}
