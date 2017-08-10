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

module powerbi.extensibility.visual {
    // d3
    import Drag = d3.behavior.Drag;
    import Selection = d3.Selection;
    import UpdateSelection = d3.selection.Update;

    // powerbi.data
    import ISQExpr = powerbi.data.ISQExpr;
    import ISemanticFilter = powerbi.data.ISemanticFilter;

    // powerbi.extensibility.utils.type
    import convertToPx = powerbi.extensibility.utils.type.PixelConverter.toString;
    import convertToPt = powerbi.extensibility.utils.type.PixelConverter.fromPoint;
    import fromPointToPixel = powerbi.extensibility.utils.type.PixelConverter.fromPointToPixel;

    // powerbi.extensibility.utils.svg
    import translate = powerbi.extensibility.utils.svg.translate;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    // powerbi.extensibility.utils.formatting
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;

    // powerbi.extensibility.utils.interactivity
    import appendClearCatcher = powerbi.extensibility.utils.interactivity.appendClearCatcher;

    // powerbi.extensibility.utils.chart
    import getLabelFormattedText = powerbi.extensibility.utils.chart.dataLabel.utils.getLabelFormattedText;
    import LabelFormattedTextOptions = powerbi.extensibility.utils.chart.dataLabel.LabelFormattedTextOptions;

    // persistPropertiesAdapter
    import PersistPropertiesAdapter = persistPropertiesAdapter.PersistPropertiesAdapter;

    // scaleUtils
    import getScale = scaleUtils.getScale;
    import ElementScale = scaleUtils.ElementScale;

    // settings
    import VisualSettings = settings.VisualSettings;
    import CellsSettings = settings.CellsSettings;
    import LabelsSettings = settings.LabelsSettings;
    import CalendarSettings = settings.CalendarSettings;
    import GranularitySettings = settings.GranularitySettings;
    import ScaleSizeAdjustment = settings.ScaleSizeAdjustment;

    // granularity
    import GranularityType = granularity.GranularityType;
    import GranularityNames = granularity.GranularityNames;
    import TimelineGranularityData = granularity.TimelineGranularityData;

    // datePeriod
    import TimelineDatePeriod = datePeriod.TimelineDatePeriod;
    import ITimelineDatePeriod = datePeriod.ITimelineDatePeriod;
    import TimelineDatePeriodBase = datePeriod.TimelineDatePeriodBase;

    // utils
    import Utils = utils.Utils;

    export class Timeline implements IVisual {
        private static MinSizeOfViewport: number = 0;

        private static DefaultTextYPosition: number = 50;

        private static CellsYPositionFactor: number = 3;
        private static CellsYPositionOffset: number = 65;

        private static HorizLineSelectionYOffset: number = 2;
        private static DefaultHorizLineSelectionHeight: number = 1;

        private static DefaultVertLineSelectionWidth: number = 2;
        private static DefaultVertLineSelectionHeight: number = 3;

        private static TextLabelsSelectionOffset: number = 3;

        private static SelectedTextSelectionFactor: number = 2;
        private static SelectedTextSelectionYOffset: number = 17;

        private static SelectorPeriodsFactor: number = 2;
        private static DefaultSelectorPeriodsY: number = 3;
        private static DefaultSelectorPeriodsHeight: number = 23;

        private static PeriodSlicerRectSelectionXOffset: number = 6;
        private static PeriodSlicerRectSelectionYOffset: number = 16;
        private static DefaultPeriodSlicerRectSelectionRx: number = 4;
        private static DefaultPeriodSlicerRectSelectionWidth: number = 15;
        private static DefaultPeriodSlicerRectSelectionHeight: number = 23;

        private static LabelSizeFactor: number = 1.5;
        private static TimelinePropertiesHeightOffset: number = 20;

        private static DefaultCursorDatapointX: number = 0;
        private static DefaultCursorDatapointY: number = 0;
        private static DefaultSelectionStartIndex: number = 0;

        private static CellHeightDivider: number = 2;

        private static DefaultFontFamily: string = "arial";

        private static TextWidthMiddleDivider: number = 2;

        private static SvgWidthOffset: number = 1;

        private static DefaultYDiff: number = 1.5;

        private static DefaultOverflow: string = "auto";

        private static TextLabelsSelectionDx: string = "0.5em";

        private static CellWidthLastFactor: number = 0.9;
        private static CellWidthNotLastFactor: number = 3;

        private static LabelIdOffset: number = 0.5;
        private static GranularityNamesLength: number = 2;

        private static DefaultRangeTextSelectionY: number = 40;

        private static TimelineMargins: TimelineMargins = {
            LeftMargin: 15,
            RightMargin: 15,
            TopMargin: 0,
            BottomMargin: 10,
            CellWidth: 40,
            CellHeight: 25,
            StartXpoint: 10,
            StartYpoint: 20,
            ElementWidth: 30,
            MinCellWidth: 30,
            MaxCellHeight: 60,
            PeriodSlicerRectWidth: 15,
            PeriodSlicerRectHeight: 23,
            LegendHeight: 60
        };

        private static filterObjectProperty: { objectName: string, propertyName: string } = {
            objectName: "general",
            propertyName: "filter"
        };

        private static TimelineSelectors: TimelineSelectors = {
            TimelineVisual: createClassAndSelector("timeline"),
            TimelineWrapper: createClassAndSelector("timelineWrapper"),
            SelectionRangeContainer: createClassAndSelector("selectionRangeContainer"),
            textLabel: createClassAndSelector("label"),
            LowerTextCell: createClassAndSelector("lowerTextCell"),
            UpperTextCell: createClassAndSelector("upperTextCell"),
            UpperTextArea: createClassAndSelector("upperTextArea"),
            LowerTextArea: createClassAndSelector("lowerTextArea"),
            RangeTextArea: createClassAndSelector("rangeTextArea"),
            CellsArea: createClassAndSelector("cellsArea"),
            CursorsArea: createClassAndSelector("cursorsArea"),
            MainArea: createClassAndSelector("mainArea"),
            SelectionCursor: createClassAndSelector("selectionCursor"),
            Cell: createClassAndSelector("cell"),
            CellRect: createClassAndSelector("cellRect"),
            VertLine: createClassAndSelector("timelineVertLine"),
            TimelineSlicer: createClassAndSelector("timelineSlicer"),
            PeriodSlicerGranularities: createClassAndSelector("periodSlicerGranularities"),
            PeriodSlicerSelection: createClassAndSelector("periodSlicerSelection"),
            PeriodSlicerSelectionRect: createClassAndSelector("periodSlicerSelectionRect"),
            PeriodSlicerRect: createClassAndSelector("periodSlicerRect")
        };

