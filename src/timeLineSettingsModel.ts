import powerbi from "powerbi-visuals-api";

import {formattingSettings} from "powerbi-visuals-utils-formattingmodel";
import {WeekStandards} from "./calendars/weekStandards";
import {Month} from "./calendars/month";
import Card = formattingSettings.SimpleCard;
import CompositeCard = formattingSettings.CompositeCard;
import Model = formattingSettings.Model;
import IEnumMember = powerbi.IEnumMember;
import ValidatorType = powerbi.visuals.ValidatorType;
import {Weekday} from "./calendars/weekday";
import {GranularityType} from "./granularity/granularityType";
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

class TextSizeDefaults {
    public static readonly Default: number = 9;
    public static readonly Min: number = 7;
    public static readonly Max: number = 24;
}

const weekStandardOptions: IEnumMember[] = [
    { value: WeekStandards[WeekStandards.NotSet], displayName: "Visual_Week_Standard_None" },
    { value: WeekStandards[WeekStandards.ISO8061], displayName: "Visual_Week_Standard_ISO8601" },
];

const monthOptions: IEnumMember[] = [
    { value: Month[Month.January], displayName: "Visual_Month_January" },
    { value: Month[Month.February], displayName: "Visual_Month_February" },
    { value: Month[Month.March], displayName: "Visual_Month_March" },
    { value: Month[Month.April], displayName: "Visual_Month_April" },
    { value: Month[Month.May], displayName: "Visual_Month_May" },
    { value: Month[Month.June], displayName: "Visual_Month_June" },
    { value: Month[Month.July], displayName: "Visual_Month_July" },
    { value: Month[Month.August], displayName: "Visual_Month_August" },
    { value: Month[Month.September], displayName: "Visual_Month_September" },
    { value: Month[Month.October], displayName: "Visual_Month_October" },
    { value: Month[Month.November], displayName: "Visual_Month_November" },
    { value: Month[Month.December], displayName: "Visual_Month_December" },
];

const weekdayOptions: IEnumMember[] = [
    { value: Weekday[Weekday.Sunday], displayName: "Visual_Day_Sunday" },
    { value: Weekday[Weekday.Monday], displayName: "Visual_Day_Monday" },
    { value: Weekday[Weekday.Tuesday], displayName: "Visual_Day_Tuesday" },
    { value: Weekday[Weekday.Wednesday], displayName: "Visual_Day_Wednesday" },
    { value: Weekday[Weekday.Thursday], displayName: "Visual_Day_Thursday" },
    { value: Weekday[Weekday.Friday], displayName: "Visual_Day_Friday" },
    { value: Weekday[Weekday.Saturday], displayName: "Visual_Day_Saturday" },
];

const granularityOptions: IEnumMember[] = [
    { value: GranularityType[GranularityType.year], displayName: "Visual_Granularity_Year" },
    { value: GranularityType[GranularityType.quarter], displayName: "Visual_Granularity_Quarter" },
    { value: GranularityType[GranularityType.month], displayName: "Visual_Granularity_Month" },
    { value: GranularityType[GranularityType.week], displayName: "Visual_Granularity_Week" },
    { value: GranularityType[GranularityType.day], displayName: "Visual_Granularity_Day" },
];

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

class WeeksDeterminationStandardsSettingsCard extends Card {
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

class CalendarSettingsCard extends Card {
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

class WeekDayCardSettings extends Card {
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

class RangeHeaderSettingsCard extends Card {
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

class CellsSettingsCard extends Card {
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

    name: string = "cells";
    displayName: string = "Cells";
    displayNameKey: string = "Visual_Cells";
    slices = [this.fillSelected, this.strokeSelected, this.fillUnselected, this.strokeUnselected];
}

class GranularitySettingsCard extends Card {
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

class LabelsSettingsCard extends Card {
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
    forceSelection = new ForceSelectionSettingsCard();
    weeksDeterminationStandards = new WeeksDeterminationStandardsSettingsCard();
    calendar = new CalendarSettingsCard();
    rangeHeader = new RangeHeaderSettingsCard();
    cells = new CellsSettingsCard();
    granularity = new GranularitySettingsCard();
    labels = new LabelsSettingsCard();
    scrollAutoAdjustment = new ScrollAutoAdjustmentSettingsCard();

    cards: Array<Card | CompositeCard> = [
        this.forceSelection,
        this.weeksDeterminationStandards,
        this.calendar,
        this.rangeHeader,
        this.cells,
        this.granularity,
        this.labels,
        this.scrollAutoAdjustment,
    ];

    setLocalizedOptions(localizationManager: ILocalizationManager) {
        this.setLocalizedDisplayName(weekStandardOptions, localizationManager);
        this.setLocalizedDisplayName(monthOptions, localizationManager);
        this.setLocalizedDisplayName(weekdayOptions, localizationManager);
        this.setLocalizedDisplayName(granularityOptions, localizationManager);
    }

    public setLocalizedDisplayName(options: IEnumMember[], localizationManager: ILocalizationManager) {
        options.forEach(option => {
            option.displayName = localizationManager.getDisplayName(option.displayName.toString())
        });
    }
}
