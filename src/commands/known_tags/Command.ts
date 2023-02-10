import { Decoration, ParsedCommandWithParameters, SyntaxNode, SyntaxNodeRef } from "derobst/command";
import { ViewPluginContext } from "derobst/view";
import { Host } from "main/Plugin";
import { WidgetFormatter } from "main/WidgetFormatter";
import { ComboBoxWidget } from "./ComboBoxWidget";
import { EditWidget } from "./EditWidget";
import { RadioGroupWidget } from './RadioGroupWidget';

const COMMAND_REGEX = /^\s*!known[_-]tags(?:\s(.*)|$)/;

export class Command extends ParsedCommandWithParameters<Host> {
	tagNode: SyntaxNode | undefined = undefined;

	get regex(): RegExp {
		return COMMAND_REGEX;
	}

	// declare that we need to be constructed and shown all nodes from the syntax tree, even if our command does not match
	static get observer(): boolean {
		return true;
	}

	observe(node: SyntaxNodeRef): void {
		super.observe(node);
		if (node.type.name.startsWith("hashtag_hashtag-end")) {
			// freeze copy of the node reference
			this.tagNode = node.node;
		}
	}

	// this can be used to check if we even need to construct this object, when typically that is not the case
	static match(text: string): boolean {
		return text.match(COMMAND_REGEX) !== null;
	}

	buildWidget(context: ViewPluginContext<Host>) {
		if (this.tagNode === undefined) {
			return;
		}
		const builder = context.builder;
		const plugin = context.plugin;

		if (this.parameters.combo) {
			const combo = new ComboBoxWidget(plugin, this.tagNode, this);
			builder.add(this.commandNode.from - 1, this.commandNode.from - 1, Decoration.widget({ widget: combo }));
		} else {
			const radio = new RadioGroupWidget(plugin, this.tagNode, this);
			builder.add(this.commandNode.from - 1, this.commandNode.from - 1, Decoration.widget({ widget: radio }));

			if (!this.parameters.noedit) {
				const text = new EditWidget(plugin, this.tagNode, this);
				builder.add(this.commandNode.from - 1, this.commandNode.from - 1, Decoration.widget({ widget: text }));
			}
		}
		WidgetFormatter.markBasedOnParameters(context, this);
	}
}