        private settings: VisualSettings;

        private timelineProperties: TimelineProperties;

        /**
         * It's public for testability
         */
        public timelineData: TimelineData;

        private timelineGranularityData: TimelineGranularityData;

        private rootSelection: Selection<any>;
        private headerSelection: Selection<any>;
        private mainSvgSelection: Selection<any>;

        private rangeTextSelection: Selection<any>;
        private mainGroupSelection: Selection<any>;
        private yearLabelsSelection: Selection<any>;
        private quarterLabelsSelection: Selection<any>;
        private monthLabelsSelection: Selection<any>;
        private weekLabelsSelection: Selection<any>;
        private dayLabelsSelection: Selection<any>;
        private cellsSelection: Selection<any>;
        private cursorGroupSelection: Selection<any>;
        private selectorSelection: Selection<any>;
        private periodSlicerRectSelection: Selection<any>;
        private selectedTextSelection: Selection<any>;
        private vertLineSelection: Selection<any>;
        private horizLineSelection: Selection<any>;
        private textLabelsSelection: Selection<any>;
        private clearCatcherSelection: Selection<any>;

        private granularitySelectors: string[] = ["Y", "Q", "M", "W", "D"];

        private selectionManager: ISelectionManager;

        private options: VisualUpdateOptions;
        private dataView: DataView;

        private svgWidth: number;

        private datePeriod: ITimelineDatePeriod;

        private isThePreviousFilterApplied: boolean = false;

        private initialized: boolean;

        private calendar: Calendar;

        private persistPropertiesAdapter: PersistPropertiesAdapter;
        private host: IVisualHost;

        /**
         * Changes the current granularity depending on the given granularity type
         * Separates the new granularity's date periods which contain the start/end selection
         * Unseparates the date periods of the previous granularity.
         * @param granularity The new granularity type
         */
        public changeGranularity(granularity: GranularityType, startDate: Date, endDate: Date): void {
            Utils.unseparateSelection(this.timelineData.currentGranularity.getDatePeriods());

            this.timelineData.currentGranularity = this.timelineGranularityData.getGranularity(granularity);
            Utils.separateSelection(this.timelineData, startDate, endDate);
        }

        constructor(options: VisualConstructorOptions) {
            this.init(options);
        }

        public init(options: VisualConstructorOptions): void {
            let element: HTMLElement = options.element,
                host: IVisualHost = this.host = options.host;
            this.persistPropertiesAdapter = PersistPropertiesAdapter.create(host);

            this.initialized = false;

            this.selectionManager = host.createSelectionManager();

            this.timelineProperties = {
                textYPosition: Timeline.DefaultTextYPosition,
                cellsYPosition: Timeline.TimelineMargins.TopMargin
                * Timeline.CellsYPositionFactor + Timeline.CellsYPositionOffset,
                topMargin: Timeline.TimelineMargins.TopMargin,
                bottomMargin: Timeline.TimelineMargins.BottomMargin,
                leftMargin: Timeline.TimelineMargins.LeftMargin,
                startXpoint: Timeline.TimelineMargins.StartXpoint,
                startYpoint: Timeline.TimelineMargins.StartYpoint,
                cellWidth: Timeline.TimelineMargins.CellWidth,
                cellHeight: Timeline.TimelineMargins.CellHeight,
                elementWidth: Timeline.TimelineMargins.ElementWidth,
                rightMargin: Timeline.TimelineMargins.RightMargin
            };

            this.rootSelection = d3.select(element)
                .append("div");

            this.headerSelection = this.rootSelection
                .append("svg")
                .attr({
                    width: "100%",
                    height: Timeline.TimelineMargins.LegendHeight
                });

            this.mainSvgSelection = this.rootSelection
                .append("div")
                .classed(Timeline.TimelineSelectors.TimelineWrapper.className, true)
                .append("svg")
                .classed(Timeline.TimelineSelectors.TimelineVisual.className, true);

            this.addElements();
        }

        private addElements(): void {
            this.clearCatcherSelection = appendClearCatcher(this.mainSvgSelection);

            this.clearCatcherSelection
                .on("click", () => this.clear())
                .on("touchstart", () => this.clear());

            this.rangeTextSelection = this.headerSelection
                .append("g")
                .classed(Timeline.TimelineSelectors.RangeTextArea.className, true)
                .append("text");

            this.mainGroupSelection = this.mainSvgSelection
                .append("g")
                .classed(Timeline.TimelineSelectors.MainArea.className, true);

            this.yearLabelsSelection = this.mainGroupSelection.append("g");
            this.quarterLabelsSelection = this.mainGroupSelection.append("g");
            this.monthLabelsSelection = this.mainGroupSelection.append("g");
            this.weekLabelsSelection = this.mainGroupSelection.append("g");
            this.dayLabelsSelection = this.mainGroupSelection.append("g");

            this.cellsSelection = this.mainGroupSelection
                .append("g")
                .classed(Timeline.TimelineSelectors.CellsArea.className, true);

            this.cursorGroupSelection = this.mainSvgSelection
                .append("g")
                .classed(Timeline.TimelineSelectors.CursorsArea.className, true);
        }

        private clear(): void {
            if (this.initialized) {
                this.selectionManager.clear();

                if (this.timelineData) {
                    this.timelineData.selectionStartIndex = Timeline.DefaultSelectionStartIndex;

                    this.timelineData.selectionEndIndex =
                        this.timelineData.currentGranularity.getDatePeriods().length - 1;

                    const hasIrregularDataPoint: boolean = this.timelineData.timelineDatapoints
                        .some((dataPoint: TimelineDatapoint) => dataPoint.index % 1 !== 0);

                    if (hasIrregularDataPoint) {
                        this.selectPeriod(this.timelineData.currentGranularity.getType());
                    }
                    else {
                        Timeline.updateCursors(this.timelineData, this.timelineProperties.cellWidth);

                        this.fillCells(this.settings.cells);

                        this.renderCursors(
                            this.timelineData,
                            this.timelineProperties.cellHeight,
                            this.timelineProperties.cellsYPosition);

                        this.renderTimeRangeText(this.timelineData, this.settings.rangeHeader);
                        this.fillColorGranularity(this.settings.granularity);
                    }

                    this.clearSelection(this.timelineData.filterColumnTarget);
                }
            }
        }

