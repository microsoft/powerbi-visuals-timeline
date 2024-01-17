import powerbi from "powerbi-visuals-api";
import {formattingSettings} from "powerbi-visuals-utils-formattingmodel";
import {WeekStandard} from "./calendars/weekStandard";
import {Month} from "./calendars/month";
import {Day} from "./calendars/day";
import {GranularityType} from "./granularity/granularityType";

import Model = formattingSettings.Model;
import Card = formattingSettings.SimpleCard;
import IEnumMember = powerbi.IEnumMember;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import {DatePeriodBase} from "./datePeriod/datePeriodBase";
import {SimpleSlice} from "powerbi-visuals-utils-formattingmodel/lib/FormattingSettingsComponents";

const weeksDeterminationStandardsOptions: IEnumMember[] = [
    {value: WeekStandard[WeekStandard.NotSet], displayName: "Visual_Week_Standard_None"},
    {value: WeekStandard[WeekStandard.ISO8061], displayName: "Visual_Week_Standard_ISO8601"},
];

const fiscalYearOptions: IEnumMember[] = [
    {value: Month[Month.January], displayName: "Visual_Month_January"},
    {value: Month[Month.February], displayName: "Visual_Month_February"},
    {value: Month[Month.March], displayName: "Visual_Month_March"},
    {value: Month[Month.April], displayName: "Visual_Month_April"},
    {value: Month[Month.May], displayName: "Visual_Month_May"},
    {value: Month[Month.June], displayName: "Visual_Month_June"},
    {value: Month[Month.July], displayName: "Visual_Month_July"},
    {value: Month[Month.August], displayName: "Visual_Month_August"},
    {value: Month[Month.September], displayName: "Visual_Month_September"},
    {value: Month[Month.October], displayName: "Visual_Month_October"},
    {value: Month[Month.November], displayName: "Visual_Month_November"},
    {value: Month[Month.December], displayName: "Visual_Month_December"},
];

const dayOptions: IEnumMember[] = [
    {value: Day[Day.Sunday], displayName: "Visual_Day_Sunday"},
    {value: Day[Day.Monday], displayName: "Visual_Day_Monday"},
    {value: Day[Day.Tuesday], displayName: "Visual_Day_Tuesday"},
    {value: Day[Day.Wednesday], displayName: "Visual_Day_Wednesday"},
    {value: Day[Day.Thursday], displayName: "Visual_Day_Thursday"},
    {value: Day[Day.Friday], displayName: "Visual_Day_Friday"},
    {value: Day[Day.Saturday], displayName: "Visual_Day_Saturday"},
];

const granularityOptions: IEnumMember[] = [
    {value: GranularityType[GranularityType.year], displayName: "Visual_Granularity_Year"},
    {value: GranularityType[GranularityType.quarter], displayName: "Visual_Granularity_Quarter"},
    {value: GranularityType[GranularityType.month], displayName: "Visual_Granularity_Month"},
    {value: GranularityType[GranularityType.week], displayName: "Visual_Granularity_Week"},
    {value: GranularityType[GranularityType.day], displayName: "Visual_Granularity_Day"},
];


class TextSizeSettings {
    public static readonly DefaultTextSize: number = 9;
    public static readonly Min: number = 8;
    public static readonly Max: number = 60;
}

export class GeneralSettings {
    public datePeriod: DatePeriodBase | string = DatePeriodBase.CREATEEMPTY();
}

export class CursorSettingsCard extends Card {
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

    name: string = "cursor";
    displayName: string = "Cursor";
    displayNameKey: string = "Visual_Cursor";
    slices = [this.show, this.color];
}

export class ForceSelectionSettingsCard extends Card {
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
        items: weeksDeterminationStandardsOptions,
        value: weeksDeterminationStandardsOptions[0],
    });

    name: string = "weeksDeterminationStandards";
    displayName: string = "Weeks Determination Standards";
    displayNameKey: string = "Visual_Weeks_Determination_Standards";
    slices = [this.weekStandard];
}

export class FiscalYearCalendarSettingsCard extends Card {
    public static readonly DefaultMonth: number = 0;
    public static readonly DefaultDay: number = 1;

    month = new formattingSettings.ItemDropdown({
        name: "month",
        displayName: "Month",
        displayNameKey: "Visual_Month",
        items: fiscalYearOptions,
        value: fiscalYearOptions[0],
    });

    day = new formattingSettings.NumUpDown({
        name: "day",
        displayName: "Day",
        displayNameKey: "Visual_Day",
        value: 1,
        options: {
            minValue: {value: 1, type: powerbi.visuals.ValidatorType.Min},
            maxValue: {value: 31, type: powerbi.visuals.ValidatorType.Max},
        }
    });

    name: string = "calendar";
    displayName: string = "Fiscal Year";
    displayNameKey: string = "Visual_FiscalYear";
    slices = [this.month, this.day];
}

export class WeekDaySettingsCard extends Card {
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
        items: dayOptions,
        value: dayOptions[0],
    });


    name: string = "weekDay";
    displayName: string = "First Day of Week";
    displayNameKey: string = "Visual_FirstDayOfWeek";
    slices = [this.daySelection, this.day];
}

