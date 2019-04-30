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
import "jasmine-jquery";

import { select as d3Select } from "d3-selection";
import * as $ from "jquery";
import powerbi from "powerbi-visuals-api";
import {
    assertColorsMatch, clickElement, d3Click, renderTimeout,
} from "powerbi-visuals-utils-testutils";

import { Calendar } from "../src/calendar";
import { ITimelineCursorOverElement, ITimelineData } from "../src/dataInterfaces";
import { ITimelineDatePeriod, ITimelineDatePeriodBase } from "../src/datePeriod/datePeriod";
import { TimelineDatePeriodBase } from "../src/datePeriod/datePeriodBase";
import { DayGranularity } from "../src/granularity/dayGranularity";
import { IGranularity } from "../src/granularity/granularity";
import { TimelineGranularityBase } from "../src/granularity/granularityBase";
import { GranularityType } from "../src/granularity/granularityType";
import { MonthGranularity } from "../src/granularity/monthGranularity";
import { QuarterGranularity } from "../src/granularity/quarterGranularity";
import { WeekGranularity } from "../src/granularity/weekGranularity";
import { YearGranularity } from "../src/granularity/yearGranularity";
import { CalendarSettings } from "../src/settings/calendarSettings";
import { WeekDaySettings } from "../src/settings/weekDaySettings";
import { Utils } from "../src/utils";
import { Timeline } from "../src/visual";
import { TimelineGranularityMock } from "./granularityMock";
import { areColorsEqual, getSolidColorStructuralObject } from "./helpers";
import { TimelineBuilder } from "./visualBuilder";
import { TimelineData } from "./visualData";

