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

module powerbi.extensibility.visual.granularity {
    // datePeriod
    import TimelineDatePeriod = datePeriod.TimelineDatePeriod;

    // utils
    import Utils = utils.Utils;

    export class TimelineGranularityBase implements Granularity {
        private static MonthNameSeparator: string = " ";
        private static DefaultFraction: number = 1;
        private static EmptyYearOffset: number = 0;
        private static YearOffset: number = 1;

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
            return date.toString().split(TimelineGranularityBase.MonthNameSeparator)[1];
        }

        public resetDatePeriods(): void {
            this.datePeriods = [];
        }

        public getDatePeriods(): TimelineDatePeriod[] {
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

            this.datePeriods.forEach((datePeriod: TimelineDatePeriod) => {
                if (!labels.length || !granularity.sameLabel(datePeriod, lastDatePeriod)) {
                    lastDatePeriod = datePeriod;
                    labels.push(granularity.generateLabel(datePeriod));
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

            if (datePeriods.length === 0
                || !_.isEqual(lastDatePeriod.identifierArray, identifierArray)) {

                if (datePeriods.length > 0) {
                    lastDatePeriod.endDate = date;
                }

                datePeriods.push({
                    identifierArray: identifierArray,
                    startDate: date,
                    endDate: date,
                    week: this.determineWeek(date),
                    year: this.determineYear(date),
                    fraction: TimelineGranularityBase.DefaultFraction,
                    index: datePeriods.length
                });
            }
            else {
                lastDatePeriod.endDate = date;
            }
        }

        public setNewEndDate(date: Date): void {
            this.datePeriods[this.datePeriods.length - 1].endDate = date;
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
            let year: number = this.determineYear(date);

            if (this.inPreviousYear(date)) {
                year--;
            }

            const dateOfFirstWeek: Date = this.calendar.getDateOfFirstWeek(year),
                weeks: number = Utils.getAmountOfWeeksBetweenDates(dateOfFirstWeek, date);

            return [weeks, year];
        }

        private inPreviousYear(date: Date): boolean {
            const dateOfFirstWeek: Date = this.calendar.getDateOfFirstWeek(this.determineYear(date));

            return date < dateOfFirstWeek;
        }

        public determineYear(date: Date): number {
            const firstDay: Date = new Date(
                date.getFullYear(),
                this.calendar.getFirstMonthOfYear(),
                this.calendar.getFirstDayOfYear());

            return date.getFullYear() - ((firstDay <= date)
                ? TimelineGranularityBase.EmptyYearOffset
                : TimelineGranularityBase.YearOffset);
        }
    }
}
