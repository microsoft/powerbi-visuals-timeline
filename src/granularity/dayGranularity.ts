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

import { Selection } from "d3-selection";

import { Calendar } from "../calendars/calendar";
import { ITimelineLabel } from "../dataInterfaces";
import { ITimelineDatePeriod } from "../datePeriod/datePeriod";
import { Utils } from "../utils";
import { GranularityBase } from "./granularityBase";
import { IGranularityRenderProps } from "./granularityRenderProps";
import { GranularityType } from "./granularityType";

export class DayGranularity extends GranularityBase {
    constructor(calendar: Calendar, locale: string) {
        super(calendar, locale, Utils.GET_GRANULARITY_PROPS_BY_MARKER("D"));
    }

    public render(props: IGranularityRenderProps, isFirst: boolean): Selection<any, any, any, any> {
        if (!props.granularSettings.granularityDayVisibility.value) {
            return null;
        }

        return super.render(props, isFirst);
    }

    public getType(): GranularityType {
        return GranularityType.day;
    }

    public splitDate(date: Date): (string | number)[] {
        return [
            this.shortMonthName(date),
            date.getDate(),
            this.calendar.determineYear(date),
        ];
    }

    public sameLabel(firstDatePeriod: ITimelineDatePeriod, secondDatePeriod: ITimelineDatePeriod): boolean {
        return firstDatePeriod.startDate.getTime() === secondDatePeriod.startDate.getTime();
    }

    public generateLabel(datePeriod: ITimelineDatePeriod): ITimelineLabel {
        const quarter: string = this.quarterText(datePeriod.startDate);
        const monthName: string = this.shortMonthName(datePeriod.startDate);
        const title: string = `${monthName} ${datePeriod.startDate.getDate()} - ${datePeriod.year}, ${quarter} W${datePeriod.week[0]}`;

        return {
            id: datePeriod.index,
            text: datePeriod.startDate.getDate().toLocaleString(),
            title,
        };
    }
}
