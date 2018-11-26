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
    Selection,
    selectAll,
} from "d3-selection";

import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { manipulation as svgManipulation } from "powerbi-visuals-utils-svgutils";
import { pixelConverter } from "powerbi-visuals-utils-typeutils";

import { Utils } from "../utils";
import { Granularity } from "./granularity";
import { Calendar } from "../calendar";
import { ITimelineDatePeriod } from "../datePeriod/datePeriod";
import { GranularityName } from "./granularityName";
import { GranularityRenderProps } from "./granularityRenderProps";
import { GranularitySettings } from "../settings";

import {
    ExtendedLabel,
    TimelineLabel,
} from "../dataInterfaces";

export class TimelineGranularityBase implements Granularity {
    private static DefaultFraction: number = 1;
    private static EmptyYearOffset: number = 0;
    private static YearOffset: number = 1;

    private clickableRectHeight: number = 23;
    private clickableRectFactor: number = 2;
    private clickableRectWidth: number = 30;

    private hLineYOffset: number = 2;
    private hLineHeight: number = 1;
    private hLineWidth: number = 30;
    private hLineXOffset: number = 30;

    private sliderXOffset: number = 6;
    private sliderYOffset: number = 16;
    private sliderRx: number = 4;
    private sliderWidth: number = 15;
    private sliderHeight: number = 23;

    private vLineWidth: number = 2;
    private vLineHeight: number = 3;

    private textLabelXOffset: number = 3;
    private textLabelYOffset: number = 3;
    private textLabelDx: string = "0.5em";

    protected calendar: Calendar;

    private datePeriods: ITimelineDatePeriod[] = [];
    private extendedLabel: ExtendedLabel;
    private shortMonthFormatter: valueFormatter.IValueFormatter;
    private granularityProps: GranularityName = null;

    constructor(calendar: Calendar, private locale: string, granularityProps: GranularityName) {
        this.calendar = calendar;
        this.shortMonthFormatter = valueFormatter.valueFormatter.create({ format: "MMM", cultureSelector: this.locale });
        this.granularityProps = granularityProps;
    }

    public render(props: GranularityRenderProps, isFirst: boolean): Selection<any, any, any, any> {
        let granularitySelection = props.selection.append("g")
            .attr("transform", svgManipulation.translate(0, 0));

        // render vetical line
        granularitySelection.append("rect")
            .classed("timelineVertLine", true)
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", pixelConverter.toString(this.vLineWidth))
            .attr("height", pixelConverter.toString(this.vLineHeight));

        // render horizontal line
        if (!isFirst) {
            granularitySelection.append("rect")
                .classed("timelineHorzLine", true)
                .attr("x", pixelConverter.toString(0 - this.hLineXOffset))
                .attr("y", pixelConverter.toString(this.hLineYOffset))
                .attr("height", pixelConverter.toString(this.hLineHeight))
                .attr("width", pixelConverter.toString(this.hLineWidth));
        }

        // render marker
        granularitySelection.append("text")
            .classed("periodSlicerGranularities", true)
            .text(this.granularityProps.marker)
            .attr("x", pixelConverter.toString(0 - this.textLabelXOffset))
            .attr("y", pixelConverter.toString(0 - this.textLabelYOffset))
            .attr("dx", this.textLabelDx);

        // render slider
        if (props.granularSettings.granularity === this.granularityProps.granularityType) {
            this.renderSlider(
                granularitySelection,
                props.granularSettings
            );
        }

        const granularityTypeClickHandler = (d: any, index: number) => {
            props.selectPeriodCallback(this.granularityProps.granularityType);

            let sliderSelection = selectAll("rect.periodSlicerRect");

            if (sliderSelection) {
                sliderSelection.remove();
            }

            this.renderSlider(
                granularitySelection,
                props.granularSettings
            );
        };

        // render selection rects
        granularitySelection
            .append("rect")
            .classed("periodSlicerSelectionRect", true)
            .attr("x", pixelConverter.toString(0 - this.clickableRectWidth / this.clickableRectFactor))
            .attr("y", pixelConverter.toString(0 - this.clickableRectWidth / this.clickableRectFactor))
            .attr("width", pixelConverter.toString(this.clickableRectWidth))
            .attr("height", pixelConverter.toString(this.clickableRectHeight))
            .on("mousedown", granularityTypeClickHandler)
            .on("touchstart", granularityTypeClickHandler);

        granularitySelection.attr("fill", props.granularSettings.scaleColor);

        return granularitySelection;
    }

    private renderSlider(
        selection: Selection<any, any, any, any>,
        granularSettings: GranularitySettings
    ): void {
        selection
            .append("rect")
            .classed("periodSlicerRect", true)
            .style("stroke", granularSettings.sliderColor)
            .attr("x", pixelConverter.toString(0 - this.sliderXOffset))
            .attr("y", pixelConverter.toString(0 - this.sliderYOffset))
            .attr("rx", pixelConverter.toString(this.sliderRx))
            .attr("width", pixelConverter.toString(this.sliderWidth))
            .attr("height", pixelConverter.toString(this.sliderHeight))
            .data([granularSettings.granularity]);
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

    public getDatePeriods(): ITimelineDatePeriod[] {
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
            lastDatePeriod: ITimelineDatePeriod;

        this.datePeriods.forEach((datePeriod: ITimelineDatePeriod) => {
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
        let datePeriods: ITimelineDatePeriod[] = this.getDatePeriods(),
            lastDatePeriod: ITimelineDatePeriod = datePeriods[datePeriods.length - 1],
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
        let oldDatePeriod: ITimelineDatePeriod = this.datePeriods[index];

        oldDatePeriod.fraction -= newFraction;

        let newDateObject: ITimelineDatePeriod = {
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
