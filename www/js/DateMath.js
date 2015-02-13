
DateMath = {
    /**
     * @param date {Date} A date object
     * @return {{year: Number, month: Number, quarter: number}}
     */
    getMonthAndYear: function(date) {
        var m = date.getMonth() + 1;
        var q = 0;
        if(m <= 3) {
            q = 1;
        } else if(m <= 6) {
            q = 2;
        } else if(m <= 9) {
            q = 3;
        } else {
            q = 4;
        }

        return {
            "year": date.getFullYear(),
            "month": m,
            "quarter": q
        };
    },

    dateObjFromString: function(dateString) {
        assert(typeof dateString === "string", "dateObjFromString() argument was not a string");
        var arrayVersion = dateString.split("-");

        var m = parseInt(arrayVersion[1]);
        var y = parseInt(arrayVersion[0]);
        return new Date(y, m - 1);
    },

    /**
     * @param date {Date} A date object
     * @return {string} A string like: "February 2014"
     */
    makeHumanReadable: function(date) {
        if(!date) { return ""; }
        var monthAndYr = DateMath.getMonthAndYear(date);
        return DateMath.monthNumberToString(monthAndYr.month) + " " + monthAndYr.year;
    },

    /**
     * @param beerObj {Beer} A beer object from the BeerService
     * @return {string} A date string formatted as: YYYY-MM
     */
    getDrinkDate: function(beerObj) {
        if(!beerObj) {
            console.error("Beer object is empty");
            return DateMath.thisMonth();
        }
        if(typeof beerObj.purchaseDate !== "object" || !beerObj.purchaseDate) {
            console.log("Beer object with name " + beerObj.name + " has no purchase date", beerObj);
            return DateMath.thisMonth();
        }

        if(typeof beerObj.drinkAfterYears !== "number") {
            console.log("Beer object has no drink-after years");
            return DateMath.thisMonth();
        }

        return DateMath.addYears(beerObj.purchaseDate, beerObj.drinkAfterYears);
    },

    /**
     * @param date {Date} A date string formatted as: YYYY-MM
     * @return {{year: Number, month: Number, quarter: number}}
     */
    getQuarter: function(date) {
        assert(date, "Object " + date + " was not a date object.");
        return DateMath.getMonthAndYear(date).quarter;
    },

    /**
     * @param date {Date} A date string formatted as: YYYY-MM
     * @param years {Number} the number of years to be added
     * @return {Date} A date object that many years in the future
     */
    addYears: function(date, years) {
        assert(!!date, "Object " + date + " was not a date string.");
        assert(typeof years === "number", "Years value " + years + " was not a number.");
        var monthAndYear = DateMath.getMonthAndYear(date);
        var dateObj = new Date(monthAndYear.year, monthAndYear.month - 1);
        dateObj.setMonth(dateObj.getMonth() + 12*years);
        return dateObj;
    },

    /**
     * @param date1 {Date}
     * @param date2 {Date}
     * @return {Number} Negative if date1 comes before date2; positive if date2 comes before date1; zero if they are equal.
     */
    compare: function(date1, date2) {
        var monthAndYears1 = DateMath.getMonthAndYear(date1);
        var monthAndYears2 = DateMath.getMonthAndYear(date2);

        if(monthAndYears1.year < monthAndYears2.year) {
            return -1;
        } else if(monthAndYears1.year > monthAndYears2.year) {
            return 1;
        } else { // Years are equal; compare months
            if(monthAndYears1.month < monthAndYears2.month) {
                return -1;
            } else if(monthAndYears1.month > monthAndYears2.month) {
                return 1;
            } else {
                return 0;
            }
        }
    },

    /**
     * @param date1 {string} A date string formatted as: YYYY-MM
     * @param date2 {string} A date string formatted as: YYYY-MM
     * @return {Number} Negative if date1's year comes before date2's year; positive if date2's year comes before date1's year; zero if they are in the same calendar year.
     */
    compareYear: function(date1, date2) {
        var monthAndYears1 = DateMath.getMonthAndYear(date1);
        var monthAndYears2 = DateMath.getMonthAndYear(date2);

        if(monthAndYears1.year < monthAndYears2.year) {
            return -1;
        } else if(monthAndYears1.year > monthAndYears2.year) {
            return 1;
        } else { // Years are equal; compare months
            return 0;
        }
    },
    /**
     * @param date1 A date string formatted as: YYYY-MM
     * @param date2 A date string formatted as: YYYY-MM
     * @return {number} Negative if date1's calendar quarter comes before date2's calendar quarter; positive if date2's calendar quarter comes before date1's calendar quarter; zero if they are in the same calendar quarter.
     */
    compareQuarter: function(date1, date2) {
        if(DateMath.compareYear(date1, date2) === 0) { // same year
            var monthAndYears1 = DateMath.getMonthAndYear(date1);
            var monthAndYears2 = DateMath.getMonthAndYear(date2);

            if(monthAndYears1.quarter < monthAndYears2.quarter) {
                return -1;
            } else if(monthAndYears1.quarter > monthAndYears2.quarter) {
                return 1;
            } else {
                return 0;
            }
        } else {
            return DateMath.compareYear(date1, date2);
        }
    },

    /**
     * @param {number} [yearsFromNow] The number of years in the future you want; defaults to 0
     * @return {string} A date string in YYYY-MM format, which is yearsFromNow in the future
     */
    yearsInTheFuture: function(yearsFromNow) {
        if(typeof yearsFromNow === "undefined")
            yearsFromNow = 0;

        var d = new Date();
        d.setMonth(d.getMonth() + 12*yearsFromNow);
        return d;
    },

    /**
     * @return {string} A date string in YYYY-MM format, which is yearsFromNow in the future
     */
    thisMonth: function() {
        return DateMath.yearsInTheFuture(0);
    },

    /**
     * @param monthNumberOneToTwelve {Number} A month number (1 == January, 2 == February, etc.)
     * @returns {string} The string version of that month
     */
    monthNumberToString: function(monthNumberOneToTwelve) {
        var monthString = "";
        switch(monthNumberOneToTwelve) {
            case 1:
                monthString = "January";
                break;
            case 2:
                monthString = "February";
                break;
            case 3:
                monthString = "March";
                break;
            case 4:
                monthString = "April";
                break;
            case 5:
                monthString = "May";
                break;
            case 6:
                monthString = "June";
                break;
            case 7:
                monthString = "July";
                break;
            case 8:
                monthString = "August";
                break;
            case 9:
                monthString = "September";
                break;
            case 10:
                monthString = "October";
                break;
            case 11:
                monthString = "November";
                break;
            case 12:
                monthString = "December";
                break;
            default:
                console.error("Unknown month number:", monthAndYear.month);
        }
        return monthString;
    }
};




