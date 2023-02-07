import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewUpdate} from "@codemirror/view";

import { ViewPluginContextBase } from "../derobst/ViewPluginContextBase";
import { ViewPluginBase } from "../derobst/ViewPluginBase";
import { Host } from "../main/Plugin";

export abstract class GeneratedImagesViewPlugin extends ViewPluginBase<Host> {
	update(update: ViewUpdate): void {
		console.log("========================== IMAGES VIEW PLUGIN CALLED ==========================");
		console.log(update);
		super.update(update);
	}

	buildDecorations(view: EditorView): DecorationSet {
		// stash these for closure
		const context = new ViewPluginContextBase({ 
			builder: new RangeSetBuilder<Decoration>(), 
			plugin: this.getPlugin(),
			view: view
		});
		const syntax = syntaxTree(view.state);
		for (let { from, to } of view.visibleRanges) {
			syntax.iterate({
				from,
				to,
				enter(scannedNode) {
					switch (scannedNode.type.name) {
						case 'Document':
							// console.log(`SEARCH_IMAGES ${scannedNode.type.name} ... [truncated]`);
						 	break;
						// case "formatting_formatting-image_image_image-marker": 

							// const commandText = view.state.doc.sliceString(scannedNode.from, scannedNode.to);
							// if (!commandText.match(REQUIRED_COMMAND_PREFIX)) {
							// 	// all our commands are encoded like this
							// 	return;
							// }
							// if (KnownTagsCommand.Command.match(commandText) &&
							// 	(tagNode !== undefined)) {
							// 	const command = new KnownTagsCommand.Command();
							// 	if (!command.parse(commandText, scannedNode)) {
							// 		// XXX log parse failure, also log details in parse(...) function
							// 		return;
							// 	}
							// 	command.buildWidget(context, tagNode);
							// 	return;
							// } 
							// break;
						default:
							// console.log(`SEARCH_IMAGES ${scannedNode.type.name} '${view.state.doc.sliceString(scannedNode.from, scannedNode.to)}'`);
					}
				},
			});
		}
		return context.builder.finish();
	}
}


