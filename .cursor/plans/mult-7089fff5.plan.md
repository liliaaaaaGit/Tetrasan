---
name: Fix Holiday Pink Background in PDF Tag Column
overview: ""
todos: []
---

# Fix Holiday Pink Background in PDF Tag Column

## Problem Analysis

The holiday pink background worked in the old code (commit `2e7cdef`) but stopped working after we changed the Tag cell rendering.

**Old working code:**

- Used `isHoliday(d.dateISO, holidaysSet)` function call
- Applied style via `styles.colDayHoliday` (which has `backgroundColor: '#ffc0cb'`)
- Rendered as `<Text style={[styles.td, tagCellStyle]}>`

**Current broken code:**

- Uses `d.dateISO.split('T')[0] `then `holidaysSet.has(normalizedDate)`
- Applies `backgroundColor` directly to style object
- Renders manually as `<View>` with style

## Root Cause

The issue is likely:

1. **Date format mismatch**: `d.dateISO` is created as `${year}-${pad2(month)}-${pad2(day)}` (already YYYY-MM-DD), but we're doing `.split('T')[0]` which is unnecessary and might cause issues
2. **Holiday detection method**: We switched from `isHoliday()` function (which normalizes internally) to direct `holidaysSet.has()` which might have format differences
3. **Style application**: The old code used `styles.colDayHoliday` which is a StyleSheet style, but we're applying backgroundColor directly which might not work the same way

## Solution

**Option 1 (Recommended): Use `isHoliday()` function like the old code**

- Change `isHolidayDate = holidaysSet.has(normalizedDate)` back to `isHolidayDate = isHoliday(d.dateISO, holidaysSet)`
- This matches the old working code exactly
- The `isHoliday()` function handles date normalization internally

**Option 2: Fix date normalization**

- Ensure `normalizedDate` exactly matches what's in `holidaysSet`
- Add debug logging to compare `d.dateISO`, `normalizedDate`, and `holidaysSet` contents
- Verify `holidaysSet` contains dates in the exact format we're checking

## Implementation Steps

1. **In `app/api/pdf/monthly-report/route.ts`**, around line 463:

- Change from: `const isHolidayDate = holidaysSet.has(normalizedDate);`
- Change to: `const isHolidayDate = isHoliday(d.dateISO, holidaysSet);`
- Remove the `normalizedDate` variable if it's only used for holiday detection
- Keep the manual Tag cell rendering (that part works)

2. **Add debug logging** (temporary):

- Log `d.dateISO`, `isHolidayDate`, and whether `holidaysSet.has(d.dateISO)` returns true
- This will help verify the fix works

3. **Test**:

- Generate PDF for January 2026
- Verify day 1 (2026-01-01, Neujahr) shows PINK background
- Verify other holidays show PINK
- Verify weekends show BLUE

## Files to Change

- `app/api/pdf/monthly-report/route.ts` - Change holiday detection to use `isHoliday()` function

## Why This Will Work

The old code used `isHoliday(d.dateISO, holidaysSet)` and it worked. The `isHoliday()` function in `lib/date-utils.ts` handles date normalization internally and works with Sets, Maps, and Records. By reverting to this approach, we match the exact pattern that was working before.