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

import "../style/visual.less";

import {
    select as d3Select,
    selectAll as d3SelectAll,
    Selection as D3Selection,
} from "d3-selection";

import {
    drag as d3Drag,
} from "d3-drag";

import {
    arc as d3Arc,
} from "d3-shape";

import powerbi from "powerbi-visuals-api";
import {
    IFilterColumnTarget,
    AdvancedFilter,
} from "powerbi-models";

import {
    CssConstants,
    manipulation as svgManipulation
} from "powerbi-visuals-utils-svgutils";

import { pixelConverter } from "powerbi-visuals-utils-typeutils";
import { interactivityService } from "powerbi-visuals-utils-interactivityutils";

import { textMeasurementService } from "powerbi-visuals-utils-formattingutils";
import {
    dataLabelInterfaces,
    dataLabelUtils,
} from "powerbi-visuals-utils-chartutils";

import {
    CursorDatapoint,
    TimelineCursorOverElement,
    ITimelineData,
    TimelineDatapoint,
    TimelineLabel,
    TimelineMargins,
    TimelineProperties,
    TimelineSelectors,
} from "./dataInterfaces";

import {
    CalendarSettings,
    CellsSettings,
    LabelsSettings,
    VisualSettings,
    ScaleSizeAdjustment,
} from "./settings";

import { TimelineGranularityData } from "./granularity/granularityData";
import { GranularityType } from "./granularity/granularityType";
import { GranularityNames } from "./granularity/granularityNames";

import {
    ITimelineDatePeriodBase,
    ITimelineDatePeriod,
} from "./datePeriod/datePeriod";

import { TimelineDatePeriodBase } from "./datePeriod/datePeriodBase";

import { Calendar } from "./calendar";
import { Utils } from "./utils";

export class Timeline implements powerbi.extensibility.visual.IVisual {
    private static MinSizeOfViewport: number = 0;

    private static DefaultTextYPosition: number = 50;

    private static CellsYPositionFactor: number = 3;
    private static CellsYPositionOffset: number = 65;

