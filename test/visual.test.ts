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

import { select as d3Select } from "d3-selection";
import powerbiVisualsApi from "powerbi-visuals-api";
import {
    assertColorsMatch, clickElement, d3Click, renderTimeout,
} from "powerbi-visuals-utils-testutils";

import { Calendar } from "../src/calendars/calendar";
import { ITimelineCursorOverElement, ITimelineData } from "../src/dataInterfaces";
import { ITimelineDatePeriod, ITimelineDatePeriodBase } from "../src/datePeriod/datePeriod";
import { DatePeriodBase } from "../src/datePeriod/datePeriodBase";
import { DayGranularity } from "../src/granularity/dayGranularity";
import { IGranularity } from "../src/granularity/granularity";
import { GranularityType } from "../src/granularity/granularityType";
import { MonthGranularity } from "../src/granularity/monthGranularity";
import { QuarterGranularity } from "../src/granularity/quarterGranularity";
import { WeekGranularity } from "../src/granularity/weekGranularity";
import { YearGranularity } from "../src/granularity/yearGranularity";
import { CalendarSettings } from "../src/settings/calendarSettings";
import { WeekDaySettings } from "../src/settings/weekDaySettings";
import { Utils } from "../src/utils";
import { Timeline } from "../src/timeLine";
import { GranularityMock } from "./granularityMock";
import { areColorsEqual, getSolidColorStructuralObject } from "./helpers";
import { VisualBuilder } from "./visualBuilder";
import { VisualData } from "./visualData";
import { CalendarISO8061 } from "../src/calendars/calendarISO8061";

