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

import { formattingSettings, formattingSettingsInterfaces } from "powerbi-visuals-utils-formattingmodel";
import { WeekStandard } from "./calendars/weekStandard";
import { Month } from "./calendars/month";
import Card = formattingSettings.SimpleCard;
import CompositeCard = formattingSettings.CompositeCard;
import Model = formattingSettings.Model;
import Group = formattingSettings.Group;
import ILocalizedItemMember = formattingSettingsInterfaces.ILocalizedItemMember;
import ValidatorType = powerbi.visuals.ValidatorType;
import { Weekday } from "./calendars/weekday";
import { GranularityType } from "./granularity/granularityType";
import { PeriodSlicerPosition } from "./granularity/periodSlicerPosition";

const weekStandardOptions: ILocalizedItemMember[] = [
    { value: WeekStandard.NotSet, displayNameKey: "Visual_Week_Standard_None" },
    { value: WeekStandard.ISO8061, displayNameKey: "Visual_Week_Standard_ISO8601" },
];

const monthOptions: ILocalizedItemMember[] = [
    { value: Month.January, displayNameKey: "Visual_Month_January" },
    { value: Month.February, displayNameKey: "Visual_Month_February" },
    { value: Month.March, displayNameKey: "Visual_Month_March" },
    { value: Month.April, displayNameKey: "Visual_Month_April" },
    { value: Month.May, displayNameKey: "Visual_Month_May" },
    { value: Month.June, displayNameKey: "Visual_Month_June" },
    { value: Month.July, displayNameKey: "Visual_Month_July" },
    { value: Month.August, displayNameKey: "Visual_Month_August" },
    { value: Month.September, displayNameKey: "Visual_Month_September" },
    { value: Month.October, displayNameKey: "Visual_Month_October" },
    { value: Month.November, displayNameKey: "Visual_Month_November" },
    { value: Month.December, displayNameKey: "Visual_Month_December" },
];

const weekdayOptions: ILocalizedItemMember[] = [
    { value: Weekday.Sunday, displayNameKey: "Visual_Day_Sunday" },
    { value: Weekday.Monday, displayNameKey: "Visual_Day_Monday" },
    { value: Weekday.Tuesday, displayNameKey: "Visual_Day_Tuesday" },
    { value: Weekday.Wednesday, displayNameKey: "Visual_Day_Wednesday" },
    { value: Weekday.Thursday, displayNameKey: "Visual_Day_Thursday" },
    { value: Weekday.Friday, displayNameKey: "Visual_Day_Friday" },
    { value: Weekday.Saturday, displayNameKey: "Visual_Day_Saturday" },
];

const positionOptions: ILocalizedItemMember[] = [
    { value: PeriodSlicerPosition.topLeft, displayNameKey: "Visual_Position_TopLeft" },
    { value: PeriodSlicerPosition.topCenter, displayNameKey: "Visual_Position_TopCenter" },
    { value: PeriodSlicerPosition.topRight, displayNameKey: "Visual_Position_TopRight" },
    { value: PeriodSlicerPosition.bottomLeft, displayNameKey: "Visual_Position_BottomLeft" },
    { value: PeriodSlicerPosition.bottomCenter, displayNameKey: "Visual_Position_BottomCenter" },
    { value: PeriodSlicerPosition.bottomRight, displayNameKey: "Visual_Position_BottomRight" },
];

const granularityOptions: ILocalizedItemMember[] = [
    { value: GranularityType.year, displayNameKey: "Visual_Granularity_Year" },
    { value: GranularityType.quarter, displayNameKey: "Visual_Granularity_Quarter" },
    { value: GranularityType.month, displayNameKey: "Visual_Granularity_Month" },
    { value: GranularityType.week, displayNameKey: "Visual_Granularity_Week" },
    { value: GranularityType.day, displayNameKey: "Visual_Granularity_Day" },
];

class TextSizeDefaults {
    public static readonly Default: number = 9;
    public static readonly Min: number = 7;
    public static readonly Max: number = 40;
}

class PaddingDefaults {
    public static readonly Default: number = 0;
    public static readonly Min: number = 0;
    public static readonly Max: number = 100;
}

class ForceSelectionSettingsCard extends Card {
    currentPeriod = new formattingSettings.ToggleSwitch({
        name: "currentPeriod",
        displayName: "Current Period",
        displayNameKey: "Visual_CurrentPeriod",
        value: false,
    });

    latestAvailableDate = new formattingSettings.ToggleSwitch({
        name: "latestAvailableDate",
        displayName: "Latest available period",
        displayNameKey: "Visual_LatestAvailableDate",
        value: false,
    });

    name: string = "forceSelection";
    displayName: string = "Force Selection";
    displayNameKey: string = "Visual_ForceSelection";
    slices = [this.currentPeriod, this.latestAvailableDate];
}

