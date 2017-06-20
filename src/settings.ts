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

module powerbi.extensibility.visual.settings {
    // powerbi.data
    import ISemanticFilter = powerbi.data.ISemanticFilter;

    // datePeriod
    import TimelineDatePeriodBase = datePeriod.TimelineDatePeriodBase;

    // granularity
    import GranularityType = granularity.GranularityType;

    // powerbi.extensibility.utils.dataview
    import DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;

    export class GeneralSettings {
        public datePeriod: TimelineDatePeriodBase | string = TimelineDatePeriodBase.createEmpty();
        public filter: ISemanticFilter = null;
    }

    export class CalendarSettings {
        public month: number = 0;
        public day: number = 1;
    }

    export class WeekDaySettings {
        public day: number = 0;
    }

    export class LabelsSettings {
        show: boolean = true;
        fontColor: string = "#777777";
        textSize: number = 9;
    }

    export class CellsSettings {
        public fillSelected: string = "#ADD8E6";
        public fillUnselected: string = "";
    }

    export class GranularitySettings {
        public scaleColor: string = "#000000";
        public sliderColor: string = "#AAAAAA";
        public granularity: GranularityType = GranularityType.month;
    }

    export class VisualSettings extends DataViewObjectsParser {
        public general: GeneralSettings = new GeneralSettings();
        public calendar: CalendarSettings = new CalendarSettings();
        public weekDay: WeekDaySettings = new WeekDaySettings();
        public rangeHeader: LabelsSettings = new LabelsSettings();
        public cells: CellsSettings = new CellsSettings();
        public granularity: GranularitySettings = new GranularitySettings();
        public labels: LabelsSettings = new LabelsSettings();
    }
}
