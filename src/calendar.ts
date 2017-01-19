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
    // granularity
    import TimelineGranularityData = granularity.TimelineGranularityData;

    // settings
    import WeekDaySettings = settings.WeekDaySettings;
    import CalendarSettings = settings.CalendarSettings;

    interface DateDictionary {
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
            calendarSettings: CalendarSettings,
            weekDaySettings: WeekDaySettings): boolean {
            return this.firstMonthOfYear !== calendarSettings.month
                || this.firstDayOfYear !== calendarSettings.day
                || this.firstDayOfWeek !== weekDaySettings.day;
        }

        constructor(
            calendarFormat: CalendarSettings,
            weekDaySettings: WeekDaySettings) {

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
}