export class WeeksDeterminationStandardsSettingsCard extends Card {
    weekStandard = new formattingSettings.ItemDropdown({
        name: "weekStandard",
        displayName: "Standard",
        displayNameKey: "Visual_Week_Standard",
        items: weekStandardOptions,
        value: weekStandardOptions[0],
    });

    name: string = "weeksDetermintaionStandards";
    displayName: string = "Weeks Determination Standards";
    displayNameKey: string = "Visual_Weeks_Determination_Standards";
    slices = [this.weekStandard];
}

export class CalendarSettingsCard extends Card {
    public static readonly DefaultMonth: number = 0;
    public static readonly DefaultDay: number = 1;

    treatAsEndOfFiscalYear = new formattingSettings.ToggleSwitch({
        name: "treatAsEndOfFiscalYear",
        displayName: "Treat as end of fiscal year",
        displayNameKey: "Visual_TreatAsEndOfFiscalYear",
        value: true,
    });

    month = new formattingSettings.ItemDropdown({
        name: "month",
        displayName: "Month",
        displayNameKey: "Visual_Month",
        items: monthOptions,
        value: monthOptions[0],
    });

    day = new formattingSettings.NumUpDown({
        name: "day",
        displayName: "Day",
        displayNameKey: "Visual_Day",
        value: 1,
        options: {
            minValue: { value: 1, type: ValidatorType.Min },
            maxValue: { value: 31, type: ValidatorType.Max },
        }
    });

    name: string = "calendar";
    displayName: string = "Fiscal Year";
    displayNameKey: string = "Visual_FiscalYear";
    descriptionKey: string = "Visual_FiscalYear_Description";
    slices = [this.treatAsEndOfFiscalYear, this.month, this.day];
}

class WeekDaySettingsCard extends Card {
    daySelection = new formattingSettings.ToggleSwitch({
        name: "daySelection",
        displayName: "Day Selection",
        displayNameKey: "Visual_Day_Selection",
        value: true,
    });

    day = new formattingSettings.ItemDropdown({
        name: "day",
        displayName: "Day",
        displayNameKey: "Visual_Day",
        items: weekdayOptions,
        value: weekdayOptions[0],
    });

    topLevelSlice = this.daySelection;
    name: string = "weekDay";
    displayName: string = "First Day of Week";
    displayNameKey: string = "Visual_FirstDayOfWeek";
    descriptionKey: string = "Visual_FirstDayOfWeek_Description";
    slices = [this.day];
}

export class RangeHeaderSettingsCard extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: true,
    });

    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font Color",
        displayNameKey: "Visual_FontColor",
        value: { value: "#777777" },
    });

    textSize = new formattingSettings.NumUpDown({
        name: "textSize",
        displayName: "Text Size",
        displayNameKey: "Visual_TextSize",
        value: TextSizeDefaults.Default,
    });

    topLevelSlice = this.show;
    name: string = "rangeHeader";
    displayName: string = "Range Header";
    displayNameKey: string = "Visual_RangeHeader";
    slices = [this.fontColor, this.textSize];
}

export class CellsSettingsCard extends CompositeCard {
    public static readonly SelectedDefaultFillColor: string = "#ADD8E6";
    public static readonly UnselectedDefaultFillColor: string = "";

    strokeWidth = new formattingSettings.NumUpDown({
        name: "strokeWidth",
        displayName: "Stroke width",
        displayNameKey: "Visual_Cell_StrokeWidth",
        value: 1,
        options: {
            minValue: { value: 0, type: powerbi.visuals.ValidatorType.Min },
            maxValue: { value: 10, type: powerbi.visuals.ValidatorType.Max },
        }
    });

    gapWidth = new formattingSettings.NumUpDown({
        name: "gapWidth",
        displayName: "Gap width",
        displayNameKey: "Visual_Cell_GapWidth",
        value: 0,
        options: {
            minValue: { value: 0, type: powerbi.visuals.ValidatorType.Min },
            maxValue: { value: 30, type: powerbi.visuals.ValidatorType.Max },
        }
    });

    enableManualSizing = new formattingSettings.ToggleSwitch({
        name: "enableManualSizing",
        displayName: "Enable manual sizing",
        displayNameKey: "Visual_Cell_EnableManualSizing",
        value: false,
    });

    width = new formattingSettings.NumUpDown({
        name: "width",
        displayName: "Cell width",
        displayNameKey: "Visual_Cell_Width",
        value: 40,
        options: {
            minValue: { value: 10, type: powerbi.visuals.ValidatorType.Min },
        },
    });

