import { CommandWidget } from "src/derobst/CommandWidget";
import { EditorView, ParsedCommandWithSettings } from "src/derobst/ParsedCommandWithSettings";
import { Host } from "src/main/Plugin";

export class ButtonWidget extends CommandWidget<Host> {
	height: number | undefined;

	constructor(host: Host, command: ParsedCommandWithSettings) {
		super(host, command);
		if (command.settings.height !== undefined) {
			this.height = parseInt(command.settings.height as string);
		} else if (command.settings.h !== undefined) {
			this.height = parseInt(command.settings.h as string);
		} else {
			// if host.settings.imagePresentationSize !== undefined
		}
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		span.style.display = "inline-flex";
		span.style.flexDirection = "column";
		span.style.rowGap = "5px";
		span.style.borderRightColor = "gray";
		span.style.borderRightStyle = "solid";
		span.style.borderRightWidth = "1px";
		span.style.padding = "5px";
		span.style.verticalAlign = "top";
	
		// can't get this to expand to parent height which is auto from contained (sibling to us) image, so we force it
		// span.style.alignItems = "stretch";
		// span.style.alignContent = "stretch";
		// span.style.height = "100%";
		span.style.marginRight = "20px";
		if (this.height !== undefined) {
			span.style.minHeight = `${this.height}px`;
		}

		span.appendChild(this.buildKeepButton(view));
		span.appendChild(this.buildChooseButton(view));
		const testLast = document.createElement("div")
		// testLast.style.backgroundColor = "red";
		testLast.style.flexGrow = "1";
		span.appendChild(testLast);

		// XXX more buttons
		return span;
	}

	buildKeepButton(view: EditorView): HTMLElement {
		const control = this.buildFlexButton();
		control.innerText = "Keep";
		control.addEventListener('click', async (event: Event) => {
			this.command.handleUsed(view);
		});
		return control;
	}

	buildChooseButton(view: EditorView): HTMLElement {
		const control = this.buildFlexButton();
		control.innerText = "Choose";
		control.addEventListener('click', async (event: Event) => {
			this.command.handleUsed(view);
		});
		return control;
	}

	private buildFlexButton() {
		const control = document.createElement("button");
		control.style.display = "flex";
		control.style.flexGrow = "0";
		control.style.flexShrink = "0";
		control.style.flexBasis = "auto";
		return control;
	}
}
