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

import {
    ITimelineDatePeriod,
    ITimelineDatePeriodBase,
} from "./datePeriod/datePeriod";

import {
    ITimelineData,
    ITimelineDataPoint,
} from "./dataInterfaces";

import { IGranularityName } from "./granularity/granularityName";
import { GranularityNames } from "./granularity/granularityNames";
import { GranularityType } from "./granularity/granularityType";
import { CellsSettings } from "./settings/cellsSettings";

export class Utils {
    public static DefaultCellColor: string = "transparent";
    public static TotalMilliseconds: number = 1000;
    public static TotalSeconds: number = 60;
    public static TotalMinutes: number = 60;
    public static TotalHours: number = 24;

    public static CONVERT_TO_DAYS_FROM_MILLISECONDS(milliseconds: number): number {
        return milliseconds / (Utils.TotalMillisecondsInADay);
    }

    public static GET_NUMBER_OF_DAYS_BETWEEN_DATES(startDate: Date, endDate: Date): number {
        const offset: number = Utils.GET_DAYLIGHT_SAVING_TIME_OFF(startDate, endDate);
        const totalMilliseconds: number = endDate.getTime() - startDate.getTime() - offset;

        return Utils.CONVERT_TO_DAYS_FROM_MILLISECONDS(Math.abs(totalMilliseconds));
    }

    public static GET_NUMBER_OF_WEEKS_BETWEEN_DATES(startDate: Date, endDate: Date): number {
        const totalDays: number = Utils.GET_NUMBER_OF_DAYS_BETWEEN_DATES(startDate, endDate);

        return Utils.WeekDayOffset + Math.floor(totalDays / Utils.TotalDaysInWeek);
    }

    public static GET_MILLISECONDS_WITHOUT_TIMEZONE(date: Date): number {
        if (!date) {
            return 0;
        }

        return date.getTime()
            - date.getTimezoneOffset()
            * Utils.TotalMilliseconds
            * Utils.TotalSeconds;
    }

    public static GET_DATE_WITHOUT_TIMEZONE(date: Date): Date {
        return new Date(Utils.GET_MILLISECONDS_WITHOUT_TIMEZONE(date));
    }

    public static GET_DAYLIGHT_SAVING_TIME_OFF(startDate: Date, endDate: Date): number {
        const startDateTzOffset: number = startDate.getTimezoneOffset();
        const endDateTzOffset: number = endDate.getTimezoneOffset();

        return (endDateTzOffset - startDateTzOffset) * 60 * 1000;
    }

    public static TO_STRING_DATE_WITHOUT_TIMEZONE(date: Date): string {
        if (!date) {
            return null;
        }

        return Utils.GET_DATE_WITHOUT_TIMEZONE(date).toISOString();
    }

    public static GET_END_OF_THE_PREVIOUS_DATE(date: Date): Date {
        const currentDate: Date = Utils.RESET_TIME(date);

        currentDate.setMilliseconds(-Utils.OffsetMilliseconds);

        return currentDate;
    }

    public static PARSE_DATE_WITHOUT_TIMEZONE(dateString: string): Date {
        if (dateString === null) {
            return null;
        }

        const date: Date = new Date(dateString);

        if (date.toString() === "Invalid Date") {
            return null;
        }

        const timeInMilliseconds: number = date.getTime()
            + date.getTimezoneOffset() * Utils.TotalMilliseconds * Utils.TotalSeconds;

        return new Date(timeInMilliseconds);
    }