    height = new formattingSettings.NumUpDown({
        name: "height",
        displayName: "Cell height",
        displayNameKey: "Visual_Cell_Height",
        value: 60,
        options: {
            minValue: { value: 10, type: powerbi.visuals.ValidatorType.Min },
        },
    });

    cellsGeneralGroup = new Group({
        name: "cellsGeneralGroup",
        displayName: "General",
        displayNameKey: "Visual_General",
        slices: [this.strokeWidth, this.gapWidth, this.enableManualSizing, this.width, this.height],
    });

    fillSelected = new formattingSettings.ColorPicker({
        name: "fillSelected",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: CellsSettingsCard.SelectedDefaultFillColor },
    });

    strokeSelected = new formattingSettings.ColorPicker({
        name: "strokeSelected",
        displayName: "Stroke color",
        displayNameKey: "Visual_StrokeColor",
        value: { value: "#333444" },
    })

    showEdges = new formattingSettings.ToggleSwitch({
        name: "showEdges",
        displayName: "Show edges",
        displayNameKey: "Visual_ShowEdges",
        value: true,
    });

    edgeColor = new formattingSettings.ColorPicker({
        name: "edgeColor",
        displayName: "Edge color",
        displayNameKey: "Visual_EdgeColor",
        value: { value: "#808080" },
    });

    cellsSelectedGroup = new Group({
        name: "selectedCellsGroup",
        displayName: "Selected cells",
        displayNameKey: "Visual_SelectedCells",
        slices: [this.fillSelected, this.strokeSelected, this.showEdges, this.edgeColor],
    });

    fillUnselected = new formattingSettings.ColorPicker({
        name: "fillUnselected",
        displayName: "Color",
        displayNameKey: "Visual_Color",
        value: { value: CellsSettingsCard.UnselectedDefaultFillColor },
    });

    strokeUnselected = new formattingSettings.ColorPicker({
        name: "strokeUnselected",
        displayName: "Stroke color",
        displayNameKey: "Visual_StrokeColor",
        value: { value: "#333444" },
    });

    cellsUnselectedGroup = new Group({
        name: "unselectedCellsGroup",
        displayName: "Unselected cells",
        displayNameKey: "Visual_UnselectedCells",
        slices: [this.fillUnselected, this.strokeUnselected],
    });

    name: string = "cells";
    displayName: string = "Cells";
    displayNameKey: string = "Visual_Cells";
    groups = [this.cellsGeneralGroup, this.cellsSelectedGroup, this.cellsUnselectedGroup];
}

export class GranularitySettingsCard extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: true,
    });

    scaleColor = new formattingSettings.ColorPicker({
        name: "scaleColor",
        displayName: "Scale color",
        displayNameKey: "Visual_ScaleColor",
        value: { value: "#000000" },
    });

    sliderColor = new formattingSettings.ColorPicker({
        name: "sliderColor",
        displayName: "Slider color",
        displayNameKey: "Visual_SliderColor",
        value: { value: "#AAAAAA" },
    });

    granularity = new formattingSettings.ItemDropdown({
        name: "granularity",
        displayName: "Granularity",
        displayNameKey: "Visual_Granularity",
        items: granularityOptions,
        value: granularityOptions[2], // month
    });

    position = new formattingSettings.ItemDropdown({
        name: "position",
        displayName: "Position",
        displayNameKey: "Visual_Position",
        items: positionOptions,
        value: positionOptions[0],
    });

    granularityYearVisibility = new formattingSettings.ToggleSwitch({
        name: "granularityYearVisibility",
        displayName: "Year visibility",
        displayNameKey: "Visual_GranularityYearVisibility",
        value: true,
    });

    granularityQuarterVisibility = new formattingSettings.ToggleSwitch({
        name: "granularityQuarterVisibility",
        displayName: "Quarter visibility",
        displayNameKey: "Visual_GranularityQuarterVisibility",
        value: true,
    });

    granularityMonthVisibility = new formattingSettings.ToggleSwitch({
        name: "granularityMonthVisibility",
        displayName: "Month visibility",
        displayNameKey: "Visual_GranularityMonthVisibility",
        value: true,
    });

    granularityWeekVisibility = new formattingSettings.ToggleSwitch({
        name: "granularityWeekVisibility",
        displayName: "Week visibility",
        displayNameKey: "Visual_GranularityWeekVisibility",
        value: true,
    });

    granularityDayVisibility = new formattingSettings.ToggleSwitch({
        name: "granularityDayVisibility",
        displayName: "Day visibility",
        displayNameKey: "Visual_GranularityDayVisibility",
        value: true,
    });

    topLevelSlice = this.show;
    name: string = "granularity";
    displayName: string = "Granularity";
    displayNameKey: string = "Visual_Granularity";
    slices = [
        this.scaleColor,
        this.sliderColor,
        this.granularity,
        this.position,
        this.granularityYearVisibility,
        this.granularityQuarterVisibility,
        this.granularityMonthVisibility,
        this.granularityWeekVisibility,
        this.granularityDayVisibility,
    ];
}