        private drawGranular(timelineProperties: TimelineProperties, granularityType: GranularityType): void {
            const startXpoint: number = timelineProperties.startXpoint,
                startYpoint: number = timelineProperties.startYpoint,
                elementWidth: number = timelineProperties.elementWidth,
                selectorPeriods: string[] = this.granularitySelectors;

            this.selectorSelection = this.headerSelection
                .append("g")
                .classed(Timeline.TimelineSelectors.TimelineSlicer.className, true);

            const dragPeriodRect: Drag<any> = d3.behavior.drag()
                .on("drag", () => {
                    this.selectPeriod(this.getGranularityIndexByPosition((d3.event as MouseEvent).x));
                });

            this.selectorSelection.call(dragPeriodRect);

            // create horiz. line
            this.horizLineSelection = this.selectorSelection.append("rect");

            this.horizLineSelection.attr({
                x: convertToPx(startXpoint),
                y: convertToPx(startYpoint + Timeline.HorizLineSelectionYOffset),
                height: convertToPx(Timeline.DefaultHorizLineSelectionHeight),
                width: convertToPx((selectorPeriods.length - 1) * elementWidth)
            });

            // create vert. lines
            this.vertLineSelection = this.selectorSelection
                .selectAll("vertLines")
                .data(selectorPeriods)
                .enter()
                .append("rect");

            this.vertLineSelection
                .classed(Timeline.TimelineSelectors.VertLine.className, true)
                .attr({
                    x: (d, index) => convertToPx(startXpoint + index * elementWidth),
                    y: convertToPx(startYpoint),
                    width: convertToPx(Timeline.DefaultVertLineSelectionWidth),
                    height: convertToPx(Timeline.DefaultVertLineSelectionHeight)
                });

            // create text lables
            let text = this.selectorSelection
                .selectAll(Timeline.TimelineSelectors.PeriodSlicerGranularities.selectorName)
                .data(selectorPeriods)
                .enter()
                .append("text")
                .classed(Timeline.TimelineSelectors.PeriodSlicerGranularities.className, true);

            this.textLabelsSelection = text
                .text((value: string) => value)
                .attr({
                    x: (d, index: number) => convertToPx(startXpoint
                        - Timeline.TextLabelsSelectionOffset + index * elementWidth),
                    y: convertToPx(startYpoint - Timeline.TextLabelsSelectionOffset),
                    dx: Timeline.TextLabelsSelectionDx
                });

            // create selected period text
            this.selectedTextSelection = this.selectorSelection
                .append("text")
                .classed(Timeline.TimelineSelectors.PeriodSlicerSelection.className, true);

            this.selectedTextSelection
                .text(Utils.getGranularityName(granularityType))
                .attr({
                    x: convertToPx(startXpoint + Timeline.SelectedTextSelectionFactor * elementWidth),
                    y: convertToPx(startYpoint + Timeline.SelectedTextSelectionYOffset),
                });

            const selRects: Selection<string> = this.selectorSelection
                .selectAll(Timeline.TimelineSelectors.PeriodSlicerSelectionRect.selectorName)
                .data(selectorPeriods)
                .enter()
                .append("rect")
                .classed(Timeline.TimelineSelectors.PeriodSlicerSelectionRect.className, true);

            const clickHandler = (d: any, index: number) => {
                this.selectPeriod(index);
            };

            selRects
                .attr({
                    x: (d, index: number) => convertToPx(startXpoint
                        - elementWidth / Timeline.SelectorPeriodsFactor
                        + index * elementWidth),
                    y: convertToPx(Timeline.DefaultSelectorPeriodsY),
                    width: convertToPx(elementWidth),
                    height: convertToPx(Timeline.DefaultSelectorPeriodsHeight)
                })
                .on("mousedown", clickHandler)
                .on("touchstart", clickHandler);

            this.periodSlicerRectSelection = this.selectorSelection
                .append("rect")
                .classed(Timeline.TimelineSelectors.PeriodSlicerRect.className, true)
                .attr({
                    y: convertToPx(startYpoint - Timeline.PeriodSlicerRectSelectionYOffset),
                    rx: convertToPx(Timeline.DefaultPeriodSlicerRectSelectionRx),
                    width: convertToPx(Timeline.DefaultPeriodSlicerRectSelectionWidth),
                    height: convertToPx(Timeline.DefaultPeriodSlicerRectSelectionHeight)
                });

            this.renderGranularitySlicerRect(granularityType);
        }

        public getGranularityIndexByPosition(position: number): number {
            let selectorIndexes: number[],
                scale: ElementScale = getScale(this.rootSelection.node() as HTMLElement),
                scaledPosition: number = position / scale.x; // It takes account of scaling when we use "Fit to page" or "Fit to width".

            selectorIndexes = this.granularitySelectors.map((selector: string, index: number) => {
                return index;
            });

            return Utils.getIndexByPosition(
                selectorIndexes,
                this.timelineProperties.elementWidth,
                scaledPosition,
                this.timelineProperties.startXpoint);
        }

        public doesPeriodSlicerRectPositionNeedToUpdate(granularity: GranularityType): boolean {
            return !(this.periodSlicerRectSelection.datum() === granularity);
        }

        public renderGranularitySlicerRect(granularity: GranularityType): void {
            this.periodSlicerRectSelection.data([granularity]);

            this.periodSlicerRectSelection
                .transition()
                .attr({
                    x: convertToPx(
                        this.timelineProperties.startXpoint
                        - Timeline.PeriodSlicerRectSelectionXOffset
                        + granularity
                        * this.timelineProperties.elementWidth)
                });

            this.selectedTextSelection.text(Utils.getGranularityName(granularity));
        }

        public fillColorGranularity(granularitySettings: GranularitySettings): void {
            const sliderColor: string = granularitySettings.sliderColor,
                scaleColor: string = granularitySettings.scaleColor;

            this.periodSlicerRectSelection.style("stroke", sliderColor);
            this.selectedTextSelection.attr("fill", scaleColor);
            this.textLabelsSelection.attr("fill", scaleColor);
            this.vertLineSelection.attr("fill", scaleColor);
            this.horizLineSelection.attr("fill", scaleColor);
        }

