import { WidgetType } from "@codemirror/view";
import { ParsedCommand } from "src/derobst/ParsedCommand";

export abstract class CommandWidget<T> extends WidgetType {
	host: T;
	command: ParsedCommand;

	constructor(host: T, command: ParsedCommand) {
		super();
		this.host = host;
		this.command = command;
	}

	private debugEventsBrutally(control: HTMLElement) {
		Object.keys((control as any).__proto__.__proto__).forEach((key: string) => {
			// console.log(`considering ${key}`);
			if (key.startsWith("on")) {
				control.addEventListener(key.slice(2), this.debugEventLogger);
			}
		});
	}

	private debugEventLogger(event: Event) {
		if (event.type.startsWith('mousemove')) {
			return;
		}
		if (event.type.startsWith('pointerraw')) {
			return;
		}
		if (event.type.startsWith('pointermove')) {
			return;
		}
		console.log(`EVENT ${event.type}`);
	}
}
