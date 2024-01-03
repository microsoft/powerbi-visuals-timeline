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

import "core-js/stable";

import {select as d3Select, selectAll as d3SelectAll, Selection as D3Selection} from "d3-selection";

import {D3DragEvent, drag as d3Drag} from "d3-drag";
import {arc as d3Arc} from "d3-shape";

import powerbiVisualsApi from "powerbi-visuals-api";
import powerbi from "powerbi-visuals-api";

import {AdvancedFilter, IFilterColumnTarget} from "powerbi-models";

import {CssConstants, manipulation as svgManipulation} from "powerbi-visuals-utils-svgutils";

import {pixelConverter} from "powerbi-visuals-utils-typeutils";

import {interfaces as formattingInterfaces, textMeasurementService} from "powerbi-visuals-utils-formattingutils";
import {FormattingSettingsService} from "powerbi-visuals-utils-formattingmodel";

import {interactivityFilterService} from "powerbi-visuals-utils-interactivityutils";

import {dataLabelInterfaces, dataLabelUtils,} from "powerbi-visuals-utils-chartutils";

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

import {GranularityData} from "./granularity/granularityData";
import {GranularityNames} from "./granularity/granularityNames";
import {GranularityType} from "./granularity/granularityType";

import {ITimelineDatePeriod, ITimelineDatePeriodBase,} from "./datePeriod/datePeriod";

import {DatePeriodBase} from "./datePeriod/datePeriodBase";

import {Calendar, CalendarFormat, WeekDayFormat} from "./calendars/calendar";
import {Utils} from "./utils";
import {WeekStandard} from "./calendars/weekStandard";
import {CalendarFactory} from "./calendars/calendarFactory";
import {
    CellsSettingsCard,
    FiscalYearCalendarSettingsCard,
    RangeHeaderSettingsCard,
    TimeLineSettingsModel
} from "./timeLineSettingsModel";
import {Day} from "./calendars/day";
import {Month} from "./calendars/month";

import ISelectionManager = powerbiVisualsApi.extensibility.ISelectionManager;
import extractFilterColumnTarget = interactivityFilterService.extractFilterColumnTarget;

interface IAdjustedFilterDatePeriod {
    period: DatePeriodBase;
    adaptedDataEndDate: Date;
}

export class Timeline implements powerbiVisualsApi.extensibility.visual.IVisual {
    public static SET_VALID_CALENDAR_SETTINGS(calendarSettings: CalendarFormat): void {
        const theLatestDayOfMonth: number = Utils.GET_THE_LATEST_DAY_OF_MONTH(calendarSettings.month);

        calendarSettings.day = Math.max(
            FiscalYearCalendarSettingsCard.DefaultDay,
            Math.min(theLatestDayOfMonth, calendarSettings.day),
        );
    }

    public static ADJUST_CALENDAR_DAY_SETTINGS(calendarSettings: CalendarFormat): number {
        const theLatestDayOfMonth: number = Utils.GET_THE_LATEST_DAY_OF_MONTH(calendarSettings.month);

        const adjustedDay = Math.max(
            FiscalYearCalendarSettingsCard.DefaultDay,
            Math.min(theLatestDayOfMonth, calendarSettings.day),
        );

        return adjustedDay;
    }

    public static SELECT_CURRENT_PERIOD(
        datePeriod: ITimelineDatePeriodBase,
        granularity: GranularityType,
        calendar,
    ) {
        return this.SELECT_PERIOD(datePeriod, granularity, calendar, Utils.RESET_TIME(new Date()));
    }

