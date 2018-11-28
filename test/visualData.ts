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

import powerbi from "powerbi-visuals-api";

import { testDataViewBuilder } from "powerbi-visuals-utils-testutils";
import { valueType } from "powerbi-visuals-utils-typeutils";

import { getDateRange } from "./helpers";

export class TimelineData extends testDataViewBuilder.TestDataViewBuilder {
    public static ColumnCategory: string = "Date";

    public valuesCategory: Date[] = getDateRange(
        new Date(2016, 0, 1),
        new Date(2016, 0, 10),
        1000 * 24 * 3600,
    );

    public setDateRange(startDate: Date, endDate: Date) {
        this.valuesCategory = getDateRange(startDate, endDate, 1000 * 24 * 3600);
    }

    public getDataView(columnNames?: string[]): powerbi.DataView {
        return this.createCategoricalDataViewBuilder([
            {
                source: {
                    displayName: TimelineData.ColumnCategory,
                    roles: { Category: true },
                    type: valueType.ValueType.fromDescriptor({ dateTime: true }),
                },
                values: this.valuesCategory,
            },

        ], null, columnNames).build();
    }

    public getUnWorkableDataView(): powerbi.DataView {
        return this.createCategoricalDataViewBuilder([
            {
                source: {
                    displayName: "Country",
                    roles: { Category: true },
                    type: valueType.ValueType.fromDescriptor({ text: true }),
                },
                values: [
                    "Australia",
                    "Canada",
                    "France",
                    "Germany",
                    "United Kingdom",
                    "United States",
                ],
            },
        ], null, null).build();
    }
}
