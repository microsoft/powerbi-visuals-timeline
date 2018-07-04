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
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;

    // powerbi.extensibility.utils.svg
    import translate = powerbi.extensibility.utils.svg.translate;

    // powerbi.extensibility.utils.type
    import convertToPx = powerbi.extensibility.utils.type.PixelConverter.toString;

    // utils
    import Utils = utils.Utils;

    import Selection = d3.Selection;

    import GranularitySettings = settings.GranularitySettings;

    export class TimelineGranularityBase implements Granularity {
        private static DefaultFraction: number = 1;
        private static EmptyYearOffset: number = 0;
        private static YearOffset: number = 1;

        private static DefaultVertLineSelectionWidth: number = 2;
        private static DefaultVertLineSelectionHeight: number = 3;
        private static DefaultHorizLineSelectionHeight: number = 1;
        private static HorizLineSelectionYOffset: number = 2;
        private static TextLabelsSelectionOffset: number = 3;
        private static TextLabelsSelectionDx: string = "0.5em";
        private static SelectorPeriodsFactor: number = 2;
        private static DefaultSelectorPeriodsY: number = 3;
        private static DefaultSelectorPeriodsHeight: number = 23;
        private static PeriodSlicerRectSelectionYOffset: number = 16;
        private static DefaultPeriodSlicerRectSelectionRx: number = 4;
        private static DefaultPeriodSlicerRectSelectionWidth: number = 15;
        private static DefaultPeriodSlicerRectSelectionHeight: number = 23;
        private static PeriodSlicerRectSelectionXOffset: number = 6;

        protected calendar: Calendar;

        private datePeriods: TimelineDatePeriod[] = [];
        private extendedLabel: ExtendedLabel;
        private shortMonthFormatter: powerbi.extensibility.utils.formatting.IValueFormatter;
        private granularityProps: GranularityName = null;

        constructor(calendar: Calendar, private locale: string, granularityProps: GranularityName) {
            this.calendar = calendar;
            this.shortMonthFormatter = valueFormatter.create({ format: "MMM", cultureSelector: this.locale });
            this.granularityProps = granularityProps;
        }

        public render(
            placeHolder: Selection<any>,
            startYpoint: number,
            sequenceNum: number,
            elementWidth: number,
            startXpoint: number,
            granularSettings: GranularitySettings,
            selectPeriodCallback: (granularityType: GranularityType) => void,
            selectedType: GranularityType
        ): boolean {
            let granularitySelection = placeHolder.append("g")
                .attr("transform", translate(startXpoint + sequenceNum * elementWidth, 0));

            // render vetical line
            granularitySelection.append("rect")
                .classed("timelineVertLine", true)
                .attr({
                    x: 0,
                    y: convertToPx(startYpoint),
                    width: convertToPx(TimelineGranularityBase.DefaultVertLineSelectionWidth),
                    height: convertToPx(TimelineGranularityBase.DefaultVertLineSelectionHeight)
                });

            // render horizontal line
            if (sequenceNum > 0) {
                granularitySelection.append("rect")
                    .classed("timelineHorzLine", true)
                    .attr({
                        x: convertToPx(0 - elementWidth),
                        y: convertToPx(startYpoint + TimelineGranularityBase.HorizLineSelectionYOffset),
                        height: convertToPx(TimelineGranularityBase.DefaultHorizLineSelectionHeight),
                        width: convertToPx(elementWidth)
                    });
            }

            // render marker
            granularitySelection.append("text")
                .classed("periodSlicerGranularities", true)
                .text(this.granularityProps.marker)
                .attr({
                    x: convertToPx(0 - TimelineGranularityBase.TextLabelsSelectionOffset),
                    y: convertToPx(startYpoint - TimelineGranularityBase.TextLabelsSelectionOffset),
                    dx: TimelineGranularityBase.TextLabelsSelectionDx
                });

            // render slider
            if (selectedType === this.granularityProps.granularityType) {
                this.renderSlider(
                    granularitySelection,
                    granularSettings.sliderColor,
                    selectedType,
                    startYpoint
                );
            }

            const granularityTypeClickHandler = (d: any, index: number) => {
                selectPeriodCallback(this.granularityProps.granularityType);

                let sliderSelection = d3.selectAll("rect.periodSlicerRect");
                if (sliderSelection) {
                    sliderSelection.remove();
                }

                this.renderSlider(
                    granularitySelection,
                    granularSettings.sliderColor,
                    selectedType,
                    startYpoint
                );
            };

            // render selection rects
            granularitySelection
                .append("rect")
                .classed("periodSlicerSelectionRect", true)
                .attr({
                    x: convertToPx(0 - elementWidth / TimelineGranularityBase.SelectorPeriodsFactor),
                    y: convertToPx(TimelineGranularityBase.DefaultSelectorPeriodsY),
                    width: convertToPx(elementWidth),
                    height: convertToPx(TimelineGranularityBase.DefaultSelectorPeriodsHeight)
                })
                .on("mousedown", granularityTypeClickHandler)
                .on("touchstart", granularityTypeClickHandler);

            granularitySelection.attr("fill", granularSettings.scaleColor);

            return true;
        }

        private renderSlider(
            placeHolder: Selection<any>,
            sliderColor: string,
            selectedType: GranularityType,
            startYpoint: number
        ): void {
            placeHolder
                .append("rect")
                .classed("periodSlicerRect", true)
                .style("stroke", sliderColor)
                .attr({
                    x: convertToPx(0 - TimelineGranularityBase.PeriodSlicerRectSelectionXOffset),
                    y: convertToPx(startYpoint - TimelineGranularityBase.PeriodSlicerRectSelectionYOffset),
                    rx: convertToPx(TimelineGranularityBase.DefaultPeriodSlicerRectSelectionRx),
                    width: convertToPx(TimelineGranularityBase.DefaultPeriodSlicerRectSelectionWidth),
                    height: convertToPx(TimelineGranularityBase.DefaultPeriodSlicerRectSelectionHeight)
                }).data([selectedType]);
        }

        public splitDate(date: Date): (string | number)[] {
            return [];
        }

        public splitDateForTitle(date: Date): (string | number)[] {
            return this.splitDate(date);
        }

        /**
        * Returns the short month name of the given date (e.g. Jan, Feb, Mar)
        */
        public shortMonthName(date: Date): string {
            return this.shortMonthFormatter.format(date);
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
                || !Utils.arraysEqual(lastDatePeriod.identifierArray, identifierArray)) {

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

            const dateOfFirstWeek: Date = this.calendar.getDateOfFirstWeek(year);
            const dateOfFirstFullWeek: Date = this.calendar.getDateOfFirstFullWeek(year);
            const weeks: number = Utils.getAmountOfWeeksBetweenDates(dateOfFirstFullWeek, date);

            if (date >= dateOfFirstFullWeek && dateOfFirstWeek < dateOfFirstFullWeek) {
                return [weeks + 1, year];
            }

            return [weeks, year];
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
