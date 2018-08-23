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

/// <reference path="_references.ts"/>

module powerbi.extensibility.visual.test {
    // powerbi.extensibility.visual.test
    import TimelineData = powerbi.extensibility.visual.test.TimelineData;
    import TimelineBuilder = powerbi.extensibility.visual.test.TimelineBuilder;
    import TimelineGranularityMock = powerbi.extensibility.visual.test.mocks.TimelineGranularityMock;
    import getSolidColorStructuralObject = powerbi.extensibility.visual.test.helpers.getSolidColorStructuralObject;

    // Timeline1447991079100
    import SandboxedVisualNameSpace = powerbi.extensibility.visual.Timeline1447991079100;
    import Calendar = SandboxedVisualNameSpace.Calendar;
    import Utils = SandboxedVisualNameSpace.utils.Utils;
    import VisualClass = SandboxedVisualNameSpace.Timeline;
    import ITimelineData = SandboxedVisualNameSpace.TimelineData;
    import Granularity = SandboxedVisualNameSpace.granularity.Granularity;
    import VisualSettings = SandboxedVisualNameSpace.settings.VisualSettings;
    import WeekDaySettings = SandboxedVisualNameSpace.settings.WeekDaySettings;
    import DayGranularity = SandboxedVisualNameSpace.granularity.DayGranularity;
    import CalendarSettings = SandboxedVisualNameSpace.settings.CalendarSettings;
    import WeekGranularity = SandboxedVisualNameSpace.granularity.WeekGranularity;
    import GranularityType = SandboxedVisualNameSpace.granularity.GranularityType;
    import YearGranularity = SandboxedVisualNameSpace.granularity.YearGranularity;
    import MonthGranularity = SandboxedVisualNameSpace.granularity.MonthGranularity;
    import TimelineDatePeriod = SandboxedVisualNameSpace.datePeriod.TimelineDatePeriod;
    import ITimelineDatePeriod = SandboxedVisualNameSpace.datePeriod.ITimelineDatePeriod;
    import QuarterGranularity = SandboxedVisualNameSpace.granularity.QuarterGranularity;
    import TimelineCursorOverElement = SandboxedVisualNameSpace.TimelineCursorOverElement;
    import TimelineDatePeriodBase = SandboxedVisualNameSpace.datePeriod.TimelineDatePeriodBase;

    // powerbi.extensibility.utils.test
    import clickElement = powerbi.extensibility.utils.test.helpers.clickElement;
    import renderTimeout = powerbi.extensibility.utils.test.helpers.renderTimeout;
    import DefaultWaitForRender = powerbi.extensibility.utils.test.DefaultWaitForRender;
    import assertColorsMatch = powerbi.extensibility.utils.test.helpers.color.assertColorsMatch;

    // powerbi.extensibility.visual.test.helpers
    import areColorsEqual = powerbi.extensibility.visual.test.helpers.areColorsEqual;

    function createFakeFilter(startDate: Date, endDate: Date): any {
        let filterSample: string =
            `{"fromValue":{"items":{"m":{"entity":"MSFT"}}},` +
            `"whereItems":[{"condition":{"_kind":8,"left":{"_kind":13,"comparison":2,` +
            `"left":{"_kind":2,"source":{"_kind":0,"entity":"MSFT","variable":"m"},"ref":"Date"},` +
            `"right":{"_kind":18,"unit":5,"arg":{"_kind":17,"type":{"underlyingType":519,"category":null,` +
            `"temporalType":{"underlyingType":519}},` +
            `"value":"${startDate.toString()}","typeEncodedValue":"datetime'${startDate.toString()}'"}}},` +
            `"right":{"_kind":13,"comparison":3,` +
            `"left":{"_kind":2,"source":{"_kind":0,"entity":"MSFT","variable":"m"},"ref":"Date"},` +
            `"right":{"_kind":18,"unit":5,"arg":{"_kind":17,"type":{"underlyingType":519,"category":null,` +
            `"temporalType":{"underlyingType":519}},` +
            `"value":"${endDate.toString()}","typeEncodedValue":"datetime'${endDate.toString()}'"}}}}}]}`;

        // simulate filter string
        let fakeFilter = JSON.parse(filterSample);
        fakeFilter.whereItems[0].condition.left.right.arg.value = startDate;
        fakeFilter.whereItems[0].condition.right.right.arg.value = startDate;

        return fakeFilter;
    }

