define(['jquery', 'podio', 'reactaddons'], function ($, Podio, React) {

    var assert = chai.assert;
    mocha.setup('bdd');

    // mimic button and container init (see app-init.js)
    

    // these should ideally be placed in a config of sorts
    var data = { url: 'https://gist.githubusercontent.com/RSpace/bba1b5067f79c6778cff/raw/e69df2b3900ee0a9a31a3e36ad93ec43d6299fc2/spaces.json', orgs: 2, spaces: 9 };
    //var data = 'http://www.benjamindapple.com/puzzle/spaces-long.json';
    var searchTerms = ['pod', 'POD', 'net', 'NeT', 'new', 'cop', 'nt ', '', '.', '\w']



    // literally adding searcher to test page - off screen
    var gotoSpaceBtn = document.createElement('a');
    var spacesContainer = document.createElement('div');
    spacesContainer.style.position = 'absolute';
    spacesContainer.style.left = '-4000px';
    spacesContainer.style.position = 'absolute';
    //gotoSpaceBtn.style.left = '-5000px';
    document.body.appendChild(gotoSpaceBtn);
    document.body.appendChild(spacesContainer);
    $(gotoSpaceBtn).click(function () {
        Podio.showSpaces(this);
    });
    
    // begin test definitions
    describe('Space searcher init', function () {
        var anchors = [];
        before(function (done) {
            Podio.init(data.url, spacesContainer, function () {
                anchors = $(spacesContainer).find('a');
                done();
            });
        });

        it('Space searcher is hidden', function () {
            assert.isTrue($(spacesContainer).hasClass('hidden'));
        });

        it('Space searcher has ' + data.orgs + ' orgs', function () {
            assert.equal($(spacesContainer).find('.orgName').length, data.orgs);
        });
        it('Space searcher has ' + data.spaces + ' total spaces', function () {
            assert.equal($(spacesContainer).find('.spaceli').not('.newSpace').length, data.spaces);
        });

        describe('Go to spaces - click', function () {
            before(function () {
                $(gotoSpaceBtn).click();
            });

            it('Space searcher is visible', function () {
                assert.isFalse($(spacesContainer).hasClass('hidden'));
            });

            it('Search box is focused', function () {
                assert.isTrue($(spacesContainer).find('.searchDiv input').is(':focus'));
            });
            keyboardNavTests();
            searchTerms.forEach(function (term) {
                searchTerm(term);
            });

        });

        describe('Go to spaces - click', function () {
            before(function () {
                $(gotoSpaceBtn).click();
            });

            it('Space searcher is hidden', function () {
                assert.isTrue($(spacesContainer).hasClass('hidden'));
            });
        });

    });


    function searchTerm(term) {
        if (term == undefined || term == '') {
            return;
        }
        describe('Searching for "' + term + '"', function () {
            // allow a bit more time
            this.timeout(5000);
            var results;
            var noResults;
            before(function (done) {
                $(spacesContainer).find('.searchDiv input').val(term);
                // I really need to learn how to use React TestUtils - this is ridiculous
                $(spacesContainer).find('.searchDiv input')[0].dispatchEvent(new Event("input", { "bubbles": true, "cancelable": false }));
                //// have to wait at least .4 seconds for search to trigger
                setTimeout(function(){
                    results = $(spacesContainer).find('a > span');
                    noResults = $(spacesContainer).find('.addSpace').length > 0;
                    done();
                }, 1000);
            });
            
            it('Displayed results contain "' + term + '"', function () {
                var error = false;
                if(!noResults){
                    var regex = new RegExp(term, 'ig');
                    results.each(function () {
                        if (this.innerText.search(regex) < 0) {
                            if (!$(this).hasClass('orgName')) {
                                error = true;
                            }
                        }
                    });
                }
                assert.isFalse(error);
            });

            it('Displayed results have "' + term + '" highlighted', function () {
                var error = false;
                if (!noResults) {
                    var regex = new RegExp('<mark>'+term+'</mark>', 'ig');
                    results.each(function () {
                        if (this.innerHTML.search(regex) < 0) {
                            if (!$(this).hasClass('orgName')) {
                                error = true;
                            }
                        }
                    });
                }
                assert.isFalse(error);
            });


            it('If there are search results, the first item is selected', function () {
                if (!noResults) {
                    assert.isTrue($(spacesContainer).find('a').first().is(':focus'));
                } else {
                    assert.isTrue(true);
                }
            });
            it('Move focus back to Search input', function () {
                $(spacesContainer).find('.searchDiv input').focus();
                assert.isTrue($(spacesContainer).find('.searchDiv input').is(':focus'));
            });
           
            keyboardNavTests();

        });
            
           
    }

    function keyboardNavTests() {
        describe('Keyboard Navigation', function () {
            it('Down arrow key focuses first item', function () {
                $(':focus').trigger({ type: 'keydown', which: 40, keyCode: 40 });
                assert.isTrue($(spacesContainer).find('a').first().is(':focus'));
            });
            it('Up arrow key moves focus back to Search input', function () {
                $(':focus').trigger({ type: 'keydown', which: 38, keyCode: 38 });
                assert.isTrue($(spacesContainer).find('.searchDiv input').is(':focus'));
            });
            it('Up arrow key focuses last item', function () {
                $(':focus').trigger({ type: 'keydown', which: 38, keyCode: 38 });
                assert.isTrue($(spacesContainer).find('a').last().is(':focus'));
            });
            it('Down arrow key moves focus back to Search input', function () {
                $(':focus').trigger({ type: 'keydown', which: 40, keyCode: 40 });
                assert.isTrue($(spacesContainer).find('.searchDiv input').is(':focus'));
            });
            it('Traversing down list round-robins to Search input', function () {

                $(':focus').trigger({ type: 'keydown', which: 40, keyCode: 40 });
                var count = 1;
                // to prevent infinite looping max count is limited to double orgs & spaces count - that should be more than enough iterations
                while (!$(spacesContainer).find('.searchDiv input').is(':focus') && count < ((data.orgs + data.spaces) * 2)) {
                    $(':focus').trigger({ type: 'keydown', which: 40, keyCode: 40 });
                    count++;
                }
                assert.isTrue($(spacesContainer).find('.searchDiv input').is(':focus'));
            });
            it('Traversing up list round-robins to Search input', function () {

                $(':focus').trigger({ type: 'keydown', which: 38, keyCode: 38 });
                var count = 1;
                // to prevent infinite looping max count is limited to double orgs & spaces count - that should be more than enough iterations
                while (!$(spacesContainer).find('.searchDiv input').is(':focus') && count < ((data.orgs + data.spaces) * 2)) {
                    $(':focus').trigger({ type: 'keydown', which: 38, keyCode: 38 });
                    count++;
                }
                assert.isTrue($(spacesContainer).find('.searchDiv input').is(':focus'));
            });

        });
    }

    mocha.run();
});