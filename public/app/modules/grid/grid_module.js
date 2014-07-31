/* global define, app, QueryEngine, $ */
// Grid Module
// -----------
define([
    'underscore',
    'knockout',
    'backbone',
    'base/view',
    'modules/grid/grid_wrapper_view',
    'modules/grid/grid_header_view',
    'modules/grid/grid_row_view',
    'modules/grid/grid_footer_view',
    'modules/grid/grid_pagination_view',
    'collectionview',
    'spinner',
    'obscura'
], function(_, ko, Backbone, View, Wrapper, Header, Row, Footer, PaginationView, CollectionView, Spinner, Obscura) {
    "use strict";

    var GridModule = Backbone.Model.extend( /** @lends Grid.prototype */ {
        /**
         * @class Grid <p>The grid module allows for easy rendering and manipulation of collections.  The default display
         * renders as a grid, but by overriding a template/view (header, footer, row, wrapper), any appearance can be achieved (such as list views).
         * This grid module integrates with Breeze data without any additional configuration.  This module is expecting a collection
         * of similar models (each model possesses the same attributes).  By default, columns will
         * be derived from ready a collection model's entityType dataproperties.</p>
         * <p><a href="tutorials/grid_module.html">View Docco</a></p><ul>
         * <li>TODO : Appears to be a bug with pagination offset while filtering</li>
         * <li>TODO : Add support for sorting on date/time</li>
         * <li>TODO : Add filtering interface for enums/dates, update filtering UI</li>
         * <li>TODO : Hide/show columns widget (available currently via api)</li>
         * <li>TODO : Add support for loading spinners</li>
         * @example
         * // Rendering a grid within a controller action.
         * var grid = new Grid({
         *     resource: 'Activities',
         *     row: myRowView,
         *     columns: {
         *         active : ['Physician','MemberName','Service','Status']
         *     }
         * });
         *
         * this.setView(grid.getView());
         *
         * @augments Backbone.Model
         * @constructs
         * @requires Backbone, Backbone.QueryCollection
         * @param {Object} [options] - Backbone.Model options, pass in any of the properties below as a param to override the property.
         * @property {View} [row] - A Backbone.View to use for each item in the collection view
         * @property {View} [wrapper] - A Backbone.View to use as the collection view Wrapper
         * @property {View} [header] - A Backbone.View to render in the '.header'
         * @property {View} [footer] - A Backbone.View to render in the '.footer'
         * @property {Object} [columns] - Object Defining default columns to render, columns to rename, and custom columns
         * @property {Array.<String>} [columns.active] - Columns to be displayed/active by default. Also defines column order.
         * @property {Object} [columns.rename] - Key/Value pair object where key = property name and value = related column header displayname
         * @property {Array.<Object>} [columns.custom] - Array of object containing information for custom columns headers to add
         * @property {String} columns.custom.name - Display name for the column
         * @property {String} columns.custom.prop - viewModel property (from the row's viewModel) related to this custom property
         * @property {String} [title] - Title to be displayed if title binding used in wrapper template
         * @property {String} [description] - Description to be displayed if description binding used in wrapper template
         * @property {Number} [limit=7] - The number of columns to display by default
         * @property {Array.<String>} [exclude] - Properties to exclude from available columns. By default contains Id, id, and _id
         * @property {QueryEngine} [collection] - The collection to be consumed for displayed data (only optional if this.get('resource'))
         * @property {Object} [defaultSort] - Object containing default sort data (empty by default)
         * @property {String} defaultSort.prop - Entity property to sort on
         * @property {String} [defaultSort.type] - Entity property type (if empty the type will be discovered)
         * @property {String} [defaultSort.dir=desc] - Direction for the sort 'asc' or 'desc'
         * @property {Object} [sortBy] - The currently active sort properties
         * @property {String} sortBy.prop - Entity property to sort on
         * @property {String} [sortBy.type] - Entity property type (if empty the type will be discovered)
         * @property {String} [sortBy.dir=desc] - Direction for the sort 'asc' or 'desc'
         * @property {Number} [pageSize=10] - The number of records to display per page
         * @property {Number} _inlineCount - The total number of records in the database
         * @property {Number} _offset - The current page index
         * @property {Object} _entityInfo - Entity information for Entities in this collection
         * @property {String} [resource] - The resource for entities associated with this collection (only optional if no queries required)
         * @property {Number} [take=30] - The amount of records to initialize the grid with (take from Breeze)
         * @property {Object} [predicate] - A breeze predicate to apply to ALL server communications
         * @property {Object} manager - Breeze entity manager to use for queries
         * @property {String} [select] - Breeze select parameter
         * @property {Object} [params] - Parameters to append to a resource URL (used for custom calls). Grid will assume collection complete on fetch complete. Key/value (value can be a function)
         * @property {String} [expand] - Breeze expand parameter
         * @property {Object} _filter - Internally tracks filter usage for breeze
         * @property {Object} _filter - Internally tracks filter usage for breeze
         * @property {Boolean} refresh - Always refresh on _fetch (good for debug or if the collection may frequently change server side)
         * @property {Number} _filteredCount - the current size of associated collection (filtered models)
         * @property {Backbone.Collection} _collection - only applied if a simple backbone collection passed to grid, used to sync grid
         * query engine with original collection
         * @property {Array.<String>} [fetchEvents=['location:change']] - Describes events to subscribe to that will refresh grid data (defaults with location:change)
         * @property {Boolean} [sortEnabled=true] - Will disable sorting across the grid.
         * @property {Boolean} [selectable=true] - Disable/enable row select
         * @property {Boolean} [selectMultiple=true] - Disable/enable multiselect
         * @property {Boolean} [emptyListCaption="No data to display."] - Enables collection sort
         * @property {String} [glyphicon] - glyphicon to display with title
         * @property {Boolean} [rowActions=false] - Set to true to reserve a column header on default wrapper template for row action column
         * @property {Boolean} _fetching - Returns true if grid is in the process of a fetch
         * @property {Function} fetchCallback - callback to execute after a fetch
         */
        initialize: function(attributes, options) {
            _.bindAll(this,
                '_buildLayout', 'getView', '_buildViewModel', '_loadEntityData', '_fetch',
                '_enableSort', '_disableSort',
                '_afterRender', '_sortHandler', '_sortEngine', '_applyFilter', '_predicateFilter', 'filter', '_filter',
                'updateViewModels', '_buildColumns', 'addColumns', 'removeColumns', 'render', 'resetColumns', '_readViewModelProperties');



            // Setup module defaults / options
            // -------------------------------

            // Setup the collection
            var collection = this.get('collection');
            var liveCollection = this.get('liveCollection');
            var resource = this.get('resource');
            if (!collection) {
                // If no collection or resource, we will just setup a default queryEngine Collection 
                if (!resource) collection = this.set('collection', new QueryEngine.createLiveCollection());
                else {
                    // If a resource exists, we setup a childCollection from the API.
                    var shortName = app.api.manager.metadataStore.getEntityTypeNameForResourceName(resource);
                    // shortName may be undefined or null if issue with metadata, fallback to local if so
                    if (shortName) {
                        // If grid is listeniing for location:change, get a LocationCollection instead
                        collection = app.api.getChildCollection(shortName.split(':')[0]).query();
                        this.set('collection', collection);
                        liveCollection = true;
                    } else {
                        // If resource not found, fallback to a local collection
                        collection = new QueryEngine.createLiveCollection();
                        this.set({
                            resource: null,
                            collection: collection
                        });
                    }
                }
            }
            // If a predicate was passed, we are using a breeze entity collection,
            // to ensure our data is clean (we cannot be 100% sure if the grid is using
            // a collection inherited from app.api collections), we apply a filter based
            // on our predicate to our collection.
            //if (liveCollection) collection.setFilter('predicate', this._predicateFilter);
            collection.setFilter('predicate', this._predicateFilter);
            collection.grid = this;

            // Populate and sort the collection
            collection.query();
            this._enableSort(collection);

            // This queryEngine will be used in the collection view
            // Obscura is used as queryEngine is read only and used for pagination, etc.
            var queryEngine = new Obscura(collection, {
                perPage: this.get('pageSize')
            });

            // Setup default search filter by name for queryEngine
            queryEngine.filterBy('search', this._filter);

            // Setup default view constructors, collection references and details
            this.set({
                header: (this.get('header')) ? this.get('header') : Header,
                wrapper: (this.get('wrapper')) ? this.get('wrapper') : Wrapper,
                row: (this.get('row')) ? this.get('row') : Row,
                queryEngine: queryEngine,
                schema: (this.get('schema')) ? this.get('schema') : {},
                _inlineCount: collection.length,
                _filteredCount: queryEngine.getFilteredLength(),
                sortBy: this.get('defaultSort')
            }, {
                silent: true
            });

            // Setup layout.  
            this._buildLayout();

            // Setup Event Listeners
            // ---------------------

            // Synchronie queryEngine not accessed directly, set pageSize on grid
            // This is done since grid understands the context of result set given inlineCount,
            // whereas queryEngine (obscura) only sees what is available locally
            this.on('change:pageSize', function() {
                this.get('queryEngine').setPerPage(this.get('pageSize'));
                this.set('_page', 0);
                this.set('_fetchedPages', [0]);
                this._fetch();
            }, this);

            // Keep filteredCount inline with inlineCount
            this.on('change:_inlineCount', function() {
                if (_.isEmpty(this.get('_filters'))) this.set('_filteredCount', this.get('_inlineCount'));
                else {
                    var filteredCount = this.get('queryEngine').getFilteredLength();
                    if (this.get('_filteredCount') < filteredCount) this.set('_filteredCount', filteredCount);
                }
            }, this);

            // Fire sort engine when sort is changed
            this.on("change:sortBy", this._sortHandler);

            // We want to make sure collection.length is always up to date for pagination
            collection.on('add remove reset', function() {
                var filteredLength = this.get('queryEngine').getFilteredLength();
                if ((this.get('_inlineCount') < filteredLength) || (filteredLength == 0)) this.set('_inlineCount', filteredLength);
            }, this);

            // This looks at breeze entityAspect or model.attributes to define columns and sort/filter types
            if (collection.models.length === 0) collection.on("add reset", this._loadEntityData);
            else this._loadEntityData({
                silent: true
            });

            // If using location data, make sure to sync when location changes.
            // Using locationCollection will keep up to date, but we need an initial
            var _this = this;
            var fetchEvents = this.get('fetchEvents');
            $.each(this.get('fetchEvents'), function(key, value) {
                var fetchEvent = (value.event) ? value.event : value;
                if (value.fn) value.fn = _.bind(value.fn, _this);
                _this.listenTo(Backbone.EventBroker, fetchEvent, function(event) {
                    if (value.fn) return value.fn(event);
                    else this._fetch({
                        refresh: true
                    });
                }, _this);
            });
            /*
            for (var f = 0, ff = fetchEvents.length; f < ff; f++) {
                var eventObj = fetchEvents[f];
                var fetchEvent = (eventObj.event) ? eventObj.event : eventObj;
                if (eventObj.fn) _.bind(eventObj.fn, this);
                this.listenTo(Backbone.EventBroker, fetchEvent, function(event) {
                    if (eventObj.fn) return eventObj.fn(event);
                    else this._fetch({
                        refresh: true
                    });
                }, this);
            };
            */

            // Fire internal initializers
            // --------------------------



            // Setup observables for hide/show
            this._readViewModelProperties();

            if (queryEngine.getFilteredLength() > 0) this.set('_initializing', false);

            // Collection setup, fire out query to make sure data up to date
            this._fetch({
                refresh: true
            });
        },

        defaults: {
            // Display properties
            title: null,
            description: '',
            glyphicon: 'glyphicon-list',

            // Column configuration
            limit: 7,
            //exclude: ['id', '_id', 'Id'],
            exclude: [],
            columns: {},
            rowActions: false,
            hideShowColumns: true,
            viewModelProperties: new Backbone.Collection([]),

            // Sorting properties
            defaultSort: {
                prop: 'Id',
                type: 'Number',
                dir: 'desc'
            },
            sortBy: {
                prop: '',
                type: 'string',
                dir: ''
            },
            sortEnabled: true,

            // Pagination properties
            pageSize: 10,

            // Collectionview properties
            selectable: true,
            processKeyEvents: false,
            selectMultiple: true,
            sortable: false,
            emptyListCaption: "No data to display.",
            sortableOptions: {},

            // Fetch/Breeze properties
            // event, fn
            fetchEvents: [],
            take: 30, // Initial fetch
            buffer: 30, // How many to fetch ahead of current page
            manager: app.api.manager,

            // Internal properties
            _initializing: true,
            _dataProperties: new Backbone.Collection([]),
            _columns: new Backbone.Collection([]),
            _inlineCount: 0, // this will need to be an updating figure
            _filteredCount: 0, // total number in teh filtered collection
            _offset: 0,
            _page: 0,
            _fetchedPages: [0],
            _entityInfo: {},
            _filters: {},
            _filterPredicate: null,
            _fetching: false,
        },

        // Module API functions 
        // --------------------

        // The following functions are designed to be public functions to be used by applicable controllers and views.

        movePage: function(count) {
            var page = this.get('_page') + count;
            var obscura = this.get('queryEngine');

            // If the next page is requested, and we are buffering for the next page, movepage
            if ((count == 1 && obscura.hasNextPage()) &&
                (this.get('take') > this.get('pageSize'))) obscura.movePage(count);

            this.setPage(page, count);
        },

        setPage: function(page, count) {
            // If the page is the next page in sequence, run through the movePage
            if ((page == (this.get('_page') + 1)) && !count) return this.movePage(1);
            var obscura = this.get('queryEngine');
            var fetched = this.get('_fetchedPages');
            this.set('_page', page);

            // Do we have a full collection, and page is unfetched
            if ((obscura.getFilteredLength() < this.get('_inlineCount')) &&
                ($.inArray(page, fetched) < 0)) {

                // We do not have a full collection and we have not fetched this page
                this._fetch({
                    callback: _.bind(function(data) {
                        var index = this.get('collection').indexOf(data[0]);
                        var pageSize = this.get('pageSize');
                        if (!count) {
                            obscura.setPage(Math.ceil((index + 1) / pageSize) - 1);
                            this.set('_page', page);
                        }
                        fetched.push(page);
                    }, this)
                });
            } else {
                obscura.setPage(page);
                this._fetch();
            }
        },

        /**
         * Update which columns are to be editable in the grid
         * @param {Array} columns - columns to make editable in the grid.  If empty or null, all no columns will be editable.
         * @param {String} columns - If 'all' is passed, all properties will be enabled
         */
        editColumns: function(editable) {
            var columns = this.get('_columns').models;
            for (var i = 0; i < columns.length; i++) {
                if (editable == 'all' || $.inArray(columns[i].get('prop'), editable) >= 0) columns[i].set('editable', true);
                else columns[i].set('editable', false);
            }
        },

        /**
         * Resets current columns to passed in selection of columns
         * @param {Array.<String>} columns - columns to set on the grid
         */
        resetColumns: function(columns) {
            this.get('_columns').reset([]);
            this.addColumns(columns);
        },

        /**
         * Remove columns
         * @param {Array} cols - An array of column names to be removed
         */
        removeColumns: function(columns) {
            if (!columns) return this.get('_columns').reset([]);
            columns = (!_.isArray(columns)) ? [columns] : columns;
            var _columns = this.get('_columns');
            for (var c = 0; c < columns.length; c++) {
                _columns.remove(_columns.findWhere({
                    prop: columns[c]
                }));
            }
        },

        /**
         * Used in this._buildViewmodel to add custom columns to the viewModel
         * @private
         * @params {Array} columns - Array of objects or string property names
         * @params {Boolean} [columns.sort] - Boolean if this is a property being sorted on
         * @params {Boolean} [columns.filter] - Boolean if this is a property being filtered
         * @params {String} [columns.type] - Data type
         * @params {String} [columns.value]
         * @returns {_columns} - this.get('_columns')
         */
        addColumns: function(columns) {
            var _columns = this.get('_columns');
            var sortOn = this.get('sortBy').prop;
            var config = this.get('columns');
            // By default cols are named by props, this allows custom col names
            var rename = (config.rename) ? _.keys(config.rename) : [];
            var editable = (config.editable) ? ((_.isArray(config.editable)) ? config.editable : true) : [];

            if (!_.isArray(columns)) columns = [columns];
            for (var c = 0; c < columns.length; c++) {
                if (typeof columns[c] === 'object') _columns.add(columns[c]);
                else {
                    var prop = columns[c];
                    var col = {};
                    // Check for a prop rename, if not by default prettify the property name
                    col.name = (rename && $.inArray(prop, rename) >= 0) ? config.rename[prop] : prop.replace(/([a-z])([A-Z])/g, '$1 $2');
                    col.prop = prop;
                    col.sort = (prop == sortOn) ? true : false;
                    col.filtered = false;
                    col.value = null;
                    col.type = this._getDataType(prop);
                    col.active = true;
                    col.editable = (editable === true) ? true : ($.inArray(prop, editable) >= 0);
                    _columns.add(col);
                }
            }
            return this.get('_columns');
        },

        /**
         * Get the viewModel for the grid (includes columns etc).  If the viewModel is not constructed yet, it will be built.
         * (This is an alternative to this.get('viewModel') that always will return the viewModel)
         * @returns {Object} viewModel - Grid viewModel
         */
        getViewModel: function() {
            if (!this.get('viewModel')) this._buildViewModel();
            return this.get('viewModel');
        },

        /**
         * Helper function for retrieving the grid's layout/view
         * @returns {View} this.grid.get('layout')
         */
        getView: function() {
            return this.get('layout');
        },

        /**
         * Shortcut to the grid layout's render function.  Renders the grid module layout/views.
         */
        render: function() {
            var layout = this.get('layout');
            layout.render();
        },

        /**
         * Update/build viewModels and render.  Call this when the viewModel needs to be manually updated.
         * This may be deprecated. Cant see a reason this might be used with the recent updates to rendering in the app.
         * @param (Boolean) render - If true, re-render the grid
         */
        updateViewModels: function(render) {
            this.get('layout').updateViewModel();
            this.get('header').updateViewModel();
            this.get('paging').updateViewModel();
            if (this.get('zone1')) this.get('zone1').updateViewModel();
            if (this.get('footer')) this.get('footer').updateViewModel();

            if (render) {
                // Cleanup old views
                this.get('layout').removeView();
                this.render();
            }
        },

        /**
         * Dispose the grid, its data, its views, and viewModels
         * @param {Boolean} cleanup - If true, will not remove views (used by cleanup function on layout remove)
         */
        dispose: function(cleanup) {
            if (this._disposed) return true;

            if (this.get('collectionView')) this.get('collectionView').remove();
            if (!cleanup) {
                if (this.get('layout')) this.get('layout').remove();
            }

            var collection = this.get('collection');
            var queryEngine = this.get('queryEngine');

            kb.release(this.get('viewModel'));

            var _this = this;
            this.stopListening();
            $.each(this.attributes, function(key, value) {
                var get = _this.get(key);
                if (key != 'layout') {
                    if (get && get.off) get.off();
                    if (get && get.stopListening) get.stopListening();
                    if (get && get.dispose) get.dispose();
                    //else if (get && get.remove) get.remove();
                }
            });
            this.off();
            collection.live(false).reset([]);
            queryEngine.destroy();
            this.clear();
            this._disposed = true;
        },

        /**
         * Get currently selected models
         * @param {Object} [args] - Criteria by which to return selected models, ex { by : "view"},  { by : "id"} will return ids
         * @param {Object} [args.by] - Can be "id", "cid", "offset", "view"
         * @returns {Array} Selected Models
         */
        getSelected: function(args) {
            return this.get('collectionView').getSelectedModels(args);
        },

        /**
         * Set which models are selected
         * @param {Object} [args] - Criteria by which to return selected models, ex { by : "view"},  { by : "id"} will return ids
         * @param {Object} [args.by] - Can be "id", "cid", "offset", "view"
         * @returns {Array} Selected Models
         */
        setSelected: function(args) {
            return this.get('collectionView').setSelectedModels(args);
        },

        // Internal Methods 
        // ----------------

        _enableSort: function(toSort) {
            var collection = (toSort) ? toSort : this.get('collection');
            collection.setComparator(this._sortEngine);
            collection.sortCollection();
            collection.trigger('reset');
        },

        _disableSort: function(disable) {
            var collection = (disable) ? disable : this.get('collection');
            collection.setComparator(null);
        },

        /**
         * Retreives entities from the server by constructing breeze queries based on existing model properties.  Will return false
         * if no resource is available.
         * @private
         * @param {Object} [args] - Key/Value pair object with function arguments
         * @param {Boolean} [args.refresh] - Will force a breeze query to execute even if the local copy appears to be complete
         * @param {Function} [args.callback] - function to fire after fetch resolves
         */
        _fetch: function(args) {
            // Update to add predicate for current location if applicable
            var resource = this.get('resource');
            var refresh = (args && args.refresh || this.get('refresh')) ? true : (this.get('collection').length < this.get('_inlineCount'));

            if (resource && refresh) {
                var query, params = this.get('params');
                if (params) {
                    var resourceString = resource + '?';
                    $.each(params, function(key, value) {
                        var _value = (_.isFunction(value)) ? value() : value;
                        resourceString += '&' + key + '=' + _value;
                    });
                    query = app.api.breeze.EntityQuery.from(resourceString)
                        .using(this.get('manager'));
                } else {
                    // We have a resource and are not working with a complete local collection, build our query
                    query = app.api.breeze
                        .EntityQuery
                        .from(resource)
                        .using(this.get('manager'))
                        .inlineCount()
                        .take(this.get('take'));
                    // when going to pagination, take will need to take into account the current page index as well (take more perhaps)

                    var predicate = this.get('predicate');
                    if (predicate) query = query.where(predicate);

                    // Apply predicates if applicable
                    var _filters = this.get('_filters');
                    if (!_.isEmpty(_filters)) {
                        /*
                        $.each(_filters, function(key, value) {
                            query = query.where(value);
                        });
                        */
                        query = query.where(this._assemblePredicate(this.get('_filters')));
                    }

                    // Apply order by if applicable
                    var sort = this.get('sortBy');
                    sort = (sort && sort.prop === '') ? this.get('defaultSort') : sort;
                    if (sort && sort.prop) {
                        sort = (sort.dir === 'desc') ? sort.prop + ' desc' : sort.prop;
                        query = query.orderBy(sort);
                    }

                    // Apply expand argument if applicable
                    var expand = this.get('expand');
                    if (expand) query = query.expand(expand);

                    // Apply select argument if applicable
                    var select = this.get('select');
                    if (select) query = query.select(select);

                    var page = this.get('_page');
                    if (page) {
                        var skip = this.get('_page') * this.get('pageSize');
                        if (skip > 0) query = query.skip(skip);
                    }
                }

                var _this = this;
                this.set('_fetching', true);
                this._disableSort();
                app.api.get(query, {
                    refresh: true,
                    callback: function(data) {
                        if (_.isEmpty(_filters)) _this.set('_inlineCount', (data.inlineCount) ? data.inlineCount : (data.results && data.results.length) ? data.results.length : 0);
                        else _this.set('_filteredCount', (data.inlineCount) ? data.inlineCount : (data.results && data.results.length) ? data.results.length : 0);

                        // If using a 'resource', this should populate by default, and the adds will fail
                        // as they will already be existing in the collection.  However, if this grid does 
                        // not use a 'resource', then we will need to manually update the collection.
                        // However, provide two alternative callback methods to handle this before settling
                        // on a default method.
                        var callback = _this.get('fetchCallback');
                        if (callback) callback(data.results);
                        else if (args && args.callback) args.callback(data.results);
                        else if ((_this.get('forceFetchAdd')) ||
                            (!_this.get('resource') && data.results && data.results.length > 0)) _this.get('collection').add(data.results);

                        _this.set({
                            _initializing: false,
                            _fetching: false,
                        });
                        _this._enableSort();


                    }
                });
            }
        },

        /**
         * Gets datatype for a property. Under construction. TODO: finish this method for date/time sorting/filtering etc.
         * @private
         * @param {String} prop - property name
         * @returns {String} data type
         */
        _getDataType: function(prop) {
            // First check if dataType is accessible from entityInfo
            var entityInfo = this.get('entityInfo');
            if (entityInfo && entityInfo.entityType && entityInfo.entityType.dataProperties) {
                for (var d = 0; d < entityInfo.entityType.dataProperties.length; d++) {
                    if (entityInfo.entityType.dataProperties[d].name == prop)
                        return entityInfo.entityType.dataProperties[d].dataType.name;
                }
            }
            // Default to string if not found
            return 'string';
        },

        /**
         * Builds/Updates column information (to be consumed by wrapper and row)
         * @private
         */
        _buildColumns: function() {
            var config = this.get('columns');
            var filters = this.get('_filters');
            // By default cols are named by props, this allows custom col names
            var rename = (config.rename) ? _.keys(config.rename) : [];
            // Columns to enable for the grid
            var active = (config.active) ? config.active : this.get('_dataProperties').models;
            // Array to hold new column objects to be passed to grid
            var _columns = [];
            var editable = (config.editable) ? ((_.isArray(config.editable)) ? config.editable : true) : [];

            var sortOn = this.get('sortBy').prop;
            var exclude = this.get('exclude');

            for (var c = 0; c < this.get('limit'); c++) {
                if (!active[c]) break; // Default active set below limit.

                var prop = (typeof active[c] == 'string') ? active[c] : active[c].get('name');

                if ($.inArray(prop, exclude) < 0) {
                    // Setup proper reference to prop, could be working a flat array or entity dataproperties
                    var col = {};

                    // Check for a prop rename, if not by default prettify the property name
                    col.name = (rename && $.inArray(prop, rename) >= 0) ? config.rename[prop] : prop.replace(/([a-z])([A-Z])/g, '$1 $2');
                    col.prop = prop;
                    col.sort = (prop == sortOn) ? true : false;

                    if (filters[prop]) {
                        col.filtered = true;
                        col.value = this._getPredicateString(predicate);
                    } else {
                        col.filtered = false;
                        col.value = null;
                    }

                    col.active = true;
                    col.type = this._getDataType(prop);
                    // Will be empty array if not passed (which will validate with inArray), or will be true if 'all'
                    col.editable = (editable === true) ? true : ($.inArray(prop, editable) >= 0);
                    _columns.push(col);
                }
            };

            this.get('_columns').reset(_columns);
        },

        /**
         * Builds viewModel to be consumed by wrapper, header, footer
         * Row viewModel is left up to the row, but should include a reference to
         * this viewModel.columns property in order to synchronize with hide/show columns.
         * TODO : Review this for a bug with column order
         * @private
         */
        _buildViewModel: function() {
            this._buildColumns();
            var viewModel = kb.viewModel(this, {
                keys: ['limit', '_columns', 'title', 'description',
                    'pageSize', 'sortEnabled', 'selectMultiple', 'selectable',
                    'rowActions', '_fetching', 'emptyListCaption', '_filteredCount', '_initializing'
                ]
            });
            viewModel.glyphicon = ko.observable('glyphicon ' + this.get('glyphicon'));
            this.set('viewModel', viewModel);
        },

        /**
         * Initialize the main view, apply viewModels
         * @private
         */
        _buildLayout: function() {
            var Header, HeaderView, Wrapper, WrapperView, Row, RowView;
            var _this = this;

            Header = this.get("header");
            HeaderView = Header.extend({
                grid: this
            });

            Wrapper = this.get('wrapper');
            WrapperView = Wrapper.extend({
                grid: this, /// I think this might be the problem, like controller actions originall, having this as a property may be altering the prototype which can blow things up.  lets try updating this to use the model approach instead (now that zone is being)
                afterRender: this._afterRender,
                cleanup: function() {
                    this._cleanup();
                    _this.dispose(true);
                }
            });

            Row = this.get('row');
            RowView = Row.extend({
                grid: this
            });
            this.set('row', RowView);

            var buildLayout = {
                layout: new WrapperView(),
                header: new HeaderView(),
                row: RowView,
                paging: new PaginationView({
                    model: this
                })
            };

            var Footer = this.get("footer");
            if (Footer) {
                var FooterView = Footer.extend({
                    grid: this
                });
                buildLayout.footer = new FooterView();
            };

            var Zone1 = this.get('zone1');
            if (Zone1) {
                var Zone1View = Zone1.extend({
                    grid: this
                });
                buildLayout.zone1 = new Zone1View();
            };

            this.set(buildLayout, {
                silent: true
            });
        },

        /**
         * Overwrites this.get('layout').afterRender function
         * @private
         */
        _afterRender: function() {

            //this.updateViewModels();
            var layout = this.get('layout');
            layout.renderBindings();

            layout.setView('.header', this.get('header'));
            layout.setView('.paging', this.get('paging'));
            if (this.get('zone1')) layout.setView('.zone1', this.get('zone1'));
            if (this.get('footer')) layout.setView('.footer', this.get('zone1'));

            layout.renderViews();

            // Loading spinner
            var spinner = new Spinner().spin();
            layout.$el.find('.js-spinner').append(spinner.el);

            // Apply collection view after render in order to 
            // properly discover collection target and reset
            // associated dom element (if module view is recycled)
            // TODO need to setup a cleanup listener to cleanup colleciton view when grid removed
            var cview = this.get("collectionView");
            var _this = this;
            if (!cview) {
                var Cview = CollectionView.extend({
                    _offset: this.get('_offset'),
                    _pageSize: this.get('pageSize')
                });
                cview = new Cview({
                    el: $(".grid_view", layout.$el),
                    modelView: this.get('row'),
                    collection: this.get('queryEngine'),
                    selectable: this.get('selectable'),
                    selectMultiple: this.get('selectMultiple'),
                    sortable: this.get('sortable'),
                    processKeyEvents: this.get('processKeyEvents')
                });
                this.set('collectionView', cview);
            } else {
                cview.setElement($(".grid_view", layout.$el));
            }
            cview.render();
        },

        /**
         * Helper function for loading breeze data.  If no breeze entityAspect discovered, will return false
         * @private
         * @returns {Object} Entity information about the model including 'entityManager', 'shortName', and 'entityType'
         */
        _getEntityInfo: function(model) {
            if (model.entityAspect) {
                var entityInfo = {};
                entityInfo.entityManager = model.entityAspect.entityManager;
                entityInfo.shortName = model.entityAspect.entityGroup.entityType.shortName;
                entityInfo.entityType = entityInfo.entityManager.metadataStore.getEntityType(entityInfo.shortName);
                return entityInfo;
            }
            return false;
        },

        /**
         * Helper function retrieves viewModel property data for rows within the collection view.
         * Sets this.get('viewModelProperties') with the updated values
         */
        _readViewModelProperties: function() {
            var Row = this.get('row');
            var props = [];
            var config = this.get('columns');

            if (config.enabled) {

                for (var i = 0; i < config.active.length; i++) {
                    props.push({
                        prop: config.active[i],
                        name: (config.rename && config.rename[config.active[i]]) ? config.rename[config.active[i]] : config.active[i].replace(/([a-z])([A-Z])/g, '$1 $2')
                    });
                }
                for (var i = 0; i < config.enabled.length; i++) {
                    props.push({
                        prop: config.enabled[i],
                        name: (config.rename && config.rename[config.enabled[i]]) ? config.rename[config.enabled[i]] : config.enabled[i].replace(/([a-z])([A-Z])/g, '$1 $2')
                    });
                }
            } else {
                var model = this.get('collection').models[0];
                if (model) {
                    var row = new Row({
                        model: model
                    });

                    var exclude = ['__kb', 'model', 'selected', 'columns', 'destroy', '_createObservables', '_mapObservables', 'setToDefault', 'shareOptions'];

                    $.each(row.viewModel, function(key, value) {
                        if ($.inArray(key, exclude) < 0) props.push({
                            prop: key,
                            name: (config.rename && config.rename[key]) ? config.rename[key] : key.replace(/([a-z])([A-Z])/g, '$1 $2')
                        });
                    });

                    row.dispose();
                }
            }
            this.get('viewModelProperties').reset(props);
        },


        /**
         * If the grid is using breeze data, this function will listen once or be applied if there is already a model in the collection
         * Retreives entity type info.
         * @private
         * @param {Object} [args] - Arguments for the function
         * @param {Boolean} [args.silent] - Suppress the call to updateViewModels
         */
        _loadEntityData: function(args) {
            var collection = this.get('collection');

            if (collection.length > 0 && !this.get('_entityDataLoaded')) {
                collection.off("add reset", this._loadEntityData);
                var schema = this._getEntityInfo(collection.models[0]);
                if (!schema) {
                    // Not a breeze entity, look at attributes directly
                    schema = {
                        entityType: {
                            dataProperties: []
                        }
                    };
                    $.each(collection.models[0].attributes, function(key, value) {
                        schema.entityType.dataProperties.push({
                            name: key,
                            validators: [],
                            dataType: {
                                name: typeof value
                            }
                        });
                    });
                }
                this.get('_dataProperties').reset(schema.entityType.dataProperties);
                this.set({
                    entityInfo: schema
                }, {
                    silent: true
                });
                if (!args || args && !args.silent) this._buildColumns();
                this.set('_entityDataLoaded', true);
                if (!this.get('columns').enabled) this._readViewModelProperties();
                /**
                 * hasData is triggered when at least 1 model is in the collection, and entityInfo is loaded.
                 * This is a local trigger.
                 * @event Grid#hasData
                 */

                this.trigger('hasData');
            }
        },

        /**
         * Handle sorting for query engine.  Will communicate with breeze if using a 'resource'
         * @private
         */
        _sortHandler: function() {
            var engine = this.get('collection');
            this._enableSort();
            this.set('_fetchedPages', []);
            this.setPage(0);
        },

        /**
         * Primary comparator function for collection sorting
         * References entity data type to apply applicable sort method
         * for a given column.
         * @private
         */
        _sortEngine: function(modelA, modelB) {
            var sortby, modela, modelb, prop, compa, compb, result;

            // are passed in models objects or backbone models?
            modela = (typeof modelA.get === 'function') ? modelA.attributes : modelA;
            modelb = (typeof modelB.get === 'function') ? modelB.attributes : modelB;

            // Get sorting options
            sortby = this.get('sortBy');
            prop = (typeof sortby.prop == 'undefined') ? _.keys(modela)[0] : sortby.prop;

            // Is sortby using alternate/multiple column names? If so, grab the first available that matches on the models
            // colname-colname set in sortby allows user to sort on alternative collumns if one column gives a falsy value
            var _t = prop.split('-');
            compa = compb = ''; // setup a default blank value to compare on
            if (_t.length > 1) {
                for (var i = 0; i < _t.length; i++) {
                    if ((modela[_t[i]] !== null) && (modela[_t[i]].trim() !== '')) {
                        compa = modela[_t[i]];
                        break;
                    }
                }
                for (var b = 0; b < _t.length; b++) {
                    if ((modelb[_t[b]] !== null) && (modelb[_t[b]].trim() !== '')) {
                        compb = modelb[_t[b]];
                        break;
                    }
                }
            } else {
                compa = modela[prop];
                compb = modelb[prop];
            }

            // Test if we are hitting custom viewModel properties
            if (typeof compa === "undefined" && modelA.viewModel) compa = modelA.viewModel[prop]();
            if (typeof compb === "undefined" && modelB.viewModel) compb = modelB.viewModel[prop]();

            if (typeof compa === "undefined" || typeof compb === "undefined") return 0;

            // Actual sort functions dependant as set by sortby.sortType
            switch (sortby.type) {
                case 'date':
                    compa = new Date(compa);
                    compb = new Date(compb);
                    if (compa < compb) {
                        result = -1;
                    } else if (compa > compb) {
                        result = 1;
                    } else if (compa == compb) {
                        result = 0;
                    }
                    break;
                default:
                    if (sortby.type == 'String') {
                        compa = (typeof compa != 'undefined') ? compa.toLowerCase() : 0;
                        compb = (typeof compb != 'undefined') ? compb.toLowerCase() : 0;
                    }
                    if (compa < compb) {
                        result = -1;
                    } else if (compa > compb) {
                        result = 1;
                    } else if (compa == compb) {
                        result = 0;
                    }

                    break;
            }
            return (sortby.dir == 'asc') ? result : 0 - result;
        },

        /**
         * Main filter function, applies search string from arguments to query engine
         * and creates a breeze predicate to update the collection if applicable.
         * @param {String} filterName - The name of the filter (use property names)
         * @param {Predicate} predicate - the breeze predicate to apply
         * @param {String} displayValue - the value that may display in the header filter hover
         */
        filter: function(filterName, predicate, displayValue) {
            if (filterName && predicate) {
                var _filters = $.extend(true, {}, this.get('_filters'));
                _filters[filterName] = predicate;
                this.set({
                    _filters: _filters
                });
                try {
                    this.get('_columns').findWhere({
                        prop: filterName
                    }).set({
                        value: (displayValue) ? displayValue : this._getPredicateString(predicate),
                        filtered: true
                    });
                } catch (err) {
                    // A column does not exist for this filterName?
                }
            }

            this._applyFilter()
        },

        _getPredicateString: function(predicate) {
            var string = '';
            if (predicate._value) return predicate._value;
            else if (predicate._predicates) {
                for (var i = 0, ii = predicate._predicates.length; i < ii; i++) {
                    if (i > 0) string += ', ';
                    string += predicate._predicates[i]._value
                }
            }
            return string
        },

        /** 
         * Helper method for filter and removeFilter functions
         * @private
         */
        _applyFilter: function() {
            this.get('queryEngine').refilter();
            this.set('_filteredCount', this.get('queryEngine').getFilteredLength());

            this.set('_fetchedPages', []);
            this.setPage(0);
        },

        _parseFilters: function(_filters) {
            var ret = {
                _predicates: [],
                functions: []
            };

            $.each(_filters, function(k, value) {
                if (_.isFunction(value)) ret.functions.push(value);
                else ret._predicates.push(value);
            });

            ret.predicates = app.api.Predicate.and(ret._predicates)

            return ret;
        },

        /**
         * Takes the passed in key/value pair of filterNames/predicates and creates a combined predicate
         * @params {Object} _filter - key/value where key is filterName and value is a predicate
         * @returns {Predicate} a combined predicate
         */
        _assemblePredicate: function(_filters) {
            var predicates = [];
            $.each(_filters, function(k, value) {
                predicates.push(value);
            });
            return app.api.Predicate.and(predicates);
        },

        /**
         * Removes a filter that has been applied to the grid
         * @param {String} filterName - name (usually property) of filter to remove
         */
        removeFilter: function(filterName) {
            var _filters = $.extend({}, true, this.get('_filters'));
            delete _filters[filterName];
            this.set({
                _filters: _filters
                //_filterPredicate: this._assemblePredicate(_filter)
            });

            try {
                this.get('_columns').findWhere({
                    prop: filterName
                }).set({
                    value: null,
                    filtered: false
                });
            } catch (err) {
                // A column does not exist for this filterName?
            }

            this._applyFilter();
        },

        /**
         * Applies grid predicate (if applicable) as (a) filter(s) for the collection
         * @private
         */
        _predicateFilter: function(model, searchString) {
            var predicate = this.get('predicate');
            if (predicate) return app.api.validatePredicate(model, predicate);
            else return true;
        },



        /**
         * Internal filter function passed to query engine
         * TODO - need to fix the column widths to avoid the bouncing as searches go through
         * @private
         */
        _filter: function(model, searchString) {
            var filters = this._parseFilters(this.get('_filters'));

            if (filters.functions) {
                for (var i = 0, ii = filters.functions.length; i < ii; i++) {
                    if (filters.functions[i](model, searchString) === false) return false;
                }
            }

            if (filters.predicates) return app.api.validatePredicate(model, filters.predicates);
            else return true;
        }

    });

    return GridModule;

});