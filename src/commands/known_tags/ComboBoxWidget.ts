import { EditorView, ParsedCommand, SyntaxNode } from "src/derobst/ParsedCommand";
import { Host } from "src/main/Plugin";
import { WidgetBase } from './WidgetBase';

export class ComboBoxWidget extends WidgetBase {
	initialValue: string;
	previousValue: string | undefined = undefined

	constructor(host: Host, tagNode: SyntaxNode, command: ParsedCommand) {
		super(host, tagNode, command);
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		const tag = this.getTag(view);
		const topLevel = this.host.cache.getTopLevel(tag);
		if (topLevel !== undefined) {
			const datalistId = `TagComboBoxWidget datalist ${topLevel}`;
			const datalist = document.createElement("datalist");
			datalist.id = datalistId;
			this.host.cache.getChoices(topLevel).forEach((subpath: string) => {
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

			this.clearUnchangedValueOnMouseDown({ input });
			this.updateTagFromChangedValue(input, topLevel, view);
			this.restoreVisibleValueIfUnchanged(input);

			span.appendChild(datalist);
			span.appendChild(input);
		}
		return span;
	}

	private restoreVisibleValueIfUnchanged(input: HTMLInputElement): void {
		input.addEventListener('focusout', async (event: Event) => {
			if (this.previousValue !== undefined) {
				// restore value since we chose nothing
				input.value = this.previousValue;
				this.previousValue = undefined;
			}
		});
	}

	private updateTagFromChangedValue(input: HTMLInputElement, topLevel: string, view: EditorView): void {
		input.addEventListener('change', async (event: Event) => {
			const value: string = ((event.target as any)?.value ?? "").trim();
			console.log(`combo box change to '${value}'`);
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
			this.previousValue = undefined;
		});
	}

	private clearUnchangedValueOnMouseDown({ input }: { input: HTMLInputElement; }): void {
		input.addEventListener('mousedown', async (_event: Event) => {
			if (input.value == this.initialValue) {
				// don't use current value for completion
				this.previousValue = input.value;
				input.value = "";
			} else {
				this.previousValue = undefined;
			}
		});
	}
}
