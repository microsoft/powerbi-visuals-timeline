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

module powerbi.extensibility.visual.utils {
    // powerbi.data
    import ISemanticFilter = powerbi.data.ISemanticFilter;

    // datePeriod
    import TimelineDatePeriod = datePeriod.TimelineDatePeriod;
    import ITimelineDatePeriod = datePeriod.ITimelineDatePeriod;

    // settings
    import CellsSettings = settings.CellsSettings;

    // granularity
    import GranularityType = granularity.GranularityType;
    import GranularityName = granularity.GranularityName;
    import GranularityNames = granularity.GranularityNames;
    import TimelineGranularityData = granularity.TimelineGranularityData;

    export class Utils {
        private static DateSplitter: string = " - ";

        private static MinFraction: number = 1;

        private static TotalDaysInWeek: number = 7;
        private static WeekDayOffset: number = 1;

        private static DefaultCellColor: string = "transparent";

        private static DateArrayJoiner: string = " ";

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
        Utils.TotalMilliseconds
        * Utils.TotalSeconds
        * Utils.TotalMinutes
        * Utils.TotalHours;

        public static convertToDaysFromMilliseconds(milliseconds: number): number {
            return milliseconds / (Utils.TotalMillisecondsInADay);
        }

        public static getAmountOfDaysBetweenDates(startDate: Date, endDate: Date): number {
            const totalMilliseconds: number = endDate.getTime() - startDate.getTime();

            return Utils.convertToDaysFromMilliseconds(Math.abs(totalMilliseconds));
        }

        public static getAmountOfWeeksBetweenDates(startDate: Date, endDate: Date): number {
            const totalDays: number = Utils.getAmountOfDaysBetweenDates(startDate, endDate);

            return Utils.WeekDayOffset + Math.floor(totalDays / Utils.TotalDaysInWeek);
        }

        public static getMillisecondsWithoutTimezone(date: Date): number {
            if (!date) {
                return 0;
            }

            return date.getTime()
                - date.getTimezoneOffset()
                * Utils.TotalMilliseconds
                * Utils.TotalSeconds;
        }

        public static getDateWithoutTimezone(date: Date): Date {
            return new Date(Utils.getMillisecondsWithoutTimezone(date));
        }

        public static toStringDateWithoutTimezone(date: Date): string {
            if (!date) {
                return null;
            }

            return Utils.getDateWithoutTimezone(date).toISOString();
        }

        public static getEndOfThePreviousDate(date: Date): Date {
            const currentDate: Date = Utils.resetTime(date);

            currentDate.setMilliseconds(-Utils.OffsetMilliseconds);

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
                + date.getTimezoneOffset() * Utils.TotalMilliseconds * Utils.TotalSeconds;

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
                let date: Date = Utils.parseDate(value);

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
                return Utils.resetTime(date);
            }

            return undefined;
        }

        public static areBoundsOfSelectionAndAvailableDatesTheSame(timelineData: TimelineData): boolean {
            const datePeriod: TimelineDatePeriod[] = timelineData.currentGranularity.getDatePeriods(),
                startDate: Date = Utils.getStartSelectionDate(timelineData),
                endDate: Date = Utils.getEndSelectionDate(timelineData);

            return datePeriod
                && datePeriod.length >= 1
                && startDate
                && endDate
                && datePeriod[0].startDate.getTime() === startDate.getTime()
                && datePeriod[datePeriod.length - 1].endDate.getTime() === endDate.getTime();
        }

