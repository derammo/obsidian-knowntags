import { CommandWidgetBase, EditorView, ParsedCommand, SyntaxNode, CommandContext } from "derobst/command";
import { UpdatedTextRange } from "derobst/view";
import { Host } from "main/Plugin";

export class ButtonWidget extends CommandWidgetBase<Host> {
	quoteRange: UpdatedTextRange;
	
	constructor(context: CommandContext<Host>, command: ParsedCommand<Host>, quote: SyntaxNode) {
		super(context, command);
		this.quoteRange = context.plugin.tracking.register(context.state, quote);
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		span.classList.add("derammo-delete-container");
		span.appendChild(this.buildButtonSVG(view));
		return span;
	}

	buildButtonSVG(view: EditorView): HTMLElement {
		const control = document.createElement("button");
		control.classList.add("derammo-delete-button", "derammo-button");
		control.ariaLabel = "Delete";

		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttr("width", "100%");
		svg.setAttr("height", "100%");
		svg.setAttr("viewBox", "0 0 12 12");
		svg.setAttr("fill", "none");
		svg.setAttr("stroke", "currentcolor");
		svg.setAttr("stroke-width", "1");
		svg.setAttr("stroke-linecap", "round");
		svg.setAttr("stroke-linejoin", "round");

		const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line1.setAttr("x1", "9"); 
		line1.setAttr("y1", "3"); 
		line1.setAttr("x2", "3"),
		line1.setAttr("y2", "9");
		svg.appendChild(line1);

		const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line2.setAttr("x1", "3");
		line2.setAttr("y1", "3"); 
		line2.setAttr("x2", "9"),
		line2.setAttr("y2", "9");
		svg.appendChild(line2);

		control.appendChild(svg);

		this.host.registerDomEvent(control, "click", async (_event: Event) => {
			this.command.handleUsed(view);
			const quote = this.quoteRange.fetchCurrentRange();
			const range = this.command.commandRange.fetchCurrentRange();
			if (quote === null || range === null) {
				return;
			}
			view.dispatch({ 
				changes: { from: quote.from, to: range.to+2 }
			});		
		});
		this.host.registerDomContextMenuTarget(control, this.command);

		return control;
	}
}