describe("Timeline", () => {
    let visualBuilder: TimelineBuilder;
    let defaultDataViewBuilder: TimelineData;
    let dataView: powerbi.DataView;

    beforeEach(() => {
        visualBuilder = new TimelineBuilder(1000, 500);
        defaultDataViewBuilder = new TimelineData();

        dataView = defaultDataViewBuilder.getDataView();
    });

    describe("DOM tests", () => {
        it("svg element created", () => expect(visualBuilder.mainElement[0]).toBeInDOM());

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
                    .children("g.mainArea")
                    .children(".cellsArea")
                    .children(".cellRect")
                    .length;

                const countOfTextItems: number = visualBuilder
                    .mainElement
                    .children("g.mainArea")
                    .children("g")
                    .eq(4)
                    .children(".label")
                    .children()
                    .length;

                expect(countOfDays).toBe(dataView.categorical.categories[0].values.length);
                expect(countOfTextItems).toBe(dataView.categorical.categories[0].values.length);

                const cellRects: JQuery = visualBuilder.mainElement.find(".cellRect");

                d3Click(cellRects.last(), 0, 0);

                const unselectedCellRect: JQuery = visualBuilder
                    .mainElement
                    .find(".cellRect")
                    .first();

                assertColorsMatch(unselectedCellRect.attr("fill"), "transparent");

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
                        .children("g.mainArea")
                        .children(".cellsArea")
                        .children(".cellRect")
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
                const textRangeText: string = $(".selectionRangeContainer")
                    .first()
                    .text();

                expect(textRangeText).toContain("2016");

                done();
            });
        });

        it("range text cut off with small screen size", (done) => {
            const builder: TimelineBuilder = new TimelineBuilder(300, 500);

            dataView.metadata.objects = {
                granularity: {
                    granularity: GranularityType.month,
                },
            };

            builder.update(dataView);

            renderTimeout(() => {
                builder.updateRenderTimeout(dataView, () => {
                    const indexOfDots: number = builder.rangeHeaderText
                        .text()
                        .indexOf("...");

                    expect(indexOfDots !== -1).toBe(true);

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
            let periodSlicerSelectionRectElements: JQuery;

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
                    periodSlicerSelectionRectElements = visualBuilder
                        .element
                        .find(".periodSlicerSelectionRect");

                    done();
                });
            });

            it("click - event", () => {
                d3Click($(periodSlicerSelectionRectElements[0]), 0, 0);
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
                const $periodSlicerSelectionRectElements = visualBuilder.element.find(".periodSlicerSelectionRect");

                d3Click($($periodSlicerSelectionRectElements[0]), 0, 0);

                expect($periodSlicerSelectionRectElements.length).toEqual(4);
                expectToCallSelectPeriod(GranularityType.quarter);
            });

            it("click - event - with disabled quarter", () => {
                dataView.metadata.objects = {
                    granularity: {
                        granularityQuarterVisibility: false,
                    },
                };

                visualBuilder.update(dataView);
                const $periodSlicerSelectionRectElements = visualBuilder.element.find(".periodSlicerSelectionRect");

                d3Click($($periodSlicerSelectionRectElements[1]), 0, 0);

                expect($periodSlicerSelectionRectElements.length).toEqual(4);
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

                const $periodSlicerSelectionRectElements = visualBuilder.element.find(".periodSlicerSelectionRect");

                d3Click($($periodSlicerSelectionRectElements[1]), 0, 0);

                expect($periodSlicerSelectionRectElements.length).toEqual(2);
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

                const $periodSlicerSelectionRectElements = visualBuilder.element.find(".periodSlicerSelectionRect");

                expect($periodSlicerSelectionRectElements.length).toEqual(0);
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
        it("selection should be recovered from the dataView after starting", (done) => {
            const startDate: Date = defaultDataViewBuilder.valuesCategory[0];
            const endDate: Date = defaultDataViewBuilder.valuesCategory[1];
            const datePeriod: TimelineDatePeriodBase = TimelineDatePeriodBase.create(startDate, endDate);

            dataView.metadata.objects = {
                granularity: {
                    granularity: GranularityType.day,
                },
            };

            TimelineBuilder.setDatePeriod(dataView, datePeriod);

            // simulate filter restoring
            visualBuilder.setFilter(startDate, endDate);

            visualBuilder.updateFlushAllD3Transitions(dataView);

            const cellRects: JQuery = visualBuilder.cellRects;

            for (let i: number = 0; i < cellRects.length; i++) {
                const fillColor: string = d3Select(cellRects[i]).attr("fill");

                assertColorsMatch(fillColor, "transparent", i === 0);
            }

            done();
        });

        function checkSelectionState(
            dataViewObject: powerbi.DataView,
            builder: TimelineBuilder,
            done: () => void,
            modificator?: (dataView: powerbi.DataView) => void,
        ): void {

            dataViewObject.metadata.objects = {
                granularity: {
                    granularity: GranularityType.month,
                },
            };

            builder.update(dataViewObject);

            const countOfMonth: number = builder
                .mainElement
                .find(".cellRect")
                .length;

            (dataViewObject.metadata.objects as any).granularity.granularity = GranularityType.day;

            builder.update(dataViewObject);

            builder.selectTheLatestCell();

            const timelineData: ITimelineData = builder.visualObject.timelineData;

            const startDate: Date = Utils.getStartSelectionDate(timelineData);
            const endDate: Date = Utils.getEndSelectionDate(timelineData);

            (dataViewObject.metadata.objects as any).general = {
                datePeriod: TimelineDatePeriodBase.create(startDate, endDate),
            };

            builder.updateflushAllD3TransitionsRenderTimeout(dataViewObject, () => {
                (dataViewObject.metadata.objects as any).granularity.granularity = GranularityType.month;

                if (modificator) {
                    modificator(dataViewObject);
                }

                builder.update(dataViewObject);

                const countMonthOfSelectedDays: number = builder
                    .mainElement
                    .find(".cellRect")
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

            Timeline.setValidCalendarSettings(calendarSettings);

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
            dataViewObject: powerbi.DataView,
            expectedValue: boolean,
        ): void {
            const options: powerbi.extensibility.visual.VisualUpdateOptions = {
                dataViews: [dataViewObject],
            } as unknown as powerbi.extensibility.visual.VisualUpdateOptions;

            const areVisualUpdateOptionsValid: boolean = Timeline.areVisualUpdateOptionsValid(options);

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
                .toArray()
                .forEach((element: Element) => {
                    const fill: string = $(element).attr("fill");
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
            const lastElement = visualBuilder.cellRects.last();

            visualBuilder.cellRects
                .toArray()
                .forEach((element: Element) => {
                    const fill: string = $(element).attr("fill");
                    if (fill !== "rgba(0, 0, 0, 0)" && fill !== "transparent") {
                        selectedElements.push(element);
                    }
                });

            expect(selectedElements.length).toEqual(1);
            expect(selectedElements[0]).toEqual(lastElement[0]);
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

                expect(visualBuilder.rangeHeaderText.text()).not.toBe("");

                (dataView.metadata.objects as any).rangeHeader.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.rangeHeaderText.text()).toBe("");
            });

            it("font color", () => {
                const color: string = "#ABCDEF";

                (dataView.metadata.objects as any).rangeHeader.fontColor = getSolidColorStructuralObject(color);

                visualBuilder.updateFlushAllD3Transitions(dataView);

                assertColorsMatch(visualBuilder.rangeHeaderText.css("fill"), color);
            });

            it("font size", () => {
                const fontSize: number = 22;
                const expectedFontSize: string = "29.3333px";

                (dataView.metadata.objects as any).rangeHeader.textSize = fontSize;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.rangeHeaderText.css("font-size")).toBe(expectedFontSize);
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
                    .toArray()
                    .forEach((element: Element) => {
                        assertColorsMatch($(element).css("fill"), color);
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

                const lastCell: JQuery = visualBuilder.cellRects.last();

                clickElement(lastCell);

                visualBuilder.cellRects
                    .toArray()
                    .forEach((element: Element) => {
                        const $element = $(element);

                        assertColorsMatch(
                            $element.css("fill"),
                            color,
                            $element.is(lastCell));
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

                visualBuilder.timelineSlicer
                    .children("rect.timelineVertLine, text.periodSlicerGranularities, text.periodSlicerSelection")
                    .toArray()
                    .forEach((element: Element) => {
                        assertColorsMatch($(element).css("fill"), color);
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

                const strokeColor: string = visualBuilder.timelineSlicer
                    .find("rect.periodSlicerRect")
                    .css("stroke");

                assertColorsMatch(strokeColor, color);
            });
        });

        describe("First day of week option", () => {
            const daySelection: boolean = true;
            const startDateRange: Date = new Date(2015, 0, 1);
            const weekFromStartRange: Date = new Date(2015, 0, 7);

            const granularity: string = "week";

            beforeEach(() => {
                visualBuilder = new TimelineBuilder(1000, 500);
                defaultDataViewBuilder = new TimelineData();
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

                expect(dates.startDate as Date).toEqual(new Date(2014, 0, 1));
                expect(dates.endDate as Date).toEqual(new Date(2014, 0, 8));

                dates = visualCalendar.getWeekPeriod(new Date(2015, 0, 1));
                expect(dates.startDate as Date).toEqual(new Date(2015, 0, 1));

                expect(dates.endDate as Date).toEqual(new Date(2015, 0, 8));

                dates = visualCalendar.getWeekPeriod(new Date(2016, 0, 1));

                expect(dates.startDate as Date).toEqual(new Date(2016, 0, 1));
                expect(dates.endDate as Date).toEqual(new Date(2016, 0, 8));

                dates = visualCalendar.getWeekPeriod(new Date(2017, 0, 1));

                expect(dates.startDate as Date).toEqual(new Date(2017, 0, 1));
                expect(dates.endDate as Date).toEqual(new Date(2017, 0, 8));

                dates = visualCalendar.getWeekPeriod(new Date(2018, 0, 1));

                expect(dates.startDate as Date).toEqual(new Date(2018, 0, 1));
                expect(dates.endDate as Date).toEqual(new Date(2018, 0, 8));
            });

            it("check calendar with day of week option off", () => {
                visualBuilder = new TimelineBuilder(1000, 500);
                defaultDataViewBuilder = new TimelineData();
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
                expect(periods[0].startDate as Date).toEqual(new Date(2015, 0, 1));
                expect(periods[53].startDate as Date).toEqual(new Date(2016, 0, 1));
            });
        });

        describe("Force selection", () => {
            for (const granularity in GranularityType) {
                if (isNaN(+granularity)) {
                    it("disabled both -- possible to make user selection", () => {
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

                        const lastCell: JQuery = visualBuilder.cellRects.last();

                        clickElement(lastCell);

                        assertColorsMatch(
                            lastCell.css("fill"),
                            colorSel);
                    });

                    it("user selection is allowed if forceSelection.currentPeriod is enabled", () => {
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

                        const lastCell: JQuery = visualBuilder.cellRects.last();

                        clickElement(lastCell);

                        assertColorsMatch(
                            lastCell.css("fill"),
                            selectedColor,
                        );
                    });

                    it("user selection is allowed if forceSelection.latestAvailableDate is enabled", () => {
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

                        const firstCell: JQuery = visualBuilder.cellRects.first();

                        clickElement(firstCell);

                        assertColorsMatch(
                            firstCell.css("fill"),
                            selectedColor,
                        );
                    });

                    it(`current period for 'week' granularity`, () => {
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
                    });

                    it(`current period out of data set for '${granularity}' granularity`, () => {
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
                    });

                    it(`latest available period for '${granularity}' granularity`, () => {
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
                    });

                    it(`latest available period and current period for '${granularity}' granularity both for out of date range`, () => {
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
                    });
                }
            }
        });

        describe("Labels", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    labels: {
                        displayAll: true,
                        show: true,
                    },
                };
            });

            it("show", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);
                expect(visualBuilder.allLabels).toBeInDOM();

                (dataView.metadata.objects as any).labels.show = false;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.allLabels).not.toBeInDOM();
            });

            it("shows only selected granularity label if displayAll is set to false", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);
                // All labels should be visible
                expect(visualBuilder.allLabels.children().length).toBeGreaterThan(1);
                (dataView.metadata.objects as any).labels.displayAll = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                // Only one label should be visible
                expect(visualBuilder.allLabels.children().length).toBe(1);
            });

            it("font color", () => {
                const color: string = "#ABCDEF";

                (dataView.metadata.objects as any).labels.fontColor = getSolidColorStructuralObject(color);

                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.allLabels
                    .toArray()
                    .forEach((element: Element) => {
                        assertColorsMatch($(element).css("fill"), color);
                    });
            });

            it("font size", () => {
                const fontSize: number = 22;
                const expectedFontSize: string = "29.3333px";

                (dataView.metadata.objects as any).labels.textSize = fontSize;

                visualBuilder.updateFlushAllD3Transitions(dataView);
                visualBuilder.allLabels
                    .toArray()
                    .forEach((element: Element) => {
                        expect($(element).css("font-size")).toBe(expectedFontSize);
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
            const yearAdjustment = TimelineGranularityBase.getFiscalYearAdjustment(calendar);
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
            const yearAdjustment = TimelineGranularityBase.getFiscalYearAdjustment(calendar);
            expect(yearAdjustment).toEqual(1);
        });
    });

    describe("weeks order", () => {
        it("order ascending", () => {
            const week1: number[] = granularities[0].determineWeek(new Date(2016, 3, 1));
            const week2: number[] = granularities[0].determineWeek(new Date(2016, 3, 8));

            expect(week1[0]).toEqual(1);
            expect(week2[0]).toEqual(2);
        });
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
            return Utils.getIndexByPosition(
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
            const actualString: string = Utils.toStringDateWithoutTimezone(date);

            expect(actualString).toBe(expectedString);
        }
    });

    describe("parseDateWithoutTimezone", () => {
        it("should return null when a dateString is null", () => {
            const actualDate: Date = Utils.parseDateWithoutTimezone(null);

            expect(actualDate).toBe(null);
        });

        it("should return a date without timezone", () => {
            const actualString: string = "2008-02-01T23:59:59.999Z";
            const expectedDate: Date = new Date(2008, 1, 1, 23, 59, 59, 999);

            const actualDate: Date = Utils.parseDateWithoutTimezone(actualString);

            expect(actualDate.getTime()).toBe(expectedDate.getTime());
        });
    });

    describe("convertToDaysFromMilliseconds", () => {
        it("should return amount of days", () => {
            const milliseconds: number = 432000000;

            const amountOfDays: number = Utils.convertToDaysFromMilliseconds(milliseconds);

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

            amountOfDays = Utils.getAmountOfDaysBetweenDates(startDate, endDate);

            expect(amountOfDays).toBe(expectedAmountOfDays);
        }
    });

    describe("countWeeks", () => {
        it("should return ID of the week", () => {
            const startDate: Date = new Date(2016, 0, 3);
            const endDate: Date = new Date(2016, 7, 12);

            const idOfTheWeek: number = Utils.getAmountOfWeeksBetweenDates(startDate, endDate);

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
            const actualAmountOfDays: number = Utils.getTheLatestDayOfMonth(monthId);

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

            const actualValue: boolean = Utils.areBoundsOfSelectionAndAvailableDatesTheSame(timelineData);

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
            const actualDatePeriod: ITimelineDatePeriodBase = Utils.getDatePeriod(values);

            expect(getTime(actualDatePeriod.startDate)).toBe(getTime(startDate));
            expect(getTime(actualDatePeriod.endDate)).toBe(getTime(endDate));
        }
    });

    describe("getEndOfThePreviousDate", () => {
        it("should return the previous date", () => {
            const date: Date = new Date(2016, 9, 9);
            const expectedDay: number = 8;

            expect(Utils.getEndOfThePreviousDate(date).getDate()).toBe(expectedDay);
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
            const actualValue: Date = Utils.parseDate(value);

            expect(getTime(actualValue)).toBe(getTime(expectedValue));
        }
    });

    describe("Capabilities tests", () => {
        it("all items having displayName should have displayNameKey property", () => {
            const capabilitiesJsonFile = require("../capabilities.json");

            const objectsChecker = (obj) => {
                for (const property in obj) {
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
    let visualBuilder: TimelineBuilder;
    let defaultDataViewBuilder: TimelineData;
    let dataView: powerbi.DataView;

    beforeEach(() => {
        visualBuilder = new TimelineBuilder(1000, 500);
        defaultDataViewBuilder = new TimelineData();

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
                const layers = visualBuilder.cellRects.toArray().map($);

                expect(isColorAppliedToElements(layers, foregroundColor, "stroke"));

                done();
            });
        });

        function isColorAppliedToElements(
            elements: Array<JQuery<any>>,
            color?: string,
            colorStyleName: string = "fill",
        ): boolean {
            return elements.some((element: JQuery) => {
                const currentColor: string = element.css(colorStyleName);

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

    const timelineGranularityMock: TimelineGranularityMock = new TimelineGranularityMock(datePeriod);

    return {
        currentGranularity: timelineGranularityMock,
        selectionEndIndex,
        selectionStartIndex,
    };
}
