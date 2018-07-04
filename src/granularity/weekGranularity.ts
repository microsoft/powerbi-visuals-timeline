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
    import Selection = d3.Selection;

    export class WeekGranularity extends TimelineGranularityBase {
        constructor(calendar: Calendar, locale: string, protected localizationManager: ILocalizationManager) {
            super(calendar, locale, Utils.getGranularityPropsByMarker("W"));
        }

        public render(props: GranularityRenderProps, isFirst: boolean): Selection<any> {
            if (!props.granularSettings.granularityWeekVisibility) {
                return null;
            }

            return super.render(props, isFirst);
        }

        public getType(): GranularityType {
            return GranularityType.week;
        }

        public splitDate(date: Date): (string | number)[] {
            return this.determineWeek(date);
        }

        public splitDateForTitle(date: Date): (string | number)[] {
            const weekData = this.determineWeek(date);

            return [
                `W${weekData[0]}`,
                weekData[1]
            ];
        }

        public sameLabel(firstDatePeriod: TimelineDatePeriod, secondDatePeriod: TimelineDatePeriod): boolean {
            return Utils.arraysEqual(firstDatePeriod.week, secondDatePeriod.week);
        }

        public generateLabel(datePeriod: TimelineDatePeriod): TimelineLabel {
            const localWeek = this.localizationManager.getDisplayName("Visual_Granularity_Week");
            return {
                title: `${localWeek} ${datePeriod.week[0]} - ${datePeriod.week[1]}`,
                text: `W${datePeriod.week[0]}`,
                id: datePeriod.index
            };
        }
    }
}
