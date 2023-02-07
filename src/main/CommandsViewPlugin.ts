import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView, PluginValue, ViewUpdate
} from "@codemirror/view";
import { SyntaxNode, SyntaxNodeRef } from '@lezer/common/dist/tree';

import { ViewPluginBase } from "src/derobst/ViewPluginBase";
import { CommandContext, Host } from "./Plugin";

import * as ImagePromptFromTagsCommand from "src/commands/image_prompt_from_tags/Command";
import * as KnownTagsCommand from "src/commands/known_tags/Comand";
import * as CharacterRandomDescription from "src/commands/character_random_description/Command";
import * as EraseQuote from "src/commands/erase_quote/Command";
import * as ImageSet from "src/commands/image_set/Command";

const REQUIRED_COMMAND_PREFIX = /^\s*!/;

interface MinimalCommand {
    parse(text: string, commandNodeRef: SyntaxNodeRef): RegExpMatchArray | null;
	buildWidget(context: CommandContext): void;
}

interface MinimalCommandClass<T> {
    new(): MinimalCommand;    
	match(text: string): boolean;
}

// CodeMirror ViewPlugin to replace recognized commands with UI elements in Edit view
export abstract class CommandsViewPlugin extends ViewPluginBase<Host> {
	abstract getPlugin(): Host;
	
	buildDecorations(view: EditorView): DecorationSet {
		// stash these for closure
		const context = new CommandContext({ 
			builder: new RangeSetBuilder<Decoration>(), 
			plugin: this.getPlugin(),
			view: view
		});

		let tagNode: SyntaxNode | undefined = undefined;
		const syntax = syntaxTree(view.state);
		for (let { from, to } of view.visibleRanges) {
			syntax.iterate({
				from,
				to,
				enter(scannedNode) {
					switch (scannedNode.type.name) {
						case 'Document':
							break;
						case "inline-code": 
						case "inline-code_quote_quote-1":
							const commandText = view.state.doc.sliceString(scannedNode.from, scannedNode.to);
							if (!commandText.match(REQUIRED_COMMAND_PREFIX)) {
								// all our commands are encoded like this
								return;
							}
							if (KnownTagsCommand.Command.match(commandText) &&
								(tagNode !== undefined)) {
								const command = new KnownTagsCommand.Command();
								if (!command.parse(commandText, scannedNode)) {
									// XXX log parse failure, also log details in parse(...) function
									return;
								}
								command.buildWidget(context, tagNode);
								return;
							} 
							if (CommandsViewPlugin.dispatch(ImagePromptFromTagsCommand.Command, context, scannedNode, commandText)) {
								return;
							}
							if (CommandsViewPlugin.dispatch(CharacterRandomDescription.Command, context, scannedNode, commandText)) {
								return;
							}
							if (CommandsViewPlugin.dispatch(EraseQuote.Command, context, scannedNode, commandText)) {
								return;
							}
							if (CommandsViewPlugin.dispatch(ImageSet.Command, context, scannedNode, commandText)) {
								return;
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
		return context.builder.finish();
	}

	static dispatch<T>(commandClass: MinimalCommandClass<T>, context: CommandContext, scannedNode: SyntaxNodeRef, commandText: string): boolean {
		if (commandClass.match(commandText)) {
			const command = new commandClass();
			if (command.parse(commandText, scannedNode)) {
				command.buildWidget(context);		
				return true;
			}
			// XXX log parse failure, also log details in parse(...) function
		}
		return false;
	}
}