    private static SelectedTextSelectionFactor: number = 2;
    private static SelectedTextSelectionYOffset: number = 17;

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
        MinCellWidth: 45,
        MinCellHeight: 30,
        MaxCellHeight: 60,
        PeriodSlicerRectWidth: 15,
        PeriodSlicerRectHeight: 23,
        LegendHeight: 50,
        LegendHeightOffset: 5,
        HeightOffset: 75
    };

    private static filterObjectProperty: { objectName: string, propertyName: string } = {
        objectName: "general",
        propertyName: "filter"
    };

    private static TimelineSelectors: TimelineSelectors = {
        TimelineVisual: CssConstants.createClassAndSelector("timeline"),
        TimelineWrapper: CssConstants.createClassAndSelector("timelineWrapper"),
        SelectionRangeContainer: CssConstants.createClassAndSelector("selectionRangeContainer"),
        textLabel: CssConstants.createClassAndSelector("label"),
        LowerTextCell: CssConstants.createClassAndSelector("lowerTextCell"),
        UpperTextCell: CssConstants.createClassAndSelector("upperTextCell"),
        UpperTextArea: CssConstants.createClassAndSelector("upperTextArea"),
        LowerTextArea: CssConstants.createClassAndSelector("lowerTextArea"),
        RangeTextArea: CssConstants.createClassAndSelector("rangeTextArea"),
        CellsArea: CssConstants.createClassAndSelector("cellsArea"),
        CursorsArea: CssConstants.createClassAndSelector("cursorsArea"),
        MainArea: CssConstants.createClassAndSelector("mainArea"),
        SelectionCursor: CssConstants.createClassAndSelector("selectionCursor"),
        Cell: CssConstants.createClassAndSelector("cell"),
        CellRect: CssConstants.createClassAndSelector("cellRect"),
        TimelineSlicer: CssConstants.createClassAndSelector("timelineSlicer"),
        PeriodSlicerGranularities: CssConstants.createClassAndSelector("periodSlicerGranularities"),
        PeriodSlicerSelection: CssConstants.createClassAndSelector("periodSlicerSelection"),
        PeriodSlicerSelectionRect: CssConstants.createClassAndSelector("periodSlicerSelectionRect"),
        PeriodSlicerRect: CssConstants.createClassAndSelector("periodSlicerRect")
    };

    private settings: VisualSettings;

    private timelineProperties: TimelineProperties;

    /**
     * It's public for testability
     */
    public timelineData: ITimelineData;

    private timelineGranularityData: TimelineGranularityData;

    private rootSelection: D3Selection<any, any, any, any>;
    private headerSelection: D3Selection<any, any, any, any>;
    private mainSvgSelection: D3Selection<any, any, any, any>;
    private mainSvgWrapperSelection: D3Selection<any, any, any, any>;

    private rangeTextSelection: D3Selection<any, any, any, any>;
    private mainGroupSelection: D3Selection<any, any, any, any>;
    private yearLabelsSelection: D3Selection<any, any, any, any>;
    private quarterLabelsSelection: D3Selection<any, any, any, any>;
    private monthLabelsSelection: D3Selection<any, any, any, any>;
    private weekLabelsSelection: D3Selection<any, any, any, any>;
    private dayLabelsSelection: D3Selection<any, any, any, any>;
    private cellsSelection: D3Selection<any, any, any, any>;
    private cursorGroupSelection: D3Selection<any, any, any, any>;
    private selectorSelection: D3Selection<any, any, any, any>;
    private clearCatcherSelection: D3Selection<any, any, any, any>;

    private selectionManager: powerbi.extensibility.ISelectionManager;

    private options: powerbi.extensibility.visual.VisualUpdateOptions;
    private dataView: powerbi.DataView;

    private svgWidth: number;

    private datePeriod: ITimelineDatePeriodBase;
    private prevFilteredStartDate: Date | null = null;
    private prevFilteredEndDate: Date | null = null;
    private prevGranularity: GranularityType | null = null;

    private initialized: boolean;

    private calendar: Calendar;

    private host: powerbi.extensibility.visual.IVisualHost;

    private locale: string;
    private localizationManager: powerbi.extensibility.ILocalizationManager;
    private horizontalAutoScrollingPositionOffset: number = 200;

    private selectedGranulaPos: number = null;

    private scrollAutoFocusFunc = (selectedGranulaPos: number) => {
        if (selectedGranulaPos) {
            (this.mainSvgWrapperSelection[0][0] as any).scrollLeft = selectedGranulaPos - this.horizontalAutoScrollingPositionOffset;
        }
    }

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

    constructor(options: powerbi.extensibility.visual.VisualConstructorOptions) {
        let element: HTMLElement = options.element;

        this.host = options.host;

        this.initialized = false;
        this.locale = this.host.locale;

        this.selectionManager = this.host.createSelectionManager();
        this.localizationManager = this.host.createLocalizationManager();

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

        this.rootSelection = d3Select(element)
            .append("div");

        this.headerSelection = this.rootSelection
            .append("svg")
            .attr("width", "100%")
            .attr("height", Timeline.TimelineMargins.LegendHeight);

        this.mainSvgWrapperSelection = this.rootSelection
            .append("div")
            .classed(Timeline.TimelineSelectors.TimelineWrapper.className, true);

        this.mainSvgSelection = this.mainSvgWrapperSelection
            .append("svg")
            .classed(Timeline.TimelineSelectors.TimelineVisual.className, true);

        this.addElements();
    }

    private addElements(): void {
        this.clearCatcherSelection = interactivityService.appendClearCatcher(this.mainSvgSelection);

        this.clearCatcherSelection
            .on("click", () => {
                if (!this.settings.forceSelection.currentPeriod && !this.settings.forceSelection.latestAvailableDate) {
                    this.clear();
                }
            })
            .on("touchstart", () => {
                if (!this.settings.forceSelection.currentPeriod && !this.settings.forceSelection.latestAvailableDate) {
                    this.clear();
                }
            });

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

    public clear(): void {
        if (this.initialized) {
            this.selectionManager.clear();

            if (this.timelineData) {
                this.clearSelection(this.timelineData.filterColumnTarget);
            }
        }
    }

    public doesPeriodSlicerRectPositionNeedToUpdate(granularity: GranularityType): boolean {
        let sliderSelection = d3Select("rect.periodSlicerRect");
        if (sliderSelection && sliderSelection.datum() === granularity) {
            return false;
        }

        return true;
    }

    public redrawPeriod(granularity: GranularityType): void {
        if (this.doesPeriodSlicerRectPositionNeedToUpdate(granularity)) {
            let startDate: Date,
                endDate: Date;

            startDate = Utils.getStartSelectionDate(this.timelineData);
            endDate = Utils.getEndSelectionDate(this.timelineData);

            this.changeGranularity(granularity, startDate, endDate);
        }
    }

    private static setMeasures(
        labelsSettings: LabelsSettings,
        granularityType: GranularityType,
        datePeriodsCount: number,
        viewport: powerbi.IViewport,
        timelineProperties: TimelineProperties,
        timelineMargins: TimelineMargins,
        scaleSizeAdjustment: ScaleSizeAdjustment,
        labelFontSize: number = 9
    ): void {

        timelineProperties.cellsYPosition = timelineProperties.textYPosition;

        let labelSize: number,
            svgHeight: number,
            maxHeight: number,
            height: number,
            width: number;

        labelSize = pixelConverter.fromPointToPixel(labelsSettings.textSize);

        if (labelsSettings.show) {
            let granularityOffset: number = labelsSettings.displayAll ? granularityType + 1 : 1;
            timelineProperties.cellsYPosition += labelSize
                * Timeline.LabelSizeFactor
                * granularityOffset;
        }

        svgHeight = Math.max(0, viewport.height - timelineMargins.TopMargin);

        maxHeight = viewport.width - timelineMargins.RightMargin - timelineMargins.MinCellWidth * datePeriodsCount;

        if (scaleSizeAdjustment.show) {
            height = Math.max(
                timelineMargins.MinCellHeight,
                Math.min(
                    timelineMargins.MaxCellHeight,
                    maxHeight,
                    svgHeight
                    - timelineProperties.cellsYPosition
                    - Timeline.TimelinePropertiesHeightOffset));
        } else {
            height = timelineMargins.MinCellHeight;
        }

        width = Math.max(
            timelineMargins.MinCellWidth,
            (viewport.width - height - timelineMargins.RightMargin) / datePeriodsCount);

        timelineProperties.cellHeight = height;
        timelineProperties.cellWidth = width;
    }

    private createDatePeriod(dataView: powerbi.DataView): ITimelineDatePeriodBase {
        return Utils.getDatePeriod(dataView.categorical.categories[0].values);
    }

    private createTimelineData(
        timelineSettings: VisualSettings,
        startDate: Date,
        endDate: Date,
        timelineGranularityData: TimelineGranularityData,
        locale: string,
        localizationManager: powerbi.extensibility.ILocalizationManager
    ) {
        let calendar = new Calendar(timelineSettings.calendar, timelineSettings.weekDay);

        timelineGranularityData.createGranularities(calendar, locale, localizationManager);
        timelineGranularityData.createLabels();

        if (this.initialized) {
            let actualEndDate: Date,
                daysPeriods: ITimelineDatePeriod[],
                prevStartDate: Date,
                prevEndDate: Date,
                changedSelection: boolean;

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

            if (!changedSelection) {
                this.changeGranularity(
                    this.settings.granularity.granularity,
                    startDate,
                    actualEndDate
                );
            } else {
                this.initialized = false;
            }
        }
    }

    public static selectCurrentPeriod(
        datePeriod: ITimelineDatePeriodBase,
        granularity: GranularityType,
        calendar
    ) {
        return this.selectPeriod(datePeriod, granularity, calendar, Utils.resetTime(new Date()));
    }

    public static selectPeriod(
        datePeriod: ITimelineDatePeriodBase,
        granularity: GranularityType,
        calendar,
        periodDate: Date
    ) {
        let startDate: Date = periodDate,
            endDate: Date;
        switch (granularity) {
            case GranularityType.day:
                endDate = calendar.getNextDate(periodDate);
                break;
            case GranularityType.week:
                ({ startDate, endDate } = calendar.getWeekPeriod(periodDate));
                break;
            case GranularityType.month:
                ({ startDate, endDate } = calendar.getMonthPeriod(periodDate));
                break;
            case GranularityType.quarter:
                ({ startDate, endDate } = calendar.getQuarterPeriod(periodDate));
                break;
            case GranularityType.year:
                ({ startDate, endDate } = calendar.getYearPeriod(periodDate));
                break;
        }

        if (granularity === GranularityType.day) {
            const checkDatesForDayGranularity: boolean =
                datePeriod.startDate <= startDate && endDate <= datePeriod.endDate ||
                startDate.toString() === datePeriod.endDate.toString();

            if (!checkDatesForDayGranularity) {
                startDate = null;
                endDate = null;
            }
        } else {
            const startDateAvailable = (datePeriod.startDate <= startDate && startDate <= datePeriod.endDate);
            const endDateAvailable = (datePeriod.startDate <= endDate && endDate <= datePeriod.endDate);

            if (!startDateAvailable && !endDateAvailable) {
                startDate = null;
                endDate = null;
            }
        }

        return { startDate, endDate };
    }

    public static areVisualUpdateOptionsValid(options: powerbi.extensibility.visual.VisualUpdateOptions): boolean {
        if (!options
            || !options.dataViews
            || !options.dataViews[0]
            || !options.dataViews[0].metadata
            || !Timeline.isDataViewCategoricalValid(options.dataViews[0].categorical)) {

            return false;
        }

        let dataView: powerbi.DataView = options.dataViews[0];
        let columnExp: any = dataView.categorical.categories[0].source.expr;
        let valueType: string;

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

    public static isDataViewCategoricalValid(dataViewCategorical: powerbi.DataViewCategorical): boolean {
        return !(!dataViewCategorical
            || !dataViewCategorical.categories
            || dataViewCategorical.categories.length !== 1
            || !dataViewCategorical.categories[0].values
            || dataViewCategorical.categories[0].values.length === 0
            || !dataViewCategorical.categories[0].source
            || !dataViewCategorical.categories[0].source.type);
    }

    public update(options: powerbi.extensibility.visual.VisualUpdateOptions): void {
        if (!Timeline.areVisualUpdateOptionsValid(options)) {
            this.clearData();
            return;
        }

        this.options = options;
        this.dataView = options.dataViews[0];

        // it contains dates from data view.
        this.datePeriod = this.createDatePeriod(this.dataView);

        // Setting parsing was moved here from createTimelineData because settings values may be modified before the function is called.
        this.settings = Timeline.parseSettings(
            this.dataView,
            this.options.jsonFilters as AdvancedFilter[],
            this.host.colorPalette,
        );

        if (!this.initialized) {
            this.timelineData = {
                timelineDatapoints: [],
                cursorDataPoints: []
            };
        }

        this.timelineGranularityData = new TimelineGranularityData(
            this.datePeriod.startDate,
            this.datePeriod.endDate);

        this.createTimelineData(
            this.settings,
            this.datePeriod.startDate,
            this.datePeriod.endDate,
            this.timelineGranularityData,
            this.locale,
            this.localizationManager
        );

        this.updateCalendar(this.settings);

        // It contains date boundaties that was taken from current slicer filter (filter range).
        // If nothing is selected in slicer the boundaries will be null.
        const filterDatePeriod: TimelineDatePeriodBase = this.settings.general.datePeriod as TimelineDatePeriodBase;

        // There may be the case when date boundaries that taken from data view are less than slicer filter dates.
        // The case may happen if there is another timeline slicer that works with the same data and already applied a filter.
        // In that case we need to correct slice filter dates.
        if (filterDatePeriod.startDate
            && this.datePeriod.startDate
            && filterDatePeriod.startDate.getTime() < this.datePeriod.startDate.getTime()
        ) {
            filterDatePeriod.startDate = null;
        }
        // End date from data is always less than date from slicer filter.
        // This means that we need to correct it before check.
        let adaptedDataEndDate: Date = null;
        if (this.datePeriod.endDate) {
            adaptedDataEndDate = new Date(this.datePeriod.endDate as any);
            adaptedDataEndDate.setDate(adaptedDataEndDate.getDate() + 1);
        }
        if (filterDatePeriod.endDate && adaptedDataEndDate && filterDatePeriod.endDate.getTime() > adaptedDataEndDate.getTime()) {
            filterDatePeriod.endDate = null;
        }
        const datePeriod: ITimelineDatePeriodBase = this.datePeriod;

        const granularity = this.settings.granularity.granularity;
        const currentForceSelection: boolean = this.settings.forceSelection.currentPeriod;
        const latestAvailableDate: boolean = this.settings.forceSelection.latestAvailableDate;
        const isUserSelection: boolean = this.settings.general.isUserSelection && !currentForceSelection && !latestAvailableDate;
        const target: IFilterColumnTarget = this.timelineData.filterColumnTarget;

        let currentForceSelectionResult = { startDate: null, endDate: null };

        if (currentForceSelection) {
            currentForceSelectionResult = ({
                startDate: filterDatePeriod.startDate,
                endDate: filterDatePeriod.endDate
            } = Timeline.selectCurrentPeriod(datePeriod, granularity, this.calendar));
        }
        if (latestAvailableDate && (!currentForceSelection ||
            (currentForceSelection && !currentForceSelectionResult.startDate && !currentForceSelectionResult.endDate))) {
            filterDatePeriod.endDate = adaptedDataEndDate;
            ({
                startDate: filterDatePeriod.startDate,
                endDate: filterDatePeriod.endDate
            } = Timeline.selectPeriod(datePeriod, granularity, this.calendar, this.datePeriod.endDate));
        }

        if (this.prevGranularity !== granularity) {
            this.applyFilterSettingsInCapabilities(false);
        }

        const filterWasChanged: boolean =
            String(this.prevFilteredStartDate) !== String(filterDatePeriod.startDate) ||
            String(this.prevFilteredEndDate) !== String(filterDatePeriod.endDate);

        if ((!isUserSelection && filterWasChanged) ||
            (!this.initialized && !currentForceSelection)) {
            this.applyDatePeriod(filterDatePeriod.startDate, filterDatePeriod.endDate, target, isUserSelection);
        }

        this.prevFilteredStartDate = filterDatePeriod.startDate;
        this.prevFilteredEndDate = filterDatePeriod.endDate;

        this.prevGranularity = granularity;

        if (!this.initialized) {
            this.initialized = true;
        }

        if (filterDatePeriod.startDate && filterDatePeriod.endDate) {
            this.changeGranularity(
                this.settings.granularity.granularity,
                filterDatePeriod.startDate,
                filterDatePeriod.endDate);
            this.updateCalendar(this.settings);
        }

        const startXpoint: number = this.timelineProperties.startXpoint,
            elementWidth: number = this.timelineProperties.elementWidth;

        d3SelectAll("g." + Timeline.TimelineSelectors.TimelineSlicer.className).remove();

        this.selectorSelection = this.headerSelection
            .append("g")
            .classed(Timeline.TimelineSelectors.TimelineSlicer.className, true);

        this.timelineGranularityData.renderGranularities({
            selection: this.selectorSelection,
            granularSettings: this.settings.granularity,
            selectPeriodCallback: (granularityType: GranularityType) => { this.selectPeriod(granularityType); }
        });

        // create selected period text
        this.selectorSelection
            .append("text")
            .attr("fill", this.settings.granularity.scaleColor)
            .classed(Timeline.TimelineSelectors.PeriodSlicerSelection.className, true)
            .text(this.localizationManager.getDisplayName(Utils.getGranularityNameKey(granularity)))
            .attr("x", pixelConverter.toString(startXpoint + Timeline.SelectedTextSelectionFactor * elementWidth))
            .attr("y", pixelConverter.toString(Timeline.SelectedTextSelectionYOffset));

        this.render(
            this.timelineData,
            this.settings,
            this.timelineProperties,
            options
        );
    }

    public selectPeriod(granularityType: GranularityType): void {
        if (this.timelineData.currentGranularity.getType() !== granularityType) {
            this.host.persistProperties({
                merge: [{
                    objectName: "granularity",
                    selector: null,
                    properties: { granularity: granularityType }
                }]
            });

            this.settings.granularity.granularity = granularityType;

            return;
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
            this.calendar,
            this.settings,
            this.locale,
            this.host.createLocalizationManager());
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
        timelineData: ITimelineData,
        timelineProperties: TimelineProperties,
        timelineGranularityData: TimelineGranularityData,
        dataView: powerbi.DataView,
        initialized: boolean,
        timelineSettings: VisualSettings,
        viewport: powerbi.IViewport,
        previousCalendar: Calendar,
        setting: VisualSettings,
        locale: string,
        localizationManager: powerbi.extensibility.ILocalizationManager
    ): Calendar {

        if (this.isDataViewValid(dataView)) {
            return null;
        }

        let calendar: Calendar,
            isCalendarChanged: boolean,
            startDate: Date,
            endDate: Date,
            timelineElements: ITimelineDatePeriod[],
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
            timelineData.currentGranularity = timelineGranularityData.getGranularity(
                timelineSettings.granularity.granularity);
        } else {
            calendar = previousCalendar;

        }
        if (!initialized) {
            timelineData.selectionStartIndex = 0;
            timelineData.selectionEndIndex = timelineData.currentGranularity.getDatePeriods().length - 1;
        }

        const category: powerbi.DataViewCategoryColumn = dataView.categorical.categories[0];
        let categoryExpr: any = category.source && category.source.expr ? category.source.expr as any : null;
        let filteringColumn: string = categoryExpr && categoryExpr.arg && categoryExpr.arg.arg && categoryExpr.arg.arg.property ? categoryExpr.arg.arg.property : category.source.displayName;
        // category.source.queryName contains wrong table name in case when table was renamed! category.source.expr.source.entity contains correct table name.
        // category.source.displayName contains wrong column name in case when Hierarchy mode of showing date was chosen
        timelineData.filterColumnTarget = {
            table: categoryExpr && categoryExpr.source && categoryExpr.source.entity ? categoryExpr.source.entity : category.source.queryName.substr(0, category.source.queryName.indexOf(".")),
            column: filteringColumn
        };

        if (category.source.type.numeric) {
            (<any>timelineData.filterColumnTarget).ref = "Date";
        }

        if (isCalendarChanged && startDate && endDate) {
            Utils.unseparateSelection(timelineData.currentGranularity.getDatePeriods());
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
            .filter((datePeriod: ITimelineDatePeriod) => {
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
            timelineSettings.scaleSizeAdjustment,
            setting.labels.textSize
        );

        Timeline.updateCursors(timelineData);

        return calendar;
    }

    private render(
        timelineData: ITimelineData,
        timelineSettings: VisualSettings,
        timelineProperties: TimelineProperties,
        options: powerbi.extensibility.visual.VisualUpdateOptions
    ): void {

        let timelineDatapointsCount = this.timelineData.timelineDatapoints
            .filter((dataPoint: TimelineDatapoint) => {
                return dataPoint.index % 1 === 0;
            })
            .length;

        this.svgWidth = Timeline.SvgWidthOffset
            + this.timelineProperties.cellHeight
            + timelineProperties.cellWidth * timelineDatapointsCount;

        this.renderTimeRangeText(timelineData, timelineSettings.rangeHeader);

        this.rootSelection
            .attr("drag-resize-disabled", true)
            .style("overflow-x", Timeline.DefaultOverflow)
            .style("overflow-y", Timeline.DefaultOverflow)
            .style("height", pixelConverter.toString(options.viewport.height))
            .style("width", pixelConverter.toString(options.viewport.width));

        const legendFullHeight: number = Timeline.TimelineMargins.LegendHeight + Timeline.TimelineMargins.LegendHeightOffset;

        this.mainSvgWrapperSelection.style(
            "height",
            pixelConverter.toString(Math.max(
                Timeline.MinSizeOfViewport,
                options.viewport.height - legendFullHeight - Timeline.TimelineMargins.TopMargin))
        );

        const mainAreaHeight: number = timelineProperties.cellsYPosition - Timeline.TimelineMargins.LegendHeight
            + timelineProperties.cellHeight;
        const mainSvgHeight: number = Timeline.TimelineMargins.TopMargin + Timeline.TimelineMargins.LegendHeightOffset
            + mainAreaHeight;

        this.mainSvgSelection
            .attr("height", pixelConverter.toString(Math.max(
                Timeline.MinSizeOfViewport, mainSvgHeight
            )))
            .attr("width", this.svgWidth < options.viewport.width
                ? "100%"
                : pixelConverter.toString(Math.max(
                    Timeline.MinSizeOfViewport,
                    this.svgWidth
                ))
            );

        let fixedTranslateString: string = svgManipulation.translate(
            timelineProperties.leftMargin,
            timelineProperties.topMargin + this.timelineProperties.startYpoint);

        let translateString: string = svgManipulation.translate(
            timelineProperties.cellHeight / Timeline.CellHeightDivider,
            timelineProperties.topMargin - (Timeline.TimelineMargins.LegendHeight - Timeline.TimelineMargins.LegendHeightOffset));

        this.mainGroupSelection.attr("transform", translateString);
        this.selectorSelection.attr("transform", fixedTranslateString);
        this.cursorGroupSelection.attr("transform", translateString);

        let extendedLabels = this.timelineData.currentGranularity.getExtendedLabel(),
            granularityType = this.timelineData.currentGranularity.getType();

        let yPos: number = 0,
            yDiff: number = Timeline.DefaultYDiff;

        // Removing currently displayed labels
        this.mainGroupSelection
            .selectAll(Timeline.TimelineSelectors.textLabel.selectorName)
            .remove();

        if (timelineSettings.labels.displayAll || granularityType === GranularityType.year) {
            this.renderLabels(
                extendedLabels.yearLabels,
                this.yearLabelsSelection,
                yPos,
                granularityType === 0);
            yPos += yDiff;
        }

        if (timelineSettings.labels.displayAll || granularityType === GranularityType.quarter) {
            this.renderLabels(
                extendedLabels.quarterLabels,
                this.quarterLabelsSelection,
                yPos,
                granularityType === 1);
            yPos += yDiff;
        }

        if (timelineSettings.labels.displayAll || granularityType === GranularityType.month) {
            this.renderLabels(
                extendedLabels.monthLabels,
                this.monthLabelsSelection,
                yPos,
                granularityType === 2);
            yPos += yDiff;
        }

        if (timelineSettings.labels.displayAll || granularityType === GranularityType.week) {
            this.renderLabels(
                extendedLabels.weekLabels,
                this.weekLabelsSelection,
                yPos,
                granularityType === 3);
            yPos += yDiff;
        }

        if (timelineSettings.labels.displayAll || granularityType === GranularityType.day) {
            this.renderLabels(
                extendedLabels.dayLabels,
                this.dayLabelsSelection,
                yPos,
                granularityType === 4);
            yPos += yDiff;
        }

        this.renderCells(timelineData, timelineProperties);

        this.renderCursors(
            timelineData,
            timelineProperties.cellHeight,
            timelineProperties.cellsYPosition);

        this.scrollAutoFocusFunc(this.selectedGranulaPos);
    }

    private renderLabels(
        labels: TimelineLabel[],
        labelsElement: D3Selection<any, any, any, any>,
        index: number,
        isLast: boolean): void {

        let labelTextSelection: D3Selection<any, TimelineLabel, any, any> = labelsElement
            .selectAll(Timeline.TimelineSelectors.textLabel.selectorName);

        if (!this.settings.labels.show) {
            labelTextSelection.remove();
            return;
        }

        let labelsGroupSelection: D3Selection<any, TimelineLabel, any, any> = labelTextSelection.data(labels);
        const fontSize: string = pixelConverter.fromPoint(this.settings.labels.textSize);

        labelsGroupSelection
            .enter()
            .append("text")
            .classed(Timeline.TimelineSelectors.textLabel.className, true)
            .merge(labelsGroupSelection)
            .text((label: TimelineLabel, id: number) => {
                if (!isLast && id === 0 && labels.length > 1) {
                    let textProperties: textMeasurementService.TextProperties = {
                        text: labels[0].text,
                        fontFamily: Timeline.DefaultFontFamily,
                        fontSize: fontSize
                    };

                    let halfFirstTextWidth = textMeasurementService.textMeasurementService.measureSvgTextWidth(textProperties)
                        / Timeline.TextWidthMiddleDivider;

                    textProperties = {
                        text: labels[1].text,
                        fontFamily: Timeline.DefaultFontFamily,
                        fontSize: fontSize
                    };

                    const halfSecondTextWidth = textMeasurementService.textMeasurementService.measureSvgTextWidth(textProperties)
                        / Timeline.TextWidthMiddleDivider;

                    const diff: number = this.timelineProperties.cellWidth
                        * (labels[1].id - labels[0].id);

                    if (diff < halfFirstTextWidth + halfSecondTextWidth) {
                        return "";
                    }
                }

                const labelFormattedTextOptions: dataLabelInterfaces.LabelFormattedTextOptions = {
                    label: label.text,
                    maxWidth: this.timelineProperties.cellWidth * (isLast
                        ? Timeline.CellWidthLastFactor
                        : Timeline.CellWidthNotLastFactor),
                    fontSize: this.settings.labels.textSize
                };

                return dataLabelUtils.getLabelFormattedText(labelFormattedTextOptions);
            })
            .style("font-size", pixelConverter.fromPoint(this.settings.labels.textSize))
            .attr("x", (label: TimelineLabel) => {
                return (label.id + Timeline.LabelIdOffset) * this.timelineProperties.cellWidth;
            })
            .attr("y", this.timelineProperties.textYPosition
                + (1 + index) * pixelConverter.fromPointToPixel(this.settings.labels.textSize)
            )
            .attr("fill", this.settings.labels.fontColor)
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

    private static updateCursors(timelineData: ITimelineData): void {
        let startDate: ITimelineDatePeriod = timelineData.timelineDatapoints[timelineData.selectionStartIndex].datePeriod,
            endDate: ITimelineDatePeriod = timelineData.timelineDatapoints[timelineData.selectionEndIndex].datePeriod;

        timelineData.cursorDataPoints[0].selectionIndex = startDate.index;
        timelineData.cursorDataPoints[1].selectionIndex = endDate.index + endDate.fraction;
    }

    private static parseSettings(
        dataView: powerbi.DataView,
        jsonFilters: AdvancedFilter[],
        colorPalette: powerbi.extensibility.ISandboxExtendedColorPalette
    ): VisualSettings {
        const settings: VisualSettings = VisualSettings.parse<VisualSettings>(dataView);

        Timeline.setValidCalendarSettings(settings.calendar);

        if (jsonFilters
            && jsonFilters[0]
            && jsonFilters[0].conditions
            && jsonFilters[0].conditions[0]
            && jsonFilters[0].conditions[1]
        ) {
            const startDate: Date = new Date(`${jsonFilters[0].conditions[0].value}`);
            const endDate: Date = new Date(`${jsonFilters[0].conditions[1].value}`);

            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                settings.general.datePeriod = TimelineDatePeriodBase.create(startDate, endDate);
            } else {
                settings.general.datePeriod = TimelineDatePeriodBase.createEmpty();
            }
        } else {
            settings.general.datePeriod = TimelineDatePeriodBase.createEmpty();
        }

        if (colorPalette.isHighContrast) {
            const {
                foreground,
                background,
            } = colorPalette;

            settings.rangeHeader.fontColor = foreground.value;

            settings.cells.fillSelected = foreground.value;
            settings.cells.fillUnselected = background.value;
            settings.cells.strokeColor = foreground.value;
            settings.cells.selectedStrokeColor = background.value;

            settings.granularity.scaleColor = foreground.value;
            settings.granularity.sliderColor = foreground.value;

            settings.labels.fontColor = foreground.value;

            settings.cursor.color = foreground.value;
        }

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

    public fillCells(visSettings: VisualSettings): void {
        const dataPoints: TimelineDatapoint[] = this.timelineData.timelineDatapoints;

        const cellSelection: D3Selection<any, TimelineDatapoint, any, any> = this.mainGroupSelection
            .selectAll(Timeline.TimelineSelectors.CellRect.selectorName)
            .data(dataPoints);

        const cellsSettings: CellsSettings = visSettings.cells;

        let singleCaseDone: boolean = false;

        cellSelection
            .attr("fill", (dataPoint: TimelineDatapoint, index: number) => {
                let isSelected: Boolean = Utils.isGranuleSelected(dataPoint, this.timelineData, cellsSettings);

                if (visSettings.scrollAutoAdjustment.show && isSelected && !singleCaseDone) {
                    const selectedGranulaPos: number = (cellSelection[0][index] as any).x.baseVal.value;
                    this.selectedGranulaPos = selectedGranulaPos;
                    singleCaseDone = true;
                }

                return isSelected
                    ? cellsSettings.fillSelected
                    : (cellsSettings.fillUnselected || Utils.DefaultCellColor);
            })
            .style("stroke", (dataPoint: TimelineDatapoint) => {
                let isSelected: Boolean = Utils.isGranuleSelected(dataPoint, this.timelineData, cellsSettings);

                return isSelected
                    ? cellsSettings.selectedStrokeColor
                    : cellsSettings.strokeColor;
            });
    }

    public renderCells(timelineData: ITimelineData, timelineProperties: TimelineProperties): void {
        let dataPoints: TimelineDatapoint[] = timelineData.timelineDatapoints,
            totalX: number = 0;

        let cellsSelection: D3Selection<any, TimelineDatapoint, any, any> = this.cellsSelection
            .selectAll(Timeline.TimelineSelectors.CellRect.selectorName)
            .data(dataPoints);

        cellsSelection
            .enter()
            .append("rect")
            .classed(Timeline.TimelineSelectors.CellRect.className, true)
            .merge(cellsSelection)
            .attr("x", (dataPoint: TimelineDatapoint) => {
                let position: number = totalX;

                totalX += dataPoint.datePeriod.fraction * timelineProperties.cellWidth;

                return pixelConverter.toString(position);
            })
            .attr("y", pixelConverter.toString(timelineProperties.cellsYPosition))
            .attr("height", pixelConverter.toString(timelineProperties.cellHeight))
            .attr("width", (dataPoint: TimelineDatapoint) => {
                return pixelConverter.toString(dataPoint.datePeriod.fraction * timelineProperties.cellWidth);
            });


        let clickHandler = (dataPoint: TimelineDatapoint, index: number) => {
            // If something from Force Selection settings group is enabled, any user filters has no sense
            if (this.settings.forceSelection.currentPeriod || this.settings.forceSelection.latestAvailableDate) {
                return;
            }

            const event: MouseEvent = require("d3").event as MouseEvent;

            this.onCellClickHandler(dataPoint, index, event.altKey || event.shiftKey);
        };

        cellsSelection
            .on("click", clickHandler)
            .on("touchstart", clickHandler);

        this.fillCells(this.settings);

        cellsSelection
            .exit()
            .remove();
    }

    private onCellClickHandler(
        dataPoint: TimelineDatapoint,
        index: number,
        isMultiSelection: boolean): void {

        let timelineData: ITimelineData = this.timelineData,
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

        this.fillCells(this.settings);

        this.renderCursors(
            timelineData,
            timelineProperties.cellHeight,
            timelineProperties.cellsYPosition);

        this.renderTimeRangeText(timelineData, this.settings.rangeHeader);
        this.setSelection(timelineData);
    }

    public onCursorDrag(currentCursor: CursorDatapoint): void {
        let cursorOverElement: TimelineCursorOverElement = this.findCursorOverElement((require("d3").event as MouseEvent).x);

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

        this.fillCells(this.settings);

        this.renderCursors(
            this.timelineData,
            this.timelineProperties.cellHeight,
            this.timelineProperties.cellsYPosition);

        this.renderTimeRangeText(this.timelineData, this.settings.rangeHeader);
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

    public onCursorDragEnd(): void {
        this.setSelection(this.timelineData);
    }

    private cursorDragBehavior = d3Drag<any, CursorDatapoint>()
        .subject((cursorDataPoint: CursorDatapoint) => {
            cursorDataPoint.x = cursorDataPoint.selectionIndex * this.timelineProperties.cellWidth;

            return cursorDataPoint;
        })
        .on("drag", (cursorDataPoint: CursorDatapoint) => {
            if (this.settings.forceSelection.currentPeriod || this.settings.forceSelection.latestAvailableDate) {
                return;
            }

            this.onCursorDrag(cursorDataPoint);
        })
        .on("end", () => {
            if (this.settings.forceSelection.currentPeriod || this.settings.forceSelection.latestAvailableDate) {
                return;
            }

            this.onCursorDragEnd();
        });

    public renderCursors(
        timelineData: ITimelineData,
        cellHeight: number,
        cellsYPosition: number
    ): D3Selection<any, any, any, any> {

        const cursorSelection: D3Selection<any, CursorDatapoint, any, any> = this.cursorGroupSelection
            .selectAll(Timeline.TimelineSelectors.SelectionCursor.selectorName)
            .data(timelineData.cursorDataPoints);

        cursorSelection
            .enter()
            .append("path")
            .classed(Timeline.TimelineSelectors.SelectionCursor.className, true)
            .merge(cursorSelection)
            .attr("transform", (cursorDataPoint: CursorDatapoint) => {
                const dx: number = cursorDataPoint.selectionIndex * this.timelineProperties.cellWidth;
                const dy: number = cellHeight / Timeline.CellHeightDivider + cellsYPosition;

                return svgManipulation.translate(dx, dy);
            })
            .attr("d", d3Arc<CursorDatapoint>()
                .innerRadius(0)
                .outerRadius(cellHeight / Timeline.CellHeightDivider)
                .startAngle((cursorDataPoint: CursorDatapoint) => {
                    return cursorDataPoint.cursorIndex * Math.PI + Math.PI;
                })
                .endAngle((cursorDataPoint: CursorDatapoint) => {
                    return cursorDataPoint.cursorIndex * Math.PI + 2 * Math.PI;
                })
            )
            .style("fill", this.settings.cursor.color)
            .call(this.cursorDragBehavior);

        cursorSelection
            .exit()
            .remove();

        return cursorSelection;
    }

    public renderTimeRangeText(timelineData: ITimelineData, rangeHeaderSettings: LabelsSettings): void {
        const leftMargin: number = (GranularityNames.length + Timeline.GranularityNamesLength)
            * this.timelineProperties.elementWidth;

        const maxWidth: number = this.svgWidth
            - leftMargin
            - this.timelineProperties.leftMargin
            - rangeHeaderSettings.textSize;

        if (rangeHeaderSettings.show && maxWidth > 0) {
            const timeRangeText: string = Utils.timeRangeText(timelineData);

            const labelFormattedTextOptions: dataLabelInterfaces.LabelFormattedTextOptions = {
                label: timeRangeText,
                maxWidth: maxWidth,
                fontSize: rangeHeaderSettings.textSize
            };

            const actualText: string = dataLabelUtils.getLabelFormattedText(labelFormattedTextOptions);

            this.rangeTextSelection
                .classed(Timeline.TimelineSelectors.SelectionRangeContainer.className, true)

                .attr("x", GranularityNames.length
                    * (this.timelineProperties.elementWidth + this.timelineProperties.leftMargin))
                .attr("y", Timeline.DefaultRangeTextSelectionY)
                .attr("fill", rangeHeaderSettings.fontColor)
                .style("font-size", pixelConverter.fromPointToPixel(rangeHeaderSettings.textSize))
                .text(actualText)
                .append("title")
                .text(timeRangeText);
        }
        else {
            this.rangeTextSelection.text("");
        }
    }

    public setSelection(timelineData: ITimelineData): void {
        if (Utils.areBoundsOfSelectionAndAvailableDatesTheSame(timelineData)) {
            this.clearSelection(timelineData.filterColumnTarget);

            return;
        }

        this.applyDatePeriod(
            Utils.getStartSelectionDate(timelineData),
            Utils.getEndSelectionDate(timelineData),
            timelineData.filterColumnTarget,
            true
        );
    }

    private applyFilterSettingsInCapabilities(isUserSelection: boolean, isClearPeriod?: boolean): void {
        console.log("applyFilterSettingsInCapabilities");
        const instanceOfGeneral: powerbi.VisualObjectInstance = {
            objectName: "general",
            selector: undefined,
            properties: {
                isUserSelection: isUserSelection
            }
        };

        if (isClearPeriod) {
            instanceOfGeneral.properties["datePeriod"] = null;
        }

        this.host.persistProperties({
            merge: [
                instanceOfGeneral
            ]
        });
    }

    public applyDatePeriod(
        startDate: Date,
        endDate: Date,
        target: IFilterColumnTarget,
        isUserSelection: boolean
    ): void {
        this.applyFilterSettingsInCapabilities(isUserSelection, startDate === null && endDate === null ? true : false);

        const isMerge: boolean = (typeof startDate !== "undefined" && typeof endDate !== "undefined"
            && startDate !== null && endDate !== null);

        this.host.applyJsonFilter(
            this.createFilter(startDate, endDate, target),
            Timeline.filterObjectProperty.objectName,
            Timeline.filterObjectProperty.propertyName,
            isMerge
                ? powerbi.FilterAction.merge
                : powerbi.FilterAction.remove
        );
    }

    public createFilter(startDate: Date, endDate: Date, target: IFilterColumnTarget): AdvancedFilter {
        if (startDate == null || endDate == null || !target) {
            return null;
        }

        return new AdvancedFilter(
            target,
            "And",
            {
                operator: "GreaterThanOrEqual",
                value: startDate.toJSON()
            },
            {
                operator: "LessThan",
                value: endDate.toJSON()
            }
        );
    }

    public clearSelection(target: IFilterColumnTarget): void {
        this.prevFilteredStartDate = null;
        this.prevFilteredEndDate = null;

        // IsUserSelection was false before but it looks logically correct to make it "true" here
        // because it's kinda user selection and it helps to avoid redundant updates.
        this.applyDatePeriod(null, null, target, true);
    }

    /**
     * This function returns the values to be displayed in the property pane for each object.
     * Usually it is a bind pass of what the property pane gave you, but sometimes you may want to do
     * validation and return other values/defaults.
     */
    public enumerateObjectInstances(options: powerbi.EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstanceEnumeration {
        if (options.objectName === "general") {
            return [];
        }

        const settings: VisualSettings = this.settings || VisualSettings.getDefault() as VisualSettings;

        let instancesEnumerator: powerbi.VisualObjectInstanceEnumeration = VisualSettings.enumerateObjectInstances(
            settings,
            options
        );

        const instances = instancesEnumerator["instances"]
            ? instancesEnumerator["instances"]
            : instancesEnumerator;

        if (options.objectName === "weekDay"
            && !settings.weekDay.daySelection
            && instances
            && instances[0]
            && instances[0].properties
        ) {
            delete instances[0].properties["day"];
        }

        return instances;
    }
}
