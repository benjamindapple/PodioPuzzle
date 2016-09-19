'use strict';

define(['jquery', 'react', 'reactdom'], function ($, React, ReactDOM) {

    // search timeout id
    var searchTimeout;
    // Main React object handle
    var searcherObject;
    // main container for space selector/searcher
    var container;

    function searchChanged(sender) {
        // perform search after .4 sec has elapsed between keystrokes
        window.clearTimeout(searchTimeout);
        searchTimeout = window.setTimeout(spaceSearch, 400, sender);
    };

    function spaceSearch(sender) {
        var term = $(sender).val();
        // ensure orgs has been populated
        if (searcherObject.state.orgs == undefined || searcherObject.state.orgs.dataerror) {
            return;
        }
        if (term == '') {
            // clear search results
            searcherObject.updateState(unMarkOrgs(searcherObject.state.orgs));
        } else {
            // search
            searcherObject.updateState(markOrgs(searcherObject.state.orgs, term));
        }
    };

    // resize scrollable container when window is resized
    function bindResize() {
        $(window).resize(function () {
            sizeScrollable();
        });
    }

    // resize scrollable container
    function sizeScrollable() {
        var scrollable = $(container).find('.scrollable');
        scrollable.css('max-height', '100%');
        if ($(container).is(':visible') && scrollable.length > 0) {
            scrollable.css('max-height', $(container).height() - $(container).find('.searchDiv').height() + 'px');
        }
    }

    // enable up/down arrow functionality inside the container
    function bindKeyboardNav() {
        $(container).keydown(function (e) {
            if ($(container).is(':visible')) {
                switch (e.which) {
                    case 13:
                        // enter
                        break;
                    case 38:
                        // up
                        if ($(e.target).is('a')) {
                            e.preventDefault();
                            var anchors = $(container).find('a');
                            var current = $(anchors).index($(e.target));
                            current == 0 ? $(container).find('input').focus() : anchors[current - 1].focus();
                        }
                        if ($(e.target).is('input')) {
                            e.preventDefault();
                            $(container).find('a').last().focus();
                        }
                        break;
                    case 40:
                        // down
                        if ($(e.target).is('a')) {
                            e.preventDefault();
                            var anchors = $(container).find('a');
                            var current = $(anchors).index($(e.target));
                            current == anchors.length - 1 ? $(container).find('input').focus() : anchors[current + 1].focus();
                        }
                        if ($(e.target).is('input')) {
                            e.preventDefault();
                            $(container).find('a').first().focus();
                        }
                        break;
                    default:
                        $(container).find('input').focus();
                        break;
                }
            }
        });
    }

    // load JSON spaces data over AJAX
    function loadSpaces(url, doneCallback) {
        // show loading panel goes here
        // in this sample the data is loaded at page load so loading panel is not necessary
        $.getJSON(url).done(function (orgs) {
            //orgList = ReactDOM.render(<OrganisationList initialOrgs={orgs} />, container);
            searcherObject = ReactDOM.render(React.createElement(SpaceSearcher, { initialOrgs: orgs }), container);
        }).fail(function () {
            // inform React object there is no data so it can handle displaying error message
            var orgs = [];
            orgs.dataerror = true;
            //orgList = ReactDOM.render(<OrganisationList initialOrgs={orgs} />, container);
            searcherObject = ReactDOM.render(React.createElement(SpaceSearcher, { initialOrgs: orgs }), container);
        }).always(function () {
            // hide loading panel goes here
            // alert callback if supplied
            if (doneCallback) {
                doneCallback();
            }
        });
    }

    function markOrgs(orgs, term) {
        var noResults = true;
        var updatedOrgs = orgs.map(function (org) {
            // unmark org if prev search performed
            org.name = unMarkTerm(org.name);
            // asssume org will be hidden
            var hideOrg = true;
            // Req 1-b ignore case
            var regex = new RegExp(escapeRegExp(term), 'ig');
            if (org.name.search(regex) > -1) {
                // mark org, org should not be hidden, results exist
                org.name = markTerm(org.name, term);
                hideOrg = false;
                noResults = false;
            }
            var updatedSpaces = org.spaces.map(function (space) {
                // unmark space
                space.name = unMarkTerm(space.name);
                // assume space will be hidden
                var hideSpace = true;
                if (space.name.search(regex) > -1) {
                    // mark term, space & org should not be hidden, results exist
                    space.name = markTerm(space.name, term);
                    hideSpace = false;
                    hideOrg = false;
                    noResults = false;
                }
                space.hide = hideSpace;
                return space;
            });
            org.isresults = true;
            org.hide = hideOrg;
            return org;
        });
        // set flags for React objects to query
        updatedOrgs.isresults = true;
        updatedOrgs.noresults = noResults;
        return updatedOrgs;
    }

    function unMarkOrgs(orgs) {
        // clear search results - umark all spaces and orgs
        var updatedOrgs = orgs.map(function (org) {
            org.name = unMarkTerm(org.name);
            org.hide = false;
            var updatedSpaces = org.spaces.map(function (space) {
                space.name = unMarkTerm(space.name);
                space.hide = false;
                return space;
            });
            org.isresults = false;
            return org;
        });
        updatedOrgs.isresults = false;
        return updatedOrgs;
    }

    function markTerm(input, term) {
        // Req 1-f highlighting
        return input.replace(new RegExp('(' + escapeRegExp(term) + ')', 'ig'), "<mark>$1</mark>");
    }

    function unMarkTerm(input) {
        return input.replace(new RegExp('</?mark>', 'ig'), "");
    }

    // stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
    function escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    // Begin React objects region
    var SearchBox = React.createClass({
        displayName: 'SearchBox',

        handleChange: function handleChange(attr) {
            searchChanged(attr.target);
        },
        render: function render() {
            return React.createElement(
                'form',
                { id: 'searchBoxForm' },
                React.createElement(
                    'div',
                    { className: 'searchDiv' },
                    React.createElement(
                        'label',
                        null,
                        React.createElement('i', { className: 'glyphicon glyphicon-search' }),
                        React.createElement('input', { type: 'text', onChange: this.handleChange, placeholder: 'Search' })
                    )
                )
            );
        }
    });

    //
    var InnerHtmlSpan = React.createClass({
        displayName: 'InnerHtmlSpan',

        render: function render() {
            // see notes regarding security of this
            // var innerHtml = { __html: new Remarkable().render(this.props.text) };
            var innerHtml = { __html: this.props.text };
            return React.createElement('span', { className: this.props.className, dangerouslySetInnerHTML: innerHtml });
        }

    });

    // space object
    var Space = React.createClass({
        displayName: 'Space',

        render: function render() {
            return React.createElement(
                'li',
                { className: this.props.className },
                React.createElement(
                    'a',
                    { href: this.props.url },
                    React.createElement(InnerHtmlSpan, { text: this.props.name })
                )
            );
        }
    });

    // org object - contains org name & spaces
    var Organisation = React.createClass({
        displayName: 'Organisation',

        // Orgs do not have a url
        handleClick: function handleClick(attr) {
            attr.defaultPrevented = true;
        },
        render: function render() {
            if (this.props.org.hide) {
                return null;
            }
            var list = this.props.org.spaces.map(function (space) {
                if (space.hide) {
                    return null;
                }
                return React.createElement(Space, { key: space.id, name: space.name, url: space.url, className: 'spaceli' });
            });
            if (!this.props.org.isresults) {
                list.push(React.createElement(Space, { key: this.props.org.id + 'new', name: '+ New Space', url: '#', className: 'spaceli newSpace' }));
            }

            return React.createElement(
                'li',
                null,
                React.createElement(
                    'div',
                    { className: 'orgContainer' },
                    React.createElement(
                        'div',
                        { className: 'thumbDiv' },
                        React.createElement('img', { className: 'img-thumbnail', src: this.props.org.image.thumbnail_link, alt: this.props.org.name })
                    ),
                    React.createElement(
                        'div',
                        { className: 'orgDiv' },
                        React.createElement(
                            'a',
                            { href: '#', onClick: this.handleClick },
                            React.createElement(InnerHtmlSpan, { text: this.props.org.name, className: 'orgName' })
                        ),
                        React.createElement(
                            'ul',
                            null,
                            list
                        )
                    )
                )
            );
        }
    });

    // org list container
    var OrganisationList = React.createClass({
        displayName: 'OrganisationList',

        render: function render() {
            var list = this.props.orgs.map(function (org) {
                return React.createElement(Organisation, { key: org.id, org: org });
            });
            return React.createElement(
                'ul',
                null,
                list
            );
        }
    });

    // main object
    var SpaceSearcher = React.createClass({
        displayName: 'SpaceSearcher',

        getInitialState: function getInitialState() {
            return { orgs: this.props.initialOrgs };
        },
        // public wrapper
        updateState: function updateState(orgs) {
            this.setState({ orgs: orgs });
        },

        componentDidMount: function componentDidMount() {
            sizeScrollable();
        },
        componentDidUpdate: function componentDidUpdate() {
            sizeScrollable();
            // Req 1-e highlight first item in search results
            if (this.state.orgs.isresults && !this.state.orgs.noresults) {
                $(container).find('a').first().focus();
            }
        },
        render: function render() {
            var content;
            // does addSpace button warrant its own React object?
            var addSpace = React.createElement(
                'div',
                { className: 'addSpace' },
                React.createElement(
                    'a',
                    { href: '#', className: 'button-new' },
                    React.createElement('i', { className: 'glyphicon glyphicon-plus-sign' }),
                    'Create a new space'
                )
            );
            // if orgs is somehow corrupted or JSON did not load - show error
            if (this.state.orgs == undefined || this.state.orgs.dataerror) {
                content = React.createElement(
                    'div',
                    { className: 'orgContainer' },
                    React.createElement(
                        'div',
                        { className: 'errorContainer' },
                        'An error occurred loading spaces, please try again later.'
                    ),
                    addSpace
                );
            } // if no results found - show no results message
            else if (this.state.orgs.isresults && this.state.orgs.noresults) {
                content = React.createElement(
                    'div',
                    { className: 'orgContainer' },
                    React.createElement(
                        'div',
                        { className: 'errorContainer' },
                        'No spaces found. You can create a new space if you want.'
                    ),
                    addSpace
                );
            } // else show everything or results
            else {
                content = React.createElement(OrganisationList, { orgs: this.state.orgs });
            }
            return React.createElement(
                'div',
                null,
                React.createElement(SearchBox, null),
                React.createElement(
                    'div',
                    { className: 'scrollable' },
                    content
                )
            );
        }
    });

    // End React objects region

    return {
        // initialize space selector/searcher
        // url : location of JSON data
        // spacesContainer : div container
        // doneCallback : optional callback once loaded
        init: function init(url, spacesContainer, doneCallback) {
            container = spacesContainer;
            if (!$(container).hasClass('hidden')) {
                $(container).addClass('hidden');
            }
            bindKeyboardNav();
            bindResize();
            loadSpaces(url, doneCallback);
        },
        // sender will be search input
        // container is set on init
        showSpaces: function showSpaces(sender) {
            if ($(sender).hasClass('navbar-open')) {
                $(container).addClass('hidden');
                $(sender).find('.glyphicon').removeClass('glyphicon-menu-up').addClass('glyphicon-menu-down');
                $(sender).removeClass('navbar-open');
                $(sender).blur();
            } else {
                $(sender).find('.glyphicon').removeClass('glyphicon-menu-down').addClass('glyphicon-menu-up');
                $(container).removeClass('hidden');
                sizeScrollable();
                $(sender).addClass('navbar-open');
                $(container).find('input').focus();
            }
        }
    };
});