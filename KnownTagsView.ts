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
import { KNOWN_TAGS_COMMAND, _global_cache } from './main';
import { TagEditWidget } from "TagEditWidget";

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
			let tagText: SyntaxNode | undefined = undefined;
			for (let { from, to } of view.visibleRanges) {
				syntaxTree(view.state).iterate({
					from,
					to,
					enter(node) {
						console.log(`${node.type.name} ${node.from} ${node.to}`);
						console.log(`${node.type.name}: ${view.state.doc.sliceString(node.from, node.to)}`);
						switch (node.type.name) {
							case "inline-code":
								if ((view.state.doc.sliceString(node.from, node.to).match(KNOWN_TAGS_COMMAND)) &&
								    (tagText !== undefined)) {
									const radio = new TagRadioGroupWidget(cache, view.state, tagText);

									// for replace:
									// builder.add(node.from - 1, node.to + 1, Decoration.replace({ widget: widget }));
									// for append:
									// builder.add(to, to, Decoration.widget({ widget: widget }))
									// for prepend:
									builder.add(node.from-1, node.from-1, Decoration.widget({ widget: radio }))
									
									const text = new TagEditWidget(cache, view.state, tagText);
									builder.add(node.from-1, node.from-1, Decoration.widget({ widget: text }))

									// based on settings, dim out or hide command
									builder.add(node.from, node.to, Decoration.mark({ attributes: { "class": "known-tags known-tags-auto-hide" }}))
									// builder.add(node.from, node.to, Decoration.mark({ attributes: { "class": "known-tags known-tags-auto-dim" }}))
									// builder.add(node.from, node.to, Decoration.mark({ attributes: { "class": "known-tags" }}))
								}
								break;
							default:
								if (node.type.name.startsWith("hashtag_hashtag-end")) {
									// freeze copy of the node reference
									tagText = node.node;
								}
						}
					},
				});
			}
		}
		return builder.finish();
	}
}
