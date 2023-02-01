import { EditorView } from "@codemirror/view";
import { SyntaxNode } from '@lezer/common/dist/tree';
import { ParsedCommand } from "ParsedCommand";
import { KnownTagsCache } from './KnownTagsCache';
import { KnownTagsWidget } from './KnownTagsWidget';

export class TagComboBoxWidget extends KnownTagsWidget {
	initialValue: string;
	previousValue: string | undefined = undefined

	constructor(cache: KnownTagsCache, tagNode: SyntaxNode, command: ParsedCommand) {
		super(cache, tagNode, command);
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		const tag = this.getTag(view);
		const topLevel = this.cache.getTopLevel(tag);
		if (topLevel !== undefined) {
			const datalistId = `TagComboBoxWidget datalist ${topLevel}`;
			const datalist = document.createElement("datalist");
			datalist.id = datalistId;
			this.cache.getChoices(topLevel).forEach((subpath: string) => {
				const option = document.createElement("option");
				option.value = `${subpath}`;
				datalist.appendChild(option);
			});
			const input = document.createElement("input");
			input.setAttribute("list", datalistId);
			this.initialValue = tag.slice(topLevel.length + 1);
			input.value = this.initialValue;
			// no browser cached values anyway
			input.autocomplete = "off";

			input.addEventListener('mousedown', async (_event: Event) => {
				if (input.value == this.initialValue) {
					// don't use current value for completion
					this.previousValue = input.value;
					input.value = "";
				} else {
					this.previousValue = undefined;
				}
			})
			input.addEventListener('change', async (event: Event) => {
				const value: string = ((event.target as any)?.value ?? "").trim();
				console.log(`combo box change to '${value}'`)
				if (value.length < 1) {
					if (this.previousValue !== undefined) {
						// restore value since we chose nothing
						input.value = this.previousValue;
						this.previousValue = undefined;
					}
					return;
				}
				if (!value.startsWith(`${topLevel}/`)) {
					// edit back to front to keep syntax tree coordinates valid
					await this.command.handleUsed(view);

					// interpret input as just subtag path
					await this.replaceTag(view, `${topLevel}/${value}`);
					return;
				}
				this.replaceTag(view, value);
			});
			input.addEventListener('focusout', async (event: Event) => {
				if (this.previousValue !== undefined) {
					// restore value since we chose nothing
					input.value = this.previousValue;
					this.previousValue = undefined;
				}
			});
			span.appendChild(datalist);
			span.appendChild(input);
		}
		return span;
	}
}
