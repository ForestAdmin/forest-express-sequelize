# Change Log

## [Unreleased]
### Added
- Segments - Smart Segments can be created to define specific records subsets.

## RELEASE 0.4.5 - 2016-12-05
### Added
- Date Filters - Date filters operators are now based on the client timezone.

### Changed
- Packages - Remove useless node-uuid package.

### Fixed
- Pie Charts - Fix potential ambiguous groupBy field name.
- Search - Fix broken search on collections with associations using UUID primary keys.

## RELEASE 0.4.4 - 2016-11-25
### Added
- Chart Filters - Support chart filters on belongsTo associations.
- Pie Charts - Support group by on belongsTo associations.
- Deserialization - Expose the Deserialization module to the API.
- Schemas - Expose the Schemas module to the API.
- Errors Tracking - Catch errors on app launch / apimap generation / liana session creation.

### Fixed
- Resource Creation - Fix the creation of records having NOT NULL association constraints in the database.

## RELEASE 0.4.3 - 2016-11-17
### Fixed
- Custom Actions - Fix missing actions for Smart Collections.

## RELEASE 0.4.2 - 2016-11-16
### Fixed
- Has Many Getter - Fix the missing data for belongsTo fields while retrieving «has many» associated records.

## RELEASE 0.4.1 - 2016-11-11
### Added
- Field Type - Support Time field type.
- Models - Support resources/charts queries on models having a defaultScope configuration.
- Model - Support model "field" option to specify a database column name.
- Search - Fix global search specific to model sequelize definition.

### Fixed
- Records Index - Fix the duplicate records displayed on the front if the ids are hidden in the list.

## RELEASE 0.3.7 - 2016-11-06
### Changed
- BelongsTo - Better support belongsTo relationships (as, foreign keys, etc.).

### Fixed
- BelongsTo - Fix belongsTo retrieval if the model and association names are different (ex: Capitalized model names).

## RELEASE 0.3.6 - 2016-11-04
### Added
- Schema - Support UUID field type.

### Changed
- Performance - Request only displayed fields in the records list.

### Fixed
- Search - Fix the search on collections with uuid column as a primaryKey.

## RELEASE 0.3.5 - 2016-10-28
### Changed
- Filters - Add the new date filters protocol.

## RELEASE 0.3.4 - 2016-10-14
### Fixed
- Line Charts - Fix the line charts display if no records are found.
- Value Chart - Fix previous period count regression due to filterType introduction.

### Added
- Smart field - Enable search on smart fields.

## RELEASE 0.3.3 - 2016-10-11
### Added
- ES5 - Secure the ES5 compatibility with a git hook.

### Fixed
- BelongsTo - Fix the belongsTo associations on record creation.
- ES5 - Fix ES5 compatibility.

## RELEASE 0.3.2 - 2016-09-30
### Fixed
- HasMany - Fix the hasMany fetch when an integration is set

## RELEASE 0.3.1 - 2016-09-30
### Fixed
- Filter - Support multiple filters on the same field.

## RELEASE 0.3.0 - 2016-09-30
### Added
- Filters - Users want the OR filter operator with their conditions (restricted to simple conditions).

### Fixed
- Record Update - Fix the potential dissociations on record update.

## RELEASE 0.2.39 - 2016-09-29
### Fixed
- Pagination - Fix the hasMany number of records.

## RELEASE 0.2.38 - 2016-09-29
### Fixed
- Close.io - Fix the search regression.

## RELEASE 0.2.37 - 2016-09-28
### Added
- Integration - Add the Close.io integration

## RELEASE 0.2.36 - 2016-09-26
### Added
- Filters - Users want to have "From now" and "Today" operators.

### Fixed
- Search - Fix the search when an association field comes from an integration.