    describe("Timeline", () => {
        let visualBuilder: TimelineBuilder,
            defaultDataViewBuilder: TimelineData,
            dataView: DataView;

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
                        granularity: GranularityType.day
                    }
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

                    let cellRects: JQuery = visualBuilder.mainElement.find(".cellRect");

                    cellRects
                        .last()
                        .d3Click(0, 0);

                    let unselectedCellRect: JQuery = visualBuilder
                        .mainElement
                        .find(".cellRect")
                        .first();

                    assertColorsMatch(unselectedCellRect.attr("fill"), "transparent");

                    let cellHeightStr: string = cellRects[0].attributes.getNamedItem("height").value,
                        cellHeight: number = parseInt(cellHeightStr.replace("px", ""), 10);

                    expect(cellHeight).toBeLessThan(60.1);
                    expect(cellHeight).toBeGreaterThan(29.9);

                    done();
                });
            });

            it("apply blank row data", (done) => {
                dataView.metadata.objects = {
                    granularity: {
                        granularity: GranularityType.day
                    }
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
                        granularity: GranularityType.year
                    }
                };

                visualBuilder.update(dataView);

                setTimeout(() => {
                    // TimeRangeText check visibility when visual is small
                    const textRangeText: string = $(".selectionRangeContainer")
                        .first()
                        .text();

                    expect(textRangeText).toContain("2016");

                    done();
                }, DefaultWaitForRender);
            });

            it("range text cut off with small screen size", (done) => {
                const visualBuilder: TimelineBuilder = new TimelineBuilder(300, 500);

                dataView.metadata.objects = {
                    granularity: {
                        granularity: GranularityType.month
                    }
                };

                visualBuilder.update(dataView);

                renderTimeout(() => {
                    visualBuilder.updateRenderTimeout(dataView, () => {
                        const indexOfDots: number = visualBuilder.rangeHeaderText
                            .text()
                            .indexOf("...");

                        expect(indexOfDots !== -1).toBe(true);

                        done();
                    });
                });
            });

            describe("clearCatcher", () => {
                let clearCatcherElement: JQuery;

                beforeEach((done) => {
                    dataView.metadata.objects = {
                        granularity: {
                            granularity: GranularityType.day
                        }
                    };

                    visualBuilder.update(dataView);

                    spyOn(visualBuilder.visualObject, "clear");

                    renderTimeout(() => {
                        clearCatcherElement = visualBuilder.element.find(".clearCatcher");

                        done();
                    });
                });

                it("click - event", () => {
                    clearCatcherElement.d3Click(0, 0);

                    expectToCallMethodClear();
                });

                it("touchstart - event", () => {
                    clearCatcherElement.d3TouchStart();

                    expectToCallMethodClear();
                });

                function expectToCallMethodClear(): void {
                    expect(visualBuilder.visualObject["clear"]).toHaveBeenCalled();
                }
            });

            describe("granularity", () => {
                let periodSlicerSelectionRectElements: JQuery;

                beforeEach((done) => {
                    dataView.metadata.objects = {
                        granularity: {
                            granularity: GranularityType.month
                        }
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

                it("mousedown - event", () => {
                    $(periodSlicerSelectionRectElements[0]).d3MouseDown(0, 0);
                    expectToCallSelectPeriod(GranularityType.year);
                });

                it("settings - event", () => {
                    dataView.metadata.objects = {
                        granularity: {
                            granularity: GranularityType.day
                        }
                    };

                    visualBuilder.update(dataView);
                    expectToCallChangeGranularity(GranularityType.day);
                });

                it("mousedown - event - with disabled year", () => {
                    dataView.metadata.objects = {
                        granularity: {
                            granularityYearVisibility: false
                        }
                    };

                    visualBuilder.update(dataView);
                    let periodSlicerSelectionRectElements = visualBuilder.element.find(".periodSlicerSelectionRect");
                    $(periodSlicerSelectionRectElements[0]).d3MouseDown(0, 0);
                    expect(periodSlicerSelectionRectElements.length).toEqual(4);
                    expectToCallSelectPeriod(GranularityType.quarter);
                });

                it("mousedown - event - with disabled quarter", () => {
                    dataView.metadata.objects = {
                        granularity: {
                            granularityQuarterVisibility: false
                        }
                    };

                    visualBuilder.update(dataView);
                    let periodSlicerSelectionRectElements = visualBuilder.element.find(".periodSlicerSelectionRect");
                    $(periodSlicerSelectionRectElements[1]).d3MouseDown(0, 0);
                    expect(periodSlicerSelectionRectElements.length).toEqual(4);
                    expectToCallSelectPeriod(GranularityType.month);
                });

                it("mousedown - event - with disabled year, quarter and month", () => {
                    dataView.metadata.objects = {
                        granularity: {
                            granularityYearVisibility: false,
                            granularityQuarterVisibility: false,
                            granularityMonthVisibility: false
                        }
                    };

                    visualBuilder.update(dataView);
                    let periodSlicerSelectionRectElements = visualBuilder.element.find(".periodSlicerSelectionRect");
                    $(periodSlicerSelectionRectElements[1]).d3MouseDown(0, 0);
                    expect(periodSlicerSelectionRectElements.length).toEqual(2);
                    expectToCallSelectPeriod(GranularityType.day);
                });

                it("mousedown - impossible - all granularities are disabled", () => {
                    dataView.metadata.objects = {
                        granularity: {
                            granularityYearVisibility: false,
                            granularityQuarterVisibility: false,
                            granularityMonthVisibility: false,
                            granularityWeekVisibility: false,
                            granularityDayVisibility: false
                        }
                    };

                    visualBuilder.update(dataView);
                    let periodSlicerSelectionRectElements = visualBuilder.element.find(".periodSlicerSelectionRect");
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
            it("selection should be recovered from the dataView after starting", (done) => {
                const startDate: Date = defaultDataViewBuilder.valuesCategory[0],
                    endDate: Date = defaultDataViewBuilder.valuesCategory[1],
                    datePeriod: TimelineDatePeriodBase = TimelineDatePeriodBase.create(startDate, endDate);

                dataView.metadata.objects = {
                    granularity: {
                        granularity: GranularityType.day
                    }
                };

                TimelineBuilder.setDatePeriod(dataView, datePeriod);
                // simulate filter restoring
                dataView.metadata.objects.general.filter = createFakeFilter(startDate, endDate);

                visualBuilder.updateFlushAllD3Transitions(dataView);

                let cellRects: JQuery = visualBuilder.cellRects;

                for (let i: number = 0; i < cellRects.length; i++) {
                    let fillColor: string = $(cellRects[i]).attr("fill");

                    assertColorsMatch(fillColor, "transparent", i === 0);
                }

                done();
            });

            function checkSelectionState(
                dataView: DataView,
                visualBuilder: TimelineBuilder,
                done: () => void,
                modificator?: (dataView: DataView) => void): void {

                dataView.metadata.objects = {
                    granularity: {
                        granularity: GranularityType.month
                    }
                };

                visualBuilder.update(dataView);

                let countOfMonth: number,
                    timelineData: ITimelineData,
                    startDate: Date,
                    endDate: Date;

                countOfMonth = visualBuilder
                    .mainElement
                    .find(".cellRect")
                    .length;

                (dataView.metadata.objects as any).granularity.granularity = GranularityType.day;

                visualBuilder.update(dataView);

                visualBuilder.selectTheLatestCell(dataView);

                timelineData = visualBuilder.visualObject.timelineData;

                startDate = Utils.getStartSelectionDate(timelineData);
                endDate = Utils.getEndSelectionDate(timelineData);

                (dataView.metadata.objects as any).general = {
                    datePeriod: TimelineDatePeriodBase.create(startDate, endDate)
                };

                visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, () => {
                    (dataView.metadata.objects as any).granularity.granularity = GranularityType.month;

                    if (modificator) {
                        modificator(dataView);
                    }

                    visualBuilder.update(dataView);

                    let countMonthOfSelectedDays: number = visualBuilder
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
                let calendarSettings: CalendarSettings = { day, month };

                VisualClass.setValidCalendarSettings(calendarSettings);

                expect(calendarSettings.day).toBe(expectedDay);
            }
        });

        describe("findCursorOverElement", () => {
            beforeEach((done) => {
                dataView.metadata.objects = {
                    granularity: {
                        granularity: GranularityType.day
                    }
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
                let cursorOverElement: TimelineCursorOverElement = visualBuilder
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

            function expectToCallDatasetsChanged(dataView: DataView, expectedValue: boolean): void {
                let options: VisualUpdateOptions,
                    areVisualUpdateOptionsValid: boolean;

                options = <VisualUpdateOptions>{
                    dataViews: [dataView]
                };

                areVisualUpdateOptionsValid = VisualClass.areVisualUpdateOptionsValid(options);

                expect(areVisualUpdateOptionsValid).toEqual(expectedValue);
            }
        });

        describe("Format settings test", () => {
            function checkSelectedElement(
                granularity: string,
                expectedElementsAmount: number
            ): void {
                dataView.metadata.objects.granularity.granularity = granularity;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                let selectedElements: Element[] = [];
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
                granularity: string
            ): void {
                dataView.metadata.objects.granularity.granularity = granularity;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                let selectedElements: Element[] = [],
                    lastElement = visualBuilder.cellRects.last();
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
                            show: true
                        }
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
                    const fontSize: number = 22,
                        expectedFontSize: string = "29.3333px";

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
                            fillSelected: getSolidColorStructuralObject(color)
                        }
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
                            fillUnselected: getSolidColorStructuralObject(color)
                        },
                        granularity: {
                            granularity: GranularityType.day
                        }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const lastCell: JQuery = visualBuilder.cellRects.last();

                    clickElement(lastCell);

                    visualBuilder.cellRects
                        .toArray()
                        .forEach((element: Element) => {
                            const $element: JQuery = $(element);

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
                            scaleColor: getSolidColorStructuralObject(color)
                        }
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
                            sliderColor: getSolidColorStructuralObject(color)
                        }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const strokeColor: string = visualBuilder.timelineSlicer
                        .find("rect.periodSlicerRect")
                        .css("stroke");

                    assertColorsMatch(strokeColor, color);
                });
            });

            describe("First day of week option", () => {
                const daySelection: boolean = true,
                    startDateRange: Date = new Date(2015, 0, 1),
                    weekFromStartRange: Date = new Date(2015, 0, 7);
                let calendar: Calendar,
                    granularity: string = "week",
                    selectedWeekCount: number = 0;

                beforeEach(() => {
                    visualBuilder = new TimelineBuilder(1000, 500);
                    defaultDataViewBuilder = new TimelineData();
                    defaultDataViewBuilder.setDateRange(startDateRange, weekFromStartRange);

                    dataView = defaultDataViewBuilder.getDataView();
                });

                it("check calendar with default day of week - Sunday", () => {
                    const dayOfWeekSundayNumber = 0;
                    selectedWeekCount = 2;

                    dataView.metadata.objects = {
                        weekDay: {
                            day: dayOfWeekSundayNumber,
                            daySelection: daySelection
                        },
                        granularity: {}
                    };

                    checkSelectedElement(GranularityType[granularity], selectedWeekCount);
                });

                it("check calendar with setted day of week - Tuesday", () => {
                    const dayOfWeekThursdayNumber = 2;
                    selectedWeekCount = 2;

                    dataView.metadata.objects = {
                        weekDay: {
                            day: dayOfWeekThursdayNumber,
                            daySelection: daySelection
                        },
                        granularity: {}
                    };

                    checkSelectedElement(GranularityType[granularity], selectedWeekCount);
                });

                it("check calendar getWeekperiod function with day of week option off", () => {
                    dataView.metadata.objects = {
                        weekDay: {
                            daySelection: !daySelection
                        },
                        granularity: {}
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    let visualCalendar: Calendar = visualBuilder.visualObject["calendar"];
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
                    // January,1 must be first day of week by default for every year in period
                    selectedWeekCount = 1;

                    visualBuilder = new TimelineBuilder(1000, 500);
                    defaultDataViewBuilder = new TimelineData();
                    defaultDataViewBuilder.setDateRange(new Date(2015, 0, 1), new Date(2016, 0, 12));
                    dataView = defaultDataViewBuilder.getDataView();

                    dataView.metadata.objects = {
                        weekDay: {
                            daySelection: !daySelection
                        },
                        granularity: {
                            granularity: GranularityType[granularity]
                        }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    let periods: any[] = visualBuilder.visualObject.timelineData.currentGranularity.getDatePeriods();
                    expect(periods.length).toEqual(55);
                    expect(periods[0].startDate as Date).toEqual(new Date(2015, 0, 1));
                    expect(periods[53].startDate as Date).toEqual(new Date(2016, 0, 1));
                });
            });

            describe("Force selection", () => {
                for (let granularity in GranularityType) {
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
                                    fillUnselected: getSolidColorStructuralObject(color),
                                    fillSelected: getSolidColorStructuralObject(colorSel)
                                },
                                forceSelection: {
                                    currentPeriod: false,
                                    latestAvailableDate: false
                                },
                                granularity: {}
                            };

                            visualBuilder.updateFlushAllD3Transitions(dataView);

                            const lastCell: JQuery = visualBuilder.cellRects.last();

                            clickElement(lastCell);

                            assertColorsMatch(
                                lastCell.css("fill"),
                                colorSel);
                        });

                        it("current enabled -- impossible to make user selection", () => {
                            const currentDate: Date = new Date();
                            const startDateRange: Date = new Date(currentDate.getFullYear() - 1, 0, 1);
                            const endDateRange: Date = new Date(currentDate.getFullYear() + 1, 11, 31);
                            const color: string = "#ABCDEF";
                            const colorSel: string = "#AAAAAA";

                            defaultDataViewBuilder.setDateRange(startDateRange, endDateRange);

                            dataView = defaultDataViewBuilder.getDataView();
                            dataView.metadata.objects = {
                                cells: {
                                    fillUnselected: getSolidColorStructuralObject(color),
                                    fillSelected: getSolidColorStructuralObject(colorSel)
                                },
                                forceSelection: {
                                    currentPeriod: true,
                                    latestAvailableDate: false
                                },
                                granularity: {}
                            };

                            visualBuilder.updateFlushAllD3Transitions(dataView);

                            const lastCell: JQuery = visualBuilder.cellRects.last();

                            clickElement(lastCell);

                            assertColorsMatch(
                                lastCell.css("fill"),
                                color);
                        });

                        it("latest enabled -- impossible to make user selection", () => {
                            const currentDate: Date = new Date();
                            const startDateRange: Date = new Date(currentDate.getFullYear() - 1, 0, 1);
                            const endDateRange: Date = new Date(currentDate.getFullYear() + 1, 11, 31);
                            const color: string = "#ABCDEF";
                            const colorSel: string = "#AAAAAA";

                            defaultDataViewBuilder.setDateRange(startDateRange, endDateRange);

                            dataView = defaultDataViewBuilder.getDataView();
                            dataView.metadata.objects = {
                                cells: {
                                    fillUnselected: getSolidColorStructuralObject(color),
                                    fillSelected: getSolidColorStructuralObject(colorSel)
                                },
                                forceSelection: {
                                    currentPeriod: false,
                                    latestAvailableDate: true
                                },
                                granularity: {}
                            };

                            visualBuilder.updateFlushAllD3Transitions(dataView);

                            const firstCell: JQuery = visualBuilder.cellRects.first();

                            clickElement(firstCell);

                            assertColorsMatch(
                                firstCell.css("fill"),
                                color);
                        });

                        it(`current period for '${granularity}' granularity`, () => {
                            const currentDate: Date = new Date();
                            const startDateRange: Date = new Date(currentDate.getFullYear(), 0, 1);
                            const endDateRange: Date = new Date(currentDate.getFullYear() + 1, 11, 31);

                            defaultDataViewBuilder.setDateRange(startDateRange, endDateRange);

                            dataView = defaultDataViewBuilder.getDataView();
                            dataView.metadata.objects = {
                                forceSelection: {
                                    currentPeriod: true
                                },
                                granularity: {}
                            };

                            checkSelectedElement(GranularityType[granularity], 1);
                        });

                        it(`current period out of data set for '${granularity}' granularity`, () => {
                            const currentDate: Date = new Date();
                            const startDateRange: Date = new Date(2010, 0, 1);
                            const endDateRange: Date = new Date(2011, 11, 31);

                            const amountOfDaysFromStart: number = 0;

                            defaultDataViewBuilder.setDateRange(startDateRange, endDateRange);

                            dataView = defaultDataViewBuilder.getDataView();
                            dataView.metadata.objects = {
                                forceSelection: {
                                    currentPeriod: true
                                },
                                granularity: {
                                    granularity
                                }
                            };

                            const startDateSelection: Date =
                                defaultDataViewBuilder.valuesCategory[amountOfDaysFromStart];
                            const endDateSelection: Date =
                                defaultDataViewBuilder.valuesCategory[amountOfDaysFromStart + 1];

                            const yearOfEndDate: number = endDateSelection.getFullYear();
                            const yearOfStartDateSelection: number = startDateSelection.getFullYear();
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
                                    latestAvailableDate: true
                                },
                                granularity: {}
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
                                    latestAvailableDate: true
                                },
                                granularity: {}
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
                            show: true,
                            displayAll: true
                        }
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
                    const fontSize: number = 22,
                        expectedFontSize: string = "29.3333px";

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

    describe("Timeline - Granularity", () => {
        let calendar: Calendar,
            granularities: Granularity[];

        beforeEach(() => {
            calendar = createCalendar();
            const localizationManager = powerbi.extensibility.utils.test.mocks.createLocalizationManager();
            const locale = "en-US";

            granularities = [
                new YearGranularity(calendar, locale, localizationManager),
                new QuarterGranularity(calendar, locale),
                new WeekGranularity(calendar, locale, localizationManager),
                new MonthGranularity(calendar, locale),
                new DayGranularity(calendar, locale)
            ];
        });

        describe("splitDate", () => {
            it("should return a correct year", () => {
                const date: Date = new Date(2015, 0, 1);

                granularities.forEach((granularity: Granularity) => {
                    const actualResult = granularity.splitDate(date);

                    expect(actualResult[actualResult.length - 1]).toBe(2014);
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
        });
    });

    describe("Timeline - TimelineUtils", () => {
        describe("getIndexByPosition", () => {
            const indexes: number[] = [0, 1, 2, 3, 3.14, 4, 4.15, 5],
                widthOfElement: number = 25;

            it("should return 0 when position is lower than 0", () => {
                let position: number = -99,
                    index: number;

                index = getIndexByPosition(position);

                expect(index).toBe(0);
            });

            it("should return max index when position is greater than widthOfElement * maxIndex", () => {
                let position: number = indexes[indexes.length - 1] * widthOfElement * 2,
                    index: number;

                index = getIndexByPosition(position);

                expect(index).toBe(indexes.length - 1);
            });

            it("should return 4 when position is between 3.14 and 4", () => {
                let position: number = 80,
                    index: number;

                index = getIndexByPosition(position);

                expect(index).toBe(4);
            });

            it("should return 1 when offset is 10 and position is between 1 and 2", () => {
                let position: number = 45,
                    offset: number = 10,
                    index: number;

                index = getIndexByPosition(position, offset);

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
                let date: Date = new Date(2008, 1, 1, 23, 59, 59, 999),
                    expectedString: string = "2008-02-01T23:59:59.999Z";

                checkStringWithoutTimezone(date, expectedString);
            });

            function checkStringWithoutTimezone(date: Date, expectedString: string): void {
                let actualString: string = Utils.toStringDateWithoutTimezone(date);

                expect(actualString).toBe(expectedString);
            }
        });

        describe("parseDateWithoutTimezone", () => {
            it("should return null when a dateString is null", () => {
                let actualDate: Date = Utils.parseDateWithoutTimezone(null);

                expect(actualDate).toBe(null);
            });

            it("should return a date without timezone", () => {
                let actualString: string = "2008-02-01T23:59:59.999Z",
                    expectedDate: Date = new Date(2008, 1, 1, 23, 59, 59, 999),
                    actualDate: Date;

                actualDate = Utils.parseDateWithoutTimezone(actualString);

                expect(actualDate.getTime()).toBe(expectedDate.getTime());
            });
        });

        describe("convertToDaysFromMilliseconds", () => {
            it("should return amount of days", () => {
                let milliseconds: number = 432000000,
                    amountOfDays: number;

                amountOfDays = Utils.convertToDaysFromMilliseconds(milliseconds);

                expect(amountOfDays).toBe(5);
            });
        });

        describe("getAmountOfDaysBetweenDates", () => {
            it("should return amout of days between dates when startDate < endDate", () => {
                let startDate: Date,
                    endDate: Date,
                    amountOfDays: number = 10;

                startDate = new Date(2016, 8, 0);
                endDate = new Date(2016, 8, amountOfDays);

                checkGetAmountOfDaysBetweenDates(
                    startDate,
                    endDate,
                    amountOfDays);
            });

            it("should return amout of days between dates when startDate > endDate", () => {
                let startDate: Date,
                    endDate: Date,
                    amountOfDays: number = 10;

                startDate = new Date(2016, 8, 0);
                endDate = new Date(2016, 8, amountOfDays);

                checkGetAmountOfDaysBetweenDates(
                    endDate,
                    startDate,
                    amountOfDays);
            });

            it("should 0 when dates are the same", () => {
                let startDate: Date = new Date(2016, 8, 0);

                checkGetAmountOfDaysBetweenDates(
                    startDate,
                    startDate,
                    0);
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
                let startDate: Date,
                    endDate: Date,
                    idOfTheWeek: number;

                startDate = new Date(2016, 0, 3);
                endDate = new Date(2016, 7, 12);

                idOfTheWeek = Utils.getAmountOfWeeksBetweenDates(startDate, endDate);

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
            let datePeriod: TimelineDatePeriod[],
                dates: Date[];

            beforeEach(() => {
                dates = [
                    new Date(2008, 1, 1),
                    new Date(2008, 1, 2),
                    new Date(2008, 1, 3),
                    new Date(2008, 1, 4)
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
                datePeriod: TimelineDatePeriod[],
                selectionStartIndex: number,
                selectionEndIndex: number,
                expectedValue: boolean): void {

                let actualValue: boolean,
                    timelineData: ITimelineData;

                timelineData = createTimelineData(
                    datePeriod,
                    selectionStartIndex,
                    selectionEndIndex);

                actualValue = Utils.areBoundsOfSelectionAndAvailableDatesTheSame(timelineData);

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
                let minDate: Date = new Date(1969, 6, 20),
                    maxDate: Date = new Date(2016, 7, 17),
                    dates: Date[];

                dates = [
                    maxDate,
                    new Date(2015, 1, 1),
                    new Date(2014, 8, 8),
                    minDate,
                    new Date(2010, 8, 8),
                    new Date(2005, 8, 8)
                ];

                checkBoundsOfDates(dates, minDate, maxDate);
            });

            function checkBoundsOfDates(values: any[], startDate: any, endDate: any): void {
                let actualDatePeriod: ITimelineDatePeriod;

                actualDatePeriod = Utils.getDatePeriod(values);

                expect(getTime(actualDatePeriod.startDate)).toBe(getTime(startDate));
                expect(getTime(actualDatePeriod.endDate)).toBe(getTime(endDate));
            }
        });

        describe("getEndOfThePreviousDate", () => {
            it("should return the previous date", () => {
                const date: Date = new Date(2016, 9, 9),
                    expectedDay: number = 8;

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
                const year: number = 2016,
                    expectedDate = new Date(year, 0);

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
                jasmine.getJSONFixtures().fixturesPath = "base";

                let jsonData = getJSONFixture("capabilities.json");

                let objectsChecker: Function = (obj) => {
                    for (let property in obj) {
                        let value: any = obj[property];

                        if (value.displayName) {
                            expect(value.displayNameKey).toBeDefined();
                        }

                        if (typeof value === "object") {
                            objectsChecker(value);
                        }
                    }
                };

                objectsChecker(jsonData);
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
        let visualBuilder: TimelineBuilder,
            defaultDataViewBuilder: TimelineData,
            dataView: DataView;

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
                    const layers: JQuery[] = visualBuilder.cellRects.toArray().map($);

                    expect(isColorAppliedToElements(layers, foregroundColor, "stroke"));

                    done();
                });
            });

            function isColorAppliedToElements(
                elements: JQuery[],
                color?: string,
                colorStyleName: string = "fill"
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
        month: number = 1,
        day: number = 1,
        week: number = 1,
        dayOfWeekSelectionOn: boolean = false): Calendar {

        let calendarSettings: CalendarSettings,
            weekDaySettings: WeekDaySettings;

        calendarSettings = {
            month: month,
            day: day
        };

        weekDaySettings = {
            day: week,
            daySelection: dayOfWeekSelectionOn
        };

        return new Calendar(calendarSettings, weekDaySettings);
    }

    function createDatePeriod(dates: Date[]): TimelineDatePeriod[] {
        return dates.map((date: Date, index: number) => {
            return {
                startDate: date,
                endDate: date,
                identifierArray: [],
                year: 0,
                week: [],
                fraction: 0,
                index: index
            };
        });
    }

    function createTimelineData(
        datePeriod: TimelineDatePeriod[],
        selectionStartIndex: number,
        selectionEndIndex: number): ITimelineData {

        const timelineGranularityMock: TimelineGranularityMock = new TimelineGranularityMock(datePeriod);

        return {
            currentGranularity: timelineGranularityMock,
            selectionStartIndex,
            selectionEndIndex
        };
    }
}