    public static CONVERTER(
        timelineData: ITimelineData,
        timelineProperties: ITimelineProperties,
        timelineGranularityData: GranularityData,
        dataView: powerbiVisualsApi.DataView,
        initialized: boolean,
        timelineSettings: TimeLineSettingsModel,
        viewport: powerbiVisualsApi.IViewport,
        previousCalendar: Calendar,
    ): Calendar {

        if (this.isDataViewValid(dataView)) {
            return null;
        }

        let calendar: Calendar;
        let startDate: Date;
        let endDate: Date;

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

        const weekStandardFormat: WeekStandard = WeekStandard[timelineSettings.weeksDeterminationStandards.weekStandard.value.value];

        const calendarFormat: CalendarFormat = {
            month: Month[timelineSettings.fiscalYearCalendar.month.value.value],
            day: timelineSettings.fiscalYearCalendar.day.value,
        }

        const weekDayFormat: WeekDayFormat = {
            daySelection: timelineSettings.weekDay.daySelection.value,
            day: Day[timelineSettings.weekDay.day.value.value],
        }

        const isCalendarChanged: boolean = previousCalendar
            && previousCalendar.isChanged(calendarFormat, weekDayFormat, weekStandardFormat);

        if (timelineData && timelineData.currentGranularity) {
            startDate = Utils.GET_START_SELECTION_DATE(timelineData);
            endDate = Utils.GET_END_SELECTION_DATE(timelineData);
        }

        if (!initialized || isCalendarChanged) {
            calendar = new CalendarFactory().create(weekStandardFormat, calendarFormat, weekDayFormat);
            timelineData.currentGranularity = timelineGranularityData.getGranularity(
                GranularityType[timelineSettings.granularity.granularity.value.value]);
        } else {
            calendar = previousCalendar;

        }
        if (!initialized) {
            timelineData.selectionStartIndex = 0;
            timelineData.selectionEndIndex = timelineData.currentGranularity.getDatePeriods().length - 1;
        }

        const category: powerbiVisualsApi.DataViewCategoryColumn = dataView.categorical.categories[0];
        timelineData.filterColumnTarget = extractFilterColumnTarget(category);

        if (category.source.type.numeric) {
            (<any>(timelineData.filterColumnTarget)).ref = "Date";
        }

        if (isCalendarChanged && startDate && endDate) {
            Utils.UNSEPARATE_SELECTION(timelineData.currentGranularity.getDatePeriods());
            Utils.SEPARATE_SELECTION(timelineData, startDate, endDate);
        }

        const timelineElements: ITimelineDatePeriod[] = timelineData.currentGranularity.getDatePeriods();

        timelineData.timelineDataPoints = [];

        for (const currentTimePeriod of timelineElements) {
            const datapoint: ITimelineDataPoint = {
                datePeriod: currentTimePeriod,
                index: currentTimePeriod.index,
            };

            timelineData.timelineDataPoints.push(datapoint);
        }

        const countFullCells: number = timelineData.currentGranularity
            .getDatePeriods()
            .filter((datePeriod: ITimelineDatePeriod) => {
                return datePeriod.index % 1 === 0;
            })
            .length;

        Timeline.setMeasures(
            timelineSettings,
            timelineData.currentGranularity.getType(),
            countFullCells,
            viewport,
            timelineProperties,
            Timeline.TimelineMargins,
        );

        Timeline.updateCursors(timelineData);

        return calendar;
    }

    public static SELECT_PERIOD(
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
                ({startDate, endDate} = calendar.getWeekPeriod(periodDate));
                break;
            case GranularityType.month:
                ({startDate, endDate} = calendar.getMonthPeriod(periodDate));
                break;
            case GranularityType.quarter:
                ({startDate, endDate} = calendar.getQuarterPeriod(periodDate));
                break;
            case GranularityType.year:
                ({startDate, endDate} = calendar.getYearPeriod(periodDate));
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

        return {startDate, endDate};
    }

    public static ARE_VISUAL_UPDATE_OPTIONS_VALID(options: powerbiVisualsApi.extensibility.visual.VisualUpdateOptions): boolean {
        if (!options
            || !options.dataViews
            || !options.dataViews[0]
            || !options.dataViews[0].metadata
            || !Timeline.IS_DATA_VIEW_CATEGORICAL_VALID(options.dataViews[0].categorical)) {

            return false;
        }

        const dataView: powerbiVisualsApi.DataView = options.dataViews[0];
        const columnExp: any = dataView.categorical.categories[0].source.expr;

        const valueType: string = columnExp
            ? columnExp.level
            : null;

        if (!(dataView.categorical.categories[0].source.type.dateTime
            || (dataView.categorical.categories[0].source.type.numeric
                && (valueType === "Year" || valueType === "Date")))) {
            return false;
        }

        return true;
    }

    public static IS_DATA_VIEW_CATEGORICAL_VALID(dataViewCategorical: powerbiVisualsApi.DataViewCategorical): boolean {
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
        FramePadding: 5,
        HeightOffset: 75,
        LeftMargin: 15,
        LegendHeight: 50,
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
        timelineSettings: TimeLineSettingsModel,
        granularityType: GranularityType,
        datePeriodsCount: number,
        viewport: powerbiVisualsApi.IViewport,
        timelineProperties: ITimelineProperties,
        timelineMargins: ITimelineMargins,
    ): void {

        timelineProperties.cellsYPosition = timelineProperties.textYPosition;

        const labelSize: number = pixelConverter.fromPointToPixel(timelineSettings.labels.textSize.value);

        if (timelineSettings.labels.topLevelSlice.value) {
            const granularityOffset: number = timelineSettings.labels.displayAll.value ? granularityType + 1 : 1;

            timelineProperties.cellsYPosition += labelSize
                * Timeline.LabelSizeFactor
                * granularityOffset;
        }

        const svgHeight: number = Math.max(0, viewport.height - timelineMargins.TopMargin);

        if (timelineSettings.cells.enableManualSizing.value) {
            timelineProperties.cellHeight = timelineSettings.cells.height.value;
            timelineProperties.cellWidth = timelineSettings.cells.width.value;
        } else {
            const height: number = Math.max(timelineMargins.MinCellHeight,
                Math.min(
                    timelineMargins.MaxCellHeight,
                    svgHeight
                    - timelineProperties.cellsYPosition
                    - Timeline.TimelinePropertiesHeightOffset
                    + (Timeline.TimelineMargins.LegendHeight - timelineProperties.legendHeight),
                ));

            // Height is deducted here to take account of edge cursors width
            // that in fact is half of cell height for each of them
            const width: number = Math.max(
                timelineMargins.MinCellWidth,
                (viewport.width - height - Timeline.ViewportWidthAdjustment) / (datePeriodsCount));

            timelineProperties.cellHeight = height;
            timelineProperties.cellWidth = width;
        }
    }

