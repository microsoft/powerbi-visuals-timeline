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
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    // powerbi.extensibility.utils.formatting
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;

    // powerbi.extensibility.utils.interactivity
    import appendClearCatcher = powerbi.extensibility.utils.interactivity.appendClearCatcher;

    // powerbi.extensibility.utils.chart
    import getLabelFormattedText = powerbi.extensibility.utils.chart.dataLabel.utils.getLabelFormattedText;
    import LabelFormattedTextOptions = powerbi.extensibility.utils.chart.dataLabel.LabelFormattedTextOptions;

    export interface SQColumnRefExpr { } // TODO: It's a temporary interface. We have to remove it soon.

    export enum GranularityType {
        year,
        quarter,
        month,
        week,
        day
    }

    export interface GranularityName {
        granularityType: GranularityType;
        name: string;
    }

    export interface TimelineMargins {
        LeftMargin: number;
        RightMargin: number;
        TopMargin: number;
        BottomMargin: number;
        CellWidth: number;
        CellHeight: number;
        StartXpoint: number;
        StartYpoint: number;
        ElementWidth: number;
        MinCellWidth: number;
        MaxCellHeight: number;
        PeriodSlicerRectWidth: number;
        PeriodSlicerRectHeight: number;
    }

    export interface TimelineSelectors {
        TimelineVisual: ClassAndSelector;
        SelectionRangeContainer: ClassAndSelector;
        textLabel: ClassAndSelector;
        LowerTextCell: ClassAndSelector;
        UpperTextCell: ClassAndSelector;
        UpperTextArea: ClassAndSelector;
        LowerTextArea: ClassAndSelector;
        RangeTextArea: ClassAndSelector;
        CellsArea: ClassAndSelector;
        CursorsArea: ClassAndSelector;
        MainArea: ClassAndSelector;
        SelectionCursor: ClassAndSelector;
        Cell: ClassAndSelector;
        CellRect: ClassAndSelector;
        VertLine: ClassAndSelector;
        TimelineSlicer: ClassAndSelector;
        PeriodSlicerGranularities: ClassAndSelector;
        PeriodSlicerSelection: ClassAndSelector;
        PeriodSlicerSelectionRect: ClassAndSelector;
        PeriodSlicerRect: ClassAndSelector;
    }

    export interface TimelineLabel {
        title: string;
        text: string;
        id: number;
    }

    export interface ExtendedLabel {
        yearLabels?: TimelineLabel[];
        quarterLabels?: TimelineLabel[];
        monthLabels?: TimelineLabel[];
        weekLabels?: TimelineLabel[];
        dayLabels?: TimelineLabel[];
    }

    const GranularityNames: GranularityName[] = [
        {
            granularityType: GranularityType.year,
            name: "year"
        }, {
            granularityType: GranularityType.quarter,
            name: "quarter"
        }, {
            granularityType: GranularityType.month,
            name: "month"
        }, {
            granularityType: GranularityType.week,
            name: "week"
        }, {
            granularityType: GranularityType.day,
            name: "day"
        }
    ];

    export interface ITimelineJSONDatePeriod {
        startDate: string;
        endDate: string;
    }

    export interface ITimelineDatePeriod {
        startDate: Date;
        endDate: Date;
    }

    export interface TimelineSettingsTypeValidator {
        (value: any, defaultValue: any): any;
    }

    export class TimelineSettings {
        public static get Default() {
            return new this();
        }

        public static parse(dataView: DataView): TimelineSettings {
            return new this();
        }

        public originalSettings: TimelineSettings;
        public createOriginalSettings(): void {
            this.originalSettings = _.cloneDeep(this);
        }

        //Default Settings
        public general: TimelineGeneralSettings = {
            datePeriod: TimelineDatePeriodBase.createEmpty(),
            filter: null
        };

        public calendar: TimelineCalendarSettings = {
            month: 0,
            day: 1
        };

        public weekDay: TimelineWeekDaySettings = {
            day: 0
        };

        public rangeHeader: TimelineLabelsSettings = {
            show: true,
            fontColor: "#777777",
            textSize: 9
        };

        public cells: TimelineCellsSettings = {
            fillSelected: "#ADD8E6",
            fillUnselected: "" // transparent by default
        };

        public granularity: TimelineGranularitySettings = {
            scaleColor: "#000000",
            sliderColor: "#AAAAAA",
            granularity: GranularityType.month
        };

        public labels: TimelineLabelsSettings = {
            show: true,
            fontColor: "#777777",
            textSize: 9
        };
    }

    export class TimelineDatePeriodBase implements ITimelineDatePeriod {
        public startDate: Date = null;
        public endDate: Date = null;

        public static parse(jsonString: string): TimelineDatePeriodBase {
            var datePeriod: ITimelineJSONDatePeriod,
                startDate: Date = null,
                endDate: Date = null;

            try {
                datePeriod = JSON.parse(jsonString);
            } finally { }

            if (datePeriod) {
                startDate = TimelineUtils.parseDateWithoutTimezone(datePeriod.startDate);
                endDate = TimelineUtils.parseDateWithoutTimezone(datePeriod.endDate);
            }

            return TimelineDatePeriodBase.create(startDate, endDate);
        }

        public static create(startDate: Date, endDate: Date): TimelineDatePeriodBase {
            return new TimelineDatePeriodBase(startDate, endDate);
        }

        public static createEmpty(): TimelineDatePeriodBase {
            return TimelineDatePeriodBase.create(null, null);
        }

        constructor(startDate: Date, endDate: Date) {
            this.startDate = startDate;
            this.endDate = endDate;
        }

        public toString(): string {
            let jsonDatePeriod: ITimelineJSONDatePeriod = {
                startDate: TimelineUtils.toStringDateWithoutTimezone(this.startDate),
                endDate: TimelineUtils.toStringDateWithoutTimezone(this.endDate)
            };

            return JSON.stringify(jsonDatePeriod);
        }
    }

    export interface TimelineDatePeriod extends ITimelineDatePeriod {
        identifierArray: (string | number)[];
        year: number;
        week: number[];
        fraction: number;
        index: number;
    }

    export interface Granularity {
        getType?(): GranularityType;
        splitDate(date: Date): (string | number)[];
        getDatePeriods(): TimelineDatePeriod[];
        resetDatePeriods(): void;
        getExtendedLabel(): ExtendedLabel;
        setExtendedLabel(extendedLabel: ExtendedLabel): void;
        createLabels(granularity: Granularity): TimelineLabel[];
        sameLabel?(firstDatePeriod: TimelineDatePeriod, secondDatePeriod: TimelineDatePeriod): boolean;
        generateLabel?(datePeriod: TimelineDatePeriod): TimelineLabel;
        addDate(date: Date);
        setNewEndDate(date: Date): void;
        splitPeriod(index: number, newFraction: number, newDate: Date): void;
    }

    export interface TimelineCursorOverElement {
        index: number;
        datapoint: TimelineDatapoint;
    }

    export class TimelineGranularityBase implements Granularity {
        protected calendar: Calendar;

        private datePeriods: TimelineDatePeriod[] = [];
        private extendedLabel: ExtendedLabel;

        constructor(calendar: Calendar) {
            this.calendar = calendar;
        }

        public splitDate(date: Date): (string | number)[] {
            return [];
        }

        /**
        * Returns the short month name of the given date (e.g. Jan, Feb, Mar)
        */
        public shortMonthName(date: Date): string {
            return date.toString().split(' ')[1];
        }

        public resetDatePeriods(): void {
            this.datePeriods = [];
        }

        public getDatePeriods() {
            return this.datePeriods;
        }

        public getExtendedLabel(): ExtendedLabel {
            return this.extendedLabel;
        }

        public setExtendedLabel(extendedLabel: ExtendedLabel): void {
            this.extendedLabel = extendedLabel;
        }

        public createLabels(granularity: Granularity): TimelineLabel[] {
            let labels: TimelineLabel[] = [],
                lastDatePeriod: TimelineDatePeriod;

            this.datePeriods.forEach((x) => {
                if (_.isEmpty(labels) || !granularity.sameLabel(x, lastDatePeriod)) {
                    lastDatePeriod = x;
                    labels.push(granularity.generateLabel(x));
                }
            });

            return labels;
        }

        /**
        * Adds the new date into the given datePeriods array
        * If the date corresponds to the last date period, given the current granularity,
        * it will be added to that date period. Otherwise, a new date period will be added to the array.
        * i.e. using Month granularity, Feb 2 2015 corresponds to Feb 3 2015.
        * It is assumed that the given date does not correspond to previous date periods, other than the last date period
        */
        public addDate(date: Date): void {
            let datePeriods: TimelineDatePeriod[] = this.getDatePeriods(),
                lastDatePeriod: TimelineDatePeriod = datePeriods[datePeriods.length - 1],
                identifierArray: (string | number)[] = this.splitDate(date);

            if (datePeriods.length === 0 || !_.isEqual(lastDatePeriod.identifierArray, identifierArray)) {
                if (datePeriods.length > 0) {
                    lastDatePeriod.endDate = date;
                }

                datePeriods.push({
                    identifierArray: identifierArray,
                    startDate: date,
                    endDate: date,
                    week: this.determineWeek(date),
                    year: this.determineYear(date),
                    fraction: 1,
                    index: datePeriods.length
                });
            }
            else {
                lastDatePeriod.endDate = date;
            }
        }

        public setNewEndDate(date: Date): void {
            _.last(this.datePeriods).endDate = date;
        }

        /**
         * Splits a given period into two periods.
         * The new period is added after the index of the old one, while the old one is simply updated.
         * @param index The index of the date priod to be split
         * @param newFraction The fraction value of the new date period
         * @param newDate The date in which the date period is split
         */
        public splitPeriod(index: number, newFraction: number, newDate: Date): void {
            let oldDatePeriod: TimelineDatePeriod = this.datePeriods[index];

            oldDatePeriod.fraction -= newFraction;

            let newDateObject: TimelineDatePeriod = {
                identifierArray: oldDatePeriod.identifierArray,
                startDate: newDate,
                endDate: oldDatePeriod.endDate,
                week: this.determineWeek(newDate),
                year: this.determineYear(newDate),
                fraction: newFraction,
                index: oldDatePeriod.index + oldDatePeriod.fraction
            };

            oldDatePeriod.endDate = newDate;

            this.datePeriods.splice(index + 1, 0, newDateObject);
        }

        public determineWeek(date: Date): number[] {
            var year = this.determineYear(date);

            if (this.inPreviousYear(date)) {
                year--;
            }

            let dateOfFirstWeek: Date = this.calendar.getDateOfFirstWeek(year),
                weeks: number = TimelineUtils.getAmountOfWeeksBetweenDates(dateOfFirstWeek, date);

            return [weeks, year];
        }

        private inPreviousYear(date: Date): boolean {
            let dateOfFirstWeek: Date = this.calendar.getDateOfFirstWeek(this.determineYear(date));
            return date < dateOfFirstWeek;
        }

        public determineYear(date: Date): number {
            let firstDay: Date = new Date(
                date.getFullYear(),
                this.calendar.getFirstMonthOfYear(),
                this.calendar.getFirstDayOfYear());

            return date.getFullYear() - ((firstDay <= date) ? 0 : 1);
        }
    }

    export class DayGranularity extends TimelineGranularityBase {
        public getType(): GranularityType {
            return GranularityType.day;
        }

        public splitDate(date: Date): (string | number)[] {
            return [
                this.shortMonthName(date),
                date.getDate(),
                this.determineYear(date)
            ];
        }

        public sameLabel(firstDatePeriod: TimelineDatePeriod, secondDatePeriod: TimelineDatePeriod): boolean {
            return firstDatePeriod.startDate.getTime() === secondDatePeriod.startDate.getTime();
        }

        public generateLabel(datePeriod: TimelineDatePeriod): TimelineLabel {
            return {
                title: this.shortMonthName(datePeriod.startDate)
                + ' '
                + datePeriod.startDate.getDate()
                + ' - '
                + datePeriod.year,
                text: datePeriod.startDate.getDate().toString(),
                id: datePeriod.index
            };
        }
    }

    export class MonthGranularity extends TimelineGranularityBase {
        public getType(): GranularityType {
            return GranularityType.month;
        }

        public splitDate(date: Date): (string | number)[] {
            return [this.shortMonthName(date), this.determineYear(date)];
        }

        public sameLabel(firstDatePeriod: TimelineDatePeriod, secondDatePeriod: TimelineDatePeriod): boolean {
            return this.shortMonthName(firstDatePeriod.startDate) === this.shortMonthName(secondDatePeriod.startDate)
                && this.determineYear(firstDatePeriod.startDate) === this.determineYear(secondDatePeriod.startDate);
        }

        public generateLabel(datePeriod: TimelineDatePeriod): TimelineLabel {
            let shortMonthName = this.shortMonthName(datePeriod.startDate);

            return {
                title: shortMonthName,
                text: shortMonthName,
                id: datePeriod.index
            };
        }
    }

    export class WeekGranularity extends TimelineGranularityBase {
        public getType(): GranularityType {
            return GranularityType.week;
        }

        public splitDate(date: Date): (string | number)[] {
            return this.determineWeek(date);
        }

        public sameLabel(firstDatePeriod: TimelineDatePeriod, secondDatePeriod: TimelineDatePeriod): boolean {
            return _.isEqual(firstDatePeriod.week, secondDatePeriod.week);
        }

        public generateLabel(datePeriod: TimelineDatePeriod): TimelineLabel {
            return {
                title: 'Week ' + datePeriod.week[0] + ' - ' + datePeriod.week[1],
                text: 'W' + datePeriod.week[0],
                id: datePeriod.index
            };
        }
    }

    export class QuarterGranularity extends TimelineGranularityBase {
        /**
         * Returns the date's quarter name (e.g. Q1, Q2, Q3, Q4)
         * @param date A date 
         */
        private quarterText(date: Date): string {
            let quarter: number = 3,
                year: number = this.determineYear(date);

            while (date < this.calendar.getQuarterStartDate(year, quarter))
                if (quarter > 0)
                    quarter--;
                else {
                    quarter = 3;
                    year--;
                }

            quarter++;

            return 'Q' + quarter;
        }

        public getType(): GranularityType {
            return GranularityType.quarter;
        }

        public splitDate(date: Date): (string | number)[] {
            return [
                this.quarterText(date),
                this.determineYear(date)
            ];
        }

        public sameLabel(firstDatePeriod: TimelineDatePeriod, secondDatePeriod: TimelineDatePeriod): boolean {
            return this.quarterText(firstDatePeriod.startDate) === this.quarterText(secondDatePeriod.startDate)
                && firstDatePeriod.year === secondDatePeriod.year;
        }

        public generateLabel(datePeriod: TimelineDatePeriod): TimelineLabel {
            let quarter: string = this.quarterText(datePeriod.startDate);

            return {
                title: quarter + ' ' + datePeriod.year,
                text: quarter,
                id: datePeriod.index
            };
        }
    }

    export class YearGranularity extends TimelineGranularityBase {
        public getType(): GranularityType {
            return GranularityType.year;
        }

        public splitDate(date: Date): (string | number)[] {
            return [this.determineYear(date)];
        }

        public sameLabel(firstDatePeriod: TimelineDatePeriod, secondDatePeriod: TimelineDatePeriod): boolean {
            return firstDatePeriod.year === secondDatePeriod.year;
        }

        public generateLabel(datePeriod: TimelineDatePeriod): TimelineLabel {
            return {
                title: 'Year ' + datePeriod.year,
                text: datePeriod.year.toString(),
                id: datePeriod.index
            };
        }
    }

    export class TimelineGranularityData {
        private dates: Date[];
        private granularities: Granularity[];
        private endingDate: Date;

        /**
         * Returns the date of the previos day 
         * @param date The following date
         */
        public static previousDay(date: Date): Date {
            let prevDay: Date = TimelineUtils.resetTime(date);

            prevDay.setDate(prevDay.getDate() - 1);

            return prevDay;
        }

        /**
         * Returns the date of the next day 
         * @param date The previous date
         */
        public static nextDay(date: Date): Date {
            let nextDay: Date = TimelineUtils.resetTime(date);

            nextDay.setDate(nextDay.getDate() + 1);

            return nextDay;
        }

        /**
        * Returns an array of dates with all the days between the start date and the end date
        */
        private setDatesRange(startDate: Date, endDate: Date): void {
            let date: Date = startDate;

            this.dates = [];

            while (date <= endDate) {
                this.dates.push(date);
                date = TimelineGranularityData.nextDay(date);
            }
        }

        constructor(startDate: Date, endDate: Date) {
            this.granularities = [];
            this.setDatesRange(startDate, endDate);

            let lastDate: Date = this.dates[this.dates.length - 1];

            this.endingDate = TimelineGranularityData.nextDay(lastDate);
        }

        /**
         * Adds a new granularity to the array of granularities.
         * Resets the new granularity, adds all dates to it, and then edits the last date period with the ending date.
         * @param granularity The new granularity to be added
         */
        public addGranularity(granularity: Granularity): void {
            granularity.resetDatePeriods();

            for (let date of this.dates) {
                granularity.addDate(date);
            }

            granularity.setNewEndDate(this.endingDate);

            this.granularities.push(granularity);
        }

        /**
         * Returns a specific granularity from the array of granularities
         * @param index The index of the requested granularity
         */
        public getGranularity(index: number): Granularity {
            return this.granularities[index];
        }

        public createGranularities(calendar: Calendar): void {
            this.granularities = [];

            this.addGranularity(new YearGranularity(calendar));
            this.addGranularity(new QuarterGranularity(calendar));
            this.addGranularity(new MonthGranularity(calendar));
            this.addGranularity(new WeekGranularity(calendar));
            this.addGranularity(new DayGranularity(calendar));
        }

        public createLabels(): void {
            this.granularities.forEach((x) => {
                x.setExtendedLabel({
                    dayLabels: x.getType() >= GranularityType.day
                        ? x.createLabels(this.granularities[GranularityType.day])
                        : [],
                    weekLabels: x.getType() >= GranularityType.week
                        ? x.createLabels(this.granularities[GranularityType.week])
                        : [],
                    monthLabels: x.getType() >= GranularityType.month
                        ? x.createLabels(this.granularities[GranularityType.month])
                        : [],
                    quarterLabels: x.getType() >= GranularityType.quarter
                        ? x.createLabels(this.granularities[GranularityType.quarter])
                        : [],
                    yearLabels: x.getType() >= GranularityType.year
                        ? x.createLabels(this.granularities[GranularityType.year])
                        : [],
                });
            });
        }
    }

    export class TimelineUtils {
        public static TotalMilliseconds: number = 1000;
        public static TotalSeconds: number = 60;
        public static TotalMinutes: number = 60;
        public static TotalHours: number = 24;

        /**
         * We should reduce the latest date of selection using this value,
         * because, as far as I understand, PBI Framework rounds off milliseconds.
         */
        private static OffsetMilliseconds: number = 999;

        private static TotalMillisecondsInADay: number =
        TimelineUtils.TotalMilliseconds
        * TimelineUtils.TotalSeconds
        * TimelineUtils.TotalMinutes
        * TimelineUtils.TotalHours;

        public static convertToDaysFromMilliseconds(milliseconds: number): number {
            return milliseconds / (TimelineUtils.TotalMillisecondsInADay);
        }

        public static getAmountOfDaysBetweenDates(startDate: Date, endDate: Date): number {
            var totalMilliseconds: number = endDate.getTime() - startDate.getTime();

            return TimelineUtils.convertToDaysFromMilliseconds(Math.abs(totalMilliseconds));
        }

        public static getAmountOfWeeksBetweenDates(startDate: Date, endDate: Date): number {
            let totalDays: number = TimelineUtils.getAmountOfDaysBetweenDates(startDate, endDate);

            return 1 + Math.floor(totalDays / 7);
        }

        public static getMillisecondsWithoutTimezone(date: Date): number {
            if (!date) {
                return 0;
            }

            return date.getTime()
                - date.getTimezoneOffset()
                * TimelineUtils.TotalMilliseconds
                * TimelineUtils.TotalSeconds;
        }

        public static getDateWithoutTimezone(date: Date): Date {
            return new Date(TimelineUtils.getMillisecondsWithoutTimezone(date));
        }

        public static toStringDateWithoutTimezone(date: Date): string {
            if (!date) {
                return null;
            }

            return TimelineUtils.getDateWithoutTimezone(date).toISOString();
        }

        public static getEndOfThePreviousDate(date: Date): Date {
            var currentDate: Date = TimelineUtils.resetTime(date);

            currentDate.setMilliseconds(-TimelineUtils.OffsetMilliseconds);

            return currentDate;
        }

        public static parseDateWithoutTimezone(dateString: string): Date {
            if (dateString === null) {
                return null;
            }

            let timeInMilliseconds: number,
                date: Date = new Date(dateString);

            if (date.toString() === "Invalid Date") {
                return null;
            }

            timeInMilliseconds = date.getTime()
                + date.getTimezoneOffset() * TimelineUtils.TotalMilliseconds * TimelineUtils.TotalSeconds;

            return new Date(timeInMilliseconds);
        }

        public static resetTime(date: Date): Date {
            return new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate());
        }

        public static getDatePeriod(values: any[]): ITimelineDatePeriod {
            let startDate: Date,
                endDate: Date;

            values = [].concat(values);

            values.forEach((value: any) => {
                let date: Date = TimelineUtils.parseDate(value);

                if (date < startDate || startDate === undefined) {
                    startDate = date;
                }

                if (date > endDate || endDate === undefined) {
                    endDate = date;
                }
            });

            return { startDate, endDate };
        }

        public static parseDate(value: any): Date {
            let typeOfValue: string = typeof value,
                date: Date = value;

            if (typeOfValue === "number") {
                date = new Date(value, 0);
            }

            if (typeOfValue === "string") {
                date = new Date(value);
            }

            if (date && _.isDate(date) && date.toString() !== "Invalid Date") {
                return TimelineUtils.resetTime(date);
            }

            return undefined;
        }

        public static areBoundsOfSelectionAndAvailableDatesTheSame(timelineData: TimelineData): boolean {
            let datePeriod: TimelineDatePeriod[] = timelineData.currentGranularity.getDatePeriods(),
                startDate: Date = TimelineUtils.getStartSelectionDate(timelineData),
                endDate: Date = TimelineUtils.getEndSelectionDate(timelineData);

            return datePeriod
                && datePeriod.length >= 1
                && startDate
                && endDate
                && datePeriod[0].startDate.getTime() === startDate.getTime()
                && datePeriod[datePeriod.length - 1].endDate.getTime() === endDate.getTime();
        }

        public static getTheLatestDayOfMonth(monthId: number): number {
            let date: Date = new Date(2008, monthId + 1, 0); // leap year, so the latest day of February is 29.

            return date.getDate();
        }

        public static isSemanticFilterAvailableInTheDataView(filter: ISemanticFilter): boolean {
            if (!filter /*|| SemanticFilter.isAnyFilter(filter)*/) {

                return false;
            }

            return true;
        }

        public static isValueEmpty(value: any): boolean {
            return value === undefined || value === null || isNaN(value);
        }

        /**
         * Returns the date of the start of the selection
         * @param timelineData The TimelineData which contains all the date periods
         */
        public static getStartSelectionDate(timelineData: TimelineData): Date {
            return timelineData.currentGranularity.getDatePeriods()[timelineData.selectionStartIndex].startDate;
        }

        /**
         * Returns the date of the end of the selection
         * @param timelineData The TimelineData which contains all the date periods
         */
        public static getEndSelectionDate(timelineData: TimelineData): Date {
            return timelineData.currentGranularity.getDatePeriods()[timelineData.selectionEndIndex].endDate;
        }

        /**
         * Returns the date period of the end of the selection
         * @param timelineData The TimelineData which contains all the date periods
         */
        public static getEndSelectionPeriod(timelineData: TimelineData): TimelineDatePeriod {
            return timelineData.currentGranularity.getDatePeriods()[timelineData.selectionEndIndex];
        }

        /**
         * Returns the color of a cell, depending on whether its date period is between the selected date periods.
         * CellRects should be transparent filled by default if there isn't any color sets.
         * @param d The TimelineDataPoint of the cell
         * @param timelineData The TimelineData with the selected date periods
         * @param timelineFormat The TimelineFormat with the chosen colors
         */
        public static getCellColor(d: TimelineDatapoint, timelineData: TimelineData, cellSettings: TimelineCellsSettings): string {
            let inSelectedPeriods: boolean = d.datePeriod.startDate >= TimelineUtils.getStartSelectionDate(timelineData)
                && d.datePeriod.endDate <= TimelineUtils.getEndSelectionDate(timelineData);

            return inSelectedPeriods
                ? cellSettings.fillSelected
                : (cellSettings.fillUnselected || 'transparent');
        }

        /**
         * Returns the granularity type of the given granularity name
         * @param granularityName The name of the granularity
         */
        public static getGranularityType(granularityName: string): GranularityType {
            let index: number = _.findIndex(GranularityNames, x => x.name === granularityName);
            return GranularityNames[index].granularityType;
        }

        /**
         * Returns the name of the granularity type
         * @param granularity The type of granularity
         */
        public static getGranularityName(granularity: GranularityType): string {
            let index: number = _.findIndex(GranularityNames, x => x.granularityType === granularity);
            return GranularityNames[index].name;
        }

        /**
         * Splits the date periods of the current granularity, in case the stard and end of the selection is in between a date period.
         * i.e. for a quarter granularity and a selection between Feb 6 and Dec 23, the date periods for Q1 and Q4 will be split accordingly
         * @param timelineData The TimelineData that contains the date periods
         * @param startDate The starting date of the selection
         * @param endDate The ending date of the selection
         */
        public static separateSelection(timelineData: TimelineData, startDate: Date, endDate: Date): void {
            let datePeriods: TimelineDatePeriod[] = timelineData.currentGranularity.getDatePeriods(),
                startDateIndex: number = _.findIndex(datePeriods, x => startDate < x.endDate),
                endDateIndex: number = _.findIndex(datePeriods, x => endDate <= x.endDate);

            startDateIndex = startDateIndex >= 0 ? startDateIndex : 0;
            endDateIndex = endDateIndex >= 0 ? endDateIndex : datePeriods.length - 1;

            timelineData.selectionStartIndex = startDateIndex;
            timelineData.selectionEndIndex = endDateIndex;

            let startRatio: number = TimelineUtils.getDateRatio(datePeriods[startDateIndex], startDate, true),
                endRatio: number = TimelineUtils.getDateRatio(datePeriods[endDateIndex], endDate, false);

            if (endRatio > 0) {
                timelineData.currentGranularity.splitPeriod(endDateIndex, endRatio, endDate);
            }

            if (startRatio > 0) {
                let startFration: number = datePeriods[startDateIndex].fraction - startRatio;

                timelineData.currentGranularity.splitPeriod(startDateIndex, startFration, startDate);

                timelineData.selectionStartIndex++;
                timelineData.selectionEndIndex++;
            }
        }

        /**
         * Returns the ratio of the given date compared to the whole date period.
         * The ratio is calculated either from the start or the end of the date period.
         * i.e. the ratio of Feb 7 2016 compared to the month of Feb 2016,
         * is 0.2142 from the start of the month, or 0.7857 from the end of the month.
         * @param datePeriod The date period that contain the specified date
         * @param date The date
         * @param fromStart Whether to calculater the ratio from the start of the date period.
         */
        public static getDateRatio(datePeriod: TimelineDatePeriod, date: Date, fromStart: boolean): number {
            let dateDifference: number = fromStart
                ? date.getTime() - datePeriod.startDate.getTime()
                : datePeriod.endDate.getTime() - date.getTime();

            let periodDifference: number = datePeriod.endDate.getTime() - datePeriod.startDate.getTime();

            return periodDifference === 0
                ? 0
                : dateDifference / periodDifference;
        }

        /**
        * Returns the time range text, depending on the given granularity (e.g. "Feb 3 2014 - Apr 5 2015", "Q1 2014 - Q2 2015")
        */
        public static timeRangeText(timelineData: TimelineData): string {
            let startSelectionDateArray: (string | number)[] = timelineData.currentGranularity
                .splitDate(TimelineUtils.getStartSelectionDate(timelineData));

            let endSelectionDateArray: (string | number)[] = timelineData.currentGranularity
                .splitDate(TimelineUtils.getEndSelectionPeriod(timelineData).startDate);

            return startSelectionDateArray.join(' ') + ' - ' + endSelectionDateArray.join(' ');
        }

        public static dateRangeText(datePeriod: TimelineDatePeriod): string {
            return datePeriod.startDate.toDateString()
                + ' - '
                + TimelineGranularityData.previousDay(datePeriod.endDate).toDateString();
        }

        /**
         * Combines the first two partial date periods, into a single date period.
         * i.e. combines "Feb 1 2016 - Feb 5 2016" with "Feb 5 2016 - Feb 29 2016" into "Feb 1 2016 - Feb 29 2016"
         * @param datePeriods The list of date periods
         */
        public static unseparateSelection(datePeriods: TimelineDatePeriod[]): void {
            let separationIndex: number = _.findIndex(datePeriods, x => x.fraction < 1);

            if (separationIndex < 0) {
                return;
            }

            datePeriods[separationIndex].endDate = datePeriods[separationIndex + 1].endDate;
            datePeriods[separationIndex].fraction += datePeriods[separationIndex + 1].fraction;

            datePeriods.splice(separationIndex + 1, 1);
        }

        public static getIndexByPosition(
            elements: number[],
            widthOfElement: number,
            position: number,
            offset: number = 0): number {

            elements = elements || [];

            let length: number = elements.length;

            if (!TimelineUtils.isValueEmpty(elements[0])
                && !TimelineUtils.isValueEmpty(elements[1])
                && position <= elements[1] * widthOfElement + offset) {

                return 0;
            } else if (
                !TimelineUtils.isValueEmpty(elements[length - 1])
                && position >= elements[length - 1] * widthOfElement + offset) {
                return length - 1;
            }

            for (var i: number = 1; i < length; i++) {
                var left: number = elements[i] * widthOfElement + offset,
                    right: number = elements[i + 1] * widthOfElement + offset;

                if (position >= left && position <= right) {
                    return i;
                }
            }

            return 0;
        }
    }

    export interface TimelineProperties {
        leftMargin: number;
        rightMargin: number;
        topMargin: number;
        bottomMargin: number;
        textYPosition: number;
        startXpoint: number;
        startYpoint: number;
        elementWidth: number;
        cellWidth: number;
        cellHeight: number;
        cellsYPosition: number;
    }

    export interface TimelineGeneralSettings {
        datePeriod: TimelineDatePeriodBase | string;
        filter: ISemanticFilter;
    }

    export interface TimelineCalendarSettings {
        month: number;
        day: number;
    }

    export interface TimelineWeekDaySettings {
        day: number;
    }

    export interface TimelineLabelsSettings {
        show: boolean;
        fontColor: string;
        textSize: number;
    }

    export interface TimelineCellsSettings {
        fillSelected: string;
        fillUnselected: string;
    }

    export interface TimelineGranularitySettings {
        scaleColor: string;
        sliderColor: string;
        granularity: GranularityType;
    }

    export interface TimelineData {
        columnIdentity?: SQColumnRefExpr;
        timelineDatapoints?: TimelineDatapoint[];
        selectionStartIndex?: number;
        selectionEndIndex?: number;
        cursorDataPoints?: CursorDatapoint[];
        currentGranularity?: Granularity;
    }

    export interface CursorDatapoint {
        x: number;
        y: number;
        cursorIndex: number;
        selectionIndex: number;
    }

    export interface TimelineDatapoint {
        index: number;
        datePeriod: TimelineDatePeriod;
    }

    export interface DateDictionary {
        [year: number]: Date;
    }

    export class Calendar {
        private firstDayOfWeek: number;
        private firstMonthOfYear: number;
        private firstDayOfYear: number;
        private dateOfFirstWeek: DateDictionary;
        private quarterFirstMonths: number[];

        public getFirstDayOfWeek(): number {
            return this.firstDayOfWeek;
        }

        public getFirstMonthOfYear(): number {
            return this.firstMonthOfYear;
        }

        public getFirstDayOfYear(): number {
            return this.firstDayOfYear;
        }

        public getQuarterStartDate(year: number, quarterIndex: number): Date {
            return new Date(year, this.quarterFirstMonths[quarterIndex], this.firstDayOfYear);
        }

        public isChanged(
            calendarSettings: TimelineCalendarSettings,
            weekDaySettings: TimelineWeekDaySettings): boolean {
            return this.firstMonthOfYear !== calendarSettings.month
                || this.firstDayOfYear !== calendarSettings.day
                || this.firstDayOfWeek !== weekDaySettings.day;
        }

        constructor(
            calendarFormat: TimelineCalendarSettings,
            weekDaySettings: TimelineWeekDaySettings) {

            this.firstDayOfWeek = weekDaySettings.day;
            this.firstMonthOfYear = calendarFormat.month;
            this.firstDayOfYear = calendarFormat.day;

            this.dateOfFirstWeek = {};

            this.quarterFirstMonths = [0, 3, 6, 9].map((x: number) => {
                return x + this.firstMonthOfYear;
            });
        }

        private calculateDateOfFirstWeek(year: number): Date {
            let date: Date = new Date(year, this.firstMonthOfYear, this.firstDayOfYear);

            while (date.getDay() !== this.firstDayOfWeek) {
                date = TimelineGranularityData.nextDay(date);
            }

            return date;
        }

        public getDateOfFirstWeek(year: number): Date {
            if (!this.dateOfFirstWeek[year]) {
                this.dateOfFirstWeek[year] = this.calculateDateOfFirstWeek(year);
            }

            return this.dateOfFirstWeek[year];
        }
    }

    export class Timeline implements IVisual {
        private static MinSizeOfViewport: number = 0;

        private static TimelineMargins: TimelineMargins = {
            LeftMargin: 15,
            RightMargin: 15,
            TopMargin: 15,
            BottomMargin: 10,
            CellWidth: 40,
            CellHeight: 25,
            StartXpoint: 10,
            StartYpoint: 20,
            ElementWidth: 30,
            MinCellWidth: 30,
            MaxCellHeight: 60,
            PeriodSlicerRectWidth: 15,
            PeriodSlicerRectHeight: 23
        };

        private static TimelineSelectors: TimelineSelectors = {
            TimelineVisual: createClassAndSelector('timeline'),
            SelectionRangeContainer: createClassAndSelector('selectionRangeContainer'),
            textLabel: createClassAndSelector('label'),
            LowerTextCell: createClassAndSelector('lowerTextCell'),
            UpperTextCell: createClassAndSelector('upperTextCell'),
            UpperTextArea: createClassAndSelector('upperTextArea'),
            LowerTextArea: createClassAndSelector('lowerTextArea'),
            RangeTextArea: createClassAndSelector('rangeTextArea'),
            CellsArea: createClassAndSelector('cellsArea'),
            CursorsArea: createClassAndSelector('cursorsArea'),
            MainArea: createClassAndSelector('mainArea'),
            SelectionCursor: createClassAndSelector('selectionCursor'),
            Cell: createClassAndSelector('cell'),
            CellRect: createClassAndSelector('cellRect'),
            VertLine: createClassAndSelector('timelineVertLine'),
            TimelineSlicer: createClassAndSelector('timelineSlicer'),
            PeriodSlicerGranularities: createClassAndSelector('periodSlicerGranularities'),
            PeriodSlicerSelection: createClassAndSelector('periodSlicerSelection'),
            PeriodSlicerSelectionRect: createClassAndSelector('periodSlicerSelectionRect'),
            PeriodSlicerRect: createClassAndSelector('periodSlicerRect')
        };

        private settings: TimelineSettings;

        private timelineProperties: TimelineProperties;

        /**
         * It's public for testability
         */
        public timelineData: TimelineData;

        private timelineGranularityData: TimelineGranularityData;

        private rootSelection: Selection<any>;
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

        private granularitySelectors: string[] = ['Y', 'Q', 'M', 'W', 'D'];

        private selectionManager: ISelectionManager;

        private options: VisualUpdateOptions;
        private dataView: DataView;

        private svgWidth: number;

        private datePeriod: ITimelineDatePeriod;

        private isThePreviousFilterApplied: boolean = false;

        private initialized: boolean;

        private calendar: Calendar;

        private persistPropertiesAdapter: timelineAdapters.PersistPropertiesAdapter;

        /**
         * Changes the current granularity depending on the given granularity type
         * Separates the new granularity's date periods which contain the start/end selection
         * Unseparates the date periods of the previous granularity.
         * @param granularity The new granularity type
         */
        public changeGranularity(granularity: GranularityType, startDate: Date, endDate: Date): void {
            if (TimelineUtils.unseparateSelection(this.timelineData.currentGranularity.getDatePeriods())) {
            }

            this.timelineData.currentGranularity = this.timelineGranularityData.getGranularity(granularity);
            TimelineUtils.separateSelection(this.timelineData, startDate, endDate);
        }

        constructor(options: VisualConstructorOptions) {
            this.init(options);
        }

        public init(options: VisualConstructorOptions): void {
            let element: HTMLElement = options.element,
                host: IVisualHost = options.host;

            this.persistPropertiesAdapter = timelineAdapters.PersistPropertiesAdapter.create(host);

            this.initialized = false;

            this.selectionManager = host.createSelectionManager();

            this.timelineProperties = {
                textYPosition: 50,
                cellsYPosition: Timeline.TimelineMargins.TopMargin * 3 + 65,
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
                .append('div');

            this.mainSvgSelection = this.rootSelection
                .append('svg')
                .classed(Timeline.TimelineSelectors.TimelineVisual.class, true);

            this.addElements();
        }

        private addElements(): void {
            this.clearCatcherSelection = appendClearCatcher(this.mainSvgSelection);

            this.clearCatcherSelection
                .on("click", () => this.clear())
                .on("touchstart", () => this.clear());

            this.rangeTextSelection = this.mainSvgSelection.append('g')
                .classed(Timeline.TimelineSelectors.RangeTextArea.class, true)
                .append('text');

            this.mainGroupSelection = this.mainSvgSelection
                .append('g')
                .classed(Timeline.TimelineSelectors.MainArea.class, true);

            this.yearLabelsSelection = this.mainGroupSelection.append('g');
            this.quarterLabelsSelection = this.mainGroupSelection.append('g');
            this.monthLabelsSelection = this.mainGroupSelection.append('g');
            this.weekLabelsSelection = this.mainGroupSelection.append('g');
            this.dayLabelsSelection = this.mainGroupSelection.append('g');

            this.cellsSelection = this.mainGroupSelection
                .append('g')
                .classed(Timeline.TimelineSelectors.CellsArea.class, true);

            this.cursorGroupSelection = this.mainSvgSelection
                .append('g')
                .classed(Timeline.TimelineSelectors.CursorsArea.class, true);
        }

        private clear(): void {
            if (this.initialized) {
                this.selectionManager.clear();

                if (this.timelineData) {
                    this.timelineData.selectionStartIndex = 0;

                    this.timelineData.selectionEndIndex =
                        this.timelineData.currentGranularity.getDatePeriods().length - 1;

                    if (this.timelineData.timelineDatapoints.some((x) => x.index % 1 !== 0)) {
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

                    this.clearSelection(this.timelineData.columnIdentity);
                }
            }
        }

        private drawGranular(timelineProperties: TimelineProperties, type: GranularityType): void {
            let startXpoint: number = timelineProperties.startXpoint,
                startYpoint: number = timelineProperties.startYpoint,
                elementWidth: number = timelineProperties.elementWidth,
                selectorPeriods: string[] = this.granularitySelectors;

            this.selectorSelection = this.mainSvgSelection
                .append('g')
                .classed(Timeline.TimelineSelectors.TimelineSlicer.class, true);

            let dragPeriodRect: Drag<any> = d3.behavior.drag()
                .on("drag", () => {
                    this.selectPeriod(this.getGranularityIndexByPosition((d3.event as MouseEvent).x));
                });

            this.selectorSelection.call(dragPeriodRect);

            // create horiz. line
            this.horizLineSelection = this.selectorSelection.append('rect');

            this.horizLineSelection.attr({
                x: convertToPx(startXpoint),
                y: convertToPx(startYpoint + 2),
                height: convertToPx(1),
                width: convertToPx((selectorPeriods.length - 1) * elementWidth)
            });

            // create vert. lines
            this.vertLineSelection = this.selectorSelection
                .selectAll("vertLines")
                .data(selectorPeriods)
                .enter()
                .append('rect');

            this.vertLineSelection
                .classed(Timeline.TimelineSelectors.VertLine.class, true)
                .attr({
                    x: (d, index) => convertToPx(startXpoint + index * elementWidth),
                    y: convertToPx(startYpoint),
                    width: convertToPx(2),
                    height: convertToPx(3)
                });

            // create text lables
            let text = this.selectorSelection
                .selectAll(Timeline.TimelineSelectors.PeriodSlicerGranularities.selector)
                .data(selectorPeriods)
                .enter()
                .append("text")
                .classed(Timeline.TimelineSelectors.PeriodSlicerGranularities.class, true);

            this.textLabelsSelection = text
                .text((value: string) => value)
                .attr({
                    x: (d, index) => convertToPx(startXpoint - 3 + index * elementWidth),
                    y: convertToPx(startYpoint - 3),
                    dx: "0.5em"
                });

            // create selected period text
            this.selectedTextSelection = this.selectorSelection
                .append("text")
                .classed(Timeline.TimelineSelectors.PeriodSlicerSelection.class, true);

            this.selectedTextSelection
                .text(TimelineUtils.getGranularityName(type))
                .attr({
                    x: convertToPx(startXpoint + 2 * elementWidth),
                    y: convertToPx(startYpoint + 17),
                });

            let selRects = this.selectorSelection
                .selectAll(Timeline.TimelineSelectors.PeriodSlicerSelectionRect.selector)
                .data(selectorPeriods)
                .enter()
                .append('rect')
                .classed(Timeline.TimelineSelectors.PeriodSlicerSelectionRect.class, true);

            let clickHandler = (d: any, index: number) => {
                this.selectPeriod(index);
            };

            selRects
                .attr({
                    x: (d, index) => convertToPx(startXpoint - elementWidth / 2 + index * elementWidth),
                    y: convertToPx(3),
                    width: convertToPx(elementWidth),
                    height: convertToPx(23)
                })
                .on('mousedown', clickHandler)
                .on('touchstart', clickHandler);

            this.periodSlicerRectSelection = this.selectorSelection
                .append('rect')
                .classed(Timeline.TimelineSelectors.PeriodSlicerRect.class, true)
                .attr({
                    y: convertToPx(startYpoint - 16),
                    rx: convertToPx(4),
                    width: convertToPx(15),
                    height: convertToPx(23)
                });

            this.renderGranularitySlicerRect(type);
        }

        public getGranularityIndexByPosition(position: number): number {
            let selectorIndexes: number[],
                scale: TimelineScale = timelineScaleUtils.getScale(this.rootSelection.node() as HTMLElement),
                scaledPosition: number = position / scale.x; // It takes account of scaling when we use "Fit to page" or "Fit to width".

            selectorIndexes = this.granularitySelectors.map((selector: string, index: number) => {
                return index;
            });

            return TimelineUtils.getIndexByPosition(
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
                        - 6
                        + granularity
                        * this.timelineProperties.elementWidth)
                });

            this.selectedTextSelection.text(TimelineUtils.getGranularityName(granularity));
        }

        public fillColorGranularity(granularitySettings: TimelineGranularitySettings): void {
            let sliderColor: string = granularitySettings.sliderColor,
                scaleColor: string = granularitySettings.scaleColor;

            this.periodSlicerRectSelection.style("stroke", sliderColor);
            this.selectedTextSelection.attr('fill', scaleColor);
            this.textLabelsSelection.attr('fill', scaleColor);
            this.vertLineSelection.attr('fill', scaleColor);
            this.horizLineSelection.attr('fill', scaleColor);
        }

        public redrawPeriod(granularity: GranularityType): void {
            if (this.doesPeriodSlicerRectPositionNeedToUpdate(granularity)) {
                let startDate: Date,
                    endDate: Date;

                this.renderGranularitySlicerRect(granularity);

                startDate = TimelineUtils.getStartSelectionDate(this.timelineData);
                endDate = TimelineUtils.getEndSelectionDate(this.timelineData);

                this.changeGranularity(granularity, startDate, endDate);
            }
        }

        private static setMeasures(
            labelsSettings: TimelineLabelsSettings,
            granularityType: GranularityType,
            datePeriodsCount: number,
            viewport: IViewport,
            timelineProperties: TimelineProperties,
            timelineMargins: TimelineMargins): void {

            timelineProperties.cellsYPosition = timelineProperties.textYPosition;

            let labelSize: number,
                svgHeight: number,
                maxHeight: number,
                height: number,
                width: number;

            labelSize = fromPointToPixel(labelsSettings.textSize);

            if (labelsSettings.show) {
                timelineProperties.cellsYPosition += labelSize * 1.5 * (granularityType + 1);
            }

            svgHeight = Math.max(0, viewport.height - timelineMargins.TopMargin);

            maxHeight = viewport.width - timelineMargins.RightMargin - timelineMargins.MinCellWidth * datePeriodsCount;

            height = Math.max(
                timelineMargins.MinCellWidth,
                Math.min(
                    timelineMargins.MaxCellHeight,
                    maxHeight,
                    svgHeight - timelineProperties.cellsYPosition - 20));

            width = Math.max(
                timelineMargins.MinCellWidth,
                (viewport.width - height - timelineMargins.RightMargin) / datePeriodsCount);

            timelineProperties.cellHeight = height;
            timelineProperties.cellWidth = width;
        }

        private createDatePeriod(dataView: DataView): ITimelineDatePeriod {
            return TimelineUtils.getDatePeriod(dataView.categorical.categories[0].values);
        }

        private createTimelineData(dataView: DataView) {
            let startDate: Date,
                endDate: Date,
                datePeriod: TimelineDatePeriodBase,
                resetedStartDate: Date,
                resetedEndDate: Date;

            this.settings = Timeline.parseSettings(dataView);

            datePeriod = <TimelineDatePeriodBase>this.settings.general.datePeriod;

            if (datePeriod.startDate && datePeriod.endDate) {
                resetedStartDate = TimelineUtils.resetTime(datePeriod.startDate);
                resetedEndDate = TimelineUtils.resetTime(TimelineUtils.getEndOfThePreviousDate(datePeriod.endDate));

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

                isSemanticFilterAvailableInTheDataView =
                    TimelineUtils.isSemanticFilterAvailableInTheDataView(this.settings.general.filter);

                if (!changedSelection && !isSemanticFilterAvailableInTheDataView) {
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
                columnExp: ISQExpr,
                valueType: string;

            columnExp = <ISQExpr>dataView.categorical.categories[0].source.expr;

            valueType = columnExp ? columnExp["level"] : null;

            if (!(dataView.categorical.categories[0].source.type.dateTime
                || (dataView.categorical.categories[0].source.type.numeric
                    && (valueType === 'Year' || valueType === 'Date')))) {
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
            let datePeriod: TimelineDatePeriodBase;

            if (!Timeline.areVisualUpdateOptionsValid(options)) {
                this.clearData();

                return;
            }

            this.options = options;
            this.dataView = options.dataViews[0];

            this.datePeriod = this.createDatePeriod(options.dataViews[0]);

            this.createTimelineData(this.dataView);

            datePeriod = <TimelineDatePeriodBase>this.settings.general.datePeriod;

            this.updateCalendar(this.settings);

            this.initialized = true;

            if (datePeriod.startDate && datePeriod.endDate) {
                this.applySelection(options, datePeriod);
            } else {
                this.render(this.timelineData, this.settings, this.timelineProperties, options);
            }

            this.renderGranularitySlicerRect(this.settings.granularity.granularity);

            if (!this.isThePreviousFilterApplied) {
                this.applyThePreviousFilter(options, datePeriod);

                this.isThePreviousFilterApplied = true;
            }
        }

        private applyThePreviousFilter(options: VisualUpdateOptions, datePeriod: TimelineDatePeriodBase): void {
            let columnIdentity: SQColumnRefExpr = this.timelineData.columnIdentity;

            if (!datePeriod.startDate || !datePeriod.endDate) {
                this.clearSelection(columnIdentity);

                return;
            }

            this.applyDatePeriod(
                datePeriod.startDate,
                datePeriod.endDate,
                columnIdentity);

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

            this.render(this.timelineData, this.settings, this.timelineProperties, this.options);
        }

        private updateCalendar(timelineFormat: TimelineSettings): void {
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
            timelineSettings: TimelineSettings,
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
                timelineData.cursorDataPoints.push({
                    x: 0,
                    y: 0,
                    selectionIndex: 0,
                    cursorIndex: 0
                });

                timelineData.cursorDataPoints.push({
                    x: 0,
                    y: 0,
                    selectionIndex: 0,
                    cursorIndex: 1
                });
            }

            isCalendarChanged = previousCalendar && previousCalendar.isChanged(timelineSettings.calendar, timelineSettings.weekDay);

            if (timelineData && timelineData.currentGranularity) {
                startDate = TimelineUtils.getStartSelectionDate(timelineData);
                endDate = TimelineUtils.getEndSelectionDate(timelineData);
            }

            if (!initialized || isCalendarChanged) {
                calendar = new Calendar(timelineSettings.calendar, timelineSettings.weekDay);

                timelineGranularityData.createGranularities(calendar);
                timelineGranularityData.createLabels();
                timelineData.currentGranularity = timelineGranularityData.getGranularity(timelineSettings.granularity.granularity);
            } else {
                calendar = previousCalendar;

            }
            if (!initialized) {
                timelineData.selectionStartIndex = 0;
                timelineData.selectionEndIndex = timelineData.currentGranularity.getDatePeriods().length - 1;
            }

            timelineData.columnIdentity = <SQColumnRefExpr>dataView.categorical.categories[0].identityFields[0];

            if (dataView.categorical.categories[0].source.type.numeric) {
                (<any>timelineData.columnIdentity).ref = "Date";
            }

            if (isCalendarChanged && startDate && endDate) {
                TimelineUtils.separateSelection(timelineData, startDate, endDate);
            }

            timelineElements = timelineData.currentGranularity.getDatePeriods();

            timelineData.timelineDatapoints = [];

            for (let currentTimePeriod of timelineElements) {
                let datapoint: TimelineDatapoint = {
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
                Timeline.TimelineMargins);

            Timeline.updateCursors(timelineData, timelineProperties.cellWidth);

            return calendar;
        }

        private render(
            timelineData: TimelineData,
            timelineSettings: TimelineSettings,
            timelineProperties: TimelineProperties,
            options: VisualUpdateOptions): void {

            let timelineDatapointsCount = this.timelineData.timelineDatapoints
                .filter((x) => {
                    return x.index % 1 === 0;
                })
                .length;

            this.svgWidth = 1
                + this.timelineProperties.cellHeight
                + timelineProperties.cellWidth * timelineDatapointsCount;

            this.renderTimeRangeText(timelineData, timelineSettings.rangeHeader);
            this.fillColorGranularity(this.settings.granularity);

            this.rootSelection
                .attr({
                    height: convertToPx(options.viewport.height),
                    width: convertToPx(options.viewport.width),
                    'drag-resize-disabled': true
                })
                .style({
                    'overflow-x': 'auto',
                    'overflow-y': 'auto'
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
                timelineProperties.cellHeight / 2,
                timelineProperties.topMargin);

            this.mainGroupSelection.attr('transform', translateString);
            this.selectorSelection.attr('transform', fixedTranslateString);
            this.cursorGroupSelection.attr('transform', translateString);

            let extendedLabels = this.timelineData.currentGranularity.getExtendedLabel(),
                granularityType = this.timelineData.currentGranularity.getType();

            let yPos: number = 0,
                yDiff: number = 1.50;

            this.renderLabels(extendedLabels.yearLabels, this.yearLabelsSelection, yPos, granularityType === 0);

            yPos += yDiff;

            this.renderLabels(extendedLabels.quarterLabels, this.quarterLabelsSelection, yPos, granularityType === 1);

            yPos += yDiff;

            this.renderLabels(extendedLabels.monthLabels, this.monthLabelsSelection, yPos, granularityType === 2);

            yPos += yDiff;

            this.renderLabels(extendedLabels.weekLabels, this.weekLabelsSelection, yPos, granularityType === 3);

            yPos += yDiff;

            this.renderLabels(extendedLabels.dayLabels, this.dayLabelsSelection, yPos, granularityType === 4);

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

            labelTextSelection = labelsElement.selectAll(Timeline.TimelineSelectors.textLabel.selector);

            if (!this.settings.labels.show) {
                labelTextSelection.remove();

                return;
            }

            let labelsGroupSelection: UpdateSelection<TimelineLabel> = labelTextSelection.data(labels);

            labelsGroupSelection
                .enter()
                .append('text')
                .classed(Timeline.TimelineSelectors.textLabel.class, true);

            labelsGroupSelection
                .text((x: TimelineLabel, id: number) => {
                    if (!isLast && id === 0 && labels.length > 1) {
                        let fontSize = convertToPt(this.settings.labels.textSize);

                        let textProperties: TextProperties = {
                            text: labels[0].text,
                            fontFamily: 'arial',
                            fontSize: fontSize
                        };

                        let halfFirstTextWidth = textMeasurementService.measureSvgTextWidth(textProperties) / 2;

                        textProperties = {
                            text: labels[1].text,
                            fontFamily: 'arial',
                            fontSize: fontSize
                        };

                        let halfSecondTextWidth = textMeasurementService.measureSvgTextWidth(textProperties) / 2,
                            diff = this.timelineProperties.cellWidth * (labels[1].id - labels[0].id);

                        if (diff < halfFirstTextWidth + halfSecondTextWidth) {
                            return "";
                        }
                    }

                    let labelFormattedTextOptions: LabelFormattedTextOptions = {
                        label: x.text,
                        maxWidth: this.timelineProperties.cellWidth * (isLast ? 0.90 : 3),
                        fontSize: this.settings.labels.textSize
                    };

                    return getLabelFormattedText(labelFormattedTextOptions);
                })
                .style('font-size', convertToPt(this.settings.labels.textSize))
                .attr({
                    x: (x: TimelineLabel) => (x.id + 0.5) * this.timelineProperties.cellWidth,
                    y: this.timelineProperties.textYPosition
                    + (1 + index) * fromPointToPixel(this.settings.labels.textSize),
                    fill: this.settings.labels.fontColor
                })
                .append('title')
                .text((x: TimelineLabel) => x.title);

            labelsGroupSelection
                .exit()
                .remove();
        }

        private clearData(): void {
            this.initialized = false;

            this.mainGroupSelection
                .selectAll(Timeline.TimelineSelectors.CellRect.selector)
                .remove();

            this.mainGroupSelection
                .selectAll(Timeline.TimelineSelectors.textLabel.selector)
                .remove();

            this.rangeTextSelection.text("");

            this.cursorGroupSelection
                .selectAll(Timeline.TimelineSelectors.SelectionCursor.selector)
                .remove();

            this.mainSvgSelection
                .attr("width", 0)
                .selectAll(Timeline.TimelineSelectors.TimelineSlicer.selector)
                .remove();

            this.mainGroupSelection
                .selectAll(Timeline.TimelineSelectors.textLabel.selector)
                .remove();
        }

        private static updateCursors(timelineData: TimelineData, cellWidth: number): void {
            let startDate: TimelineDatePeriod = timelineData.timelineDatapoints[timelineData.selectionStartIndex].datePeriod,
                endDate: TimelineDatePeriod = timelineData.timelineDatapoints[timelineData.selectionEndIndex].datePeriod;

            timelineData.cursorDataPoints[0].selectionIndex = startDate.index;
            timelineData.cursorDataPoints[1].selectionIndex = (endDate.index + endDate.fraction);
        }

        private static parseSettings(dataView: DataView): TimelineSettings {
            let settings: TimelineSettings = TimelineSettings.parse(dataView); // TODO: fix it

            Timeline.setValidCalendarSettings(settings.calendar);

            settings.general.datePeriod = TimelineDatePeriodBase.parse(<string>settings.general.datePeriod);

            return settings;
        }

        /**
         * Public for testability.
         */
        public static setValidCalendarSettings(calendarSettings: TimelineCalendarSettings): void {
            let defaultSettings: TimelineSettings = TimelineSettings.Default,
                theLatestDayOfMonth: number = TimelineUtils.getTheLatestDayOfMonth(calendarSettings.month);

            calendarSettings.day = Math.max(
                defaultSettings.calendar.day,
                Math.min(theLatestDayOfMonth, calendarSettings.day));
        }

        public fillCells(cellsSettings: TimelineCellsSettings): void {
            let dataPoints = this.timelineData.timelineDatapoints,
                cellSelection = this.mainGroupSelection
                    .selectAll(Timeline.TimelineSelectors.CellRect.selector)
                    .data(dataPoints);

            cellSelection.attr('fill', (dataPoint: TimelineDatapoint) => {
                return TimelineUtils.getCellColor(dataPoint, this.timelineData, cellsSettings);
            });
        }

        public renderCells(timelineData: TimelineData, timelineProperties: TimelineProperties): void {
            let dataPoints: TimelineDatapoint[] = timelineData.timelineDatapoints,
                totalX: number = 0;

            let cellsSelection = this.cellsSelection
                .selectAll(Timeline.TimelineSelectors.CellRect.selector)
                .data(dataPoints);

            cellsSelection
                .enter()
                .append('rect')
                .classed(Timeline.TimelineSelectors.CellRect.class, true);

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
                .on('click', clickHandler)
                .on('touchstart', clickHandler);

            this.fillCells(this.settings.cells);

            cellsSelection
                .exit()
                .remove();
        }

        private onCellClickHandler(dataPoint: TimelineDatapoint, index: number, isMultiSelection: boolean): void {
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

            index = TimelineUtils.getIndexByPosition(
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

            let cursorSelection = this.cursorGroupSelection
                .selectAll(Timeline.TimelineSelectors.SelectionCursor.selector)
                .data(timelineData.cursorDataPoints);

            cursorSelection
                .enter()
                .append('path')
                .classed(Timeline.TimelineSelectors.SelectionCursor.class, true);

            cursorSelection
                .attr("transform", (cursorDataPoint: CursorDatapoint) => {
                    var dx: number,
                        dy: number;

                    dx = cursorDataPoint.selectionIndex * this.timelineProperties.cellWidth;
                    dy = cellHeight / 2 + cellsYPosition;

                    return translate(dx, dy);
                })
                .attr({
                    d: d3.svg.arc<CursorDatapoint>()
                        .innerRadius(0)
                        .outerRadius(cellHeight / 2)
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

        public renderTimeRangeText(timelineData: TimelineData, rangeHeaderSettings: TimelineLabelsSettings): void {
            let leftMargin: number = (GranularityNames.length + 2) * this.timelineProperties.elementWidth,
                maxWidth: number = this.svgWidth
                    - leftMargin
                    - this.timelineProperties.leftMargin
                    - rangeHeaderSettings.textSize;

            if (rangeHeaderSettings.show && maxWidth > 0) {
                let timeRangeText: string = TimelineUtils.timeRangeText(timelineData);

                let labelFormattedTextOptions: LabelFormattedTextOptions = {
                    label: timeRangeText,
                    maxWidth: maxWidth,
                    fontSize: rangeHeaderSettings.textSize
                };

                let actualText: string = getLabelFormattedText(labelFormattedTextOptions);

                this.rangeTextSelection
                    .classed(Timeline.TimelineSelectors.SelectionRangeContainer.class, true)
                    .attr({
                        x: GranularityNames.length
                        * (this.timelineProperties.elementWidth + this.timelineProperties.leftMargin),
                        y: 40,
                        fill: rangeHeaderSettings.fontColor
                    })
                    .style({
                        'font-size': convertToPt(rangeHeaderSettings.textSize)
                    })
                    .text(actualText)
                    .append('title').text(timeRangeText);;
            }
            else {
                this.rangeTextSelection.text("");
            }
        }

        public setSelection(timelineData: TimelineData): void {
            if (TimelineUtils.areBoundsOfSelectionAndAvailableDatesTheSame(timelineData)) {
                this.clearSelection(timelineData.columnIdentity);

                return;
            }

            this.applyDatePeriod(
                TimelineUtils.getStartSelectionDate(timelineData),
                TimelineUtils.getEndSelectionDate(timelineData),
                timelineData.columnIdentity);
        }

        public applyDatePeriod(startDate: Date, endDate: Date, columnIdentity: SQColumnRefExpr): void {
            let /*lower: SQConstantExpr,
                upper: SQConstantExpr,
                filterExpr: SQBetweenExpr,*/
                filter: ISemanticFilter,
                datePeriod: TimelineDatePeriodBase;

            // lower = SQExprBuilder.dateTime(startDate);
            // upper = SQExprBuilder.dateTime(TimelineUtils.getEndOfThePreviousDate(endDate));

            // filterExpr = SQExprBuilder.between(columnIdentity, lower, upper);

            // filter = SemanticFilter.fromSQExpr(filterExpr);

            datePeriod = TimelineDatePeriodBase.create(startDate, endDate);

            this.applyFilter(filter, datePeriod);
        }

        public clearSelection(columnIdentity: SQColumnRefExpr): void {
            this.applyFilter(
                /*SemanticFilter.getAnyValueFilter(columnIdentity)*/undefined,
                TimelineDatePeriodBase.createEmpty());
        }

        private applyFilter(filter: ISemanticFilter, datePeriod: TimelineDatePeriodBase): void {
            let instance: VisualObjectInstance = {
                objectName: "general",
                selector: undefined,
                properties: {
                    filter: filter,
                    datePeriod: datePeriod.toString()
                }
            };

            this.persistPropertiesAdapter.persistProperties({
                objectInstance: instance,
                /*callback: () => {
                    this.persistPropertiesAdapter
                        .hostServices
                        .onSelect({ visualObjects: [] });
                }*/
            });
        }

        /**
         * This function retruns the values to be displayed in the property pane for each object.
         * Usually it is a bind pass of what the property pane gave you, but sometimes you may want to do
         * validation and return other values/defaults.
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            if (options.objectName === "general") {
                return [];
            }

            // TODO: fix 
            // let enumeration: VisualObjectInstanceEnumeration = TimelineSettings.enumerateObjectInstances(
            //     this.settings,
            //     options,
            //     Timeline.capabilities);

            return [];
        }
    }

    export module timelineAdapters {
        export interface PersistPropertiesAdapterVisualObjectInstance {
            objectInstance: VisualObjectInstance;
            callback?: () => void;
        }

        export interface PersistPropertiesAdapterFrame {
            [objectName: string]: PersistPropertiesAdapterVisualObjectInstance;
        }

        /**
         * PersistPropertiesAdapter is an adapter for IVisualHostServices.persistProperties.
         * We are going to remove it when IVisualHostServices will be fixed.
         */
        export class PersistPropertiesAdapter {
            private persistPropertiesTimeout: number = 250; //ms
            private timeoutId: number = null;

            private frame: PersistPropertiesAdapterFrame;

            private host: IVisualHost;
            public get hostServices(): IVisualHost {
                return this.host;
            };

            constructor(host: IVisualHost) {
                this.host = host;
            }

            public static create(host: IVisualHost): PersistPropertiesAdapter {
                return new PersistPropertiesAdapter(host);
            }

            public persistProperties(instance: PersistPropertiesAdapterVisualObjectInstance): void {
                if (!instance || !instance.objectInstance || !instance.objectInstance.objectName) {
                    return;
                }

                this.mergeInstances(instance);

                this.sheduleToPersistProperties();
            }

            private mergeInstances(instance: PersistPropertiesAdapterVisualObjectInstance): void {
                if (!this.frame) {
                    this.createFrame();
                }

                var objectName: string = instance.objectInstance.objectName;

                if (!this.frame[objectName]) {
                    this.frame[objectName] = instance;
                } else if (this.frame[objectName]) {
                    var propertyNames: string[] = Object.keys(instance.objectInstance.properties);

                    propertyNames.forEach((propertyName: string) => {
                        this.frame[objectName].objectInstance.properties[propertyName] =
                            instance.objectInstance.properties[propertyName];
                    });

                    this.frame[objectName].callback = instance.callback;
                }
            }

            private sheduleToPersistProperties(): void {
                if (this.timeoutId) {
                    return;
                }

                this.timeoutId = setTimeout(() => {
                    this.corePersistProperties();

                    this.timeoutId = null;
                }, this.persistPropertiesTimeout);
            }

            private corePersistProperties(): void {
                var changes: VisualObjectInstancesToPersist,
                    frameKeys: string[];

                changes = { merge: [] };
                frameKeys = Object.keys(this.frame);

                frameKeys.forEach((frameKey: string) => {
                    changes.merge.push(this.frame[frameKey].objectInstance);
                });

                if (changes.merge.length > 0) {
                    this.host.persistProperties(changes);

                    this.executeCallbacks();
                }

                this.createFrame();
            }

            private executeCallbacks(): void {
                if (!this.frame) {
                    return;
                }

                var frameKeys: string[] = Object.keys(this.frame);

                frameKeys.forEach((frameKey: string) => {
                    var instance: PersistPropertiesAdapterVisualObjectInstance = this.frame[frameKey];

                    if (instance.callback) {
                        instance.callback();
                    }
                });
            }

            private createFrame(): void {
                this.frame = {};
            }
        }
    }

    export interface TimelineScale {
        x: number;
        y: number;
    }

    export module timelineScaleUtils {
        export function getScale(element: HTMLElement): TimelineScale {
            var clientRect = element.getBoundingClientRect();

            return {
                x: clientRect.width / element.offsetWidth,
                y: clientRect.height / element.offsetHeight
            };
        }
    }
}
