/* global define, app, ChildViewContainer, document, $ */
define([
    'underscore',
    'backbone',
    'knockback',
    'knockout'
], function(_, Backbone, kb, ko) {
    "use strict";


    var mDefaultModelViewConstructor = Backbone.View;

    var kDefaultReferenceBy = "model";

    var kAllowedOptions = [
        "collection", "modelView", "modelViewOptions", "itemTemplate", "emptyListCaption",
        "selectable", "clickToSelect", "selectableModelsFilter", "visibleModelsFilter",
        "selectMultiple", "clickToToggle", "processKeyEvents", "sortable", "sortableOptions", "sortableModelsFilter", "itemTemplateFunction", "detachedRendering"
    ];

    var kOptionsRequiringRerendering = ["collection", "modelView", "modelViewOptions", "itemTemplate", "selectableModelsFilter", "sortableModelsFilter", "visibleModelsFilter", "itemTemplateFunction", "detachedRendering", "sortableOptions"];

    var kStylesForEmptyListCaption = {
        "background": "transparent",
        "border": "none",
        "box-shadow": "none"
    };

    var BasicView = Backbone.CollectionView.extend({

        events: {
            "mousedown li, tbody td": "_listItem_onMousedown",
            "dblclick li, tbody td": "_listItem_onDoubleClick",
            "click ul": "_listBackground_onClick",
            "click ul.collection-list": "_listBackground_onClick",
            "keydown": "_onKeydown"
        },

        render: function() {
            var _this = this;

            this._hasBeenRendered = true;

            if (this.selectable) this._saveSelection();

            if (!this.$el.data('view')) this.$el.data("view", this); // needed for connected sortable lists
            this.$el.addClass("collection-list");
            var modelViewContainerEl;

            // If collection view element is a table and it has a tbody
            // within it, render the model views inside of the tbody
            if (this._isRenderedAsTable()) {
                var tbodyChild = this.$el.find("> tbody:eq(0)");
                if (tbodyChild.length > 0)
                    modelViewContainerEl = tbodyChild;
            }

            if (_.isUndefined(modelViewContainerEl))
                modelViewContainerEl = this.$el;

            var oldViewManager = this.viewManager;
            this.viewManager = new ChildViewContainer();

            // detach each of our subviews that we have already created to represent models
            // in the collection. We are going to re-use the ones that represent models that
            // are still here, instead of creating new ones, so that we don't loose state
            // information in the views.
            oldViewManager.each(function(thisModelView) {
                // to boost performance, only detach those views that will be sticking around.
                // we won't need the other ones later, so no need to detach them individually.
                if (_this.collection.get(thisModelView.model.cid)) {
                    //thisModelView.$el.detach();

                    thisModelView.dispose();
                } else thisModelView.dispose();
            });

            modelViewContainerEl.empty();
            var fragmentContainer;

            if (this.detachedRendering)
                fragmentContainer = document.createDocumentFragment();

            var rendered = 0;
            for (var i = (this._offset) ? this._offset : 0; i < this.collection.models.length; i++) {
                //this.collection.each( function( thisModel ) {
                if (!this._pageSize || rendered < this._pageSize) {
                    var thisModel = this.collection.models[i];
                    var thisModelView;

                    thisModelView = oldViewManager.findByModelCid(thisModel.cid);
                    if (_.isUndefined(thisModelView)) {
                        // if the model view was not already created on previous render,
                        // then create and initialize it now.

                        var modelViewOptions = this._getModelViewOptions(thisModel);
                        thisModelView = this._createNewModelView(thisModel, modelViewOptions);

                        thisModelView.collectionListView = _this;
                    }

                    var thisModelViewWrapped = this._wrapModelView(thisModelView);
                    if (this.detachedRendering)
                        fragmentContainer.appendChild(thisModelViewWrapped[0]);
                    else
                        modelViewContainerEl.append(thisModelViewWrapped);

                    // we have to render the modelView after it has been put in context, as opposed to in the 
                    // initialize function of the modelView, because some rendering might be dependent on
                    // the modelView's context in the DOM tree. For example, if the modelView stretch()'s itself,
                    // it must be in full context in the DOM tree or else the stretch will not behave as intended.


                    // Custom code snippet to re-bind Knockout View Models that may have changed while view was inactive
                    var renderResult;
                    if (_.isFunction(thisModelView.updateViewModel)) {
                        renderResult = thisModelView.updateViewModel(true);
                    } else {
                        renderResult = thisModelView.render();
                    }

                    // return false from the view's render function to hide this item
                    if (renderResult === false) {
                        thisModelViewWrapped.hide();
                        thisModelViewWrapped.addClass("not-visible");
                    }

                    if (_.isFunction(this.visibleModelsFilter)) {
                        if (!this.visibleModelsFilter(thisModel)) {
                            if (thisModelViewWrapped.children().length === 1)
                                thisModelViewWrapped.hide();
                            else thisModelView.$el.hide();

                            thisModelViewWrapped.addClass("not-visible");
                        }
                    }

                    this.viewManager.add(thisModelView);
                    rendered++;
                }
                //}, this );
            }

            if (this.detachedRendering)
                modelViewContainerEl.append(fragmentContainer);

            if (this.sortable) {
                var sortableOptions = _.extend({
                    axis: "y",
                    distance: 10,
                    forcePlaceholderSize: true,
                    start: _.bind(this._sortStart, this),
                    change: _.bind(this._sortChange, this),
                    stop: _.bind(this._sortStop, this),
                    receive: _.bind(this._receive, this),
                    over: _.bind(this._over, this)
                }, _.result(this, "sortableOptions"));

                if (_this._isRenderedAsTable()) {
                    sortableOptions.items = "> tbody > tr:not(.not-sortable)";
                } else if (_this._isRenderedAsList()) {
                    sortableOptions.items = "> li:not(.not-sortable)";
                }

                this.$el = this.$el.sortable(sortableOptions);
            }

            if (this.emptyListCaption) {
                var visibleView = this.viewManager.find(function(view) {
                    return !view.$el.hasClass("not-visible");
                });

                if (_.isUndefined(visibleView)) {
                    var emptyListString;

                    if (_.isFunction(this.emptyListCaption))
                        emptyListString = this.emptyListCaption();
                    else
                        emptyListString = this.emptyListCaption;

                    var $emptyCaptionEl, $emptyListCaptionEl;
                    var $varEl = $("<var class='empty-list-caption'>" + emptyListString + "</var>");

                    //need to wrap the empty caption to make it fit the rendered list structure (either with an li or a tr td)
                    if (this._isRenderedAsList())
                        $emptyListCaptionEl = $varEl.wrapAll("<li class='not-sortable'></li>").parent().css(kStylesForEmptyListCaption);
                    else
                        $emptyListCaptionEl = $varEl.wrapAll("<tr class='not-sortable'><td colspan='100%'></td></tr>").parent().parent().css(kStylesForEmptyListCaption);

                    this.$el.append($emptyListCaptionEl);

                }
            }

            this.trigger("render");
            if (this._isBackboneCourierAvailable())
                this.spawn("render");

            if (this.selectable) {
                this._restoreSelection();
                this.updateDependentControls();
            }

            if (_.isFunction(this.onAfterRender))
                this.onAfterRender();
        }


    });

    return BasicView;
});