describe("Timeline", () => {
    let visualBuilder: VisualBuilder;
    let defaultDataViewBuilder: VisualData;
    let dataView: powerbiVisualsApi.DataView;

    beforeEach(() => {
        visualBuilder = new VisualBuilder(1000, 500);
        defaultDataViewBuilder = new VisualData();

        dataView = defaultDataViewBuilder.getDataView();
    });

    describe("DOM tests", () => {
        it("svg element created", () => expect(document.contains(visualBuilder.mainElement)).toBe(true));

        it("basic update", (done) => {
            dataView.metadata.objects = {
                granularity: {
                    granularity: GranularityType.day,
                },
            };

            visualBuilder.update(dataView);

            renderTimeout(() => {
                const countOfDays: number = visualBuilder
                    .mainElement
                    .querySelectorAll("g.mainArea > .cellsArea > .cellRect")
                    .length;

                const countOfTextItems: number = Array.from(
                        visualBuilder
                        .mainElement
                        .querySelectorAll("g.mainArea > g")[4]
                        .querySelectorAll(".label")
                    ).map(el => el.children).flat()
                    .length;

                expect(countOfDays).toBe(dataView.categorical.categories[0].values.length);
                expect(countOfTextItems).toBe(dataView.categorical.categories[0].values.length);

                const cellRects: HTMLElement[] = Array.from(visualBuilder.mainElement.querySelectorAll(".cellRect"));

                d3Click(cellRects[cellRects.length - 1], 0, 0);

                const unselectedCellRect: Element = visualBuilder
                    .mainElement
                    .querySelectorAll(".cellRect")[0]

                assertColorsMatch(d3Select(unselectedCellRect).attr("fill"), "transparent");

                const cellHeightStr: string = cellRects[0].attributes.getNamedItem("height").value;
                const cellHeight: number = parseInt(cellHeightStr.replace("px", ""), 10);

                expect(cellHeight).toBeLessThan(60.1);
                expect(cellHeight).toBeGreaterThan(29.9);

                done();
            });
        });

        it("apply blank row data", (done) => {
            dataView.metadata.objects = {
                granularity: {
                    granularity: GranularityType.day,
                },
            };

            visualBuilder.update(dataView);

            renderTimeout(() => {
                dataView.categorical.categories[0].values.push(null);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const countOfDays: number = visualBuilder
                        .mainElement
                        .querySelectorAll("g.mainArea > .cellsArea > .cellRect")
                        .length;

                    expect(countOfDays).toBe(dataView.categorical.categories[0].values.length - 1);

                    done();
                });
            });
        });

        it("basic update", (done) => {
            dataView.metadata.objects = {
                granularity: {
                    granularity: GranularityType.year,
                },
            };

            visualBuilder.update(dataView);

            setTimeout(() => {
                // TimeRangeText check visibility when visual is small
                const textRangeText: string = document.querySelectorAll(".selectionRangeContainer")[0]
                    .textContent;

                expect(textRangeText).toContain("2016");

                done();
            });
        });

        it("range text cut off with small screen size", (done) => {
            const builder: VisualBuilder = new VisualBuilder(300, 500);

            dataView.metadata.objects = {
                granularity: {
                    granularity: GranularityType.month,
                },
            };

            builder.update(dataView);

            renderTimeout(() => {
                builder.updateRenderTimeout(dataView, () => {
                    const indexOfDots: number = builder.rangeHeaderText
                        .textContent
                        .indexOf("...");

                    expect(indexOfDots !== -1).toBeTruthy();

                    done();
                });
            });
        });

        describe("selection should be cleared if user clicks to root element", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    granularity: {
                        granularity: GranularityType.day,
                    },
                };

                visualBuilder.update(dataView);

                spyOn(visualBuilder.visualObject, "clearUserSelection");
            });

            it("click - event", (done) => {
                d3Click(visualBuilder.rootElement, 0, 0);

                renderTimeout(() => {
                    expect(visualBuilder.visualObject.clearUserSelection).toHaveBeenCalled();

                    done();
                });
            });
        });

        describe("granularity", () => {
            let periodSlicerSelectionRectElements: HTMLElement[];

            beforeEach((done) => {
                dataView.metadata.objects = {
                    granularity: {
                        granularity: GranularityType.month,
                    },
                };

                visualBuilder.update(dataView);

                spyOn(visualBuilder.visualObject, "changeGranularity");
                spyOn(visualBuilder.visualObject, "selectPeriod");

                renderTimeout(() => {
                    periodSlicerSelectionRectElements = Array.from(visualBuilder.element
                        .querySelectorAll(".periodSlicerSelectionRect"));

                    done();
                });
            });

            it("click - event", () => {
                d3Click(periodSlicerSelectionRectElements[0], 0, 0);
                expectToCallSelectPeriod(GranularityType.year);
            });

            it("settings - event", () => {
                dataView.metadata.objects = {
                    granularity: {
                        granularity: GranularityType.day,
                    },
                };

                visualBuilder.update(dataView);
                expectToCallChangeGranularity(GranularityType.day);
            });

            it("click - event - with disabled year", () => {
                dataView.metadata.objects = {
                    granularity: {
                        granularityYearVisibility: false,
                    },
                };

                visualBuilder.update(dataView);
                periodSlicerSelectionRectElements = Array.from(visualBuilder.element.querySelectorAll(".periodSlicerSelectionRect"));

                d3Click(periodSlicerSelectionRectElements[0], 0, 0);

                expect(periodSlicerSelectionRectElements.length).toEqual(4);
                expectToCallSelectPeriod(GranularityType.quarter);
            });

            it("click - event - with disabled quarter", () => {
                dataView.metadata.objects = {
                    granularity: {
                        granularityQuarterVisibility: false,
                    },
                };

                visualBuilder.update(dataView);
                const periodSlicerSelectionRectElements: HTMLElement[] = Array.from(visualBuilder.element.querySelectorAll(".periodSlicerSelectionRect"));

                d3Click(periodSlicerSelectionRectElements[1], 0, 0);

                expect(periodSlicerSelectionRectElements.length).toEqual(4);
                expectToCallSelectPeriod(GranularityType.month);
            });

            it("click - event - with disabled year, quarter and month", () => {
                dataView.metadata.objects = {
                    granularity: {
                        granularityMonthVisibility: false,
                        granularityQuarterVisibility: false,
                        granularityYearVisibility: false,
                    },
                };

                visualBuilder.update(dataView);

                const periodSlicerSelectionRectElements: HTMLElement[] = Array.from(visualBuilder.element.querySelectorAll(".periodSlicerSelectionRect"));

                d3Click(periodSlicerSelectionRectElements[1], 0, 0);

                expect(periodSlicerSelectionRectElements.length).toEqual(2);
                expectToCallSelectPeriod(GranularityType.day);
            });

            it("click - impossible - all granularities are disabled", () => {
                dataView.metadata.objects = {
                    granularity: {
                        granularityDayVisibility: false,
                        granularityMonthVisibility: false,
                        granularityQuarterVisibility: false,
                        granularityWeekVisibility: false,
                        granularityYearVisibility: false,
                    },
                };

                visualBuilder.update(dataView);

                const periodSlicerSelectionRectElements = Array.from(visualBuilder.element.querySelectorAll(".periodSlicerSelectionRect"));

                expect(periodSlicerSelectionRectElements.length).toEqual(0);
            });

            function expectToCallChangeGranularity(granularity: GranularityType): void {
                expect(visualBuilder.visualObject.changeGranularity)
                    .toHaveBeenCalledWith(granularity, jasmine.any(Date), jasmine.any(Date));
            }

            function expectToCallSelectPeriod(granularity: GranularityType): void {
                expect(visualBuilder.visualObject.selectPeriod)
                    .toHaveBeenCalledWith(granularity);
            }
        });
    });

    describe("selection", () => {
        it("selection should be recovered from the dataView after starting", () => {
            const startDate: Date = defaultDataViewBuilder.valuesCategory[0];
            const endDate: Date = defaultDataViewBuilder.valuesCategory[1];
            const datePeriod: DatePeriodBase = DatePeriodBase.CREATE(startDate, endDate);

            dataView.metadata.objects = {
                granularity: {
                    granularity: GranularityType.day,
                },
            };

            VisualBuilder.SET_DATE_PERIOD(dataView, datePeriod);

            // simulate filter restoring
            visualBuilder.setFilter(startDate, endDate);

            visualBuilder.updateFlushAllD3Transitions(dataView);

            const cellRects = visualBuilder.cellRects;

            for (let i: number = 0; i < cellRects.length; i++) {
                const fillColor: string = d3Select(cellRects[i]).attr("fill");

                assertColorsMatch(fillColor, "transparent", i === 0);
            }
        });

        function checkSelectionState(
            dataViewObject: powerbiVisualsApi.DataView,
            builder: VisualBuilder,
            done: () => void,
            modificator?: (dataView: powerbiVisualsApi.DataView) => void,
        ): void {

            dataViewObject.metadata.objects = {
                granularity: {
                    granularity: GranularityType.month,
                },
            };

            builder.update(dataViewObject);

            const countOfMonth: number = builder
                .mainElement
                .querySelectorAll(".cellRect")
                .length;

            (<any>(dataViewObject.metadata.objects)).granularity.granularity = GranularityType.day;

            builder.update(dataViewObject);

            builder.selectTheLatestCell();

            const timelineData: ITimelineData = builder.visualObject.timelineData;

            const startDate: Date = Utils.GET_START_SELECTION_DATE(timelineData);
            const endDate: Date = Utils.GET_END_SELECTION_DATE(timelineData);

            (<any>(dataViewObject.metadata.objects)).general = {
                datePeriod: DatePeriodBase.CREATE(startDate, endDate),
            };

            builder.updateflushAllD3TransitionsRenderTimeout(dataViewObject, () => {
                (<any>(dataViewObject.metadata.objects)).granularity.granularity = GranularityType.month;

                if (modificator) {
                    modificator(dataViewObject);
                }

                builder.update(dataViewObject);

                const countMonthOfSelectedDays: number = builder
                    .mainElement
                    .querySelectorAll(".cellRect")
                    .length;

                expect(countMonthOfSelectedDays).toEqual(countOfMonth + 1);

                done();
            });
        }
    });

    describe("setValidCalendarSettings", () => {
        it("should return the first day of month when a value less than the first day of month", () => {
            checkCalendarSettings(-42, 1, 1);
        });

        it("should return the latest day of month when a value more than the latest day of month", () => {
            checkCalendarSettings(42, 1, 29);
        });

        it("should return the first day of month when a value less than the first day of month", () => {
            checkCalendarSettings(5, 5, 5);
        });

        function checkCalendarSettings(day: number, month: number, expectedDay: number): void {
            const calendarSettings: CalendarSettings = { day, month };

            Timeline.SET_VALID_CALENDAR_SETTINGS(calendarSettings);

            expect(calendarSettings.day).toBe(expectedDay);
        }
    });

    describe("findCursorOverElement", () => {
        beforeEach((done) => {
            dataView.metadata.objects = {
                granularity: {
                    granularity: GranularityType.day,
                },
            };

            visualBuilder.update(dataView);

            renderTimeout(done);
        });

        it("-9999", () => {
            expectToCallFindCursorOverElement(-9999, 0);
        });

        it("9999", () => {
            expectToCallFindCursorOverElement(9999, 8);
        });

        it("120", () => {
            expectToCallFindCursorOverElement(120, 1);
        });

        it("220", () => {
            expectToCallFindCursorOverElement(220, 2);
        });

        function expectToCallFindCursorOverElement(x: number, expectedIndex: number): void {
            const cursorOverElement: ITimelineCursorOverElement = visualBuilder
                .visualObject
                .findCursorOverElement(x);

            expect(cursorOverElement).not.toBeNull();
            expect(cursorOverElement.index).toEqual(expectedIndex);
            expect(cursorOverElement.datapoint).not.toBeNull();
            expect(cursorOverElement.datapoint).not.toBeUndefined();
        }
    });

    describe("areVisualUpdateOptionsValid", () => {
        it("VisualUpdateOptions is valid", () => {
            expectToCallDatasetsChanged(dataView, true);
        });

        it("VisualUpdateOptions isn't valid", () => {
            expectToCallDatasetsChanged(defaultDataViewBuilder.getUnWorkableDataView(), false);
        });

        function expectToCallDatasetsChanged(
            dataViewObject: powerbiVisualsApi.DataView,
            expectedValue: boolean,
        ): void {
            const options: powerbiVisualsApi.extensibility.visual.VisualUpdateOptions = <powerbiVisualsApi.extensibility.visual.VisualUpdateOptions>(<unknown>{
                dataViews: [dataViewObject],
            });

            const areVisualUpdateOptionsValid: boolean = Timeline.ARE_VISUAL_UPDATE_OPTIONS_VALID(options);

            expect(areVisualUpdateOptionsValid).toEqual(expectedValue);
        }
    });

    describe("Format settings test", () => {
        function checkSelectedElement(
            granularity: GranularityType | string,
            expectedElementsAmount: number,
        ): void {
            dataView.metadata.objects.granularity.granularity = granularity;

            visualBuilder.updateFlushAllD3Transitions(dataView);

            const selectedElements: Element[] = [];

            visualBuilder.cellRects
                .forEach((element: Element) => {
                    const fill: string = d3Select(element).attr("fill");
                    if (fill !== "rgba(0, 0, 0, 0)" && fill !== "transparent") {
                        selectedElements.push(element);
                    }
                });

            expect(selectedElements.length).toEqual(expectedElementsAmount);
        }

        function checkSelectedElementIsLatestAvailable(
            granularity: string,
        ): void {
            dataView.metadata.objects.granularity.granularity = granularity;

            visualBuilder.updateFlushAllD3Transitions(dataView);

            const selectedElements: Element[] = [];
            const lastElement = visualBuilder.cellRects[visualBuilder.cellRects.length - 1];

            visualBuilder.cellRects
                .forEach((element: Element) => {
                    const fill: string = window.getComputedStyle(element).getPropertyValue("fill");
                    if (fill !== "rgba(0, 0, 0, 0)" && fill !== "transparent") {
                        selectedElements.push(element);
                    }
                });

            expect(selectedElements.length).toEqual(1);
            expect(selectedElements[0]).toEqual(lastElement);
        }

        describe("Range header", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    rangeHeader: {
                        show: true,
                    },
                };
            });

            it("show", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.rangeHeaderText.textContent).not.toBe("");

                (<any>(dataView.metadata.objects)).rangeHeader.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.rangeHeaderText).toBe(null);
            });

            it("font color", () => {
                const color: string = "#ABCDEF";

                (<any>(dataView.metadata.objects)).rangeHeader.fontColor = getSolidColorStructuralObject(color);

                visualBuilder.updateFlushAllD3Transitions(dataView);

                assertColorsMatch(window.getComputedStyle(visualBuilder.rangeHeaderText).getPropertyValue("fill"), color);
            });

            it("font size", () => {
                const fontSize: number = 22;
                const expectedFontSize: string = "29.3333px";

                (<any>(dataView.metadata.objects)).rangeHeader.textSize = fontSize;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(window.getComputedStyle(visualBuilder.rangeHeaderText).getPropertyValue("font-size")).toBe(expectedFontSize);
            });
        });

        describe("Cells", () => {
            it("selected cell color", () => {
                const color: string = "#ABCDEF";

                dataView.metadata.objects = {
                    cells: {
                        fillSelected: getSolidColorStructuralObject(color),
                    },
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.cellRects
                    .forEach((element: Element) => {
                        assertColorsMatch(window.getComputedStyle(element).getPropertyValue("fill"), color);
                    });
            });

            it("unselected cell color", () => {
                const color: string = "#ABCDEF";

                dataView.metadata.objects = {
                    cells: {
                        fillUnselected: getSolidColorStructuralObject(color),
                    },
                    granularity: {
                        granularity: GranularityType.day,
                    },
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const lastCell = visualBuilder.cellRects[visualBuilder.cellRects.length - 1];

                clickElement(lastCell);
                visualBuilder.cellRects
                    .forEach((element: Element) => {
                        assertColorsMatch(
                            window.getComputedStyle(element).getPropertyValue("fill"),
                            color,
                            element === lastCell);
                    });
            });
        });

        describe("Granularity", () => {
            it("scale color", () => {
                const color: string = "#ABCDEF";

                dataView.metadata.objects = {
                    granularity: {
                        scaleColor: getSolidColorStructuralObject(color),
                    },
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                Array.from(visualBuilder.timelineSlicer
                    .querySelectorAll("rect.timelineVertLine, text.periodSlicerGranularities, text.periodSlicerSelection"))
                    .forEach((element: Element) => {
                        assertColorsMatch( window.getComputedStyle(element).getPropertyValue("fill"), color);
                    });
            });

            it("slider color", () => {
                const color: string = "#ABCDEF";

                dataView.metadata.objects = {
                    granularity: {
                        sliderColor: getSolidColorStructuralObject(color),
                    },
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const element: HTMLElement = visualBuilder.timelineSlicer
                    .querySelector("rect.periodSlicerRect")

                assertColorsMatch(window.getComputedStyle(element).getPropertyValue("stroke"), color);
            });
        });

        describe("First day of week option", () => {
            const daySelection: boolean = true;
            const startDateRange: Date = new Date(2015, 0, 1);
            const weekFromStartRange: Date = new Date(2015, 0, 7);

            const granularity: string = "week";

            beforeEach(() => {
                visualBuilder = new VisualBuilder(1000, 500);
                defaultDataViewBuilder = new VisualData();
                defaultDataViewBuilder.setDateRange(startDateRange, weekFromStartRange);

                dataView = defaultDataViewBuilder.getDataView();
            });

            it("check calendar with default day of week - Sunday", () => {
                const dayOfWeekSundayNumber = 0;

                dataView.metadata.objects = {
                    granularity: {},
                    weekDay: {
                        day: dayOfWeekSundayNumber,
                        daySelection,
                    },
                };

                checkSelectedElement(GranularityType.week, 2);
            });

            it("check calendar with setted day of week - Tuesday", () => {
                const dayOfWeekThursdayNumber = 2;

                dataView.metadata.objects = {
                    granularity: {},
                    weekDay: {
                        day: dayOfWeekThursdayNumber,
                        daySelection,
                    },
                };

                checkSelectedElement(GranularityType.week, 2);
            });

            it("check calendar getWeekperiod function with day of week option off", () => {
                dataView.metadata.objects = {
                    granularity: {},
                    weekDay: {
                        daySelection: !daySelection,
                    },
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const visualCalendar: Calendar = visualBuilder.visualObject.calendar;

                let dates: any = visualCalendar.getWeekPeriod(new Date(2014, 0, 1));

                expect(<Date>(dates.startDate)).toEqual(new Date(2014, 0, 1));
                expect(<Date>(dates.endDate)).toEqual(new Date(2014, 0, 8));

                dates = visualCalendar.getWeekPeriod(new Date(2015, 0, 1));
                expect(<Date>(dates.startDate)).toEqual(new Date(2015, 0, 1));

                expect(<Date>(dates.endDate)).toEqual(new Date(2015, 0, 8));

                dates = visualCalendar.getWeekPeriod(new Date(2016, 0, 1));

                expect(<Date>(dates.startDate)).toEqual(new Date(2016, 0, 1));
                expect(<Date>(dates.endDate)).toEqual(new Date(2016, 0, 8));

                dates = visualCalendar.getWeekPeriod(new Date(2017, 0, 1));

                expect(<Date>(dates.startDate)).toEqual(new Date(2017, 0, 1));
                expect(<Date>(dates.endDate)).toEqual(new Date(2017, 0, 8));

                dates = visualCalendar.getWeekPeriod(new Date(2018, 0, 1));

                expect(<Date>(dates.startDate)).toEqual(new Date(2018, 0, 1));
                expect(<Date>(dates.endDate)).toEqual(new Date(2018, 0, 8));
            });

            it("check calendar with day of week option off", () => {
                visualBuilder = new VisualBuilder(1000, 500);
                defaultDataViewBuilder = new VisualData();
                defaultDataViewBuilder.setDateRange(new Date(2015, 0, 1), new Date(2016, 0, 12));
                dataView = defaultDataViewBuilder.getDataView();

                dataView.metadata.objects = {
                    granularity: {
                        granularity: GranularityType[granularity],
                    },
                    weekDay: {
                        daySelection: !daySelection,
                    },
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const periods: any[] = visualBuilder.visualObject.timelineData.currentGranularity.getDatePeriods();
                expect(periods.length).toEqual(55);
                expect(<Date>(periods[0].startDate)).toEqual(new Date(2015, 0, 1));
                expect(<Date>(periods[53].startDate)).toEqual(new Date(2016, 0, 1));
            });
        });

        describe("Force selection", () => {

            it("disabled both -- possible to make user selection", () => {
                for (const granularity of Object.keys(GranularityType)) {
                    if (isNaN(+granularity)) {
                        const currentDate: Date = new Date();
                        const startDateRange: Date = new Date(currentDate.getFullYear() - 1, 0, 1);
                        const endDateRange: Date = new Date(currentDate.getFullYear() + 1, 11, 31);
                        const color: string = "#ABCDEF";
                        const colorSel: string = "#AAAAAA";

                        defaultDataViewBuilder.setDateRange(startDateRange, endDateRange);

                        dataView = defaultDataViewBuilder.getDataView();
                        dataView.metadata.objects = {
                            cells: {
                                fillSelected: getSolidColorStructuralObject(colorSel),
                                fillUnselected: getSolidColorStructuralObject(color),
                            },
                            forceSelection: {
                                currentPeriod: false,
                                latestAvailableDate: false,
                            },
                            granularity: {},
                        };

                        visualBuilder.updateFlushAllD3Transitions(dataView);

                        const lastCell = visualBuilder.cellRects[visualBuilder.cellRects.length - 1];

                        clickElement(lastCell);

                        assertColorsMatch(
                            window.getComputedStyle(lastCell).getPropertyValue("fill"),
                            colorSel
                        );
                    }
                }
            });

            it("user selection is allowed if forceSelection.currentPeriod is enabled", () => {
                for (const granularity of Object.keys(GranularityType)) {
                    if (isNaN(+granularity)) {
                        const currentDate: Date = new Date();
                        const startDateRange: Date = new Date(currentDate.getFullYear() - 1, 0, 1);
                        const endDateRange: Date = new Date(currentDate.getFullYear() + 1, 11, 31);

                        const color: string = "#ABCDEF";
                        const selectedColor: string = "#AAAAAA";

                        defaultDataViewBuilder.setDateRange(startDateRange, endDateRange);

                        dataView = defaultDataViewBuilder.getDataView();

                        dataView.metadata.objects = {
                            cells: {
                                fillSelected: getSolidColorStructuralObject(selectedColor),
                                fillUnselected: getSolidColorStructuralObject(color),
                            },
                            forceSelection: {
                                currentPeriod: true,
                                latestAvailableDate: false,
                            },
                            granularity: {},
                        };

                        visualBuilder.updateFlushAllD3Transitions(dataView);

                        const lastCell = visualBuilder.cellRects[visualBuilder.cellRects.length - 1];

                        clickElement(lastCell);

                        assertColorsMatch(
                            window.getComputedStyle(lastCell).getPropertyValue("fill"),
                            selectedColor,
                        );
                    }
                }
            });

            it("user selection is allowed if forceSelection.latestAvailableDate is enabled", () => {
                for (const granularity of Object.keys(GranularityType)) {
                    if (isNaN(+granularity)) {
                        const currentDate: Date = new Date();
                        const startDateRange: Date = new Date(currentDate.getFullYear() - 1, 0, 1);
                        const endDateRange: Date = new Date(currentDate.getFullYear() + 1, 11, 31);

                        const color: string = "#ABCDEF";
                        const selectedColor: string = "#AAAAAA";

                        defaultDataViewBuilder.setDateRange(startDateRange, endDateRange);

                        dataView = defaultDataViewBuilder.getDataView();
                        dataView.metadata.objects = {
                            cells: {
                                fillSelected: getSolidColorStructuralObject(selectedColor),
                                fillUnselected: getSolidColorStructuralObject(color),
                            },
                            forceSelection: {
                                currentPeriod: false,
                                latestAvailableDate: true,
                            },
                            granularity: {},
                        };

                        visualBuilder.updateFlushAllD3Transitions(dataView);

                        const firstCell = visualBuilder.cellRects[0];

                        clickElement(firstCell);

                        assertColorsMatch(
                            window.getComputedStyle(firstCell).getPropertyValue("fill"),
                            selectedColor,
                        );
                    }
                }
            });

            it(`current period for 'week' granularity`, () => {
                for (const granularity of Object.keys(GranularityType)) {
                    if (isNaN(+granularity)) {
                        const currentDate: Date = new Date();
                        const startDateRange: Date = new Date(currentDate.getFullYear(), 0, 1);
                        const endDateRange: Date = new Date(currentDate.getFullYear() + 1, 11, 31);

                        defaultDataViewBuilder.setDateRange(startDateRange, endDateRange);

                        dataView = defaultDataViewBuilder.getDataView();
                        dataView.metadata.objects = {
                            forceSelection: {
                                currentPeriod: true,
                            },
                            granularity: {},
                        };

                        checkSelectedElement(GranularityType.week, 1);
                    }
                }
            });

            it(`current period out of data set for granularity`, () => {
                for (const granularity of Object.keys(GranularityType)) {
                    if (isNaN(+granularity)) {
                        const startDateRange: Date = new Date(2010, 0, 1);
                        const endDateRange: Date = new Date(2011, 11, 31);

                        const amountOfDaysFromStart: number = 0;

                        defaultDataViewBuilder.setDateRange(startDateRange, endDateRange);

                        dataView = defaultDataViewBuilder.getDataView();
                        dataView.metadata.objects = {
                            forceSelection: {
                                currentPeriod: true,
                            },
                            granularity: {
                                granularity,
                            },
                        };

                        const startDateSelection: Date =
                            defaultDataViewBuilder.valuesCategory[amountOfDaysFromStart];

                        const monthOfEndDate: number = endDateRange.getMonth();
                        const monthOfStartDateSelection: number = startDateSelection.getMonth();

                        const amountOfDays: number = defaultDataViewBuilder.valuesCategory.length;
                        const amountOfYears = (amountOfDays - amountOfDaysFromStart) / 365;

                        const amountOfMonthsInYearsDiff: number = Math.ceil((amountOfYears - 1) * 12);
                        const amountOfMonthsThisYear: number = monthOfEndDate - monthOfStartDateSelection + 1;

                        const amountOfMonths: number = amountOfMonthsInYearsDiff + amountOfMonthsThisYear;

                        let expectedElementsAmount: number;
                        switch (granularity) {
                            case "year":
                                expectedElementsAmount = amountOfYears;
                                break;
                            case "quarter":
                                expectedElementsAmount = amountOfMonths / 3;
                                break;
                            case "month":
                                expectedElementsAmount = amountOfMonths;
                                break;
                            case "week":
                                expectedElementsAmount = Math.ceil((amountOfDays - amountOfDaysFromStart) / 7) + 1;
                                break;
                            case "day":
                                expectedElementsAmount = amountOfDays - amountOfDaysFromStart;
                                break;
                        }

                        checkSelectedElement(GranularityType[granularity], Math.ceil(expectedElementsAmount));
                    }
                }
            });

            it(`latest available period for granularity`, () => {
                for (const granularity of Object.keys(GranularityType)) {
                    if (isNaN(+granularity)) {
                        const startDateRange: Date = new Date(2018, 0, 1);
                        const endDateRange: Date = new Date(2019, 11, 31);

                        defaultDataViewBuilder.setDateRange(startDateRange, endDateRange);

                        dataView = defaultDataViewBuilder.getDataView();
                        dataView.metadata.objects = {
                            forceSelection: {
                                latestAvailableDate: true,
                            },
                            granularity: {},
                        };

                        checkSelectedElementIsLatestAvailable(GranularityType[granularity]);
                    }
                }
            });

            it(`latest available period and current period for granularity both for out of date range`, () => {
                for (const granularity of Object.keys(GranularityType)) {
                    if (isNaN(+granularity)) {
                        // can not find current date, so will be found last available date
                        const startDateRange: Date = new Date(2011, 0, 1);
                        const endDateRange: Date = new Date(2012, 11, 31);

                        defaultDataViewBuilder.setDateRange(startDateRange, endDateRange);

                        dataView = defaultDataViewBuilder.getDataView();
                        dataView.metadata.objects = {
                            forceSelection: {
                                currentPeriod: true,
                                latestAvailableDate: true,
                            },
                            granularity: {},
                        };

                        checkSelectedElementIsLatestAvailable(GranularityType[granularity]);
                    }
                }
            });
        });

        describe("Labels", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    granularity: {},
                    labels: {
                        displayAll: true,
                        show: true,
                        yearVisibility: true,
                        quarterVisibility: true,
                        monthVisibility: true,
                        weekVisibility: true,
                        dayVisibility: true,
                    },
                };
            });

            it("show", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);
                visualBuilder.allLabels.forEach(element => expect(document.contains(element)).toBe(true));
                

                dataView.metadata.objects.labels.show = false;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.allLabels.forEach(element => expect(document.contains(element)).toBe(false));
            });

            it("shows only selected granularity label if displayAll is set to false", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);
                // All labels should be visible
                expect(visualBuilder.allLabels.map(el => el.children).flat().length).toBeGreaterThan(1);

                dataView.metadata.objects.labels.displayAll = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                // Only one label should be visible
                expect(visualBuilder.allLabels.map(el => el.children).flat().length).toBe(1);
            });

            it("shows all labels except of year if yearVisibility is false", () => {
                dataView.metadata.objects.granularity.granularity = GranularityType.day;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                // All labels should be visible
                const oldLabels = visualBuilder.allLabels.length;
                expect(oldLabels).toBeGreaterThan(1);

                dataView.metadata.objects.labels.yearVisibility = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                // Only one label should be hidden
                expect(oldLabels - visualBuilder.allLabels.length).toBe(1);
            });

            it("shows all labels except of quarter if quarterVisibility is false", () => {
                dataView.metadata.objects.granularity.granularity = GranularityType.day;

                visualBuilder.updateFlushAllD3Transitions(dataView);
                // All labels should be visible
                const oldLabels = visualBuilder.allLabels.length;
                expect(oldLabels).toBeGreaterThan(1);

                dataView.metadata.objects.labels.quarterVisibility = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                // Only one label should be hidden
                expect(oldLabels - visualBuilder.allLabels.length).toBe(1);
            });

            it("shows all labels except of month if monthVisibility is false", () => {
                dataView.metadata.objects.granularity.granularity = GranularityType.day;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                
                // All labels should be visible
                const oldLabels = visualBuilder.allLabels.length;
                expect(oldLabels).toBeGreaterThan(1);

                dataView.metadata.objects.labels.monthVisibility = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                // Only one label should be hidden
                expect(oldLabels - visualBuilder.allLabels.length).toBe(1);
            });
            
            it("shows all labels except of week if weekVisibility is false", () => {
                dataView.metadata.objects.granularity.granularity = GranularityType.day;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                // All labels should be visible
                const oldLabels = visualBuilder.allLabels.length;
                expect(oldLabels).toBeGreaterThan(1);

                dataView.metadata.objects.labels.weekVisibility = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                // Only one label should be hidden
                expect(oldLabels - visualBuilder.allLabels.length).toBe(2);
            });

            it("shows all labels except of day if dayVisibility is false", () => {
                dataView.metadata.objects.granularity.granularity = GranularityType.day;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                // All labels should be visible
                const oldLabels = visualBuilder.allLabels.length;
                expect(oldLabels).toBeGreaterThan(1);

                dataView.metadata.objects.labels.dayVisibility = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                // Only one label should be hidden
                expect(oldLabels - visualBuilder.allLabels.length).toBe(9);
            });

            it("shows only quarter and day labels if others visibility are false", () => {
                dataView.metadata.objects.granularity.granularity = GranularityType.day;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                // All labels should be visible
                const oldLabels = visualBuilder.allLabels.length;
                expect(oldLabels).toBeGreaterThan(1);

                dataView.metadata.objects.labels.yearVisibility = false;
                dataView.metadata.objects.labels.monthVisibility = false;
                dataView.metadata.objects.labels.weekVisibility = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                // Only quarter and day labels should be visible
                expect(oldLabels - visualBuilder.allLabels.length).toBe(4);
            });

            it("font color", () => {
                const color: string = "#ABCDEF";

                dataView.metadata.objects.labels.fontColor = getSolidColorStructuralObject(color);

                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.allLabels
                    .forEach((element: Element) => {
                        assertColorsMatch(window.getComputedStyle(element).getPropertyValue("fill"), color);
                    });
            });

            it("font size", () => {
                const fontSize: number = 22;
                const expectedFontSize: string = "29.3333px";

                dataView.metadata.objects.labels.textSize = fontSize;

                visualBuilder.updateFlushAllD3Transitions(dataView);
                visualBuilder.allLabels
                    .forEach((element: Element) => {
                        expect(window.getComputedStyle(element).getPropertyValue("font-size")).toBe(expectedFontSize);
                    });
            });
        });
    });
});

