import { Decoration, RangeSetBuilder, EditorView } from "src/derobst/ParsedCommand";
import { MinimalPlugin } from "src/derobst/ViewPluginBase";

// services used during construction of decorations for view plugins
export class ViewPluginContextBase<T extends MinimalPlugin> {
    builder: RangeSetBuilder<Decoration>;
    plugin: T;
    view: EditorView;

    public constructor(fields?: Partial<ViewPluginContextBase<T>>) {
        Object.assign(this, fields);
    }
}
