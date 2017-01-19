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

    export interface TimelineGeneralSettings {
        datePeriod: TimelineDatePeriodBase | string;
        filter: ISemanticFilter;
    }

    export interface TimelineCalendarSettings {
        month: number;
        day: number;
    }

    export interface TimelineWeekDaySettings {
        day: number;
    }

    export interface TimelineLabelsSettings {
        show: boolean;
        fontColor: string;
        textSize: number;
    }

    export interface TimelineCellsSettings {
        fillSelected: string;
        fillUnselected: string;
    }

    export interface TimelineGranularitySettings {
        scaleColor: string;
        sliderColor: string;
        granularity: GranularityType;
    }

    export class TimelineSettings {
        public static get Default() {
            return new this();
        }

        public static parse(dataView: DataView): TimelineSettings {
            return new this();
        }

        public originalSettings: TimelineSettings;
        public createOriginalSettings(): void {
            this.originalSettings = _.cloneDeep(this);
        }

        // Default Settings
        public general: TimelineGeneralSettings = {
            datePeriod: TimelineDatePeriodBase.createEmpty(),
            filter: null
        };

        public calendar: TimelineCalendarSettings = {
            month: 0,
            day: 1
        };

        public weekDay: TimelineWeekDaySettings = {
            day: 0
        };

        public rangeHeader: TimelineLabelsSettings = {
            show: true,
            fontColor: "#777777",
            textSize: 9
        };

        public cells: TimelineCellsSettings = {
            fillSelected: "#ADD8E6",
            fillUnselected: "" // transparent by default
        };

        public granularity: TimelineGranularitySettings = {
            scaleColor: "#000000",
            sliderColor: "#AAAAAA",
            granularity: GranularityType.month
        };

        public labels: TimelineLabelsSettings = {
            show: true,
            fontColor: "#777777",
            textSize: 9
        };
    }
}