describe("Timeline - Granularity - 1 Jan (Regular Calendar)", () => {
    let calendar: Calendar;
    let granularities: IGranularity[];

    beforeEach(() => {
        calendar = createCalendar();

        granularities = [
            new YearGranularity(calendar, null, null),
            new QuarterGranularity(calendar, null),
            new WeekGranularity(calendar, null, null),
            new MonthGranularity(calendar, null),
            new DayGranularity(calendar, null),
        ];
    });

    describe("splitDate", () => {
        it("should return a correct year", () => {
            const date: Date = new Date(2015, 0, 1);

            granularities.forEach((granularity: IGranularity) => {
                const actualResult = granularity.splitDate(date);

                expect(actualResult[actualResult.length - 1]).toBe(2015);
            });
        });
    });

    describe("first week", () => {
        const year2010 = 2010;

        it("should return a first day of year", () => {
            const date = calendar.getDateOfFirstWeek(year2010);
            const firstDayOfWeek = date.getDate();
            const firstDayOfYear = calendar.getFirstDayOfYear();

            expect(firstDayOfWeek).toEqual(firstDayOfYear);
        });

        it("should return zero adjustment for a year", () => {
            const yearAdjustment = calendar.getFiscalYearAjustment();
            expect(yearAdjustment).toEqual(0);
        });
    });
});