        public redrawPeriod(granularity: GranularityType): void {
            if (this.doesPeriodSlicerRectPositionNeedToUpdate(granularity)) {
                let startDate: Date,
                    endDate: Date;

                this.renderGranularitySlicerRect(granularity);

                startDate = Utils.getStartSelectionDate(this.timelineData);
                endDate = Utils.getEndSelectionDate(this.timelineData);

                this.changeGranularity(granularity, startDate, endDate);
            }
        }

        private static setMeasures(
            labelsSettings: LabelsSettings,
            granularityType: GranularityType,
            datePeriodsCount: number,
            viewport: IViewport,
            timelineProperties: TimelineProperties,
            timelineMargins: TimelineMargins,
            scaleSizeAdjustment: ScaleSizeAdjustment): void {

            timelineProperties.cellsYPosition = timelineProperties.textYPosition;

            let labelSize: number,
                svgHeight: number,
                maxHeight: number,
                height: number,
                width: number;

            labelSize = fromPointToPixel(labelsSettings.textSize);

            if (labelsSettings.show) {
                timelineProperties.cellsYPosition += labelSize
                    * Timeline.LabelSizeFactor
                    * (granularityType + 1);
            }

            svgHeight = Math.max(0, viewport.height - timelineMargins.TopMargin);

            maxHeight = viewport.width - timelineMargins.RightMargin - timelineMargins.MinCellWidth * datePeriodsCount;

            if (scaleSizeAdjustment.show) {
                height = Math.max(
                    timelineMargins.MinCellWidth,
                    Math.min(
                        timelineMargins.MaxCellHeight,
                        maxHeight,
                        svgHeight
                        - timelineProperties.cellsYPosition
                        - Timeline.TimelinePropertiesHeightOffset));
            } else {
                height = timelineMargins.MinCellWidth;
            }

            width = Math.max(
                timelineMargins.MinCellWidth,
                (viewport.width - height - timelineMargins.RightMargin) / datePeriodsCount);

            timelineProperties.cellHeight = height;
            timelineProperties.cellWidth = width;
        }

        private createDatePeriod(dataView: DataView): ITimelineDatePeriod {
            return Utils.getDatePeriod(dataView.categorical.categories[0].values);
        }

        private createTimelineData(dataView: DataView) {
            let startDate: Date,
                endDate: Date,
                datePeriod: TimelineDatePeriodBase,
                resetedStartDate: Date,
                resetedEndDate: Date;

            this.settings = Timeline.parseSettings(dataView);

            datePeriod = this.settings.general.datePeriod as TimelineDatePeriodBase;

            if (datePeriod.startDate && datePeriod.endDate) {
                resetedStartDate = Utils.resetTime(datePeriod.startDate);
                resetedEndDate = Utils.resetTime(Utils.getEndOfThePreviousDate(datePeriod.endDate));

                startDate = this.datePeriod.startDate < resetedStartDate
                    ? this.datePeriod.startDate
                    : resetedStartDate;

                endDate = this.datePeriod.endDate > resetedEndDate
                    ? this.datePeriod.endDate
                    : resetedEndDate;
            } else {
                startDate = this.datePeriod.startDate;
                endDate = this.datePeriod.endDate;
            }

            if (!this.initialized) {
                this.drawGranular(this.timelineProperties, this.settings.granularity.granularity);
                this.fillColorGranularity(this.settings.granularity);
            }

            if (this.initialized) {
                let actualEndDate: Date,
                    daysPeriods: TimelineDatePeriod[],
                    prevStartDate: Date,
                    prevEndDate: Date,
                    changedSelection: boolean,
                    isSemanticFilterAvailableInTheDataView: boolean;

                actualEndDate = TimelineGranularityData.nextDay(endDate);

                daysPeriods = this.timelineGranularityData
                    .getGranularity(GranularityType.day)
                    .getDatePeriods();

                prevStartDate = daysPeriods[0].startDate;

                prevEndDate = daysPeriods[daysPeriods.length - 1].endDate;

                changedSelection =
                    startDate.getTime() !== prevStartDate.getTime()
                    ||
                    actualEndDate.getTime() !== prevEndDate.getTime();

                if (!changedSelection && !this.settings.general.filter) {
                    this.changeGranularity(
                        this.settings.granularity.granularity,
                        startDate,
                        actualEndDate);
                } else {
                    this.initialized = false;
                }
            }

            if (!this.initialized) {
                this.timelineGranularityData = new TimelineGranularityData(
                    startDate,
                    endDate);
                this.timelineData = {
                    timelineDatapoints: [],
                    cursorDataPoints: []
                };
            }
        }

        public static areVisualUpdateOptionsValid(options: VisualUpdateOptions): boolean {
            if (!options
                || !options.dataViews
                || !options.dataViews[0]
                || !options.dataViews[0].metadata
                || !Timeline.isDataViewCategoricalValid(options.dataViews[0].categorical)) {

                return false;
            }

            let dataView: DataView = options.dataViews[0],
                columnExp: ISQExpr = dataView.categorical.categories[0].source.expr,
                valueType: string;

            valueType = columnExp
                ? columnExp["level"]
                : null;

            if (!(dataView.categorical.categories[0].source.type.dateTime
                || (dataView.categorical.categories[0].source.type.numeric
                    && (valueType === "Year" || valueType === "Date")))) {
                return false;
            }

            return true;
        }

        public static isDataViewCategoricalValid(dataViewCategorical: DataViewCategorical): boolean {
            return !(!dataViewCategorical
                || !dataViewCategorical.categories
                || dataViewCategorical.categories.length !== 1
                || !dataViewCategorical.categories[0].values
                || dataViewCategorical.categories[0].values.length === 0
                || !dataViewCategorical.categories[0].source
                || !dataViewCategorical.categories[0].source.type);
        }

