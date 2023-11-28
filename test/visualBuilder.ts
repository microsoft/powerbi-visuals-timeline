/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import powerbiVisualsApi from "powerbi-visuals-api";

import {
    AdvancedFilter,
} from "powerbi-models";

import {
    VisualBuilderBase,
} from "powerbi-visuals-utils-testutils";

import { DatePeriodBase } from "../src/datePeriod/datePeriodBase";
import { Timeline } from "../src/timeLine";

export class VisualBuilder extends VisualBuilderBase<Timeline> {
    public static SET_DATE_PERIOD(
        dataView: powerbiVisualsApi.DataView,
        datePeriod: DatePeriodBase): void {

        (<any>(dataView.metadata.objects)).general = {
            datePeriod: datePeriod.toString(),
            isUserSelection: true,
        };
    }

    private jsonFilters: powerbiVisualsApi.IFilter[] = [];

    constructor(width: number, height: number) {
        super(width, height);

        this.visualHost.applyJsonFilter = () => {
            // No need to implement it
        };
    }

    public get visualObject(): Timeline {
        return this.visual;
    }

    public get rootElement(): HTMLElement {
        return this.element.querySelector<HTMLElement>(".timeline-component");
    }

    public get mainElement(): SVGElement {
        return this.element.querySelector<SVGElement>("svg.timeline");
    }

    public get headerElement(): SVGElement {
        return this.element.querySelector<SVGElement>("div > div > svg");
    }

    public get mainArea(): HTMLElement {
        return this.mainElement.querySelector<HTMLElement>("g.mainArea");
    }

    public get cellRects() {
        return this.mainArea.querySelectorAll(".cellsArea > .cellRect");
    }

    public get lastCellRect() {
        const cells = this.cellRects;
        return cells[cells.length - 1];
    }

    public get allLabels(): NodeListOf<HTMLElement> {
        return this.mainArea.querySelectorAll("g > text.label");
    }

    public get rangeHeaderText(): HTMLElement {
        return this.headerElement.querySelector<HTMLElement>("g.rangeTextArea > text.selectionRangeContainer");
    }

    public get timelineSlicer(): HTMLElement {
        return this.headerElement.querySelector<HTMLElement>("g.timelineSlicer");
    }

    public setFilter(startDate: Date, endDate: Date): void {
        const filter = new AdvancedFilter(
            {
                column: "Test",
                table: "Demo",
            },
            "And",
            {
                operator: "GreaterThanOrEqual",
                value: startDate,
            },
            {
                operator: "LessThanOrEqual",
                value: endDate,
            },
        );

        this.jsonFilters = [filter];
    }

    public update(dataView) {
        this.visual.update({
            dataViews: [].concat(dataView),
            jsonFilters: this.jsonFilters,
            type: undefined,
            viewport: this.viewport,
        });
    }

    protected build(options: powerbiVisualsApi.extensibility.visual.VisualConstructorOptions): Timeline {
        return new Timeline(options);
    }
}
