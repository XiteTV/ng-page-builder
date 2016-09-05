/**
 * Created by jacek on 05.01.16.
 */

/**
 * @param angular
 */
(function( angular ) {

    var pageHierarchy;

    var flat = {};

    function buildTree( pref, container ) {

        var reg = new RegExp('^'+pref+':?([^:]+|\@)$');

        angular.forEach( flat, function( item, key ) {

            var matches = reg.exec( key );
            if ( matches ) {

                container.addMember( matches[1], item );
                buildTree( key, item );
            }
        });
    }

    function buildKey( sectionName, contentName, contentPartName ) {

        function d(v) {return v && angular.isString(v) ?':'+v:''}
        return sectionName+d(contentName)+d(contentPartName);
    }

    function ContentPageDefinition( config, objParent ) {

        var parent = null;
        var members = {};

        this.abstract = false;
        this.status = 200;
        this.title = null;
        this.contentLoader = null;
        this.columnSet = null;
        this.defaultClumnSet = null;
        this.filterSet = null;
        this.defaultFilterSet = null;
        this.editor = null;
        this.highlighter = null;
        this.aside = null;
        this.wildCardResolver = null;
        this.initialFilterValues = {};
        this.contextMenu = null;
        this.pageMenu = null;
        this.credentials = null;

        this.getMembers = function() {

            return members;
        };

        this.setParent = function ( contentPageDefinition ) {

            if (contentPageDefinition && contentPageDefinition instanceof ContentPageDefinition) {

                parent = contentPageDefinition;
            }
        };

        this.getParent  = function() {

            return parent;
        };

        this.addMember = function( memberName, objMember ) {

            objMember.setParent( this );
            members[ memberName ] = objMember;
        };

        this.hasMember = function( memberName ) {

            return (members[memberName] && members[memberName] instanceof ContentPageDefinition);
        };

        this.getMember = function( memberName ) {

            return members[ memberName ] || new ContentPageDefinition( { status: 404 } );
        };

        this.getContentLoader = function( ) {

            return this.contentLoader || ( parent instanceof ContentPageDefinition ? parent.getContentLoader() : null);
        };

        this.getTitle = function() {

            return this.title || ( parent instanceof ContentPageDefinition ? parent.getTitle() : null);
        };

        this.getColumnSet = function() {

            return this.columnSet || ( parent instanceof ContentPageDefinition ? parent.getColumnSet() : null);
        };

        this.getDefaultColumnSet = function() {

            return this.defaultClumnSet || ( parent instanceof ContentPageDefinition ? parent.getDefaultColumnSet() : null);
        };

        this.getFilterSet = function( ) {

            return this.filterSet || ( parent instanceof ContentPageDefinition ? parent.getFilterSet() : null );
        };

        this.getDefaultFilterSet = function() {

            return this.defaultFilterSet || ( parent instanceof ContentPageDefinition ? parent.getDefaultFilterSet() : null);
        };

        this.getInitialFilterValues = function() {

            return this.initialFilterValues || ( parent instanceof ContentPageDefinition ? parent.getInitialFilterValues() : null);
        }

        this.getEditor = function() {

            return this.editor || ( parent instanceof ContentPageDefinition ? parent.getEditor() : null);
        };

        this.getHighlighter = function() {

            return this.highlighter || ( parent instanceof ContentPageDefinition ? parent.getHighlighter() : angular.noop);
        };

        this.getAside = function( ) {

            return this.aside || ( parent instanceof ContentPageDefinition ? parent.getAside() : null);
        };

        this.getContextMenu = function( ) {
            return this.contextMenu || ( parent instanceof ContentPageDefinition ? parent.getContextMenu() : null);
        };

        this.getPageMenu = function ( ) {

            return this.pageMenu || ( parent instanceof  ContentPageDefinition ? parent.getPageMenu() : null);
        };

        this.getCredentials = function( ) {

            return this.credentials || ( parent instanceof ContentPageDefinition ? parent.getCredentials() : null );
        };

        function __constructor( config, objParent ) {

            if (objParent && objParent instanceof ContentPageDefinition) {

                parent = objParent;
                parent.addMember(this);
            }

            angular.extend(this, config);
        }

        __constructor.call( this, config, objParent );
    }

    function ContentPage( ) {

        this.findDefintion = function findDefinition( sectionName, contentName, contentPartName ) {

            var definition = null;

            var key = buildKey( sectionName, contentName, contentPartName );

            //find hard coded pages
            if (flat[key] && flat[key] instanceof ContentPageDefinition) {

                definition = flat[key];

            } else {

                var wildCard = key.replace(/^(.+):([^:])+$/,'$1:@');

                definition = flat[ wildCard ] || null;
            }

            return definition || { stats : 404 };
        };
    }

    angular
        .module('npb')
        .provider('contentPage', function ContentPageProvider() {

            pageHierarchy = new ContentPageDefinition();

            /**
             * @private
             * @param args
             */
            function checkArguments( args ) {

                var l, i, n;

                l = args.length;

                if ( 2 > l || 4 < l )
                {
                    throw new Error('ContentPageProvider Error. Wrong addPage method call. ' +
                        'Expected at least 2 but max 4 args!', 'content_page_provider_args_num_out_of_range');
                }
                if ( !angular.isObject(args[l-1]) )
                {
                    throw new Error('ContentPageProvider Error. Last argument must be a page definition object!',
                        'content_page_provider_last_arg');
                }

                for ( i = 0; i < l - 1; i++)
                {
                    if ( args.hasOwnProperty( i ) && !angular.isString( args[ i ] ) )
                    {
                        n = (i+1).toString();
                        throw new Error('ContentPageProvider Error. Wrong addPage method call. '+n+' argument' +
                            ' must be a string', 'content_page_provider_page_identification');
                    }
                }
            }

            /**
             *
             * @param contentPageDefinitionConfig
             */
            this.setBaseConfig = function setBaseConfig( contentPageDefinitionConfig ) {

                pageHierarchy  = new ContentPageDefinition( contentPageDefinitionConfig );
            };

            /**
             *
             * @param string 1st sectionName required
             * @param string 2nd optional [contentName]
             * @param string 3rd optional [contentPartName]
             * @param object last config required
             */
            this.addPage = function addPage( sectionName, contentName, contentPartName, config ) {

                checkArguments( arguments );

                //function d(v) {return v && angular.isString(v) ?':'+v:''}
                //var key = sectionName+d(contentName)+d(contentPartName);

                var key = buildKey(sectionName,contentName,contentPartName);

                function a(l) { return l[l.length - 1]; }
                var conf =a(arguments);

                flat[key] = new ContentPageDefinition(conf, null);

                return this;
            };

            this.$get = function ContentPageFactory() {

                buildTree( '', pageHierarchy );

                return new ContentPage();
            };
        });

})( angular );