export class LabelsSettingsCard extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: true,
    });

    displayAll = new formattingSettings.ToggleSwitch({
        name: "displayAll",
        displayName: "Display all",
        displayNameKey: "Visual_DisplayAll",
        value: true,
    });

    displayYears = new formattingSettings.ToggleSwitch({
        name: "displayYears",
        displayName: "Display years",
        displayNameKey: "Visual_DisplayYears",
        value: false,
    });

    displayQuarters = new formattingSettings.ToggleSwitch({
        name: "displayQuarters",
        displayName: "Display quarters",
        displayNameKey: "Visual_DisplayQuarters",
        value: false,
    });

    displayMonths = new formattingSettings.ToggleSwitch({
        name: "displayMonths",
        displayName: "Display months",
        displayNameKey: "Visual_DisplayMonths",
        value: false,
    });

    displayWeeks = new formattingSettings.ToggleSwitch({
        name: "displayWeeks",
        displayName: "Display weeks",
        displayNameKey: "Visual_DisplayWeeks",
        value: false,
    });

    displayDays = new formattingSettings.ToggleSwitch({
        name: "displayDays",
        displayName: "Display days",
        displayNameKey: "Visual_DisplayDays",
        value: false,
    });

    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font color",
        displayNameKey: "Visual_FontColor",
        value: { value: "#777777" },
    });

    textSize = new formattingSettings.NumUpDown({
        name: "textSize",
        displayName: "Text size",
        displayNameKey: "Visual_TextSize",
        value: TextSizeDefaults.Default,
        options: {
            minValue: { value: TextSizeDefaults.Min, type: ValidatorType.Min },
            maxValue: { value: 24, type: ValidatorType.Max },
        }
    });

    topLevelSlice = this.show;
    name: string = "labels";
    displayName: string = "Labels";
    displayNameKey: string = "Visual_Labels";
    slices = [
        this.displayAll,
        this.displayYears,
        this.displayQuarters,
        this.displayMonths,
        this.displayWeeks,
        this.displayDays,
        this.fontColor,
        this.textSize,
    ];
}

export class LayoutSettingsCard extends Card {
    autoAdjust = new formattingSettings.ToggleSwitch({
        name: "autoAdjust",
        displayName: "Auto adjust",
        displayNameKey: "Visual_AutoAdjust",
        value: false,
    });

    topPadding = new formattingSettings.NumUpDown({
        name: "topPadding",
        displayName: "Top padding",
        displayNameKey: "Visual_TopPadding",
        value: PaddingDefaults.Default,
        options: {
            minValue: { value: PaddingDefaults.Min, type: ValidatorType.Min },
            maxValue: { value: PaddingDefaults.Max, type: ValidatorType.Max },
        },
    });

    bottomPadding = new formattingSettings.NumUpDown({
        name: "bottomPadding",
        displayName: "Bottom padding",
        displayNameKey: "Visual_BottomPadding",
        value: PaddingDefaults.Default,
        options: {
            minValue: { value: PaddingDefaults.Min, type: ValidatorType.Min },
            maxValue: { value: PaddingDefaults.Max, type: ValidatorType.Max },
        },
    });

    name: string = "layout";
    displayName: string = "Layout";
    displayNameKey: string = "Visual_Layout";
    slices = [
        this.autoAdjust,
        this.topPadding,
        this.bottomPadding,
    ];
}

class ScrollAutoAdjustmentSettingsCard extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: false,
    });

    topLevelSlice = this.show;
    name: string = "scrollAutoAdjustment";
    displayName: string = "Scroll position auto adjustment";
    displayNameKey: string = "Visual_ScrollAutoAdjustment";
}


export class TimeLineSettingsModel extends Model {
    forceSelection = new ForceSelectionSettingsCard();
    weekDay = new WeekDaySettingsCard();
    weeksDeterminationStandards = new WeeksDeterminationStandardsSettingsCard();
    calendar = new CalendarSettingsCard();
    rangeHeader = new RangeHeaderSettingsCard();
    cells = new CellsSettingsCard();
    granularity = new GranularitySettingsCard();
    labels = new LabelsSettingsCard();
    layout = new LayoutSettingsCard();
    scrollAutoAdjustment = new ScrollAutoAdjustmentSettingsCard();

    cards: Array<Card | CompositeCard> = [
        this.forceSelection,
        this.weeksDeterminationStandards,
        this.calendar,
        this.weekDay,
        this.rangeHeader,
        this.cells,
        this.granularity,
        this.labels,
        this.layout,
        this.scrollAutoAdjustment,
    ];
}
