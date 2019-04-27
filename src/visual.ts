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

import "@babel/polyfill";

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
    AdvancedFilter,
    IFilterColumnTarget,
} from "powerbi-models";

import {
    CssConstants,
    manipulation as svgManipulation,
} from "powerbi-visuals-utils-svgutils";

import { pixelConverter } from "powerbi-visuals-utils-typeutils";

import { textMeasurementService } from "powerbi-visuals-utils-formattingutils";

import { interactivityFilterService } from "powerbi-visuals-utils-interactivityutils";
import extractFilterColumnTarget = interactivityFilterService.extractFilterColumnTarget;

import {
    dataLabelInterfaces,
    dataLabelUtils,
} from "powerbi-visuals-utils-chartutils";

import {
    ICursorDataPoint,
    ITimelineCursorOverElement,
    ITimelineData,
    ITimelineDataPoint,
    ITimelineLabel,
    ITimelineMargins,
    ITimelineProperties,
    ITimelineSelectors,
} from "./dataInterfaces";

import { CalendarSettings } from "./settings/calendarSettings";
import { CellsSettings } from "./settings/cellsSettings";
import { LabelsSettings } from "./settings/labelsSettings";
import { VisualSettings } from "./settings/settings";

import { TimelineGranularityData } from "./granularity/granularityData";
import { GranularityNames } from "./granularity/granularityNames";
import { GranularityType } from "./granularity/granularityType";

import {
    ITimelineDatePeriod,
    ITimelineDatePeriodBase,
} from "./datePeriod/datePeriod";

import { TimelineDatePeriodBase } from "./datePeriod/datePeriodBase";

import { Calendar } from "./calendar";
import { Utils } from "./utils";

export class Timeline implements powerbi.extensibility.visual.IVisual {
    public static setValidCalendarSettings(calendarSettings: CalendarSettings): void {
        const defaultSettings: VisualSettings = VisualSettings.getDefault() as VisualSettings;
        const theLatestDayOfMonth: number = Utils.getTheLatestDayOfMonth(calendarSettings.month);

        calendarSettings.day = Math.max(
            defaultSettings.calendar.day,
            Math.min(theLatestDayOfMonth, calendarSettings.day),
        );
    }

    public static selectCurrentPeriod(
        datePeriod: ITimelineDatePeriodBase,
        granularity: GranularityType,
        calendar,
    ) {
        return this.selectPeriod(datePeriod, granularity, calendar, Utils.resetTime(new Date()));
    }