describe("Timeline - Granularity - 1 Apr (Fiscal Calendar)", () => {
    let calendar: Calendar;
    let granularities: IGranularity[];

    beforeEach(() => {
        calendar = createCalendar(3);

        granularities = [
            new YearGranularity(calendar, null, null),
            new QuarterGranularity(calendar, null),
            new WeekGranularity(calendar, null, null),
            new MonthGranularity(calendar, null),
            new DayGranularity(calendar, null),
        ];
    });

    describe("splitDate", () => {
        it("before the first fiscal year day and after 1st Jan", () => {
            const date: Date = new Date(2015, 1, 11);

            granularities.forEach((granularity: IGranularity) => {
                const actualResult = granularity.splitDate(date);

                expect(actualResult[actualResult.length - 1]).toBe(2015);
            });
        });

        it("before the first fiscal year day and before 1st Jan", () => {
            const date: Date = new Date(2014, 10, 15);

            granularities.forEach((granularity: IGranularity) => {
                const actualResult = granularity.splitDate(date);

                expect(actualResult[actualResult.length - 1]).toBe(2015);
            });
        });

        it("after the first fiscal year day and before 1st Jan", () => {
            const date: Date = new Date(2015, 3, 7);

            granularities.forEach((granularity: IGranularity) => {
                const actualResult = granularity.splitDate(date);

                expect(actualResult[actualResult.length - 1]).toBe(2016);
            });
        });

        it("after the first fiscal year day and after 1st Jan", () => {
            const date: Date = new Date(2016, 0, 7);

            granularities.forEach((granularity: IGranularity) => {
                const actualResult = granularity.splitDate(date);

                expect(actualResult[actualResult.length - 1]).toBe(2016);
            });
        });
    });

    describe("first week", () => {
        const year2010 = 2010;

        it("should return a first day of year", () => {
            const date = calendar.getDateOfFirstWeek(year2010);
            const firstDayOfWeek = date.getDate();
            const firstDayOfYear = calendar.getFirstDayOfYear();

            expect(firstDayOfWeek).toEqual(firstDayOfYear);
        });

        it("should return [1] adjustment for a year", () => {
            const yearAdjustment = calendar.getFiscalYearAjustment();
            expect(yearAdjustment).toEqual(1);
        });
    });

    describe("weeks order", () => {
        it("order ascending", () => {
            const week1: number[] = calendar.determineWeek(new Date(2016, 3, 1));
            const week2: number[] = calendar.determineWeek(new Date(2016, 3, 8));

            expect(week1[0]).toEqual(1);
            expect(week2[0]).toEqual(2);
        });
    });
});