        public static getTheLatestDayOfMonth(monthId: number): number {
            const date: Date = new Date(2008, monthId + 1, 0); // leap year, so the latest day of February is 29.

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
        public static getCellColor(
            dataPoint: TimelineDatapoint,
            timelineData: TimelineData,
            cellSettings: CellsSettings): string {

            const inSelectedPeriods: boolean = dataPoint.datePeriod.startDate >= Utils.getStartSelectionDate(timelineData)
                && dataPoint.datePeriod.endDate <= Utils.getEndSelectionDate(timelineData);

            return inSelectedPeriods
                ? cellSettings.fillSelected
                : (cellSettings.fillUnselected || Utils.DefaultCellColor);
        }

        /**
         * Returns the granularity type of the given granularity name
         * @param granularityName The name of the granularity
         */
        public static getGranularityType(granularityName: string): GranularityType {
            const index: number = _.findIndex(GranularityNames, (granularity: GranularityName) => {
                return granularity.name === granularityName;
            });

            return GranularityNames[index].granularityType;
        }

        /**
         * Returns the name of the granularity type
         * @param granularity The type of granularity
         */
        public static getGranularityName(granularityType: GranularityType): string {
            const index: number = _.findIndex(GranularityNames, (granularity: GranularityName) => {
                return granularity.granularityType === granularityType;
            });

            return GranularityNames[index].name;
        }

        /**
         * Splits the date periods of the current granularity, in case the start and end of the selection is in between a date period.
         * i.e. for a quarter granularity and a selection between Feb 6 and Dec 23, the date periods for Q1 and Q4 will be split accordingly
         * @param timelineData The TimelineData that contains the date periods
         * @param startDate The starting date of the selection
         * @param endDate The ending date of the selection
         */
        public static separateSelection(timelineData: TimelineData, startDate: Date, endDate: Date): void {
            let datePeriods: TimelineDatePeriod[] = timelineData.currentGranularity.getDatePeriods(),
                startDateIndex: number = _.findIndex(datePeriods, x => startDate < x.endDate),
                endDateIndex: number = _.findIndex(datePeriods, x => endDate <= x.endDate);

            startDateIndex = startDateIndex >= 0
                ? startDateIndex
                : 0;

            endDateIndex = endDateIndex >= 0
                ? endDateIndex
                : datePeriods.length - 1;

            timelineData.selectionStartIndex = startDateIndex;
            timelineData.selectionEndIndex = endDateIndex;

            const startRatio: number = Utils.getDateRatio(datePeriods[startDateIndex], startDate, true),
                endRatio: number = Utils.getDateRatio(datePeriods[endDateIndex], endDate, false);

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
        public static getDateRatio(datePeriod: TimelineDatePeriod, date: Date, fromStart: boolean): number {
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
        public static timeRangeText(timelineData: TimelineData): string {
            let startSelectionDateArray: (string | number)[] = timelineData.currentGranularity
                .splitDate(Utils.getStartSelectionDate(timelineData));

            let endSelectionDateArray: (string | number)[] = timelineData.currentGranularity
                .splitDate(Utils.getEndSelectionPeriod(timelineData).startDate);

            return `${startSelectionDateArray.join(Utils.DateArrayJoiner)}${Utils.DateSplitter}${endSelectionDateArray.join(Utils.DateArrayJoiner)}`;
        }

        public static dateRangeText(datePeriod: TimelineDatePeriod): string {
            return `${datePeriod.startDate.toDateString()}${Utils.DateSplitter}${TimelineGranularityData.previousDay(datePeriod.endDate).toDateString()}`;
        }

        /**
         * Combines the first two partial date periods, into a single date period.
         * i.e. combines "Feb 1 2016 - Feb 5 2016" with "Feb 5 2016 - Feb 29 2016" into "Feb 1 2016 - Feb 29 2016"
         * @param datePeriods The list of date periods
         */
        public static unseparateSelection(datePeriods: TimelineDatePeriod[]): void {
            const separationIndex: number = _.findIndex(
                datePeriods,
                (datePeriod: TimelineDatePeriod) => {
                    return datePeriod.fraction < Utils.MinFraction;
                });

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

            const length: number = elements.length;

            if (!Utils.isValueEmpty(elements[0])
                && !Utils.isValueEmpty(elements[1])
                && position <= elements[1] * widthOfElement + offset) {

                return 0;
            } else if (
                !Utils.isValueEmpty(elements[length - 1])
                && position >= elements[length - 1] * widthOfElement + offset) {

                return length - 1;
            }

            for (let i: number = 1; i < length; i++) {
                const left: number = elements[i] * widthOfElement + offset,
                    right: number = elements[i + 1] * widthOfElement + offset;

                if (position >= left && position <= right) {
                    return i;
                }
            }

            return 0;
        }
    }
}
