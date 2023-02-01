import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView, PluginValue, ViewUpdate
} from "@codemirror/view";
import { SyntaxNode } from '@lezer/common/dist/tree';
import { KnownTagsCache } from './KnownTagsCache';
import { TagRadioGroupWidget } from './TagRadioGroupWidget';
import { _global_cache } from './main';
import { TagEditWidget } from "TagEditWidget";
import { TagComboBoxWidget } from "TagComboBoxWidget";
import { KnownTagsCommand } from "./KnownTagsCommand";

export class KnownTagsView implements PluginValue {
	decorations: DecorationSet;
	cache?: KnownTagsCache = undefined;

	constructor(view: EditorView) {
		this.decorations = this.buildDecorations(view);
	}

	update(update: ViewUpdate) {
		// console.log("view update");
		// console.log(update);
		if (update.docChanged || update.viewportChanged) {
			this.decorations = this.buildDecorations(update.view);
		}
	}

	destroy() { }

	private static calculateUnfocusedStyle(command: KnownTagsCommand): { hide: boolean, dim: boolean} {
		let hide = false;
		let dim = false;

		// XXX get default behavior from settings
		// XXX HACK global
		
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
		if (this.cache === undefined) {
			// XXX HACK
			this.cache = _global_cache;
		}
		if (this.cache === undefined) {
			console.log("SEQUENCE ERROR: buildDecorations called before cache hooked up");
		}
		const builder = new RangeSetBuilder<Decoration>();

		if (this.cache !== undefined) {
			const cache = this.cache;
			let tagTextNode: SyntaxNode | undefined = undefined;
			for (let { from, to } of view.visibleRanges) {
				syntaxTree(view.state).iterate({
					from,
					to,
					enter(nodeRef) {
						console.log(`${nodeRef.type.name} ${nodeRef.from} ${nodeRef.to}`);
						console.log(`${nodeRef.type.name}: ${view.state.doc.sliceString(nodeRef.from, nodeRef.to)}`);
						switch (nodeRef.type.name) {
							case "inline-code":
								const tagText = view.state.doc.sliceString(nodeRef.from, nodeRef.to);
								if (KnownTagsCommand.match(tagText) &&
								    (tagTextNode !== undefined)) {
									const command = new KnownTagsCommand();
									if (!command.parse(tagText, nodeRef)) {
										// XXX log parse failure, also log details in parse(...) function
										return;
									}
									console.log(command);

									if (command.settings.combo) {
										const combo = new TagComboBoxWidget(cache, tagTextNode, command);
										builder.add(nodeRef.from-1, nodeRef.from-1, Decoration.widget({ widget: combo }))	
									} else {
										const radio = new TagRadioGroupWidget(cache, tagTextNode, command);
										builder.add(nodeRef.from-1, nodeRef.from-1, Decoration.widget({ widget: radio }))

										if (!command.settings.noedit) {
											const text = new TagEditWidget(cache, tagTextNode, command);
											builder.add(nodeRef.from-1, nodeRef.from-1, Decoration.widget({ widget: text }))	
										}
									}

									const { hide, dim } = KnownTagsView.calculateUnfocusedStyle(command); 

									// use style that implements the selected behavior when not focused
									if (hide) {
										builder.add(nodeRef.from, nodeRef.to, Decoration.mark({ attributes: { "class": "known-tags known-tags-auto-hide" }}))
									} else if (dim) {
										builder.add(nodeRef.from, nodeRef.to, Decoration.mark({ attributes: { "class": "known-tags known-tags-auto-dim" }}))
									} else {
										builder.add(nodeRef.from, nodeRef.to, Decoration.mark({ attributes: { "class": "known-tags" }}))
									}
								}
								break;
							default:
								if (nodeRef.type.name.startsWith("hashtag_hashtag-end")) {
									// freeze copy of the node reference
									tagTextNode = nodeRef.node;
								}
						}
					},
				});
			}
		}
		return builder.finish();
	}
}
