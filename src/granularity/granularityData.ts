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
    // utils
    import Utils = utils.Utils;

    export class TimelineGranularityData {
        private static DayOffset: number = 1;

        private dates: Date[];
        private granularities: Granularity[];
        private endingDate: Date;

        constructor(startDate: Date, endDate: Date) {
            this.granularities = [];
            this.setDatesRange(startDate, endDate);

            const lastDate: Date = this.dates[this.dates.length - 1];

            this.endingDate = TimelineGranularityData.nextDay(lastDate);
        }

        /**
         * Returns the date of the previos day
         * @param date The following date
         */
        public static previousDay(date: Date): Date {
            const prevDay: Date = Utils.resetTime(date);

            prevDay.setDate(prevDay.getDate() - TimelineGranularityData.DayOffset);

            return prevDay;
        }

        /**
         * Returns the date of the next day
         * @param date The previous date
         */
        public static nextDay(date: Date): Date {
            const nextDay: Date = Utils.resetTime(date);

            nextDay.setDate(nextDay.getDate() + TimelineGranularityData.DayOffset);

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
            this.granularities.forEach((granularity: Granularity) => {
                granularity.setExtendedLabel({
                    dayLabels: granularity.getType() >= GranularityType.day
                        ? granularity.createLabels(this.granularities[GranularityType.day])
                        : [],
                    weekLabels: granularity.getType() >= GranularityType.week
                        ? granularity.createLabels(this.granularities[GranularityType.week])
                        : [],
                    monthLabels: granularity.getType() >= GranularityType.month
                        ? granularity.createLabels(this.granularities[GranularityType.month])
                        : [],
                    quarterLabels: granularity.getType() >= GranularityType.quarter
                        ? granularity.createLabels(this.granularities[GranularityType.quarter])
                        : [],
                    yearLabels: granularity.getType() >= GranularityType.year
                        ? granularity.createLabels(this.granularities[GranularityType.year])
                        : [],
                });
            });
        }
    }
}
