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
	static observes = true;

	observe(node: SyntaxNodeRef): void {
		if (node.type.name.startsWith("hashtag_hashtag-end")) {
			// freeze copy of the node reference
			this.tagNode = node.node;
		}
	}

	// this can be used to check if we even need to construct this object, when typically that is not the case
	static match(text: string): boolean {
		return text.match(COMMAND_REGEX) !== null;
	}

	buildWidget(context: ViewPluginContext<Host>, commandNodeRef: SyntaxNodeRef) {
		if (this.tagNode === undefined) {
			return;
		}
		if (this.parameters.combo) {
			const combo = new ComboBoxWidget(context, this.tagNode, this);
			context.builder.add(commandNodeRef.from - 1, commandNodeRef.from - 1, Decoration.widget({ widget: combo }));
		} else {
			const radio = new RadioGroupWidget(context, this.tagNode, this);
			context.builder.add(commandNodeRef.from - 1, commandNodeRef.from - 1, Decoration.widget({ widget: radio }));

			if (!this.parameters.noedit) {
				const text = new EditWidget(context, this.tagNode, this);
				context.builder.add(commandNodeRef.from - 1, commandNodeRef.from - 1, Decoration.widget({ widget: text }));
			}
		}
		WidgetFormatter.markBasedOnParameters(context, this, commandNodeRef);
	}
}