describe("Timeline - Granularity - ISO 8601 Week numbering", () => {
    let calendar: Calendar;

    beforeEach(() => {
        calendar = new CalendarISO8061();
    });

    describe("ISO Calendar Methods", () => {
        it("first date of 1999 is January 4, 1999", () => {
            const dateOfFirstWeek = calendar.getDateOfFirstWeek(1999);
            const expectedDate = new Date(1999, 0, 4);
            expect(dateOfFirstWeek).toEqual(expectedDate);
        });

        it("first date of 2000 is January 3, 2000", () => {
            const dateOfFirstWeek = calendar.getDateOfFirstWeek(2000);
            const expectedDate = new Date(2000, 0, 3);
            expect(dateOfFirstWeek).toEqual(expectedDate);
        });

        it("first date of 2001 is January 1, 2001", () => {
            const dateOfFirstWeek = calendar.getDateOfFirstWeek(2001);
            const expectedDate = new Date(2001, 0, 1);
            expect(dateOfFirstWeek).toEqual(expectedDate);
        });

        it("first date of 2002 is December 31, 2001", () => {
            const dateOfFirstWeek = calendar.getDateOfFirstWeek(2002);
            const expectedDate = new Date(2001, 11, 31);
            expect(dateOfFirstWeek).toEqual(expectedDate);
        });

        it("first date of 2003 is December 30, 2002", () => {
            const dateOfFirstWeek = calendar.getDateOfFirstWeek(2003);
            const expectedDate = new Date(2002, 11, 30);
            expect(dateOfFirstWeek).toEqual(expectedDate);
        });

        it("first date of 2009 is December 29, 2008", () => {
            const dateOfFirstWeek = calendar.getDateOfFirstWeek(2009);
            const expectedDate = new Date(2008, 11, 29);
            expect(dateOfFirstWeek).toEqual(expectedDate);
        });

        it("first date of 2017 is January 2, 2017", () => {
            const dateOfFirstWeek = calendar.getDateOfFirstWeek(2017);
            const expectedDate = new Date(2017, 0, 2);
            expect(dateOfFirstWeek).toEqual(expectedDate);
        });

        it("first date of 2019 is December 31, 2018", () => {
            const dateOfFirstWeek = calendar.getDateOfFirstWeek(2019);
            const expectedDate = new Date(2018, 11, 31);
            expect(dateOfFirstWeek).toEqual(expectedDate);
        });

        it("first date of 2020 is December 30, 2019", () => {
            const dateOfFirstWeek = calendar.getDateOfFirstWeek(2020);
            const expectedDate = new Date(2019, 11, 30);
            expect(dateOfFirstWeek).toEqual(expectedDate);
        });

        it("first date of 2021 is January 4, 2021", () => {
            const dateOfFirstWeek = calendar.getDateOfFirstWeek(2021);
            const expectedDate = new Date(2021, 0, 4);
            expect(dateOfFirstWeek).toEqual(expectedDate);
        });

        it("week of December 25, 2017 to Decamber 31 is 52", () => {
            let week = calendar.determineWeek(new Date(2017, 11, 25))[0];
            expect(week).toEqual(52);
            week = calendar.determineWeek(new Date(2017, 11, 31))[0];
            expect(week).toEqual(52);
        });

        it("week of May 1, 2017 to May 7, 2017 is 18", () => {
            let week = calendar.determineWeek(new Date(2017, 4, 1))[0];
            expect(week).toEqual(18);
            week = calendar.determineWeek(new Date(2017, 4, 7))[0];
            expect(week).toEqual(18);
        });

        it("week of December 28, 2020 to January 3, 2021 is 53", () => {
            let week = calendar.determineWeek(new Date(2020, 11, 28))[0];
            expect(week).toEqual(53);
            week = calendar.determineWeek(new Date(2021, 0, 3))[0];
            expect(week).toEqual(53);
        });

        it("week of January 4, 2021 to January 10, 2021 is 1", () => {
            let week = calendar.determineWeek(new Date(2021, 0, 4))[0];
            expect(week).toEqual(1);
            week = calendar.determineWeek(new Date(2021, 0, 10))[0];
            expect(week).toEqual(1);
        });

        it("first week and first full week must bethe same", () => {
            expect(calendar.getDateOfFirstWeek(2007)).toEqual(calendar.getDateOfFirstFullWeek(2007));
            expect(calendar.getDateOfFirstWeek(2019)).toEqual(calendar.getDateOfFirstFullWeek(2019));
            expect(calendar.getDateOfFirstWeek(2020)).toEqual(calendar.getDateOfFirstFullWeek(2020));
        });

        it("fiscal year adjustment is 0", () => {
            expect(calendar.getFiscalYearAjustment()).toEqual(0);
        });

        it("a year must be determine without relation to week numbers", () => {
            expect(calendar.determineYear(new Date(2020, 11, 28))).toEqual(2020);
            expect(calendar.determineYear(new Date(2021, 0, 2))).toEqual(2021);
            expect(calendar.getYearPeriod(new Date(2021, 0, 2)).startDate).toEqual(new Date(2021, 0, 1));
            expect(calendar.getYearPeriod(new Date(2021, 0, 2)).endDate).toEqual(new Date(2022, 0, 1));
        });

        it("a quarter must be determine without relation to week numbers", () => {
            expect(calendar.getQuarterPeriod(new Date(2021, 0, 2)).startDate).toEqual(new Date(2021, 0, 1));
            expect(calendar.getQuarterPeriod(new Date(2021, 0, 2)).endDate).toEqual(new Date(2021, 3, 1));
            expect(calendar.getQuarterPeriod(new Date(2021, 3, 22)).startDate).toEqual(new Date(2021, 3, 1));
            expect(calendar.getQuarterPeriod(new Date(2021, 3, 22)).endDate).toEqual(new Date(2021, 6, 1));
            expect(calendar.getQuarterPeriod(new Date(2021, 7, 13)).startDate).toEqual(new Date(2021, 6, 1));
            expect(calendar.getQuarterPeriod(new Date(2021, 7, 13)).endDate).toEqual(new Date(2021, 9, 1));
            expect(calendar.getQuarterPeriod(new Date(2021, 10, 35)).startDate).toEqual(new Date(2021, 9, 1));
            expect(calendar.getQuarterPeriod(new Date(2021, 10, 35)).endDate).toEqual(new Date(2022, 0, 1));
        })

        it("a month must be determine without relation to week numbers", () => {
            expect(calendar.getMonthPeriod(new Date(2021, 0, 2)).startDate).toEqual(new Date(2021, 0, 1));
            expect(calendar.getMonthPeriod(new Date(2021, 0, 2)).endDate).toEqual(new Date(2021, 1, 1));
        })
    });
});


