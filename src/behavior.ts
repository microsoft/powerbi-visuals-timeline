
import { Selection as d3Selection } from "d3-selection";
import {ICursorDataPoint, ITimelineDataPoint} from "./dataInterfaces";
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import {D3DragEvent, drag as d3Drag} from "d3-drag";

type Selection<T1, T2 = T1> = d3Selection<any, T1, any, T2>;

export interface BehaviorOptions {
    selectionManager: ISelectionManager;
    cells: {
        selection: Selection<ITimelineDataPoint>;
        callback: (dataPoint: ITimelineDataPoint, index: number, isMultiSelection: boolean) => void;
        cellWidth: number;
    };
    cursors: {
        selection:  Selection<ICursorDataPoint>
        onDrag: (event: D3DragEvent<any, ICursorDataPoint, ICursorDataPoint>, currentCursor: ICursorDataPoint) => void;
        onEnd: () => void;
    }
    clearCatcher: Selection<any>;
    clearSelectionHandler: () => void;
}

export class Behavior {
    public bindEvents(options: BehaviorOptions) {
        this.handleCellsClick(options);
        this.handleCursorsDrag(options);
        this.clearCatcher(options);
    }

    private handleCursorsDrag(options: BehaviorOptions) {
        const dragBehavior = d3Drag<any, ICursorDataPoint>()
            .subject((_: D3DragEvent<any, ICursorDataPoint, ICursorDataPoint>, cursorDataPoint: ICursorDataPoint) => {
                cursorDataPoint.x = cursorDataPoint.selectionIndex * options.cells.cellWidth;

                return cursorDataPoint;
            })
            .on("drag", null)
            .on("end", null)
            .on("drag", options.cursors.onDrag)
            .on("end", options.cursors.onEnd);

        options.cursors.selection.call(dragBehavior);
    }

    private handleCellsClick(options: BehaviorOptions) {
        const clickHandler = (event: MouseEvent, dataPoint: ITimelineDataPoint) => {
            event.stopPropagation();
            options.cells.callback(dataPoint, dataPoint.index, event.ctrlKey || event.metaKey || event.altKey || event.shiftKey);
        };

        options.cells.selection
            .on("click", null)
            .on("touchstart", null)
            .on("click", clickHandler)
            .on("touchstart", clickHandler);
    }

    private clearCatcher(options: BehaviorOptions) {
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