export class RangeHeaderSettingsCard extends Card {
    show: SimpleSlice<boolean> = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: true,
    });

    topLevelSlice = this.show;

    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font Color",
        displayNameKey: "Visual_FontColor",
        value: {value: "#777777"},
    });

    textSize = new formattingSettings.NumUpDown({
        name: "textSize",
        displayName: "Text Size",
        displayNameKey: "Visual_TextSize",
        value: TextSizeSettings.DefaultTextSize,
        options: {
            minValue: {value: TextSizeSettings.Min, type: powerbi.visuals.ValidatorType.Min},
            maxValue: {value: TextSizeSettings.Max, type: powerbi.visuals.ValidatorType.Max},
        }
    });

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

    fillUnselected = new formattingSettings.ColorPicker({
        name: "fillUnselected",
        displayName: "Unselected cell color",
        displayNameKey: "Visual_Cell_UnselectedColor",
        value: { value: CellsSettingsCard.FillUnselectedDefaultColor },
    });

    strokeColor = new formattingSettings.ColorPicker({
        name: "strokeColor",
        displayName: "Stroke color",
        displayNameKey: "Visual_Cell_StrokeColor",
        value: { value: "#333444" },
    });

    selectedStrokeColor = new formattingSettings.ColorPicker({
        name: "selectedStrokeColor",
        displayName: "Selected stroke color",
        displayNameKey: "Visual_Cell_SelectedStrokeColor",
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

    enableManualSizing = new formattingSettings.ToggleSwitch({
        name: "enableManualSizing",
        displayName: "Enable manual sizing",
        displayNameKey: "Visual_Cell_EnableManualSizing",
        value: false,
    });

    width = new formattingSettings.NumUpDown({
        name: "width",
        displayName: "Cell Width",
        displayNameKey: "Visual_Cell_Width",
        value: 40,
        options: {
            minValue: { value: 10, type: powerbi.visuals.ValidatorType.Min },
        },
    });

    height = new formattingSettings.NumUpDown({
        name: "height",
        displayName: "Cell height",
        displayNameKey: "Visual_Cell_height",
        value: 60,
        options: {
            minValue: { value: 10, type: powerbi.visuals.ValidatorType.Min },
        },
    });


    name: string = "cells";
    displayName: string = "Cells";
    displayNameKey: string = "Visual_Cells";
    slices = [
        this.fillSelected,
        this.fillUnselected,
        this.strokeColor,
        this.selectedStrokeColor,
        this.strokeWidth,
        this.gapWidth,
        this.enableManualSizing,
        this.width,
        this.height,
    ];
}

export class GranularitySettingsCard extends Card {
    show: SimpleSlice<boolean> = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: true,
    });

    topLevelSlice = this.show;

    scaleColor = new formattingSettings.ColorPicker({
        name: "scaleColor",
        displayName: "Scale color",
        displayNameKey: "Visual_ScaleColor",
        value: {value: "#000000"},
    });

    sliderColor = new formattingSettings.ColorPicker({
        name: "sliderColor",
        displayName: "Slider color",
        displayNameKey: "Visual_SliderColor",
        value: {value: "#AAAAAA"},
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

    topLevelSlice = this.show;

    displayAll = new formattingSettings.ToggleSwitch({
        name: "displayAll",
        displayName: "Display all",
        displayNameKey: "Visual_DisplayAll",
        value: true,
    });

    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font Color",
        displayNameKey: "Visual_FontColor",
        value: {value: "#777777"},
    });

    textSize = new formattingSettings.NumUpDown({
        name: "textSize",
        displayName: "Text Size",
        displayNameKey: "Visual_TextSize",
        value: TextSizeSettings.DefaultTextSize,
        options: {
            minValue: {value: TextSizeSettings.Min, type: powerbi.visuals.ValidatorType.Min},
            maxValue: {value: TextSizeSettings.Max, type: powerbi.visuals.ValidatorType.Max},
        }
    });

    name: string = "labels";
    displayName: string = "Labels";
    displayNameKey: string = "Visual_Labels";
    slices = [this.displayAll, this.fontColor, this.textSize];
}

export class ScrollAutoAdjustment extends Card {
    show: SimpleSlice<boolean> = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        displayNameKey: "Visual_Show",
        value: false,
    });

    topLevelSlice = this.show;

    name: string = "scrollAutoAdjustment";
    displayName: string = "Scroll Auto Adjustment";
    displayNameKey: string = "Visual_ScrollAutoAdjustment";
}

export class TimeLineSettingsModel extends Model {
    general = new GeneralSettings();

    cursor = new CursorSettingsCard();
    forceSelection = new ForceSelectionSettingsCard();
    weeksDeterminationStandards = new WeeksDeterminationStandardsSettingsCard();
    fiscalYearCalendar = new FiscalYearCalendarSettingsCard();
    weekDay = new WeekDaySettingsCard();
    cells = new CellsSettingsCard();
    rangeHeader = new RangeHeaderSettingsCard();
    granularity = new GranularitySettingsCard();
    labels = new LabelsSettingsCard();
    scrollAutoAdjustment = new ScrollAutoAdjustment();

    cards = [
        this.cursor,
        this.forceSelection,
        this.weeksDeterminationStandards,
        this.fiscalYearCalendar,
        this.weekDay,
        this.cells,
        this.rangeHeader,
        this.granularity,
        this.labels,
        this.scrollAutoAdjustment,
    ];

    setLocalizedOptions(localizationManager: ILocalizationManager) {
        this.setLocalizedDisplayName(weeksDeterminationStandardsOptions, localizationManager);
        this.setLocalizedDisplayName(fiscalYearOptions, localizationManager);
        this.setLocalizedDisplayName(dayOptions, localizationManager);
        this.setLocalizedDisplayName(granularityOptions, localizationManager);
    }

    public setLocalizedDisplayName(options: IEnumMember[], localizationManager: ILocalizationManager) {
        options.forEach(option => {
            option.displayName = localizationManager.getDisplayName(option.displayName.toString())
        });
    }
}
