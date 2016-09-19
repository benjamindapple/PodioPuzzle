define(['jquery', 'podio', 'bootstrap', 'less'], function ($, Podio) {
    $(document).ready(function () {
        var spacesDataUrl = 'https://gist.githubusercontent.com/RSpace/bba1b5067f79c6778cff/raw/e69df2b3900ee0a9a31a3e36ad93ec43d6299fc2/spaces.json';
        //var spacesDataUrl = 'http://www.benjamindapple.com/puzzle/spaces-long.json';
        var container = document.getElementById('podioSpaces');
        var targetBtn = document.getElementById('gotoSpaceBtn');
        Podio.init(spacesDataUrl, container);
        $(targetBtn).click(function (e) {
            e.preventDefault();
            Podio.showSpaces(this);
        });
    });
});


