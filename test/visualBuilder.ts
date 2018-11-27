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

import powerbi from "powerbi-visuals-api";

import {
    d3Click,
    VisualBuilderBase,
} from "powerbi-visuals-utils-testutils";

import { Timeline } from "../src/visual";
import { TimelineDatePeriodBase } from "../src/datePeriod/datePeriodBase";

export class TimelineBuilder extends VisualBuilderBase<Timeline> {
    constructor(width: number, height: number) {
        super(width, height);

        this.visualHost.applyJsonFilter = () => { };
    }

    protected build(options: powerbi.extensibility.visual.VisualConstructorOptions): Timeline {
        return new Timeline(options);
    }

    public get visualObject(): Timeline {
        return this.visual;
    }

    public get rootElement(): JQuery {
        return this.element.find(".timeline-component");
    }

    public get mainElement(): JQuery {
        return this.element
            .find("svg.timeline");
    }

    public get headerElement(): JQuery {
        return this.element
            .children("div")
            .children("svg");
    }

    public get cellRects(): JQuery {
        return this.mainArea
            .children(".cellsArea")
            .children(".cellRect");
    }

    public get mainArea() {
        return this.mainElement
            .children("g.mainArea");
    }

    public get allLabels() {
        return this.mainArea
            .children("g")
            .children("text.label");
    }

    public get rangeHeaderText() {
        return this.headerElement
            .children("g.rangeTextArea")
            .children("text.selectionRangeContainer");
    }

    public get timelineSlicer() {
        return this.headerElement
            .children("g.timelineSlicer");
    }

    public selectTheLatestCell(): void {
        d3Click(this.mainElement.find(".cellRect").last(), 0, 0);
    }

    public static setDatePeriod(
        dataView: powerbi.DataView,
        datePeriod: TimelineDatePeriodBase): void {

        (dataView.metadata.objects as any).general = {
            datePeriod: datePeriod.toString(),
            isUserSelection: true
        };
    }
}