        public update(options: VisualUpdateOptions): void {
            if (!Timeline.areVisualUpdateOptionsValid(options)) {
                this.clearData();
                return;
            }
            this.options = options;
            this.dataView = options.dataViews[0];
            this.datePeriod = this.createDatePeriod(options.dataViews[0]);
            this.createTimelineData(this.dataView);
            const datePeriod: TimelineDatePeriodBase = this.settings.general.datePeriod as TimelineDatePeriodBase;
            this.updateCalendar(this.settings);
            this.initialized = true;

            if (datePeriod.startDate && datePeriod.endDate) {
                this.applySelection(options, datePeriod);
            } else {
                this.render(
                    this.timelineData,
                    this.settings,
                    this.timelineProperties,
                    options);
            }
            this.renderGranularitySlicerRect(this.settings.granularity.granularity);

            if (!this.isThePreviousFilterApplied) {
                this.applyThePreviousFilter(options, datePeriod);

                this.isThePreviousFilterApplied = true;
            }
        }

        private applyThePreviousFilter(options: VisualUpdateOptions, datePeriod: TimelineDatePeriodBase): void {
            let target: IFilterColumnTarget = this.timelineData.filterColumnTarget;

            if (!datePeriod.startDate || !datePeriod.endDate) {
                this.clearSelection(target);

                return;
            }

            this.applyDatePeriod(
                datePeriod.startDate,
                datePeriod.endDate,
                target);

            this.applySelection(options, datePeriod);
        }

        private applySelection(options: VisualUpdateOptions, datePeriod: TimelineDatePeriodBase): void {
            this.changeGranularity(
                this.settings.granularity.granularity,
                datePeriod.startDate,
                datePeriod.endDate);

            this.updateCalendar(this.settings);

            this.render(this.timelineData, this.settings, this.timelineProperties, options);
        }

        private selectPeriod(granularityType: GranularityType): void {
            if (this.timelineData.currentGranularity.getType() !== granularityType) {
                this.persistPropertiesAdapter.persistProperties({
                    objectInstance: {
                        objectName: "granularity",
                        selector: null,
                        properties: { granularity: granularityType }
                    }
                });

                this.settings.granularity.granularity = granularityType;
            }

            this.redrawPeriod(granularityType);

            this.updateCalendar(this.settings);

            this.render(
                this.timelineData,
                this.settings,
                this.timelineProperties,
                this.options);
        }

        private updateCalendar(timelineFormat: VisualSettings): void {
            this.calendar = Timeline.converter(
                this.timelineData,
                this.timelineProperties,
                this.timelineGranularityData,
                this.options.dataViews[0],
                this.initialized,
                timelineFormat,
                this.options.viewport,
                this.calendar);
        }

        private static isDataViewValid(dataView): boolean {
            if (!dataView
                || !dataView.categorical
                || !dataView.metadata
                || dataView.categorical.categories.length <= 0
                || !dataView.categorical.categories[0]
                || !dataView.categorical.categories[0].identityFields
                || dataView.categorical.categories[0].identityFields.length <= 0) {

                return true;
            }

            return false;
        }

        /**
         * TODO: We need to simplify this method.
         */
        public static converter(
            timelineData: TimelineData,
            timelineProperties: TimelineProperties,
            timelineGranularityData: TimelineGranularityData,
            dataView: DataView,
            initialized: boolean,
            timelineSettings: VisualSettings,
            viewport: IViewport,
            previousCalendar: Calendar): Calendar {

            if (this.isDataViewValid(dataView)) {
                return null;
            }

            let calendar: Calendar,
                isCalendarChanged: boolean,
                startDate: Date,
                endDate: Date,
                timelineElements: TimelineDatePeriod[],
                countFullCells: number;
            if (!initialized) {
                timelineData.cursorDataPoints = [{
                    x: Timeline.DefaultCursorDatapointX,
                    y: Timeline.DefaultCursorDatapointY,
                    selectionIndex: Timeline.DefaultSelectionStartIndex,
                    cursorIndex: 0
                },
                {
                    x: Timeline.DefaultCursorDatapointX,
                    y: Timeline.DefaultCursorDatapointY,
                    selectionIndex: Timeline.DefaultSelectionStartIndex,
                    cursorIndex: 1
                }];
            }

            isCalendarChanged = previousCalendar
                && previousCalendar.isChanged(timelineSettings.calendar, timelineSettings.weekDay);

            if (timelineData && timelineData.currentGranularity) {
                startDate = Utils.getStartSelectionDate(timelineData);
                endDate = Utils.getEndSelectionDate(timelineData);
            }

            if (!initialized || isCalendarChanged) {
                calendar = new Calendar(timelineSettings.calendar, timelineSettings.weekDay);

                timelineGranularityData.createGranularities(calendar);
                timelineGranularityData.createLabels();
                timelineData.currentGranularity = timelineGranularityData.getGranularity(
                    timelineSettings.granularity.granularity);
            } else {
                calendar = previousCalendar;

            }
            if (!initialized) {
                timelineData.selectionStartIndex = 0;
                timelineData.selectionEndIndex = timelineData.currentGranularity.getDatePeriods().length - 1;
            }

            const category: DataViewCategoryColumn = dataView.categorical.categories[0];
            timelineData.filterColumnTarget = {
                table: category.source.queryName.substr(0, category.source.queryName.indexOf(".")),
                column: category.source.displayName
            };

            if (category.source.type.numeric) {
                (<any>timelineData.filterColumnTarget).ref = "Date";
            }

            if (isCalendarChanged && startDate && endDate) {
                Utils.separateSelection(timelineData, startDate, endDate);
            }

            timelineElements = timelineData.currentGranularity.getDatePeriods();

            timelineData.timelineDatapoints = [];

            for (let currentTimePeriod of timelineElements) {
                const datapoint: TimelineDatapoint = {
                    index: currentTimePeriod.index,
                    datePeriod: currentTimePeriod
                };

                timelineData.timelineDatapoints.push(datapoint);
            }

            countFullCells = timelineData.currentGranularity
                .getDatePeriods()
                .filter((datePeriod: TimelineDatePeriod) => {
                    return datePeriod.index % 1 === 0;
                })
                .length;

            Timeline.setMeasures(
                timelineSettings.labels,
                timelineData.currentGranularity.getType(),
                countFullCells,
                viewport,
                timelineProperties,
                Timeline.TimelineMargins,
                timelineSettings.scaleSizeAdjustment
            );

            Timeline.updateCursors(timelineData, timelineProperties.cellWidth);

            return calendar;
        }

