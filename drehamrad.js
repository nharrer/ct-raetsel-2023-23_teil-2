let words = [
    'ERBICAAY',
    'KOYVMRRR',
    'EOPTDIEP',
    'TMTEOTMK',
    'REGEODRD',
    'PXOBRAED',
    'BUOLSARR',
    'CEROIDEL',
]

var SEG_WIDTH = 40;
var SEG_OFFSET = 30;
var COLOR_BG = '#34495e';
var COLOR_HL = 'grey';   // highlight color
var COLOR_LINES = 'white';
var COLOR_TEXT = 'lightgray';

var segmentCount = words.length;
var segPositions = [];

// ------------------------ Remember wheel positions -------------------------

var clearSettings = () => {
    segPositions = Array(segmentCount).fill(0);
}

var storeSettings = () => {
    window.localStorage.setItem('segPositions', JSON.stringify(segPositions));
}

var loadSettings = () => {
    try {
        segPositions = JSON.parse(window.localStorage.getItem('segPositions'));
    } catch (e) {
        segPositions = null;
    }
    if (!segPositions || !segPositions.length || segPositions.length != segmentCount) {
        clearSettings();
        storeSettings();
    }
}

// --------------------------------- Drawing ---------------------------------

window.onload = () => {
    loadSettings();

    var two = new Two({
        autostart: true,
        fullscreen: true
    }).appendTo(document.body);

    document.body.style.backgroundColor = COLOR_BG;

    var groupMain = two.makeGroup();

    var background = two.makeRectangle(0, 0, 2 * two.width, 2 * two.height);
    background.fill = COLOR_BG;
    background.stroke = 'none';
    groupMain.add(background);

    var wheels = [];
    for (var w = words[0].length - 1; w >= 0; w--) {
        var groupWheel = two.makeGroup();
        wheels.unshift(groupWheel);

        var startx = SEG_OFFSET + w * SEG_WIDTH;
        var endx = startx + SEG_WIDTH;

        var circle = two.makeCircle(0, 0, endx);
        circle.fill = COLOR_BG;
        circle.stroke = COLOR_LINES;
        groupWheel.add(circle);

        groupWheel.c = circle;
        groupWheel.index = w;
        groupWheel.turn = segPositions[w];

        // Draw each segment. A segment consists of a
        // divider line and a letter
        for (var s = 0; s < segmentCount; s++) {
            var groupSegment = two.makeGroup();

            var line = two.makeLine(startx, 0, endx, 0);
            line.rotation = - Math.PI / segmentCount;
            line.stroke = COLOR_LINES;

            var text = two.makeText(words[s][w], startx + (endx - startx) / 2, 0);
            text.stroke = COLOR_LINES;

            var angle = s / segmentCount * 2 * Math.PI;

            groupSegment.add(line);
            groupSegment.add(text);
            groupSegment.rotation = -angle;
            groupWheel.add(groupSegment);
        }

        groupWheel.rotation = groupWheel.turn * 2 * Math.PI / segmentCount;

        groupMain.add(groupWheel);
    }

    var innerCircle1 = two.makeCircle(0, 0, SEG_OFFSET);
    innerCircle1.fill = COLOR_BG;
    innerCircle1.stroke = COLOR_LINES;
    groupMain.add(innerCircle1);
    var innerCircle2 = two.makeCircle(0, 0, SEG_OFFSET / 3);
    innerCircle2.fill = COLOR_LINES;
    innerCircle2.stroke = COLOR_LINES;
    groupMain.add(innerCircle2);

    // ------------------- Info Text & Reset Button -------------------

    var text1 = two.makeText('Linke Maustaste in Ring: Dreht Ring nach links', 5, 15);
    text1.alignment = 'left';
    text1.stroke = 'none';
    text1.fill = COLOR_TEXT;
    var text2 = two.makeText('', 5, 35, text1);
    text2.value = 'Rechte Maustaste in Ring: Dreht Ring nach rechts';
    var text2 = two.makeText('', 5, 55, text1);
    text2.value = 'Maustasten außerhalb der Ringe drehen das ganze Rad.';

    var groupReset = two.makeGroup();
    var resetBox = two.makeRoundedRectangle(0, 0, 100, 30);
    resetBox.fill = COLOR_BG;
    resetBox.stroke = COLOR_TEXT;
    var resetText = two.makeText('RESET', 0, 2);
    resetText.fill = COLOR_TEXT;
    groupReset.add(resetBox);
    groupReset.add(resetText);
    groupReset.opacity = 0;

    two.update();

    groupReset._renderer.elem.classList.add("button");;

    // ------------------------ Event Handling ------------------------

    wheels.forEach(w => {
        w._renderer.elem.addEventListener('mouseover', function () {
            w.c.fill = COLOR_HL;
            currentWheel = w;
        }, false);
        w._renderer.elem.addEventListener('mouseout', function () {
            w.c.fill = COLOR_BG;
            currentWheel = null;
        }, false);
        w._renderer.elem.addEventListener('click', function (ev) {
            segPositions[w.index] = segPositions[w.index] - 1;
            storeSettings();
        }, false);
        w._renderer.elem.addEventListener('contextmenu', function (ev) {
            segPositions[w.index] = segPositions[w.index] + 1;
            storeSettings();
            ev.preventDefault();
            return false;
        }, false);
    });

    background._renderer.elem.addEventListener('click', function (ev) {
        segPositions = segPositions.map(p => p - 1);
        storeSettings();
    }, false);
    background._renderer.elem.addEventListener('contextmenu', function (ev) {
        segPositions = segPositions.map(p => p + 1);
        storeSettings();

        ev.preventDefault();
        return false;
    }, false);

    groupReset._renderer.elem.addEventListener('click', function (ev) {
        wheels.forEach(w => {
            // move wheels to closest equivalent position
            w.turn = w.turn % segmentCount;
            w.turn = w.turn > (segmentCount / 2) ? w.turn - segmentCount : w.turn;
            w.turn = w.turn < (-segmentCount / 2) ? w.turn + segmentCount : w.turn;
        });
        clearSettings();
    }, false);

    two.bind('update', function (frameCount) {
        // slowley rotate wheels to desired position
        wheels.forEach(w => {
            var desiredTurn = segPositions[w.index];
            if (Math.abs(w.turn - desiredTurn) > 0.0001) {
                var dir = Math.sign(desiredTurn - w.turn);
                w.turn += dir * 0.04;
                w.rotation = w.turn * 2 * Math.PI / segmentCount;
            }
        });

        // move the whole group, so that the center of the screen is (0, 0)
        groupMain.translation.set(two.width / 2, two.height / 2);
        groupReset.translation.set(two.width - resetBox.width / 2 - 5, resetBox.height / 2 + 5);

        // fade reset button in, if positions have been changed
        var resetOpacity = segPositions.filter(p => p != 0).length > 0 ? 1 : 0;
        var dirOp = Math.sign(resetOpacity - groupReset.opacity);
        var newOp = groupReset.opacity + dirOp * 0.05;
        if (newOp >= 0 && newOp <= 1) {
            groupReset.opacity = newOp;
        }
    });
}
