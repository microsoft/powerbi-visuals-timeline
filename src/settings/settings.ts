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

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";

import { CalendarSettings } from "./calendarSettings";
import { CellsSettings } from "./cellsSettings";
import { CursorSettings } from "./cursorSettings";
import { ForceSelectionSettings } from "./forceSelectionSettings";
import { GeneralSettings } from "./generalSettings";
import { GranularitySettings } from "./granularitySettings";
import { LabelsSettings } from "./labelsSettings";
import { ScrollAutoAdjustment } from "./scrollAutoAdjustment";
import { WeekDaySettings } from "./weekDaySettings";
import { LimitDateSpan } from "./limitDateSpan";

export class VisualSettings extends dataViewObjectsParser.DataViewObjectsParser {
    public general: GeneralSettings = new GeneralSettings();
    public calendar: CalendarSettings = new CalendarSettings();
    public forceSelection: ForceSelectionSettings = new ForceSelectionSettings();
    public weekDay: WeekDaySettings = new WeekDaySettings();
    public rangeHeader: LabelsSettings = new LabelsSettings();
    public cells: CellsSettings = new CellsSettings();
    public granularity: GranularitySettings = new GranularitySettings();
    public labels: LabelsSettings = new LabelsSettings();
    public scrollAutoAdjustment: ScrollAutoAdjustment = new ScrollAutoAdjustment();
    public cursor: CursorSettings = new CursorSettings();
    public limitDateSpan: LimitDateSpan = new LimitDateSpan();
}
