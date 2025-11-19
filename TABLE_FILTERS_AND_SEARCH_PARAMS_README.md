# Table Filters and Search Parameters Implementation Guide

## Overview

The GRHOG application implements a sophisticated filtering and search system across all data tables (Bins, Cards/Clients, Transactions). This system provides consistent filtering capabilities with URL search parameter persistence and backend API integration.

## Table Header Filter System

### Field Types and Available Operations

The `TableHeaderFilter` component supports four main field types, each with specific operations:

#### 1. Text Fields (`type="text"`)
**Available Operations:**
- `is` - Exact match
- `is_not` - Not equal
- `contains` - Contains text
- `starts_with` - Starts with text
- `ends_with` - Ends with text

**Example Fields:**
- `binName` - Bin name
- `location` - Geographic location
- `name` - Client name
- `email` - Client email
- `phone` - Phone number

#### 2. Number Fields (`type="number"`)
**Available Operations:**
- `is` - Exact value
- `is_not` - Not equal
- `greater_than` - Greater than value
- `less_than` - Less than value
- `between` - Range between min and max

**Example Fields:**
- `storageLevel` - Bin fill percentage (0-100%)
- `usageCount` - Number of times bin was used
- `batteryLevel` - Battery percentage
- `accessCount` - Number of card accesses

#### 3. Boolean Fields (`type="boolean"`)
**Available Operations:**
- `is` - Exact boolean value
- `is_not` - Not equal boolean value

**Example Fields:**
- `active` - Connection status (true/false)
- `isActive` - Active status

#### 4. Date Fields (`type="date"`)
**Available Operations:**
- `is` - Exact date
- `is_not` - Not equal date
- `before` - Before date
- `after` - After date
- `between` - Date range

**Example Fields:**
- `clearedAt` - When bin was last cleared
- `createdAt` - Creation date
- `cardUsedAt` - When card was last used

## Search Parameter Implementation

### Frontend Filter Generation

The system generates structured search queries that are sent to the backend API. Each filter creates a search part in this format:

```typescript
// Text field example
`binName: {"contains": "BIN"}`

// Number field example  
`storageLevel: {"greater_than": "80"}`

// Boolean field example
`active: {"is": "true"}`

// Date field example
`clearedAt: {"after": "2024-01-01"}`

// Range example
`storageLevel: {"between": {"min": "70", "max": "90"}}`
```

### Search Parameter Format

Multiple filters are combined with semicolon separation:

```
"BIN001" active: {"is": "true"}; storageLevel: {"greater_than": "80"}; location: {"contains": "Ulaanbaatar"}
```

### URL Search Parameters

The system automatically persists filters in URL search parameters for:
- **Pagination**: `page`, `size`
- **Sorting**: `sortBy`, `sortDirection`
- **Search**: `search` (combined filter query)

## Implementation by Table Type

### 1. Bins Table (`bins-view.tsx`)

**Backend API Endpoint:** `/bins`
**Available Filter Fields:**
| Field                     | Type    |
| ------------------------- | ------- |
| `binName`                 | text    |
| `binId`                   | text    |
| `active`                  | boolean |
| `storageLevel`            | number  |
| `usageCount`              | number  |
| `batteryLevel`            | number  |
| `clearedAt`               | date    |
| `storageLevelBeforeClear` | number  |
| `lastEmptyFillLevel`      | number  |
| `penetrationsSinceLastClear` | number |
| `location`                | text    |
| `type`                    | text    |
| `serialNumber`            | text    |
| `installDate`             | date    |
| `lastEmptied`             | date    |
| `lastIoTActivity`         | date    |
| `initialBatteryCapacity`  | number  |
| `currentBatteryCapacity`  | number  |
| `storageHeight`           | number  |


### 2. Cards/Clients Table (`card-view.tsx`)

**Backend API Endpoint:** `/clients`
**Available Filter Fields:**
| Field             | Type   |
| ----------------- | ------ |
| `district`        | text   |
| `khoroo`          | number |
| `streetBuilding`  | text   |
| `apartmentNumber` | number |
| `type`            | text   |
| `name`            | text   |
| `cardId`          | text   |
| `cardIdDec`       | text   |
| `accessCount`     | number |
| `cardUsedAt`      | date   |
| `createdAt`       | date   |
| `updatedAt`       | date   |
| `phone`           | text   |
| `email`           | text   |
| `address`         | text   |
| `isActive`        | boolean |


### 3. Transactions/Bin Usages Table (`transactions-view.tsx`)

**Backend API Endpoint:** `/bin-usages`

**Available Filter Fields:**
| Field           | Type   |
| --------------- | ------ |
| `createdAt`     | date   |
| `cardId`        | text   |
| `cardIdDec`     | text   |
| `clientAddress` | text   |
| `clientType`    | text   |
| `clientName`    | text   |
| `clientPhone`   | text   |
| `binName`       | text   |
| `binId`         | text   |
| `storageLevel`  | number |
| `batteryLevel`  | number |
| `bin.id`        | number |


### 4. Bin Clearing Table (`BinClearing`)

**Backend API Endpoint:** `/clearings`
**Available Filter Fields:**
| Field                | Type   |
| -------------------- | ------ |
| `clearedAt`          | date   |
| `fillLevelBeforeClear` | number |
| `penetrationCount`   | number |
| `createdAt`          | date   |
| `bin.id`             | number |
| `bin.binName`        | text   |
| `bin.location`       | text   |
| `bin.binId`          | text   |


## Backend Implementation

### Search Query Parsing

The backend parses structured search queries by:
1. Splitting on semicolons (`;`)
2. Parsing each filter part as `field: {operation: value}`
3. Applying appropriate database queries based on field type and operation

### Database Query Generation

**Text Fields:**
```sql
-- Contains operation
LOWER(TRIM(field)) LIKE LOWER(CONCAT('%', TRIM(value), '%'))

-- Exact match
LOWER(TRIM(field)) = LOWER(TRIM(value))
```

**Number Fields:**
```sql
-- Greater than
field >= value

-- Less than  
field <= value

-- Between range
field >= minValue AND field <= maxValue
```

**Boolean Fields:**
```sql
field = booleanValue
```

**Date Fields:**
```sql
-- After date
field > dateValue

-- Before date
field < dateValue

-- Between dates
field >= startDate AND field <= endDate
```

## Usage Examples

### Frontend Filter Application

```typescript
// Apply multiple filters
const filters = [
  { field: 'binName', operator: 'contains', value: 'BIN' },
  { field: 'storageLevel', operator: 'greater_than', value: '80' },
  { field: 'active', operator: 'is', value: 'true' }
];

// Generates search query:
// "binName: {"contains": "BIN"}; storageLevel: {"greater_than": "80"}; active: {"is": "true"}"
```

### URL Search Parameters

```
/bins?page=0&size=20&search=binName%3A%20%7B%22contains%22%3A%20%22BIN%22%7D&sortBy=binName&sortDirection=asc
```

### Backend API Call

```typescript
// GET /api/bins?search=binName: {"contains": "BIN"}&page=0&size=20
const response = await fetch('/api/bins?search=' + encodeURIComponent(searchQuery));
```