    /**
     * TODO: We need to simplify this method.
     */
    public static converter(
        timelineData: ITimelineData,
        timelineProperties: ITimelineProperties,
        timelineGranularityData: TimelineGranularityData,
        dataView: powerbi.DataView,
        initialized: boolean,
        timelineSettings: VisualSettings,
        viewport: powerbi.IViewport,
        previousCalendar: Calendar,
        setting: VisualSettings,
    ): Calendar {

        if (this.isDataViewValid(dataView)) {
            return null;
        }

        let calendar: Calendar;
        let isCalendarChanged: boolean;
        let startDate: Date;
        let endDate: Date;
        let timelineElements: ITimelineDatePeriod[];
        let countFullCells: number;

        if (!initialized) {
            timelineData.cursorDataPoints = [{
                cursorIndex: 0,
                selectionIndex: Timeline.DefaultSelectionStartIndex,
                x: Timeline.DefaultCursorDatapointX,
                y: Timeline.DefaultCursorDatapointY,
            },
            {
                cursorIndex: 1,
                selectionIndex: Timeline.DefaultSelectionStartIndex,
                x: Timeline.DefaultCursorDatapointX,
                y: Timeline.DefaultCursorDatapointY,
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
        timelineData.filterColumnTarget = extractFilterColumnTarget(category);

        if (category.source.type.numeric) {
            (timelineData.filterColumnTarget as any).ref = "Date";
        }

        if (isCalendarChanged && startDate && endDate) {
            Utils.unseparateSelection(timelineData.currentGranularity.getDatePeriods());
            Utils.separateSelection(timelineData, startDate, endDate);
        }

        timelineElements = timelineData.currentGranularity.getDatePeriods();

        timelineData.timelineDataPoints = [];

        for (const currentTimePeriod of timelineElements) {
            const datapoint: ITimelineDataPoint = {
                datePeriod: currentTimePeriod,
                index: currentTimePeriod.index,
            };

            timelineData.timelineDataPoints.push(datapoint);
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
        );

        Timeline.updateCursors(timelineData);

        return calendar;
    }

    public static selectPeriod(
        datePeriod: ITimelineDatePeriodBase,
        granularity: GranularityType,
        calendar,
        periodDate: Date,
    ) {
        let startDate: Date = periodDate;
        let endDate: Date;

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

        const dataView: powerbi.DataView = options.dataViews[0];
        const columnExp: any = dataView.categorical.categories[0].source.expr;
        let valueType: string;

        valueType = columnExp
            ? columnExp.level
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
            || !dataViewCategorical.categories[0].source.type
        );
    }

    private static TimelineMargins: ITimelineMargins = {
        BottomMargin: 10,
        CellHeight: 25,
        CellWidth: 40,
        ElementWidth: 30,
        HeightOffset: 75,
        LeftMargin: 15,
        LegendHeight: 50,
        LegendHeightOffset: 4,
        LegendHeightRange: 20,
        MaxCellHeight: 60,
        MinCellHeight: 20,
        MinCellWidth: 40,
        PeriodSlicerRectHeight: 23,
        PeriodSlicerRectWidth: 15,
        RightMargin: 15,
        StartXpoint: 10,
        StartYpoint: 20,
        TopMargin: 0,
    };

    private static MinSizeOfViewport: number = 0;

    private static DefaultTextYPosition: number = 50;

    private static CellsYPositionFactor: number = 3;
    private static CellsYPositionOffset: number = 65;

    private static SelectedTextSelectionFactor: number = 2;
    private static SelectedTextSelectionYOffset: number = 17;

    private static LabelSizeFactor: number = 1.5;
    private static TimelinePropertiesHeightOffset: number = 30;

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

    private static ViewportWidthAdjustment: number = 2;

    private static filterObjectProperty: { objectName: string, propertyName: string } = {
        objectName: "general",
        propertyName: "filter",
    };

    private static TimelineSelectors: ITimelineSelectors = {
        Cell: CssConstants.createClassAndSelector("cell"),
        CellRect: CssConstants.createClassAndSelector("cellRect"),
        CellsArea: CssConstants.createClassAndSelector("cellsArea"),
        CursorsArea: CssConstants.createClassAndSelector("cursorsArea"),
        LowerTextArea: CssConstants.createClassAndSelector("lowerTextArea"),
        LowerTextCell: CssConstants.createClassAndSelector("lowerTextCell"),
        MainArea: CssConstants.createClassAndSelector("mainArea"),
        PeriodSlicerGranularities: CssConstants.createClassAndSelector("periodSlicerGranularities"),
        PeriodSlicerRect: CssConstants.createClassAndSelector("periodSlicerRect"),
        PeriodSlicerSelection: CssConstants.createClassAndSelector("periodSlicerSelection"),
        PeriodSlicerSelectionRect: CssConstants.createClassAndSelector("periodSlicerSelectionRect"),
        RangeTextArea: CssConstants.createClassAndSelector("rangeTextArea"),
        SelectionCursor: CssConstants.createClassAndSelector("selectionCursor"),
        SelectionRangeContainer: CssConstants.createClassAndSelector("selectionRangeContainer"),
        TextLabel: CssConstants.createClassAndSelector("label"),
        TimelineSlicer: CssConstants.createClassAndSelector("timelineSlicer"),
        TimelineVisual: CssConstants.createClassAndSelector("timeline"),
        TimelineWrapper: CssConstants.createClassAndSelector("timelineWrapper"),
        UpperTextArea: CssConstants.createClassAndSelector("upperTextArea"),
        UpperTextCell: CssConstants.createClassAndSelector("upperTextCell"),
    };

    private static updateCursors(timelineData: ITimelineData): void {
        const startDate: ITimelineDatePeriod = timelineData.timelineDataPoints[timelineData.selectionStartIndex].datePeriod;
        const endDate: ITimelineDatePeriod = timelineData.timelineDataPoints[timelineData.selectionEndIndex].datePeriod;

        timelineData.cursorDataPoints[0].selectionIndex = startDate.index;
        timelineData.cursorDataPoints[1].selectionIndex = endDate.index + endDate.fraction;
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

    private static setMeasures(
        labelsSettings: LabelsSettings,
        granularityType: GranularityType,
        datePeriodsCount: number,
        viewport: powerbi.IViewport,
        timelineProperties: ITimelineProperties,
        timelineMargins: ITimelineMargins,
    ): void {

        timelineProperties.cellsYPosition = timelineProperties.textYPosition;

        let height: number;
        let width: number;

        const labelSize: number = pixelConverter.fromPointToPixel(labelsSettings.textSize);

        if (labelsSettings.show) {
            const granularityOffset: number = labelsSettings.displayAll ? granularityType + 1 : 1;

            timelineProperties.cellsYPosition += labelSize
                * Timeline.LabelSizeFactor
                * granularityOffset;
        }

        const svgHeight: number = Math.max(0, viewport.height - timelineMargins.TopMargin);

        height = Math.max(timelineMargins.MinCellHeight,
            Math.min(
                timelineMargins.MaxCellHeight,
                svgHeight
                - timelineProperties.cellsYPosition
                - Timeline.TimelinePropertiesHeightOffset
                + (Timeline.TimelineMargins.LegendHeight - timelineProperties.legendHeight),
            ));

        // Height is deducted here to take account of edge cursors width
        // that in fact is half of cell height for each of them
        width = Math.max(
            timelineMargins.MinCellWidth,
            (viewport.width - height - Timeline.ViewportWidthAdjustment) / (datePeriodsCount));

        timelineProperties.cellHeight = height;
        timelineProperties.cellWidth = width;
    }

    private static parseSettings(
        dataView: powerbi.DataView,
        jsonFilters: AdvancedFilter[],
        colorPalette: powerbi.extensibility.ISandboxExtendedColorPalette,
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
     * It's public for testability
     */
    public timelineData: ITimelineData;
    public calendar: Calendar;

    private settings: VisualSettings;

    private timelineProperties: ITimelineProperties;

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

    private options: powerbi.extensibility.visual.VisualUpdateOptions;
    private dataView: powerbi.DataView;

    private svgWidth: number;

    private datePeriod: ITimelineDatePeriodBase;
    private prevFilteredStartDate: Date | null = null;
    private prevFilteredEndDate: Date | null = null;

    private initialized: boolean;

    private host: powerbi.extensibility.visual.IVisualHost;

    private locale: string;
    private localizationManager: powerbi.extensibility.ILocalizationManager;
    private horizontalAutoScrollingPositionOffset: number = 200;

    private selectedGranulaPos: number = null;

    private isForceSelectionReset: boolean = false;

    private cursorDragBehavior = d3Drag<any, ICursorDataPoint>()
        .subject((cursorDataPoint: ICursorDataPoint) => {
            cursorDataPoint.x = cursorDataPoint.selectionIndex * this.timelineProperties.cellWidth;

            return cursorDataPoint;
        })
        .on("drag", this.onCursorDrag.bind(this))
        .on("end", this.onCursorDragEnd.bind(this));

    constructor(options: powerbi.extensibility.visual.VisualConstructorOptions) {
        const element: HTMLElement = options.element;

        this.host = options.host;

        this.initialized = false;
        this.locale = this.host.locale;

        this.localizationManager = this.host.createLocalizationManager();

        this.timelineProperties = {
            bottomMargin: Timeline.TimelineMargins.BottomMargin,
            cellHeight: Timeline.TimelineMargins.CellHeight,
            cellWidth: Timeline.TimelineMargins.CellWidth,
            cellsYPosition: Timeline.TimelineMargins.TopMargin * Timeline.CellsYPositionFactor + Timeline.CellsYPositionOffset,
            elementWidth: Timeline.TimelineMargins.ElementWidth,
            leftMargin: Timeline.TimelineMargins.LeftMargin,
            legendHeight: Timeline.TimelineMargins.LegendHeight,
            rightMargin: Timeline.TimelineMargins.RightMargin,
            startXpoint: Timeline.TimelineMargins.StartXpoint,
            startYpoint: Timeline.TimelineMargins.StartYpoint,
            textYPosition: Timeline.DefaultTextYPosition,
            topMargin: Timeline.TimelineMargins.TopMargin,
        };

        this.rootSelection = d3Select(element)
            .append("div")
            .classed("timeline-component", true)
            .on("click", () => this.clearUserSelection());

        this.headerSelection = this.rootSelection
            .append("svg")
            .attr("width", "100%")
            .style("display", "block");

        this.mainSvgWrapperSelection = this.rootSelection
            .append("div")
            .classed(Timeline.TimelineSelectors.TimelineWrapper.className, true);

        this.mainSvgSelection = this.mainSvgWrapperSelection
            .append("svg")
            .classed(Timeline.TimelineSelectors.TimelineVisual.className, true);

        this.addElements();
    }

    public clearUserSelection(): void {
        if (!this.initialized || !this.timelineData) {
            return;
        }

        this.clearSelection(this.timelineData.filterColumnTarget);
        this.toggleForceSelectionOptions();
    }

    public doesPeriodSlicerRectPositionNeedToUpdate(granularity: GranularityType): boolean {
        const sliderSelection = d3Select("rect.periodSlicerRect");

        if (sliderSelection && sliderSelection.datum() === granularity) {
            return false;
        }

        return true;
    }

    public redrawPeriod(granularity: GranularityType): void {
        if (this.doesPeriodSlicerRectPositionNeedToUpdate(granularity)) {
            const startDate: Date = Utils.getStartSelectionDate(this.timelineData);
            const endDate: Date = Utils.getEndSelectionDate(this.timelineData);

            this.changeGranularity(granularity, startDate, endDate);
        }
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

        this.timelineProperties.legendHeight = 0;
        if (this.settings.rangeHeader.show) {
            this.timelineProperties.legendHeight = Timeline.TimelineMargins.LegendHeightRange;
        }
        if (this.settings.granularity.show) {
            this.timelineProperties.legendHeight = Timeline.TimelineMargins.LegendHeight;
        }

        if (!this.initialized) {
            this.timelineData = {
                cursorDataPoints: [],
                timelineDataPoints: [],
            };
        }

        this.headerSelection.attr("height", this.timelineProperties.legendHeight);

        this.timelineGranularityData = new TimelineGranularityData(
            this.datePeriod.startDate,
            this.datePeriod.endDate,
        );

        this.createTimelineData(
            this.settings,
            this.datePeriod.startDate,
            this.datePeriod.endDate,
            this.timelineGranularityData,
            this.locale,
            this.localizationManager,
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

        const isCurrentPeriodSelected: boolean = !this.isForceSelectionReset && this.settings.forceSelection.currentPeriod;
        const isLatestAvailableDateSelected: boolean = !this.isForceSelectionReset && this.settings.forceSelection.latestAvailableDate;
        const isForceSelected: boolean = !this.isForceSelectionReset && (isCurrentPeriodSelected || isLatestAvailableDateSelected);

        this.isForceSelectionReset = false; // Reset it to default state to allow re-enabling Force Selection

        const target: IFilterColumnTarget = this.timelineData.filterColumnTarget;

        let currentForceSelectionResult = { startDate: null, endDate: null };

        if (isCurrentPeriodSelected) {
            currentForceSelectionResult = ({
                endDate: filterDatePeriod.endDate,
                startDate: filterDatePeriod.startDate,
            } = Timeline.selectCurrentPeriod(datePeriod, granularity, this.calendar));
        }
        if (isLatestAvailableDateSelected
            && (
                !isCurrentPeriodSelected
                || (isCurrentPeriodSelected
                    && !currentForceSelectionResult.startDate
                    && !currentForceSelectionResult.endDate
                )
            )
        ) {
            filterDatePeriod.endDate = adaptedDataEndDate;
            ({
                endDate: filterDatePeriod.endDate,
                startDate: filterDatePeriod.startDate,
            } = Timeline.selectPeriod(datePeriod, granularity, this.calendar, this.datePeriod.endDate));
        }

        const wasFilterChanged: boolean =
            String(this.prevFilteredStartDate) !== String(filterDatePeriod.startDate) ||
            String(this.prevFilteredEndDate) !== String(filterDatePeriod.endDate);

        if (isForceSelected && wasFilterChanged) {
            this.applyDatePeriod(filterDatePeriod.startDate, filterDatePeriod.endDate, target);
        }

        this.prevFilteredStartDate = filterDatePeriod.startDate;
        this.prevFilteredEndDate = filterDatePeriod.endDate;

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

        const startXpoint: number = this.timelineProperties.startXpoint;
        const elementWidth: number = this.timelineProperties.elementWidth;

        d3SelectAll("g." + Timeline.TimelineSelectors.TimelineSlicer.className).remove();

        if (this.settings.granularity.show) {
            this.selectorSelection = this.headerSelection
                .append("g")
                .classed(Timeline.TimelineSelectors.TimelineSlicer.className, true);

            this.timelineGranularityData.renderGranularities({
                granularSettings: this.settings.granularity,
                selectPeriodCallback: (granularityType: GranularityType) => { this.selectPeriod(granularityType); },
                selection: this.selectorSelection,
            });

            // create selected period text
            this.selectorSelection
                .append("text")
                .attr("fill", this.settings.granularity.scaleColor)
                .classed(Timeline.TimelineSelectors.PeriodSlicerSelection.className, true)
                .text(this.localizationManager.getDisplayName(Utils.getGranularityNameKey(granularity)))
                .attr("x", pixelConverter.toString(startXpoint + Timeline.SelectedTextSelectionFactor * elementWidth))
                .attr("y", pixelConverter.toString(Timeline.SelectedTextSelectionYOffset));
        }

        this.render(
            this.timelineData,
            this.settings,
            this.timelineProperties,
            options,
        );
    }

    public fillCells(visSettings: VisualSettings): void {
        const dataPoints: ITimelineDataPoint[] = this.timelineData.timelineDataPoints;

        const cellSelection: D3Selection<any, ITimelineDataPoint, any, any> = this.mainGroupSelection
            .selectAll(Timeline.TimelineSelectors.CellRect.selectorName)
            .data(dataPoints);

        const cellsSettings: CellsSettings = visSettings.cells;

        let singleCaseDone: boolean = false;

        cellSelection
            .attr("fill", (dataPoint: ITimelineDataPoint, index: number) => {
                const isSelected: boolean = Utils.isGranuleSelected(dataPoint, this.timelineData, cellsSettings);

                if (visSettings.scrollAutoAdjustment.show && isSelected && !singleCaseDone) {
                    const selectedGranulaPos: number = (cellSelection.nodes()[index] as any).x.baseVal.value;
                    this.selectedGranulaPos = selectedGranulaPos;
                    singleCaseDone = true;
                }

                return isSelected
                    ? cellsSettings.fillSelected
                    : (cellsSettings.fillUnselected || Utils.DefaultCellColor);
            })
            .style("stroke", (dataPoint: ITimelineDataPoint) => {
                const isSelected: boolean = Utils.isGranuleSelected(dataPoint, this.timelineData, cellsSettings);

                return isSelected
                    ? cellsSettings.selectedStrokeColor
                    : cellsSettings.strokeColor;
            });
    }

    public renderCells(timelineData: ITimelineData, timelineProperties: ITimelineProperties, yPos: number): void {
        const dataPoints: ITimelineDataPoint[] = timelineData.timelineDataPoints;
        let totalX: number = 0;

        const cellsSelection: D3Selection<any, ITimelineDataPoint, any, any> = this.cellsSelection
            .selectAll(Timeline.TimelineSelectors.CellRect.selectorName)
            .data(dataPoints);

        d3SelectAll(`rect.${Timeline.TimelineSelectors.CellRect.className} title`).remove();

        cellsSelection
            .exit()
            .remove();

        cellsSelection
            .enter()
            .append("rect")
            .classed(Timeline.TimelineSelectors.CellRect.className, true)
            .on("click", this.handleClick.bind(this))
            .on("touchstart", this.handleClick.bind(this))
            .merge(cellsSelection)
            .attr("x", (dataPoint: ITimelineDataPoint) => {
                const position: number = totalX;

                totalX += dataPoint.datePeriod.fraction * timelineProperties.cellWidth;

                return pixelConverter.toString(position);
            })
            .attr("y", pixelConverter.toString(yPos))
            .attr("height", pixelConverter.toString(timelineProperties.cellHeight))
            .attr("width", (dataPoint: ITimelineDataPoint) => {
                return pixelConverter.toString(dataPoint.datePeriod.fraction * timelineProperties.cellWidth);
            })
            .append("title")
            .text((dataPoint: ITimelineDataPoint) => timelineData.currentGranularity.generateLabel(dataPoint.datePeriod).title);

        this.fillCells(this.settings);
    }

    public renderCursors(
        timelineData: ITimelineData,
        cellHeight: number,
        cellsYPosition: number,
    ): D3Selection<any, any, any, any> {
        const cursorSelection: D3Selection<any, ICursorDataPoint, any, any> = this.cursorGroupSelection
            .selectAll(Timeline.TimelineSelectors.SelectionCursor.selectorName)
            .data(timelineData.cursorDataPoints);

        cursorSelection
            .exit()
            .remove();

        return cursorSelection
            .enter()
            .append("path")
            .classed(Timeline.TimelineSelectors.SelectionCursor.className, true)
            .merge(cursorSelection)
            .attr("transform", (cursorDataPoint: ICursorDataPoint) => {
                const dx: number = cursorDataPoint.selectionIndex * this.timelineProperties.cellWidth;
                const dy: number = cellHeight / Timeline.CellHeightDivider + cellsYPosition;

                return svgManipulation.translate(dx, dy);
            })
            .attr("d", d3Arc<ICursorDataPoint>()
                .innerRadius(0)
                .outerRadius(cellHeight / Timeline.CellHeightDivider)
                .startAngle((cursorDataPoint: ICursorDataPoint) => {
                    return cursorDataPoint.cursorIndex * Math.PI + Math.PI;
                })
                .endAngle((cursorDataPoint: ICursorDataPoint) => {
                    return cursorDataPoint.cursorIndex * Math.PI + 2 * Math.PI;
                }),
            )
            .style("fill", this.settings.cursor.color)
            .call(this.cursorDragBehavior);
    }

    public renderTimeRangeText(timelineData: ITimelineData, rangeHeaderSettings: LabelsSettings): void {
        const leftMargin: number = (GranularityNames.length + Timeline.GranularityNamesLength)
            * this.timelineProperties.elementWidth;

        const maxWidth: number = this.svgWidth
            - leftMargin
            - this.timelineProperties.leftMargin
            - rangeHeaderSettings.textSize;

        d3SelectAll("g." + Timeline.TimelineSelectors.RangeTextArea.className).remove();

        if (rangeHeaderSettings.show && maxWidth > 0) {
            this.rangeTextSelection = this.headerSelection
                .append("g")
                .classed(Timeline.TimelineSelectors.RangeTextArea.className, true)
                .append("text");

            const timeRangeText: string = Utils.timeRangeText(timelineData);

            const labelFormattedTextOptions: dataLabelInterfaces.LabelFormattedTextOptions = {
                fontSize: rangeHeaderSettings.textSize,
                label: timeRangeText,
                maxWidth,
            };

            const actualText: string = dataLabelUtils.getLabelFormattedText(labelFormattedTextOptions);

            const positionOffset: number = Timeline.TimelineMargins.LegendHeight - this.timelineProperties.legendHeight;
            this.rangeTextSelection
                .classed(Timeline.TimelineSelectors.SelectionRangeContainer.className, true)

                .attr("x", GranularityNames.length
                    * (this.timelineProperties.elementWidth + this.timelineProperties.leftMargin))
                .attr("y", Timeline.DefaultRangeTextSelectionY - positionOffset)
                .attr("fill", rangeHeaderSettings.fontColor)
                .style("font-size", pixelConverter.fromPointToPixel(rangeHeaderSettings.textSize))
                .text(actualText)
                .append("title")
                .text(timeRangeText);
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
        );
    }

    public applyDatePeriod(
        startDate: Date,
        endDate: Date,
        target: IFilterColumnTarget,
    ): void {
        this.host.applyJsonFilter(
            this.createFilter(startDate, endDate, target),
            Timeline.filterObjectProperty.objectName,
            Timeline.filterObjectProperty.propertyName,
            this.getFilterAction(startDate, endDate),
        );
    }

    public getFilterAction(startDate: Date, endDate: Date): powerbi.FilterAction {
        return typeof startDate !== "undefined"
            && typeof endDate !== "undefined"
            && startDate !== null
            && endDate !== null
            ? powerbi.FilterAction.merge
            : powerbi.FilterAction.remove;
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

    public createFilter(startDate: Date, endDate: Date, target: IFilterColumnTarget): AdvancedFilter {
        if (startDate == null || endDate == null || !target) {
            return null;
        }

        return new AdvancedFilter(
            target,
            "And",
            {
                operator: "GreaterThanOrEqual",
                value: startDate.toJSON(),
            },
            {
                operator: "LessThan",
                value: endDate.toJSON(),
            },
        );
    }

    public clearSelection(target: IFilterColumnTarget): void {
        this.prevFilteredStartDate = null;
        this.prevFilteredEndDate = null;

        this.applyDatePeriod(null, null, target);
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

        const instancesEnumerator: powerbi.VisualObjectInstanceEnumeration = VisualSettings.enumerateObjectInstances(
            settings,
            options,
        );

        const instances = (instancesEnumerator as powerbi.VisualObjectInstanceEnumerationObject).instances
            ? (instancesEnumerator as powerbi.VisualObjectInstanceEnumerationObject).instances
            : instancesEnumerator;

        if (options.objectName === "weekDay"
            && !settings.weekDay.daySelection
            && instances
            && instances[0]
            && instances[0].properties
        ) {
            delete instances[0].properties.day;
        }

        return instances;
    }

    public selectPeriod(granularityType: GranularityType): void {
        if (this.timelineData.currentGranularity.getType() === granularityType) {
            return;
        }

        this.host.persistProperties({
            merge: [{
                objectName: "granularity",
                properties: { granularity: granularityType },
                selector: null,
            }],
        });

        this.settings.granularity.granularity = granularityType;
    }

    public onCursorDrag(currentCursor: ICursorDataPoint): void {
        const cursorOverElement: ITimelineCursorOverElement = this.findCursorOverElement((require("d3").event as MouseEvent).x);

        if (!cursorOverElement) {
            return;
        }

        const currentlyMouseOverElement: ITimelineDataPoint = cursorOverElement.datapoint;
        const currentlyMouseOverElementIndex: number = cursorOverElement.index;

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
    public findCursorOverElement(position: number): ITimelineCursorOverElement {
        const timelineDatapoints: ITimelineDataPoint[] = this.timelineData.timelineDataPoints || [];
        const cellWidth: number = this.timelineProperties.cellWidth;

        const timelineDatapointIndexes: number[] = timelineDatapoints.map((datapoint: ITimelineDataPoint) => {
            return datapoint.index;
        });

        const index: number = Utils.getIndexByPosition(
            timelineDatapointIndexes,
            cellWidth,
            position);

        if (!timelineDatapoints[index]) {
            return null;
        }

        return {
            datapoint: timelineDatapoints[index],
            index,
        };
    }

    public onCursorDragEnd(): void {
        this.setSelection(this.timelineData);
        this.toggleForceSelectionOptions();
    }

    private handleClick(dataPoint: ITimelineDataPoint, index: number): void {
        const event: MouseEvent = require("d3").event as MouseEvent;

        event.stopPropagation();

        this.onCellClickHandler(dataPoint, index, event.altKey || event.shiftKey);
    }

    private addElements(): void {
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

    private createDatePeriod(dataView: powerbi.DataView): ITimelineDatePeriodBase {
        return Utils.getDatePeriod(dataView.categorical.categories[0].values);
    }

    private createTimelineData(
        timelineSettings: VisualSettings,
        startDate: Date,
        endDate: Date,
        timelineGranularityData: TimelineGranularityData,
        locale: string,
        localizationManager: powerbi.extensibility.ILocalizationManager,
    ) {
        const calendar = new Calendar(timelineSettings.calendar, timelineSettings.weekDay);

        timelineGranularityData.createGranularities(calendar, locale, localizationManager);
        timelineGranularityData.createLabels();

        if (this.initialized) {
            const actualEndDate: Date = TimelineGranularityData.nextDay(endDate);

            const daysPeriods: ITimelineDatePeriod[] = this.timelineGranularityData
                .getGranularity(GranularityType.day)
                .getDatePeriods();

            const prevStartDate: Date = daysPeriods[0].startDate;

            const prevEndDate: Date = daysPeriods[daysPeriods.length - 1].endDate;

            const changedSelection: boolean =
                startDate.getTime() !== prevStartDate.getTime()
                ||
                actualEndDate.getTime() !== prevEndDate.getTime();

            if (!changedSelection) {
                this.changeGranularity(
                    this.settings.granularity.granularity,
                    startDate,
                    actualEndDate,
                );
            } else {
                this.initialized = false;
            }
        }
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
        );
    }

    private render(
        timelineData: ITimelineData,
        timelineSettings: VisualSettings,
        timelineProperties: ITimelineProperties,
        options: powerbi.extensibility.visual.VisualUpdateOptions,
    ): void {
        const timelineDatapointsCount = this.timelineData.timelineDataPoints
            .filter((dataPoint: ITimelineDataPoint) => {
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

        this.mainSvgWrapperSelection.style(
            "height",
            pixelConverter.toString(Math.max(
                Timeline.MinSizeOfViewport,
                options.viewport.height
                - this.timelineProperties.legendHeight
                - Timeline.TimelineMargins.TopMargin
                - Timeline.TimelineMargins.LegendHeightOffset),
            ),
        );
        const mainAreaHeight: number = timelineProperties.cellsYPosition - Timeline.TimelineMargins.LegendHeight
            + timelineProperties.cellHeight;

        const mainSvgHeight: number = Timeline.TimelineMargins.TopMargin + Timeline.TimelineMargins.LegendHeightOffset
            + mainAreaHeight;

        this.mainSvgSelection
            .attr("height", pixelConverter.toString(Math.max(
                Timeline.MinSizeOfViewport,
                mainSvgHeight,
            )))
            .attr("width", this.svgWidth < options.viewport.width
                ? "100%"
                : pixelConverter.toString(Math.max(
                    Timeline.MinSizeOfViewport,
                    this.svgWidth,
                )),
            );

        const fixedTranslateString: string = svgManipulation.translate(
            timelineProperties.leftMargin,
            timelineProperties.topMargin + this.timelineProperties.startYpoint,
        );

        // Here still Timeline.TimelineMargins.LegendHeight is used because it always must have permanent negative offset.
        // TODO: may be there is a way how to remove this negative offset
        const translateString: string = svgManipulation.translate(
            timelineProperties.cellHeight / Timeline.CellHeightDivider,
            timelineProperties.topMargin - (Timeline.TimelineMargins.LegendHeight - Timeline.TimelineMargins.LegendHeightOffset),
        );

        this.mainGroupSelection.attr("transform", translateString);

        if (this.selectorSelection) {
            this.selectorSelection.attr("transform", fixedTranslateString);
        }

        this.cursorGroupSelection.attr("transform", translateString);

        const extendedLabels = this.timelineData.currentGranularity.getExtendedLabel();
        const granularityType = this.timelineData.currentGranularity.getType();

        let yPos: number = 0;
        const yDiff: number = Timeline.DefaultYDiff;

        // Removing currently displayed labels
        this.mainGroupSelection
            .selectAll(Timeline.TimelineSelectors.TextLabel.selectorName)
            .remove();

        if (timelineSettings.labels.show) {
            if (timelineSettings.labels.displayAll || granularityType === GranularityType.year) {
                this.renderLabels(
                    extendedLabels.yearLabels,
                    this.yearLabelsSelection,
                    this.calculateYOffset(yPos),
                    granularityType === 0);
                if (granularityType >= GranularityType.year) {
                    yPos += yDiff;
                }
            }

            if (timelineSettings.labels.displayAll || granularityType === GranularityType.quarter) {
                this.renderLabels(
                    extendedLabels.quarterLabels,
                    this.quarterLabelsSelection,
                    this.calculateYOffset(yPos),
                    granularityType === 1);
                if (granularityType >= GranularityType.quarter) {
                    yPos += yDiff;
                }
            }

            if (timelineSettings.labels.displayAll || granularityType === GranularityType.month) {
                this.renderLabels(
                    extendedLabels.monthLabels,
                    this.monthLabelsSelection,
                    this.calculateYOffset(yPos),
                    granularityType === 2);
                if (granularityType >= GranularityType.month) {
                    yPos += yDiff;
                }
            }

            if (timelineSettings.labels.displayAll || granularityType === GranularityType.week) {
                this.renderLabels(
                    extendedLabels.weekLabels,
                    this.weekLabelsSelection,
                    this.calculateYOffset(yPos),
                    granularityType === 3);
                if (granularityType >= GranularityType.week) {
                    yPos += yDiff;
                }
            }

            if (timelineSettings.labels.displayAll || granularityType === GranularityType.day) {
                this.renderLabels(
                    extendedLabels.dayLabels,
                    this.dayLabelsSelection,
                    this.calculateYOffset(yPos),
                    granularityType === 4);
                if (granularityType >= GranularityType.day) {
                    yPos += yDiff;
                }
            }
        }

        yPos -= 1;

        this.renderCells(
            timelineData,
            timelineProperties,
            this.calculateYOffset(yPos),
        );

        this.renderCursors(
            timelineData,
            timelineProperties.cellHeight,
            this.calculateYOffset(yPos),
        );

        this.scrollAutoFocusFunc(this.selectedGranulaPos);
    }

    private calculateYOffset(index: number): number {
        if (!this.settings.labels.show) {
            return this.timelineProperties.textYPosition;
        }

        return this.timelineProperties.textYPosition
            + (1 + index) * pixelConverter.fromPointToPixel(this.settings.labels.textSize);
    }

    private renderLabels(
        labels: ITimelineLabel[],
        labelsElement: D3Selection<any, any, any, any>,
        yPosition: number,
        isLast: boolean,
    ): void {
        const labelTextSelection: D3Selection<any, ITimelineLabel, any, any> = labelsElement
            .selectAll(Timeline.TimelineSelectors.TextLabel.selectorName);

        if (!this.settings.labels.show) {
            labelTextSelection.remove();
            return;
        }

        const labelsGroupSelection: D3Selection<any, ITimelineLabel, any, any> = labelTextSelection.data(labels);
        const fontSize: string = pixelConverter.fromPoint(this.settings.labels.textSize);

        labelsGroupSelection
            .enter()
            .append("text")
            .classed(Timeline.TimelineSelectors.TextLabel.className, true)
            .merge(labelsGroupSelection)
            .text((label: ITimelineLabel, id: number) => {
                if (!isLast && id === 0 && labels.length > 1) {
                    let textProperties: textMeasurementService.TextProperties = {
                        fontFamily: Timeline.DefaultFontFamily,
                        fontSize,
                        text: labels[0].text,
                    };

                    const halfFirstTextWidth = textMeasurementService.textMeasurementService.measureSvgTextWidth(textProperties)
                        / Timeline.TextWidthMiddleDivider;

                    textProperties = {
                        fontFamily: Timeline.DefaultFontFamily,
                        fontSize,
                        text: labels[1].text,
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
                    fontSize: this.settings.labels.textSize,
                    label: label.text,
                    maxWidth: this.timelineProperties.cellWidth * (isLast
                        ? Timeline.CellWidthLastFactor
                        : Timeline.CellWidthNotLastFactor
                    ),
                };

                return dataLabelUtils.getLabelFormattedText(labelFormattedTextOptions);
            })
            .style("font-size", pixelConverter.fromPoint(this.settings.labels.textSize))
            .attr("x", (label: ITimelineLabel) => {
                return (label.id + Timeline.LabelIdOffset) * this.timelineProperties.cellWidth;
            })
            .attr("y", yPosition)
            .attr("fill", this.settings.labels.fontColor)
            .append("title")
            .text((label: ITimelineLabel) => label.title);

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
            .selectAll(Timeline.TimelineSelectors.TextLabel.selectorName)
            .remove();

        this.cursorGroupSelection
            .selectAll(Timeline.TimelineSelectors.SelectionCursor.selectorName)
            .remove();

        this.mainSvgSelection
            .selectAll(Timeline.TimelineSelectors.RangeTextArea.selectorName)
            .remove();

        this.mainSvgSelection
            .attr("width", 0)
            .selectAll(Timeline.TimelineSelectors.TimelineSlicer.selectorName)
            .remove();
    }

    private onCellClickHandler(
        dataPoint: ITimelineDataPoint,
        index: number,
        isMultiSelection: boolean,
    ): void {

        const timelineData: ITimelineData = this.timelineData;
        const cursorDataPoints: ICursorDataPoint[] = timelineData.cursorDataPoints;
        const timelineProperties: ITimelineProperties = this.timelineProperties;

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
            timelineProperties.cellsYPosition,
        );

        this.renderTimeRangeText(timelineData, this.settings.rangeHeader);

        this.setSelection(timelineData);
        this.toggleForceSelectionOptions();
    }

    private scrollAutoFocusFunc(selectedGranulaPos: number): void {
        if (!selectedGranulaPos) {
            return;
        }

        this.mainSvgWrapperSelection.node().scrollLeft = selectedGranulaPos - this.horizontalAutoScrollingPositionOffset;
    }

    private toggleForceSelectionOptions(): void {
        const isForceSelectionTurnedOn: boolean = this.settings.forceSelection.currentPeriod
            || this.settings.forceSelection.latestAvailableDate;

        if (isForceSelectionTurnedOn) {
            this.turnOffForceSelectionOptions();
        }
    }

    private turnOffForceSelectionOptions(): void {
        this.host.persistProperties({
            merge: [{
                objectName: "forceSelection",
                properties: {
                    currentPeriod: false,
                    latestAvailableDate: false,
                },
                selector: null,
            }],
        });

        this.isForceSelectionReset = true;
    }
}
