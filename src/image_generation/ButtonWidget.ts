import { WidgetType } from "@codemirror/view";
import { EditorView, SyntaxNode } from "src/derobst/ParsedCommandWithSettings";
import { ImageReference } from "./ImageReference";
import { Host } from "src/main/Plugin";

export class ButtonWidget extends WidgetType {
	height: number | undefined;
	imageReference: ImageReference;

	constructor(public host: Host, public imageReferences: ImageReference[]) {
		super();
		this.imageReference = imageReferences.last()!;
		// if host.settings.imagePresentationSize !== undefined
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");
		span.style.display = "inline-flex";
		span.style.flexDirection = "column";
		span.style.rowGap = "5px";
		span.style.padding = "5px";
		span.style.paddingBottom = "0px";
		span.style.verticalAlign = "top";
	
		// can't get this to expand to parent height which is auto from contained (sibling to us) image, so we force it
		// span.style.alignItems = "stretch";
		// span.style.alignContent = "stretch";
		// span.style.height = "100%";
		span.style.marginRight = "20px";
		if (this.height !== undefined) {
			span.style.minHeight = `${this.height}px`;
		}

		span.style.width = "70px";
		span.style.marginLeft = "-70px";

		span.appendChild(this.buildKeepButton(view));
		span.appendChild(this.buildChooseButton(view));
		const testLast = document.createElement("div")
		// testLast.style.backgroundColor = "red";
		testLast.style.flexGrow = "1";
		span.appendChild(testLast);

		// XXX more buttons
		return span;
	}

	buildKeepButton(view: EditorView, disabled: boolean = false): HTMLElement {
		const control = this.buildFlexButton();
		const imageReference = this.imageReference;
		const host = this.host;
		control.innerText = "Keep";
		if (imageReference.url.startsWith("https:")) {
			control.addEventListener('click', async (_event: Event) => {
				imageReference.downloadRemoteImage(host, view);
			});
		} else {
			control.disabled = true;
			control.ariaDisabled = "true";
			control.style.backgroundColor = "gray";
		}
		return control;
	}

	buildChooseButton(view: EditorView): HTMLElement {
		const control = this.buildFlexButton();
		control.innerText = "Choose";

		control.addEventListener('click', async (_event: Event) => {
			// erase all image references, in reverse order
			this.imageReferences.reduceRight((_, imageReference: ImageReference) => {
				imageReference.erase(view);
			}, null);

			// create a new reference to the chosen image, without UI
			this.imageReferences.first()?.insertReference(view, this.imageReference.url);
		});
		return control;
	}

	private buildFlexButton(): HTMLButtonElement {
		const control = document.createElement("button");
		control.style.display = "flex";
		control.style.flexGrow = "0";
		control.style.flexShrink = "0";
		control.style.flexBasis = "auto";
		return control;
	}
}
