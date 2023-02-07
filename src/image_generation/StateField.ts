import { syntaxTree } from "@codemirror/language";
import {
  Extension,
  RangeSetBuilder,
  StateField,
  Transaction,
  Text,
  EditorState
} from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView
} from "@codemirror/view";
import { SyntaxNode, SyntaxNodeRef } from "@lezer/common";
import { editorLivePreviewField } from "obsidian";
import { ALT_TEXT_PREFIX } from "src/commands/image_prompt_from_tags/Command";
import { Host } from "src/main/Plugin";
import { ButtonWidget } from "./ButtonWidget";
import { ImageReference } from "./ImageReference";

const ALT_TEXT_REGEX = new RegExp(`^${ALT_TEXT_PREFIX}([0-9-:TZ]+)\\s`);

export function createGeneratedImagesDecorationsStateField(host: Host): StateField<DecorationSet> {
  return StateField.define<DecorationSet>({
    create(state): DecorationSet {
      if (state.doc.length < 1) {
        // document is empty, no need to scan it (this happens every time on initialization)
        return Decoration.none;
      } 
      if (!state.field(editorLivePreviewField)) {
        // source mode
        return Decoration.none;
      }
      const builder = new RangeSetBuilder<Decoration>();
      walkTree(host, builder, state);
      return builder.finish();
    },

    update(oldState: DecorationSet, transaction: Transaction): DecorationSet {
      if (!transaction.state.field(editorLivePreviewField)) {
        // source mode
        return Decoration.none;
      }
      const builder = new RangeSetBuilder<Decoration>();
      if (!transaction.docChanged) {
        // document not changed and we have already scannned it initially
        console.log("UPDATE no doc change")
        return oldState;
      }
      console.log("UPDATE scanning")
      walkTree(host, builder, transaction.state);
      return builder.finish();
    },

    provide(field: StateField<DecorationSet>): Extension {
      return EditorView.decorations.from(field);
    },
  });
}

// XXX remove
function walkChanges(transaction: Transaction): void {
  transaction.changes.iterChanges((fromOld: number, toOld: number, fromNew: number, toNew: number, inserted: Text) => {
    console.log(`STATE_UPDATE CHANGE OLD ${fromOld}..${toOld} '${transaction.state.doc.sliceString(fromOld, toOld)}'`);
    console.log(`STATE_UPDATE CHANGE NEW ${fromNew}..${toNew} '${transaction.state.doc.sliceString(fromNew, toNew)}'`);
  });
}

function walkTree(host: Host, builder: RangeSetBuilder<Decoration>, state: EditorState) {
  // accumulate all image references so that our buttons can share the collection
  const imageReferences: ImageReference[] = [];
  let altText: SyntaxNode | null = null;
  let generationId: string;
  syntaxTree(state).iterate({
    enter(scannedNode) {
      switch (scannedNode.type.name) {
        case 'Document':
          console.log(`STATE_UPDATE ${scannedNode.type.name} ... [truncated]`);
          break;
        case 'image_image-alt-text_link':
          const text = state.doc.sliceString(scannedNode.from, scannedNode.to)
          const match = text.match(ALT_TEXT_REGEX);
          console.log(text);
          console.log(match);
          if (match !== null) {
            altText = scannedNode.node;
            generationId = match[1];
          } else {
            altText = null;
          }
          break;
        case 'string_url':
          const closeParen = scannedNode.node.nextSibling;
          traceNode(state, scannedNode);
          traceNode(state, closeParen);
          if (altText === null) {
            console.log("STATE_UPDATE missing alt text");
            break;
          }
          if (closeParen === null) {
            console.log("STATE_UPDATE missing alt text");
            break;
          }
          imageReferences.push(new ImageReference(state, generationId, altText, scannedNode.node, closeParen));
          console.log(`STATE_UPDATE building widget at position ${closeParen.to}`);

          builder.add(closeParen.to, closeParen.to, Decoration.widget({ widget: new ButtonWidget(host, imageReferences)}));
          // XXX HACK testing because this doesn't work when image is alone (there is no cm-line)
          // builder.add(altText.from - 2, altText.from - 2, Decoration.widget({ widget: new ButtonWidget(imageReferences)}));
          break;
        default:
          // traceNode(state, scannedNode);
        // if (node.type.name.startsWith("list")) {
        //   // Position of the '-' or the '*'.
        //   const listCharFrom = node.from - 2;
        //   builder.add(
        //     listCharFrom,
        //     listCharFrom + 1,
        //     Decoration.replace({
        //       widget: new EmojiWidget(),
        //     })
        //   );
        // }
      }
    },
  });
}

function traceNode(state: EditorState, scannedNode: SyntaxNodeRef | null) {
  if (scannedNode === null) {
    console.log(`STATE_UPDATE null`);
    return;
  }
  console.log(`STATE_UPDATE ${scannedNode!.type?.name} at [${scannedNode!.from}, ${scannedNode!.to}] '${state.doc.sliceString(scannedNode!.from, scannedNode!.to)}'`);
}

