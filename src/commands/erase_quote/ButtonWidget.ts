import { CommandWidgetBase, EditorView, ParsedCommand, SyntaxNode } from "derobst/command";
import { Host } from "main/Plugin";

export class ButtonWidget extends CommandWidgetBase<Host> {
	constructor(host: Host, command: ParsedCommand<Host>, public quote: SyntaxNode) {
		super(host, command);
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		span.appendChild(this.buildButtonSVG(view));
		return span;
	}

	buildButtonSVG(view: EditorView): HTMLElement {
		const control = document.createElement("button");
		control.ariaLabel = "Delete";
		control.style.width = "2em";
		control.style.height = "2em";
		control.style.padding = "0.2em";
		control.style.verticalAlign = "bottom";
		control.style.marginLeft = "0.5em";

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
			view.dispatch({ 
				changes: { from: this.quote.from, to: this.command.commandNode.to+2 }
			});		
		});
		return control;
	}
}