    private static applyFilters(
        settings: TimeLineSettingsModel,
        jsonFilters: AdvancedFilter[],
        colorPalette: powerbiVisualsApi.extensibility.ISandboxExtendedColorPalette,
    ): void {
        const calendarFormat: CalendarFormat = {
            month: Month[settings.fiscalYearCalendar.month.value.value],
            day: settings.fiscalYearCalendar.day.value,
        }

        settings.fiscalYearCalendar.day.value = Timeline.ADJUST_CALENDAR_DAY_SETTINGS(calendarFormat);

        if (jsonFilters
            && jsonFilters[0]
            && jsonFilters[0].conditions
            && jsonFilters[0].conditions[0]
            && jsonFilters[0].conditions[1]
        ) {
            const startDate: Date = new Date(`${jsonFilters[0].conditions[0].value}`);
            const endDate: Date = new Date(`${jsonFilters[0].conditions[1].value}`);

            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                settings.general.datePeriod = DatePeriodBase.CREATE(startDate, endDate);
            } else {
                settings.general.datePeriod = DatePeriodBase.CREATEEMPTY();
            }
        } else {
            settings.general.datePeriod = DatePeriodBase.CREATEEMPTY();
        }

        if (colorPalette.isHighContrast) {
            const {
                foreground,
                background,
            } = colorPalette;

            settings.rangeHeader.fontColor.value.value = foreground.value;

            settings.cells.fillSelected.value.value = foreground.value;
            settings.cells.fillUnselected.value.value = background.value;

            settings.cells.strokeColor.value.value = foreground.value;
            settings.cells.selectedStrokeColor.value.value = background.value;

            settings.granularity.scaleColor.value.value = foreground.value;
            settings.granularity.sliderColor.value.value = foreground.value;

            settings.labels.fontColor.value.value = foreground.value;

            settings.cursor.color.value.value = foreground.value;
        }
    }

    /**
     * It's public for testability
     */
    public timelineData: ITimelineData;
    public calendar: Calendar;

    private formattingSettings: TimeLineSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    private timelineProperties: ITimelineProperties;

    private timelineGranularityData: GranularityData;

    private rootSelection: D3Selection<any, any, any, any>;
    private headerWrapperSelection: D3Selection<any, any, any, any>;
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

    private options: powerbiVisualsApi.extensibility.visual.VisualUpdateOptions;
    private dataView: powerbiVisualsApi.DataView;

    private svgWidth: number;

    private datePeriod: ITimelineDatePeriodBase;
    private prevFilteredStartDate: Date | null = null;
    private prevFilteredEndDate: Date | null = null;

    private initialized: boolean;

    private host: powerbiVisualsApi.extensibility.visual.IVisualHost;

    private locale: string;
    private localizationManager: powerbiVisualsApi.extensibility.ILocalizationManager;
    private horizontalAutoScrollingPositionOffset: number = 200;

    private selectedGranulaPos: number = null;

    private isForceSelectionReset: boolean = false;

    private selectionManager: ISelectionManager;

    private cursorDragBehavior = d3Drag<any, ICursorDataPoint>()
        .subject((_: D3DragEvent<any, ICursorDataPoint, ICursorDataPoint>, cursorDataPoint: ICursorDataPoint) => {
            const cursorCopy = Object.assign({}, cursorDataPoint);

            cursorCopy.x = cursorCopy.selectionIndex * this.timelineProperties.cellWidth;

            return cursorCopy;
        })
        .on("drag", null)
        .on("end", null)
        .on("drag", this.onCursorDrag.bind(this))
        .on("end", this.onCursorDragEnd.bind(this));

    private calendarFactory: CalendarFactory = null;

    constructor(options: powerbiVisualsApi.extensibility.visual.VisualConstructorOptions) {
        const element: HTMLElement = options.element;

        this.host = options.host;

        this.calendarFactory = new CalendarFactory();

        this.selectionManager = this.host.createSelectionManager();

        this.initialized = false;
        this.locale = this.host.locale;

        this.localizationManager = this.host.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);

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
            .on("click", null)
            .on("click", () => this.clearUserSelection());

        this.headerWrapperSelection = this.rootSelection
            .append("div");

        this.headerSelection = this.headerWrapperSelection
            .append("svg")
            .attr("width", "100%")
            .style("display", "block")
            .style("position", "absolute");

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
            const startDate: Date = Utils.GET_START_SELECTION_DATE(this.timelineData);
            const endDate: Date = Utils.GET_END_SELECTION_DATE(this.timelineData);

            this.changeGranularity(granularity, startDate, endDate);
        }
    }

    public update(options: powerbiVisualsApi.extensibility.visual.VisualUpdateOptions): void {
        try {
            this.host.eventService.renderingStarted(options);

            if (!Timeline.ARE_VISUAL_UPDATE_OPTIONS_VALID(options)) {
                this.clearData();
                return;
            }

            this.options = options;
            this.dataView = options.dataViews[0];
            // it contains dates from data view.
            this.datePeriod = this.createDatePeriod(this.dataView);


            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(TimeLineSettingsModel, this.dataView);
            this.formattingSettings.setLocalizedOptions(this.localizationManager);

            if (!this.initialized) {
                this.timelineData = {
                    cursorDataPoints: [],
                    timelineDataPoints: [],
                };
            }

            Timeline.applyFilters(
                this.formattingSettings,
                <AdvancedFilter[]>(this.options.jsonFilters),
                this.host.colorPalette,
            );

            this.adjustHeightOfElements(options.viewport.width);

            this.timelineGranularityData = new GranularityData(this.datePeriod.startDate, this.datePeriod.endDate);

            this.createTimelineData(
                this.formattingSettings,
                this.datePeriod.startDate,
                this.datePeriod.endDate,
                this.timelineGranularityData,
                this.locale,
                this.localizationManager,
            );

            this.updateCalendar(this.formattingSettings);

            const adjustedPeriod: IAdjustedFilterDatePeriod = this.adjustFilterDatePeriod();
            const datePeriod: ITimelineDatePeriodBase = this.datePeriod;
            const granularity: GranularityType = GranularityType[this.formattingSettings.granularity.granularity.value.value];
            const isCurrentPeriodSelected: boolean = !this.isForceSelectionReset && this.formattingSettings.forceSelection.currentPeriod.value;
            const isLatestAvailableDateSelected: boolean = !this.isForceSelectionReset && this.formattingSettings.forceSelection.latestAvailableDate.value;
            const isForceSelected: boolean = !this.isForceSelectionReset && (isCurrentPeriodSelected || isLatestAvailableDateSelected);
            this.isForceSelectionReset = false; // Reset it to default state to allow re-enabling Force Selection
            let currentForceSelectionResult = {startDate: null, endDate: null};

            if (isCurrentPeriodSelected) {
                currentForceSelectionResult = ({
                    endDate: adjustedPeriod.period.endDate,
                    startDate: adjustedPeriod.period.startDate,
                } = Timeline.SELECT_CURRENT_PERIOD(datePeriod, granularity, this.calendar));
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
                adjustedPeriod.period.endDate = adjustedPeriod.adaptedDataEndDate;
                ({
                    endDate: adjustedPeriod.period.endDate,
                    startDate: adjustedPeriod.period.startDate,
                } = Timeline.SELECT_PERIOD(datePeriod, granularity, this.calendar, this.datePeriod.endDate));
            }

            this.updatePrevFilterState(adjustedPeriod, isForceSelected, this.timelineData.filterColumnTarget);

            if (!this.initialized) {
                this.initialized = true;
            }

            if (adjustedPeriod.period.startDate && adjustedPeriod.period.endDate) {
                const granularityType = GranularityType[this.formattingSettings.granularity.granularity.value.value];
                this.changeGranularity(granularityType, adjustedPeriod.period.startDate, adjustedPeriod.period.endDate);
                this.updateCalendar(this.formattingSettings);
            }

            this.renderGranularityFrame(granularity);

            this.render(
                this.timelineData,
                this.formattingSettings,
                this.timelineProperties,
                options,
            );

            this.handleContextMenu();
        } catch (ex) {
            this.host.eventService.renderingFailed(options, JSON.stringify(ex));
        }
        this.host.eventService.renderingFinished(options);
    }

    public fillCells(visSettings: TimeLineSettingsModel): void {
        const dataPoints: ITimelineDataPoint[] = this.timelineData.timelineDataPoints;

        const cellSelection: D3Selection<any, ITimelineDataPoint, any, any> = this.mainGroupSelection
            .selectAll(Timeline.TimelineSelectors.CellRect.selectorName)
            .data(dataPoints);

        const cellsSettings: CellsSettingsCard = visSettings.cells;

        let singleCaseDone: boolean = false;

        cellSelection
            .attr("fill", (dataPoint: ITimelineDataPoint, index: number) => {
                const isSelected: boolean = Utils.IS_GRANULE_SELECTED(dataPoint, this.timelineData);

                if (visSettings.scrollAutoAdjustment.topLevelSlice.value && isSelected && !singleCaseDone) {
                    const selectedGranulaPos: number = (<any>(cellSelection.nodes()[index])).x.baseVal.value;
                    this.selectedGranulaPos = selectedGranulaPos;
                    singleCaseDone = true;
                }

                return isSelected
                    ? cellsSettings.fillSelected.value.value
                    : (cellsSettings.fillUnselected.value.value || Utils.DefaultCellColor);
            })
            .style("stroke", (dataPoint: ITimelineDataPoint) => {
                const isSelected: boolean = Utils.IS_GRANULE_SELECTED(dataPoint, this.timelineData);

                return isSelected
                    ? cellsSettings.selectedStrokeColor.value.value
                    : cellsSettings.strokeColor.value.value;
            })
            .style("stroke-width", cellsSettings.strokeWidth.value + "px");
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
            .on("click", null)
            .on("touchstart", null)
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
                return pixelConverter.toString(
                    dataPoint.datePeriod.fraction * timelineProperties.cellWidth - this.formattingSettings.cells.gapWidth.value
                );
            })
            .append("title")
            .text((dataPoint: ITimelineDataPoint) => timelineData.currentGranularity.generateLabel(dataPoint.datePeriod).title);

        this.fillCells(this.formattingSettings);
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
                let dx: number = cursorDataPoint.selectionIndex * this.timelineProperties.cellWidth;

                // right cursor
                if (cursorDataPoint.cursorIndex === 1) {
                    dx -= this.formattingSettings.cells.gapWidth.value;
                }

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
            .style("fill", this.formattingSettings.cursor.show.value ? this.formattingSettings.cursor.color.value.value : "transparent")
            .call(this.cursorDragBehavior);
    }

    public renderTimeRangeText(timelineData: ITimelineData, rangeHeaderSettings: RangeHeaderSettingsCard): void {
        const leftMargin: number = (GranularityNames.length + Timeline.GranularityNamesLength)
            * this.timelineProperties.elementWidth;

        const maxWidth: number = this.svgWidth
            - leftMargin
            - this.timelineProperties.leftMargin
            - rangeHeaderSettings.textSize.value;

        d3SelectAll("g." + Timeline.TimelineSelectors.RangeTextArea.className).remove();

        if (rangeHeaderSettings.topLevelSlice.value && maxWidth > 0) {
            this.rangeTextSelection = this.headerSelection
                .append("g")
                .classed(Timeline.TimelineSelectors.RangeTextArea.className, true)
                .append("text");

            const timeRangeText: string = Utils.TIME_RANGE_TEXT(timelineData);

            const labelFormattedTextOptions: dataLabelInterfaces.LabelFormattedTextOptions = {
                fontSize: rangeHeaderSettings.textSize.value,
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
                .attr("fill", rangeHeaderSettings.fontColor.value.value)
                .style("font-size", pixelConverter.fromPointToPixel(rangeHeaderSettings.textSize.value))
                .text(actualText)
                .append("title")
                .text(timeRangeText);
        }
    }

    public setSelection(timelineData: ITimelineData): void {
        if (Utils.ARE_BOUNDS_OF_SELECTION_AND_AVAILABLE_DATES_THE_SAME(timelineData)) {
            this.clearSelection(timelineData.filterColumnTarget);

            return;
        }

        this.applyDatePeriod(
            Utils.GET_START_SELECTION_DATE(timelineData),
            Utils.GET_END_SELECTION_DATE(timelineData),
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

    public getFilterAction(startDate: Date, endDate: Date): powerbiVisualsApi.FilterAction {
        return startDate !== undefined
        && endDate !== undefined
        && startDate !== null
        && endDate !== null
            ? powerbiVisualsApi.FilterAction.merge
            : powerbiVisualsApi.FilterAction.remove;
    }

    /**
     * Changes the current granularity depending on the given granularity type
     * Separates the new granularity's date periods which contain the start/end selection
     * Unseparates the date periods of the previous granularity.
     * @param granularity The new granularity type
     */
    public changeGranularity(granularity: GranularityType, startDate: Date, endDate: Date): void {
        Utils.UNSEPARATE_SELECTION(this.timelineData.currentGranularity.getDatePeriods());

        this.timelineData.currentGranularity = this.timelineGranularityData.getGranularity(granularity);
        Utils.SEPARATE_SELECTION(this.timelineData, startDate, endDate);
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

    public selectPeriod(granularityType: GranularityType): void {
        if (this.timelineData.currentGranularity.getType() === granularityType) {
            return;
        }

        this.host.persistProperties({
            merge: [{
                objectName: "granularity",
                properties: {granularity: GranularityType[granularityType]},
                selector: null,
            }],
        });

        const selectedGranularity = this.formattingSettings.granularity.granularity.items
            .filter(granularityOption => granularityOption.value === GranularityType[granularityType])[0];

        this.formattingSettings.granularity.granularity.value = selectedGranularity;
    }

    public onCursorDrag(event: D3DragEvent<any, ICursorDataPoint, ICursorDataPoint>, currentCursor: ICursorDataPoint): void {
        const mouseEvent: MouseEvent = event.sourceEvent;
        const cursorOverElement: ITimelineCursorOverElement = this.findCursorOverElement(mouseEvent.x);

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

        this.fillCells(this.formattingSettings);

        this.renderCursors(
            this.timelineData,
            this.timelineProperties.cellHeight,
            this.timelineProperties.cellsYPosition);

        this.renderTimeRangeText(this.timelineData, this.formattingSettings.rangeHeader);
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

        const index: number = Utils.GET_INDEX_BY_POSITION(
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

    private updatePrevFilterState(
        adjustedPeriod: IAdjustedFilterDatePeriod,
        isForceSelected: boolean,
        target: IFilterColumnTarget): void {
        const wasFilterChanged: boolean =
            String(this.prevFilteredStartDate) !== String(adjustedPeriod.period.startDate) ||
            String(this.prevFilteredEndDate) !== String(adjustedPeriod.period.endDate);

        if (isForceSelected && wasFilterChanged) {
            this.applyDatePeriod(adjustedPeriod.period.startDate, adjustedPeriod.period.endDate, target);
        }

        this.prevFilteredStartDate = adjustedPeriod.period.startDate;
        this.prevFilteredEndDate = adjustedPeriod.period.endDate;
    }

    private adjustFilterDatePeriod(): IAdjustedFilterDatePeriod {
        // It contains date boundaties that was taken from current slicer filter (filter range).
        // If nothing is selected in slicer the boundaries will be null.
        const filterDatePeriod: DatePeriodBase = <DatePeriodBase>(this.formattingSettings.general.datePeriod);

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
            adaptedDataEndDate = new Date(<any>(this.datePeriod.endDate));
            adaptedDataEndDate.setDate(adaptedDataEndDate.getDate() + 1);
        }

        if (filterDatePeriod.endDate && adaptedDataEndDate && filterDatePeriod.endDate.getTime() > adaptedDataEndDate.getTime()) {
            filterDatePeriod.endDate = null;
        }

        return {
            adaptedDataEndDate,
            period: filterDatePeriod,
        }
    }

    private adjustHeightOfElements(viewportWidth: number): void {
        this.timelineProperties.legendHeight = 0;
        if (this.formattingSettings.rangeHeader.topLevelSlice.value) {
            this.timelineProperties.legendHeight = Timeline.TimelineMargins.LegendHeightRange;
        }
        if (this.formattingSettings.granularity.topLevelSlice.value) {
            this.timelineProperties.legendHeight = Timeline.TimelineMargins.LegendHeight;
        }

        this.headerWrapperSelection
            .style("height", this.timelineProperties.legendHeight + "px")
            .style("width", viewportWidth + "px");

        this.headerSelection
            .attr("height", this.timelineProperties.legendHeight);
    }

    private renderGranularityFrame(granularity: GranularityType): void {
        d3SelectAll("g." + Timeline.TimelineSelectors.TimelineSlicer.className).remove();

        if (this.formattingSettings.granularity.topLevelSlice.value) {
            const startXpoint: number = this.timelineProperties.startXpoint;
            const elementWidth: number = this.timelineProperties.elementWidth;

            this.selectorSelection = this.headerSelection
                .append("g")
                .classed(Timeline.TimelineSelectors.TimelineSlicer.className, true);

            this.timelineGranularityData.renderGranularities({
                granularSettings: this.formattingSettings.granularity,
                selectPeriodCallback: (granularityType: GranularityType) => {
                    this.selectPeriod(granularityType);
                },
                selection: this.selectorSelection,
            });

            // create selected period text
            this.selectorSelection
                .append("text")
                .attr("fill", this.formattingSettings.granularity.scaleColor.value.value)
                .classed(Timeline.TimelineSelectors.PeriodSlicerSelection.className, true)
                .text(this.localizationManager.getDisplayName(Utils.GET_GRANULARITY_NAME_KEY(granularity)))
                .attr("x", pixelConverter.toString(startXpoint + Timeline.SelectedTextSelectionFactor * elementWidth))
                .attr("y", pixelConverter.toString(Timeline.SelectedTextSelectionYOffset));
        }
    }

    private handleContextMenu(): void {
        // handle context menu
        this.rootSelection.on('contextmenu', (event: MouseEvent) => {
            const emptySelection = {
                "measures": [],
                "dataMap": {}
            };

            this.selectionManager.showContextMenu(emptySelection, {
                x: event.clientX,
                y: event.clientY
            });
            event.preventDefault();
        });
    }

    private handleClick(event: MouseEvent, dataPoint: ITimelineDataPoint): void {
        event.stopPropagation();

        this.onCellClickHandler(dataPoint, dataPoint.index, event.altKey || event.shiftKey);
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

    private createDatePeriod(dataView: powerbiVisualsApi.DataView): ITimelineDatePeriodBase {
        return Utils.GET_DATE_PERIOD(dataView.categorical.categories[0].values);
    }

    private createTimelineData(
        formattingSettings: TimeLineSettingsModel,
        startDate: Date,
        endDate: Date,
        timelineGranularityData: GranularityData,
        locale: string,
        localizationManager: powerbiVisualsApi.extensibility.ILocalizationManager,
    ) {

        const weekStandardFormat: WeekStandard = WeekStandard[formattingSettings.weeksDeterminationStandards.weekStandard.value.value];

        const calendarFormat: CalendarFormat = {
            month: Month[formattingSettings.fiscalYearCalendar.month.value.value],
            day: formattingSettings.fiscalYearCalendar.day.value,
        }

        const weekDayFormat: WeekDayFormat = {
            daySelection: formattingSettings.weekDay.daySelection.value,
            day: Day[formattingSettings.weekDay.day.value.value],
        }

        const calendar: Calendar = this.calendarFactory.create(weekStandardFormat, calendarFormat, weekDayFormat);

        timelineGranularityData.createGranularities(calendar, locale, localizationManager);
        timelineGranularityData.createLabels();

        if (this.initialized) {
            const actualEndDate: Date = GranularityData.NEXT_DAY(endDate);

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
                const granularityType = GranularityType[formattingSettings.granularity.granularity.value.value];
                this.changeGranularity(
                    granularityType,
                    startDate,
                    actualEndDate,
                );
            } else {
                this.initialized = false;
            }
        }
    }

    private updateCalendar(timelineFormat: TimeLineSettingsModel): void {
        this.calendar = Timeline.CONVERTER(
            this.timelineData,
            this.timelineProperties,
            this.timelineGranularityData,
            this.options.dataViews[0],
            this.initialized,
            timelineFormat,
            this.options.viewport,
            this.calendar,
        );
    }

    private render(
        timelineData: ITimelineData,
        timelineSettings: TimeLineSettingsModel,
        timelineProperties: ITimelineProperties,
        options: powerbiVisualsApi.extensibility.visual.VisualUpdateOptions,
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

        const mainAreaHeight: number = timelineProperties.cellsYPosition
            + timelineProperties.cellHeight
            + Timeline.TimelineMargins.FramePadding
            - Timeline.TimelineMargins.LegendHeight;

        const mainSvgHeight: number = Timeline.TimelineMargins.TopMargin + mainAreaHeight;

        const mainSvgWrapperHeight: number = mainSvgHeight + Timeline.TimelineMargins.FramePadding;

        this.mainSvgWrapperSelection
            .style("height", pixelConverter.toString(Math.max(
                Timeline.MinSizeOfViewport,
                mainSvgWrapperHeight,
            )))
            .style("width",
                this.svgWidth < options.viewport.width
                    ? "100%"
                    : pixelConverter.toString(Math.max(
                        Timeline.MinSizeOfViewport,
                        this.svgWidth,
                    )));

        this.mainSvgSelection
            .attr("height", pixelConverter.toString(Math.max(
                Timeline.MinSizeOfViewport,
                mainSvgHeight,
            )))
            .attr("width", "100%");

        const fixedTranslateString: string = svgManipulation.translate(
            timelineProperties.leftMargin,
            timelineProperties.topMargin + this.timelineProperties.startYpoint,
        );

        // Here still Timeline.TimelineMargins.LegendHeight is used because it always must have permanent negative offset.
        const translateString: string = svgManipulation.translate(
            timelineProperties.cellHeight / Timeline.CellHeightDivider,
            timelineProperties.topMargin - (Timeline.TimelineMargins.LegendHeight - Timeline.TimelineMargins.FramePadding),
        );

        this.mainGroupSelection.attr("transform", translateString);

        if (this.selectorSelection) {
            this.selectorSelection.attr("transform", fixedTranslateString);
        }

        this.cursorGroupSelection.attr("transform", translateString);

        // Removing currently displayed labels
        this.mainGroupSelection
            .selectAll(Timeline.TimelineSelectors.TextLabel.selectorName)
            .remove();

        const yPos: number = this.renderBunchOfLabels(timelineSettings);

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

    private renderBunchOfLabels(timelineSettings: TimeLineSettingsModel): number {
        const extendedLabels = this.timelineData.currentGranularity.getExtendedLabel();
        const granularityType = this.timelineData.currentGranularity.getType();
        const yDiff: number = Timeline.DefaultYDiff;
        let yPos: number = 0;

        if (timelineSettings.labels.topLevelSlice.value) {
            if (timelineSettings.labels.displayAll.value || granularityType === GranularityType.year) {
                this.renderLabels(
                    extendedLabels.yearLabels,
                    this.yearLabelsSelection,
                    this.calculateYOffset(yPos),
                    granularityType === 0);
                if (granularityType >= GranularityType.year) {
                    yPos += yDiff;
                }
            }

            if (timelineSettings.labels.displayAll.value || granularityType === GranularityType.quarter) {
                this.renderLabels(
                    extendedLabels.quarterLabels,
                    this.quarterLabelsSelection,
                    this.calculateYOffset(yPos),
                    granularityType === 1);
                if (granularityType >= GranularityType.quarter) {
                    yPos += yDiff;
                }
            }

            if (timelineSettings.labels.displayAll.value || granularityType === GranularityType.month) {
                this.renderLabels(
                    extendedLabels.monthLabels,
                    this.monthLabelsSelection,
                    this.calculateYOffset(yPos),
                    granularityType === 2);
                if (granularityType >= GranularityType.month) {
                    yPos += yDiff;
                }
            }

            if (timelineSettings.labels.displayAll.value || granularityType === GranularityType.week) {
                this.renderLabels(
                    extendedLabels.weekLabels,
                    this.weekLabelsSelection,
                    this.calculateYOffset(yPos),
                    granularityType === 3);
                if (granularityType >= GranularityType.week) {
                    yPos += yDiff;
                }
            }

            if (timelineSettings.labels.displayAll.value || granularityType === GranularityType.day) {
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

        return yPos;
    }

    private calculateYOffset(index: number): number {
        if (!this.formattingSettings.labels.topLevelSlice.value) {
            return this.timelineProperties.textYPosition;
        }

        return this.timelineProperties.textYPosition
            + (1 + index) * pixelConverter.fromPointToPixel(this.formattingSettings.labels.textSize.value);
    }

    private renderLabels(
        labels: ITimelineLabel[],
        labelsElement: D3Selection<any, any, any, any>,
        yPosition: number,
        isLast: boolean,
    ): void {
        const labelTextSelection: D3Selection<any, ITimelineLabel, any, any> = labelsElement
            .selectAll(Timeline.TimelineSelectors.TextLabel.selectorName);

        if (!this.formattingSettings.labels.topLevelSlice.value) {
            labelTextSelection.remove();
            return;
        }

        const labelsGroupSelection: D3Selection<any, ITimelineLabel, any, any> = labelTextSelection.data(labels);
        const fontSize: string = pixelConverter.fromPoint(this.formattingSettings.labels.textSize.value);

        labelsGroupSelection
            .exit()
            .remove();

        labelsGroupSelection
            .enter()
            .append("text")
            .classed(Timeline.TimelineSelectors.TextLabel.className, true)
            .merge(labelsGroupSelection)
            .text((label: ITimelineLabel, id: number) => {
                if (!isLast && id === 0 && labels.length > 1) {
                    let textProperties: formattingInterfaces.TextProperties = {
                        fontFamily: Timeline.DefaultFontFamily,
                        fontSize,
                        text: labels[0].text,
                    };

                    const halfFirstTextWidth = textMeasurementService.measureSvgTextWidth(textProperties)
                        / Timeline.TextWidthMiddleDivider;

                    textProperties = {
                        fontFamily: Timeline.DefaultFontFamily,
                        fontSize,
                        text: labels[1].text,
                    };

                    const halfSecondTextWidth = textMeasurementService.measureSvgTextWidth(textProperties)
                        / Timeline.TextWidthMiddleDivider;

                    const diff: number = this.timelineProperties.cellWidth
                        * (labels[1].id - labels[0].id);

                    if (diff < halfFirstTextWidth + halfSecondTextWidth) {
                        return "";
                    }
                }

                const labelFormattedTextOptions: dataLabelInterfaces.LabelFormattedTextOptions = {
                    fontSize: this.formattingSettings.labels.textSize.value,
                    label: label.text,
                    maxWidth: this.timelineProperties.cellWidth * (isLast
                            ? Timeline.CellWidthLastFactor
                            : Timeline.CellWidthNotLastFactor
                    ),
                };

                return dataLabelUtils.getLabelFormattedText(labelFormattedTextOptions);
            })
            .style("font-size", pixelConverter.fromPoint(this.formattingSettings.labels.textSize.value))
            .attr("x", (label: ITimelineLabel) => {
                return (label.id + Timeline.LabelIdOffset) * this.timelineProperties.cellWidth;
            })
            .attr("y", yPosition)
            .attr("fill", this.formattingSettings.labels.fontColor.value.value)
            .append("title")
            .text((label: ITimelineLabel) => label.title);
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
            } else {
                cursorDataPoints[0].selectionIndex = dataPoint.datePeriod.index;
                timelineData.selectionStartIndex = index;
            }
        } else {
            timelineData.selectionStartIndex = index;
            timelineData.selectionEndIndex = index;

            cursorDataPoints[0].selectionIndex = dataPoint.datePeriod.index;
            cursorDataPoints[1].selectionIndex = dataPoint.datePeriod.index + dataPoint.datePeriod.fraction;
        }

        this.fillCells(this.formattingSettings);

        this.renderCursors(
            timelineData,
            timelineProperties.cellHeight,
            timelineProperties.cellsYPosition,
        );

        this.renderTimeRangeText(timelineData, this.formattingSettings.rangeHeader);

        this.setSelection(timelineData);
        this.toggleForceSelectionOptions();
    }

    private scrollAutoFocusFunc(selectedGranulaPos: number): void {
        if (!selectedGranulaPos) {
            return;
        }

        this.rootSelection.node().scrollLeft = selectedGranulaPos - this.horizontalAutoScrollingPositionOffset;
    }

    private toggleForceSelectionOptions(): void {
        const isForceSelectionTurnedOn: boolean = this.formattingSettings.forceSelection.currentPeriod.value
            || this.formattingSettings.forceSelection.latestAvailableDate.value;

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

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