describe("Timeline - TimelineUtils", () => {
    describe("getIndexByPosition", () => {
        const indexes: number[] = [0, 1, 2, 3, 3.14, 4, 4.15, 5];
        const widthOfElement: number = 25;

        it("should return 0 when position is lower than 0", () => {
            const position: number = -99;

            const index: number = getIndexByPosition(position);

            expect(index).toBe(0);
        });

        it("should return max index when position is greater than widthOfElement * maxIndex", () => {
            const position: number = indexes[indexes.length - 1] * widthOfElement * 2;

            const index: number = getIndexByPosition(position);

            expect(index).toBe(indexes.length - 1);
        });

        it("should return 4 when position is between 3.14 and 4", () => {
            const position: number = 80;

            const index: number = getIndexByPosition(position);

            expect(index).toBe(4);
        });

        it("should return 1 when offset is 10 and position is between 1 and 2", () => {
            const position: number = 45;
            const offset: number = 10;

            const index: number = getIndexByPosition(position, offset);

            expect(index).toBe(1);
        });

        function getIndexByPosition(position: number, offset: number = 0): number {
            return Utils.GET_INDEX_BY_POSITION(
                indexes,
                widthOfElement,
                position,
                offset);
        }
    });

    describe("toStringDateWithoutTimezone", () => {
        it("should return null when a date is null", () => {
            checkStringWithoutTimezone(null, null);
        });

        it("should return a date in the string format without timezone", () => {
            const date: Date = new Date(2008, 1, 1, 23, 59, 59, 999);
            const expectedString: string = "2008-02-01T23:59:59.999Z";

            checkStringWithoutTimezone(date, expectedString);
        });

        function checkStringWithoutTimezone(date: Date, expectedString: string): void {
            const actualString: string = Utils.TO_STRING_DATE_WITHOUT_TIMEZONE(date);

            expect(actualString).toBe(expectedString);
        }
    });

    describe("parseDateWithoutTimezone", () => {
        it("should return null when a dateString is null", () => {
            const actualDate: Date = Utils.PARSE_DATE_WITHOUT_TIMEZONE(null);

            expect(actualDate).toBe(null);
        });

        it("should return a date without timezone", () => {
            const actualString: string = "2008-02-01T23:59:59.999Z";
            const expectedDate: Date = new Date(2008, 1, 1, 23, 59, 59, 999);

            const actualDate: Date = Utils.PARSE_DATE_WITHOUT_TIMEZONE(actualString);

            expect(actualDate.getTime()).toBe(expectedDate.getTime());
        });
    });

    describe("convertToDaysFromMilliseconds", () => {
        it("should return amount of days", () => {
            const milliseconds: number = 432000000;

            const amountOfDays: number = Utils.CONVERT_TO_DAYS_FROM_MILLISECONDS(milliseconds);

            expect(amountOfDays).toBe(5);
        });
    });

    describe("getAmountOfDaysBetweenDates", () => {
        it("should return amout of days between dates when startDate < endDate", () => {
            const amountOfDays: number = 10;

            const startDate: Date = new Date(2016, 8, 0);
            const endDate: Date = new Date(2016, 8, amountOfDays);

            checkGetAmountOfDaysBetweenDates(
                startDate,
                endDate,
                amountOfDays,
            );
        });

        it("should return amout of days between dates when startDate > endDate", () => {
            const amountOfDays: number = 10;

            const startDate: Date = new Date(2016, 8, 0);
            const endDate: Date = new Date(2016, 8, amountOfDays);

            checkGetAmountOfDaysBetweenDates(
                endDate,
                startDate,
                amountOfDays,
            );
        });

        it("should 0 when dates are the same", () => {
            const startDate: Date = new Date(2016, 8, 0);

            checkGetAmountOfDaysBetweenDates(
                startDate,
                startDate,
                0,
            );
        });

        function checkGetAmountOfDaysBetweenDates(
            startDate: Date,
            endDate: Date,
            expectedAmountOfDays: number): void {

            let amountOfDays: number;

            amountOfDays = Utils.GET_NUMBER_OF_DAYS_BETWEEN_DATES(startDate, endDate);

            expect(amountOfDays).toBe(expectedAmountOfDays);
        }
    });

    describe("countWeeks", () => {
        it("should return ID of the week", () => {
            const startDate: Date = new Date(2016, 0, 3);
            const endDate: Date = new Date(2016, 7, 12);

            const idOfTheWeek: number = Utils.GET_NUMBER_OF_WEEKS_BETWEEN_DATES(startDate, endDate);

            expect(idOfTheWeek).toBe(32);
        });
    });

    describe("getTheLatestDayOfMonth", () => {
        it("January should have 31 days", () => {
            checkTheLatestDayOfMonth(0, 31);
        });

        it("February should have 31 days", () => {
            checkTheLatestDayOfMonth(1, 29);
        });

        it("March should have 31 days", () => {
            checkTheLatestDayOfMonth(2, 31);
        });

        it("April should have 31 days", () => {
            checkTheLatestDayOfMonth(3, 30);
        });

        it("May should have 31 days", () => {
            checkTheLatestDayOfMonth(4, 31);
        });

        it("June should have 31 days", () => {
            checkTheLatestDayOfMonth(5, 30);
        });

        it("July should have 31 days", () => {
            checkTheLatestDayOfMonth(6, 31);
        });

        it("August should have 31 days", () => {
            checkTheLatestDayOfMonth(7, 31);
        });

        it("September should have 31 days", () => {
            checkTheLatestDayOfMonth(8, 30);
        });

        it("October should have 31 days", () => {
            checkTheLatestDayOfMonth(9, 31);
        });

        it("November should have 31 days", () => {
            checkTheLatestDayOfMonth(10, 30);
        });

        it("December should have 31 days", () => {
            checkTheLatestDayOfMonth(11, 31);
        });

        function checkTheLatestDayOfMonth(monthId: number, expectedAmountOfDays: number): void {
            const actualAmountOfDays: number = Utils.GET_THE_LATEST_DAY_OF_MONTH(monthId);

            expect(actualAmountOfDays).toBe(expectedAmountOfDays);
        }
    });

    describe("areBoundsOfSelectionAndAvailableDatesTheSame", () => {
        let datePeriod: ITimelineDatePeriod[];
        let dates: Date[];

        beforeEach(() => {
            dates = [
                new Date(2008, 1, 1),
                new Date(2008, 1, 2),
                new Date(2008, 1, 3),
                new Date(2008, 1, 4),
            ];

            datePeriod = createDatePeriod(dates);
        });

        it("should return true when dates are the same", () => {
            checkDates(datePeriod, 0, 3, true);
        });

        it("should return false when dates aren't the same", () => {
            checkDates(datePeriod, 0, 0, false);
        });

        function checkDates(
            timelineDatePeriod: ITimelineDatePeriod[],
            selectionStartIndex: number,
            selectionEndIndex: number,
            expectedValue: boolean,
        ): void {

            const timelineData: ITimelineData = createTimelineData(
                timelineDatePeriod,
                selectionStartIndex,
                selectionEndIndex,
            );

            const actualValue: boolean = Utils.ARE_BOUNDS_OF_SELECTION_AND_AVAILABLE_DATES_THE_SAME(timelineData);

            expect(actualValue).toBe(expectedValue);
        }
    });

    describe("getDatePeriod", () => {
        it("should return { undefined, undefined } when values is undefined", () => {
            checkBoundsOfDates(undefined, undefined, undefined);
        });

        it("should return { undefined, undefined } when values is an empty array", () => {
            checkBoundsOfDates([], undefined, undefined);
        });

        it("should return the correct values when values are dates", () => {
            const minDate: Date = new Date(1969, 6, 20);
            const maxDate: Date = new Date(2016, 7, 17);

            const dates: Date[] = [
                maxDate,
                new Date(2015, 1, 1),
                new Date(2014, 8, 8),
                minDate,
                new Date(2010, 8, 8),
                new Date(2005, 8, 8),
            ];

            checkBoundsOfDates(dates, minDate, maxDate);
        });

        function checkBoundsOfDates(values: any[], startDate: any, endDate: any): void {
            const actualDatePeriod: ITimelineDatePeriodBase = Utils.GET_DATE_PERIOD(values);

            expect(getTime(actualDatePeriod.startDate)).toBe(getTime(startDate));
            expect(getTime(actualDatePeriod.endDate)).toBe(getTime(endDate));
        }
    });

    describe("getEndOfThePreviousDate", () => {
        it("should return the previous date", () => {
            const date: Date = new Date(2016, 9, 9);
            const expectedDay: number = 8;

            expect(Utils.GET_END_OF_THE_PREVIOUS_DATE(date).getDate()).toBe(expectedDay);
        });
    });

    describe("parseDate", () => {
        it("should return undefined", () => {
            checkParsedValue(undefined, undefined);
        });

        it("should return undefined when the value isn't a date", () => {
            checkParsedValue("Power BI", undefined);
        });

        it("should return a date when the value is date", () => {
            const date: Date = new Date(2016, 9, 19);

            checkParsedValue(date, date);
        });

        it("should return return a date when valueType is number", () => {
            const year: number = 2016;
            const expectedDate = new Date(year, 0);

            checkParsedValue(year, expectedDate);
        });

        it("should return return a date when valueType is string", () => {
            const currentDate: Date = new Date(2016, 10, 10);

            checkParsedValue(currentDate.toJSON(), currentDate);
        });

        function checkParsedValue(value: any, expectedValue?: Date): void {
            const actualValue: Date = Utils.PARSE_DATE(value);

            expect(getTime(actualValue)).toBe(getTime(expectedValue));
        }
    });

    describe("Capabilities tests", () => {
        it("all items having displayName should have displayNameKey property", () => {
            const capabilitiesJsonFile = require("../capabilities.json");

            const objectsChecker = (obj) => {
                for (const property of Object.keys(obj)) {
                    const value: any = obj[property];

                    if (value.displayName) {
                        expect(value.displayNameKey).toBeDefined();
                    }

                    if (typeof value === "object") {
                        objectsChecker(value);
                    }
                }
            };

            objectsChecker(capabilitiesJsonFile);
        });
    });

    function getTime(date: Date): number | Date {
        return date && date.getTime
            ? date.getTime()
            : date;
    }
});

