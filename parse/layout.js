function getStyle(element) {
    if (!element.style) {
        element.style = {};
    }

    for (let prop in element.computedStyle) {
        // console.log(prop);
        var p = element.computedStyle.value;
        element.style[prop] = element.computedStyle[prop].value;

        if (element.style[prop].toString().match(/px$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }

        if (element.style[prop].toString().match(/^[0-9\.]+$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }
    }

    return element.style;
}

function layout(element) {
    if (!element.computedStyle) {
        return;
    }

    var elementStyle = getStyle(element);

    if (elementStyle.display !== "flex") {
        return;
    }

    var items = element.children.filter((e) => e.type === "element");

    items.sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
    });

    var style = elementStyle;

    ["width", "height"].forEach((size) => {
        if (style[size] === "auto" || style[size] === "") {
            style[size] = null;
        }
    });

    if (!style.flexDirection || style.flexDirection === "auto") {
        style.flexDirection = "row";
    }

    if (!style.alignItems || style.alignItems === "auto") {
        style.alignItems = "stretch";
    }

    if (!style.justifyContent || style.justifyContent === "auto") {
        style.justifyContent = "flex-start";
    }

    if (!style.flexWrap || style.flexWrap === "auto") {
        style.flexWrap = "nowrap";
    }

    if (!style.alignContent || style.alignContent === "auto") {
        style.alignContent = "stretch";
    }

    var mainSize,
        mainStart,
        mainEnd,
        mainSign,
        mainBase,
        crossSize,
        crossStart,
        crossEnd,
        crossSign,
        crossBase;

    if (style.flexDirection === "row") {
        mainSize = "width";
        mainStart = "left";
        mainEnd = "right";
        mainSign = +1;
        mainBase = 0;

        crossSize = "height";
        crossStart = "top";
        crossEnd = "bottom";
    }

    if (style.flexDirection === "row-reverse") {
        mainSize = "width";
        mainStart = "right";
        mainEnd = "left";
        mainSign = -1;
        mainBase = style.width;

        crossSize = "height";
        crossStart = "top";
        crossEnd = "bottom";
    }

    if (style.flexDirection === "column") {
        mainSize = "height";
        mainStart = "top";
        mainEnd = "bottom";
        mainSign = +1;
        mainBase = 0;

        crossSize = "width";
        crossStart = "left";
        crossEnd = "right";
    }

    if (style.flexDirection === "column-reverse") {
        mainSize = "height";
        mainStart = "bottom";
        mainEnd = "top";
        mainSign = -1;
        mainBase = style.height;

        crossSize = "width";
        crossStart = "left";
        crossEnd = "right";
    }

    if (style.flexWrap === "wrap-reverse") {
        var tmp = crossStart;
        crossStart = crossEnd;
        crossEnd = tmp;
        crossSign = -1;
    } else {
        crossBase = 0;
        crossSign = 1;
    }

    var isAutoMainSize = false;

    // auto sizing
    if (!style[mainSize]) {
        elmentStyle[mainSize] = 0;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (
                itemStyle[mainSize] !== null ||
                itemStyle[mainSize] !== void 0
            ) {
                elementStyle[mainSize] =
                    elementStyle[mainSize] + itemStyle[mainSize];
            }
        }

        isAutoMainSize = true;
    }

    var flexLine = [];
    var flexLines = [flexLine];

    var mainSpace = elementStyle[mainSize];
    var crossSpace = 0;

    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var itemStyle = getStyle(item);

        if (itemStyle[mainSize] === null) {
            itemStyle[mainSize] = 0;
        }

        if (itemStyle.flex) {
            flexLine.push(item);
        } else if (style.flexWrap === "nowrap" && isAutoMainSize) {
            mainSpace -= itemStyle[mainSize];
            if (
                itemStyle[crossSize] !== null &&
                itemStyle[crossSize] !== void 0
            ) {
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
            flexLine.push(item);
        } else {
            if (itemStyle[mainSize] > style[mainSize]) {
                itemStyle[mainSize] = style[mainSize];
            }

            if (mainSpace < itemStyle[mainSize]) {
                flexLine.mainSpace = mainSpace;
                flexLine.crossSpace = crossSpace;
                flexLine = [item];
                flexLines.push(flexLine);
                mainSpace = style[mainSize];
                crossSpace = 0;
            } else {
                flexLine.push(item);
            }

            if (
                itemStyle[crossSize] !== null &&
                itemStyle[crossSize] !== void 0
            ) {
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }

            mainSpace -= itemStyle[mainSize];
        }
    }

    flexLine.mainSpace = mainSpace;

    // console.log(items);

    if (style.flexWrap === "nowrap" || isAutoMainSize) {
        flexLine.crossSpace =
            style[crossSize] !== void 0 ? style[crossSize] : crossSpace;
    } else {
        flexLine.crossSpace = crossSpace;
    }

    if (mainSpace < 0) {
        // overflow (happens only if container is single line), scale every item
        var scale = style[mainSize] / (style[mainSize] - mainSpace);
        var currentMain = mainBase;
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var itemStyle = getStyle(item);

            if (itemStyle.flex) {
                itemStyle[mainSize] = 0;
            }

            itemStyle[mainSize] = itemStyle[mainSize] * scale;

            itemStyle[mainStart] = currentMain;
            itemStyle[mainEnd] =
                itemStyle[mainStart] + mainSign * itemStyle[mainSize];
            currentMain = itemStyle[mainEnd];
        }
    } else {
        // process each flex line
        flexLines.forEach(function (items) {
            var mainSpace = items.mainSpace;
            var flexTotal = 0;
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var itemStyle = getStyle(item);

                if (itemStyle.flex !== null && itemStyle.flex !== void 0) {
                    flexTotal += itemStyle.flex;
                    continue;
                }
            }

            if (flexTotal > 0) {
                // There is flexible flex items
                var currentMain = mainBase;
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var itemStyle = getStyle(item);

                    if (itemStyle.flex) {
                        itemStyle[mainSize] =
                            (mainSpace / flexTotal) * itemStyle.flex;
                    }

                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] =
                        itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd];
                }
            } else {
                // There is *NO* flexible flex items, which means, justifyContent shoud work
                if (style.justifyContent === "flex-start") {
                    var currentMain = mainBase;
                    var step = 0;
                }

                if (style.justifyContent === "flex-end") {
                    var currentMain = mainSpace * mainSign + mainBase;
                    var step = 0;
                }

                if (style.justifyContent === "center") {
                    var currentMain = (mainSpace / 2) * mainSign + mainBase;
                    var step = 0;
                }

                if (style.justifyContent === "space-between") {
                    var step = (mainSpace / (items.length - 1)) * mainSign;
                    var currentMain = mainBase;
                }

                if (style.justifyContent === "space-around") {
                    var step = (mainSpace / items.length) * mainSign;
                    var currentMain = step / 2 + mainBase;
                }

                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var itemStyle = getStyle(item);

                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] =
                        itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd] + step;
                }
            }
        });
    }
}

module.exports = layout;
