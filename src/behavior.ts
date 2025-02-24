
import { Selection as d3Selection, local as d3local } from "d3-selection";
import {ICursorDataPoint, ITimelineDataPoint} from "./dataInterfaces";
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import {D3DragEvent, drag as d3Drag} from "d3-drag";

export interface BehaviorOptions {
    selectionManager: ISelectionManager;
    cells: {
        selection: d3Selection<SVGRectElement, ITimelineDataPoint, SVGGElement, unknown>;
        callback: (dataPoint: ITimelineDataPoint, index: number, isMultiSelection: boolean) => void;
        cellWidth: number;
    };
    cursors: {
        selection:  d3Selection<SVGPathElement, ICursorDataPoint, SVGGElement, unknown>
        onDrag: (event: D3DragEvent<SVGPathElement, ICursorDataPoint, ICursorDataPoint>, currentCursor: ICursorDataPoint) => void;
        onEnd: () => void;
    }
    clearCatcher: d3Selection<HTMLDivElement, unknown, null, undefined>;
    clearSelectionHandler: () => void;
}

export class Behavior {
    public static bindEvents(options: BehaviorOptions) {
        Behavior.handleCellsClick(options);
        Behavior.handleCursorsDrag(options);
        Behavior.clearCatcher(options);
    }

    private static handleCursorsDrag(options: BehaviorOptions) {
        const dragBehavior = d3Drag<SVGPathElement, ICursorDataPoint>()
            .subject((_: D3DragEvent<SVGPathElement, ICursorDataPoint, ICursorDataPoint>, cursorDataPoint: ICursorDataPoint) => {
                cursorDataPoint.x = cursorDataPoint.selectionIndex * options.cells.cellWidth;

                return cursorDataPoint;
            })
            .on("drag end", null)
            .on("drag", options.cursors.onDrag)
            .on("end", options.cursors.onEnd);

        options.cursors.selection.call(dragBehavior);
    }

    private static handleCellsClick(options: BehaviorOptions) {
        const local = d3local<number>();
        let index = 0;

        options.cells.selection
            .each(function () {
                local.set(this, index);
                index += 1;
            })
            .on("click touchstart", null)
            .on("click touchstart", function (event: MouseEvent, dataPoint: ITimelineDataPoint) {
                event.stopPropagation();
                const index: number = local.get(this);
                options.cells.callback(dataPoint, index, event.ctrlKey || event.metaKey || event.altKey || event.shiftKey);
            })
    }

    private static clearCatcher(options: BehaviorOptions) {
        options.clearCatcher
            .on("click", null)
            .on("click", options.clearSelectionHandler);

        options.clearCatcher.on("contextmenu", (event: MouseEvent) => {
            const emptySelection = {
                "measures": [],
                "dataMap": {
                }
            };

            options.selectionManager.showContextMenu(emptySelection, {
                x: event.clientX,
                y: event.clientY
            });

            event.preventDefault();
        });
    }
}