describe("Timeline - TimelineSettings", () => {
    describe("enumerationValidator", () => {
        it("should return the original value when the value is correct", () => {
            checkEnumeration(42, 0, 42);
        });

        it("should return the default value when the value is string", () => {
            checkEnumeration("Power BI", 42, 42);
        });

        it("should return the default value when the value is NaN", () => {
            checkEnumeration(NaN, 42, 42);
        });

        function checkEnumeration(value: any, defaultValue: any, expectedValue: any): void {
            const actualValue: number = value === null || isNaN(value)
                ? defaultValue
                : value;

            expect(actualValue).toBe(expectedValue);
        }
    });
});

describe("Accessibility", () => {
    let visualBuilder: VisualBuilder;
    let defaultDataViewBuilder: VisualData;
    let dataView: powerbiVisualsApi.DataView;

    beforeEach(() => {
        visualBuilder = new VisualBuilder(1000, 500);
        defaultDataViewBuilder = new VisualData();

        dataView = defaultDataViewBuilder.getDataView();
    });

    describe("High contrast mode", () => {
        const backgroundColor: string = "#000000";
        const foregroundColor: string = "#ffff00";

        beforeEach(() => {
            visualBuilder.visualHost.colorPalette.isHighContrast = true;

            visualBuilder.visualHost.colorPalette.background = { value: backgroundColor };
            visualBuilder.visualHost.colorPalette.foreground = { value: foregroundColor };
        });

        it("should use proper stroke color from color palette", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const layers = visualBuilder.cellRects;

                expect(isColorAppliedToElements(layers, foregroundColor, "stroke"));

                done();
            });
        });

        function isColorAppliedToElements(
            elements: HTMLElement[],
            color?: string,
            colorStyleName: string = "fill",
        ): boolean {
            return elements.some((element: HTMLElement) => {
                const currentColor: string = window.getComputedStyle(element).getPropertyValue(colorStyleName);

                if (!currentColor || !color) {
                    return currentColor === color;
                }

                return areColorsEqual(currentColor, color);
            });
        }
    });
});

function createCalendar(
    month: number = 0,
    day: number = 1,
    week: number = 1,
    dayOfWeekSelectionOn: boolean = false,
): Calendar {

    const calendarSettings: CalendarSettings = {
        day,
        month,
    };

    const weekDaySettings: WeekDaySettings = {
        day: week,
        daySelection: dayOfWeekSelectionOn,
    };

    return new Calendar(calendarSettings, weekDaySettings);
}

function createDatePeriod(dates: Date[]): ITimelineDatePeriod[] {
    return dates.map((date: Date, index: number) => {
        return {
            endDate: date,
            fraction: 0,
            identifierArray: [],
            index,
            startDate: date,
            week: [],
            year: 0,
        };
    });
}

function createTimelineData(
    datePeriod: ITimelineDatePeriod[],
    selectionStartIndex: number,
    selectionEndIndex: number): ITimelineData {

    const timelineGranularityMock: GranularityMock = new GranularityMock(datePeriod);

    return {
        currentGranularity: timelineGranularityMock,
        selectionEndIndex,
        selectionStartIndex,
    };
}
