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

import { ITimelineDatePeriod } from "../datePeriod/datePeriod";
import { IGranularityRenderProps } from "./granularityRenderProps";
import { GranularityType } from "./granularityType";

import {
    IExtendedLabel,
    ITimelineLabel,
} from "../dataInterfaces";

export interface IGranularity {
    determineWeek?(date: Date): number[];
    getType?(): GranularityType;
    splitDate(date: Date): Array<string | number>;
    getDatePeriods(): ITimelineDatePeriod[];
    resetDatePeriods(): void;
    getExtendedLabel(): IExtendedLabel;
    setExtendedLabel(extendedLabel: IExtendedLabel): void;
    createLabels(granularity: IGranularity): ITimelineLabel[];
    sameLabel?(firstDatePeriod: ITimelineDatePeriod, secondDatePeriod: ITimelineDatePeriod): boolean;
    generateLabel?(datePeriod: ITimelineDatePeriod): ITimelineLabel;
    addDate(date: Date);
    setNewEndDate(date: Date): void;
    splitPeriod(index: number, newFraction: number, newDate: Date): void;
    splitDateForTitle(date: Date): Array<string | number>;
    render(
        props: IGranularityRenderProps,
        isFirst: boolean,
    ): Selection<any, any, any, any>;
}
