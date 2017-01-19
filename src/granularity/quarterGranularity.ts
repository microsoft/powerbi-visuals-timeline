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

            return `Q${quarter}`;
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
            const quarter: string = this.quarterText(datePeriod.startDate);

            return {
                title: `${quarter} ${datePeriod.year}`,
                text: quarter,
                id: datePeriod.index
            };
        }
    }
}