        private render(
            timelineData: TimelineData,
            timelineSettings: VisualSettings,
            timelineProperties: TimelineProperties,
            options: VisualUpdateOptions): void {

            let timelineDatapointsCount = this.timelineData.timelineDatapoints
                .filter((dataPoint: TimelineDatapoint) => {
                    return dataPoint.index % 1 === 0;
                })
                .length;

            this.svgWidth = Timeline.SvgWidthOffset
                + this.timelineProperties.cellHeight
                + timelineProperties.cellWidth * timelineDatapointsCount;

            this.renderTimeRangeText(timelineData, timelineSettings.rangeHeader);
            this.fillColorGranularity(this.settings.granularity);

            this.rootSelection
                .attr({
                    height: convertToPx(options.viewport.height),
                    width: convertToPx(options.viewport.width),
                    "drag-resize-disabled": true
                })
                .style({
                    "overflow-x": Timeline.DefaultOverflow,
                    "overflow-y": Timeline.DefaultOverflow
                });

            this.mainSvgSelection.attr({
                height: convertToPx(Math.max(
                    Timeline.MinSizeOfViewport,
                    options.viewport.height - Timeline.TimelineMargins.TopMargin)),
                width: convertToPx(Math.max(
                    Timeline.MinSizeOfViewport,
                    this.svgWidth))
            });

            let fixedTranslateString: string = translate(
                timelineProperties.leftMargin,
                timelineProperties.topMargin);

            let translateString: string = translate(
                timelineProperties.cellHeight / Timeline.CellHeightDivider,
                timelineProperties.topMargin);

            this.mainGroupSelection.attr("transform", translateString);
            this.selectorSelection.attr("transform", fixedTranslateString);
            this.cursorGroupSelection.attr("transform", translateString);

            let extendedLabels = this.timelineData.currentGranularity.getExtendedLabel(),
                granularityType = this.timelineData.currentGranularity.getType();

            let yPos: number = 0,
                yDiff: number = Timeline.DefaultYDiff;

            this.renderLabels(
                extendedLabels.yearLabels,
                this.yearLabelsSelection,
                yPos,
                granularityType === 0);

            yPos += yDiff;

            this.renderLabels(
                extendedLabels.quarterLabels,
                this.quarterLabelsSelection,
                yPos,
                granularityType === 1);

            yPos += yDiff;

            this.renderLabels(
                extendedLabels.monthLabels,
                this.monthLabelsSelection,
                yPos,
                granularityType === 2);

            yPos += yDiff;

            this.renderLabels(
                extendedLabels.weekLabels,
                this.weekLabelsSelection,
                yPos,
                granularityType === 3);

            yPos += yDiff;

            this.renderLabels(
                extendedLabels.dayLabels,
                this.dayLabelsSelection,
                yPos,
                granularityType === 4);

            this.renderCells(timelineData, timelineProperties);

            this.renderCursors(
                timelineData,
                timelineProperties.cellHeight,
                timelineProperties.cellsYPosition);
        }

        private renderLabels(
            labels: TimelineLabel[],
            labelsElement: Selection<any>,
            index: number,
            isLast: boolean): void {

            let labelTextSelection: Selection<TimelineLabel>;

            labelTextSelection = labelsElement.selectAll(Timeline.TimelineSelectors.textLabel.selectorName);

            if (!this.settings.labels.show) {
                labelTextSelection.remove();
                return;
            }

            let labelsGroupSelection: UpdateSelection<TimelineLabel> = labelTextSelection.data(labels);
            const fontSize: string = convertToPt(this.settings.labels.textSize);

            labelsGroupSelection
                .enter()
                .append("text")
                .classed(Timeline.TimelineSelectors.textLabel.className, true);
            labelsGroupSelection
                .text((label: TimelineLabel, id: number) => {
                    if (!isLast && id === 0 && labels.length > 1) {
                        let textProperties: TextProperties = {
                            text: labels[0].text,
                            fontFamily: Timeline.DefaultFontFamily,
                            fontSize: fontSize
                        };

                        let halfFirstTextWidth = textMeasurementService.measureSvgTextWidth(textProperties)
                            / Timeline.TextWidthMiddleDivider;

                        textProperties = {
                            text: labels[1].text,
                            fontFamily: Timeline.DefaultFontFamily,
                            fontSize: fontSize
                        };

                        const halfSecondTextWidth = textMeasurementService.measureSvgTextWidth(textProperties)
                            / Timeline.TextWidthMiddleDivider;

                        const diff: number = this.timelineProperties.cellWidth
                            * (labels[1].id - labels[0].id);

                        if (diff < halfFirstTextWidth + halfSecondTextWidth) {
                            return "";
                        }
                    }

                    const labelFormattedTextOptions: LabelFormattedTextOptions = {
                        label: label.text,
                        maxWidth: this.timelineProperties.cellWidth * (isLast
                            ? Timeline.CellWidthLastFactor
                            : Timeline.CellWidthNotLastFactor),
                        fontSize: this.settings.labels.textSize
                    };

                    return getLabelFormattedText(labelFormattedTextOptions);
                })
                .style("font-size", convertToPt(this.settings.labels.textSize))
                .attr({
                    x: (label: TimelineLabel) => {
                        return (label.id + Timeline.LabelIdOffset) * this.timelineProperties.cellWidth;
                    },
                    y: this.timelineProperties.textYPosition
                    + (1 + index) * fromPointToPixel(this.settings.labels.textSize),
                    fill: this.settings.labels.fontColor
                })
                .append("title")
                .text((label: TimelineLabel) => label.title);

            labelsGroupSelection
                .exit()
                .remove();
        }

        private clearData(): void {
            this.initialized = false;

            this.mainGroupSelection
                .selectAll(Timeline.TimelineSelectors.CellRect.selectorName)
                .remove();

            this.mainGroupSelection
                .selectAll(Timeline.TimelineSelectors.textLabel.selectorName)
                .remove();

            this.rangeTextSelection.text("");

            this.cursorGroupSelection
                .selectAll(Timeline.TimelineSelectors.SelectionCursor.selectorName)
                .remove();

            this.mainSvgSelection
                .attr("width", 0)
                .selectAll(Timeline.TimelineSelectors.TimelineSlicer.selectorName)
                .remove();
        }

