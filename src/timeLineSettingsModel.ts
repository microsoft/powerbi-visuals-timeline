import powerbi from "powerbi-visuals-api";

import {formattingSettings} from "powerbi-visuals-utils-formattingmodel";
import {WeekStandard} from "./calendars/weekStandard";
import {Month} from "./calendars/month";
import Card = formattingSettings.SimpleCard;
import CompositeCard = formattingSettings.CompositeCard;
import Model = formattingSettings.Model;
import IEnumMember = powerbi.IEnumMember;
import ValidatorType = powerbi.visuals.ValidatorType;
import {Weekday} from "./calendars/weekday";
import {GranularityType} from "./granularity/granularityType";
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import {DatePeriodBase} from "./datePeriod/datePeriodBase";

const weekStandardOptions: IEnumMember[] = [
    { value: WeekStandard.NotSet, displayName: "Visual_Week_Standard_None" },
    { value: WeekStandard.ISO8061, displayName: "Visual_Week_Standard_ISO8601" },
];

const monthOptions: IEnumMember[] = [
    { value: Month.January, displayName: "Visual_Month_January" },
    { value: Month.February, displayName: "Visual_Month_February" },
    { value: Month.March, displayName: "Visual_Month_March" },
    { value: Month.April, displayName: "Visual_Month_April" },
    { value: Month.May, displayName: "Visual_Month_May" },
    { value: Month.June, displayName: "Visual_Month_June" },
    { value: Month.July, displayName: "Visual_Month_July" },
    { value: Month.August, displayName: "Visual_Month_August" },
    { value: Month.September, displayName: "Visual_Month_September" },
    { value: Month.October, displayName: "Visual_Month_October" },
    { value: Month.November, displayName: "Visual_Month_November" },
    { value: Month.December, displayName: "Visual_Month_December" },
];

const weekdayOptions: IEnumMember[] = [
    { value: Weekday.Sunday, displayName: "Visual_Day_Sunday" },
    { value: Weekday.Monday, displayName: "Visual_Day_Monday" },
    { value: Weekday.Tuesday, displayName: "Visual_Day_Tuesday" },
    { value: Weekday.Wednesday, displayName: "Visual_Day_Wednesday" },
    { value: Weekday.Thursday, displayName: "Visual_Day_Thursday" },
    { value: Weekday.Friday, displayName: "Visual_Day_Friday" },
    { value: Weekday.Saturday, displayName: "Visual_Day_Saturday" },
];

const granularityOptions: IEnumMember[] = [
    { value: GranularityType.year, displayName: "Visual_Granularity_Year" },
    { value: GranularityType.quarter, displayName: "Visual_Granularity_Quarter" },
    { value: GranularityType.month, displayName: "Visual_Granularity_Month" },
    { value: GranularityType.week, displayName: "Visual_Granularity_Week" },
    { value: GranularityType.day, displayName: "Visual_Granularity_Day" },
];

class TextSizeDefaults {
    public static readonly Default: number = 9;
    public static readonly Min: number = 7;
    public static readonly Max: number = 24;
}


class GeneralSettings {
    public datePeriod: DatePeriodBase | string = DatePeriodBase.CREATEEMPTY();
}


class CursorSettingsCard extends Card {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: true,
    });

    color = new formattingSettings.ColorPicker({
        name: "color",
        displayName: "Cursor color",
        displayNameKey: "Visual_CursorColor",
        value: { value: "#808080" },
    });

    topLevelSlice = this.show;
    name: string = "cursor";
    displayName: string = "Cursor";
    displayNameKey: string = "Visual_Cursor";
    slices = [this.color];
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
    slices = [this.month, this.day];
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
        options: {
            minValue: { value: TextSizeDefaults.Min, type: ValidatorType.Min },
            maxValue: { value: TextSizeDefaults.Max, type: ValidatorType.Max },
        }
    });

    topLevelSlice = this.show;
    name: string = "rangeHeader";
    displayName: string = "Range Header";
    displayNameKey: string = "Visual_RangeHeader";
    slices = [this.fontColor, this.textSize];
}

export class CellsSettingsCard extends Card {
    public static readonly FillSelectedDefaultColor: string = "#ADD8E6";
    public static readonly FillUnselectedDefaultColor: string = "#FFFFFF";

    fillSelected = new formattingSettings.ColorPicker({
        name: "fillSelected",
        displayName: "Selected cell color",
        displayNameKey: "Visual_Cell_SelectedColor",
        value: { value: CellsSettingsCard.FillSelectedDefaultColor },
    });

    strokeSelected = new formattingSettings.ColorPicker({
        name: "strokeSelected",
        displayName: "Selected cell stroke color",
        displayNameKey: "Visual_Cell_SelectedStrokeColor",
        value: { value: "#333444" },
    })

    fillUnselected = new formattingSettings.ColorPicker({
        name: "fillUnselected",
        displayName: "Unselected cell color",
        displayNameKey: "Visual_Cell_UnselectedColor",
        value: { value: CellsSettingsCard.FillUnselectedDefaultColor },
    });

    strokeUnselected = new formattingSettings.ColorPicker({
        name: "strokeUnselected",
        displayName: "Unselected cell stroke color",
        displayNameKey: "Visual_Cell_UnselectedStrokeColor",
        value: { value: "#333444" },
    });

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

    name: string = "cells";
    displayName: string = "Cells";
    displayNameKey: string = "Visual_Cells";
    slices = [this.fillSelected, this.strokeSelected, this.fillUnselected, this.strokeUnselected, this.strokeWidth, this.gapWidth];
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
            maxValue: { value: TextSizeDefaults.Max, type: ValidatorType.Max },
        }
    });

    topLevelSlice = this.show;
    name: string = "labels";
    displayName: string = "Labels";
    displayNameKey: string = "Visual_Labels";
    slices = [this.displayAll, this.fontColor, this.textSize];
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
    general = new GeneralSettings();

    cursor = new CursorSettingsCard();
    forceSelection = new ForceSelectionSettingsCard();
    weekDay = new WeekDaySettingsCard();
    weeksDeterminationStandards = new WeeksDeterminationStandardsSettingsCard();
    calendar = new CalendarSettingsCard();
    rangeHeader = new RangeHeaderSettingsCard();
    cells = new CellsSettingsCard();
    granularity = new GranularitySettingsCard();
    labels = new LabelsSettingsCard();
    scrollAutoAdjustment = new ScrollAutoAdjustmentSettingsCard();

    cards: Array<Card | CompositeCard> = [
        this.cursor,
        this.forceSelection,
        this.weeksDeterminationStandards,
        this.calendar,
        this.weekDay,
        this.rangeHeader,
        this.cells,
        this.granularity,
        this.labels,
        this.scrollAutoAdjustment,
    ];

    public setLocalizedOptions(localizationManager: ILocalizationManager) {
        this.setLocalizedDisplayName(weekStandardOptions, localizationManager);
        this.setLocalizedDisplayName(monthOptions, localizationManager);
        this.setLocalizedDisplayName(weekdayOptions, localizationManager);
        this.setLocalizedDisplayName(granularityOptions, localizationManager);
    }

    private setLocalizedDisplayName(options: IEnumMember[], localizationManager: ILocalizationManager) {
        options.forEach(option => {
            option.displayName = localizationManager.getDisplayName(option.displayName.toString())
        });
    }
}
