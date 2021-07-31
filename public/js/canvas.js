$.getJSON("data/helios.json", function(stars) {
    $.each(stars, function(id, bodies) {
        $.each(bodies, function(id, params) {
            if (!params.name.includes("Moon")) {
                console.log(params.name);
                var x = (params.center.x + 150000000) / 300000;
                var y = (params.center.y + 120000000) / 300000;
                console.log(x, y);
                var myCircle = new Path.Circle(new Point(x, y), 10);
                myCircle.fillColor = 'black';

                var text = new PointText(new Point(x, y - 15));
                text.justification = 'center';
                text.fillColor = 'black';
                text.content = params.name;
            }
        });
    });
});