        private static updateCursors(timelineData: TimelineData, cellWidth: number): void {
            let startDate: TimelineDatePeriod = timelineData.timelineDatapoints[timelineData.selectionStartIndex].datePeriod,
                endDate: TimelineDatePeriod = timelineData.timelineDatapoints[timelineData.selectionEndIndex].datePeriod;

            timelineData.cursorDataPoints[0].selectionIndex = startDate.index;
            timelineData.cursorDataPoints[1].selectionIndex = endDate.index + endDate.fraction;
        }

        private static parseSettings(dataView: DataView): VisualSettings {
            const settings: VisualSettings = VisualSettings.parse<VisualSettings>(dataView);

            Timeline.setValidCalendarSettings(settings.calendar);

            settings.general.datePeriod = TimelineDatePeriodBase.parse(settings.general.datePeriod as string);

            return settings;
        }

        /**
         * Public for testability.
         */
        public static setValidCalendarSettings(calendarSettings: CalendarSettings): void {
            const defaultSettings: VisualSettings = VisualSettings.getDefault() as VisualSettings,
                theLatestDayOfMonth: number = Utils.getTheLatestDayOfMonth(calendarSettings.month);

            calendarSettings.day = Math.max(
                defaultSettings.calendar.day,
                Math.min(theLatestDayOfMonth, calendarSettings.day));
        }

        public fillCells(cellsSettings: CellsSettings): void {
            const dataPoints: TimelineDatapoint[] = this.timelineData.timelineDatapoints,
                cellSelection: UpdateSelection<TimelineDatapoint> = this.mainGroupSelection
                    .selectAll(Timeline.TimelineSelectors.CellRect.selectorName)
                    .data(dataPoints);

            cellSelection.attr("fill", (dataPoint: TimelineDatapoint) => {
                return Utils.getCellColor(dataPoint, this.timelineData, cellsSettings);
            });
        }

        public renderCells(timelineData: TimelineData, timelineProperties: TimelineProperties): void {
            let dataPoints: TimelineDatapoint[] = timelineData.timelineDatapoints,
                totalX: number = 0;

            let cellsSelection = this.cellsSelection
                .selectAll(Timeline.TimelineSelectors.CellRect.selectorName)
                .data(dataPoints);

            cellsSelection
                .enter()
                .append("rect")
                .classed(Timeline.TimelineSelectors.CellRect.className, true);

            cellsSelection
                .attr({
                    x: (dataPoint: TimelineDatapoint) => {
                        let position: number = totalX;

                        totalX += dataPoint.datePeriod.fraction * timelineProperties.cellWidth;

                        return convertToPx(position);
                    },
                    y: convertToPx(timelineProperties.cellsYPosition),
                    height: convertToPx(timelineProperties.cellHeight),
                    width: (dataPoint: TimelineDatapoint) => {
                        return convertToPx(dataPoint.datePeriod.fraction * timelineProperties.cellWidth);
                    }
                });

            let clickHandler = (dataPoint: TimelineDatapoint, index: number) => {
                const event: MouseEvent = d3.event as MouseEvent;

                this.onCellClickHandler(dataPoint, index, event.altKey || event.shiftKey);
            };

            cellsSelection
                .on("click", clickHandler)
                .on("touchstart", clickHandler);

            this.fillCells(this.settings.cells);

            cellsSelection
                .exit()
                .remove();
        }

        private onCellClickHandler(
            dataPoint: TimelineDatapoint,
            index: number,
            isMultiSelection: boolean): void {

            let timelineData: TimelineData = this.timelineData,
                cursorDataPoints: CursorDatapoint[] = timelineData.cursorDataPoints,
                timelineProperties: TimelineProperties = this.timelineProperties;

            if (isMultiSelection) {
                if (this.timelineData.selectionEndIndex < index) {
                    cursorDataPoints[1].selectionIndex = dataPoint.datePeriod.index + dataPoint.datePeriod.fraction;
                    timelineData.selectionEndIndex = index;
                }
                else {
                    cursorDataPoints[0].selectionIndex = dataPoint.datePeriod.index;
                    timelineData.selectionStartIndex = index;
                }
            } else {
                timelineData.selectionStartIndex = index;
                timelineData.selectionEndIndex = index;

                cursorDataPoints[0].selectionIndex = dataPoint.datePeriod.index;
                cursorDataPoints[1].selectionIndex = dataPoint.datePeriod.index + dataPoint.datePeriod.fraction;
            }

            this.fillCells(this.settings.cells);

            this.renderCursors(
                timelineData,
                timelineProperties.cellHeight,
                timelineProperties.cellsYPosition);

            this.renderTimeRangeText(timelineData, this.settings.rangeHeader);
            this.fillColorGranularity(this.settings.granularity);
            this.setSelection(timelineData);
        }

        public cursorDrag(currentCursor: CursorDatapoint): void {
            let cursorOverElement: TimelineCursorOverElement = this.findCursorOverElement((d3.event as MouseEvent).x);

            if (!cursorOverElement) {
                return;
            }

            let currentlyMouseOverElement: TimelineDatapoint = cursorOverElement.datapoint,
                currentlyMouseOverElementIndex: number = cursorOverElement.index;

            if (currentCursor.cursorIndex === 0 && currentlyMouseOverElementIndex <= this.timelineData.selectionEndIndex) {
                this.timelineData.selectionStartIndex = currentlyMouseOverElementIndex;
                this.timelineData.cursorDataPoints[0].selectionIndex = currentlyMouseOverElement.datePeriod.index;
            }

            if (currentCursor.cursorIndex === 1 && currentlyMouseOverElementIndex >= this.timelineData.selectionStartIndex) {
                this.timelineData.selectionEndIndex = currentlyMouseOverElementIndex;

                this.timelineData.cursorDataPoints[1].selectionIndex =
                    currentlyMouseOverElement.datePeriod.index + currentlyMouseOverElement.datePeriod.fraction;
            }

            this.fillCells(this.settings.cells);

            this.renderCursors(
                this.timelineData,
                this.timelineProperties.cellHeight,
                this.timelineProperties.cellsYPosition);

            this.renderTimeRangeText(this.timelineData, this.settings.rangeHeader);
            this.fillColorGranularity(this.settings.granularity);
        }

