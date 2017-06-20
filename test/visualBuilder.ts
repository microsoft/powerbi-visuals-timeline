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

/// <reference path="_references.ts"/>

module powerbi.extensibility.visual.test {
    // powerbi.extensibility.utils.test
    import VisualBuilderBase = powerbi.extensibility.utils.test.VisualBuilderBase;

    // Timeline1447991079100
    import VisualPlugin = powerbi.visuals.plugins.Timeline1447991079100;
    import SandboxedVisualNameSpace = powerbi.extensibility.visual.Timeline1447991079100;
    import VisualClass = SandboxedVisualNameSpace.Timeline;
    import VisualSettings = SandboxedVisualNameSpace.settings.VisualSettings;
    import TimelineDatePeriodBase = SandboxedVisualNameSpace.datePeriod.TimelineDatePeriodBase;

    export class TimelineBuilder extends VisualBuilderBase<VisualClass> {
        constructor(width: number, height: number) {
            super(width, height, VisualPlugin.name);
        }

        protected build(options: VisualConstructorOptions): VisualClass {
            return new VisualClass(options);
        }

        public get visualObject(): VisualClass {
            return this.visual;
        }

        public get mainElement(): JQuery {
            return this.element
                .children("div")
                .children("svg.timeline");
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
            return this.mainElement
                .children("g.rangeTextArea")
                .children("text.selectionRangeContainer");
        }

        public get timelineSlicer() {
            return this.mainElement
                .children("g.timelineSlicer");
        }

        public selectTheLatestCell(dataView: DataView): void {
            this.mainElement
                .find(".cellRect")
                .last()
                .d3Click(0, 0);

            // setSettings(dataView).general.filter = SemanticFilter.getDefaultValueFilter(SQExprBuilder.defaultValue());
        }

        public static setDatePeriod(
            dataView: DataView,
            datePeriod: TimelineDatePeriodBase): void {

            (dataView.metadata.objects as any).general = {
                datePeriod: datePeriod.toString()
            };

            // setSettings(dataView).general.datePeriod = datePeriod.toString();
        }
    }
}
