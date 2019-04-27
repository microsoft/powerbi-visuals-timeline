## 2.1.0
* ADD: API was updated up to 2.5.0
* ADD: "Scale size auto adjustment" option was removed
* ADD: Granularity legend can be disabled now
* ADD: Titles for granulas were added
* FIX: Scalability was improved
* FIX: Fiscal year is displayed correctly now

## 2.0.2
* Allows to select any date range even if Force Selection options are selected

## 2.0.1
* Fixes race condition that happened if we change granularity and select any date range. For users this issue looked like blinking issue

## 2.0.0
* Updates API version to 2.3.0
* Converts code to ES2015 syntax
* Uses PBIVIZ 3.x.x
* Gets rid of Interactive Utils
* Uses jsonFilter to restore a filter
* Updates TSLint flow and rules

## 1.10.3
* FIX: unexpected exception if user clears selection

## 1.10.2
* FIX: looping when selection is cleared or whole period is chosen

## 1.10.1
* FIX: filter applying from other visuals

## 1.10.0
* ADD: high contrast mode

## 1.9.0
* ADD: possibility to disable certain granularities for user access (granularity section on format panel)
* ADD: support of Sync Slicers and API 1.13
* ADD: support of filterState property that makes a property of a part of filtering

## 1.8.3
* FIX: Year format correction was improved by using literals

## 1.8.2
* FIX: Year format was corrected

## 1.8.1
* FIX: auto scrolling focus for selected period didn't work in Edge and broke the layout

## 1.8.0
* Added localization for all supported languages

## 1.7.0
* ADD: new option to enable auto scrolling focus for selected period
* ADD: if force selection is activated user selection doesn't work
* FIX: blinkig issue was resolved
* FIX: behaviour of option to switch off first day of week was corrected
* FIX: applying of force selection was corrected for granularity changing case

## 1.6.6
* Added option to switch off first day of a week
* Fixed force selection of latest available period

## 1.6.5
* Added new localization strings
* Increased API version to 1.11.0

## 1.6.4
* Fix issue with incorrect selection after granularity change
* Increased minimum width of cells for weeks, months, quarters and years
* Changed title of week granularity

## 1.6.3
* Fixed bug with incorrect week numbers
* Fixed bug with incorrect force selection of current period with week granularity

## 1.6.2
* Added Power BI Bookmarks support

## 1.6.1
* FIX: Issue with incompatibility of selection with previous version

## 1.6.0
* NEW: Added force selection setting for latest available date
* NEW: Added force selection setting for current period
* FIX: Scroll bars don't display correctly

## 1.5.2
* UPD: API was updated to version 1.9
* FIX: Mutual selection (when two timeline slicers apply filters to each other) was corrected and can be clear for now.

## 1.5.1
* FIX. Filtering doesn't work when Hierarchy mode of showing date field was chosen

## 1.5.0
* Added setting to toggle between displaying all labels, or only for selected granularity

## 1.4.9
* FIX. Max date issue when date range is not specified (all dates)

## 1.4.8
* FIX. Cross filtering didn't work if data source was renamed after the visual was added

## 1.4.7
* FIX. Horizontal scrolling was repaired

## 1.4.6
* FIX. Layout offsets was corrected

## 1.4.5
* Layout fixes that repair horizontal scrolling and vertical space between legend and scale

## 1.4.4
* Scale auto sizing is possible to enable/disable via option parameter (disabled by default)

## 1.4.3
* Added fixed top legend

## 1.4.2
* Fixed cross filtering selection

## 1.4.1
* Fixed selection of "selected range + 1 day" issue