        /**
         * Note: Public for testability.
         */
        public findCursorOverElement(position: number): TimelineCursorOverElement {
            let timelineDatapoints: TimelineDatapoint[] = this.timelineData.timelineDatapoints || [],
                cellWidth: number = this.timelineProperties.cellWidth,
                timelineDatapointIndexes: number[],
                index: number;

            timelineDatapointIndexes = timelineDatapoints.map((datapoint: TimelineDatapoint) => {
                return datapoint.index;
            });

            index = Utils.getIndexByPosition(
                timelineDatapointIndexes,
                cellWidth,
                position);

            if (!timelineDatapoints[index]) {
                return null;
            }

            return {
                index: index,
                datapoint: timelineDatapoints[index]
            };
        }

        public cursorDragended(): void {
            this.setSelection(this.timelineData);
        }

        private cursorDragBehavior: Drag<CursorDatapoint> = d3.behavior.drag()
            .origin((cursorDataPoint: CursorDatapoint) => {
                cursorDataPoint.x = cursorDataPoint.selectionIndex * this.timelineProperties.cellWidth;

                return cursorDataPoint;
            })
            .on("drag", (cursorDataPoint: CursorDatapoint) => {
                this.cursorDrag(cursorDataPoint);
            })
            .on("dragend", () => {
                this.cursorDragended();
            });

        public renderCursors(
            timelineData: TimelineData,
            cellHeight: number,
            cellsYPosition: number): UpdateSelection<any> {

            const cursorSelection: UpdateSelection<CursorDatapoint> = this.cursorGroupSelection
                .selectAll(Timeline.TimelineSelectors.SelectionCursor.selectorName)
                .data(timelineData.cursorDataPoints);

            cursorSelection
                .enter()
                .append("path")
                .classed(Timeline.TimelineSelectors.SelectionCursor.className, true);

            cursorSelection
                .attr("transform", (cursorDataPoint: CursorDatapoint) => {
                    let dx: number,
                        dy: number;

                    dx = cursorDataPoint.selectionIndex * this.timelineProperties.cellWidth;
                    dy = cellHeight / Timeline.CellHeightDivider + cellsYPosition;

                    return translate(dx, dy);
                })
                .attr({
                    d: d3.svg.arc<CursorDatapoint>()
                        .innerRadius(0)
                        .outerRadius(cellHeight / Timeline.CellHeightDivider)
                        .startAngle((cursorDataPoint: CursorDatapoint) => {
                            return cursorDataPoint.cursorIndex * Math.PI + Math.PI;
                        })
                        .endAngle((cursorDataPoint: CursorDatapoint) => {
                            return cursorDataPoint.cursorIndex * Math.PI + 2 * Math.PI;
                        })
                })
                .call(this.cursorDragBehavior);

            cursorSelection
                .exit()
                .remove();

            return cursorSelection;
        }

        public renderTimeRangeText(timelineData: TimelineData, rangeHeaderSettings: LabelsSettings): void {
            const leftMargin: number = (GranularityNames.length + Timeline.GranularityNamesLength)
                * this.timelineProperties.elementWidth;

            const maxWidth: number = this.svgWidth
                - leftMargin
                - this.timelineProperties.leftMargin
                - rangeHeaderSettings.textSize;

            if (rangeHeaderSettings.show && maxWidth > 0) {
                const timeRangeText: string = Utils.timeRangeText(timelineData);

                const labelFormattedTextOptions: LabelFormattedTextOptions = {
                    label: timeRangeText,
                    maxWidth: maxWidth,
                    fontSize: rangeHeaderSettings.textSize
                };

                const actualText: string = getLabelFormattedText(labelFormattedTextOptions);

                this.rangeTextSelection
                    .classed(Timeline.TimelineSelectors.SelectionRangeContainer.className, true)
                    .attr({
                        x: GranularityNames.length
                        * (this.timelineProperties.elementWidth + this.timelineProperties.leftMargin),
                        y: Timeline.DefaultRangeTextSelectionY,
                        fill: rangeHeaderSettings.fontColor
                    })
                    .style({
                        "font-size": convertToPt(rangeHeaderSettings.textSize)
                    })
                    .text(actualText)
                    .append("title")
                    .text(timeRangeText);
            }
            else {
                this.rangeTextSelection.text("");
            }
        }

        public setSelection(timelineData: TimelineData): void {
            if (Utils.areBoundsOfSelectionAndAvailableDatesTheSame(timelineData)) {
                this.clearSelection(timelineData.filterColumnTarget);

                return;
            }

            this.applyDatePeriod(
                Utils.getStartSelectionDate(timelineData),
                Utils.getEndSelectionDate(timelineData),
                timelineData.filterColumnTarget);
        }

        private applyFilter(datePeriod: TimelineDatePeriodBase): void {
            const instance: VisualObjectInstance = {
                objectName: "general",
                selector: undefined,
                properties: {
                    datePeriod: datePeriod.toString()
                }
            };

            this.host.persistProperties({
                merge: [
                    instance
                ]
            });
        }
        public applyDatePeriod(startDate: Date, endDate: Date, target: IFilterColumnTarget): void {
            const datePeriod: TimelineDatePeriodBase =
                startDate && endDate
                    ? TimelineDatePeriodBase.create(startDate, endDate)
                    : TimelineDatePeriodBase.createEmpty();

            this.applyFilter(datePeriod);

            const filter: IAdvancedFilter = new window["powerbi-models"].AdvancedFilter(
                target,
                "And",
                {
                    operator: "GreaterThanOrEqual",
                    value: startDate
                        ? startDate.toJSON()
                        : this.datePeriod.startDate
                },
                {
                    operator: "LessThan",
                    value: endDate
                        ? endDate.toJSON()
                        : this.datePeriod.endDate
                });

            this.host.applyJsonFilter(filter, Timeline.filterObjectProperty.objectName, Timeline.filterObjectProperty.propertyName);
        }

        public clearSelection(target: IFilterColumnTarget): void {
            this.applyDatePeriod(null, null, target);
        }

        /**
         * This function returns the values to be displayed in the property pane for each object.
         * Usually it is a bind pass of what the property pane gave you, but sometimes you may want to do
         * validation and return other values/defaults.
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            if (options.objectName === "general") {
                return [];
            }

            const settings: VisualSettings = this.settings
                || VisualSettings.getDefault() as VisualSettings;

            return VisualSettings.enumerateObjectInstances(
                settings,
                options);
        }
    }
}
