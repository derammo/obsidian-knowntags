import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView, PluginValue, ViewUpdate
} from "@codemirror/view";
import { SyntaxNode } from '@lezer/common/dist/tree';
import { TagRadioGroupWidget } from './TagRadioGroupWidget';
import { TagEditWidget } from "TagEditWidget";
import { TagComboBoxWidget } from "TagComboBoxWidget";
import { KnownTagsCommand } from "./KnownTagsCommand";
import { KnownTagsHost } from "./KnownTagsHost";
import { editorLivePreviewField } from "obsidian";
import { KnownTagsSettings } from "KnownTagsSettings";

export abstract class KnownTagsView implements PluginValue {
	decorations: DecorationSet;

	constructor(view: EditorView) {
		this.decorations = this.buildDecorations(view);
	}

	update(update: ViewUpdate) {
		// thanks to https://github.com/valentine195/obsidian-dice-roller
		if (!update.state.field(editorLivePreviewField)) {
			console.log("source mode");
			// live preview only, not rendered in strict source code view
			this.decorations = Decoration.none;
			return;
		}

		if (update.docChanged || update.viewportChanged || this.decorations === Decoration.none || this.getPlugin().settingsDirty ) {
			this.decorations = this.buildDecorations(update.view);
			this.getPlugin().settingsDirty = false;
		}
	}

	destroy() { }

	abstract getPlugin(): KnownTagsHost;

	private calculateUnfocusedStyle(command: KnownTagsCommand): { hide: boolean, dim: boolean} {
		const settings: KnownTagsSettings = this.getPlugin().settings;

		// get default behavior from settings
		let hide = settings.defaultHide;
		let dim = settings.defaultDim;

		// process overrides, including conflicting ones
		if (command.settings.dim) {
			dim = true;
		}
		if (command.settings.hide) {
			hide = true;
		}
		if (command.settings.nodim) {
			dim = false;
		}
		if (command.settings.nohide) {
			hide = false;
		}
		return { hide, dim };
	}

	buildDecorations(view: EditorView): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();
		const parent: KnownTagsView = this;

		let tagNode: SyntaxNode | undefined = undefined;
		const syntax = syntaxTree(view.state);
		for (let { from, to } of view.visibleRanges) {
			syntax.iterate({
				from,
				to,
				enter(scannedNode) {
					switch (scannedNode.type.name) {
						case "inline-code":
							const commandText = view.state.doc.sliceString(scannedNode.from, scannedNode.to);
							if (KnownTagsCommand.match(commandText) &&
								(tagNode !== undefined)) {
								const command = new KnownTagsCommand();
								if (!command.parse(commandText, scannedNode)) {
									// XXX log parse failure, also log details in parse(...) function
									return;
								}
								parent.buildCommandWidget(builder, command, tagNode);
								parent.markWithBehaviorClasses(builder, command);
							}
							break;
						default:
							if (scannedNode.type.name.startsWith("hashtag_hashtag-end")) {
								// freeze copy of the node reference
								tagNode = scannedNode.node;
							}
					}
				},
			});
		}
		return builder.finish();
	}

	private markWithBehaviorClasses(builder: RangeSetBuilder<Decoration>, command: KnownTagsCommand) {
		const { hide, dim } = this.calculateUnfocusedStyle(command);

		// use style that implements the selected behavior when not focused
		if (hide) {
			builder.add(command.commandNode.from, command.commandNode.to, Decoration.mark({ attributes: { "class": "known-tags known-tags-auto-hide" } }));
		} else if (dim) {
			builder.add(command.commandNode.from, command.commandNode.to, Decoration.mark({ attributes: { "class": "known-tags known-tags-auto-dim" } }));
		} else {
			builder.add(command.commandNode.from, command.commandNode.to, Decoration.mark({ attributes: { "class": "known-tags" } }));
		}
	}

	private buildCommandWidget( builder: RangeSetBuilder<Decoration>, command: KnownTagsCommand, tagTextNode: SyntaxNode) {
		if (command.settings.combo) {
			const combo = new TagComboBoxWidget(this.getPlugin(), tagTextNode, command);
			builder.add(command.commandNode.from - 1, command.commandNode.from - 1, Decoration.widget({ widget: combo }));
		} else {
			const radio = new TagRadioGroupWidget(this.getPlugin(), tagTextNode, command);
			builder.add(command.commandNode.from - 1, command.commandNode.from - 1, Decoration.widget({ widget: radio }));

			if (!command.settings.noedit) {
				const text = new TagEditWidget(this.getPlugin(), tagTextNode, command);
				builder.add(command.commandNode.from - 1, command.commandNode.from - 1, Decoration.widget({ widget: text }));
			}
		}
	}
}
