var Megavisor = {};

(function(MV){

    var one = 1;

    var two = 2;

    var arr = [];

    MV.push = function() {
        arr.push(one + two);
    };

    MV.pop  = function() {
        if (arr.length > 0) {
            arr.pop();
        }
    };

    MV.getLast = function() {
        if (arr.length > 0) {
            return arr[arr.length - 1];
        }
    };

})(Megavisor);