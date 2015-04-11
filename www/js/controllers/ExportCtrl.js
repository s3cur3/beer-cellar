angular.module('BeerCellarApp.controllers.ExportCtrl', [])
    .controller('ExportCtrl', ['$scope', '$kinvey', '$state', 'UserService', function ($scope, $kinvey, $state, UserService) {
        $scope.exportCSV = function() {
            var tsv = "Beer Name\tBrewery\tVolume\tQuantity\tStyle\tPurchase Price\tPurchase Date\tDrink After (Years)\tDrink Before (Years)\tApp ID\n";
            for(var i = 0; i < $scope.beers.length; i++) {
                var beer = $scope.beers[i];
                var fields = [beer.name, beer.brewery, beer.volume, beer.quantity, beer.style, beer.purchasePrice, beer.purchaseDate, beer.drinkAfterYears, beer.drinkBeforeYears, beer._id];
                for(var j = 0; j < fields.length; j++) {
                    if(typeof fields[j] === "string")
                        fields[j] = fields[j].trim();
                }
                tsv += fields.join("\t") + "\n";
            }

            // Create the file from a data URI
            console.log("Creating download link");
            var pom = document.createElement('a');
            pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(tsv));
            pom.setAttribute('download', "beer-cellar.tsv");
            pom.click();
            $scope.success = true;
        };
    }]);
