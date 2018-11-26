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

import { CssConstants } from "powerbi-visuals-utils-svgutils";

import { Granularity } from "./granularity/granularity";
import { TimelineDatePeriod } from "./datePeriod/datePeriod";

export interface TimelineMargins {
    LeftMargin: number;
    RightMargin: number;
    TopMargin: number;
    BottomMargin: number;
    CellWidth: number;
    CellHeight: number;
    StartXpoint: number;
    StartYpoint: number;
    ElementWidth: number;
    MinCellWidth: number;
    MinCellHeight: number;
    MaxCellHeight: number;
    PeriodSlicerRectWidth: number;
    PeriodSlicerRectHeight: number;
    LegendHeight: number;
    LegendHeightOffset: number;
    HeightOffset: number;
}

export interface TimelineSelectors {
    TimelineVisual: CssConstants.ClassAndSelector;
    TimelineWrapper: CssConstants.ClassAndSelector;
    SelectionRangeContainer: CssConstants.ClassAndSelector;
    textLabel: CssConstants.ClassAndSelector;
    LowerTextCell: CssConstants.ClassAndSelector;
    UpperTextCell: CssConstants.ClassAndSelector;
    UpperTextArea: CssConstants.ClassAndSelector;
    LowerTextArea: CssConstants.ClassAndSelector;
    RangeTextArea: CssConstants.ClassAndSelector;
    CellsArea: CssConstants.ClassAndSelector;
    CursorsArea: CssConstants.ClassAndSelector;
    MainArea: CssConstants.ClassAndSelector;
    SelectionCursor: CssConstants.ClassAndSelector;
    Cell: CssConstants.ClassAndSelector;
    CellRect: CssConstants.ClassAndSelector;
    TimelineSlicer: CssConstants.ClassAndSelector;
    PeriodSlicerGranularities: CssConstants.ClassAndSelector;
    PeriodSlicerSelection: CssConstants.ClassAndSelector;
    PeriodSlicerSelectionRect: CssConstants.ClassAndSelector;
    PeriodSlicerRect: CssConstants.ClassAndSelector;
}

export interface TimelineLabel {
    title: string;
    text: string;
    id: number;
}

export interface ExtendedLabel {
    yearLabels?: TimelineLabel[];
    quarterLabels?: TimelineLabel[];
    monthLabels?: TimelineLabel[];
    weekLabels?: TimelineLabel[];
    dayLabels?: TimelineLabel[];
}

export interface ITimelineJSONDatePeriod {
    startDate: string;
    endDate: string;
}

export interface TimelineCursorOverElement {
    index: number;
    datapoint: TimelineDatapoint;
}

export interface TimelineProperties {
    leftMargin: number;
    rightMargin: number;
    topMargin: number;
    bottomMargin: number;
    textYPosition: number;
    startXpoint: number;
    startYpoint: number;
    elementWidth: number;
    cellWidth: number;
    cellHeight: number;
    cellsYPosition: number;
}

export interface TimelineData {
    filterColumnTarget?: any; /* IFilterColumnTarget */
    timelineDatapoints?: TimelineDatapoint[];
    selectionStartIndex?: number;
    selectionEndIndex?: number;
    cursorDataPoints?: CursorDatapoint[];
    currentGranularity?: Granularity;
}

export interface CursorDatapoint {
    x: number;
    y: number;
    cursorIndex: number;
    selectionIndex: number;
}

export interface TimelineDatapoint {
    index: number;
    datePeriod: TimelineDatePeriod;
}