    public static RESET_TIME(date: Date): Date {
        return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate());
    }

    public static GET_DATE_PERIOD(values: any[]): ITimelineDatePeriodBase {
        let startDate: Date;
        let endDate: Date;

        values = [].concat(values);

        values.forEach((value: any) => {
            const date: Date = Utils.PARSE_DATE(value);

            if (date < startDate || startDate === undefined) {
                startDate = date;
            }

            if (date > endDate || endDate === undefined) {
                endDate = date;
            }
        });

        return { startDate, endDate };
    }

    public static PARSE_DATE(value: any): Date {
        const typeOfValue: string = typeof value;
        let date: Date = value;

        if (typeOfValue === "number") {
            date = new Date(value, 0);
        }

        if (typeOfValue === "string") {
            date = new Date(value);
        }

        if (date && date instanceof Date && date.toString() !== "Invalid Date") {
            return Utils.RESET_TIME(date);
        }

        return undefined;
    }

    public static ARE_BOUNDS_OF_SELECTION_AND_AVAILABLE_DATES_THE_SAME(timelineData: ITimelineData): boolean {
        const datePeriod: ITimelineDatePeriod[] = timelineData.currentGranularity.getDatePeriods();
        const startDate: Date = Utils.GET_START_SELECTION_DATE(timelineData);
        const endDate: Date = Utils.GET_END_SELECTION_DATE(timelineData);

        return datePeriod
            && datePeriod.length >= 1
            && startDate
            && endDate
            && datePeriod[0].startDate.getTime() === startDate.getTime()
            && datePeriod[datePeriod.length - 1].endDate.getTime() === endDate.getTime();
    }

    public static GET_THE_LATEST_DAY_OF_MONTH(monthId: number): number {
        const date: Date = new Date(2008, monthId + 1, 0); // leap year, so the latest day of February is 29.

        return date.getDate();
    }

    public static IS_VALUE_EMPTY(value: any): boolean {
        return value === undefined || value === null || isNaN(value);
    }

    /**
     * Returns the date of the start of the selection
     * @param timelineData The TimelineData which contains all the date periods
     */
    public static GET_START_SELECTION_DATE(timelineData: ITimelineData): Date {
        return timelineData.currentGranularity.getDatePeriods()[timelineData.selectionStartIndex].startDate;
    }

    /**
     * Returns the date of the end of the selection
     * @param timelineData The TimelineData which contains all the date periods
     */
    public static GET_END_SELECTION_DATE(timelineData: ITimelineData): Date {
        return timelineData.currentGranularity.getDatePeriods()[timelineData.selectionEndIndex].endDate;
    }

    /**
     * Returns the date period of the end of the selection
     * @param timelineData The TimelineData which contains all the date periods
     */
    public static GET_END_SELECTION_PERIOD(timelineData: ITimelineData): ITimelineDatePeriod {
        return timelineData.currentGranularity.getDatePeriods()[timelineData.selectionEndIndex];
    }

    /**
     * Returns the color of a cell, depending on whether its date period is between the selected date periods.
     * CellRects should be transparent filled by default if there isn't any color sets.
     * @param d The TimelineDataPoint of the cell
     * @param timelineData The TimelineData with the selected date periods
     * @param timelineFormat The TimelineFormat with the chosen colors
     */
    public static GET_CELL_COLOR(
        dataPoint: ITimelineDataPoint,
        timelineData: ITimelineData,
        cellSettings: CellsSettings): string {

        const inSelectedPeriods: boolean = dataPoint.datePeriod.startDate >= Utils.GET_START_SELECTION_DATE(timelineData)
            && dataPoint.datePeriod.endDate <= Utils.GET_END_SELECTION_DATE(timelineData);

        return inSelectedPeriods
            ? cellSettings.fillSelected
            : (cellSettings.fillUnselected || Utils.DefaultCellColor);
    }

    public static IS_GRANULE_SELECTED(dataPoint: ITimelineDataPoint, timelineData: ITimelineData): boolean {
        return dataPoint.datePeriod.startDate >= Utils.GET_START_SELECTION_DATE(timelineData)
            && dataPoint.datePeriod.endDate <= Utils.GET_END_SELECTION_DATE(timelineData);
    }

    /**
     * Returns the granularity type of the given granularity name
     * @param granularityName The name of the granularity
     */
    public static GET_GRANULARITY_TYPE(granularityName: string): GranularityType {
        const index: number = Utils.FIND_INDEX(GranularityNames, (granularity: IGranularityName) => {
            return granularity.name === granularityName;
        });

        return GranularityNames[index].granularityType;
    }

    public static GET_GRANULARITY_PROPS_BY_MARKER(marker: string): IGranularityName {
        const index: number = Utils.FIND_INDEX(GranularityNames, (granularity: IGranularityName) => {
            return granularity.marker === marker;
        });

        return GranularityNames[index];
    }

    /**
     * Returns the name of the granularity type
     * @param granularity The type of granularity
     */
    public static GET_GRANULARITY_NAME_KEY(granularityType: GranularityType): string {
        const index: number = Utils.FIND_INDEX(GranularityNames, (granularity: IGranularityName) => {
            return granularity.granularityType === granularityType;
        });

        return GranularityNames[index].nameKey;
    }

    /**
     * Splits the date periods of the current granularity, in case the start and end of the selection is in between a date period.
     * i.e. for a quarter granularity and a selection between Feb 6 and Dec 23, the date periods for Q1 and Q4 will be split accordingly
     * @param timelineData The TimelineData that contains the date periods
     * @param startDate The starting date of the selection
     * @param endDate The ending date of the selection
     */
    public static SEPARATE_SELECTION(timelineData: ITimelineData, startDate: Date, endDate: Date): void {
        const datePeriods: ITimelineDatePeriod[] = timelineData.currentGranularity.getDatePeriods();

        let startDateIndex: number = Utils.FIND_INDEX(datePeriods, (x) => startDate < x.endDate);
        let endDateIndex: number = Utils.FIND_INDEX(datePeriods, (x) => endDate <= x.endDate);

        startDateIndex = startDateIndex >= 0
            ? startDateIndex
            : 0;

        endDateIndex = endDateIndex >= 0
            ? endDateIndex
            : datePeriods.length - 1;

        timelineData.selectionStartIndex = startDateIndex;
        timelineData.selectionEndIndex = endDateIndex;

        const startRatio: number = Utils.GET_DATE_RATIO(datePeriods[startDateIndex], startDate, true);
        const endRatio: number = Utils.GET_DATE_RATIO(datePeriods[endDateIndex], endDate, false);

        if (endRatio > 0) {
            timelineData.currentGranularity.splitPeriod(endDateIndex, endRatio, endDate);
        }

        if (startRatio > 0) {
            const startFration: number = datePeriods[startDateIndex].fraction - startRatio;

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
    public static GET_DATE_RATIO(datePeriod: ITimelineDatePeriod, date: Date, fromStart: boolean): number {
        const dateDifference: number = fromStart
            ? date.getTime() - datePeriod.startDate.getTime()
            : datePeriod.endDate.getTime() - date.getTime();

        const periodDifference: number = datePeriod.endDate.getTime() - datePeriod.startDate.getTime();

        return periodDifference === 0
            ? 0
            : dateDifference / periodDifference;
    }

    /**
     * Returns the time range text, depending on the given granularity (e.g. "Feb 3 2014 - Apr 5 2015", "Q1 2014 - Q2 2015")
     */
    public static TIME_RANGE_TEXT(timelineData: ITimelineData): string {
        const startSelectionDateArray: (string | number)[] = timelineData.currentGranularity
            .splitDateForTitle(Utils.GET_START_SELECTION_DATE(timelineData));

        const endSelectionDateArray: (string | number)[] = timelineData.currentGranularity
            .splitDateForTitle(Utils.GET_END_SELECTION_PERIOD(timelineData).startDate);

        const startSelectionString: string = startSelectionDateArray.join(Utils.DateArrayJoiner);
        const endSelectionString: string = endSelectionDateArray.join(Utils.DateArrayJoiner);

        return `${startSelectionString}${Utils.DateSplitter}${endSelectionString}`;
    }

    public static DATE_RANGE_TEXT(datePeriod: ITimelineDatePeriod): string {
        return `${datePeriod.startDate.toDateString()}${Utils.DateSplitter}${this.previousDay(datePeriod.endDate).toDateString()}`;
    }

    /**
     * Combines the first two partial date periods, into a single date period.
     * i.e. combines "Feb 1 2016 - Feb 5 2016" with "Feb 5 2016 - Feb 29 2016" into "Feb 1 2016 - Feb 29 2016"
     * @param datePeriods The list of date periods
     */
    public static UNSEPARATE_SELECTION(datePeriods: ITimelineDatePeriod[]): void {
        const separationIndex: number = Utils.FIND_INDEX(
            datePeriods,
            (datePeriod: ITimelineDatePeriod) => {
                return datePeriod.fraction < Utils.MinFraction;
            });

        if (separationIndex < 0) {
            return;
        }

        datePeriods[separationIndex].endDate = datePeriods[separationIndex + 1].endDate;
        datePeriods[separationIndex].fraction += datePeriods[separationIndex + 1].fraction;

        datePeriods.splice(separationIndex + 1, 1);
    }

    public static GET_INDEX_BY_POSITION(
        elements: number[],
        widthOfElement: number,
        position: number,
        offset: number = 0): number {

        elements = elements || [];

        const length: number = elements.length;

        if (!Utils.IS_VALUE_EMPTY(elements[0])
            && !Utils.IS_VALUE_EMPTY(elements[1])
            && position <= elements[1] * widthOfElement + offset) {

            return 0;
        } else if (
            !Utils.IS_VALUE_EMPTY(elements[length - 1])
            && position >= elements[length - 1] * widthOfElement + offset) {

            return length - 1;
        }

        for (let i: number = 1; i < length; i++) {
            const left: number = elements[i] * widthOfElement + offset;
            const right: number = elements[i + 1] * widthOfElement + offset;

            if (position >= left && position <= right) {
                return i;
            }
        }

        return 0;
    }

    public static IS_ARRAYS_EQUAL(a: any[], b: any[]): boolean {
        if (a === b) {
            return true;
        }

        if (a === null || b === null) {
            return false;
        }

        if (a.length !== b.length) {
            return false;
        }

        // If you don't care about the order of the elements inside
        // the array, you should sort both arrays here.

        for (let i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) {
                return false;
            }
        }

        return true;
    }

    public static FIND_INDEX(
        array: any[],
        predicate: (value: any, index: number, array: any[]) => boolean,
    ): number {
        let value: any;

        for (let i = 0; i < array.length; i++) {
            value = array[i];
            if (predicate(value, i, array)) {
                return i;
            }
        }

        return -1;
    }

    private static DateSplitter: string = " - ";
    private static MinFraction: number = 1;
    private static TotalDaysInWeek: number = 7;
    private static WeekDayOffset: number = 1;
    private static DateArrayJoiner: string = " ";

    /**
     * We should reduce the latest date of selection using this value,
     * because, as far as I understand, PBI Framework rounds off milliseconds.
     */
    private static OffsetMilliseconds: number = 999;

    private static TotalMillisecondsInADay: number =
        Utils.TotalMilliseconds
        * Utils.TotalSeconds
        * Utils.TotalMinutes
        * Utils.TotalHours;

    private static previousDay(date: Date): Date {
        const prevDay: Date = Utils.RESET_TIME(date);

        prevDay.setDate(prevDay.getDate() - 1);

        return prevDay;
    }
}
